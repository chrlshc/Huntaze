import { PlatformConnection } from '@/src/hooks/useOnboarding';

export type OAuthConfig = {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
};

export const PLATFORM_OAUTH_CONFIGS: Record<string, OAuthConfig> = {
  instagram: {
    clientId: process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || '',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/instagram/callback`,
    scopes: [
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_comments',
      'instagram_manage_insights',
      'pages_read_engagement',
      'pages_manage_posts'
    ],
    authUrl: 'https://www.instagram.com/oauth/authorize',
    tokenUrl: 'https://graph.instagram.com/oauth/access_token'
  },
  tiktok: {
    clientId: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY || '',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/tiktok/callback`,
    scopes: [
      'user.info.basic',
      'video.list',
      'video.upload',
      'user.info.stats'
    ],
    authUrl: 'https://www.tiktok.com/v2/auth/authorize',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token'
  },
  reddit: {
    clientId: process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID || '',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reddit/callback`,
    scopes: [
      'identity',
      'submit',
      'read',
      'privatemessages'
    ],
    authUrl: 'https://www.reddit.com/api/v1/authorize',
    tokenUrl: 'https://www.reddit.com/api/v1/access_token'
  }
};

export type TokenRefreshInfo = {
  platform: string;
  expiresIn: number; // en secondes
  requiresRefresh: boolean;
  refreshMethod: 'automatic' | 'manual' | 'business-dashboard';
};

export const TOKEN_REFRESH_INFO: Record<string, TokenRefreshInfo> = {
  instagram: {
    platform: 'instagram',
    expiresIn: 60 * 24 * 60 * 60, // 60 jours pour les tokens long-terme
    requiresRefresh: true,
    refreshMethod: 'business-dashboard'
  },
  tiktok: {
    platform: 'tiktok',
    expiresIn: 24 * 60 * 60, // 24 heures
    requiresRefresh: true,
    refreshMethod: 'automatic'
  },
  reddit: {
    platform: 'reddit',
    expiresIn: 60 * 60, // 1 heure
    requiresRefresh: true,
    refreshMethod: 'automatic'
  },
  onlyfans: {
    platform: 'onlyfans',
    expiresIn: 0, // Session based
    requiresRefresh: false,
    refreshMethod: 'manual'
  }
};

export function generateOAuthUrl(platform: keyof typeof PLATFORM_OAUTH_CONFIGS): string {
  const config = PLATFORM_OAUTH_CONFIGS[platform];
  if (!config) throw new Error(`Platform ${platform} not configured`);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state: generateState(platform)
  });

  return `${config.authUrl}?${params.toString()}`;
}

function generateState(platform: string): string {
  return Buffer.from(JSON.stringify({
    platform,
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substring(2)
  })).toString('base64');
}

export async function exchangeCodeForToken(
  platform: keyof typeof PLATFORM_OAUTH_CONFIGS,
  code: string
): Promise<PlatformConnection> {
  const config = PLATFORM_OAUTH_CONFIGS[platform];
  if (!config) throw new Error(`Platform ${platform} not configured`);

  const tokenResponse = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: process.env[`${platform.toUpperCase()}_CLIENT_SECRET`] || '',
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri
    })
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to exchange code for token: ${await tokenResponse.text()}`);
  }

  const tokenData = await tokenResponse.json();
  const refreshInfo = TOKEN_REFRESH_INFO[platform];

  return {
    platform: platform as PlatformConnection['platform'],
    connected: true,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: new Date(Date.now() + refreshInfo.expiresIn * 1000),
    permissions: config.scopes
  };
}

export async function refreshAccessToken(
  platform: string,
  refreshToken: string
): Promise<Partial<PlatformConnection>> {
  const config = PLATFORM_OAUTH_CONFIGS[platform as keyof typeof PLATFORM_OAUTH_CONFIGS];
  if (!config) throw new Error(`Platform ${platform} not configured`);

  const tokenResponse = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: process.env[`${platform.toUpperCase()}_CLIENT_SECRET`] || '',
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to refresh token: ${await tokenResponse.text()}`);
  }

  const tokenData = await tokenResponse.json();
  const refreshInfo = TOKEN_REFRESH_INFO[platform];

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || refreshToken,
    expiresAt: new Date(Date.now() + refreshInfo.expiresIn * 1000)
  };
}