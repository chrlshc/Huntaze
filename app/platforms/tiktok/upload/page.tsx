'use client';

/**
 * TikTok Upload Page
 * 
 * Allows users to upload videos to TikTok
 * Supports FILE_UPLOAD and PULL_FROM_URL modes
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, Link as LinkIcon, Video, AlertCircle, CheckCircle, Loader } from 'lucide-react';

type UploadMode = 'file' | 'url';
type PrivacyLevel = 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';

interface UploadStatus {
  uploading: boolean;
  progress: number;
  error?: string;
  success?: boolean;
  publishId?: string;
}

interface QuotaInfo {
  used: number;
  limit: number;
}

export default function TikTokUploadPage() {
  const router = useRouter();
  const [mode, setMode] = useState<UploadMode>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('PUBLIC_TO_EVERYONE');
  const [disableComments, setDisableComments] = useState(false);
  const [disableDuet, setDisableDuet] = useState(false);
  const [disableStitch, setDisableStitch] = useState(false);
  const [status, setStatus] = useState<UploadStatus>({
    uploading: false,
    progress: 0,
  });
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check connection status
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/platforms/tiktok/status');
      if (response.ok) {
        const data = await response.json();
        setConnected(data.connected);
      } else {
        setConnected(false);
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        setMode('file');
      } else {
        setStatus({
          ...status,
          error: 'Please select a video file',
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setStatus({ ...status, error: 'Title is required' });
      return;
    }

    if (mode === 'url' && !videoUrl.trim()) {
      setStatus({ ...status, error: 'Video URL is required' });
      return;
    }

    if (mode === 'file' && !videoFile) {
      setStatus({ ...status, error: 'Please select a video file' });
      return;
    }

    setStatus({
      uploading: true,
      progress: 0,
      error: undefined,
      success: false,
    });

    try {
      // Initialize upload
      const response = await fetch('/api/tiktok/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: mode === 'file' ? 'FILE_UPLOAD' : 'PULL_FROM_URL',
          videoUrl: mode === 'url' ? videoUrl : undefined,
          title,
          privacy_level: privacyLevel,
          disable_comment: disableComments,
          disable_duet: disableDuet,
          disable_stitch: disableStitch,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Upload failed');
      }

      const data = await response.json();

      // Update quota
      if (data.quota) {
        setQuota(data.quota);
      }

      // For FILE_UPLOAD mode, upload the file
      if (mode === 'file' && data.data.upload_url && videoFile) {
        await uploadFile(data.data.upload_url, videoFile);
      }

      setStatus({
        uploading: false,
        progress: 100,
        success: true,
        publishId: data.data.publish_id,
      });

      // Reset form
      setTimeout(() => {
        setTitle('');
        setVideoUrl('');
        setVideoFile(null);
        setStatus({ uploading: false, progress: 0 });
      }, 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setStatus({
        uploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    }
  };

  const uploadFile = async (uploadUrl: string, file: File) => {
    // Simple file upload (in production, implement chunked upload)
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              TikTok Not Connected
            </h2>
            <p className="text-gray-600 mb-4">
              Please connect your TikTok account before uploading videos.
            </p>
            <Link
              href="/platforms/connect/tiktok"
              className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Connect TikTok Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload to TikTok
          </h1>
          <p className="text-gray-600">
            Upload your video to TikTok directly from Huntaze
          </p>
        </div>

        {/* Quota Display */}
        {quota && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                Upload Quota
              </span>
              <span className="text-sm text-blue-700">
                {quota.used}/{quota.limit} pending uploads
              </span>
            </div>
            <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(quota.used / quota.limit) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Mode Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Upload Method
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMode('url')}
                className={`flex items-center justify-center px-4 py-3 border-2 rounded-lg transition-colors ${
                  mode === 'url'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <LinkIcon className="w-5 h-5 mr-2" />
                <span className="font-medium">From URL</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('file')}
                className={`flex items-center justify-center px-4 py-3 border-2 rounded-lg transition-colors ${
                  mode === 'file'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Upload className="w-5 h-5 mr-2" />
                <span className="font-medium">Upload File</span>
              </button>
            </div>
          </div>

          {/* Video Input */}
          {mode === 'url' ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video URL
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                disabled={status.uploading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter a direct link to your video file
              </p>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="video-upload"
                  disabled={status.uploading}
                />
                <label htmlFor="video-upload" className="cursor-pointer">
                  <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  {videoFile ? (
                    <p className="text-sm font-medium text-gray-900">
                      {videoFile.name}
                    </p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-900">
                        Click to upload video
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        MP4, MOV, AVI up to 2GB
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
              maxLength={150}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              disabled={status.uploading}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              {title.length}/150 characters
            </p>
          </div>

          {/* Privacy Level */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Privacy
            </label>
            <select
              value={privacyLevel}
              onChange={(e) => setPrivacyLevel(e.target.value as PrivacyLevel)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              disabled={status.uploading}
            >
              <option value="PUBLIC_TO_EVERYONE">Public</option>
              <option value="MUTUAL_FOLLOW_FRIENDS">Friends</option>
              <option value="SELF_ONLY">Private</option>
            </select>
          </div>

          {/* Options */}
          <div className="mb-6 space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={disableComments}
                onChange={(e) => setDisableComments(e.target.checked)}
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                disabled={status.uploading}
              />
              <span className="ml-2 text-sm text-gray-700">Disable comments</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={disableDuet}
                onChange={(e) => setDisableDuet(e.target.checked)}
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                disabled={status.uploading}
              />
              <span className="ml-2 text-sm text-gray-700">Disable duet</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={disableStitch}
                onChange={(e) => setDisableStitch(e.target.checked)}
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                disabled={status.uploading}
              />
              <span className="ml-2 text-sm text-gray-700">Disable stitch</span>
            </label>
          </div>

          {/* Status Messages */}
          {status.error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-sm text-red-700">{status.error}</p>
              </div>
            </div>
          )}

          {status.success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <p className="text-sm text-green-700">
                  Video uploaded successfully! It will appear in your TikTok inbox.
                </p>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {status.uploading && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Uploading...</span>
                <span className="text-sm text-gray-600">{status.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-black h-2 rounded-full transition-all"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status.uploading}
            className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {status.uploading ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Upload to TikTok
              </>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            href="/platforms/connect/tiktok"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to TikTok Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
