/**
 * TikTok Status Endpoint
 * 
 * GET /api/tiktok/status/:publishId
 * Queries TikTok API for upload/publish status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/request';
import { tokenManager } from '@/lib/services/tokenManager';
import { tiktokOAuth } from '@/lib/services/tiktokOAuth';
import { tiktokUpload } from '@/lib/services/tiktokUpload';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { publishId: string } }
) {
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

    const { publishId } = params;

    if (!publishId) {
      return NextResponse.json(
        { error: 'Missing publishId parameter' },
        { status: 400 }
      );
    }

    // Get post from database
    const postResult = await db.query(
      `SELECT id, user_id, publish_id, status, source, title, error_code, error_message, metadata, created_at, updated_at
       FROM tiktok_posts
       WHERE publish_id = $1`,
      [publishId]
    );

    if (postResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = postResult.rows[0];

    // Verify ownership
    if (post.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // If already completed or failed, return cached status
    if (post.status === 'PUBLISH_COMPLETE' || post.status === 'FAILED') {
      return NextResponse.json({
        success: true,
        data: {
          id: post.id,
          publish_id: post.publish_id,
          status: post.status,
          source: post.source,
          title: post.title,
          error_code: post.error_code,
          error_message: post.error_message,
          metadata: post.metadata,
          created_at: post.created_at,
          updated_at: post.updated_at,
        },
      });
    }

    // Get valid access token
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
        },
        { status: 403 }
      );
    }

    // Query TikTok API for current status
    const statusResult = await tiktokUpload.getStatus(publishId, accessToken);

    // Update database with new status
    await db.query(
      `UPDATE tiktok_posts
       SET status = $1,
           error_message = $2,
           metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb,
           updated_at = CURRENT_TIMESTAMP
       WHERE publish_id = $4`,
      [
        statusResult.status,
        statusResult.fail_reason || null,
        JSON.stringify({
          publicaly_available_post_id: statusResult.publicaly_available_post_id,
        }),
        publishId,
      ]
    );

    // Fetch updated post
    const updatedPostResult = await db.query(
      `SELECT id, user_id, publish_id, status, source, title, error_code, error_message, metadata, created_at, updated_at
       FROM tiktok_posts
       WHERE publish_id = $1`,
      [publishId]
    );

    const updatedPost = updatedPostResult.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        id: updatedPost.id,
        publish_id: updatedPost.publish_id,
        status: updatedPost.status,
        source: updatedPost.source,
        title: updatedPost.title,
        error_message: updatedPost.error_message,
        metadata: updatedPost.metadata,
        created_at: updatedPost.created_at,
        updated_at: updatedPost.updated_at,
      },
    });
  } catch (error) {
    console.error('TikTok status query error:', error);

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
    }

    return NextResponse.json(
      {
        error: 'Status query failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
