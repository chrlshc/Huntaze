'use client';

import { useState } from 'react';

export default function TestTikTokURL() {
  const [authUrl, setAuthUrl] = useState('');
  
  const generateURL = () => {
    const clientKey = 'sbawig5ujktghe109j';
    const redirectUri = 'https://9420261a1bcd.ngrok-free.app/auth/tiktok/callback';
    const state = Math.random().toString(36).substring(7);
    const scope = 'user.info.basic,video.upload,video.publish';
    
    // Using sandbox URL
    const baseUrl = 'https://open-sandbox.tiktok.com';
    const url = `${baseUrl}/v2/auth/authorize?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    
    setAuthUrl(url);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Test TikTok Sandbox OAuth URL</h1>
        
        <div className="space-y-4">
          <button
            onClick={generateURL}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Generate OAuth URL
          </button>
          
          {authUrl && (
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold mb-2">Generated URL:</h2>
                <div className="bg-gray-100 p-4 rounded">
                  <p className="text-xs break-all">{authUrl}</p>
                </div>
              </div>
              
              <div>
                <h2 className="font-semibold mb-2">URL Components:</h2>
                <div className="bg-gray-100 p-4 rounded text-sm">
                  <p><strong>Base:</strong> https://open-sandbox.tiktok.com/v2/auth/authorize</p>
                  <p><strong>Client Key:</strong> sbawig5ujktghe109j</p>
                  <p><strong>Redirect URI:</strong> https://9420261a1bcd.ngrok-free.app/auth/tiktok/callback</p>
                  <p><strong>Scopes:</strong> user.info.basic,video.upload,video.publish</p>
                </div>
              </div>
              
              <button
                onClick={() => window.location.href = authUrl}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-blue-500 text-white rounded-lg hover:opacity-90"
              >
                Test OAuth Flow with Sandbox URL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}