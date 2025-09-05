import crypto from 'crypto';

export interface TrackingLink {
  shortCode: string;
  fullUrl: string;
  platform: string;
  variant?: string;
  postId?: string;
  campaignId?: string;
  createdAt: Date;
}

export interface TrackingClick {
  shortCode: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  referer?: string;
  country?: string;
}

export interface ABTestVariant {
  id: string;
  name: string;
  content: string;
  caption?: string;
  hashtags?: string[];
  trackingLink: string;
  clicks: number;
  conversions: number;
  revenue: number;
}

export interface ABTest {
  id: string;
  platform: string;
  status: 'draft' | 'active' | 'completed';
  startDate?: Date;
  endDate?: Date;
  variants: ABTestVariant[];
  winner?: string;
  metrics: {
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    conversionRate: number;
  };
}

/**
 * Generate a short tracking code for /r links
 */
export function generateTrackingCode(length: number = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  
  return result;
}

/**
 * Create a tracking link for a specific destination
 */
export function createTrackingLink(
  destinationUrl: string,
  platform: string,
  options?: {
    variant?: string;
    postId?: string;
    campaignId?: string;
    customCode?: string;
  }
): TrackingLink {
  const shortCode = options?.customCode || generateTrackingCode();
  
  return {
    shortCode,
    fullUrl: destinationUrl,
    platform,
    variant: options?.variant,
    postId: options?.postId,
    campaignId: options?.campaignId,
    createdAt: new Date()
  };
}

/**
 * Generate tracking links for A/B test variants
 */
export function generateABTestLinks(
  baseUrl: string,
  platform: string,
  variants: string[],
  campaignId: string
): Map<string, TrackingLink> {
  const links = new Map<string, TrackingLink>();
  
  variants.forEach((variantName, index) => {
    const link = createTrackingLink(baseUrl, platform, {
      variant: variantName,
      campaignId,
      customCode: `${campaignId.slice(0, 3)}${String.fromCharCode(65 + index)}${generateTrackingCode(3)}`
    });
    
    links.set(variantName, link);
  });
  
  return links;
}

/**
 * Calculate A/B test winner based on metrics
 */
export function calculateABTestWinner(test: ABTest): string | null {
  if (test.status !== 'active' && test.status !== 'completed') {
    return null;
  }
  
  let bestVariant: ABTestVariant | null = null;
  let bestScore = 0;
  
  test.variants.forEach(variant => {
    // Calculate score based on weighted metrics
    const ctr = variant.clicks > 0 ? (variant.conversions / variant.clicks) : 0;
    const revenuePerClick = variant.clicks > 0 ? (variant.revenue / variant.clicks) : 0;
    
    // Weight: 40% CTR, 60% revenue per click
    const score = (ctr * 0.4) + (revenuePerClick * 0.6);
    
    if (score > bestScore) {
      bestScore = score;
      bestVariant = variant;
    }
  });
  
  // Require minimum sample size
  const totalClicks = test.variants.reduce((sum, v) => sum + v.clicks, 0);
  if (totalClicks < 100) {
    return null;
  }
  
  return bestVariant?.id || null;
}

/**
 * Format tracking link for display
 */
export function formatTrackingLink(shortCode: string, baseUrl?: string): string {
  const domain = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://huntaze.com';
  return `${domain}/r/${shortCode}`;
}

/**
 * Parse tracking data from URL
 */
export function parseTrackingUrl(url: string): { shortCode: string } | null {
  const match = url.match(/\/r\/([a-zA-Z0-9]+)/);
  if (match) {
    return { shortCode: match[1] };
  }
  return null;
}

/**
 * Generate attribution window for tracking conversions
 */
export function getAttributionWindow(platform: string): number {
  // Return hours for attribution window
  const windows: Record<string, number> = {
    onlyfans: 168, // 7 days
    fanvue: 168,
    fansly: 168,
    instagram: 72, // 3 days
    tiktok: 48, // 2 days
    twitter: 24, // 1 day
    reddit: 48,
    default: 72
  };
  
  return windows[platform.toLowerCase()] || windows.default;
}