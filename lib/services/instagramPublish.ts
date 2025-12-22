/**
 * Instagram Publish Service
 * 
 * Handles Instagram content publishing via Graph API
 * - Create media containers (photos, videos, carousels)
 * - Poll container status
 * - Publish containers to Instagram
 * 
 * @see https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 */

import { externalFetch } from '@/lib/services/external/http';
import { ExternalServiceError, mapHttpStatusToExternalCode } from '@/lib/services/external/errors';

const FACEBOOK_GRAPH_URL = 'https://graph.facebook.com/v18.0';

export type MediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL';
export type ContainerStatus = 'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED';

export interface CreateContainerParams {
  igUserId: string;
  accessToken: string;
  mediaType: MediaType;
  mediaUrl: string;
  caption?: string;
  locationId?: string;
  coverUrl?: string; // For videos
  isCarouselItem?: boolean; // For carousel children
}

export interface CreateContainerResponse {
  id: string; // Container ID
}

export interface ContainerStatusResponse {
  status_code: ContainerStatus;
  error_message?: string;
}

export interface PublishContainerParams {
  igUserId: string;
  containerId: string;
  accessToken: string;
}

export interface PublishContainerResponse {
  id: string; // Media ID (published post)
}

export interface CreateCarouselParams {
  igUserId: string;
  accessToken: string;
  children: Array<{
    mediaType: 'IMAGE' | 'VIDEO';
    mediaUrl: string;
    coverUrl?: string; // For videos
  }>;
  caption?: string;
  locationId?: string;
}

/**
 * Instagram Publish Service
 */
export class InstagramPublishService {
  private buildInstagramApiError(operation: string, status: number, data: any): ExternalServiceError {
    const { code, retryable } = mapHttpStatusToExternalCode(status);
    const message =
      data?.error?.message ||
      data?.error_message ||
      `Instagram API error (${status})`;

    return new ExternalServiceError({
      service: 'instagram',
      code,
      retryable,
      status,
      message,
      details: {
        operation,
        errorType: data?.error?.type,
        errorCode: data?.error?.code,
        fbTraceId: data?.error?.fbtrace_id,
      },
    });
  }

