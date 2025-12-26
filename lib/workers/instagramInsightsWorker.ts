/**
 * Instagram Insights Sync Worker
 * Periodically pulls media insights and account metrics from Instagram
 */

import { query } from '../db';
import { externalFetchJson } from '@/lib/services/external/http';
import { ExternalServiceError } from '@/lib/services/external/errors';

interface InstagramInsight {
  name: string;
  period: string;
  values: Array<{
    value: number;
    end_time: string;
  }>;
  title?: string;
  description?: string;
  id?: string;
}

interface MediaInsights {
  impressions: number;
  reach: number;
  engagement: number;
  saved: number;
  video_views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
}

interface AccountInsights {
  follower_count: number;
  reach: number;
  impressions: number;
  profile_views: number;
}

type GraphApiError = {
  message?: string;
  code?: number;
  type?: string;
  fbtrace_id?: string;
  error_subcode?: number;
};

type GraphApiResponse<T> = T & { error?: GraphApiError };

function mapGraphError(error: GraphApiError, operation: string): ExternalServiceError {
  const retryable = error.code === 4 || error.code === 17 || error.code === 613;
  const code =
    error.code === 190
      ? 'UNAUTHORIZED'
      : retryable
        ? 'RATE_LIMIT'
        : error.code === 10
          ? 'FORBIDDEN'
          : 'BAD_REQUEST';

  return new ExternalServiceError({
    service: 'instagram',
    code,
    retryable,
    message: error.message || `Instagram API error (${operation})`,
    details: { error },
  });
}

/**
 * Sync insights for all Instagram accounts
 */
export async function syncAllInstagramInsights(): Promise<void> {
  console.log('[Instagram Insights Worker] Starting sync...');

  try {
    // Get all Instagram accounts with valid tokens
    const accountsResult = await query(
      `SELECT 
        ia.id,
        ia.user_id,
        ia.ig_business_id,
        ia.username,
        oa.access_token,
        oa.expires_at
       FROM instagram_accounts ia
       JOIN oauth_accounts oa ON oa.user_id = ia.user_id AND oa.provider = 'instagram'
       WHERE oa.expires_at > NOW()
       ORDER BY ia.last_synced_at ASC NULLS FIRST
       LIMIT 50`,
      []
    );

    if (accountsResult.rows.length === 0) {
      console.log('[Instagram Insights Worker] No accounts to sync');
      return;
    }

    console.log(`[Instagram Insights Worker] Syncing ${accountsResult.rows.length} accounts`);

    for (const account of accountsResult.rows) {
      try {
        await syncAccountInsights(account);
        
        // Add delay to respect rate limits (200 calls per hour per user)
        await sleep(2000); // 2 seconds between accounts
      } catch (error) {
        console.error(`[Instagram Insights Worker] Error syncing account ${account.id}:`, error);
        // Continue with next account
      }
    }

    console.log('[Instagram Insights Worker] Sync complete');
  } catch (error) {
    console.error('[Instagram Insights Worker] Fatal error:', error);
    throw error;
  }
}

/**
 * Sync insights for a single Instagram account
 */
async function syncAccountInsights(account: any): Promise<void> {
  console.log(`[Instagram Insights Worker] Syncing account ${account.username} (${account.id})`);

  try {
    // 1. Sync account-level insights
    await syncAccountMetrics(account);

    // 2. Sync media insights for recent posts
    await syncMediaInsights(account);

    // 3. Update last synced timestamp
    await query(
      'UPDATE instagram_accounts SET last_synced_at = NOW() WHERE id = $1',
      [account.id]
    );

    console.log(`[Instagram Insights Worker] Successfully synced account ${account.username}`);
  } catch (error) {
    console.error(`[Instagram Insights Worker] Error syncing account ${account.username}:`, error);
    throw error;
  }
}

/**
 * Sync account-level metrics (followers, reach, impressions)
 */
