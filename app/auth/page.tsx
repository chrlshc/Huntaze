'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Mail } from 'lucide-react';

const navLinks = [
  { href: '/app', label: 'Product' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/support', label: 'Support' },
];

const valueProps = [
  'AI replies that sound exactly like you',
  'Smart Relance with real expected value',
  'Live OnlyFans analytics and segments',
  'Bright Data proxy + encrypted sessions',
];

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan');

  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'choice' | 'form'>('choice');

  useEffect(() => {
    if (planParam) {
      sessionStorage.setItem('selectedPlan', planParam);
    }
  }, [planParam]);

  const submitEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = authMode === 'signin' ? '/api/auth/signin' : '/api/auth/signup';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Unable to continue. Please try again.');
        return;
      }

      const data = await response.json();
      const storedPlan = sessionStorage.getItem('selectedPlan');
      if (storedPlan) {
        sessionStorage.removeItem('selectedPlan');
        router.push(`/onboarding/setup?step=payment&plan=${storedPlan}`);
      } else {
        router.push(data.redirect || '/app');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const continueWithGoogle = () => {
    const storedPlan = sessionStorage.getItem('selectedPlan');
    const url = storedPlan ? `/api/auth/google?plan=${storedPlan}` : '/api/auth/google';
    window.location.href = url;
  };

  const planLabel = planParam ? planParam.charAt(0).toUpperCase() + planParam.slice(1) : null;
  const trialCopy =
    planParam && planParam.toLowerCase() === 'enterprise'
      ? 'Enterprise partnership — speak with our team.'
      : '14-day free trial • cancel anytime';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-neutral-900/80 bg-black/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-white">
            <img src="/logo.svg" alt="Huntaze" className="h-8 w-auto" />
            <span className="hidden text-sm font-semibold uppercase tracking-[0.18em] md:block">Huntaze</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-gray-300 md:flex">
            {navLinks.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/app-preview" className="text-sm font-medium text-gray-300 hover:text-white">
            View product
          </Link>
        </div>
      </header>

      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-4 pb-16 pt-24 sm:px-6 lg:flex-row lg:px-8">
        <section className="flex flex-1 items-start">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {authMode === 'signup' ? 'Start' : 'Welcome back'}
              </p>
              <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
                {authMode === 'signup' ? 'Create your Huntaze account' : 'Sign in to Huntaze'}
              </h1>
              <p className="text-sm text-slate-600">
                {planLabel ? `${planLabel} plan · ${trialCopy}` : trialCopy}
              </p>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setStep('form');
                  setError('');
                }}
                className={`w-full rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  authMode === 'signup'
                    ? 'border-black bg-black text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900'
                }`}
              >
                {authMode === 'signup' ? 'Sign up with email' : 'Switch to sign up'}
              </button>
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setStep('form');
                  setError('');
                }}
                className={`mt-3 w-full rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  authMode === 'signin'
                    ? 'border-black bg-black text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900'
                }`}
              >
                {authMode === 'signin' ? 'Continue with email' : 'Already have an account? Sign in'}
              </button>
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              or
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="mt-5">
              <button
                onClick={continueWithGoogle}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                <svg className="h-4 w-4" viewBox="0 0 533 544" aria-hidden>
                  <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.6-34-4.6-50.2H272v95.1h146.9c-6.4 34.7-25.9 64.1-55.2 83.7v69.3h89c52.1-48 82.8-118.6 82.8-198z" />
                  <path fill="#34A853" d="M272 544c74.2 0 136.4-24.6 181.9-66.7l-89-69.3c-24.6 16.5-56.1 26.3-92.9 26.3-71.4 0-131.8-48.1-153.6-112.8H25.4v70.9C70.4 486.1 164.1 544 272 544z" />
                  <path fill="#FBBC04" d="M118.4 321.5c-5.6-16.5-8.8-34-8.8-52s3.2-35.5 8.8-52.1V146.5H25.4C9.2 183 0 222.4 0 263.5s9.2 80.5 25.4 117z" />
                  <path fill="#EA4335" d="M272 107.7c40.4 0 76.8 13.9 105.6 41.4l79.1-79.1C408.4 24.6 346.2 0 272 0 164.1 0 70.4 57.9 25.4 146.5l92.9 70.9C140.2 155.8 200.6 107.7 272 107.7z" />
                </svg>
                Continue with Google
              </button>
            </div>

            {step === 'form' && (
              <form onSubmit={submitEmail} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      placeholder="you@example.com"
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 pr-11 text-sm text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                    <Mail className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700">
                    {authMode === 'signup' ? 'Create a password' : 'Password'}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      minLength={authMode === 'signup' ? 8 : undefined}
                      placeholder="••••••••"
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 pr-11 text-sm text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {authMode === 'signup' && <p className="text-xs text-slate-500">Must be at least 8 characters.</p>}
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? 'Processing…' : authMode === 'signup' ? 'Create account' : 'Sign in'}
                </button>
              </form>
            )}

            <p className="mt-6 text-xs text-slate-500">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="underline underline-offset-4">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline underline-offset-4">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </section>

        <aside className="flex flex-1 items-center">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Why creators switch</p>
            <h2 className="mt-4 text-2xl font-semibold text-slate-900">Automation that pays for itself.</h2>
            <p className="mt-3 text-sm text-slate-600">
              Huntaze runs a headless browser 24/7, keeps your sessions safe behind Bright Data proxies, and gives your AI
              the exact tone it needs to close VIPs.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              {valueProps.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-900" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-2xl border border-slate-300 bg-slate-100 p-6 text-sm text-slate-800">
              “We took the Shopify playbook—clear dashboards, daily action plans, reliable automation—and applied it to OnlyFans.
              No gimmicks. Just more revenue.” — Huntaze Revenue Team
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
