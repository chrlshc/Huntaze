'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Music } from 'lucide-react';

export default function TikTokAuthPage() {
  const [showInfo, setShowInfo] = useState(false);
  const searchParams = useSearchParams();

  const hasConfig = useMemo(() => {
    return Boolean(process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY && process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI);
  }, []);

  const handleTikTokAuth = () => {
    if (!hasConfig) return;
    const plan = searchParams.get('plan') || sessionStorage.getItem('selectedPlan');
    const base = '/api/auth/tiktok';
    const url = plan ? `${base}?plan=${encodeURIComponent(plan)}` : base;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 via-red-500 to-black">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold mb-2">Connect TikTok</h1>
          <p className="text-gray-600 mb-6">
            Link your TikTok account to track your content performance and engage with fans.
          </p>

          <button
            onClick={handleTikTokAuth}
            disabled={!hasConfig}
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-all mb-4"
          >
            {hasConfig ? 'Connect with TikTok' : 'TikTok OAuth unavailable'}
          </button>

          <button
            onClick={() => setShowInfo((prev) => !prev)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {showInfo ? 'Hide' : 'Show'} permissions
          </button>

          {showInfo && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left text-sm">
              <p className="font-medium mb-2">We'll request access to:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• Basic profile information</li>
                <li>• Account statistics (followers, likes)</li>
                <li>• Your public videos list</li>
                <li>• Engagement metrics</li>
              </ul>
              <p className="mt-3 text-xs text-gray-500">
                We never post without your permission.
              </p>
            </div>
          )}

          {!hasConfig && (
            <p className="mt-6 text-sm text-gray-500">
              Contact support to enable TikTok OAuth in this environment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