async function syncAccountMetrics(account: any): Promise<void> {
  try {
    // Get account insights from Instagram API
    const metrics = ['follower_count', 'reach', 'impressions', 'profile_views'];
    const period = 'day';
    const since = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60); // Last 7 days
    const until = Math.floor(Date.now() / 1000);

    const url = `https://graph.facebook.com/v18.0/${account.ig_business_id}/insights?metric=${metrics.join(',')}&period=${period}&since=${since}&until=${until}`;

    const data = await externalFetchJson<GraphApiResponse<{ data?: InstagramInsight[] }>>(url, {
      service: 'instagram',
      operation: 'insights.account',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${account.access_token}`,
      },
      cache: 'no-store',
      timeoutMs: 10_000,
      retry: { maxRetries: 1, retryMethods: ['GET'] },
    });

    if (data.error) {
      throw mapGraphError(data.error, 'insights.account');
    }

    // Parse insights
    const insights: AccountInsights = {
      follower_count: 0,
      reach: 0,
      impressions: 0,
      profile_views: 0,
    };

    if (data.data && Array.isArray(data.data)) {
      for (const insight of data.data) {
        const latestValue = insight.values?.[insight.values.length - 1]?.value || 0;
        
        switch (insight.name) {
          case 'follower_count':
            insights.follower_count = latestValue;
            break;
          case 'reach':
            insights.reach = latestValue;
            break;
          case 'impressions':
            insights.impressions = latestValue;
            break;
          case 'profile_views':
            insights.profile_views = latestValue;
            break;
        }
      }
    }

    // Update account with latest metrics
    await query(
      `UPDATE instagram_accounts 
       SET 
         followers_count = $1,
         account_insights = $2,
         updated_at = NOW()
       WHERE id = $3`,
      [
        insights.follower_count,
        JSON.stringify(insights),
        account.id
      ]
    );

    console.log(`[Instagram Insights Worker] Updated account metrics for ${account.username}`);
  } catch (error) {
    console.error(`[Instagram Insights Worker] Error syncing account metrics:`, error);
    // Don't throw - continue with media insights
  }
}

/**
 * Sync media insights for recent posts
 */
async function syncMediaInsights(account: any): Promise<void> {
  try {
    // Get recent media that needs insights update (last 30 days, not updated in last 6 hours)
    const mediaResult = await query(
      `SELECT id, ig_id, media_type
       FROM ig_media
       WHERE ig_account_id = $1
         AND created_at > NOW() - INTERVAL '30 days'
         AND (insights_updated_at IS NULL OR insights_updated_at < NOW() - INTERVAL '6 hours')
       ORDER BY created_at DESC
       LIMIT 25`,
      [account.id]
    );

    if (mediaResult.rows.length === 0) {
      console.log(`[Instagram Insights Worker] No media to update for ${account.username}`);
      return;
    }

    console.log(`[Instagram Insights Worker] Updating insights for ${mediaResult.rows.length} media items`);

    for (const media of mediaResult.rows) {
      try {
        await syncSingleMediaInsights(media, account.access_token);
        
        // Small delay to respect rate limits
        await sleep(500);
      } catch (error) {
        console.error(`[Instagram Insights Worker] Error syncing media ${media.ig_id}:`, error);
        // Continue with next media
      }
    }
  } catch (error) {
    console.error(`[Instagram Insights Worker] Error syncing media insights:`, error);
  }
}

/**
 * Sync insights for a single media item
 */
async function syncSingleMediaInsights(media: any, accessToken: string): Promise<void> {
  try {
    // Define metrics based on media type
    const metrics = media.media_type === 'VIDEO' 
      ? ['impressions', 'reach', 'engagement', 'saved', 'video_views', 'likes', 'comments', 'shares']
      : ['impressions', 'reach', 'engagement', 'saved', 'likes', 'comments', 'shares'];

    const url = `https://graph.facebook.com/v18.0/${media.ig_id}/insights?metric=${metrics.join(',')}`;

    const data = await externalFetchJson<GraphApiResponse<{ data?: InstagramInsight[] }>>(url, {
      service: 'instagram',
      operation: 'insights.media',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
      timeoutMs: 10_000,
      retry: { maxRetries: 1, retryMethods: ['GET'] },
    });

    if (data.error) {
      // If media is too old or insights not available, skip silently
      if (data.error.code === 10 || data.error.code === 100) {
        console.log(`[Instagram Insights Worker] Insights not available for media ${media.ig_id}`);
        return;
      }
      throw mapGraphError(data.error, 'insights.media');
    }

    // Parse insights
    const insights: MediaInsights = {
      impressions: 0,
      reach: 0,
      engagement: 0,
      saved: 0,
    };

    if (data.data && Array.isArray(data.data)) {
      for (const insight of data.data) {
        const value = insight.values?.[0]?.value || 0;
        
        switch (insight.name) {
          case 'impressions':
            insights.impressions = value;
            break;
          case 'reach':
            insights.reach = value;
            break;
          case 'engagement':
            insights.engagement = value;
            break;
          case 'saved':
            insights.saved = value;
            break;
          case 'video_views':
            insights.video_views = value;
            break;
          case 'likes':
            insights.likes = value;
            break;
          case 'comments':
            insights.comments = value;
            break;
          case 'shares':
            insights.shares = value;
            break;
        }
      }
    }

    // Update media with insights
    await query(
      `UPDATE ig_media 
       SET 
         metrics_json = $1,
         insights_updated_at = NOW(),
         updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(insights), media.id]
    );

    console.log(`[Instagram Insights Worker] Updated insights for media ${media.ig_id}`);
  } catch (error) {
    console.error(`[Instagram Insights Worker] Error syncing single media insights:`, error);
    throw error;
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run the worker (called by scheduler)
 */
export async function runInstagramInsightsWorker(): Promise<void> {
  try {
    await syncAllInstagramInsights();
  } catch (error) {
    console.error('[Instagram Insights Worker] Worker failed:', error);
    throw error;
  }
}
