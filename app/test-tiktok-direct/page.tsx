'use client';

import { useState } from 'react';

export default function TestTikTokDirect() {
  const [loading, setLoading] = useState(false);
  
  const testTikTokOAuth = () => {
    setLoading(true);
    // Force redirect to TikTok OAuth with sandbox URL
    const clientKey = 'sbawig5ujktghe109j';
    const redirectUri = encodeURIComponent('https://9420261a1bcd.ngrok-free.app/auth/tiktok/callback');
    const state = Math.random().toString(36).substring(7);
    const scope = 'user.info.basic,video.upload,video.publish';
    
    const authUrl = `https://open-sandbox.tiktok.com/v2/auth/authorize?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`;
    
    console.log('Redirecting to:', authUrl);
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Test TikTok OAuth Direct</h1>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-800">This will redirect directly to TikTok OAuth without going through the app routes.</p>
          </div>
          
          <div className="bg-gray-50 rounded p-4 text-sm">
            <p className="font-semibold mb-2">Configuration:</p>
            <ul className="space-y-1 text-gray-600">
              <li>• Client Key: sbawig5ujktghe109j</li>
              <li>• Redirect: https://9420261a1bcd.ngrok-free.app/auth/tiktok/callback</li>
              <li>• Sandbox Mode: Yes</li>
            </ul>
          </div>
          
          <button
            onClick={testTikTokOAuth}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Redirecting...' : 'Test TikTok OAuth'}
          </button>
          
          <div className="text-center">
            <a href="/dashboard" className="text-sm text-purple-600 hover:underline">
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}