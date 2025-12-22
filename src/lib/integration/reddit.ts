import { getMode, resolveRedditMode } from "../config/pipeline";
import { emitMetric } from "../../../lib/metrics";
import { externalFetch } from "@/lib/services/external/http";
import { ExternalServiceError } from "@/lib/services/external/errors";

export async function publishRedditPost(opts: {
  accessToken: string;
  subreddit: string;
  title: string;
  kind: "self" | "link";
  text?: string;
  url?: string;
  nsfw?: boolean;
  spoiler?: boolean;
  canaryKey?: string; // optional stable key for canary bucketing (e.g., tenant/user id)
}) {
  const mode = opts.canaryKey ? resolveRedditMode(opts.canaryKey) : getMode("reddit");
  const sr = mode === "shadow" ? (process.env.REDDIT_TEST_SUB ?? opts.subreddit) : opts.subreddit;
  if (mode === "dry_run") {
    return { externalId: "DRYRUN_REDDIT", publishedAt: new Date().toISOString(), raw: { mode, sr } };
  }

  const body = new URLSearchParams({
    sr,
    title: opts.title,
    kind: opts.kind,
    resubmit: "true",
    api_type: "json",
  });
  if (opts.kind === "self" && opts.text) body.set("text", opts.text);
  if (opts.kind === "link" && opts.url) body.set("url", opts.url);
  if (opts.nsfw) body.set("nsfw", "true");
  if (opts.spoiler) body.set("spoiler", "true");

  const startedAt = Date.now();
  const response = await externalFetch("https://oauth.reddit.com/api/submit", {
    service: "reddit",
    operation: "submit",
    method: "POST",
    headers: {
      Authorization: `bearer ${opts.accessToken}`,
      "User-Agent": "huntaze:content-pipeline:v1 (by /u/your-reddit-username)",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
    timeoutMs: 15_000,
    retry: { maxRetries: 0, retryMethods: [] },
  });

  const elapsed = Date.now() - startedAt;
  if (response.status === 429) {
    emitMetric("Hunt/Social", [{ name: "social_rate_limit_hits_total", unit: "Count", value: 1 }], { platform: "reddit" });
  }
  emitMetric("Hunt/Social", [{ name: "social_publish_time_ms", unit: "Milliseconds", value: elapsed }], { platform: "reddit" });

  const res: any = await response.json().catch(() => ({} as any));
  const errors = res?.json?.errors ?? [];
  if (!response.ok || (Array.isArray(errors) && errors.length > 0)) {
    const primary = Array.isArray(errors) && errors[0] ? String(errors[0][0] ?? "") : "";
    const message =
      Array.isArray(errors) && errors.length > 0
        ? errors.map((e: any[]) => e.join(": ")).join(", ")
        : `Reddit submit failed (${response.status})`;

    throw new ExternalServiceError({
      service: "reddit",
      code:
        primary === "RATELIMIT"
          ? "RATE_LIMIT"
          : primary === "SUBREDDIT_NOEXIST"
            ? "NOT_FOUND"
            : primary === "NO_LINKS" || primary === "NO_SELFS"
              ? "FORBIDDEN"
              : response.status >= 500
                ? "UPSTREAM_5XX"
                : "BAD_REQUEST",
      retryable: primary === "RATELIMIT" || response.status >= 500,
      status: response.status,
      message,
      details: { errors },
    });
  }

  const externalId = res?.json?.data?.id ?? res?.data?.id ?? "unknown";
  return { externalId, publishedAt: new Date().toISOString(), raw: { ...res, mode } };
}
