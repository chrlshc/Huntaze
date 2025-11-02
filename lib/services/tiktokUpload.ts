/**
 * TikTok Upload Service
 * 
 * Handles TikTok Content Posting API:
 * - FILE_UPLOAD: Chunked upload to TikTok
 * - PULL_FROM_URL: TikTok pulls from URL
 * - Rate limiting (6 req/min)
 * - Quota management (5 pending/24h)
 * 
 * @see https://developers.tiktok.com/doc/content-posting-api-get-started
 */

// TikTok Content Posting API endpoints
const TIKTOK_API_BASE = 'https://open.tiktokapis.com';
const INIT_UPLOAD_URL = `${TIKTOK_API_BASE}/v2/post/publish/inbox/video/init/`;
const QUERY_STATUS_URL = `${TIKTOK_API_BASE}/v2/post/publish/status/fetch/`;

// Rate limiting: 6 requests per minute per access_token
const RATE_LIMIT_PER_MINUTE = 6;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// Quota: Maximum 5 pending shares per 24 hours
const MAX_PENDING_SHARES = 5;

export type UploadSource = 'FILE_UPLOAD' | 'PULL_FROM_URL';

export type UploadStatus = 
  | 'PROCESSING_UPLOAD' 
  | 'SEND_TO_USER_INBOX' 
  | 'PUBLISH_COMPLETE' 
  | 'FAILED';

export type PrivacyLevel = 
  | 'PUBLIC_TO_EVERYONE' 
  | 'MUTUAL_FOLLOW_FRIENDS' 
  | 'SELF_ONLY';

export interface InitUploadParams {
  accessToken: string;
  source: UploadSource;
  videoUrl?: string; // Required for PULL_FROM_URL
  postInfo: {
    title: string;
    privacy_level: PrivacyLevel;
    disable_duet?: boolean;
    disable_comment?: boolean;
    disable_stitch?: boolean;
    video_cover_timestamp_ms?: number;
  };
}

export interface InitUploadResponse {
  publish_id: string;
  upload_url?: string; // Only for FILE_UPLOAD
}

export interface UploadStatusResponse {
  status: UploadStatus;
  fail_reason?: string;
  publicaly_available_post_id?: string[];
}

export interface UploadChunkParams {
  uploadUrl: string;
  chunk: Buffer;
  chunkIndex: number;
  totalChunks: number;
}

/**
 * TikTok Upload Service
 */
export class TikTokUploadService {
  // Rate limiting tracker: Map<accessToken, timestamp[]>
  private rateLimitTracker = new Map<string, number[]>();

  /**
   * Initialize video upload
   * 
   * @param params - Upload parameters
   * @returns Publish ID and upload URL (for FILE_UPLOAD)
   */
  async initUpload(params: InitUploadParams): Promise<InitUploadResponse> {
    const { accessToken, source, videoUrl, postInfo } = params;

    // Check rate limit
    await this.checkRateLimit(accessToken);

    // Validate parameters
    if (source === 'PULL_FROM_URL' && !videoUrl) {
      throw new Error('videoUrl is required for PULL_FROM_URL mode');
    }

    // Build request body
    const body: any = {
      post_info: {
        title: postInfo.title,
        privacy_level: postInfo.privacy_level,
        disable_duet: postInfo.disable_duet ?? false,
        disable_comment: postInfo.disable_comment ?? false,
        disable_stitch: postInfo.disable_stitch ?? false,
      },
      source_info: {
        source: source,
      },
    };

    // Add video_cover_timestamp_ms if provided
    if (postInfo.video_cover_timestamp_ms !== undefined) {
      body.post_info.video_cover_timestamp_ms = postInfo.video_cover_timestamp_ms;
    }

    // Add video_url for PULL_FROM_URL
    if (source === 'PULL_FROM_URL' && videoUrl) {
      body.source_info.video_url = videoUrl;
    }

    // Make API request
    const response = await fetch(INIT_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Track rate limit
    this.trackRequest(accessToken);

    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw this.handleUploadError(response.status, errorData);
    }

    const data = await response.json();

    // Validate response
    if (data.error?.code) {
      throw this.handleUploadError(response.status, data);
    }

    if (!data.data?.publish_id) {
      throw new Error('Invalid response: missing publish_id');
    }

    return {
      publish_id: data.data.publish_id,
      upload_url: data.data.upload_url,
    };
  }

