/**
 * Instagram Reels Publisher
 * 
 * Publishes content to Instagram Reels via the official Graph API.
 * 
 * Flow:
 * 1. POST /{ig-user-id}/media → Create container (media_type=REELS + video_url)
 * 2. GET /{container-id}?fields=status_code → Poll until FINISHED
 * 3. POST /{ig-user-id}/media_publish → Publish container
 * 
 * Requirements:
 * - video_url must be publicly accessible (signed URL from S3/R2)
 * - Valid access token with instagram_content_publish scope
 * 
 * @see https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media
 */

import { externalFetchJson } from '@/lib/services/external/http';
import { ExternalServiceError } from '@/lib/services/external/errors';

// TODO: Replace with your actual database module
// import { db } from '@/lib/db';

interface PublishContext {
  platformPublicationId: string;
  jobId: string;
}

interface ContentItem {
  id: string;
  caption: string | null;
  hashtags: string[] | null;
  asset_id: string;
}

interface SocialAccount {
  id: string;
  external_id: string;  // Instagram user ID
}

interface OAuthToken {
  access_token: string;
}

interface ContentAsset {
  id: string;
  storage_url: string;
}

type GraphApiError = {
  message?: string;
  code?: number;
  type?: string;
  error_subcode?: number;
};

// Database abstraction (implement with your actual DB)
const db = {
  async getPlatformPublication(id: string) {
    // TODO: SELECT * FROM platform_publications WHERE id = $1
    console.log(`[db] getPlatformPublication: ${id}`);
    return { id, content_item_id: 'mock', social_account_id: 'mock' };
  },
  async getSocialAccount(id: string): Promise<SocialAccount> {
    // TODO: SELECT * FROM social_accounts WHERE id = $1
    console.log(`[db] getSocialAccount: ${id}`);
    return { id, external_id: 'mock_ig_user_id' };
  },
  async getValidAccessToken(accountId: string): Promise<OAuthToken> {
    // TODO: SELECT * FROM oauth_tokens WHERE social_account_id = $1
    // Refresh if expires_at < NOW() + INTERVAL '5 minutes'
    console.log(`[db] getValidAccessToken: ${accountId}`);
    return { access_token: 'mock_token' };
  },
  async getContentItem(id: string): Promise<ContentItem> {
    // TODO: SELECT * FROM content_items WHERE id = $1
    console.log(`[db] getContentItem: ${id}`);
    return { id, caption: 'Test caption', hashtags: ['test'], asset_id: 'mock_asset' };
  },
  async getAsset(id: string): Promise<ContentAsset> {
    // TODO: SELECT * FROM content_assets WHERE id = $1
    console.log(`[db] getAsset: ${id}`);
    return { id, storage_url: 'https://example.com/video.mp4' };
  },
  async getPublicVideoUrl(assetId: string): Promise<string> {
    // TODO: Generate signed URL from S3/R2 with appropriate TTL
    console.log(`[db] getPublicVideoUrl: ${assetId}`);
    return 'https://your-cdn.com/video.mp4?signature=xxx';
  },
  async addEvent(jobId: string, level: string, message: string, payload: Record<string, unknown> = {}) {
    // TODO: INSERT INTO job_events (job_id, level, message, payload) VALUES ($1, $2, $3, $4)
    console.log(`[event] [${level}] ${message}`, payload);
  },
  async updatePlatformStatus(pubId: string, status: string) {
    // TODO: UPDATE platform_publications SET status = $2, updated_at = now() WHERE id = $1
    console.log(`[db] updatePlatformStatus: ${pubId} -> ${status}`);
  },
  async markPosted(pubId: string, remoteMediaId: string) {
    // TODO: UPDATE platform_publications SET status = 'posted', remote_media_id = $2, posted_at = now() WHERE id = $1
    console.log(`[db] markPosted: ${pubId} -> ${remoteMediaId}`);
  },
};

