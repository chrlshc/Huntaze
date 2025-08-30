'use client';

import { useState } from 'react';

export default function TestTikTokFinal() {
  const [copied, setCopied] = useState('');
  
  const redirectUris = [
    'https://9420261a1bcd.ngrok-free.app',
    'https://9420261a1bcd.ngrok-free.app/',
    'https://9420261a1bcd.ngrok-free.app/auth/tiktok/callback'
  ];
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(''), 2000);
  };
  
  const testOAuth = () => {
    const clientKey = 'sbawig5ujktghe109j';
    const redirectUri = encodeURIComponent('https://9420261a1bcd.ngrok-free.app/auth/tiktok/callback');
    const state = Math.random().toString(36).substring(7);
    const scope = 'user.info.basic,video.upload,video.publish';
    
    const authUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`;
    
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-6">TikTok OAuth Configuration</h1>
        
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded p-4">
          <h2 className="font-semibold text-blue-900 mb-3">Add these Redirect URIs to TikTok:</h2>
          <div className="space-y-2">
            {redirectUris.map((uri, index) => (
              <div key={index} className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border text-sm">{uri}</code>
                <button
                  onClick={() => copyToClipboard(uri)}
                  className={`px-3 py-2 text-sm rounded transition-colors ${
                    copied === uri 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {copied === uri ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded p-4">
          <h2 className="font-semibold text-yellow-900 mb-2">Important:</h2>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Add ALL three URIs above to your TikTok app</li>
            <li>• Make sure each starts with https://</li>
            <li>• Click "Apply changes" after adding them</li>
            <li>• Wait a few seconds for changes to propagate</li>
          </ul>
        </div>
        
        <button
          onClick={testOAuth}
          className="w-full py-3 bg-gradient-to-r from-red-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Test TikTok OAuth
        </button>
        
        <div className="mt-4 text-center">
          <a 
            href="https://developers.tiktok.com/app/7539724928053250053/sandbox/7541713304406739000"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-600 hover:underline"
          >
            Open TikTok App Settings →
          </a>
        </div>
      </div>
    </div>
  );
}