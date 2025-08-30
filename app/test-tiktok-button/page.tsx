'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function TestTikTokButton() {
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()} - ${message}`]);
  };
  
  const testDirectNavigation = () => {
    addLog('Testing direct navigation to /auth/tiktok');
    window.location.href = '/auth/tiktok';
  };
  
  const testFetch = async () => {
    addLog('Testing fetch to /auth/tiktok');
    try {
      const response = await fetch('/auth/tiktok', {
        method: 'GET',
        redirect: 'manual'
      });
      addLog(`Response status: ${response.status}`);
      addLog(`Response type: ${response.type}`);
      const location = response.headers.get('location');
      if (location) {
        addLog(`Redirect location: ${location}`);
        window.location.href = location;
      }
    } catch (error: any) {
      addLog(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Test TikTok Button Behavior</h1>
        
        <div className="space-y-4">
          {/* Different button implementations */}
          <div className="border border-gray-200 rounded p-4">
            <h2 className="font-semibold mb-3">Method 1: Next.js Link</h2>
            <Link href="/auth/tiktok" className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
              Next.js Link to /auth/tiktok
            </Link>
          </div>
          
          <div className="border border-gray-200 rounded p-4">
            <h2 className="font-semibold mb-3">Method 2: Regular anchor tag</h2>
            <a href="/auth/tiktok" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Regular &lt;a&gt; to /auth/tiktok
            </a>
          </div>
          
          <div className="border border-gray-200 rounded p-4">
            <h2 className="font-semibold mb-3">Method 3: window.location.href</h2>
            <button
              onClick={testDirectNavigation}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              window.location to /auth/tiktok
            </button>
          </div>
          
          <div className="border border-gray-200 rounded p-4">
            <h2 className="font-semibold mb-3">Method 4: Fetch then redirect</h2>
            <button
              onClick={testFetch}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Fetch /auth/tiktok
            </button>
          </div>
          
          {/* Logs */}
          {logs.length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold mb-3">Logs:</h2>
              <div className="bg-gray-100 p-4 rounded text-xs font-mono">
                {logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}