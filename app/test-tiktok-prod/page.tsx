'use client';

import { useState } from 'react';

export default function TestTikTokProd() {
  const [loading, setLoading] = useState(false);
  
  const testTikTokOAuth = () => {
    setLoading(true);
    // Try with production URL instead of sandbox
    const clientKey = 'sbawig5ujktghe109j';
    const redirectUri = encodeURIComponent('https://9420261a1bcd.ngrok-free.app/auth/tiktok/callback');
    const state = Math.random().toString(36).substring(7);
    const scope = 'user.info.basic,video.upload,video.publish';
    
    // Using production URL
    const authUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`;
    
    console.log('Redirecting to:', authUrl);
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Test TikTok OAuth (Production URL)</h1>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-sm text-yellow-800">Testing with production URL since sandbox DNS seems down.</p>
          </div>
          
          <div className="bg-gray-50 rounded p-4 text-sm">
            <p className="font-semibold mb-2">Configuration:</p>
            <ul className="space-y-1 text-gray-600">
              <li>• Client Key: sbawig5ujktghe109j</li>
              <li>• Redirect: https://9420261a1bcd.ngrok-free.app/auth/tiktok/callback</li>
              <li>• URL: https://www.tiktok.com (production)</li>
            </ul>
          </div>
          
          <button
            onClick={testTikTokOAuth}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Redirecting...' : 'Test TikTok OAuth (Production)'}
          </button>
          
          <div className="text-center space-y-2">
            <a href="/test-tiktok-direct" className="block text-sm text-purple-600 hover:underline">
              Back to Sandbox Test
            </a>
            <a href="/dashboard" className="block text-sm text-purple-600 hover:underline">
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}