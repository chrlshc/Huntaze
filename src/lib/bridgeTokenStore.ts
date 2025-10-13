// Best-effort in-memory one-shot token tracker for bridge tokens (ingest).
// Note: In serverless/multi-instance deployments, prefer a shared store (e.g., Redis/DynamoDB).

type Entry = { exp: number };

const g = globalThis as unknown as { __bridgeOneShot?: Map<string, Entry> };
if (!g.__bridgeOneShot) g.__bridgeOneShot = new Map();

function sweep(now: number = Math.floor(Date.now() / 1000)) {
  for (const [k, v] of g.__bridgeOneShot!) {
    if (v.exp <= now) g.__bridgeOneShot!.delete(k);
  }
}

export function isBridgeTokenUsed(jti: string): boolean {
  sweep();
  return g.__bridgeOneShot!.has(jti);
}

export function markBridgeTokenUsed(jti: string, exp: number) {
  sweep();
  g.__bridgeOneShot!.set(jti, { exp });
}

