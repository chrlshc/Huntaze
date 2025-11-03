/**
 * Reddit Sync Worker
 * 
 * Periodically syncs Reddit post metrics (score, comments)
 * Should be run as a cron job or scheduled task
 */

import { redditPostsRepository } from '../db/repositories/redditPostsRepository';
import { oauthAccountsRepository } from '../db/repositories/oauthAccountsRepository';
import { tokenEncryption } from '../services/tokenEncryption';
import { redditPublish } from '../services/redditPublish';
import { redditOAuth } from '../services/redditOAuth';

export interface SyncResult {
  success: boolean;
  postsUpdated: number;
  errors: Array<{ postId: string; error: string }>;
}

/**
 * Sync Reddit post metrics for a user
 * 
 * @param userId - User ID
 * @param limit - Maximum number of posts to sync
 * @returns Sync result
 */
export async function syncUserPosts(userId: number, limit: number = 50): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    postsUpdated: 0,
    errors: [],
  };

  try {
    // Get user's Reddit OAuth account
    const account = await oauthAccountsRepository.findByUserAndProvider(userId, 'reddit');
    if (!account) {
      throw new Error('Reddit account not connected');
    }

    // Get encrypted tokens
    const tokens = await oauthAccountsRepository.getEncryptedTokens(account.id);
    if (!tokens) {
      throw new Error('OAuth tokens not found');
    }

    // Decrypt access token
    let accessToken = tokenEncryption.decryptAccessToken(tokens.accessToken);

    // Check if token is expired
    const now = new Date();
    if (account.expiresAt <= now) {
      // Token expired, refresh it
      if (!tokens.refreshToken) {
        throw new Error('Access token expired and no refresh token available');
      }

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
    }

    // Get user's recent posts
    const posts = await redditPostsRepository.findByUser(userId, limit);

    // Update metrics for each post
    for (const post of posts) {
      try {
        // Get updated post info from Reddit
        const postInfo = await redditPublish.getPostInfo(post.postId, accessToken);

        // Update metrics in database
        await redditPostsRepository.updateMetrics({
          postId: post.postId,
          score: postInfo.score,
          numComments: postInfo.num_comments,
        });

        result.postsUpdated++;
      } catch (error) {
        console.error(`Failed to sync post ${post.postId}:`, error);
        result.errors.push({
          postId: post.postId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    result.success = result.errors.length === 0;
  } catch (error) {
    console.error('Reddit sync error:', error);
    result.success = false;
    result.errors.push({
      postId: 'N/A',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return result;
}

/**
 * Sync all users' Reddit posts
 * 
 * @returns Total sync results
 */
export async function syncAllUsers(): Promise<{
  totalUsers: number;
  totalPostsUpdated: number;
  totalErrors: number;
}> {
  const results = {
    totalUsers: 0,
    totalPostsUpdated: 0,
    totalErrors: 0,
  };

  try {
    // Get all users with Reddit accounts
    // TODO: Implement a method to get all users with Reddit accounts
    // For now, this is a placeholder
    console.log('Sync all users not yet implemented');
  } catch (error) {
    console.error('Sync all users error:', error);
  }

  return results;
}

/**
 * Run sync worker
 * Can be called from a cron job or API endpoint
 */
export async function runRedditSync() {
  console.log('Starting Reddit sync worker...');

  const startTime = Date.now();
  const results = await syncAllUsers();
  const duration = Date.now() - startTime;

  console.log('Reddit sync complete:', {
    duration: `${duration}ms`,
    ...results,
  });

  return results;
}
