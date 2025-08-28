'use client';

import { useState } from 'react';
// import { signIn } from 'next-auth/react'; // TODO: Add next-auth
import { FcGoogle } from 'react-icons/fc';
import { FaApple, FaFacebook } from 'react-icons/fa';
import { HiMail } from 'react-icons/hi';
import Image from 'next/image';
import Link from 'next/link';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'signup' | 'signin'>('signup');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Email auth logic here
    setIsLoading(false);
  };

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true);
    try {
      // Redirect to OAuth API endpoint
      window.location.href = `/api/auth/${provider}`;
    } catch (error) {
      console.error('Auth error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Modal Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <span className="text-3xl font-bold text-white">H</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              {authMethod === 'signup' ? 'Start your free trial' : 'Welcome back'}
            </h2>
            {authMethod === 'signup' && (
              <p className="text-gray-600">
                Get 3 days free, then 3 months for €1/month
              </p>
            )}
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                placeholder=""
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue with email
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleOAuthSignIn('google')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FcGoogle className="w-5 h-5" />
              <span className="text-gray-700 font-medium">Sign up with Google</span>
            </button>

            <button
              onClick={() => handleOAuthSignIn('apple')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-black text-white rounded-lg px-4 py-3 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaApple className="w-5 h-5" />
              <span className="font-medium">Sign up with Apple</span>
            </button>

            <button
              onClick={() => handleOAuthSignIn('facebook')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-[#1877f2] text-white rounded-lg px-4 py-3 hover:bg-[#1565c0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1877f2] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaFacebook className="w-5 h-5" />
              <span className="font-medium">Sign up with Facebook</span>
            </button>
          </div>

          {/* Footer */}
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              {authMethod === 'signup' ? (
                <>
                  Already have a Huntaze account?{' '}
                  <button
                    onClick={() => setAuthMethod('signin')}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Log in →
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setAuthMethod('signup')}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Sign up →
                  </button>
                </>
              )}
            </p>
            
            <p className="text-xs text-gray-500">
              By proceeding, you agree to the{' '}
              <Link href="/terms" className="text-purple-600 hover:text-purple-700">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-purple-600 hover:text-purple-700">
                Privacy Policy
              </Link>
            </p>
            
            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
              <Link href="/help" className="hover:text-gray-600">
                Help
              </Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-gray-600">
                Privacy
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-gray-600">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}