function formatExternalError(error: unknown): Record<string, unknown> {
  if (error instanceof ExternalServiceError) {
    return {
      code: error.code,
      status: error.status,
      message: error.message,
      retryable: error.retryable,
    };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: String(error) };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildCaption(item: ContentItem): string {
  const tags = (item.hashtags ?? [])
    .map((h: string) => (h.startsWith('#') ? h : `#${h}`))
    .join(' ');
  return [item.caption ?? '', tags].filter(Boolean).join('\n\n').trim();
}

function throwGraphApiError(operation: string, error: GraphApiError): never {
  const code = error?.code;
  const mappedCode = code === 190 ? 'UNAUTHORIZED' : 'BAD_REQUEST';
  throw new ExternalServiceError({
    service: 'instagram',
    code: mappedCode,
    retryable: false,
    message: `${operation} failed: ${error?.message || 'Unknown error'}`,
    details: { error },
  });
}

/**
 * Publish a Reel to Instagram via Graph API.
 */
export async function publishInstagramReel(ctx: PublishContext): Promise<void> {
  const pub = await db.getPlatformPublication(ctx.platformPublicationId);
  const account = await db.getSocialAccount(pub.social_account_id);
  const token = await db.getValidAccessToken(account.id);

  const item = await db.getContentItem(pub.content_item_id);
  const asset = await db.getAsset(item.asset_id);

  // IMPORTANT: Generate a publicly accessible URL (signed URL + cache-control)
  const videoUrl = await db.getPublicVideoUrl(asset.id);

  await db.addEvent(ctx.jobId, 'info', 'IG: creating REELS container', { videoUrl });

  // 1) Create container
  let createJson: { id?: string; error?: GraphApiError };
  try {
    createJson = await externalFetchJson(
      `https://graph.facebook.com/v22.0/${account.external_id}/media`,
      {
        service: 'instagram',
        operation: 'reels.create',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          media_type: 'REELS',
          video_url: videoUrl,
          caption: buildCaption(item),
          share_to_feed: 'true',
          access_token: token.access_token,
        }).toString(),
        cache: 'no-store',
        timeoutMs: 15_000,
        retry: { maxRetries: 0, retryMethods: ['POST'] },
      }
    );
  } catch (error) {
    await db.addEvent(ctx.jobId, 'error', 'IG: container creation failed', formatExternalError(error));
    throw error;
  }

  if (createJson.error) {
    await db.addEvent(ctx.jobId, 'error', 'IG: container creation failed', { error: createJson.error });
    throwGraphApiError('IG container creation', createJson.error);
  }
  if (!createJson.id) {
    await db.addEvent(ctx.jobId, 'error', 'IG: container creation failed', createJson);
    throw new ExternalServiceError({
      service: 'instagram',
      code: 'INVALID_RESPONSE',
      retryable: false,
      message: 'IG container creation returned no container ID',
      details: createJson,
    });
  }

  const containerId = createJson.id;
  await db.addEvent(ctx.jobId, 'info', 'IG: container created', { containerId });
  await db.updatePlatformStatus(pub.id, 'processing');

  // 2) Poll status until FINISHED or ERROR
  const deadline = Date.now() + 10 * 60_000; // 10 minutes max
  
  while (Date.now() < deadline) {
    await sleep(5000);

    const statusJson = await externalFetchJson<{ status_code?: string; status?: string; error?: GraphApiError }>(
      `https://graph.facebook.com/v22.0/${containerId}?fields=status_code&access_token=${encodeURIComponent(token.access_token)}`,
      {
        service: 'instagram',
        operation: 'reels.status',
        method: 'GET',
        cache: 'no-store',
        timeoutMs: 10_000,
        retry: { maxRetries: 1, retryMethods: ['GET'] },
      }
    );

    if (statusJson.error) {
      throwGraphApiError('IG container status', statusJson.error);
    }

    const status = statusJson.status_code;
    await db.addEvent(ctx.jobId, 'info', 'IG: container status', { status });

    if (status === 'FINISHED') break;
    if (status === 'ERROR') {
      throw new Error(`IG container processing error: ${JSON.stringify(statusJson)}`);
    }
    // Other statuses: IN_PROGRESS, EXPIRED
  }

  // 3) Publish
  await db.addEvent(ctx.jobId, 'info', 'IG: publishing container', { containerId });

  let publishJson: { id?: string; error?: GraphApiError };
  try {
    publishJson = await externalFetchJson(
      `https://graph.facebook.com/v22.0/${account.external_id}/media_publish`,
      {
        service: 'instagram',
        operation: 'reels.publish',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          creation_id: containerId,
          access_token: token.access_token,
        }).toString(),
        cache: 'no-store',
        timeoutMs: 15_000,
        retry: { maxRetries: 0, retryMethods: ['POST'] },
      }
    );
  } catch (error) {
    await db.addEvent(ctx.jobId, 'error', 'IG: publish failed', formatExternalError(error));
    throw error;
  }

  if (publishJson.error) {
    await db.addEvent(ctx.jobId, 'error', 'IG: publish failed', { error: publishJson.error });
    throwGraphApiError('IG publish', publishJson.error);
  }
  if (!publishJson.id) {
    await db.addEvent(ctx.jobId, 'error', 'IG: publish failed', publishJson);
    throw new ExternalServiceError({
      service: 'instagram',
      code: 'INVALID_RESPONSE',
      retryable: false,
      message: 'IG publish returned no media ID',
      details: publishJson,
    });
  }

  await db.addEvent(ctx.jobId, 'success', 'IG: posted', { igMediaId: publishJson.id });
  await db.markPosted(pub.id, publishJson.id);
}
