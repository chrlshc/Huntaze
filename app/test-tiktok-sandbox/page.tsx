"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, X, AlertCircle, Loader2 } from 'lucide-react';

export default function TikTokSandboxTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const isSandbox = process.env.NEXT_PUBLIC_TIKTOK_SANDBOX_MODE === 'true';
  const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || 'https://huntaze.com/auth/tiktok/callback';

  const runTests = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Test 1: Check environment variables
      const envCheck = {
        clientKey: !!clientKey,
        clientSecret: !!process.env.TIKTOK_CLIENT_SECRET,
        redirectUri: !!redirectUri,
        sandboxMode: isSandbox
      };

      // Test 2: Check OAuth URL generation
      const oauthUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&response_type=code&scope=user.info.basic,video.publish&redirect_uri=${encodeURIComponent(redirectUri)}&state=test123`;

      // Test 3: Test API endpoint
      const apiTest = await fetch('/api/tiktok/test-auth');
      const apiData = await apiTest.json();

      // Test 4: Check sandbox endpoints
      const sandboxEndpoints = {
        auth: isSandbox ? 'https://sandbox.tiktok.com' : 'https://www.tiktok.com',
        api: isSandbox ? 'https://open-sandbox.tiktok.com' : 'https://open.tiktokapis.com'
      };

      setResults({
        envCheck,
        oauthUrl,
        apiData,
        sandboxEndpoints,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testOAuth = () => {
    if (!clientKey) {
      alert('TikTok Client Key not configured');
      return;
    }

    const scopes = 'user.info.basic,video.publish';
    const state = 'test_' + Date.now();
    const url = `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&response_type=code&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    
    window.open(url, '_blank', 'width=500,height=700');
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">TikTok Sandbox Test</h1>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Current Configuration
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Mode:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              isSandbox ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
            }`}>
              {isSandbox ? 'SANDBOX' : 'PRODUCTION'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Client Key:</span>
            <span className="font-mono text-xs">
              {clientKey ? `${clientKey.substring(0, 10)}...` : 'NOT SET'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Redirect URI:</span>
            <span className="font-mono text-xs">{redirectUri}</span>
          </div>
        </div>
      </Card>

      <div className="flex gap-4 mb-6">
        <Button onClick={runTests} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run Configuration Tests'
          )}
        </Button>
        <Button onClick={testOAuth} variant="outline">
          Test OAuth Flow
        </Button>
      </div>

      {error && (
        <Card className="p-4 mb-6 border-red-200 bg-red-50">
          <p className="text-red-800 text-sm">{error}</p>
        </Card>
      )}

      {results && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Environment Check</h3>
            <div className="space-y-2">
              {Object.entries(results.envCheck).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  {value ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    {key}: {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">OAuth URL</h3>
            <code className="text-xs bg-gray-100 p-2 rounded block overflow-x-auto">
              {results.oauthUrl}
            </code>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">API Test Response</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(results.apiData, null, 2)}
            </pre>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Endpoints</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Auth:</span> {results.sandboxEndpoints.auth}
              </div>
              <div>
                <span className="font-medium">API:</span> {results.sandboxEndpoints.api}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}