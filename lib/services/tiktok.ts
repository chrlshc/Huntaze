import { cookies } from 'next/headers';

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

      const initResponse = await fetch(initUrl, {
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
      });

      const initData = await initResponse.json();
      
      if (!initResponse.ok || initData.error) {
        return { error: initData.error?.message || 'Failed to initialize upload' };
      }

      // Step 2: Upload video chunks
      const uploadUrl = initData.data.upload_url;
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Range': `bytes 0-${videoFile.size - 1}/${videoFile.size}`,
        },
        body: videoFile,
        cache: 'no-store',
      });

      if (!uploadResponse.ok) {
        return { error: 'Failed to upload video' };
      }

      // Step 3: Publish video
      const publishUrl = this.isSandbox
        ? 'https://open-sandbox.tiktok.com/v2/post/publish/video/complete/'
        : 'https://open-api.tiktok.com/v2/post/publish/video/complete/';

      const publishResponse = await fetch(publishUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publish_id: initData.data.publish_id,
          caption: caption,
          privacy_level: 'PUBLIC',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        }),
        cache: 'no-store',
      });

      const publishData = await publishResponse.json();
      
      if (!publishResponse.ok || publishData.error) {
        return { error: publishData.error?.message || 'Failed to publish video' };
      }

      return {
        publish_id: publishData.data.publish_id,
        upload_url: uploadUrl,
      };
    } catch (error) {
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
  getAuthUrl: (...args: Parameters<TikTokService['getAuthUrl']>) => getTikTokService().getAuthUrl(...args),
  handleCallback: (...args: Parameters<TikTokService['handleCallback']>) => getTikTokService().handleCallback(...args),
  getUserInfo: (...args: Parameters<TikTokService['getUserInfo']>) => getTikTokService().getUserInfo(...args),
  uploadVideo: (...args: Parameters<TikTokService['uploadVideo']>) => getTikTokService().uploadVideo(...args),
  disconnect: (...args: Parameters<TikTokService['disconnect']>) => getTikTokService().disconnect(...args),
};