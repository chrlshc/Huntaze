/**
 * Email Verification Pending Page
 * 
 * Displays a waiting page after registration, instructing users to check their email
 * 
 * @see .kiro/specs/beta-launch-ui-system/design.md
 */

'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function VerifyPendingContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#0f0f0f] border border-[#1a1a1a] flex items-center justify-center">
              <svg
                className="w-8 h-8 text-[#8B5CF6]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold text-white text-center mb-4">
            Check your email
          </h1>

          {/* Description */}
          <p className="text-[#a3a3a3] text-center mb-6">
            We've sent a verification link to{' '}
            {email && (
              <span className="text-white font-medium">{email}</span>
            )}
            {!email && 'your email address'}
          </p>

          {/* Instructions */}
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-4 mb-6">
            <h2 className="text-sm font-medium text-white mb-2">
              What to do next:
            </h2>
            <ol className="text-sm text-[#a3a3a3] space-y-2 list-decimal list-inside">
              <li>Check your inbox for an email from Huntaze</li>
              <li>Click the verification link in the email</li>
              <li>You'll be redirected to complete your onboarding</li>
            </ol>
          </div>

          {/* Footer note */}
          <p className="text-xs text-[#737373] text-center">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={() => window.location.reload()}
              className="text-[#8B5CF6] hover:text-[#A855F7] transition-colors"
            >
              request a new one
            </button>
          </p>

          {/* Back to login */}
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

export default function VerifyPendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <VerifyPendingContent />
    </Suspense>
  );
}
