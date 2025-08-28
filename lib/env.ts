export function ensureGoogleOAuthEnv() {
  // Check if we have the minimum required variables
  const hasClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const hasClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const hasRedirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
  
  if (!hasClientId || !hasClientSecret || !hasRedirectUri) {
    const missing = [];
    if (!hasClientId) missing.push('GOOGLE_CLIENT_ID or NEXT_PUBLIC_GOOGLE_CLIENT_ID');
    if (!hasClientSecret) missing.push('GOOGLE_CLIENT_SECRET');
    if (!hasRedirectUri) missing.push('NEXT_PUBLIC_GOOGLE_REDIRECT_URI');
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing Google OAuth env vars: ${missing.join(', ')}`);
    } else {
      console.warn(`Missing Google OAuth env vars (dev): ${missing.join(', ')}`);
    }
  }
}

