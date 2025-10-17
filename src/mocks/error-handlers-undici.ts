import { getMockAgent } from "./undici-agent";

export function ig500OnceThenOkUndici() {
  const ig = getMockAgent().get("https://graph.facebook.com");
  ig
    .intercept({ method: "POST", path: /\/v\d+\.\d+\/[^/]+\/media$/ })
    .reply(500, { error: { message: "IG transient" } })
    .times(1);
  ig
    .intercept({ method: "POST", path: /\/v\d+\.\d+\/[^/]+\/media$/ })
    .reply(200, { id: "IGC_ok" })
    .persist();
}

export function tiktok429OnceThenOkUndici() {
  const tt = getMockAgent().get("https://open.tiktokapis.com");
  tt.intercept({ method: "POST", path: "/v2/post/publish/video/init/" }).reply(429, { message: "Too Many Requests" }).times(1);
  tt
    .intercept({ method: "POST", path: "/v2/post/publish/video/init/" })
    .reply(200, { data: { publish_id: "TT_ok", upload_url: "https://upload.tiktokapis.com/fake" } })
    .persist();
}

export function redditNetworkErrorUndici() {
  const rd = getMockAgent().get("https://oauth.reddit.com");
  rd.intercept({ method: "POST", path: "/api/submit" }).replyWithError(new Error("network error"));
}

