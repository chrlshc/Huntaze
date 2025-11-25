'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Allow both login and registration now that DB is connected
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for error messages in URL params (e.g., session expiration)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'session_expired') {
      setError('Your session has expired. Please log in again.');
    } else if (errorParam === 'unauthorized') {
      setError('Authentication required. Please log in.');
    }
    // If coming from registration pending, default to login tab
    if (searchParams.get('pending')) {
      setIsLogin(true);
    }
  }, [searchParams]);

  // Calculer la force du mot de passe
  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: '', color: '' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = [
      { strength: 0, label: '', color: '' },
      { strength: 1, label: 'Weak', color: 'bg-red-500' },
      { strength: 2, label: 'Fair', color: 'bg-yellow-500' },
      { strength: 3, label: 'Good', color: 'bg-blue-500' },
      { strength: 4, label: 'Strong', color: 'bg-green-500' },
      { strength: 5, label: 'Very Strong', color: 'bg-green-600' },
    ];

    return levels[Math.min(strength, 5)];
  };

  const passwordStrength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login with NextAuth
        const result = await signIn('credentials', {
          email,
          password,
          rememberMe: rememberMe.toString(), // Pass rememberMe flag
          redirect: false,
        });

        if (result?.error) {
          // Handle different error types
          if (result.error === 'CredentialsSignin') {
            setError('Invalid email or password');
          } else {
            setError('Authentication failed. Please try again.');
          }
          console.error('[Auth] Login error:', result.error);
          setIsLoading(false);
          return;
        }

        // Clean up legacy localStorage tokens
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('access_token');
        }

        // Get session to check onboarding status
        const session = await getSession();
        console.log('[Auth] Login session:', {
          hasSession: !!session,
          userId: session?.user?.id,
          onboardingCompleted: session?.user?.onboardingCompleted,
        });
        
        // Redirect based on onboarding status
        if (session?.user?.onboardingCompleted === true) {
          console.log('[Auth] Onboarding completed, redirecting to /dashboard');
          router.push('/dashboard');
        } else {
          console.log('[Auth] Onboarding not completed, redirecting to /onboarding');
          router.push('/onboarding');
        }
      } else {
        // Register new user
        console.log('🔵 Starting registration...', { email });
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        console.log('🔵 Registration response:', { status: response.status, data });

        if (!response.ok) {
          setError(data.error || 'Registration failed');
          setIsLoading(false);
          return;
        }

        // Show success message briefly
        setError('Account created! Logging you in...');
        
        // Wait longer to ensure DB transaction is committed
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Auto-login after registration
        console.log('🔵 Attempting auto-login...');
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        console.log('🔵 Login result:', result);

        if (result?.error) {
          console.error('🔴 Login failed:', result.error);
          setError('Registration successful, but login failed. Please try logging in manually.');
          setIsLoading(false);
          // Switch to login tab
          setIsLogin(true);
          return;
        }

        if (result?.ok) {
          console.log('✅ Login successful, redirecting to onboarding...');
          
          // Clean up legacy localStorage tokens
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('access_token');
          }
          
          // Redirect to onboarding
          router.push('/onboarding');
        } else {
          console.error('🔴 Unexpected login result:', result);
          setError('Registration successful, but login failed. Please try logging in manually.');
          setIsLoading(false);
          setIsLogin(true);
        }
      }
    } catch (err) {
      // Handle network errors and other exceptions
      console.error('[Auth] Unexpected error:', err);
      
      // Check if it's a network error
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Connection error. Please check your internet connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      await signIn('google', {
        callbackUrl: isLogin ? '/dashboard' : '/onboarding',
      });
    } catch (err) {
      setError('Google authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
      {/* LEFT SIDE - HERO (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 relative overflow-hidden items-center justify-center p-12">
        {/* Animated background shapes */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 text-center text-white max-w-lg">
          {/* Logo */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
              <span className="text-2xl font-bold">H</span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Double Your Revenue
          </h1>

          {/* Subheading */}
          <p className="text-xl text-white/80 mb-12 leading-relaxed">
            AI-powered management platform built for content creators who want to scale
          </p>

          {/* Trust Signals */}
          <div className="space-y-4">
            {['For All Creators', 'AI-Powered Tools', 'Bank-Level Secure'].map(
              (signal) => (
                <div key={signal} className="flex items-center justify-center text-white/90">
                  <Check className="w-5 h-5 mr-3 text-green-400" />
                  <span className="text-sm font-medium">{signal}</span>
                </div>
              )
            )}
          </div>

          {/* Stats */}
          <div className="mt-16 pt-12 border-t border-white/20 grid grid-cols-2 gap-8">
            <div>
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-white/70 text-sm mt-2">Creators Onboarded</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">$2.5M</p>
              <p className="text-white/70 text-sm mt-2">Revenue Generated</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 lg:p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          {/* Pending verification banner */}
          {searchParams.get('pending') && (
            <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
              Check your email
              {searchParams.get('email') ? ` at ${searchParams.get('email')}` : ''}
              {' '}to verify your account, then sign in.
            </div>
          )}

          {/* Mobile Header */}
          <div className="lg:hidden mb-4 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white mb-2">
              <span className="text-base font-bold">H</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Huntaze</h2>
          </div>

          {/* Tab Toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 px-4 rounded-md font-semibold text-sm transition-all duration-200 ${
                !isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 px-4 rounded-md font-semibold text-sm transition-all duration-200 ${
                isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
          </div>

          {/* Headline */}
          <div className="mb-6">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-gray-600 text-xs">
              {isLogin
                ? 'Sign in to your Huntaze account'
                : 'Join 500+ creators already scaling their revenue'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Error Message */}
            {error && (
              <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Google Button - Temporarily disabled during Auth.js v5 migration */}
            {false && (
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg border border-gray-300 hover:border-gray-400 bg-white text-gray-900 font-semibold text-sm transition-all duration-200 hover:shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
            </button>
            )}

            {/* Divider - Hidden when Google OAuth is disabled */}
            {false && (
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-gray-500 text-xs font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-900 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 text-sm text-gray-900 placeholder-gray-500 transition-colors duration-200"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-900 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-300 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 text-sm text-gray-900 placeholder-gray-500 transition-colors duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength (Register only) */}
              {!isLogin && password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{
                          width: `${(passwordStrength.strength / 5) * 100}%`,
                        }}
                      ></div>
                    </div>
                    {passwordStrength.label && (
                      <span className={`text-[10px] font-semibold ${passwordStrength.color.replace('bg-', 'text-')}`}>
                        {passwordStrength.label}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Checkbox - Remember Me or Agree Terms */}
            <div className="flex items-start gap-2 pt-1">
              {isLogin ? (
                <>
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 cursor-pointer mt-0.5"
                  />
                  <label htmlFor="rememberMe" className="text-xs text-gray-600 cursor-pointer">
                    Remember me for 30 days
                  </label>
                </>
              ) : (
                <>
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 cursor-pointer mt-0.5"
                  />
                  <label htmlFor="agreeTerms" className="text-xs text-gray-600">
                    I agree to the{' '}
                    <a href="#" className="text-purple-600 hover:text-purple-700 font-semibold">
                      Terms
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-purple-600 hover:text-purple-700 font-semibold">
                      Privacy Policy
                    </a>
                  </label>
                </>
              )}
            </div>

            {/* Forgot Password Link (Login only) */}
            {isLogin && (
              <div className="text-right">
                <a href="#" className="text-xs text-purple-600 hover:text-purple-700 font-semibold">
                  Forgot password?
                </a>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || (!isLogin && !agreeTerms)}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm transition-all duration-200 transform hover:shadow-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                <>{isLogin ? 'Sign In' : 'Create Account'}</>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center text-gray-600 text-xs mt-4">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </p>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-1 text-gray-500 text-[10px]">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              Encrypted & Secure
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}


export default function AuthClient() {
  return <AuthContent />;
}
