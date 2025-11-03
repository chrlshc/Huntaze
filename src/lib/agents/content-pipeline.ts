import PQueue from "p-queue";
import { publishInstagram } from "../integration/instagram";
import { publishTikTok } from "../integration/tiktok";
import { publishRedditPost } from "../integration/reddit";
import type { Platform } from "../types/content";
import { getBus } from "../bus";
import { RedisOutbox } from "../outbox/redis";
let _outbox: RedisOutbox | null = null;
function getOutbox() {
  if (!_outbox) _outbox = new RedisOutbox();
  return _outbox;
}

// TEST-ONLY backoff override hook
type DelayFn = (attempt: number) => number;
let __delayFnOverride: DelayFn | null = null;
export function __setDelayFnForTests(fn: DelayFn | null) {
  __delayFnOverride = fn;
}

let __maxAttemptsOverride: number | null = null;
export function __setMaxAttemptsForTests(n: number | null) {
  __maxAttemptsOverride = n;
}

function isRetriable(err: any): boolean {
  const code = err?.status || err?.statusCode || err?.code;
  if (code === 429) return true;
  if (typeof code === "number" && code >= 500) return true;
  const msg = String(err?.message || "").toLowerCase();
  return msg.includes("network") || msg.includes("timeout") || msg.includes("fetch failed");
}

function delayForAttempt(attempt: number, baseMs = 1000, capMs = 15000) {
  if (__delayFnOverride) return __delayFnOverride(attempt);
  const exp = Math.min(capMs, baseMs * 2 ** attempt);
  return Math.floor(Math.random() * exp);
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 4) {
  if (__maxAttemptsOverride && __maxAttemptsOverride > 0) maxAttempts = __maxAttemptsOverride;
  let lastErr: any;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetriable(err) || i === maxAttempts - 1) break;
      await new Promise((r) => setTimeout(r, delayForAttempt(i)));
    }
  }
  throw lastErr;
}

export class PostSchedulerAgent {
  private queue = new PQueue({ concurrency: 3 });

  init() {
    // Intégrer selon ton bus d’amont (planner/generator). Exemple:
    // await bus.subscribe('CONTENT_READY', (evt) => this.onContentReady(evt));
  }

  async onContentReady({ correlation, contents, platforms }: { correlation: string; contents: Array<any>; platforms: Platform[] }) {
    const tasks = contents.map((content) =>
      this.queue.add(async () => {
        for (const platform of platforms) {
          const key = `${correlation}:${content.id}:${platform}`;
          if (await getOutbox().isProcessed(key)) continue;

          try {
            const res = await withRetry(async () => {
              if (platform === "instagram") {
                return publishInstagram({
                  igUserId: process.env.IG_USER_ID!,
                  pageAccessToken: process.env.IG_PAGE_TOKEN!,
                  caption: content.text,
                  videoUrl: content.assets.find((a: any) => a.kind === "video")?.uri,
                  imageUrl: content.assets.find((a: any) => a.kind === "image")?.uri,
                  shareToFeed: true,
                });
              } else if (platform === "tiktok") {
                return publishTikTok({
                  userAccessToken: process.env.TT_USER_TOKEN!,
                  mode: "direct",
                  title: content.text,
                  videoUrl: content.assets.find((a: any) => a.kind === "video")?.uri,
                });
              } else {
                return publishRedditPost({
                  accessToken: process.env.REDDIT_TOKEN!,
                  subreddit: process.env.REDDIT_SUB!,
                  title: content.title ?? content.idea,
                  kind: content.linkUrl ? "link" : "self",
                  url: content.linkUrl,
                  text: content.text,
                  nsfw: content.nsfw === true,
                  // Stable canary key: prefer tenant/user; fallback to correlation
                  canaryKey: String((content.accountId || content.userId || correlation || content.id) ?? ''),
                });
              }
            });

            await getOutbox().markProcessed(key, res);
            await getBus().publish("POST_SCHEDULED", { correlation, scheduled: [{ platform, externalId: res.externalId, at: res.publishedAt }] });
          } catch (err: any) {
            await getBus().publish("POST_FAILED", { correlation, platform, contentId: content.id, error: { message: err?.message ?? "unknown", code: err?.status ?? err?.code } });
          }
        }
      })
    );

    await Promise.all(tasks);
    await getBus().publish("PUBLISH_BATCH_DONE", { correlation, results: [] });
  }
}
