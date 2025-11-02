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

    try {
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

      // Create container
      const response = await fetch(
        `${FACEBOOK_GRAPH_URL}/${igUserId}/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error?.message || `Container creation failed: ${response.status}`
        );
      }

      return { id: data.id };
    } catch (error) {
      console.error('Instagram create container error:', error);
      throw new Error(
        `Failed to create container: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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

    try {
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

      const response = await fetch(
        `${FACEBOOK_GRAPH_URL}/${igUserId}/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error?.message || `Carousel creation failed: ${response.status}`
        );
      }

      return { id: data.id };
    } catch (error) {
      console.error('Instagram create carousel error:', error);
      throw new Error(
        `Failed to create carousel: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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
    try {
      const response = await fetch(
        `${FACEBOOK_GRAPH_URL}/${containerId}?fields=status_code&access_token=${accessToken}`
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error?.message || `Status check failed: ${response.status}`
        );
      }

      return {
        status_code: data.status_code as ContainerStatus,
        error_message: data.error_message,
      };
    } catch (error) {
      console.error('Instagram get container status error:', error);
      throw new Error(
        `Failed to get container status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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

    try {
      const body = {
        creation_id: containerId,
        access_token: accessToken,
      };

      const response = await fetch(
        `${FACEBOOK_GRAPH_URL}/${igUserId}/media_publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error?.message || `Publish failed: ${response.status}`
        );
      }

      return { id: data.id };
    } catch (error) {
      console.error('Instagram publish container error:', error);
      throw new Error(
        `Failed to publish container: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Complete publish flow: create container, poll status, publish
   * 
   * @param params - Container creation parameters
   * @returns Published media ID
   * @throws Error if any step fails
   */
  async publishMedia(params: CreateContainerParams): Promise<PublishContainerResponse> {
    try {
      // Step 1: Create container
      const container = await this.createContainer(params);

      // Step 2: Poll until finished
      await this.pollContainerStatus(container.id, params.accessToken);

      // Step 3: Publish
      const published = await this.publishContainer({
        igUserId: params.igUserId,
        containerId: container.id,
        accessToken: params.accessToken,
      });

      return published;
    } catch (error) {
      console.error('Instagram publish media error:', error);
      throw new Error(
        `Failed to publish media: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Complete carousel publish flow
   * 
   * @param params - Carousel creation parameters
   * @returns Published media ID
   * @throws Error if any step fails
   */
  async publishCarousel(params: CreateCarouselParams): Promise<PublishContainerResponse> {
    try {
      // Step 1: Create carousel container
      const container = await this.createCarousel(params);

      // Step 2: Poll until finished
      await this.pollContainerStatus(container.id, params.accessToken);

      // Step 3: Publish
      const published = await this.publishContainer({
        igUserId: params.igUserId,
        containerId: container.id,
        accessToken: params.accessToken,
      });

      return published;
    } catch (error) {
      console.error('Instagram publish carousel error:', error);
      throw new Error(
        `Failed to publish carousel: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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
    try {
      const response = await fetch(
        `${FACEBOOK_GRAPH_URL}/${mediaId}?fields=id,media_type,media_url,permalink,timestamp,caption&access_token=${accessToken}`
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error?.message || `Failed to get media details: ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error('Instagram get media details error:', error);
      throw new Error(
        `Failed to get media details: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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
  publishPost: (...args: Parameters<InstagramPublishService['publishPost']>) => getInstagramPublish().publishPost(...args),
  publishStory: (...args: Parameters<InstagramPublishService['publishStory']>) => getInstagramPublish().publishStory(...args),
  publishReel: (...args: Parameters<InstagramPublishService['publishReel']>) => getInstagramPublish().publishReel(...args),
  getMediaDetails: (...args: Parameters<InstagramPublishService['getMediaDetails']>) => getInstagramPublish().getMediaDetails(...args),
};
