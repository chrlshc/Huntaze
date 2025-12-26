import { cookies } from 'next/headers';
import { externalFetch, externalFetchJson } from '@/lib/services/external/http';
import {
  ExternalServiceError,
  isExternalServiceError,
} from '@/lib/services/external/errors';

export interface TikTokUser {
  id: string;
  display_name: string;
  avatar_url?: string;
}

export interface TikTokVideoUploadResponse {
  publish_id?: string;
  upload_url?: string;
  error?: string;
}

type TikTokApiError = {
  code?: string;
  message?: string;
  log_id?: string;
};

type TikTokInitResponse = {
  data?: {
    publish_id?: string;
    upload_url?: string;
  };
  error?: TikTokApiError;
};

type TikTokPublishResponse = {
  data?: {
    publish_id?: string;
  };
  error?: TikTokApiError;
};

export class TikTokService {
  private accessToken: string | null = null;
  private isSandbox: boolean;

  constructor() {
    this.isSandbox = process.env.TIKTOK_SANDBOX_MODE === 'true';
  }

  async getAccessToken(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('tiktok_access_token');
    return token?.value || null;
  }

  async getCurrentUser(): Promise<TikTokUser | null> {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('tiktok_user');
    
    if (!userCookie?.value) return null;
    
    try {
      return JSON.parse(userCookie.value);
    } catch {
      return null;
    }
  }

  async uploadVideo(videoFile: File, caption: string): Promise<TikTokVideoUploadResponse> {
    const token = await this.getAccessToken();
    if (!token) {
      return { error: 'Not authenticated with TikTok' };
    }

    try {
      // Step 1: Initialize upload
      const initUrl = this.isSandbox
        ? 'https://open-sandbox.tiktok.com/v2/post/publish/inbox/video/init/'
        : 'https://open-api.tiktok.com/v2/post/publish/inbox/video/init/';

      const initData = await externalFetchJson<TikTokInitResponse>(initUrl, {
        service: 'tiktok',
        operation: 'publish.init',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_info: {
            source: 'FILE_UPLOAD',
            video_size: videoFile.size,
            chunk_size: videoFile.size,
            total_chunk_count: 1,
          },
        }),
        cache: 'no-store',
        timeoutMs: 15_000,
        retry: { maxRetries: 0, retryMethods: [] },
      });

      if (initData.error) {
        throw new ExternalServiceError({
          service: 'tiktok',
          code: 'BAD_REQUEST',
          retryable: false,
          message: initData.error.message || 'Failed to initialize upload',
          details: { error: initData.error },
        });
      }

      // Step 2: Upload video chunks
      const uploadUrl = initData.data?.upload_url;
      const publishId = initData.data?.publish_id;
      if (!uploadUrl || !publishId) {
        throw new ExternalServiceError({
          service: 'tiktok',
          code: 'INVALID_RESPONSE',
          retryable: false,
          message: 'TikTok init response missing upload URL',
        });
      }

      await externalFetch(uploadUrl, {
        service: 'tiktok',
        operation: 'publish.upload',
        method: 'PUT',
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Range': `bytes 0-${videoFile.size - 1}/${videoFile.size}`,
        },
        body: videoFile,
        cache: 'no-store',
        timeoutMs: 60_000,
        retry: { maxRetries: 0, retryMethods: [] },
        throwOnHttpError: true,
      });

      // Step 3: Publish video
      const publishUrl = this.isSandbox
        ? 'https://open-sandbox.tiktok.com/v2/post/publish/video/complete/'
        : 'https://open-api.tiktok.com/v2/post/publish/video/complete/';

      const publishData = await externalFetchJson<TikTokPublishResponse>(publishUrl, {
        service: 'tiktok',
        operation: 'publish.complete',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publish_id: publishId,
          caption: caption,
          privacy_level: 'PUBLIC',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        }),
        cache: 'no-store',
        timeoutMs: 15_000,
        retry: { maxRetries: 0, retryMethods: [] },
      });

      if (publishData.error) {
        throw new ExternalServiceError({
          service: 'tiktok',
          code: 'BAD_REQUEST',
          retryable: false,
          message: publishData.error.message || 'Failed to publish video',
          details: { error: publishData.error },
        });
      }

      return {
        publish_id: publishData.data?.publish_id,
        upload_url: uploadUrl,
      };
    } catch (error) {
      if (isExternalServiceError(error)) {
        const message =
          error.code === 'RATE_LIMIT'
            ? 'TikTok rate limit reached. Please try again later'
            : 'TikTok service unavailable. Please try again later';
        return { error: message };
      }
      console.error('TikTok upload error:', error);
      return { error: 'An error occurred during upload' };
    }
  }

  async disconnect(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete('tiktok_access_token');
    cookieStore.delete('tiktok_user');
  }
}

// Lazy instantiation pattern - create instance only when needed
let tiktokServiceInstance: TikTokService | null = null;

function getTikTokService(): TikTokService {
  if (!tiktokServiceInstance) {
    tiktokServiceInstance = new TikTokService();
  }
  return tiktokServiceInstance;
}

// Export singleton instance (lazy)
export const tiktokService = {
  getAccessToken: (...args: Parameters<TikTokService['getAccessToken']>) => getTikTokService().getAccessToken(...args),
  getCurrentUser: (...args: Parameters<TikTokService['getCurrentUser']>) => getTikTokService().getCurrentUser(...args),
  uploadVideo: (...args: Parameters<TikTokService['uploadVideo']>) => getTikTokService().uploadVideo(...args),
  disconnect: (...args: Parameters<TikTokService['disconnect']>) => getTikTokService().disconnect(...args),
};
