/**
 * Signup Page
 * Main entry point for user registration
 * 
 * Requirements:
 * - 2.1: Email-first signup flow
 * - 3.1: Social authentication options
 * - 12.1: Analytics tracking
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { SignupForm } from '@/components/auth/SignupForm';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';

export const metadata: Metadata = {
  title: 'Sign Up - Huntaze',
  description: 'Create your Huntaze account and start optimizing your creator business',
};

export default async function SignupPage() {
  // Redirect if already authenticated
  const session = await auth();
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-3xl font-bold text-purple-600">Huntaze</h1>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create your account
          </h2>
          <p className="text-gray-600">
            Join Huntaze and start growing your creator business
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <SignupForm />
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              href="/auth/login" 
              className="font-medium text-purple-600 hover:text-purple-700"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Terms */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By signing up, you agree to our{' '}
            <Link href="/legal/terms" className="underline hover:text-gray-700">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/legal/privacy" className="underline hover:text-gray-700">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
