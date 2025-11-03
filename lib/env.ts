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

/**
 * Validate TikTok OAuth environment variables
 * @throws Error in production if required variables are missing
 */
export function ensureTikTokOAuthEnv() {
  const hasClientKey = process.env.TIKTOK_CLIENT_KEY;
  const hasClientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const hasRedirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;
  
  if (!hasClientKey || !hasClientSecret || !hasRedirectUri) {
    const missing = [];
    if (!hasClientKey) missing.push('TIKTOK_CLIENT_KEY');
    if (!hasClientSecret) missing.push('TIKTOK_CLIENT_SECRET');
    if (!hasRedirectUri) missing.push('NEXT_PUBLIC_TIKTOK_REDIRECT_URI');
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing TikTok OAuth env vars: ${missing.join(', ')}`);
    } else {
      console.warn(`Missing TikTok OAuth env vars (dev): ${missing.join(', ')}`);
    }
  }
}

/**
 * Validate Instagram/Facebook OAuth environment variables
 * @throws Error in production if required variables are missing
 */
export function ensureInstagramOAuthEnv() {
  const hasAppId = process.env.FACEBOOK_APP_ID;
  const hasAppSecret = process.env.FACEBOOK_APP_SECRET;
  const hasRedirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;
  
  if (!hasAppId || !hasAppSecret || !hasRedirectUri) {
    const missing = [];
    if (!hasAppId) missing.push('FACEBOOK_APP_ID');
    if (!hasAppSecret) missing.push('FACEBOOK_APP_SECRET');
    if (!hasRedirectUri) missing.push('NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI');
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing Instagram OAuth env vars: ${missing.join(', ')}`);
    } else {
      console.warn(`Missing Instagram OAuth env vars (dev): ${missing.join(', ')}`);
    }
  }
}

/**
 * Validate Reddit OAuth environment variables
 * @throws Error in production if required variables are missing
 */
export function ensureRedditOAuthEnv() {
  const hasClientId = process.env.REDDIT_CLIENT_ID;
  const hasClientSecret = process.env.REDDIT_CLIENT_SECRET;
  const hasRedirectUri = process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI;
  
  if (!hasClientId || !hasClientSecret || !hasRedirectUri) {
    const missing = [];
    if (!hasClientId) missing.push('REDDIT_CLIENT_ID');
    if (!hasClientSecret) missing.push('REDDIT_CLIENT_SECRET');
    if (!hasRedirectUri) missing.push('NEXT_PUBLIC_REDDIT_REDIRECT_URI');
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing Reddit OAuth env vars: ${missing.join(', ')}`);
    } else {
      console.warn(`Missing Reddit OAuth env vars (dev): ${missing.join(', ')}`);
    }
  }
}

/**
 * Validate all social media OAuth environment variables
 * @throws Error in production if any required variables are missing
 */
export function ensureAllSocialOAuthEnv() {
  const errors: string[] = [];
  
  try {
    ensureTikTokOAuthEnv();
  } catch (error) {
    if (error instanceof Error) {
      errors.push(error.message);
    }
  }
  
  try {
    ensureInstagramOAuthEnv();
  } catch (error) {
    if (error instanceof Error) {
      errors.push(error.message);
    }
  }
  
  try {
    ensureRedditOAuthEnv();
  } catch (error) {
    if (error instanceof Error) {
      errors.push(error.message);
    }
  }
  
  if (errors.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(`Social OAuth configuration errors:\n${errors.join('\n')}`);
  }
}

