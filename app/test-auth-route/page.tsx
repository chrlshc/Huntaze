'use client';

import { useState } from 'react';

export default function TestAuthRoute() {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const testRoute = async () => {
    setLoading(true);
    try {
      const res = await fetch('/auth/tiktok', {
        method: 'GET',
        redirect: 'manual'
      });
      
      setResponse({
        status: res.status,
        statusText: res.statusText,
        type: res.type,
        redirected: res.redirected,
        url: res.url,
        location: res.headers.get('location'),
        headers: Object.fromEntries(res.headers.entries())
      });
    } catch (error: any) {
      setResponse({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Test /auth/tiktok Route</h1>
        
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={testRoute}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Fetch Route
            </button>
            
            <a
              href="/auth/tiktok"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-center"
            >
              Direct Link
            </a>
            
            <button
              onClick={() => window.location.href = '/auth/tiktok'}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              window.location
            </button>
          </div>
          
          {response && (
            <div>
              <h2 className="font-semibold mb-2">Response:</h2>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
{JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-sm text-yellow-800">
              If you get a 500 error, check that TIKTOK_CLIENT_KEY is set in your environment variables.
              If you get a 308 redirect, the route is working correctly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}