/**
 * Instagram Connect Page
 * 
 * Allows users to connect their Instagram Business/Creator account
 * via Facebook OAuth
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function InstagramConnectPage() {
  const searchParams = useSearchParams();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Check for OAuth callback results
    if (!searchParams) return;
    
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    const successParam = searchParams.get('success');
    const usernameParam = searchParams.get('username');

    if (errorParam) {
      setError(getErrorMessage(errorParam, messageParam));
    } else if (successParam === 'true') {
      setSuccess(`Successfully connected Instagram account @${usernameParam || 'your account'}!`);
    }
  }, [searchParams]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    setSuccess(null);

    try {
      // Redirect to OAuth init endpoint
      window.location.href = '/api/auth/instagram';
    } catch (err) {
      setError('Failed to initiate Instagram connection');
      setIsConnecting(false);
    }
  };

  const getErrorMessage = (errorCode: string, message: string | null): string => {
    const errorMessages: Record<string, string> = {
      access_denied: 'You denied access to your Instagram account. Please try again and grant the required permissions.',
      invalid_state: 'Security validation failed. Please try connecting again.',
      no_business_account: message || 'No Instagram Business or Creator account found. Please convert your Instagram account to a Business or Creator account and link it to a Facebook Page.',
      callback_failed: message || 'Failed to complete Instagram connection. Please try again.',
      oauth_init_failed: message || 'Failed to start Instagram connection. Please check your configuration.',
    };

    return errorMessages[errorCode] || message || 'An unknown error occurred. Please try again.';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl mb-4">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Connect Instagram Business
          </h1>
          <p className="text-gray-600">
            Connect your Instagram Business or Creator account to publish content and track insights
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-green-800">Success!</h3>
                  <p className="text-sm text-green-700 mt-1">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Connection Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Requirements */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h2>
            <ul className="space-y-2">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-purple-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700">Instagram Business or Creator account</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-purple-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700">Account linked to a Facebook Page</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-purple-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700">Admin access to the Facebook Page</span>
              </li>
            </ul>
          </div>

          {/* Permissions */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Permissions Requested</h2>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-sm text-gray-600 mr-2">•</span>
                <span className="text-sm text-gray-700">View basic profile information</span>
              </li>
              <li className="flex items-start">
                <span className="text-sm text-gray-600 mr-2">•</span>
                <span className="text-sm text-gray-700">Publish photos and videos</span>
              </li>
              <li className="flex items-start">
                <span className="text-sm text-gray-600 mr-2">•</span>
                <span className="text-sm text-gray-700">View insights and analytics</span>
              </li>
              <li className="flex items-start">
                <span className="text-sm text-gray-600 mr-2">•</span>
                <span className="text-sm text-gray-700">Manage comments</span>
              </li>
            </ul>
          </div>

          {/* Connect Button */}
          <button
            onClick={handleConnect}
            disabled={isConnecting || !!success}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
              isConnecting || success
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 shadow-lg hover:shadow-xl'
            }`}
          >
            {isConnecting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Connecting...
              </span>
            ) : success ? (
              'Connected ✓'
            ) : (
              'Connect Instagram Business'
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-gray-600">
          <p>
            Don't have an Instagram Business account?{' '}
            <a
              href="https://help.instagram.com/502981923235522"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Learn how to convert your account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
