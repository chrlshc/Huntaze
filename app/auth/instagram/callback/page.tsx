'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function InstagramCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  useEffect(() => {
    if (code) {
      // In production, exchange this code for an access token
      console.log('Instagram authorization successful, code:', code);
      // Mark as connected (server will set httpOnly cookie)
      fetch('/api/platforms/instagram/connected', { credentials: 'include' })
        .catch(() => {})
        .finally(() => {
          // Redirect back to onboarding
          setTimeout(() => {
            router.push('/onboarding/setup');
          }, 1200);
        });
    }
  }, [code, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex items-center justify-center">
        <div className="elevated-card p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Instagram Authorization Error</h1>
          <p className="text-gray-700 mb-2">{error}</p>
          {errorDescription && (
            <p className="text-gray-600 text-sm mb-6">{errorDescription}</p>
          )}
          <Link href="/" className="text-purple-600 hover:text-purple-700 font-medium">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex items-center justify-center">
      <div className="elevated-card p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Connecting to Instagram...</h1>
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
        <p className="text-gray-600">Please wait while we complete the authorization.</p>
      </div>
    </div>
  );
}

export default function InstagramCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex items-center justify-center">
        <div className="elevated-card p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    }>
      <InstagramCallbackContent />
    </Suspense>
  );
}
