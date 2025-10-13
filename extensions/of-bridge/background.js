// Helpers storage.session fallback
const storageSession = chrome.storage.session || chrome.storage.local;

async function getSession(keys) {
  return new Promise((resolve) => storageSession.get(keys, (d) => resolve(d)));
}
async function setSession(obj) {
  return new Promise((resolve) => storageSession.set(obj, () => resolve(true)));
}
async function removeSession(keys) {
  return new Promise((resolve) => storageSession.remove(keys, () => resolve(true)));
}

function isOnlyfans(urlString) {
  try {
    const u = new URL(urlString);
    return /(^|\.)onlyfans\.com$/i.test(u.hostname);
  } catch {
    return false;
  }
}

// Runtime messages from content
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.kind === 'OF_BRIDGE_SET_TOKEN' && typeof msg.ingestToken === 'string') {
    setSession({ bridge: { ingestToken: msg.ingestToken }, setAt: Date.now() }).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg?.kind === 'OF_BRIDGE_SET' && msg.bridge?.ingestToken) {
    setSession({ bridge: msg.bridge, setAt: Date.now() }).then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});

async function collectOfCookies(storeId) {
  const base = await chrome.cookies.getAll(storeId ? { domain: 'onlyfans.com', storeId } : { domain: 'onlyfans.com' });
  const sub = await chrome.cookies.getAll(storeId ? { domain: '.onlyfans.com', storeId } : { domain: '.onlyfans.com' });
  return [...base, ...sub];
}

async function maybeIngestCookies(tabId) {
  const { bridge } = await getSession(['bridge']);
  if (!bridge?.ingestToken) return;

  // Resolve storeId (incognito aware)
  let storeId = undefined;
  try {
    if (typeof tabId === 'number') {
      const stores = await chrome.cookies.getAllCookieStores();
      const match = stores.find((s) => (s.tabIds || []).includes(tabId));
      if (match) storeId = match.id;
    }
  } catch {}

  const cookies = await collectOfCookies(storeId);
  if (!cookies?.length) return;

  const payload = {
    userId: bridge.userId || undefined,
    cookies: cookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      httpOnly: !!c.httpOnly,
      secure: !!c.secure,
      sameSite: (c.sameSite || 'no_restriction').toLowerCase(),
      expirationDate: c.expirationDate || null,
      partitionKey: c.partitionKey || null
    }))
  };

  try {
    const apiBase = bridge.apiBase || 'https://app.huntaze.com';
    const res = await fetch(`${apiBase}/api/of/cookies/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bridge.ingestToken}`
      },
      body: JSON.stringify(payload)
    });
    // Token à usage court: invalider après 1 succès
    if (res.ok) await removeSession(['bridge']);
  } catch {}
}

// Robust triggers: webNavigation + cookies.onChanged
const OF_FILTER = { url: [{ hostSuffix: 'onlyfans.com' }] };

chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return;
  await maybeIngestCookies(details.tabId);
}, OF_FILTER);

chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
  if (details.frameId !== 0) return;
  await maybeIngestCookies(details.tabId);
}, OF_FILTER);

const TARGET_COOKIE_NAMES = new Set(['sess', 'auth_id']);
chrome.cookies.onChanged.addListener(async ({ cookie, removed }) => {
  if (removed) return;
  if (!cookie?.domain || !/onlyfans\.com$/i.test(cookie.domain)) return;
  if (!TARGET_COOKIE_NAMES.has(cookie.name)) return;
  await maybeIngestCookies();
});
