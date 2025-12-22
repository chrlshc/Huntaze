/**
 * Integrations Connect API Routes
 * 
 * Handles OAuth connections and token management for platforms.
 * End 2025 compliant with new Instagram scopes and TikTok audit requirements.
 * 
 * POST /api/integrations/connect - Initiate OAuth flow
 * GET /api/integrations/connect - Get connected accounts status
 */

import { NextRequest, NextResponse } from 'next/server';

export type Platform = 'instagram' | 'tiktok' | 'reddit';
export type TokenStatus = 'valid' | 'expiring_soon' | 'expired';
export type AuditStatus = 'approved' | 'pending' | 'not_submitted';

export interface ConnectedAccount {
  id: string;
  platform: Platform;
  accountName: string;
  accountId: string;
  tokenStatus: TokenStatus;
  tokenExpiresAt?: string;
  permissions: {
    name: string;
    granted: boolean;
    required: boolean;
  }[];
  auditStatus?: AuditStatus;
  errorsLast24h: number;
  rateLimitRemaining?: number;
  connectedAt: string;
  updatedAt: string;
}

// Instagram new scopes (2025)
const INSTAGRAM_REQUIRED_SCOPES = [
  'instagram_business_basic',
  'instagram_business_content_publish',
  'instagram_business_manage_messages',
  'instagram_business_manage_comments',
];

// TikTok required scopes
const TIKTOK_REQUIRED_SCOPES = [
  'video.upload',
  'video.publish',
  'user.info.basic',
];

// Mock connected accounts for demo
const mockAccounts: ConnectedAccount[] = [
  {
    id: 'ig_123',
    platform: 'instagram',
    accountName: '@creator_account',
    accountId: '17841400000000000',
    tokenStatus: 'valid',
    tokenExpiresAt: '2026-02-15',
    permissions: INSTAGRAM_REQUIRED_SCOPES.map(scope => ({
      name: scope,
      granted: true,
      required: true,
    })),
    errorsLast24h: 0,
    rateLimitRemaining: 4850,
    connectedAt: '2024-06-15T10:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tt_456',
    platform: 'tiktok',
    accountName: '@tiktok_creator',
    accountId: 'open_id_abc123',
    tokenStatus: 'expiring_soon',
    tokenExpiresAt: '2025-12-20',
    permissions: TIKTOK_REQUIRED_SCOPES.map(scope => ({
      name: scope,
      granted: true,
      required: true,
    })),
    auditStatus: 'pending',
    errorsLast24h: 2,
    rateLimitRemaining: 980,
    connectedAt: '2024-08-20T14:30:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rd_789',
    platform: 'reddit',
    accountName: 'u/creator_reddit',
    accountId: 't2_abc123',
    tokenStatus: 'valid',
    permissions: [
      { name: 'submit', granted: true, required: true },
      { name: 'read', granted: true, required: true },
      { name: 'identity', granted: true, required: true },
    ],
    errorsLast24h: 0,
    connectedAt: '2024-09-10T09:15:00Z',
    updatedAt: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') as Platform | null;

    let accounts = [...mockAccounts];

    if (platform) {
      accounts = accounts.filter(acc => acc.platform === platform);
    }

    // Calculate overall health
    const healthIssues: string[] = [];
    accounts.forEach(acc => {
      if (acc.tokenStatus === 'expired') {
        healthIssues.push(`${acc.platform}: Token expired`);
      }
      if (acc.tokenStatus === 'expiring_soon') {
        healthIssues.push(`${acc.platform}: Token expiring soon`);
      }
      if (acc.auditStatus === 'pending') {
        healthIssues.push(`${acc.platform}: App audit pending`);
      }
      if (acc.errorsLast24h > 0) {
        healthIssues.push(`${acc.platform}: ${acc.errorsLast24h} errors in last 24h`);
      }
      const missingPermissions = acc.permissions.filter(p => p.required && !p.granted);
      if (missingPermissions.length > 0) {
        healthIssues.push(`${acc.platform}: Missing permissions: ${missingPermissions.map(p => p.name).join(', ')}`);
      }
    });

    return NextResponse.json({
      success: true,
      accounts,
      health: {
        score: Math.max(0, 100 - healthIssues.length * 15),
        issues: healthIssues,
      },
    });

  } catch (error) {
    console.error('Error fetching connected accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connected accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, action } = body;

    if (!platform) {
      return NextResponse.json(
        { error: 'platform is required' },
        { status: 400 }
      );
    }

    const validPlatforms: Platform[] = ['instagram', 'tiktok', 'reddit'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    if (action === 'connect') {
      // In production, this would return an OAuth URL
      const oauthUrls: Record<Platform, string> = {
        instagram: 'https://api.instagram.com/oauth/authorize?...',
        tiktok: 'https://www.tiktok.com/v2/auth/authorize?...',
        reddit: 'https://www.reddit.com/api/v1/authorize?...',
      };

      return NextResponse.json({
        success: true,
        oauthUrl: oauthUrls[platform as Platform],
        requiredScopes: platform === 'instagram' 
          ? INSTAGRAM_REQUIRED_SCOPES 
          : platform === 'tiktok'
          ? TIKTOK_REQUIRED_SCOPES
          : ['submit', 'read', 'identity'],
      });
    }

    if (action === 'refresh') {
      // In production, this would refresh the OAuth token
      return NextResponse.json({
        success: true,
        message: `Token refresh initiated for ${platform}`,
      });
    }

    if (action === 'disconnect') {
      // In production, this would revoke tokens and remove from DB
      return NextResponse.json({
        success: true,
        message: `Disconnected ${platform} account`,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Must be connect, refresh, or disconnect' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing integration request:', error);
    return NextResponse.json(
      { error: 'Failed to process integration request' },
      { status: 500 }
    );
  }
}
