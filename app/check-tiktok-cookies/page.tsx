'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckTikTokCookies() {
  const [cookies, setCookies] = useState<any>({});
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  
  useEffect(() => {
    // Check cookies
    const allCookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as any);
    
    setCookies(allCookies);
    
    // Check TikTok user API
    checkTikTokUser();
  }, []);
  
  const checkTikTokUser = async () => {
    try {
      const response = await fetch('/api/tiktok/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser({ error: 'Not authenticated' });
      }
    } catch (error) {
      setUser({ error: error instanceof Error ? error.message : String(error) });
    }
  };
  
  const clearTikTokData = async () => {
    await fetch('/api/tiktok/disconnect', { method: 'POST' });
    router.refresh();
    checkTikTokUser();
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">TikTok Connection Status</h1>
          
          <div className="space-y-6">
            {/* Cookies */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Browser Cookies:</h2>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
{JSON.stringify(cookies, null, 2)}
              </pre>
            </div>
            
            {/* TikTok User */}
            <div>
              <h2 className="text-lg font-semibold mb-3">TikTok User API Response:</h2>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
{JSON.stringify(user, null, 2)}
              </pre>
            </div>
            
            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={checkTikTokUser}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Refresh Status
              </button>
              
              <button
                onClick={clearTikTokData}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Clear TikTok Data
              </button>
              
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Go to Dashboard
              </button>
            </div>
            
            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <p className="text-sm text-yellow-800">
                If you see "tiktok_access_token" in cookies but the API returns "Not authenticated", 
                the cookies might be httpOnly and not accessible from JavaScript.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}