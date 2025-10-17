// Centralized platform configuration
// Defines which platforms are supported and their status

export const SUPPORTED_PLATFORMS = {
  // Primary platforms - Fully supported
  onlyfans: {
    name: 'OnlyFans',
    enabled: true,
    status: 'active',
    features: ['scraping', 'automation', 'analytics', 'ai'],
    icon: '🔥',
    color: '#00AFF0'
  },
  
  fansly: {
    name: 'Fansly', 
    enabled: true,
    status: 'active',
    features: ['api', 'automation', 'analytics'],
    icon: '💎',
    color: '#1DA1F2'
  },

  // Marketing platforms - For traffic generation
  instagram: {
    name: 'Instagram',
    enabled: true,
    status: 'active',
    features: ['oauth', 'posting', 'analytics'],
    icon: '📸',
    color: '#E4405F'
  },
  
  tiktok: {
    name: 'TikTok',
    enabled: true,
    status: 'active', 
    features: ['oauth', 'analytics', 'trends'],
    icon: '🎵',
    color: '#000000'
  },
  
  reddit: {
    name: 'Reddit',
    enabled: true,
    status: 'active',
    features: ['oauth', 'posting', 'subreddit-management'],
    icon: '🤖',
    color: '#FF4500'
  },

  // Disabled platforms
  twitter: {
    name: 'Twitter/X',
    enabled: false,
    status: 'not_supported',
    reason: 'Not requested',
    icon: '❌',
    color: '#1DA1F2'
  },
  
  telegram: {
    name: 'Telegram',
    enabled: false,
    status: 'not_supported',
    reason: 'Not requested',
    icon: '❌',
    color: '#0088CC'
  },
  
  mym: {
    name: 'MYM',
    enabled: false,
    status: 'not_supported',
    reason: 'Not requested',
    icon: '❌',
    color: '#FF0066'
  }
};

// Get only active platforms
export const getActivePlatforms = () => {
  return Object.entries(SUPPORTED_PLATFORMS)
    .filter(([_, config]) => config.enabled)
    .map(([key, config]) => ({
      id: key,
      ...config
    }));
};

// Check if platform is supported
export const isPlatformSupported = (platform: string): boolean => {
  return SUPPORTED_PLATFORMS[platform as keyof typeof SUPPORTED_PLATFORMS]?.enabled || false;
};

// Platform feature check
export const platformHasFeature = (platform: string, feature: string): boolean => {
  const platformConfig = SUPPORTED_PLATFORMS[platform as keyof typeof SUPPORTED_PLATFORMS];
  return platformConfig?.enabled && platformConfig.features.includes(feature);
};