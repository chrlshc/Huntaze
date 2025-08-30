'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DebugTikTokConnection() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const router = useRouter();
  
  useEffect(() => {
    loadDebugInfo();
  }, []);
  
  const loadDebugInfo = async () => {
    try {
      // Get debug info
      const debugResponse = await fetch('/api/debug-tiktok');
      const debug = await debugResponse.json();
      setDebugInfo(debug);
      
      // Get TikTok user info
      const userResponse = await fetch('/api/tiktok/user');
      const userData = userResponse.ok ? await userResponse.json() : { error: 'Not authenticated' };
      
      setDashboardData({
        apiResponse: userData,
        status: userResponse.status
      });
    } catch (error: any) {
      setDebugInfo({ error: error.message });
    }
  };
  
  const connectTikTok = () => {
    window.location.href = '/auth/tiktok';
  };
  
  const clearAndReconnect = async () => {
    await fetch('/api/tiktok/disconnect', { method: 'POST' });
    setTimeout(() => {
      window.location.href = '/auth/tiktok';
    }, 500);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">TikTok Connection Debug</h1>
          
          {/* Current Status */}
          <div className="mb-8 p-4 bg-gray-50 rounded">
            <h2 className="font-semibold mb-2">Current Status:</h2>
            {debugInfo && (
              <div className="text-sm">
                <p>Access Token: {debugInfo.hasAccessToken ? '✅ Present' : '❌ Missing'}</p>
                <p>User Cookie: {debugInfo.hasUserCookie ? '✅ Present' : '❌ Missing'}</p>
                {debugInfo.userData && (
                  <p>User: {debugInfo.userData.display_name || 'No name'}</p>
                )}
              </div>
            )}
          </div>
          
          {/* Debug Info */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Debug Info:</h3>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
{JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Dashboard API Response:</h3>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
{JSON.stringify(dashboardData, null, 2)}
              </pre>
            </div>
          </div>
          
          {/* Actions */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={connectTikTok}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Connect TikTok
            </button>
            
            <button
              onClick={clearAndReconnect}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Clear & Reconnect
            </button>
            
            <button
              onClick={loadDebugInfo}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Refresh
            </button>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Go to Dashboard
            </button>
          </div>
          
          {/* Instructions */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-semibold text-yellow-900 mb-2">Debugging Steps:</h3>
            <ol className="list-decimal list-inside text-sm text-yellow-800 space-y-1">
              <li>Click "Clear & Reconnect" to start fresh</li>
              <li>Authorize TikTok when prompted</li>
              <li>Check the terminal logs for any errors</li>
              <li>Return here to see if cookies were set</li>
              <li>If cookies are present but dashboard shows nothing, the issue is in the dashboard component</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}