  /**
   * Create a single media container (photo or video)
   * 
   * @param params - Container creation parameters
   * @returns Container ID
   * @throws Error if creation fails
   */
  async createContainer(params: CreateContainerParams): Promise<CreateContainerResponse> {
    const {
      igUserId,
      accessToken,
      mediaType,
      mediaUrl,
      caption,
      locationId,
      coverUrl,
      isCarouselItem = false,
    } = params;

    // Build request body
    const body: Record<string, string> = {
      access_token: accessToken,
    };

    if (mediaType === 'IMAGE') {
      body.image_url = mediaUrl;
      if (!isCarouselItem && caption) {
        body.caption = caption;
      }
    } else if (mediaType === 'VIDEO') {
      body.media_type = 'VIDEO';
      body.video_url = mediaUrl;
      if (coverUrl) {
        body.thumb_offset = '0'; // Can be customized
      }
      if (!isCarouselItem && caption) {
        body.caption = caption;
      }
    }

    if (locationId && !isCarouselItem) {
      body.location_id = locationId;
    }

    if (isCarouselItem) {
      body.is_carousel_item = 'true';
    }

    const response = await externalFetch(`${FACEBOOK_GRAPH_URL}/${igUserId}/media`, {
      service: 'instagram',
      operation: 'createContainer',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      timeoutMs: 20_000,
      retry: { maxRetries: 0, retryMethods: [] },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error) {
      throw this.buildInstagramApiError('createContainer', response.status, data);
    }

    return { id: data.id };
  }

  /**
   * Create a carousel container with multiple items
   * 
   * @param params - Carousel creation parameters
   * @returns Container ID
   * @throws Error if creation fails
   */
  async createCarousel(params: CreateCarouselParams): Promise<CreateContainerResponse> {
    const { igUserId, accessToken, children, caption, locationId } = params;

    // Step 1: Create containers for each child item
    const childContainerIds: string[] = [];

    for (const child of children) {
      const childContainer = await this.createContainer({
        igUserId,
        accessToken,
        mediaType: child.mediaType,
        mediaUrl: child.mediaUrl,
        coverUrl: child.coverUrl,
        isCarouselItem: true,
      });
      childContainerIds.push(childContainer.id);
    }

    // Step 2: Create carousel container with children
    const body: Record<string, string> = {
      media_type: 'CAROUSEL',
      children: childContainerIds.join(','),
      access_token: accessToken,
    };

    if (caption) {
      body.caption = caption;
    }

    if (locationId) {
      body.location_id = locationId;
    }

    const response = await externalFetch(`${FACEBOOK_GRAPH_URL}/${igUserId}/media`, {
      service: 'instagram',
      operation: 'createCarousel',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      timeoutMs: 20_000,
      retry: { maxRetries: 0, retryMethods: [] },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error) {
      throw this.buildInstagramApiError('createCarousel', response.status, data);
    }

    return { id: data.id };
  }

  /**
   * Check container status
   * 
   * @param containerId - Container ID
   * @param accessToken - Valid access token
   * @returns Container status
   * @throws Error if status check fails
   */
  async getContainerStatus(
    containerId: string,
    accessToken: string
  ): Promise<ContainerStatusResponse> {
    const response = await externalFetch(
      `${FACEBOOK_GRAPH_URL}/${containerId}?fields=status_code&access_token=${accessToken}`,
      {
        service: 'instagram',
        operation: 'getContainerStatus',
        method: 'GET',
        cache: 'no-store',
        timeoutMs: 15_000,
        retry: { maxRetries: 2, retryMethods: ['GET'] },
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error) {
      throw this.buildInstagramApiError('getContainerStatus', response.status, data);
    }

    return {
      status_code: data.status_code as ContainerStatus,
      error_message: data.error_message,
    };
  }

  /**
   * Poll container status until finished or error
   * 
   * @param containerId - Container ID
   * @param accessToken - Valid access token
   * @param maxAttempts - Maximum polling attempts (default: 30)
   * @param intervalMs - Polling interval in milliseconds (default: 2000)
   * @returns Final container status
   * @throws Error if polling times out or container has error
   */
  async pollContainerStatus(
    containerId: string,
    accessToken: string,
    maxAttempts: number = 30,
    intervalMs: number = 2000
  ): Promise<ContainerStatusResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getContainerStatus(containerId, accessToken);

      if (status.status_code === 'FINISHED') {
        return status;
      }

      if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') {
        throw new Error(
          `Container ${status.status_code.toLowerCase()}: ${status.error_message || 'Unknown error'}`
        );
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error('Container status polling timed out');
  }

  /**
   * Publish container to Instagram
   * 
   * @param params - Publish parameters
   * @returns Published media ID
   * @throws Error if publish fails
   */
  async publishContainer(params: PublishContainerParams): Promise<PublishContainerResponse> {
    const { igUserId, containerId, accessToken } = params;
    const body = {
      creation_id: containerId,
      access_token: accessToken,
    };

    const response = await externalFetch(
      `${FACEBOOK_GRAPH_URL}/${igUserId}/media_publish`,
      {
        service: 'instagram',
        operation: 'publishContainer',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
        timeoutMs: 20_000,
        retry: { maxRetries: 0, retryMethods: [] },
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error) {
      throw this.buildInstagramApiError('publishContainer', response.status, data);
    }

    return { id: data.id };
  }

  /**
   * Complete publish flow: create container, poll status, publish
   * 
   * @param params - Container creation parameters
   * @returns Published media ID
   * @throws Error if any step fails
   */
  async publishMedia(params: CreateContainerParams): Promise<PublishContainerResponse> {
    // Step 1: Create container
    const container = await this.createContainer(params);

    // Step 2: Poll until finished
    await this.pollContainerStatus(container.id, params.accessToken);

    // Step 3: Publish
    return this.publishContainer({
      igUserId: params.igUserId,
      containerId: container.id,
      accessToken: params.accessToken,
    });
  }

  /**
   * Complete carousel publish flow
   * 
   * @param params - Carousel creation parameters
   * @returns Published media ID
   * @throws Error if any step fails
   */
  async publishCarousel(params: CreateCarouselParams): Promise<PublishContainerResponse> {
    // Step 1: Create carousel container
    const container = await this.createCarousel(params);

    // Step 2: Poll until finished
    await this.pollContainerStatus(container.id, params.accessToken);

    // Step 3: Publish
    return this.publishContainer({
      igUserId: params.igUserId,
      containerId: container.id,
      accessToken: params.accessToken,
    });
  }

  /**
   * Get published media details
   * 
   * @param mediaId - Published media ID
   * @param accessToken - Valid access token
   * @returns Media details
   */
  async getMediaDetails(
    mediaId: string,
    accessToken: string
  ): Promise<{
    id: string;
    media_type: string;
    media_url: string;
    permalink: string;
    timestamp: string;
    caption?: string;
  }> {
    const response = await externalFetch(
      `${FACEBOOK_GRAPH_URL}/${mediaId}?fields=id,media_type,media_url,permalink,timestamp,caption&access_token=${accessToken}`,
      {
        service: 'instagram',
        operation: 'getMediaDetails',
        method: 'GET',
        cache: 'no-store',
        timeoutMs: 15_000,
        retry: { maxRetries: 2, retryMethods: ['GET'] },
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error) {
      throw this.buildInstagramApiError('getMediaDetails', response.status, data);
    }

    return data;
  }
}

// Lazy instantiation pattern - create instance only when needed
let instagramPublishInstance: InstagramPublishService | null = null;

function getInstagramPublish(): InstagramPublishService {
  if (!instagramPublishInstance) {
    instagramPublishInstance = new InstagramPublishService();
  }
  return instagramPublishInstance;
}

// Export singleton instance (lazy)
export const instagramPublish = {
  publishCarousel: (...args: Parameters<InstagramPublishService['publishCarousel']>) => getInstagramPublish().publishCarousel(...args),
  publishMedia: (...args: Parameters<InstagramPublishService['publishMedia']>) => getInstagramPublish().publishMedia(...args),
  getMediaDetails: (...args: Parameters<InstagramPublishService['getMediaDetails']>) => getInstagramPublish().getMediaDetails(...args),
  createContainer: (...args: Parameters<InstagramPublishService['createContainer']>) => getInstagramPublish().createContainer(...args),
  publishContainer: (...args: Parameters<InstagramPublishService['publishContainer']>) => getInstagramPublish().publishContainer(...args),
};
