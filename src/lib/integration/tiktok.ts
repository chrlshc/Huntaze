import { getMode } from "../config/pipeline";
import { enqueueTikTokStatusPoll } from "../tiktok/queue";
import { externalFetch, externalFetchJson } from "@/lib/services/external/http";
import { ExternalServiceError } from "@/lib/services/external/errors";

export async function publishTikTok(opts: {
  userAccessToken: string; // OAuth2 TikTok – scope video.publish if Direct Post
  mode: "direct" | "upload"; // direct = publish; upload = to Inbox (draft)
  title: string; // caption
  privacy?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY";
  videoUrl?: string; // PULL_FROM_URL (verified domain)
  file?: Buffer; // FILE_UPLOAD
  chunkSize?: number;
}) {
  const pipelineMode = getMode("tiktok");
  const useDirect = pipelineMode === "live"; // else use Upload (draft/inbox)

  const initBody: any = {
    post_info: {
      title: opts.title,
      privacy_level: opts.privacy ?? "PUBLIC_TO_EVERYONE",
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
    },
    source_info: opts.videoUrl
      ? { source: "PULL_FROM_URL", video_url: opts.videoUrl }
      : {
          source: "FILE_UPLOAD",
          video_size: String(opts.file?.length ?? 0),
          chunk_size: String(opts.chunkSize ?? 8_388_608),
          total_chunk_count: String(
            Math.ceil((opts.file?.length ?? 0) / (opts.chunkSize ?? 8_388_608))
          ),
        },
  };

  const init: any = await externalFetchJson("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    service: "tiktok",
    operation: "post.publish.video.init",
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.userAccessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(initBody),
    cache: "no-store",
    timeoutMs: 20_000,
    retry: { maxRetries: 0, retryMethods: [] },
  });

  if (init?.error?.code) {
    throw new ExternalServiceError({
      service: "tiktok",
      code: init.error.code === "rate_limit_exceeded" ? "RATE_LIMIT" : "BAD_REQUEST",
      retryable: init.error.code === "rate_limit_exceeded",
      message: `TikTok API error (${init.error.code}): ${init.error.message || "Unknown error"}`,
      details: { error: init.error },
    });
  }

  const { publish_id, upload_url } = init.data || {};

  if (!opts.videoUrl && upload_url && opts.file) {
    await externalFetch(upload_url, {
      service: "tiktok",
      operation: "upload.put",
      method: "PUT",
      body: opts.file as any,
      cache: "no-store",
      timeoutMs: 30_000,
      retry: { maxRetries: 1, retryMethods: ["PUT"] },
      throwOnHttpError: true,
    });
  }

  // For shadow/dry_run, we keep draft/init; for live, you may switch to Direct Post endpoint when audited.
  if (pipelineMode === "dry_run") {
    return { externalId: "DRYRUN_TT", publishedAt: new Date().toISOString(), raw: { mode: pipelineMode } };
  }
  // Schedule polling worker for status (works for shadow/live alike)
  if (publish_id && opts.userAccessToken) {
    // start ~30s later to give time for processing to start
    try { await enqueueTikTokStatusPoll({ videoId: publish_id, userAccessToken: opts.userAccessToken, delaySec: 30 }); } catch {}
  }

  // In shadow, behave like draft/inbox (init result is enough to prove tokens/rights and upload reachability)
  return { externalId: publish_id, publishedAt: new Date().toISOString(), raw: { ...init, mode: pipelineMode, direct: useDirect } };
}
