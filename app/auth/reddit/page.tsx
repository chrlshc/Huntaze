'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

export default function RedditAuthPage() {
  const searchParams = useSearchParams();

  const hasConfig = useMemo(() => {
    return Boolean(process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID && process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI);
  }, []);

  const handleRedditAuth = () => {
    if (!hasConfig) return;
    const plan = searchParams.get('plan') || sessionStorage.getItem('selectedPlan');
    const base = '/api/auth/reddit';
    const url = plan ? `${base}?plan=${encodeURIComponent(plan)}` : base;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Connect Reddit</h1>
          <p className="text-gray-600 mb-6">
            Connect your Reddit account to import your communities and content.
          </p>

          <button
            onClick={handleRedditAuth}
            disabled={!hasConfig}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
          >
            {hasConfig ? 'Connect with Reddit' : 'Reddit OAuth unavailable'}
          </button>

          <p className="mt-4 text-sm text-gray-500">
            {hasConfig
              ? "You'll be redirected to Reddit to authorize access."
              : 'Contact support to enable Reddit OAuth in this environment.'}
          </p>
        </div>
      </div>
    </div>
  );
}
