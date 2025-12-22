/**
 * TikTok Direct Post Publisher
 * 
 * Publishes content to TikTok via the official Content Posting API.
 * 
 * Flow:
 * 1. POST /v2/post/publish/init/ → Initialize upload
 * 2. Upload video to TikTok servers (upload_url)
 * 3. POST /v2/post/publish/complete/ → Finalize post
 * 
 * Requirements:
 * - Approved app with video.publish scope
 * - User authorization
 * 
 * @see https://developers.tiktok.com/doc/content-posting-api-get-started
 */

import { externalFetch, externalFetchJson } from '@/lib/services/external/http';
import { ExternalServiceError } from '@/lib/services/external/errors';

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
  external_id: string;  // TikTok open_id
}

interface OAuthToken {
  access_token: string;
}

interface ContentAsset {
  id: string;
  storage_url: string;
  checksum_sha256?: string;
  duration_sec?: number;
}

type TikTokApiError = {
  code?: string;
  message?: string;
  log_id?: string;
};

// Database abstraction (implement with your actual DB)
const db = {
  async getPlatformPublication(id: string) {
    console.log(`[db] getPlatformPublication: ${id}`);
    return { id, content_item_id: 'mock', social_account_id: 'mock' };
  },
  async getSocialAccount(id: string): Promise<SocialAccount> {
    console.log(`[db] getSocialAccount: ${id}`);
    return { id, external_id: 'mock_open_id' };
  },
  async getValidAccessToken(accountId: string): Promise<OAuthToken> {
    console.log(`[db] getValidAccessToken: ${accountId}`);
    return { access_token: 'mock_token' };
  },
  async getContentItem(id: string): Promise<ContentItem> {
    console.log(`[db] getContentItem: ${id}`);
    return { id, caption: 'Test caption', hashtags: ['test'], asset_id: 'mock_asset' };
  },
  async getAsset(id: string): Promise<ContentAsset> {
    console.log(`[db] getAsset: ${id}`);
    return { id, storage_url: 'https://example.com/video.mp4' };
  },
  async addEvent(jobId: string, level: string, message: string, payload: Record<string, unknown> = {}) {
    console.log(`[event] [${level}] ${message}`, payload);
  },
  async updatePlatformStatus(pubId: string, status: string) {
    console.log(`[db] updatePlatformStatus: ${pubId} -> ${status}`);
  },
  async markPosted(pubId: string, remoteMediaId: string) {
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

function throwTikTokApiError(operation: string, error: TikTokApiError): never {
  let code: ExternalServiceError['code'] = 'BAD_REQUEST';
  if (error.code === 'access_token_invalid') code = 'UNAUTHORIZED';
  if (error.code === 'rate_limit_exceeded') code = 'RATE_LIMIT';

  throw new ExternalServiceError({
    service: 'tiktok',
    code,
    retryable: code === 'RATE_LIMIT',
    message: `${operation} failed: ${error.message || 'Unknown error'}`,
    details: { error },
  });
}

function buildCaption(item: ContentItem): string {
  const tags = (item.hashtags ?? [])
    .map((h: string) => (h.startsWith('#') ? h : `#${h}`))
    .join(' ');
  return [item.caption ?? '', tags].filter(Boolean).join(' ').trim();
}

/**
 * Initialize a TikTok video post.
 */
async function tiktokInitVideoPost(opts: {
  accessToken: string;
  caption: string;
  videoSize: number;
  videoDuration?: number;
}): Promise<{ publish_id: string; upload_url: string }> {
  // TikTok Content Posting API - Initialize
  // @see https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
  
  const json = await externalFetchJson<{
    data?: { publish_id: string; upload_url: string };
    error?: TikTokApiError;
  }>('https://open.tiktokapis.com/v2/post/publish/init/', {
    service: 'tiktok',
    operation: 'publish.init',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      post_info: {
        title: opts.caption.slice(0, 150), // TikTok title limit
        privacy_level: 'PUBLIC_TO_EVERYONE', // or 'FOLLOWER_OF_CREATOR', 'SELF_ONLY'
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: opts.videoSize,
        chunk_size: opts.videoSize, // Single chunk for simplicity
        total_chunk_count: 1,
      },
    }),
    cache: 'no-store',
    timeoutMs: 15_000,
    retry: { maxRetries: 0, retryMethods: ['POST'] },
  });
  
  if (json.error) {
    throwTikTokApiError('TikTok init', json.error);
  }
  if (!json.data) {
    throw new ExternalServiceError({
      service: 'tiktok',
      code: 'INVALID_RESPONSE',
      retryable: false,
      message: 'TikTok init returned no data',
      details: json,
    });
  }
  
  return {
    publish_id: json.data.publish_id,
    upload_url: json.data.upload_url,
  };
}

/**
 * Upload video from your storage to TikTok servers.
 */
