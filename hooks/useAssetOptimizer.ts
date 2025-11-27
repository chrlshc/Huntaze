/**
 * React Hook for Asset Optimization
 * Provides client-side interface for image optimization and upload
 */

'use client';

import { useState, useCallback } from 'react';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  assetMetadata?: any;
  error?: string;
}

export interface UseAssetOptimizerReturn {
  uploadImage: (file: File) => Promise<UploadResult>;
  isUploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
}

export function useAssetOptimizer(): UseAssetOptimizerReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(async (file: File): Promise<UploadResult> => {
    setIsUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('Image must be smaller than 10MB');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', file.name);

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            setProgress({
              loaded: event.loaded,
              total: event.total,
              percentage,
            });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve({
                success: true,
                assetMetadata: response.assetMetadata,
              });
            } catch (error) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        xhr.open('POST', '/api/assets/upload');
        xhr.send(formData);
      });

      const result = await uploadPromise;
      setProgress({ loaded: file.size, total: file.size, percentage: 100 });
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    uploadImage,
    isUploading,
    progress,
    error,
  };
}
