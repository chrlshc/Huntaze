'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function TikTokCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      if (error) {
        setStatus('error');
        setMessage(errorDescription || `Authorization failed: ${error}`);
        return;
      }
      
      const savedState = sessionStorage.getItem('tiktok_oauth_state');
      const codeVerifier = sessionStorage.getItem('tiktok_code_verifier');
      
      if (state !== savedState) {
        setStatus('error');
        setMessage('Invalid state parameter. Please try again.');
        return;
      }
      
      if (!code) {
        setStatus('error');
        setMessage('No authorization code received');
        return;
      }
      
      try {
        const response = await fetch('/api/auth/tiktok/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, codeVerifier })
        });
        
        if (response.ok) {
          const data = await response.json();
          setStatus('success');
          setMessage('TikTok connected successfully!');
          
          // Clear session storage
          sessionStorage.removeItem('tiktok_oauth_state');
          sessionStorage.removeItem('tiktok_code_verifier');
          
          setTimeout(() => router.push('/platforms/connect'), 2000);
        } else {
          const data = await response.json();
          setStatus('error');
          setMessage(data.error || 'Failed to connect TikTok');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Failed to process authorization');
      }
    };
    
    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Connecting to TikTok...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-green-600 mb-2">Success!</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={() => router.push('/auth/tiktok')}
                className="text-pink-600 hover:text-pink-700 font-medium"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}