  /**
   * Upload video chunk (for FILE_UPLOAD mode)
   * 
   * @param params - Chunk upload parameters
   */
  async uploadChunk(params: UploadChunkParams): Promise<void> {
    const { uploadUrl, chunk, chunkIndex, totalChunks } = params;

    const chunkSize = chunk.length;
    const start = chunkIndex * chunkSize;
    const end = start + chunkSize - 1;
    const totalSize = totalChunks * chunkSize;

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Content-Length': chunkSize.toString(),
      },
      body: chunk as any, // Buffer is compatible with BodyInit
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chunk upload failed: ${response.status} ${errorText}`);
    }
  }

  /**
   * Get upload/publish status
   * 
   * @param publishId - Publish ID from initUpload
   * @param accessToken - Valid access token
   * @returns Upload status
   */
  async getStatus(publishId: string, accessToken: string): Promise<UploadStatusResponse> {
    // Check rate limit
    await this.checkRateLimit(accessToken);

    const response = await fetch(QUERY_STATUS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publish_id: publishId,
      }),
    });

    // Track rate limit
    this.trackRequest(accessToken);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Status query failed: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    if (data.error?.code) {
      throw new Error(`TikTok API error: ${data.error.code} - ${data.error.message}`);
    }

    if (!data.data?.status) {
      throw new Error('Invalid response: missing status');
    }

    return {
      status: data.data.status,
      fail_reason: data.data.fail_reason,
      publicaly_available_post_id: data.data.publicaly_available_post_id,
    };
  }

  /**
   * Check rate limit (6 requests per minute)
   * Throws error if rate limit exceeded
   */
  private async checkRateLimit(accessToken: string): Promise<void> {
    const now = Date.now();
    const requests = this.rateLimitTracker.get(accessToken) || [];

    // Remove requests older than 1 minute
    const recentRequests = requests.filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
    );

    if (recentRequests.length >= RATE_LIMIT_PER_MINUTE) {
      const oldestRequest = recentRequests[0];
      const waitTime = RATE_LIMIT_WINDOW_MS - (now - oldestRequest);
      
      throw new Error(
        `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`
      );
    }
  }

  /**
   * Track API request for rate limiting
   */
  private trackRequest(accessToken: string): void {
    const now = Date.now();
    const requests = this.rateLimitTracker.get(accessToken) || [];
    
    // Add current request
    requests.push(now);
    
    // Keep only recent requests
    const recentRequests = requests.filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
    );
    
    this.rateLimitTracker.set(accessToken, recentRequests);
  }

  /**
   * Handle TikTok API errors
   */
  private handleUploadError(status: number, errorData: any): Error {
    const errorCode = errorData.error?.code || 'unknown_error';
    const errorMessage = errorData.error?.message || 'Unknown error';

    switch (errorCode) {
      case 'access_token_invalid':
        return new Error('Access token is invalid or expired. Please reconnect your TikTok account.');
      
      case 'scope_not_authorized':
        return new Error('Missing required permissions. Please reconnect with video.upload scope.');
      
      case 'url_ownership_unverified':
        return new Error('Video URL ownership not verified. Please use a verified domain.');
      
      case 'rate_limit_exceeded':
        return new Error('Rate limit exceeded. Maximum 6 requests per minute.');
      
      case 'spam_risk_too_many_pending_share':
        return new Error(`Too many pending uploads. Maximum ${MAX_PENDING_SHARES} pending uploads per 24 hours.`);
      
      case 'invalid_param':
        return new Error(`Invalid parameters: ${errorMessage}`);
      
      case 'server_error':
        return new Error('TikTok server error. Please try again later.');
      
      default:
        return new Error(`TikTok API error (${errorCode}): ${errorMessage}`);
    }
  }

  /**
   * Clear rate limit tracker (for testing)
   */
  clearRateLimitTracker(): void {
    this.rateLimitTracker.clear();
  }
}

// Lazy instantiation pattern - create instance only when needed
let tiktokUploadInstance: TikTokUploadService | null = null;

function getTikTokUpload(): TikTokUploadService {
  if (!tiktokUploadInstance) {
    tiktokUploadInstance = new TikTokUploadService();
  }
  return tiktokUploadInstance;
}

// Export singleton instance (lazy)
export const tiktokUpload = {
  uploadVideo: (...args: Parameters<TikTokUploadService['uploadVideo']>) => getTikTokUpload().uploadVideo(...args),
  getPublishStatus: (...args: Parameters<TikTokUploadService['getPublishStatus']>) => getTikTokUpload().getPublishStatus(...args),
  clearRateLimitTracker: (...args: Parameters<TikTokUploadService['clearRateLimitTracker']>) => getTikTokUpload().clearRateLimitTracker(...args),
};
