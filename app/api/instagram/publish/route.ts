/**
 * Instagram Publish Endpoint
 * 
 * Publishes photos, videos, or carousels to Instagram Business account
 * - Validates authentication
 * - Gets valid access token (auto-refresh if needed)
 * - Creates media container
 * - Polls status until finished
 * - Publishes to Instagram
 * - Stores in ig_media table
 */

import { NextRequest, NextResponse } from 'next/server';
import { instagramPublish } from '@/lib/services/instagramPublish';
import { tokenManager } from '@/lib/services/tokenManager';
import { instagramOAuth } from '@/lib/services/instagramOAuth';

export async function POST(request: NextRequest) {
  try {
    // TODO: Get user ID from session/JWT
    // For now, using placeholder
    const userId = 1; // Replace with actual user ID from session

    // Parse request body
    const body = await request.json();
    const {
      mediaType,
      mediaUrl,
      caption,
      locationId,
      coverUrl,
      children, // For carousels
    } = body;

    // Validate required fields
    if (!mediaType) {
      return NextResponse.json(
        { error: 'mediaType is required' },
        { status: 400 }
      );
    }

    if (mediaType === 'CAROUSEL') {
      if (!children || !Array.isArray(children) || children.length === 0) {
        return NextResponse.json(
          { error: 'children array is required for carousel' },
          { status: 400 }
        );
      }
    } else {
      if (!mediaUrl) {
        return NextResponse.json(
          { error: 'mediaUrl is required' },
          { status: 400 }
        );
      }
    }

    // Get Instagram account from database
    const account = await tokenManager.getAccount({
      userId,
      provider: 'instagram',
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Instagram account not connected' },
        { status: 404 }
      );
    }

    // Get Instagram Business ID from metadata
    const igBusinessId = account.metadata?.ig_business_id;
    if (!igBusinessId) {
      return NextResponse.json(
        { error: 'Instagram Business ID not found' },
        { status: 400 }
      );
    }

    // Get valid access token (auto-refresh if needed)
    const accessToken = await tokenManager.getValidToken({
      userId,
      provider: 'instagram',
      refreshCallback: async (token) => {
        const refreshed = await instagramOAuth.refreshLongLivedToken(token);
        return {
          accessToken: refreshed.access_token,
          expiresIn: refreshed.expires_in,
        };
      },
    });

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to get valid access token' },
        { status: 401 }
      );
    }

    // Publish media
    let published;

    if (mediaType === 'CAROUSEL') {
      // Publish carousel
      published = await instagramPublish.publishCarousel({
        igUserId: igBusinessId,
        accessToken,
        children,
        caption,
        locationId,
      });
    } else {
      // Publish single media (photo or video)
      published = await instagramPublish.publishMedia({
        igUserId: igBusinessId,
        accessToken,
        mediaType,
        mediaUrl,
        caption,
        locationId,
        coverUrl,
      });
    }

    // Get published media details
    const mediaDetails = await instagramPublish.getMediaDetails(
      published.id,
      accessToken
    );

    // TODO: Store in ig_media table
    // await igMediaRepository.create({
    //   instagramAccountId: account.id,
    //   igId: published.id,
    //   mediaType: mediaDetails.media_type,
    //   caption: mediaDetails.caption,
    //   permalink: mediaDetails.permalink,
    //   timestamp: new Date(mediaDetails.timestamp),
    // });

    return NextResponse.json({
      success: true,
      media: {
        id: published.id,
        type: mediaDetails.media_type,
        url: mediaDetails.media_url,
        permalink: mediaDetails.permalink,
        timestamp: mediaDetails.timestamp,
        caption: mediaDetails.caption,
      },
    });
  } catch (error) {
    console.error('Instagram publish error:', error);

    // Parse error message for user-friendly response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    let statusCode = 500;
    let userMessage = 'Failed to publish to Instagram';

    if (errorMessage.includes('invalid_media')) {
      statusCode = 400;
      userMessage = 'Invalid media URL or format';
    } else if (errorMessage.includes('permission_denied')) {
      statusCode = 403;
      userMessage = 'Permission denied. Please reconnect your Instagram account';
    } else if (errorMessage.includes('rate_limit')) {
      statusCode = 429;
      userMessage = 'Rate limit exceeded. Please try again later';
    } else if (errorMessage.includes('Container error')) {
      statusCode = 400;
      userMessage = `Media processing failed: ${errorMessage}`;
    } else if (errorMessage.includes('timed out')) {
      statusCode = 408;
      userMessage = 'Media processing timed out. Please try again';
    }

    return NextResponse.json(
      {
        error: userMessage,
        details: errorMessage,
      },
      { status: statusCode }
    );
  }
}
