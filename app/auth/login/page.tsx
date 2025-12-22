'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

/**
 * User Login Page
 * 
 * Implements the Beta Launch UI System login flow with:
 * - Email and password authentication
 * - Email verification check before allowing login
 * - Professional black theme with rainbow accents
 * - Accessible form with proper labels and ARIA attributes
 * - Session management with NextAuth.js
 * - Secure, httpOnly cookies
 * - Remember me functionality
 * 
 * Requirements: 4.5, 16.4
 */
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

  // Check for error messages in URL params
  const urlError = searchParams.get('error');
  const loggedOut = searchParams.get('loggedOut');
  const callbackUrl = searchParams.get('callbackUrl') || '/home';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Attempt login with NextAuth
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe.toString(),
        redirect: false,
      });

      if (result?.error) {
        // Handle different error types
        if (result.error === 'CredentialsSignin') {
          setError('Invalid email or password');
        } else if (result.error === 'EmailNotVerified') {
          setError('Please verify your email before logging in');
        } else {
          setError('Authentication failed. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      // Clean up legacy localStorage tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('access_token');
      }

      // Redirect to callback URL or home page
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Card>
        <div className="auth-header">
          <img src="/logo.svg" alt="Huntaze" className="logo" />
          <h1>Welcome Back</h1>
          <p>Sign in to your Huntaze account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {loggedOut && !error && !urlError && (
            <div className="success-message" role="status">
              You have been signed out.
            </div>
          )}

          {(error || urlError) && (
            <div className="error-message" role="alert">
              {error ||
                (urlError === 'session_expired' || urlError === 'SessionExpired'
                  ? 'Your session has expired. Please log in again.'
                  : 'Authentication error. Please try again.')}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="creator@example.com"
              required
              className="input"
              aria-required="true"
              aria-describedby="email-hint"
            />
            <span id="email-hint" className="sr-only">
              Enter your email address
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                required
                className="input"
                aria-required="true"
                aria-describedby="password-hint"
              />
              <Button 
                variant="primary" 
                onClick={() => setShowPassword(!showPassword)} 
                type="button"
                className="password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
            </div>
            <span id="password-hint" className="sr-only">
              Enter your password
            </span>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="checkbox"
              />
              <span>Remember me for 30 days</span>
            </label>
            <a href="/auth/forgot-password" className="link">
              Forgot password?
            </a>
          </div>

          <Button variant="primary" disabled={isLoading} type="submit" aria-busy={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <p className="form-footer">
            Don't have an account?{' '}
            <a href="/auth/register" className="link">Create one</a>
          </p>
        </form>
      </Card>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-app);
          padding: var(--space-4);
        }

        .auth-card {
          width: 100%;
          max-width: 400px;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-8);
        }

        .auth-header {
          text-align: center;
          margin-bottom: var(--space-6);
        }

        .logo {
          width: 48px;
          height: 48px;
          margin: 0 auto var(--space-4);
        }

        .auth-header h1 {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: var(--space-2);
        }

        .auth-header p {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .error-message {
          padding: var(--space-3);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          color: var(--accent-error);
          font-size: var(--text-sm);
        }

        .success-message {
          padding: var(--space-3);
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: var(--radius-md);
          color: var(--accent-success);
          font-size: var(--text-sm);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .form-group label {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-primary);
        }

        .input {
          width: 100%;
          padding: var(--space-3);
          background: var(--bg-input);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: var(--text-base);
          transition: all 0.2s;
        }

        .input:focus {
          outline: none;
          border-color: var(--brand-primary);
          box-shadow: var(--brand-glow);
        }

        .input::placeholder {
          color: var(--text-muted);
        }

        .password-input-wrapper {
          position: relative;
        }

        .password-input-wrapper .input {
          padding-right: var(--space-10);
        }

        .password-toggle {
          position: absolute;
          right: var(--space-3);
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: var(--space-1);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .password-toggle:hover {
          color: var(--text-primary);
        }

        .password-toggle:focus {
          outline: none;
          box-shadow: var(--brand-glow);
          border-radius: var(--radius-sm);
        }

        .form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-2);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          color: var(--text-secondary);
          cursor: pointer;
        }

        .checkbox {
          width: 16px;
          height: 16px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-default);
          cursor: pointer;
          accent-color: var(--brand-primary);
        }

        .checkbox:focus {
          outline: none;
          box-shadow: var(--brand-glow);
        }

        .btn-primary {
          width: 100%;
          padding: var(--space-3) var(--space-4);
          background: var(--brand-gradient);
          background-size: 200% 200%;
          border: none;
          border-radius: var(--radius-md);
          color: white;
          font-size: var(--text-base);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary:hover:not(:disabled) {
          background-position: right center;
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .btn-primary:focus {
          outline: none;
          box-shadow: var(--brand-glow-strong);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .form-footer {
          text-align: center;
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .link {
          color: var(--brand-primary);
          text-decoration: none;
          font-weight: 600;
          font-size: var(--text-sm);
          transition: color 0.2s;
        }

        .link:hover {
          color: var(--brand-secondary);
        }

        .link:focus {
          outline: none;
          box-shadow: var(--brand-glow);
          border-radius: var(--radius-sm);
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
      `}</style>
    </div>
  );
}
