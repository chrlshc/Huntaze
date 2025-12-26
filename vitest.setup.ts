import { beforeAll, afterEach, afterAll } from "vitest";
import * as fc from "fast-check";

const useUndici = process.env.USE_UNDICI_MOCKS === "1";
const isCI = Boolean(process.env.CI);

const parseEnvNumber = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const seed = parseEnvNumber(process.env.FC_SEED) ?? (isCI ? 424242 : undefined);
const numRuns = parseEnvNumber(process.env.FC_NUM_RUNS) ?? (isCI ? 100 : undefined);
const fcConfig: { seed?: number; numRuns?: number } = {};

if (seed !== undefined) {
  fcConfig.seed = seed;
}

if (numRuns !== undefined) {
  fcConfig.numRuns = numRuns;
}

if (Object.keys(fcConfig).length > 0) {
  fc.configureGlobal(fcConfig);
}

console.info(`[fast-check] seed=${seed ?? "random"} numRuns=${numRuns ?? "default"}`);

// Polyfill performance.now for Node test environment
const ensurePerformanceNow = () => {
  if (typeof globalThis.performance === 'undefined' || typeof globalThis.performance.now !== 'function') {
    // @ts-expect-error - populate minimal performance object
    globalThis.performance = {
      now: () => Date.now(),
    };
  }
};
ensurePerformanceNow();

if (useUndici) {
  // Undici MockAgent harness (Node native fetch)
  let undiciMod: any;
  beforeAll(async () => {
    undiciMod = await import("./src/mocks/undici-agent");
    await undiciMod.installUndiciMockAgent();
  });
  afterEach(async () => {
    if (undiciMod?.resetUndiciMockAgent) {
      await undiciMod.resetUndiciMockAgent();
    }
  });
  afterAll(async () => {
    if (undiciMod?.closeUndiciMockAgent) {
      await undiciMod.closeUndiciMockAgent();
    }
  });
} else {
  // MSW Node server
  let server: any;
  beforeAll(async () => {
    const mod = await import("./src/mocks/node");
    server = mod.server;
    server.listen();
  });
  afterEach(() => server?.resetHandlers());
  afterAll(() => server?.close());
}
