'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function RedditAuthPage() {
  const searchParams = useSearchParams();
  
  const handleRedditAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID || 'YOUR_CLIENT_ID';
    const redirectUri = process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI || 'http://localhost:3001/auth/reddit/callback';
    const state = Math.random().toString(36).substring(7);
    
    // Save state for verification
    sessionStorage.setItem('reddit_oauth_state', state);
    
    const authUrl = `https://www.reddit.com/api/v1/authorize?${new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      state: state,
      redirect_uri: redirectUri,
      duration: 'permanent',
      scope: 'identity read submit'
    })}`;
    
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Connect Reddit</h1>
          <p className="text-gray-600 mb-6">
            Connect your Reddit account to import your communities and content
          </p>
          
          <button
            onClick={handleRedditAuth}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Connect with Reddit
          </button>
          
          <p className="mt-4 text-sm text-gray-500">
            You'll be redirected to Reddit to authorize access
          </p>
        </div>
      </div>
    </div>
  );
}