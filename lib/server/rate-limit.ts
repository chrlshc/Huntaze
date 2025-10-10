const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

type Entry = {
  count: number;
  expires: number;
};

const buckets = new Map<string, Entry>();

export function isRateLimited(key: string) {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || entry.expires < now) {
    buckets.set(key, { count: 1, expires: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    return true;
  }

  buckets.set(key, entry);
  return false;
}
