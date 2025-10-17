import { beforeAll, afterEach, afterAll } from "vitest";

const useUndici = process.env.USE_UNDICI_MOCKS === "1";

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
