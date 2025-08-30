'use client';

import { useState } from 'react';

export default function TestOAuthRoute() {
  const [response, setResponse] = useState<any>(null);
  
  const testRoute = async () => {
    try {
      const res = await fetch('/auth/tiktok', {
        method: 'GET',
        redirect: 'manual'
      });
      
      const locationHeader = res.headers.get('location');
      
      setResponse({
        status: res.status,
        statusText: res.statusText,
        location: locationHeader,
        headers: Object.fromEntries(res.headers.entries()),
        type: res.type,
        redirected: res.redirected,
        url: res.url
      });
    } catch (error: any) {
      setResponse({ error: error.message, stack: error.stack });
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Test OAuth Route</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold mb-2">Test Methods:</h2>
            <div className="space-x-4">
              <button
                onClick={testRoute}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Test Fetch
              </button>
              
              <a
                href="/auth/tiktok"
                className="inline-block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Direct Link
              </a>
              
              <button
                onClick={() => window.location.href = '/auth/tiktok'}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Window Location
              </button>
            </div>
          </div>

          {response && (
            <div>
              <h2 className="font-semibold mb-2">Response:</h2>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
          
          <div>
            <h2 className="font-semibold mb-2">Expected Behavior:</h2>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Status: 308 (Permanent Redirect)</li>
              <li>• Location header should contain TikTok OAuth URL</li>
              <li>• URL should start with: https://open-sandbox.tiktok.com/v2/auth/authorize</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> If the route returns a 500 error, check that TIKTOK_CLIENT_KEY is set in environment variables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}