'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'signin' | 'signup'>('signup');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [error, setError] = useState('');
  const [localeOpen, setLocaleOpen] = useState(false);
  const [locale, setLocale] = useState<'United States' | 'France'>('United States');

  // Store plan in session storage to persist after auth
  useEffect(() => {
    if (planId) {
      sessionStorage.setItem('selectedPlan', planId);
    }
  }, [planId]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = authMethod === 'signin' ? '/api/auth/signin' : '/api/auth/signup';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Check if we have a selected plan
        const selectedPlan = sessionStorage.getItem('selectedPlan');
        if (selectedPlan) {
          // Redirect to checkout with the plan
          sessionStorage.removeItem('selectedPlan');
          router.push(`/onboarding/setup?step=payment&plan=${selectedPlan}`);
        } else {
          router.push(data.redirect || '/dashboard');
        }
      } else {
        const data = await response.json();
        setError(data.error || `Failed to ${authMethod === 'signin' ? 'sign in' : 'sign up'}`);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Include plan in Google auth URL if present
    const selectedPlan = sessionStorage.getItem('selectedPlan');
    const googleAuthUrl = selectedPlan 
      ? `/api/auth/google?plan=${selectedPlan}`
      : '/api/auth/google';
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 pt-24 pb-12">
      <div className="max-w-md w-full">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to home</span>
        </Link>

        {/* Card */}
        <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
          {/* Locale selector */}
          <div className="flex justify-between items-center mb-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setLocaleOpen((v) => !v)}
                className="px-2.5 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                aria-haspopup="listbox"
                aria-expanded={localeOpen}
              >
                {locale}
              </button>
              {localeOpen && (
                <div className="absolute mt-1 w-40 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg z-10">
                  {(['United States','France'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => { setLocale(opt); setLocaleOpen(false); }}
                      className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${opt===locale?'text-purple-600':'text-gray-700 dark:text-gray-300'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div />
          </div>
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">H</span>
            </div>
          </div>

          {(() => {
            const plan = (planId || '').toLowerCase();
            const trialMap: Record<string, number | null> = { starter: 14, pro: 7, scale: 7, enterprise: null };
            const trial = plan ? trialMap[plan] : undefined;
            const title = authMethod === 'signup' ? (trial === null ? 'Create your account' : 'Start your free trial') : 'Log in to Huntaze';
            const subtitle = plan
              ? (authMethod === 'signup'
                  ? (trial === null ? 'Enterprise has no free trial.' : `${trial}-day free trial. Cancel anytime.`)
                  : `Sign in to continue with ${plan.toUpperCase()} plan`)
              : (authMethod === 'signup' ? 'Free trial available. Cancel anytime.' : 'Welcome back to your account');
            return (
              <>
                <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">{title}</h1>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-8">{subtitle}</p>
              </>
            );
          })()}

          {/* Shopify-like email-first flow */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent dark:bg-gray-900 dark:text-white"
              />
            </div>

            {!showEmailForm ? (
              <button
                type="button"
                onClick={() => setShowEmailForm(true)}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Continue with email
              </button>
            ) : (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{authMethod === 'signup' ? 'Create a password' : 'Password'}</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={authMethod === 'signup' ? 8 : undefined}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent dark:bg-gray-900 dark:text-white"
                  />
                  {authMethod === 'signup' && (
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Minimum 8 characters</p>
                  )}
                </div>
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="submit" disabled={isLoading} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                    {isLoading ? (authMethod === 'signin' ? 'Signing in...' : 'Creating account...') : (authMethod === 'signin' ? 'Sign in' : 'Create account')}
                  </button>
                  <button type="button" onClick={() => setShowEmailForm(false)} className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Back</button>
                </div>
              </>
            )}
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center"><div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" /><span className="px-3 text-sm text-gray-500">or</span><div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" /></div>

          {/* OAuth buttons */}
          <div className="space-y-3">
            <button onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-gray-700 dark:text-gray-300 font-medium">{authMethod === 'signin' ? 'Continue with Google' : 'Sign up with Google'}</span>
            </button>

            <button disabled className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg opacity-50 cursor-not-allowed relative">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.51-3.74 4.25z"/>
              </svg>
              <span className="text-gray-700 dark:text-gray-300 font-medium">{authMethod === 'signin' ? 'Continue with Apple' : 'Sign up with Apple'}</span>
              <span className="absolute top-1 right-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">Soon</span>
            </button>

            <button disabled className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg opacity-50 cursor-not-allowed relative">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-gray-700 dark:text-gray-300 font-medium">{authMethod === 'signin' ? 'Continue with Facebook' : 'Sign up with Facebook'}</span>
              <span className="absolute top-1 right-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">Soon</span>
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {authMethod === 'signin' ? (
              <>
                New to Huntaze?{' '}
                <button
                  onClick={() => {
                    setAuthMethod('signup');
                    setShowEmailForm(false);
                    setError('');
                  }}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Create an account →
                </button>
              </>
            ) : (
              <>
                Already have a Huntaze account?{' '}
                <button
                  onClick={() => {
                    setAuthMethod('signin');
                    setShowEmailForm(false);
                    setError('');
                  }}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Log in →
                </button>
              </>
            )}
          </p>

          {/* Terms */}
          <p className="mt-8 text-xs text-center text-gray-500 dark:text-gray-400">
            By proceeding, you agree to the{' '}
            <Link href="/terms" className="text-purple-600 hover:text-purple-700">
              Terms and Conditions
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-purple-600 hover:text-purple-700">
              Privacy Policy
            </Link>
          </p>

          {/* Help links */}
          <div className="mt-4 flex justify-center gap-4 text-xs">
            <Link href="/support" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              Help
            </Link>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <Link href="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              Privacy
            </Link>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <Link href="/terms" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
