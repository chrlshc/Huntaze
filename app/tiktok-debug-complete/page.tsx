'use client';

import { useState, useEffect } from 'react';

export default function TikTokDebugComplete() {
  const [appInfo, setAppInfo] = useState<any>(null);
  
  useEffect(() => {
    // Collect all relevant information
    const info = {
      environment: {
        currentUrl: window.location.href,
        origin: window.location.origin,
        ngrokUrl: 'https://9420261a1bcd.ngrok-free.app',
        port: '3001',
      },
      tiktokApp: {
        clientKey: 'sbawig5ujktghe109j',
        clientSecret: 'uXf6cwokWvnHI2C26LAx15Nn4SwUmKMK',
        redirectUris: [
          'https://9420261a1bcd.ngrok-free.app/auth/tiktok/callback',
          '9420261a1bcd.ngrok-free.app/auth/tiktok/callback',
          'https://9420261a1bcd.ngrok-free.app',
          '9420261a1bcd.ngrok-free.app'
        ],
        scopes: 'user.info.basic,video.upload,video.publish',
        appStatus: 'Testing/Sandbox',
      },
      possibleIssues: [
        'TikTok sandbox might not support ngrok URLs',
        'App might need to be in Production status',
        'Redirect URI format in TikTok settings might be wrong',
        'Client key might be for wrong environment',
        'Sandbox environment might be down'
      ]
    };
    setAppInfo(info);
  }, []);

  const testAuthUrls = [
    {
      name: 'Production URL with full redirect',
      url: `https://www.tiktok.com/v2/auth/authorize?client_key=sbawig5ujktghe109j&response_type=code&scope=user.info.basic,video.upload,video.publish&redirect_uri=${encodeURIComponent('https://9420261a1bcd.ngrok-free.app/auth/tiktok/callback')}&state=test123`
    },
    {
      name: 'Production URL with domain only redirect',
      url: `https://www.tiktok.com/v2/auth/authorize?client_key=sbawig5ujktghe109j&response_type=code&scope=user.info.basic,video.upload,video.publish&redirect_uri=${encodeURIComponent('https://9420261a1bcd.ngrok-free.app')}&state=test123`
    },
    {
      name: 'Without protocol in redirect',
      url: `https://www.tiktok.com/v2/auth/authorize?client_key=sbawig5ujktghe109j&response_type=code&scope=user.info.basic,video.upload,video.publish&redirect_uri=${encodeURIComponent('9420261a1bcd.ngrok-free.app/auth/tiktok/callback')}&state=test123`
    }
  ];

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="elevated-card p-6">
          <h1 className="text-2xl font-bold mb-6">TikTok OAuth Complete Debug</h1>
          
          {/* Current Configuration */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Current Configuration</h2>
            {appInfo && (
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
{JSON.stringify(appInfo, null, 2)}
              </pre>
            )}
          </div>

          {/* TikTok App Settings Instructions */}
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded p-6">
            <h2 className="text-lg font-semibold mb-4 text-yellow-800">⚠️ Critical TikTok App Settings</h2>
            <div className="space-y-3 text-sm text-yellow-700">
              <p className="font-semibold">In your TikTok Sandbox App, ensure:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Go to "Products" section and add "Login Kit"</li>
                <li>In Redirect URIs, try adding ONLY the domain without protocol:
                  <code className="block mt-1 bg-yellow-100 p-2 rounded">9420261a1bcd.ngrok-free.app</code>
                </li>
                <li>Or try with full URL:
                  <code className="block mt-1 bg-yellow-100 p-2 rounded">https://9420261a1bcd.ngrok-free.app/auth/tiktok/callback</code>
                </li>
                <li>Make sure your TikTok account is added as a test user</li>
                <li>Check if app status needs to be "Production" instead of "Testing"</li>
              </ol>
            </div>
          </div>

          {/* Test Different URL Formats */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Test Different OAuth URL Formats</h2>
            <div className="space-y-3">
              {testAuthUrls.map((test, index) => (
                <div key={index} className="border border-gray-200 rounded p-4">
                  <p className="font-medium mb-2">{test.name}</p>
                  <p className="text-xs text-gray-600 mb-3 break-all">{test.url}</p>
                  <button
                    onClick={() => window.location.href = test.url}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Test This Format
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Known Issues */}
          <div className="bg-red-50 border border-red-200 rounded p-6">
            <h2 className="text-lg font-semibold mb-4 text-red-800">Known TikTok OAuth Issues</h2>
            <ul className="space-y-2 text-sm text-red-700">
              <li>• TikTok doesn\'t support localhost or ports in redirect URIs</li>
              <li>• Sandbox environment might require production app status</li>
              <li>• Some developers report needing to remove protocol from redirect URI in settings</li>
              <li>• The error "Something went wrong" is often misleading - usually redirect URI issue</li>
              <li>• TikTok sandbox DNS might be temporarily down</li>
            </ul>
          </div>

          {/* Alternative Solution */}
          <div className="bg-blue-50 border border-blue-200 rounded p-6">
            <h2 className="text-lg font-semibold mb-4 text-blue-800">Alternative Solution</h2>
            <p className="text-sm text-blue-700 mb-3">
              If sandbox continues to fail, you might need to:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
              <li>Deploy to a staging environment with a real domain</li>
              <li>Use a Chrome extension like "Requestly" to redirect callbacks to localhost</li>
              <li>Submit app for production approval</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
