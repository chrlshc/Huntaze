const state = { userId: null, apiBase: null, token: null, timer: null, lastHash: null };
const log = (...a) => console.info('[OF-Bridge]', ...a);

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  if (msg.type === 'PAIR') {
    state.userId = msg.userId;
    state.apiBase = (msg.apiBase || '').replace(/\/$/, '');
    state.token = msg.ingestToken;
    chrome.action.setBadgeText({ text: 'ON' });
    log('paired', { user: (state.userId || '').slice(0, 8), api: state.apiBase });
    // Trigger an immediate sweep so we ingest even if cookies didn't change
    try { maybePushCookies(); } catch (e) {}
    sendResponse({ ok: true });
  }
});

chrome.cookies.onChanged.addListener(({ cookie, removed }) => {
  if (removed || !cookie) return;
  if (!/(\.|^)onlyfans\.com$/i.test(cookie.domain)) return;
  if (!state.userId || !state.token || !state.apiBase) return;
  if (!state.timer) state.timer = setTimeout(pushAllCookies, 1000);
});

// Also sweep when an OnlyFans tab finishes loading or becomes active
chrome.tabs?.onUpdated.addListener((tabId, info, tab) => {
  try {
    if (info.status === 'complete' && tab?.url && /https?:\/\/([^\/]+\.)?onlyfans\.com(\/|$)/i.test(tab.url)) {
      maybePushCookies();
    }
  } catch {}
});

chrome.tabs?.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab?.url && /https?:\/\/([^\/]+\.)?onlyfans\.com(\/|$)/i.test(tab.url)) {
      maybePushCookies();
    }
  } catch {}
});

function maybePushCookies() {
  // Use the same de-dupe path (lastHash) within pushAllCookies
  // Queue with a small delay to coalesce bursts
  if (!state.timer) state.timer = setTimeout(pushAllCookies, 500);
}

async function pushAllCookies() {
  state.timer = null;
  const roots = await chrome.cookies.getAll({ domain: 'onlyfans.com' });
  const subs  = await chrome.cookies.getAll({ domain: '.onlyfans.com' });
  const all   = [...roots, ...subs];

  const cookies = all.map(c => ({
    name: c.name, value: c.value, domain: c.domain, path: c.path || '/',
    httpOnly: c.httpOnly, secure: c.secure, sameSite: c.sameSite,
    expirationDate: c.expirationDate ?? null, storeId: c.storeId ?? null
  }));

  const payload = JSON.stringify({ userId: state.userId, cookies });
  const hash = await sha256(payload);
  if (hash === state.lastHash) return; // avoid duplicates
  state.lastHash = hash;

  try {
    const res = await fetch(`${state.apiBase}/api/of/cookies/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
      body: payload,
      credentials: 'omit'
    });
    log('POST /api/of/cookies/ingest ->', res.status);
  } catch (e) { console.error('cookie push failed', e); }
}

async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}
