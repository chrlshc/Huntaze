import { describe, it, expect, beforeAll } from "vitest";
import { publishInstagram } from "../src/lib/integration/instagram";
import { publishTikTok } from "../src/lib/integration/tiktok";
import { publishRedditPost } from "../src/lib/integration/reddit";
import { installUndiciMockAgent, getMockAgent } from "../src/mocks/undici-agent";

beforeAll(async () => {
  await installUndiciMockAgent();
  // Add Reddit happy path intercept
  const rd = getMockAgent().get("https://oauth.reddit.com");
  rd.intercept({ method: "POST", path: "/api/submit" }).reply(200, { json: { data: { id: "t3_123456" } } }).persist();
});

describe("connectors", () => {
  it("instagram publishes", async () => {
    const r = await publishInstagram({
      igUserId: "1789",
      pageAccessToken: "x",
      caption: "hello",
      imageUrl: "https://cdn.example.com/img.jpg",
    });
    expect(r.externalId).toMatch(/^IGM_/);
  });

  it("tiktok init returns publish_id", async () => {
    const r = await publishTikTok({
      userAccessToken: "x",
      mode: "direct",
      title: "hello",
      videoUrl: "https://cdn.example.com/video.mp4",
    });
    expect(r.externalId).toMatch(/^TT_/);
  });

  it("reddit submit returns id", async () => {
    const r = await publishRedditPost({
      accessToken: "x",
      subreddit: "r/test",
      title: "hello",
      kind: "self",
      text: "body",
    });
    expect(r.externalId).toMatch(/^t3_/);
  });
});
