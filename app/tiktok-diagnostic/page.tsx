'use client';

import { useState, useEffect } from 'react';

export default function TikTokDiagnostic() {
  const [diagnostics, setDiagnostics] = useState<any>({});
  
  useEffect(() => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const redirect = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || `${appUrl}/auth/tiktok/callback`;
    const scopes = (process.env.TIKTOK_SCOPES as string) || 'user.info.basic';
    const clientKey = (process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY as string) || 'set TIKTOK_CLIENT_KEY';

    const state = Math.random().toString(36).slice(2);
    const redirectEnc = encodeURIComponent(redirect);
    const authUrlWww = `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&response_type=code&scope=${encodeURIComponent(scopes)}&redirect_uri=${redirectEnc}&state=${state}`;
    const authUrlSandbox = `https://open-sandbox.tiktok.com/v2/auth/authorize?client_key=${clientKey}&response_type=code&scope=${encodeURIComponent(scopes)}&redirect_uri=${redirectEnc}&state=${state}`;

    const diag = {
      environment: {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
        NEXT_PUBLIC_TIKTOK_REDIRECT_URI: process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || 'NOT SET',
        currentOrigin: window.location.origin,
        currentPath: window.location.pathname,
      },
      tiktokConfig: {
        clientKey,
        expectedRedirectUri: redirect,
        scopes,
      },
      authUrls: {
        www: authUrlWww,
        sandbox: authUrlSandbox,
      },
    } as any;

    setDiagnostics(diag);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="elevated-card p-6">
          <h1 className="text-2xl font-bold mb-6">TikTok OAuth Diagnostic</h1>
          
          <div className="space-y-6">
            {/* Environment Check */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h2 className="font-semibold text-lg mb-2">1. Environment Variables</h2>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
{JSON.stringify(diagnostics.environment, null, 2)}
              </pre>
            </div>

            {/* TikTok App Configuration */}
            <div className="border-l-4 border-green-500 pl-4">
              <h2 className="font-semibold text-lg mb-2">2. TikTok App Settings</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
                <p className="text-sm font-semibold text-yellow-800 mb-2">⚠️ IMPORTANT: Check these settings in your TikTok Sandbox App:</p>
                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                  <li>Client Key: <code className="bg-yellow-100 px-1">{diagnostics.tiktokConfig?.clientKey}</code></li>
                  <li>Redirect URI must be EXACTLY: 
                    <div className="mt-1">
                      <code className="bg-yellow-100 px-2 py-1 block break-all">{diagnostics.tiktokConfig?.expectedRedirectUri}</code>
                      <button 
                        onClick={() => copyToClipboard(diagnostics.tiktokConfig?.expectedRedirectUri || '')}
                        className="mt-2 text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
                      >
                        Copy Redirect URI
                      </button>
                    </div>
                  </li>
                  <li>App must be in "Testing" status</li>
                  <li>Your account must be added as a test user</li>
                </ul>
              </div>
            </div>

            {/* OAuth URL Test */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h2 className="font-semibold text-lg mb-2">3. OAuth URLs</h2>
              <div className="bg-gray-100 p-4 rounded space-y-4">
                <div>
                  <p className="text-xs font-semibold mb-2">WWW (recommended)</p>
                  <p className="text-xs break-all mb-2">{diagnostics.authUrls?.www}</p>
                  <div className="flex gap-2">
                    <button onClick={() => window.location.href = diagnostics.authUrls?.www} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Test WWW</button>
                    <button onClick={() => copyToClipboard(diagnostics.authUrls?.www)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Copy</button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-2">Sandbox (alt)</p>
                  <p className="text-xs break-all mb-2">{diagnostics.authUrls?.sandbox}</p>
                  <div className="flex gap-2">
                    <button onClick={() => window.location.href = diagnostics.authUrls?.sandbox} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Test Sandbox</button>
                    <button onClick={() => copyToClipboard(diagnostics.authUrls?.sandbox)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Copy</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="border-l-4 border-red-500 pl-4">
              <h2 className="font-semibold text-lg mb-2">4. Pre-flight Checklist</h2>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">ngrok is running on port 3000</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Next.js dev server is running on port 3000</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Redirect URI in TikTok app matches exactly (with /auth/tiktok/callback)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">App is in "Testing" status</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Your TikTok account is added as a test user</span>
                </label>
              </div>
            </div>

            {/* Common Issues */}
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <h3 className="font-semibold text-red-800 mb-2">Common Issues:</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• "Something went wrong" → Check redirect URI matches EXACTLY</li>
                <li>• "Invalid client" → Check client key/secret</li>
                <li>• "Access denied" → Add yourself as test user</li>
                <li>• Redirect to wrong URL → Update .env.local and restart Next.js</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
