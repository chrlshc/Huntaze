import { getMode, resolveRedditMode } from "../config/pipeline";
import { emitMetric } from "../../../lib/metrics";

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
  const res = await fetch("https://oauth.reddit.com/api/submit", {
    method: "POST",
    headers: {
      Authorization: `bearer ${opts.accessToken}`,
      "User-Agent": "huntaze:content-pipeline:v1 (by /u/your-reddit-username)",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  }).then(async (r) => {
    const elapsed = Date.now() - startedAt;
    if (r.status === 429) {
      emitMetric("Hunt/Social", [{ name: "social_rate_limit_hits_total", unit: "Count", value: 1 }], { platform: "reddit" });
    }
    emitMetric("Hunt/Social", [{ name: "social_publish_time_ms", unit: "Milliseconds", value: elapsed }], { platform: "reddit" });
    const json = await r.json().catch(() => ({} as any));
    return json;
  });

  const externalId = res?.json?.data?.id ?? res?.data?.id ?? "unknown";
  return { externalId, publishedAt: new Date().toISOString(), raw: { ...res, mode } };
}
