'use client';

import { useState } from 'react';

export default function DebugTikTok() {
  const [response, setResponse] = useState<any>(null);
  
  const testTikTokRoute = async () => {
    try {
      const res = await fetch('/auth/tiktok', {
        redirect: 'manual'
      });
      
      setResponse({
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        redirected: res.redirected,
        url: res.url,
        location: res.headers.get('location')
      });
    } catch (error: any) {
      setResponse({ error: error.message });
    }
  };

  const directRedirect = () => {
    window.location.href = '/auth/tiktok';
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-2xl mx-auto elevated-card p-6">
        <h1 className="text-2xl font-bold mb-6">Debug TikTok OAuth</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold mb-2">Environment Variables:</h2>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
              {JSON.stringify({
                NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'not set',
                NEXT_PUBLIC_TIKTOK_REDIRECT_URI: process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || 'not set',
                hasTikTokKey: !!process.env.TIKTOK_CLIENT_KEY
              }, null, 2)}
            </pre>
          </div>

          <div className="space-x-4">
            <button
              onClick={testTikTokRoute}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test TikTok Route
            </button>
            
            <button
              onClick={directRedirect}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Direct Redirect
            </button>
            
            <a
              href="/auth/tiktok"
              className="inline-block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Normal Link
            </a>
          </div>

          {response && (
            <div>
              <h2 className="font-semibold mb-2">Response:</h2>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
