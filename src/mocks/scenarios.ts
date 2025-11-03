const useUndici = process.env.USE_UNDICI_MOCKS === "1";

export async function igFailOnceThenOk() {
  if (useUndici) {
    const Undici = await import("./undici-agent");
    try { Undici.getMockAgent(); } catch { await Undici.installUndiciMockAgent(); }
    const { ig500OnceThenOkUndici } = await import("./error-handlers-undici");
    ig500OnceThenOkUndici();
  } else {
    const { server } = await import("./node");
    const { ig500OnceThenOk } = await import("./error-handlers");
    server.use(...ig500OnceThenOk());
  }
}

export async function tt429OnceThenOk() {
  if (useUndici) {
    const Undici = await import("./undici-agent");
    try { Undici.getMockAgent(); } catch { await Undici.installUndiciMockAgent(); }
    const { tiktok429OnceThenOkUndici } = await import("./error-handlers-undici");
    tiktok429OnceThenOkUndici();
  } else {
    const { server } = await import("./node");
    const { tiktok429OnceThenOk } = await import("./error-handlers");
    server.use(...tiktok429OnceThenOk());
  }
}

export async function redditNetworkError() {
  if (useUndici) {
    const Undici = await import("./undici-agent");
    try { Undici.getMockAgent(); } catch { await Undici.installUndiciMockAgent(); }
    const { redditNetworkErrorUndici } = await import("./error-handlers-undici");
    redditNetworkErrorUndici();
  } else {
    const { server } = await import("./node");
    const { redditNetworkError } = await import("./error-handlers");
    server.use(...redditNetworkError);
  }
}
