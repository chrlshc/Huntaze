/**
 * TikTok Account API Route
 * 
 * GET /api/tiktok/account/[userId]
 * Returns TikTok account information for a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { tiktokOAuthOptimized } from '@/lib/services/tiktok/oauth-optimized';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Await params in Next.js 16
    const { userId } = await params;

    // Get valid token (with auto-refresh)
    const accessToken = await tiktokOAuthOptimized.getValidToken(userId);

    // Get user info
    const userInfo = await tiktokOAuthOptimized.getUserInfo(accessToken);

    return NextResponse.json({
      user_id: userId,
      ...userInfo,
    });
  } catch (error: any) {
    console.error('TikTok account API error:', error);

    // Return user-friendly error message
    return NextResponse.json(
      {
        error: true,
        message: error.userMessage || error.message || 'Failed to fetch TikTok account',
        type: error.type || 'UNKNOWN_ERROR',
        correlationId: error.correlationId,
      },
      { status: error.statusCode || 500 }
    );
  }
}
