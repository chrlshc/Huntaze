// Lightweight offline queue for client actions (browser-only). Not for SSR.

type OfflineAction = { endpoint: string; options: { method?: string; body?: any } };
const KEY = 'offline:queue:v1';

function read(): OfflineAction[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') as OfflineAction[]; } catch { return []; }
}

function write(list: OfflineAction[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
}

export function isOnline() {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

export async function enqueueOffline(a: OfflineAction) {
  const list = read();
  list.push(a);
  write(list);
}

export async function flushOffline(executor: (a: OfflineAction) => Promise<unknown>) {
  const list = read();
  if (!list.length) return 0;
  const remaining: OfflineAction[] = [];
  for (const a of list) {
    try { await executor(a); } catch { remaining.push(a); }
  }
  write(remaining);
  return list.length - remaining.length;
}

// Optional auto-flush when back online
export function initOfflineAutoFlush(executor: (a: OfflineAction) => Promise<unknown>) {
  if (typeof window === 'undefined') return;
  const handler = async () => { if (isOnline()) { try { await flushOffline(executor); } catch {} } };
  window.addEventListener('online', handler);
}

