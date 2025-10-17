import { setTimeout as sleep } from "node:timers/promises";
import { getMode } from "../config/pipeline";

export async function publishInstagram(opts: {
  igUserId: string;
  pageAccessToken: string; // /me/accounts -> page token
  caption: string;
  videoUrl?: string;
  imageUrl?: string;
  shareToFeed?: boolean;
}) {
  const mode = getMode("instagram");

  const params: Record<string, string> = {
    access_token: opts.pageAccessToken,
    caption: opts.caption ?? "",
  };
  if (opts.videoUrl) {
    params.media_type = "REELS";
    params.video_url = opts.videoUrl;
    if (typeof opts.shareToFeed === "boolean") params.share_to_feed = String(opts.shareToFeed);
  } else if (opts.imageUrl) {
    params.image_url = opts.imageUrl;
  } else {
    throw new Error("IG: no asset provided");
  }

  const createRes = await fetch(
    `https://graph.facebook.com/v21.0/${opts.igUserId}/media`,
    { method: "POST", body: new URLSearchParams(params) }
  ).then((r) => r.json());

  const creationId = createRes.id as string;
  if (!creationId) throw new Error(`IG create container failed: ${JSON.stringify(createRes)}`);

  for (let i = 0; i < 40; i++) {
    const status = await fetch(
      `https://graph.facebook.com/v21.0/${creationId}?fields=status_code,status&access_token=${opts.pageAccessToken}`
    ).then((r) => r.json());
    if (status.status_code === "FINISHED") break;
    if (status.status_code === "ERROR") throw new Error(`IG container error: ${status.status}`);
    await sleep(2000);
  }

  // Feature flags
  if (mode === "dry_run") {
    return { externalId: "DRYRUN_IG", publishedAt: new Date().toISOString(), raw: { mode } };
  }
  if (mode === "shadow") {
    // Container OK, on s'arrête avant media_publish
    return { externalId: creationId, publishedAt: new Date().toISOString(), raw: { mode } };
  }

  const publishRes = await fetch(
    `https://graph.facebook.com/v21.0/${opts.igUserId}/media_publish`,
    { method: "POST", body: new URLSearchParams({ access_token: opts.pageAccessToken, creation_id: creationId }) }
  ).then((r) => r.json());

  return { externalId: publishRes.id, publishedAt: new Date().toISOString(), raw: publishRes };
}
