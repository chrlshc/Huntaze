'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { ShopifyCard } from '@/components/ui/shopify/ShopifyCard';
import { ShopifyButton } from '@/components/ui/shopify/ShopifyButton';
import { isMockApiMode } from '@/config/api-mode';
import '@/styles/shopify-tokens.css';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlError = searchParams.get('error');
  const loggedOut = searchParams.get('loggedOut');
  const registered = searchParams.get('registered');
  const registeredEmail = searchParams.get('email');
  const callbackUrl = searchParams.get('callbackUrl') || '/home';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isMockApiMode()) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }

      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe.toString(),
        redirect: false,
        callbackUrl,
      });

      if (!result) {
        setError('Authentication failed. Please try again.');
        setIsLoading(false);
        return;
      }

      if (result.error || result.ok === false) {
        if (result.error === 'CredentialsSignin') {
          setError('Invalid email or password');
        } else {
          setError('Authentication failed. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('access_token');
      }

      const nextUrl = result.url && !result.url.includes('/auth/login') ? result.url : callbackUrl;
      router.push(nextUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <Image src="/logo.svg" alt="Huntaze" width={56} height={56} className="login-logo" />
          <h1>Welcome back</h1>
          <p>Sign in to your Huntaze account</p>
        </div>

        <ShopifyCard>
          <form onSubmit={handleSubmit} className="login-form">
            {registered && !error && !urlError && (
              <div className="alert alert-success">
                <CheckCircle size={16} />
                <span>Account created{registeredEmail ? ` for ${registeredEmail}` : ''}. You can sign in now.</span>
              </div>
            )}

            {loggedOut && !error && !urlError && (
              <div className="alert alert-info">
                <CheckCircle size={16} />
                <span>You have been signed out.</span>
              </div>
            )}

            {(error || urlError) && (
              <div className="alert alert-error">
                <AlertCircle size={16} />
                <span>
                  {error ||
                    (urlError === 'session_expired' || urlError === 'SessionExpired'
                      ? 'Your session has expired. Please log in again.'
                      : 'Authentication error. Please try again.')}
                </span>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                />
                <span>Remember me for 30 days</span>
              </label>
              <a href="/auth/forgot-password" className="forgot-link">
                Forgot password?
              </a>
            </div>

            <ShopifyButton type="submit" variant="primary" fullWidth loading={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </ShopifyButton>
          </form>
        </ShopifyCard>

        <p className="signup-link">
          Don't have an account? <a href="/auth/register">Create one</a>
        </p>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--shopify-bg-surface-secondary, #f6f6f7);
          padding: 24px;
        }

        .login-container {
          width: 100%;
          max-width: 420px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .login-header h1 {
          font-size: 24px;
          font-weight: 600;
          color: var(--shopify-text, #202223);
          margin: 16px 0 8px;
        }

        .login-header p {
          font-size: 14px;
          color: var(--shopify-text-subdued, #6d7175);
          margin: 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .alert {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.4;
        }

        .alert svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .alert-success {
          background: #e3f1df;
          color: #1a5c1a;
          border: 1px solid #b3d7a8;
        }

        .alert-info {
          background: #e0f0ff;
          color: #0055a6;
          border: 1px solid #a8d4ff;
        }

        .alert-error {
          background: #fbeae5;
          color: #c4320a;
          border: 1px solid #f5c4b8;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-field label {
          font-size: 13px;
          font-weight: 500;
          color: var(--shopify-text, #202223);
        }

        .form-field input {
          width: 100%;
          padding: 10px 12px;
          font-size: 14px;
          border: 1px solid var(--shopify-border, #c9cccf);
          border-radius: 8px;
          background: #fff;
          color: var(--shopify-text, #202223);
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .form-field input:focus {
          outline: none;
          border-color: var(--shopify-interactive, #2c6ecb);
          box-shadow: 0 0 0 2px rgba(44, 110, 203, 0.2);
        }

        .form-field input::placeholder {
          color: var(--shopify-text-subdued, #6d7175);
        }

        .password-wrapper {
          position: relative;
        }

        .password-wrapper input {
          padding-right: 44px;
        }

        .password-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: var(--shopify-text-subdued, #6d7175);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: color 0.15s;
        }

        .password-toggle:hover {
          color: var(--shopify-text, #202223);
        }

        .form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--shopify-text-subdued, #6d7175);
          cursor: pointer;
        }

        .checkbox-wrapper input[type="checkbox"] {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1px solid var(--shopify-border, #c9cccf);
          cursor: pointer;
          accent-color: var(--shopify-interactive, #2c6ecb);
        }

        .forgot-link {
          font-size: 13px;
          color: var(--shopify-interactive, #2c6ecb);
          text-decoration: none;
          font-weight: 500;
        }

        .forgot-link:hover {
          text-decoration: underline;
        }

        .signup-link {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
          color: var(--shopify-text-subdued, #6d7175);
        }

        .signup-link a {
          color: var(--shopify-interactive, #2c6ecb);
          text-decoration: none;
          font-weight: 500;
        }

        .signup-link a:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .login-page {
            padding: 16px;
          }

          .form-options {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}
