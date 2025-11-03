export type Mode = "mock" | "dry_run" | "shadow" | "live";
export type Platform = "instagram" | "tiktok" | "reddit" | "twitter";

function asMode(val: string | undefined): Mode {
  const v = (val || "").toLowerCase();
  if (v === "mock" || v === "dry_run" || v === "shadow" || v === "live") return v;
  return "mock";
}

function isTrue(val: string | undefined) {
  return ["1", "true", "yes", "on"].includes(String(val || "").toLowerCase());
}

export function getMode(p: Platform): Mode {
  // Fast feature flags: REDDIT/TIKTOK/INSTAGRAM=true -> live; =false -> mock
  const flag = process.env[p.toUpperCase() as keyof NodeJS.ProcessEnv] as string | undefined;
  if (typeof flag !== "undefined") {
    return isTrue(flag) ? "live" : "mock";
  }

  // Explicit mode override (preferred for canary/shadow control)
  const raw = process.env[`PIPELINE_MODE_${p.toUpperCase()}` as const] as string | undefined;
  return asMode(raw);
}

// Reddit canary resolver: uses boolean override, then % rollout, else pipeline mode
import { inBucket } from "./canary";
export function resolveRedditMode(userKey: string): Mode {
  const flag = process.env["REDDIT"];
  if (typeof flag !== "undefined") return isTrue(flag) ? "live" : "mock";

  const pct = Number(process.env.REDDIT_CANARY_PERCENT ?? "0");
  if (userKey && inBucket(userKey, "reddit", Number.isFinite(pct) ? pct : 0)) return "live";

  const raw = process.env.PIPELINE_MODE_REDDIT as string | undefined;
  return asMode(raw);
}
