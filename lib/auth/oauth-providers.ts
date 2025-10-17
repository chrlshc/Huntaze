// OAuth providers configuration for multi-platform support
// Handles authentication for Instagram, TikTok, Reddit, OnlyFans (when available)

export const oauthProviders = {
  // Instagram Business API
  instagram: {
    clientId: process.env.INSTAGRAM_CLIENT_ID!,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET!,
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    scopes: ['user_profile', 'user_media', 'instagram_basic'],
    apiBaseUrl: 'https://graph.instagram.com/v18.0',
    
    // Get auth URL
    getAuthUrl: (redirectUri: string, state: string) => {
      const params = new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID!,
        redirect_uri: redirectUri,
        scope: 'user_profile,user_media',
        response_type: 'code',
        state
      });
      return `https://api.instagram.com/oauth/authorize?${params}`;
    }
  },

  // TikTok API
  tiktok: {
    clientKey: process.env.TIKTOK_CLIENT_KEY!,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET!,
    authUrl: 'https://www.tiktok.com/auth/authorize',
    tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
    scopes: ['user.info.basic', 'video.list'],
    apiBaseUrl: 'https://open-api.tiktok.com',
    
    getAuthUrl: (redirectUri: string, state: string) => {
      const params = new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        redirect_uri: redirectUri,
        scope: 'user.info.basic,video.list',
        response_type: 'code',
        state
      });
      return `https://www.tiktok.com/auth/authorize?${params}`;
    }
  },

  // Reddit API
  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID!,
    clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    authUrl: 'https://www.reddit.com/api/v1/authorize',
    tokenUrl: 'https://www.reddit.com/api/v1/access_token',
    scopes: ['identity', 'read', 'submit', 'privatemessages'],
    apiBaseUrl: 'https://oauth.reddit.com',
    
    getAuthUrl: (redirectUri: string, state: string) => {
      const params = new URLSearchParams({
        client_id: process.env.REDDIT_CLIENT_ID!,
        response_type: 'code',
        state,
        redirect_uri: redirectUri,
        duration: 'permanent',
        scope: 'identity read submit'
      });
      return `https://www.reddit.com/api/v1/authorize?${params}`;
    }
  },

  // OnlyFans (future - when API available)
  onlyfans: {
    // OnlyFans doesn't provide public OAuth API
    // Using scraping method via Chrome extension
    useScraper: true,
    scraperPort: 9222
  },

  // Fansly API
  fansly: {
    apiKey: process.env.FANSLY_API_KEY!,
    apiBaseUrl: 'https://apiv3.fansly.com',
    // Fansly uses API key authentication, not OAuth
    useApiKey: true
  }
};

// OAuth token management
export interface OAuthToken {
  platform: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scope: string[];
  userId: string;
  providerUserId?: string;
  extra?: Record<string, any>;
}

// Store OAuth tokens securely
export async function saveOAuthToken(token: OAuthToken) {
  // In production, store in DynamoDB with encryption
  const { DynamoDBClient, PutItemCommand } = await import('@aws-sdk/client-dynamodb');
  const client = new DynamoDBClient({
    region:
      process.env.AWS_REGION ||
      process.env.NEXT_PUBLIC_AWS_REGION ||
      process.env.HZ_AWS_REGION ||
      'us-east-1',
  });
  
  const expiresAtMs = token.expiresAt.getTime();
  const expiresAtIso = new Date(expiresAtMs).toISOString();
  const scopes = Array.isArray(token.scope) ? token.scope.filter(Boolean) : [];
  await client.send(new PutItemCommand({
    TableName: 'huntaze-oauth-tokens',
    Item: {
      userId: { S: token.userId },
      platform: { S: token.platform },
      accessToken: { S: token.accessToken }, // Should be encrypted
      refreshToken: { S: token.refreshToken || '' },
      expiresAt: { N: String(expiresAtMs) },
      expiresAtIso: { S: expiresAtIso },
      scope: { S: scopes.join(',') },
      // Optional structured scopes list
      scopes: { L: scopes.map((s) => ({ S: s })) },
      ...(token.providerUserId ? { providerUserId: { S: token.providerUserId } } : {}),
      ...(token.extra ? { extra: { S: JSON.stringify(token.extra) } } : {}),
    }
  }));
}

// Exchange OAuth code for tokens
export async function exchangeCodeForToken(
  platform: string, 
  code: string, 
  redirectUri: string
): Promise<OAuthToken> {
  const provider = oauthProviders[platform as keyof typeof oauthProviders];
  
  if (!provider || provider.useScraper || provider.useApiKey) {
    throw new Error(`OAuth not supported for ${platform}`);
  }

  const tokenUrl = provider.tokenUrl;
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: provider.clientId || provider.clientKey,
    client_secret: provider.clientSecret
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    platform,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + (data.expires_in * 1000)),
    scope: data.scope?.split(' ') || provider.scopes,
    userId: '' // Will be filled after getting user info
  };
}

// Refresh OAuth token
export async function refreshOAuthToken(
  platform: string,
  refreshToken: string
): Promise<OAuthToken> {
  const provider = oauthProviders[platform as keyof typeof oauthProviders];
  
  if (!provider || !provider.tokenUrl) {
    throw new Error(`OAuth refresh not supported for ${platform}`);
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: provider.clientId || provider.clientKey,
    client_secret: provider.clientSecret
  });

  const response = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params
  });

  const data = await response.json();
  
  return {
    platform,
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: new Date(Date.now() + (data.expires_in * 1000)),
    scope: data.scope?.split(' ') || provider.scopes,
    userId: ''
  };
}

// API client factory
export function createPlatformClient(platform: string, token: OAuthToken) {
  const provider = oauthProviders[platform as keyof typeof oauthProviders];
  
  switch (platform) {
    case 'instagram':
      return {
        async getProfile() {
          const response = await fetch(`${provider.apiBaseUrl}/me?fields=id,username,account_type&access_token=${token.accessToken}`);
          return response.json();
        },
        async getMedia() {
          const response = await fetch(`${provider.apiBaseUrl}/me/media?fields=id,caption,media_type,media_url,timestamp&access_token=${token.accessToken}`);
          return response.json();
        }
      };
      
    case 'reddit':
      return {
        async getProfile() {
          const response = await fetch(`${provider.apiBaseUrl}/api/v1/me`, {
            headers: {
              'Authorization': `Bearer ${token.accessToken}`,
              'User-Agent': 'Huntaze/1.0'
            }
          });
          return response.json();
        },
        async submitPost(subreddit: string, title: string, text: string) {
          const response = await fetch(`${provider.apiBaseUrl}/api/submit`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token.accessToken}`,
              'User-Agent': 'Huntaze/1.0',
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              sr: subreddit,
              kind: 'self',
              title,
              text,
              api_type: 'json'
            })
          });
          return response.json();
        }
      };
      
    default:
      throw new Error(`Platform ${platform} not supported`);
  }
}
