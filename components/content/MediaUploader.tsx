'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle, AlertCircle, Loader2, Image, File } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatBytes } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

interface MediaUploaderProps {
  onUploadComplete?: (files: { url: string; key: string; type: string }[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  accept?: Record<string, string[]>;
}

export function MediaUploader({ 
  onUploadComplete, 
  maxFiles = 10,
  maxSize = 50,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'video/*': ['.mp4', '.mov', '.avi', '.webm'],
  }
}: MediaUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (uploadFile: UploadFile) => {
    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
      ));

      // Get presigned URL
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: uploadFile.file.name,
          contentType: uploadFile.file.type,
          fileSize: uploadFile.file.size,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { presignedUrl, key } = await response.json();

      // Upload to S3
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: uploadFile.file,
        headers: {
          'Content-Type': uploadFile.file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Update file status
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'completed', progress: 100, url: presignedUrl.split('?')[0] }
          : f
      ));

      return { url: presignedUrl.split('?')[0], key, type: uploadFile.file.type };
    } catch (error: any) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', error: error.message }
          : f
      ));
      throw error;
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending' as const,
    }));

    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
  }, [maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: maxSize * 1024 * 1024,
    maxFiles: maxFiles - files.length,
  });

  const handleUploadAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setUploading(true);
    const uploadedFiles: any[] = [];

    try {
      // Upload files in parallel (max 3 at a time)
      const batchSize = 3;
      for (let i = 0; i < pendingFiles.length; i += batchSize) {
        const batch = pendingFiles.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(file => uploadFile(file))
        );
        uploadedFiles.push(...results);
      }

      if (onUploadComplete) {
        onUploadComplete(uploadedFiles);
      }
    } catch (error) {
      console.error('Batch upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image;
    return File;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-lg">Drop files here...</p>
          ) : (
            <>
              <p className="text-lg mb-2">Drag & drop files here, or click to select</p>
              <p className="text-sm text-gray-500">
                Max {maxFiles} files, up to {maxSize}MB each
              </p>
            </>
          )}
        </div>

        {files.length > 0 && (
          <>
            <div className="mt-6 space-y-2">
              {files.map((uploadFile) => {
                const FileIcon = getFileIcon(uploadFile.file);
                
                return (
                  <div
                    key={uploadFile.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900"
                  >
                    <FileIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {uploadFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatBytes(uploadFile.file.size)}
                      </p>
                      
                      {uploadFile.status === 'uploading' && (
                        <Progress value={uploadFile.progress} className="h-1 mt-1" />
                      )}
                      
                      {uploadFile.error && (
                        <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {uploadFile.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadFile.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {uploadFile.status === 'uploading' && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      )}
                      
                      {uploadFile.status === 'completed' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      
                      {uploadFile.status === 'error' && (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              className="w-full mt-4"
              onClick={handleUploadAll}
              disabled={uploading || files.filter(f => f.status === 'pending').length === 0}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {files.filter(f => f.status === 'pending').length} Files
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}