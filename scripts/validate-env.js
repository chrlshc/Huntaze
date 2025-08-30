/* Simple ENV validator for site-web */
const requiredCommon = [];

const requiredProd = [
  'JWT_SECRET', // used for jose signing/verification in server runtime
];

const warnIfMissing = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
  'NEXT_PUBLIC_GOOGLE_REDIRECT_URI',
  'GOOGLE_CLIENT_SECRET',
  'TIKTOK_CLIENT_KEY',
  'TIKTOK_CLIENT_SECRET',
  'NEXT_PUBLIC_TIKTOK_REDIRECT_URI',
];

function main() {
  const mode = process.env.NODE_ENV || 'development';
  const required = [...requiredCommon, ...(mode === 'production' ? requiredProd : [])];
  const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');

  if (missing.length) {
    console.error(`Missing required environment variables (${mode}): ${missing.join(', ')}`);
    process.exit(1);
  }

  const softMissing = warnIfMissing.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
  if (softMissing.length) {
    console.warn(`Warning: optional env vars not set: ${softMissing.join(', ')}`);
  }

  // Extra sanity checks for API URLs
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      const u = new URL(apiUrl);
      const endsWithApi = /\/api\/?$/.test(u.pathname);
      if (!endsWithApi) {
        console.warn(`Warning: NEXT_PUBLIC_API_URL does not end with /api (${apiUrl}). If your backend expects /api, append it (e.g. http://localhost:4000/api).`);
      }
    } catch {}
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl && mode !== 'production') {
    console.warn('Warning: NEXT_PUBLIC_APP_URL not set. Using request origin for callbacks in dev.');
  }

  // TikTok redirect sanity check
  const tiktokRedirect = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;
  if (appUrl && tiktokRedirect) {
    try {
      const a = new URL(appUrl);
      const r = new URL(tiktokRedirect);
      if (a.host !== r.host) {
        console.warn(`Warning: TikTok redirect host (${r.host}) does not match app URL host (${a.host}). Update NEXT_PUBLIC_TIKTOK_REDIRECT_URI to ${a.origin}/auth/tiktok/callback`);
      }
    } catch {}
  }
}

main();
