'use client';

/**
 * Main Signup Form Component
 * Orchestrates social auth and email signup
 * 
 * Requirements:
 * - 2.1: Email-first signup flow
 * - 3.1: Social authentication options
 */

import { useState } from 'react';
import { SocialAuthButtons } from './SocialAuthButtons';
import { EmailSignupForm } from './EmailSignupForm';
import { useRouter } from 'next/navigation';

interface SignupFormProps {
  redirectTo?: string;
  onSuccess?: (method: string) => void;
  onError?: (error: Error) => void;
  showSocialAuth?: boolean;
  defaultMethod?: 'email' | 'social';
}

export function SignupForm({ 
  redirectTo = '/onboarding',
  onSuccess,
  onError,
  showSocialAuth = true,
  defaultMethod = 'social'
}: SignupFormProps) {
  const router = useRouter();
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const handleEmailSubmit = async (email: string) => {
    try {
      // Send magic link email
      const response = await fetch('/api/auth/signup/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send verification email');
      }

      setSentEmail(email);
      setEmailSent(true);
      onSuccess?.('email');
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to send verification email'));
      throw error;
    }
  };

  const handleSocialSuccess = (provider: string) => {
    onSuccess?.(provider);
  };

  const handleSocialError = (error: Error, provider: string) => {
    onError?.(error);
  };

  // Show confirmation screen after email is sent
  if (emailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg 
            className="w-8 h-8 text-green-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
            />
          </svg>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Check your email
          </h2>
          <p className="text-gray-600">
            We sent a magic link to <strong>{sentEmail}</strong>
          </p>
          <p className="text-gray-600 mt-2">
            Click the link in the email to sign in to your account.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left">
          <p className="font-medium text-blue-900 mb-1">Didn't receive the email?</p>
          <ul className="text-blue-800 space-y-1 list-disc list-inside">
            <li>Check your spam or junk folder</li>
            <li>Make sure you entered the correct email address</li>
            <li>Wait a few minutes for the email to arrive</li>
          </ul>
        </div>

        <button
          onClick={() => {
            setEmailSent(false);
            setSentEmail('');
          }}
          className="text-purple-600 hover:text-purple-700 font-medium text-sm"
        >
          Try a different email address
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Social Authentication */}
      {showSocialAuth && (
        <>
          <SocialAuthButtons
            redirectTo={redirectTo}
            onSuccess={handleSocialSuccess}
            onError={handleSocialError}
          />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                or continue with email
              </span>
            </div>
          </div>
        </>
      )}

      {/* Email Signup */}
      <EmailSignupForm
        onSubmit={handleEmailSubmit}
        autoFocus={!showSocialAuth}
      />
    </div>
  );
}
