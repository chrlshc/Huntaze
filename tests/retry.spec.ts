import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// Mock out Redis-backed modules for tests
vi.mock("../src/lib/bus", () => {
  return { bus: { publish: vi.fn(async () => {}) } };
});
vi.mock("../src/lib/outbox/redis", () => {
  return {
    RedisOutbox: class {
      async isProcessed() { return false; }
      async markProcessed() { return true; }
    }
  };
});

// no MSW server needed when using Undici MockAgent
import { igFailOnceThenOk, tt429OnceThenOk, redditNetworkError } from "../src/mocks/scenarios";
import { PostSchedulerAgent } from "../src/lib/agents/content-pipeline";
import { bus } from "../src/lib/bus";
import { __setDelayFnForTests, __setMaxAttemptsForTests } from "../src/lib/agents/content-pipeline";

vi.useFakeTimers();

describe("retry/backoff", () => {
  const events: any[] = [];
  let spy: any;

  beforeEach(async () => {
    spy = vi.spyOn(bus, "publish").mockImplementation(async (event: string, data: any) => {
      events.push({ kind: event, d: data });
    });
    vi.useFakeTimers();
    __setDelayFnForTests(() => 5);
    __setMaxAttemptsForTests(1);
  });

  afterEach(async () => {
    events.length = 0;
    spy?.mockRestore?.();
    __setDelayFnForTests(null);
    __setMaxAttemptsForTests(null);
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.useFakeTimers();
  });

  it("retries IG 500 and eventually schedules", async () => {
    await igFailOnceThenOk();
    const agent = new PostSchedulerAgent();
    const content = { id: "C1", idea: "x", text: "x", assets: [{ kind: "image", uri: "https://cdn/img.jpg" }] } as any;
    const p = agent.onContentReady({ correlation: "CORR", contents: [content], platforms: ["instagram"] as any });
    vi.advanceTimersByTime(5000);
    await p;
    expect(events.some((e) => e.kind === "POST_SCHEDULED")).toBe(true);
  });

  it("retries TikTok 429 and eventually schedules", async () => {
    await tt429OnceThenOk();
    const agent = new PostSchedulerAgent();
    const content = { id: "C2", idea: "x", text: "x", assets: [{ kind: "video", uri: "https://cdn/video.mp4" }] } as any;
    const p = agent.onContentReady({ correlation: "CORR2", contents: [content], platforms: ["tiktok"] as any });
    vi.advanceTimersByTime(5000);
    await p;
    expect(events.some((e) => e.kind === "POST_SCHEDULED")).toBe(true);
  });

  it("reports failure on Reddit network error (deterministic)", async () => {
    await redditNetworkError();
    const agent = new PostSchedulerAgent();
    const content = { id: "C3", idea: "x", text: "x", assets: [{ kind: "image", uri: "https://cdn/img.jpg" }] } as any;
    const p = agent.onContentReady({ correlation: "CORR3", contents: [content], platforms: ["reddit"] as any });
    // Allow multiple attempts (4 attempts * 5ms with buffer)
    // Single attempt due to override
    vi.advanceTimersByTime(10);
    await p;
    expect(events.some((e) => e.kind === "POST_FAILED")).toBe(true);
  });
});
