import { app, BrowserWindow, session, net } from 'electron';

let ingestToken: string | null = null;
let userId: string | null = null;
let apiBase: string = process.env.API_BASE?.replace(/\/$/, '') || 'https://app.huntaze.com';

const PROTOCOL = 'huntaze-desktop';

function parseDeepLink(urlStr: string) {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== `${PROTOCOL}:`) return;
    ingestToken = u.searchParams.get('token');
    userId = u.searchParams.get('user');
    const base = u.searchParams.get('apiBase');
    if (base) apiBase = base.replace(/\/$/, '');
  } catch {}
}

function registerProtocol() {
  if (!app.isDefaultProtocolClient(PROTOCOL)) {
    try { app.setAsDefaultProtocolClient(PROTOCOL); } catch {}
  }
}

function bindDeepLinkHandlers() {
  app.on('open-url', (e, urlStr) => {
    e.preventDefault();
    parseDeepLink(urlStr);
    createOrFocusLoginWindow();
  });

  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
  } else {
    app.on('second-instance', (_e, argv) => {
      const arg = argv.find(a => a.startsWith(`${PROTOCOL}://`));
      if (arg) parseDeepLink(arg);
      createOrFocusLoginWindow();
    });
  }
}

let win: BrowserWindow | null = null;
async function createOrFocusLoginWindow() {
  if (win) { win.show(); win.focus(); return; }
  win = new BrowserWindow({ width: 1100, height: 780, webPreferences: { nodeIntegration: false, contextIsolation: true } });
  await win.loadURL('https://onlyfans.com/login');
  win.webContents.on('did-navigate', async () => {
    try {
      const s = session.defaultSession;
      const a = await s.cookies.get({ domain: 'onlyfans.com' });
      const b = await s.cookies.get({ domain: '.onlyfans.com' });
      const all = [...a, ...b];
      const hasSess = all.some(c => c.name.toLowerCase() === 'sess' || c.name.toLowerCase() === 'auth_id');
      if (!hasSess || !ingestToken || !userId) return;
      const req = net.request({ method: 'POST', url: `${apiBase}/api/of/cookies/ingest`, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ingestToken}` } });
      const payload = JSON.stringify({ userId, cookies: all });
      req.write(payload);
      req.end();
      ingestToken = null; // one-shot client-side
    } catch {}
  });
  win.on('closed', () => { win = null; });
}

function parseInitialArgv() {
  const arg = process.argv.find(a => a.startsWith(`${PROTOCOL}://`));
  if (arg) parseDeepLink(arg);
}

app.whenReady().then(() => {
  registerProtocol();
  bindDeepLinkHandlers();
  parseInitialArgv();
  createOrFocusLoginWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

