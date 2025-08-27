// Authentication configuration for OAuth providers
export const authConfig = {
  providers: {
    google: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
    }
  }
};

// OAuth URLs
export const getOAuthUrl = (provider: 'google') => {
  switch (provider) {
    case 'google':
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${authConfig.providers.google.clientId}&redirect_uri=${authConfig.providers.google.redirectUri}&response_type=code&scope=email%20profile&access_type=offline&prompt=consent`;
    
    default:
      throw new Error('Invalid provider');
  }
};