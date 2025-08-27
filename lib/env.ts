export function ensureGoogleOAuthEnv() {
  const required = [
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    'NEXT_PUBLIC_GOOGLE_REDIRECT_URI',
    'GOOGLE_CLIENT_SECRET',
  ];
  const missing = required.filter((v) => !process.env[v]);
  if (missing.length) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing Google OAuth env vars: ${missing.join(', ')}`);
    } else {
      console.warn(`Missing Google OAuth env vars (dev): ${missing.join(', ')}`);
    }
  }
}

