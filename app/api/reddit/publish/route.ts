/**
 * Reddit Publish Endpoint
 * 
 * Handles content submission to Reddit
 * 
 * @route POST /api/reddit/publish
 */

import { NextRequest, NextResponse } from 'next/server';
import { redditPublish } from '@/lib/services/redditPublish';
import { oauthAccountsRepository } from '@/lib/db/repositories/oauthAccountsRepository';
import { redditPostsRepository } from '@/lib/db/repositories/redditPostsRepository';
import { tokenEncryption } from '@/lib/services/tokenEncryption';
import { redditOAuth } from '@/lib/services/redditOAuth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subreddit, title, kind, url, text, nsfw, spoiler, sendReplies, flairId, flairText } = body;

    // Validate required fields
    if (!subreddit || !title || !kind) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'Subreddit, title, and kind are required',
          },
        },
        { status: 400 }
      );
    }

    // Validate kind-specific requirements
    if (kind === 'link' && !url) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_URL',
            message: 'URL is required for link posts',
          },
        },
        { status: 400 }
      );
    }

    if (kind === 'self' && !text) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_TEXT',
            message: 'Text is required for self posts',
          },
        },
        { status: 400 }
      );
    }

    // TODO: Get actual user ID from session/JWT
    const userId = 1;

    // Get Reddit OAuth account
    const account = await oauthAccountsRepository.findByUserAndProvider(userId, 'reddit');
    if (!account) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_CONNECTED',
            message: 'Reddit account not connected',
          },
        },
        { status: 404 }
      );
    }

    // Get encrypted tokens
    const tokens = await oauthAccountsRepository.getEncryptedTokens(account.id);
    if (!tokens) {
      return NextResponse.json(
        {
          error: {
            code: 'TOKENS_NOT_FOUND',
            message: 'OAuth tokens not found',
          },
        },
        { status: 404 }
      );
    }

    // Decrypt access token
    let accessToken = tokenEncryption.decryptAccessToken(tokens.accessToken);

    // Check if token is expired
    const now = new Date();
    if (account.expiresAt <= now) {
      // Token expired, refresh it
      if (!tokens.refreshToken) {
        return NextResponse.json(
          {
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'Access token expired and no refresh token available',
            },
          },
          { status: 401 }
        );
      }

      try {
        const refreshToken = tokenEncryption.decryptRefreshToken(tokens.refreshToken);
        const newTokens = await redditOAuth.refreshAccessToken(refreshToken);

        // Update tokens in database
        const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
        await oauthAccountsRepository.updateTokens({
          id: account.id,
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token,
          expiresAt: newExpiresAt,
        });

        accessToken = newTokens.access_token;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return NextResponse.json(
          {
            error: {
              code: 'TOKEN_REFRESH_FAILED',
              message: 'Failed to refresh access token',
            },
          },
          { status: 401 }
        );
      }
    }

    // Submit post to Reddit
    const result = await redditPublish.submit(
      {
        subreddit,
        title,
        kind,
        url,
        text,
        nsfw,
        spoiler,
        sendReplies,
        flairId,
        flairText,
      },
      accessToken
    );

    // Store post in database for tracking
    await redditPostsRepository.create({
      userId,
      oauthAccountId: account.id,
      postId: result.id,
      postName: result.name,
      subreddit,
      title,
      kind,
      url,
      selftext: text,
      permalink: result.permalink,
      score: 0,
      numComments: 0,
      isNsfw: nsfw || false,
      isSpoiler: spoiler || false,
      createdUtc: Math.floor(Date.now() / 1000),
      metadata: {
        flair_id: flairId,
        flair_text: flairText,
        send_replies: sendReplies,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        name: result.name,
        url: result.url,
        permalink: result.permalink,
        reddit_url: `https://reddit.com${result.permalink}`,
      },
    });
  } catch (error) {
    console.error('Reddit publish error:', error);

    // Handle specific Reddit API errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check for common Reddit errors
    if (errorMessage.includes('RATELIMIT')) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT',
            message: 'Rate limit exceeded. Please try again later.',
          },
        },
        { status: 429 }
      );
    }

    if (errorMessage.includes('SUBREDDIT_NOEXIST')) {
      return NextResponse.json(
        {
          error: {
            code: 'SUBREDDIT_NOT_FOUND',
            message: 'Subreddit does not exist',
          },
        },
        { status: 404 }
      );
    }

    if (errorMessage.includes('NO_LINKS') || errorMessage.includes('NO_SELFS')) {
      return NextResponse.json(
        {
          error: {
            code: 'POST_TYPE_NOT_ALLOWED',
            message: 'This type of post is not allowed in this subreddit',
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: 'PUBLISH_FAILED',
          message: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}
