/**
 * TikTok Dashboard Widget
 * 
 * Displays TikTok connection status, recent uploads, and quick actions
 * Can be embedded in dashboard or platform pages
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Video, Upload, TrendingUp, Eye, Heart, Share2, Loader, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface TikTokPost {
  id: number;
  publishId: string;
  title: string;
  status: 'PROCESSING_UPLOAD' | 'SEND_TO_USER_INBOX' | 'PUBLISH_COMPLETE' | 'FAILED';
  createdAt: string;
  metadata?: {
    publicaly_available_post_id?: string[];
  };
}

interface TikTokStats {
  total: number;
  processing: number;
  inbox: number;
  complete: number;
  failed: number;
}

interface ConnectionStatus {
  connected: boolean;
  displayName?: string;
  avatarUrl?: string;
}

export default function TikTokDashboardWidget() {
  const [status, setStatus] = useState<ConnectionStatus>({ connected: false });
  const [posts, setPosts] = useState<TikTokPost[]>([]);
  const [stats, setStats] = useState<TikTokStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check connection status
      const statusResponse = await fetch('/api/platforms/tiktok/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setStatus(statusData);

        if (statusData.connected) {
          // Load recent posts (would need an endpoint)
          // For now, we'll show a placeholder
          // const postsResponse = await fetch('/api/tiktok/posts?limit=5');
          // if (postsResponse.ok) {
          //   const postsData = await postsResponse.json();
          //   setPosts(postsData.posts);
          //   setStats(postsData.stats);
          // }
        }
      }
    } catch (err) {
      console.error('Failed to load TikTok data:', err);
      setError('Failed to load TikTok data');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your TikTok account?')) {
      return;
    }

    try {
      const response = await fetch('/api/platforms/tiktok/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setStatus({ connected: false });
        setPosts([]);
        setStats(null);
      } else {
        throw new Error('Disconnect failed');
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
      alert('Failed to disconnect TikTok account');
    }
  };

  const getStatusIcon = (postStatus: string) => {
    switch (postStatus) {
      case 'PUBLISH_COMPLETE':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'PROCESSING_UPLOAD':
      case 'SEND_TO_USER_INBOX':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'FAILED':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (postStatus: string) => {
    switch (postStatus) {
      case 'PUBLISH_COMPLETE':
        return 'Published';
      case 'PROCESSING_UPLOAD':
        return 'Processing';
      case 'SEND_TO_USER_INBOX':
        return 'In Inbox';
      case 'FAILED':
        return 'Failed';
      default:
        return postStatus;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!status.connected) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center mr-3">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">TikTok</h3>
            <p className="text-sm text-gray-500">Not connected</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Connect your TikTok account to upload videos and track performance.
        </p>
        <Link
          href="/platforms/connect/tiktok"
          className="block w-full px-4 py-2 bg-black text-white text-center rounded-lg hover:bg-gray-800 transition-colors"
        >
          Connect TikTok
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center mr-3">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">TikTok</h3>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <p className="text-sm text-gray-600">
                {status.displayName || 'Connected'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.processing + stats.inbox}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.complete}</div>
            <div className="text-xs text-gray-500">Published</div>
          </div>
        </div>
      )}

      {/* Recent Uploads */}
      {posts.length > 0 ? (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Uploads</h4>
          <div className="space-y-2">
            {posts.slice(0, 3).map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center flex-1 min-w-0">
                  {getStatusIcon(post.status)}
                  <span className="ml-2 text-sm text-gray-900 truncate">
                    {post.title}
                  </span>
                </div>
                <span className="ml-2 text-xs text-gray-500 whitespace-nowrap">
                  {getStatusText(post.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 text-center py-6 bg-gray-50 rounded-lg">
          <Video className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No uploads yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Upload your first video to get started
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/platforms/tiktok/upload"
          className="flex items-center justify-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Link>
        <button
          onClick={handleDisconnect}
          className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          Disconnect
        </button>
      </div>

      {/* View All Link */}
      <div className="mt-4 text-center">
        <Link
          href="/platforms/connect/tiktok"
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          View all settings →
        </Link>
      </div>
    </div>
  );
}
