'use client';

/**
 * TikTok Publish Hook
 * Phase 3: Client-side publishing with debouncing
 * 
 * Features:
 * - Debounced publishing (prevents double-click)
 * - Error handling
 * - Loading states
 * - Success callbacks
 */

import { useState, useCallback } from 'react';

export interface PublishVideoParams {
  videoFile: File;
  title: string;
  privacyLevel: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
  disableDuet?: boolean;
  disableComment?: boolean;
  disableStitch?: boolean;
}

export interface PublishResult {
  success: boolean;
  publishId?: string;
  error?: string;
}

/**
 * Hook to publish videos to TikTok with debouncing
 * 
 * @returns Publish function, loading state, and error
 * 
 * @example
 * ```tsx
 * const { publishVideo, isPublishing, error } = useTikTokPublish();
 * 
 * const handlePublish = async () => {
 *   const result = await publishVideo({
 *     videoFile: file,
 *     title: 'My awesome video!',
 *     privacyLevel: 'PUBLIC_TO_EVERYONE',
 *   });
 *   
 *   if (result.success) {
 *     toast.success('Video published!');
 *   }
 * };
 * ```
 */
export function useTikTokPublish() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Debounced publish function (prevents double-click)
  const publishVideo = useCallback(async (params: PublishVideoParams): Promise<PublishResult> => {
    // Prevent double-click
    if (isPublishing) {
      return { success: false, error: 'Already publishing' };
    }

    setIsPublishing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('video', params.videoFile);
      formData.append('title', params.title);
      formData.append('privacy_level', params.privacyLevel);
      
      if (params.disableDuet !== undefined) {
        formData.append('disable_duet', String(params.disableDuet));
      }
      if (params.disableComment !== undefined) {
        formData.append('disable_comment', String(params.disableComment));
      }
      if (params.disableStitch !== undefined) {
        formData.append('disable_stitch', String(params.disableStitch));
      }

      const response = await fetch('/api/tiktok/publish', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to publish video');
      }

      const data = await response.json();

      return {
        success: true,
        publishId: data.publish_id,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      setIsPublishing(false);
    }
  }, [isPublishing]);

  return {
    publishVideo,
    isPublishing,
    error,
  };
}
