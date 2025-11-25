/**
 * Email Verification Handler Page
 * 
 * Handles email verification when users click the verification link
 * - Validates token and userId
 * - Checks token expiration (24 hours)
 * - Updates user's emailVerified status
 * - Redirects to onboarding on success
 * 
 * @see .kiro/specs/beta-launch-ui-system/design.md
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

type VerificationState = 'verifying' | 'success' | 'error' | 'expired';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<VerificationState>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    if (!token || !userId) {
      setState('error');
      setErrorMessage('Invalid verification link');
      return;
    }

    // Verify the token
    verifyEmail(token, userId);
  }, [searchParams]);

  const verifyEmail = async (token: string, userId: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setState('success');
        // Redirect to main auth (signin/signup) after a short delay
        setTimeout(() => {
          router.push('/auth?verified=true');
        }, 1500);
      } else {
        if (data.error === 'Token expired') {
          setState('expired');
        } else {
          setState('error');
          setErrorMessage(data.error || 'Verification failed');
        }
      }
    } catch (error) {
      setState('error');
      setErrorMessage('An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-8">
          {/* Verifying State */}
          {state === 'verifying' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#0f0f0f] border border-[#1a1a1a] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B5CF6]"></div>
                </div>
              </div>
              <h1 className="text-2xl font-semibold text-white text-center mb-4">
                Verifying your email...
              </h1>
              <p className="text-[#a3a3a3] text-center">
                Please wait while we verify your account
              </p>
            </>
          )}

          {/* Success State */}
          {state === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#0f0f0f] border border-[#1a1a1a] flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-semibold text-white text-center mb-4">
                Email verified!
              </h1>
              <p className="text-[#a3a3a3] text-center mb-6">
                Your account has been verified. Redirecting to the sign-in page...
              </p>
              <div className="flex justify-center">
                <div className="animate-pulse text-[#8B5CF6]">●</div>
              </div>
            </>
          )}

          {/* Expired State */}
          {state === 'expired' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#0f0f0f] border border-[#1a1a1a] flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-yellow-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-semibold text-white text-center mb-4">
                Link expired
              </h1>
              <p className="text-[#a3a3a3] text-center mb-6">
                This verification link has expired. Verification links are valid for 24 hours.
              </p>
              <div className="flex justify-center">
                <a
                  href="/auth/register"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#EC4899] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Request new link
                </a>
              </div>
            </>
          )}

          {/* Error State */}
          {state === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[#0f0f0f] border border-[#1a1a1a] flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-semibold text-white text-center mb-4">
                Verification failed
              </h1>
              <p className="text-[#a3a3a3] text-center mb-6">
                {errorMessage || 'Unable to verify your email. Please try again.'}
              </p>
              <div className="flex justify-center">
                <a
                  href="/auth/register"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#EC4899] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Back to registration
                </a>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <a
              href="/auth/login"
              className="text-sm text-[#a3a3a3] hover:text-white transition-colors"
            >
              Back to login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
