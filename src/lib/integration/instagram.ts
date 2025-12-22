import { setTimeout as sleep } from "node:timers/promises";
import { getMode } from "../config/pipeline";
import { externalFetch } from "@/lib/services/external/http";
import { ExternalServiceError } from "@/lib/services/external/errors";

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

  const createResponse = await externalFetch(
    `https://graph.facebook.com/v21.0/${opts.igUserId}/media`,
    {
      service: "instagram",
      operation: "media.create",
      method: "POST",
      body: new URLSearchParams(params),
      cache: "no-store",
      timeoutMs: 20_000,
      retry: { maxRetries: 0, retryMethods: [] },
    }
  );
  const createRes: any = await createResponse.json().catch(() => ({}));
  if (!createResponse.ok || createRes?.error) {
    throw new ExternalServiceError({
      service: "instagram",
      code: createResponse.status === 429 ? "RATE_LIMIT" : createResponse.status >= 500 ? "UPSTREAM_5XX" : "BAD_REQUEST",
      retryable: createResponse.status === 429 || createResponse.status >= 500,
      status: createResponse.status,
      message: createRes?.error?.message || `IG create container failed (${createResponse.status})`,
      details: { error: createRes?.error },
    });
  }

  const creationId = createRes.id as string;
  if (!creationId) throw new Error(`IG create container failed: ${JSON.stringify(createRes)}`);

  for (let i = 0; i < 40; i++) {
    const statusResponse = await externalFetch(
      `https://graph.facebook.com/v21.0/${creationId}?fields=status_code,status&access_token=${opts.pageAccessToken}`,
      {
        service: "instagram",
        operation: "media.status",
        method: "GET",
        cache: "no-store",
        timeoutMs: 10_000,
        retry: { maxRetries: 1, retryMethods: ["GET"] },
      }
    );
    const status: any = await statusResponse.json().catch(() => ({}));
    if (!statusResponse.ok || status?.error) {
      throw new ExternalServiceError({
        service: "instagram",
        code: statusResponse.status === 429 ? "RATE_LIMIT" : statusResponse.status >= 500 ? "UPSTREAM_5XX" : "BAD_REQUEST",
        retryable: statusResponse.status === 429 || statusResponse.status >= 500,
        status: statusResponse.status,
        message: status?.error?.message || `IG status check failed (${statusResponse.status})`,
        details: { error: status?.error },
      });
    }
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

  const publishResponse = await externalFetch(
    `https://graph.facebook.com/v21.0/${opts.igUserId}/media_publish`,
    {
      service: "instagram",
      operation: "media.publish",
      method: "POST",
      body: new URLSearchParams({ access_token: opts.pageAccessToken, creation_id: creationId }),
      cache: "no-store",
      timeoutMs: 20_000,
      retry: { maxRetries: 0, retryMethods: [] },
    }
  );
  const publishRes: any = await publishResponse.json().catch(() => ({}));
  if (!publishResponse.ok || publishRes?.error) {
    throw new ExternalServiceError({
      service: "instagram",
      code: publishResponse.status === 429 ? "RATE_LIMIT" : publishResponse.status >= 500 ? "UPSTREAM_5XX" : "BAD_REQUEST",
      retryable: publishResponse.status === 429 || publishResponse.status >= 500,
      status: publishResponse.status,
      message: publishRes?.error?.message || `IG publish failed (${publishResponse.status})`,
      details: { error: publishRes?.error },
    });
  }

  return { externalId: publishRes.id, publishedAt: new Date().toISOString(), raw: publishRes };
}
