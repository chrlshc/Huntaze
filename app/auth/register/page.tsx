'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { fetchWithCsrf } from '@/lib/utils/csrf-client';
import { useCsrfToken } from '@/hooks/useCsrfToken';
import { ShopifyCard } from '@/components/ui/shopify/ShopifyCard';
import { ShopifyButton } from '@/components/ui/shopify/ShopifyButton';
import { isMockApiMode } from '@/config/api-mode';
import '@/styles/shopify-tokens.css';

type PasswordLevel = {
  strength: number;
  label: string;
  color: string;
};

const PASSWORD_LEVELS: PasswordLevel[] = [
  { strength: 0, label: '', color: 'transparent' },
  { strength: 1, label: 'Weak', color: '#c4320a' },
  { strength: 2, label: 'Fair', color: '#b98900' },
  { strength: 3, label: 'Good', color: '#2c6ecb' },
  { strength: 4, label: 'Strong', color: '#1a5c1a' },
  { strength: 5, label: 'Very Strong', color: '#0d7544' },
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token: csrfToken, loading: csrfLoading, error: csrfError, refresh: refreshCsrf } = useCsrfToken();
  const callbackUrl = searchParams.get('callbackUrl') || '/home';

  const getPasswordStrength = (): PasswordLevel => {
    const pwd = formData.password;
    if (!pwd) return PASSWORD_LEVELS[0];
    
    let s = 0;
    if (pwd.length >= 8) s++;
    if (pwd.length >= 12) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;

    return PASSWORD_LEVELS[Math.min(s, 5)];
  };

  const passwordStrength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
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

      let response = await executeRequest();

      if (response.status === 403) {
        await refreshCsrf();
        response = await executeRequest();
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      await response.json();

      if (isMockApiMode()) {
        router.push('/home');
        router.refresh();
        return;
      }

      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl,
      });

      if (!signInResult || signInResult.error || signInResult.ok === false) {
        setError('Account created, but automatic sign-in failed. Please log in.');
        return;
      }

      const nextUrl =
        signInResult.url &&
        !signInResult.url.includes('/auth/login') &&
        !signInResult.url.includes('/auth/register')
          ? signInResult.url
          : callbackUrl;

      router.push(nextUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = error || (csrfError ? 'Security token could not be loaded. Please refresh.' : null);
  const submitting = isLoading || csrfLoading;
  const buttonLabel = isLoading ? 'Creating Account...' : csrfLoading ? 'Preparing...' : 'Create Account';

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <Image src="/logo.svg" alt="Huntaze" width={56} height={56} />
          <h1>Join Huntaze Beta</h1>
          <p>Start automating your creator business</p>
        </div>

        <ShopifyCard>
          <form onSubmit={handleSubmit} className="register-form">
            {displayError && (
              <div className="alert alert-error">
                <AlertCircle size={16} />
                <span>{displayError}</span>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="creator@example.com"
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
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
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

              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className="strength-fill"
                      style={{
                        width: `${(passwordStrength.strength / 5) * 100}%`,
                        backgroundColor: passwordStrength.color
                      }}
                    />
                  </div>
                  {passwordStrength.label && (
                    <span className="strength-label" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  )}
                </div>
              )}
            </div>

            <ShopifyButton type="submit" variant="primary" fullWidth loading={submitting}>
              {buttonLabel}
            </ShopifyButton>
          </form>
        </ShopifyCard>

        <p className="login-link">
          Already have an account? <a href="/auth/login">Sign in</a>
        </p>
      </div>

      <style jsx>{`
        .register-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f6f6f7;
          padding: 24px;
        }
        .register-container {
          width: 100%;
          max-width: 420px;
        }
        .register-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .register-header h1 {
          font-size: 24px;
          font-weight: 600;
          color: #202223;
          margin: 16px 0 8px;
        }
        .register-header p {
          font-size: 14px;
          color: #6d7175;
          margin: 0;
        }
        .register-form {
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
          color: #202223;
        }
        .form-field input {
          width: 100%;
          padding: 10px 12px;
          font-size: 14px;
          border: 1px solid #c9cccf;
          border-radius: 8px;
          background: #fff;
          color: #202223;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .form-field input:focus {
          outline: none;
          border-color: #2c6ecb;
          box-shadow: 0 0 0 2px rgba(44, 110, 203, 0.2);
        }
        .form-field input::placeholder {
          color: #6d7175;
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
          color: #6d7175;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: color 0.15s;
        }
        .password-toggle:hover {
          color: #202223;
        }
        .password-strength {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 6px;
        }
        .strength-bar {
          flex: 1;
          height: 4px;
          background: #c9cccf;
          border-radius: 2px;
          overflow: hidden;
        }
        .strength-fill {
          height: 100%;
          transition: width 0.2s, background-color 0.2s;
        }
        .strength-label {
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
        }
        .login-link {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
          color: #6d7175;
        }
        .login-link a {
          color: #2c6ecb;
          text-decoration: none;
          font-weight: 500;
        }
        .login-link a:hover {
          text-decoration: underline;
        }
        @media (max-width: 480px) {
          .register-page {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
