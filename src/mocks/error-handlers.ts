import { http, HttpResponse } from "msw";

export function ig500OnceThenOk() {
  let hit = 0;
  return [
    http.post("https://graph.facebook.com/:version/:igUserId/media", async () => {
      hit++;
      if (hit === 1) {
        return new HttpResponse(JSON.stringify({ error: { message: "IG transient" } }), { status: 500 });
      }
      return HttpResponse.json({ id: "IGC_ok" });
    }),
    http.get("https://graph.facebook.com/:version/:creationId", async () =>
      HttpResponse.json({ status: "FINISHED", status_code: "FINISHED" })
    ),
    http.post("https://graph.facebook.com/:version/:igUserId/media_publish", async () =>
      HttpResponse.json({ id: "IGM_ok" })
    ),
  ];
}

export function tiktok429OnceThenOk() {
  let hit = 0;
  return [
    http.post("https://open.tiktokapis.com/v2/post/publish/video/init/", async () => {
      hit++;
      if (hit === 1) {
        return new HttpResponse(JSON.stringify({ message: "Too Many Requests" }), { status: 429 });
      }
      return HttpResponse.json({ data: { publish_id: "TT_ok", upload_url: "https://upload.tiktokapis.com/fake" } });
    }),
    http.put("https://upload.tiktokapis.com/fake", async () => new HttpResponse(null, { status: 200 })),
  ];
}

export const redditNetworkError = [
  http.post("https://oauth.reddit.com/api/submit", async () => Response.error()),
];