async function uploadFromStorageToTikTok(
  storageUrl: string,
  uploadUrl: string,
  contentRangeHeader: string
): Promise<void> {
  // 1. Fetch video from your storage (S3/R2)
  const videoRes = await externalFetch(storageUrl, {
    service: 'storage',
    operation: 'video.fetch',
    method: 'GET',
    cache: 'no-store',
    timeoutMs: 30_000,
    retry: { maxRetries: 1, retryMethods: ['GET'] },
    throwOnHttpError: false,
  });
  if (!videoRes.ok) {
    throw new Error(`Failed to fetch video from storage: ${videoRes.status}`);
  }
  
  const videoBuffer = await videoRes.arrayBuffer();
  
  // 2. Upload to TikTok
  const uploadRes = await externalFetch(uploadUrl, {
    service: 'tiktok',
    operation: 'upload.put',
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': String(videoBuffer.byteLength),
      'Content-Range': contentRangeHeader,
    },
    body: videoBuffer,
    cache: 'no-store',
    timeoutMs: 30_000,
    retry: { maxRetries: 0, retryMethods: [] },
    throwOnHttpError: false,
  });
  
  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`TikTok upload failed: ${uploadRes.status} - ${errorText}`);
  }
}

/**
 * Finalize the TikTok video post.
 */
async function tiktokFinalizeVideoPost(opts: {
  accessToken: string;
  publishId: string;
}): Promise<{ video_id: string }> {
  // Poll for completion status
  const maxAttempts = 60; // 5 minutes with 5s intervals
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const json = await externalFetchJson<{
      data?: { status: string; video_id?: string; fail_reason?: string };
      error?: TikTokApiError;
    }>('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
      service: 'tiktok',
      operation: 'publish.status',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publish_id: opts.publishId,
      }),
      cache: 'no-store',
      timeoutMs: 10_000,
      retry: { maxRetries: 0, retryMethods: ['POST'] },
    });

    if (json.error) {
      throwTikTokApiError('TikTok status check', json.error);
    }
    if (!json.data) {
      throw new ExternalServiceError({
        service: 'tiktok',
        code: 'INVALID_RESPONSE',
        retryable: false,
        message: 'TikTok status check returned no data',
        details: json,
      });
    }

    const status = json.data.status;
    
    if (status === 'PUBLISH_COMPLETE' && json.data.video_id) {
      return { video_id: json.data.video_id };
    }
    
    if (status === 'FAILED') {
      throw new Error(`TikTok publish failed: ${json.data.fail_reason || 'Unknown reason'}`);
    }
    
    // Still processing, wait and retry
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  
  throw new Error('TikTok publish timed out');
}

/**
 * Get video size from storage URL.
 */
async function getVideoSize(storageUrl: string): Promise<number> {
  const res = await externalFetch(storageUrl, {
    service: 'storage',
    operation: 'video.head',
    method: 'HEAD',
    cache: 'no-store',
    timeoutMs: 10_000,
    retry: { maxRetries: 1, retryMethods: ['HEAD'] },
    throwOnHttpError: false,
  });
  const contentLength = res.headers.get('content-length');
  if (!contentLength) {
    throw new Error('Could not determine video size');
  }
  return parseInt(contentLength, 10);
}

/**
 * Publish a video to TikTok via Direct Post API.
 */
export async function publishTikTokDirectPost(ctx: PublishContext): Promise<void> {
  const pub = await db.getPlatformPublication(ctx.platformPublicationId);
  const account = await db.getSocialAccount(pub.social_account_id);
  const token = await db.getValidAccessToken(account.id);

  const item = await db.getContentItem(pub.content_item_id);
  const asset = await db.getAsset(item.asset_id);

  await db.addEvent(ctx.jobId, 'info', 'TikTok: starting Direct Post flow', { 
    openId: account.external_id 
  });

  // Get video size for initialization
  const videoSize = await getVideoSize(asset.storage_url);
  
  // 1) Initialize post
  let init: { publish_id: string; upload_url: string };
  try {
    init = await tiktokInitVideoPost({
      accessToken: token.access_token,
      caption: buildCaption(item),
      videoSize,
      videoDuration: asset.duration_sec,
    });
  } catch (error) {
    await db.addEvent(ctx.jobId, 'error', 'TikTok: init failed', formatExternalError(error));
    throw error;
  }

  await db.addEvent(ctx.jobId, 'info', 'TikTok: init done', { 
    uploadUrl: init.upload_url, 
    publishId: init.publish_id 
  });
  await db.updatePlatformStatus(pub.id, 'uploading');

  // 2) Upload video to TikTok
  const contentRange = `bytes 0-${videoSize - 1}/${videoSize}`;
  try {
    await uploadFromStorageToTikTok(asset.storage_url, init.upload_url, contentRange);
  } catch (error) {
    await db.addEvent(ctx.jobId, 'error', 'TikTok: upload failed', formatExternalError(error));
    throw error;
  }

  await db.addEvent(ctx.jobId, 'info', 'TikTok: upload complete, waiting for processing');
  await db.updatePlatformStatus(pub.id, 'processing');

  // 3) Wait for completion and get video ID
  let result: { video_id: string };
  try {
    result = await tiktokFinalizeVideoPost({
      accessToken: token.access_token,
      publishId: init.publish_id,
    });
  } catch (error) {
    await db.addEvent(ctx.jobId, 'error', 'TikTok: finalize failed', formatExternalError(error));
    throw error;
  }

  await db.addEvent(ctx.jobId, 'success', 'TikTok: posted', { 
    tiktokVideoId: result.video_id 
  });
  await db.markPosted(pub.id, result.video_id);
}
