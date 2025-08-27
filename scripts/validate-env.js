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
}

main();
