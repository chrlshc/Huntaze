'use client';

import { useState } from 'react';
import { Music } from 'lucide-react';

export default function TikTokAuthPage() {
  const [showInfo, setShowInfo] = useState(false);
  
  const handleTikTokAuth = async () => {
    const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY || 'YOUR_CLIENT_KEY';
    const appBase = process.env.NEXT_PUBLIC_APP_URL || 'https://app.huntaze.com';
    const redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || `${appBase}/auth/tiktok/callback`;
    const state = Math.random().toString(36).substring(7);
    const codeVerifier = generateCodeVerifier();

    // Save state and verifier for verification
    sessionStorage.setItem('tiktok_oauth_state', state);
    sessionStorage.setItem('tiktok_code_verifier', codeVerifier);

    const codeChallenge = await pkceS256(codeVerifier);

    // TikTok OAuth URL (v2)
    const authUrl = `https://www.tiktok.com/v2/auth/authorize?${new URLSearchParams({
      client_key: clientKey,
      response_type: 'code',
      scope: 'user.info.basic,user.info.stats,video.list,video.upload,video.publish',
      redirect_uri: redirectUri,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })}`;

    window.location.href = authUrl;
  };

  function generateCodeVerifier() {
    const arr = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(arr);
    } else {
      for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
    }
    return base64UrlEncode(arr);
  }

  async function pkceS256(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return base64UrlEncode(new Uint8Array(digest));
  }

  function base64UrlEncode(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

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
