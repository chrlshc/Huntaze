'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Sparkles, Check } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import './auth-styles.css';

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
  const [showPassword, setShowPassword] = useState(false);

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

  const features = [
    'AI that responds 24/7 in your voice',
    'Smart pricing that maximizes revenue',
    'Multi-platform growth automation',
    '300% average conversion increase'
  ];

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface flex">
      {/* Left Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        {/* Gradient Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10" />
        
        <div className="relative w-full max-w-md">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-content-tertiary hover:text-content-primary mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to home</span>
          </Link>

          {/* Card */}
          <div className="bg-surface-elevated-light dark:bg-surface-elevated rounded-2xl shadow-soft border border-border-light dark:border-border p-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg hover-lift-soft">
                <span className="text-white font-bold text-2xl">H</span>
              </div>
            </div>

            {(() => {
              const plan = (planId || '').toLowerCase();
              const trialMap: Record<string, number | null> = { starter: 14, pro: 7, scale: 7, enterprise: null };
              const trial = plan ? trialMap[plan] : undefined;
              const title = authMethod === 'signup' ? (trial === null ? 'Create your account' : 'Start your free trial') : 'Welcome back';
              const subtitle = plan
                ? (authMethod === 'signup'
                    ? (trial === null ? 'Enterprise plan - Contact sales' : `${trial}-day free trial • Cancel anytime`)
                    : `Continue with ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`)
                : (authMethod === 'signup' ? '14-day free trial • No credit card required' : 'Sign in to your Huntaze account');
              return (
                <>
                  <h1 className="text-3xl font-bold text-center text-content-primary mb-2">{title}</h1>
                  <p className="text-center text-content-secondary mb-8">{subtitle}</p>
                </>
              );
            })()}

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-content-primary mb-2">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 pr-10 border border-input-border-light dark:border-input-border bg-input-bg-light dark:bg-input-bg rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-content-primary placeholder-content-tertiary transition-all"
                  />
                  <Mail className="absolute right-3 top-3.5 w-5 h-5 text-content-tertiary" />
                </div>
              </div>

              {showEmailForm && (
                <>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-content-primary mb-2">
                      {authMethod === 'signup' ? 'Create a password' : 'Password'}
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={authMethod === 'signup' ? 8 : undefined}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 pr-10 border border-input-border-light dark:border-input-border bg-input-bg-light dark:bg-input-bg rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-content-primary placeholder-content-tertiary transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-content-tertiary hover:text-content-secondary transition-colors"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {authMethod === 'signup' && (
                      <p className="mt-1 text-xs text-content-tertiary">Must be at least 8 characters</p>
                    )}
                  </div>

                  {error && (
                    <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg animate-shake">
                      <p className="text-sm text-danger">{error}</p>
                    </div>
                  )}
                </>
              )}

              {!showEmailForm ? (
                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="btn-primary w-full"
                >
                  Continue with email
                </button>
              ) : (
                <div className="flex gap-3">
                  <button type="submit" disabled={isLoading} className="btn-primary flex-1">
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      authMethod === 'signin' ? 'Sign in' : 'Create account'
                    )}
                  </button>
                  <button type="button" onClick={() => setShowEmailForm(false)} className="btn-secondary px-6">
                    Back
                  </button>
                </div>
              )}
            </form>

            {/* Dev Mode Bypass - Only in development */}
            {true && (
              <div className="my-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-xs text-center text-yellow-800 dark:text-yellow-200 mb-3 font-medium">🚀 Dev Mode - Quick Access</p>
                <div className="flex gap-2">
                  <a
                    href="/onboarding/setup"
                    className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors text-center shadow-sm"
                  >
                    → Onboarding Flow
                  </a>
                  <a
                    href="/dashboard"
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors text-center shadow-sm"
                  >
                    → Dashboard
                  </a>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 h-px bg-border-light dark:bg-border" />
              <span className="px-3 text-sm text-content-tertiary">or continue with</span>
              <div className="flex-1 h-px bg-border-light dark:bg-border" />
            </div>

            {/* OAuth buttons */}
            <div className="space-y-3">
              <button onClick={handleGoogleSignIn} className="btn-outline w-full group">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="font-medium">{authMethod === 'signin' ? 'Continue with Google' : 'Sign up with Google'}</span>
              </button>
            </div>

            {/* Switch auth method */}
            <p className="mt-6 text-center text-sm text-content-secondary">
              {authMethod === 'signin' ? (
                <>
                  New to Huntaze?{' '}
                  <button
                    onClick={() => {
                      setAuthMethod('signup');
                      setShowEmailForm(false);
                      setError('');
                    }}
                    className="text-primary hover:text-primary-hover font-medium transition-colors"
                  >
                    Create an account →
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setAuthMethod('signin');
                      setShowEmailForm(false);
                      setError('');
                    }}
                    className="text-primary hover:text-primary-hover font-medium transition-colors"
                  >
                    Sign in →
                  </button>
                </>
              )}
            </p>

            {/* Terms */}
            <p className="mt-6 text-xs text-center text-content-tertiary">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:text-primary-hover underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:text-primary-hover underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Features/Benefits (Desktop only) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-secondary p-12 items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-lg">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-white/80 text-sm font-medium">Huntaze AI Platform</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              {authMethod === 'signup' ? 'Join 10,000+ creators earning more' : 'Welcome back to your growth'}
            </h2>
            <p className="text-white/80 text-lg">
              The AI platform that helps OnlyFans creators maximize revenue while working less.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 bg-white/10 backdrop-blur rounded-lg p-4 hover:bg-white/15 transition-colors">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-white/90">{feature}</span>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur border-2 border-white/40" />
                ))}
              </div>
              <div>
                <p className="text-white font-medium">Trusted by top creators</p>
                <p className="text-white/70 text-sm">$50M+ managed revenue</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}