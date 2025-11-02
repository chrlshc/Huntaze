/**
 * TikTok Upload Endpoint
 * 
 * POST /api/tiktok/upload
 * Initializes video upload to TikTok
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/request';
import { tokenManager } from '@/lib/services/tokenManager';
import { tiktokOAuth } from '@/lib/services/tiktokOAuth';
import { tiktokUpload, type UploadSource, type PrivacyLevel } from '@/lib/services/tiktokUpload';
import { db } from '@/lib/db';

interface UploadRequestBody {
  source: UploadSource;
  videoUrl?: string;
  title: string;
  privacy_level?: PrivacyLevel;
  disable_duet?: boolean;
  disable_comment?: boolean;
  disable_stitch?: boolean;
  video_cover_timestamp_ms?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = parseInt(user.userId);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body: UploadRequestBody = await request.json();

    // Validate required fields
    if (!body.source || !body.title) {
      return NextResponse.json(
        { error: 'Missing required fields: source, title' },
        { status: 400 }
      );
    }

    if (body.source === 'PULL_FROM_URL' && !body.videoUrl) {
      return NextResponse.json(
        { error: 'videoUrl is required for PULL_FROM_URL mode' },
        { status: 400 }
      );
    }

    // Get valid access token (auto-refresh if needed)
    const accessToken = await tokenManager.getValidToken({
      userId,
      provider: 'tiktok',
      refreshCallback: async (refreshToken: string) => {
        const refreshed = await tiktokOAuth.refreshAccessToken(refreshToken);
        return {
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token,
          expiresIn: refreshed.expires_in,
        };
      },
    });

    if (!accessToken) {
      return NextResponse.json(
        { 
          error: 'TikTok account not connected',
          code: 'not_connected',
          message: 'Please connect your TikTok account first'
        },
        { status: 403 }
      );
    }

    // Check pending uploads quota (5 per 24h)
    const pendingCount = await getPendingUploadsCount(userId);
    if (pendingCount >= 5) {
      return NextResponse.json(
        {
          error: 'Upload quota exceeded',
          code: 'quota_exceeded',
          message: 'Maximum 5 pending uploads per 24 hours',
          quota: {
            used: pendingCount,
            limit: 5,
          },
        },
        { status: 429 }
      );
    }

    // Initialize upload with TikTok
    const uploadResult = await tiktokUpload.initUpload({
      accessToken,
      source: body.source,
      videoUrl: body.videoUrl,
      postInfo: {
        title: body.title,
        privacy_level: body.privacy_level || 'PUBLIC_TO_EVERYONE',
        disable_duet: body.disable_duet,
        disable_comment: body.disable_comment,
        disable_stitch: body.disable_stitch,
        video_cover_timestamp_ms: body.video_cover_timestamp_ms,
      },
    });

    // Get oauth_account_id
    const oauthAccount = await db.query(
      `SELECT id FROM oauth_accounts 
       WHERE user_id = $1 AND provider = 'tiktok' 
       LIMIT 1`,
      [userId]
    );

    if (!oauthAccount.rows[0]) {
      return NextResponse.json(
        { error: 'OAuth account not found' },
        { status: 500 }
      );
    }

    const oauthAccountId = oauthAccount.rows[0].id;

    // Store in database
    const result = await db.query(
      `INSERT INTO tiktok_posts (
        user_id,
        oauth_account_id,
        publish_id,
        status,
        source,
        title,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (publish_id) 
      DO UPDATE SET
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, publish_id, status`,
      [
        userId,
        oauthAccountId,
        uploadResult.publish_id,
        'PROCESSING_UPLOAD',
        body.source,
        body.title,
        JSON.stringify({
          privacy_level: body.privacy_level || 'PUBLIC_TO_EVERYONE',
          disable_duet: body.disable_duet,
          disable_comment: body.disable_comment,
          disable_stitch: body.disable_stitch,
          video_url: body.videoUrl,
        }),
      ]
    );

    const post = result.rows[0];

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        id: post.id,
        publish_id: uploadResult.publish_id,
        upload_url: uploadResult.upload_url,
        status: post.status,
        source: body.source,
      },
      quota: {
        used: pendingCount + 1,
        limit: 5,
      },
    });
  } catch (error) {
    console.error('TikTok upload error:', error);

    // Handle specific errors
    if (error instanceof Error) {
      // Rate limit error
      if (error.message.includes('Rate limit exceeded')) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            code: 'rate_limit_exceeded',
            message: error.message,
          },
          { status: 429 }
        );
      }

      // Quota error
      if (error.message.includes('Too many pending uploads')) {
        return NextResponse.json(
          {
            error: 'Upload quota exceeded',
            code: 'spam_risk_too_many_pending_share',
            message: error.message,
          },
          { status: 429 }
        );
      }

      // Token error
      if (error.message.includes('Access token')) {
        return NextResponse.json(
          {
            error: 'Authentication failed',
            code: 'access_token_invalid',
            message: error.message,
          },
          { status: 401 }
        );
      }

      // Permission error
      if (error.message.includes('permissions')) {
        return NextResponse.json(
          {
            error: 'Permission denied',
            code: 'scope_not_authorized',
            message: error.message,
          },
          { status: 403 }
        );
      }
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Upload failed',
        code: 'upload_failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Get count of pending uploads in last 24 hours
 */
async function getPendingUploadsCount(userId: number): Promise<number> {
  const result = await db.query(
    `SELECT COUNT(*) as count
     FROM tiktok_posts
     WHERE user_id = $1
       AND status IN ('PROCESSING_UPLOAD', 'SEND_TO_USER_INBOX')
       AND created_at > NOW() - INTERVAL '24 hours'`,
    [userId]
  );

  return parseInt(result.rows[0]?.count || '0', 10);
}
