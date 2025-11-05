'use client';

/**
 * TikTok Connect Page
 * 
 * Allows users to connect their TikTok account via OAuth
 * Follows the same patterns as Instagram and Reddit connect pages
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TikTokConnectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Check for OAuth callback results
    if (!searchParams) return;
    
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    const successParam = searchParams.get('success');
    const usernameParam = searchParams.get('username');

    if (errorParam) {
      setError(getErrorMessage(errorParam, messageParam));
      setIsConnecting(false);
    } else if (successParam === 'true') {
      setSuccess(true);
      setUsername(usernameParam);
      setIsConnecting(false);
    }
  }, [searchParams]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    setSuccess(false);

    try {
      // Redirect to OAuth init endpoint
      window.location.href = '/api/auth/tiktok';
    } catch (err) {
      setError('Failed to initiate TikTok connection');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    // TODO: Implement disconnect functionality
    console.log('Disconnect TikTok account');
  };

  const getErrorMessage = (errorCode: string, message: string | null): string => {
    const errorMessages: Record<string, string> = {
      access_denied: 'You denied access to your TikTok account. Please try again and grant the required permissions.',
      invalid_state: 'Security validation failed. Please try connecting again.',
      missing_code: 'Authorization failed. Please try connecting again.',
      callback_failed: message || 'Failed to complete TikTok connection. Please try again.',
      oauth_init_failed: message || 'Failed to start TikTok connection. Please check your configuration.',
    };

    return errorMessages[errorCode] || message || 'An unknown error occurred. Please try again.';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-black to-gray-800 rounded-full mb-4">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-2.84v5.79a2.972 2.972 0 0 1-2.79 2.93c-1.64 0-2.98-1.34-2.98-2.98s1.34-2.98 2.98-2.98c.38 0 .74.08 1.06.23V1.76c-.34-.06-.69-.1-1.06-.1-3.3 0-5.98 2.68-5.98 5.98s2.68 5.98 5.98 5.98c3.3 0 5.98-2.68 5.98-5.98V7.99a6.78 6.78 0 0 0 2.84.6V6.69h-.42z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Connect TikTok
          </h1>
          <p className="text-lg text-gray-600">
            Link your TikTok account to publish content and track performance
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* Success State */}
          {success && username && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Successfully Connected!
              </h2>
              <p className="text-gray-600 mb-6">
                Your TikTok account <span className="font-semibold text-black">@{username}</span> is now connected.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !success && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-red-800 mb-1">Connection Failed</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Connect State */}
          {!success && (
            <>
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">What you'll be able to do:</h3>
                <ul className="space-y-3">
                  {[
                    'Upload videos directly to TikTok',
                    'Schedule content for optimal engagement',
                    'Track video performance and analytics',
                    'Manage your TikTok content library',
                    'Access advanced publishing features',
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-black mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-gray-800">
                    <p className="font-semibold mb-1">Required Permissions</p>
                    <p>We'll request access to upload videos and view basic profile information. You can revoke access anytime.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full py-4 bg-black text-white rounded-lg font-semibold text-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isConnecting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-2.84v5.79a2.972 2.972 0 0 1-2.79 2.93c-1.64 0-2.98-1.34-2.98-2.98s1.34-2.98 2.98-2.98c.38 0 .74.08 1.06.23V1.76c-.34-.06-.69-.1-1.06-.1-3.3 0-5.98 2.68-5.98 5.98s2.68 5.98 5.98 5.98c3.3 0 5.98-2.68 5.98-5.98V7.99a6.78 6.78 0 0 0 2.84.6V6.69h-.42z"/>
                    </svg>
                    Connect with TikTok
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Navigation Links */}
        <div className="text-center space-y-2">
          <div className="flex justify-center space-x-6 text-sm">
            <Link
              href="/platforms/connect/instagram"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Connect Instagram
            </Link>
            <Link
              href="/platforms/connect/reddit"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Connect Reddit
            </Link>
          </div>
          <p className="text-xs text-gray-500">
            🔒 Your credentials are encrypted and stored securely
          </p>
        </div>
      </div>
    </div>
  );
}