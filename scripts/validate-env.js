/* Simple ENV validator for site-web */
const requiredCommon = [];

const requiredProd = [
  'JWT_SECRET', // used for jose signing/verification in server runtime
  'AUTOGEN_HMAC_SECRET',
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
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

function normalizeHost(urlString) {
  try {
    const host = new URL(urlString).host.toLowerCase();
    return host.startsWith('www.') ? host.slice(4) : host;
  } catch {
    return null;
  }
}

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

  // Warn for recommended runtime envs
  const rec = [];
  if (!process.env.AGENTS_API_URL && !process.env.AUTOGEN_SERVICE_URL) rec.push('AGENTS_API_URL');
  if (!process.env.AUTOGEN_SERVICE_URL && !process.env.AGENTS_API_URL) rec.push('AUTOGEN_SERVICE_URL');
  if (!process.env.OF_SQS_URL) rec.push('OF_SQS_URL');
  if (!process.env.AWS_REGION) rec.push('AWS_REGION');
  if (rec.length) console.warn(`Recommendation: set these env vars: ${rec.join(', ')}`);

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
  const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL || process.env.NEXT_PUBLIC_ROOT_URL;
  if (appUrl && marketingUrl) {
    const appHost = normalizeHost(appUrl);
    const marketingHost = normalizeHost(marketingUrl);
    if (appHost && marketingHost && appHost === marketingHost) {
      console.error(
        'Invalid configuration: NEXT_PUBLIC_APP_URL must point to the app subdomain (e.g. https://app.huntaze.com) and differ from the marketing domain.',
      );
      process.exit(1);
    }
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

  // LLM provider sanity checks
  const provider = (process.env.LLM_PROVIDER || '').toLowerCase();
  if (mode === 'production') {
    if (provider === 'azure') {
      const need = ['AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_DEPLOYMENT'];
      const miss = need.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
      if (miss.length) {
        console.error(`Missing Azure OpenAI configuration: ${miss.join(', ')}`);
        process.exit(1);
      }
    }
    if (provider === 'openai') {
      if (!process.env.OPENAI_API_KEY) {
        console.error('Missing OPENAI_API_KEY for LLM_PROVIDER=openai');
        process.exit(1);
      }
    }
  }
}

main();
