'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { uploadMedia } from '@/hooks/useContent';
import { Button } from "@/components/ui/button";

interface UploadedMedia {
  id: string;
  url: string;
  type: string;
  name: string;
  size: number;
}

interface MediaUploadProps {
  onUploadComplete: (mediaIds: string[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSizeInMB?: number;
}

export function MediaUpload({
  onUploadComplete,
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*'],
  maxSizeInMB = 100,
}: MediaUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return `${file.name} is too large. Max size is ${maxSizeInMB}MB`;
    }

    // Check file type
    const fileType = file.type;
    const isAccepted = acceptedTypes.some((type) => {
      if (type.endsWith('/*')) {
        const baseType = type.split('/')[0];
        return fileType.startsWith(baseType + '/');
      }
      return fileType === type;
    });

    if (!isAccepted) {
      return `${file.name} is not an accepted file type`;
    }

    return null;
  }, [acceptedTypes, maxSizeInMB]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const newErrors: string[] = [];
      const validFiles: File[] = [];

      // Validate all files first
      Array.from(files).forEach((file) => {
        if (uploadedFiles.length + validFiles.length >= maxFiles) {
          newErrors.push(`Maximum ${maxFiles} files allowed`);
          return;
        }

        const error = validateFile(file);
        if (error) {
          newErrors.push(error);
        } else {
          validFiles.push(file);
        }
      });

      setErrors(newErrors);

      if (validFiles.length === 0) return;

      setUploading(true);

      // Upload files one by one
      const uploadedMedia: UploadedMedia[] = [];

      for (const file of validFiles) {
        try {
          // Simulate progress (in real app, use XMLHttpRequest for real progress)
          const fileId = `temp-${Date.now()}-${Math.random()}`;
          setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

          // Simulate progress updates
          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
              const current = prev[fileId] || 0;
              if (current >= 90) {
                clearInterval(progressInterval);
                return prev;
              }
              return { ...prev, [fileId]: current + 10 };
            });
          }, 200);

          // Upload file
          const result = await uploadMedia(file);

          clearInterval(progressInterval);
          setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));

          if (result.success && result.data) {
            uploadedMedia.push({
              id: result.data.mediaId || result.data.id,
              url: result.data.url,
              type: file.type,
              name: file.name,
              size: file.size,
            });
          }

          // Remove progress after a delay
          setTimeout(() => {
            setUploadProgress((prev) => {
              const newProgress = { ...prev };
              delete newProgress[fileId];
              return newProgress;
            });
          }, 1000);
        } catch (error) {
          console.error('Upload error:', error);
          newErrors.push(`Failed to upload ${file.name}`);
        }
      }

      setUploadedFiles((prev) => [...prev, ...uploadedMedia]);
      setUploading(false);
      setErrors(newErrors);

      // Notify parent component
      if (uploadedMedia.length > 0) {
        const allMediaIds = [...uploadedFiles, ...uploadedMedia].map((m) => m.id);
        onUploadComplete(allMediaIds);
      }
    },
    [uploadedFiles, maxFiles, onUploadComplete, validateFile]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleRemove = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
    const remainingIds = uploadedFiles.filter((f) => f.id !== id).map((f) => f.id);
    onUploadComplete(remainingIds);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    }
    if (type.startsWith('video/')) {
      return (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    );
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleChange}
          className="hidden"
          disabled={uploading || uploadedFiles.length >= maxFiles}
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {dragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-purple-600 hover:text-purple-700 font-medium"
                disabled={uploading || uploadedFiles.length >= maxFiles}
                type="button"
              >
                browse files
              </button>
            </p>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {acceptedTypes.includes('image/*') && 'Images'}
            {acceptedTypes.includes('image/*') && acceptedTypes.includes('video/*') && ' and '}
            {acceptedTypes.includes('video/*') && 'Videos'} up to {maxSizeInMB}MB
            {maxFiles > 1 && ` (max ${maxFiles} files)`}
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([id, progress]) => (
            <div key={id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">Uploading...</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                Upload Errors
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setErrors([])}
              className="text-red-400 hover:text-red-600 dark:hover:text-red-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Uploaded Files ({uploadedFiles.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="relative group bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                {/* Preview */}
                <div className="aspect-square flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                  {file.type.startsWith('image/') ? (
                    <Image
                      src={file.url}
                      alt={file.name}
                      width={512}
                      height={512}
                      className="w-full h-full object-cover"
                    />
                  ) : file.type.startsWith('video/') ? (
                    <video src={file.url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-400">{getFileIcon(file.type)}</div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemove(file.id)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
