'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Video, Hash, Send } from 'lucide-react';
import Link from 'next/link';

export default function TikTokUploadPage() {
  const router = useRouter();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is connected to TikTok
    const checkTikTokConnection = async () => {
      try {
        const response = await fetch('/api/tiktok/user');
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          // Not connected, redirect to dashboard
          router.push('/dashboard?error=tiktok_not_connected');
        }
      } catch (error) {
        console.error('Error checking TikTok connection:', error);
      }
    };

    checkTikTokConnection();
  }, [router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
    } else {
      alert('Please select a valid video file');
    }
  };

  const handleUpload = async () => {
    if (!videoFile || !caption.trim()) {
      alert('Please select a video and enter a caption');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading video to TikTok...');

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('caption', `${caption} ${hashtags}`);

    try {
      const response = await fetch('/api/tiktok/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadStatus('Video uploaded successfully!');
        setTimeout(() => {
          router.push('/dashboard?success=tiktok_video_uploaded');
        }, 2000);
      } else {
        setUploadStatus(`Error: ${data.error || 'Upload failed'}`);
      }
    } catch (error) {
      setUploadStatus('Error: Failed to upload video');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload to TikTok</h1>
          {user && (
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Posting as: @{user.display_name}
            </p>
          )}
        </div>

        {/* Upload Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          {/* Video Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Video File
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              {videoFile ? (
                <div className="space-y-2">
                  <Video className="w-12 h-12 text-green-500 mx-auto" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">{videoFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <button
                    onClick={() => setVideoFile(null)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Click to upload or drag and drop
                  </span>
                  <p className="text-xs text-gray-500 mt-1">MP4, MOV up to 50MB</p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Caption */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption for your video..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
              maxLength={2200}
            />
            <p className="text-xs text-gray-500 mt-1">{caption.length}/2200</p>
          </div>

          {/* Hashtags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Hash className="w-4 h-4 inline mr-1" />
              Hashtags
            </label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#fyp #viral #content"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Upload Status */}
          {uploadStatus && (
            <div className={`mb-6 p-4 rounded-lg ${
              uploadStatus.includes('Error') 
                ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' 
                : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            }`}>
              {uploadStatus}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleUpload}
            disabled={isUploading || !videoFile || !caption.trim()}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Publish to TikTok
              </>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-400 mb-2">
            TikTok Upload Guidelines
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Video must be between 1 second and 10 minutes</li>
            <li>• Supported formats: MP4, MOV</li>
            <li>• Maximum file size: 50MB</li>
            <li>• Use relevant hashtags to increase visibility</li>
          </ul>
        </div>
      </div>
    </div>
  );
}