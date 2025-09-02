'use client';

import { useState } from 'react';
import { Music } from 'lucide-react';

export default function TikTokAuthPage() {
  const [showInfo, setShowInfo] = useState(false);
  
  const handleTikTokAuth = () => {
    const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY || 'YOUR_CLIENT_KEY';
    const redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || 'https://huntaze.com/auth/tiktok/callback';
    const state = Math.random().toString(36).substring(7);
    const codeVerifier = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Save state and verifier for verification
    sessionStorage.setItem('tiktok_oauth_state', state);
    sessionStorage.setItem('tiktok_code_verifier', codeVerifier);
    
    // TikTok OAuth URL
    const authUrl = `https://www.tiktok.com/v2/auth/authorize?${new URLSearchParams({
      client_key: clientKey,
      response_type: 'code',
      scope: 'user.info.basic,user.info.stats,video.list',
      redirect_uri: redirectUri,
      state: state,
      code_challenge: codeVerifier,
      code_challenge_method: 'plain'
    })}`;
    
    window.location.href = authUrl;
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
            Link your TikTok account to track your content performance and engage with fans
          </p>
          
          <button
            onClick={handleTikTokAuth}
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-medium py-3 rounded-lg transition-all mb-4"
          >
            Connect with TikTok
          </button>
          
          <button
            onClick={() => setShowInfo(!showInfo)}
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
                We never post without your permission
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}