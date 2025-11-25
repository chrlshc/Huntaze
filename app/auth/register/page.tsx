'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { fetchWithCsrf } from '@/lib/utils/csrf-client';
import { useCsrfToken } from '@/hooks/useCsrfToken';

/**
 * User Registration Page
 * 
 * Implements the Beta Launch UI System registration flow with:
 * - Email and password validation (client-side)
 * - Professional black theme with rainbow accents
 * - Accessible form with proper labels and ARIA attributes
 * - Password strength indicator
 * - Error handling with user-friendly messages
 * 
 * Requirements: 3.1, 3.2, 3.6, 3.7, 3.8, 16.1, 16.3
 */
export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token: csrfToken, loading: csrfLoading, error: csrfError, refresh: refreshCsrf } = useCsrfToken();

  // Calculate password strength
  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = [
      { strength: 0, label: '', color: '' },
      { strength: 1, label: 'Weak', color: 'text-red-500' },
      { strength: 2, label: 'Fair', color: 'text-yellow-500' },
      { strength: 3, label: 'Good', color: 'text-blue-500' },
      { strength: 4, label: 'Strong', color: 'text-green-500' },
      { strength: 5, label: 'Very Strong', color: 'text-green-600' },
    ];

    return levels[Math.min(strength, 5)];
  };

  const passwordStrength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Ensure we have a CSRF token before sending the request
      if (!csrfToken && !csrfLoading) {
        await refreshCsrf();
      }

      const executeRequest = async () => {
        return fetchWithCsrf('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      };

      // Create user account
      let response = await executeRequest();

      // Retry once if token was stale/expired
      if (response.status === 403) {
        await refreshCsrf();
        response = await executeRequest();
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      await response.json();

      // Redirect to verification pending page
      router.push(`/auth/verify-pending?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const displayError =
    error ||
    (csrfError ? 'Security token could not be loaded. Please refresh and try again.' : null);
  const submitting = isLoading || csrfLoading;
  const buttonLabel = isLoading
    ? 'Creating Account...'
    : csrfLoading
    ? 'Preparing Security...'
    : 'Create Account';

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/logo.svg" alt="Huntaze" className="logo" />
          <h1>Join Huntaze Beta</h1>
          <p>Start automating your creator business</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {displayError && (
            <div className="error-message" role="alert">
              {displayError}
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
              Enter a valid email address
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
                placeholder="Min. 8 characters"
                required
                minLength={8}
                className="input"
                aria-required="true"
                aria-describedby="password-hint"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <span id="password-hint" className="sr-only">
              Password must be at least 8 characters long
            </span>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: `${(passwordStrength.strength / 5) * 100}%`,
                      backgroundColor: passwordStrength.color.includes('red') ? '#ef4444' :
                                      passwordStrength.color.includes('yellow') ? '#eab308' :
                                      passwordStrength.color.includes('blue') ? '#3b82f6' :
                                      passwordStrength.color.includes('green') ? '#22c55e' : '#6b7280'
                    }}
                  />
                </div>
                {passwordStrength.label && (
                  <span className={`strength-label ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={submitting}
            aria-busy={submitting}
          >
            {buttonLabel}
          </button>

          <p className="form-footer">
            Already have an account?{' '}
            <a href="/auth/login" className="link">Sign in</a>
          </p>
        </form>
      </div>

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
          color: #ef4444;
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

        .password-strength {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-top: var(--space-1);
        }

        .strength-bar {
          flex: 1;
          height: 4px;
          background: var(--bg-hover);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .strength-fill {
          height: 100%;
          transition: width 0.3s, background-color 0.3s;
        }

        .strength-label {
          font-size: var(--text-xs);
          font-weight: 600;
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
