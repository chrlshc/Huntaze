'use client';

/**
 * Email Signup Form Component
 * Email-first signup with real-time validation
 * 
 * Requirements:
 * - 2.1: Email-only initial signup
 * - 2.5: Real-time validation
 * - 4.1, 4.2, 4.3: Email validation with feedback
 */

import { useEffect, useMemo, useState } from 'react';
import { validateEmail, debounce } from '@/lib/validation/signup';
import { useCsrfToken } from '@/hooks/useCsrfToken';
import { useMobileOptimization, getMobileInputAttributes } from '@/hooks/useMobileOptimization';
import { Check, Loader2 } from 'lucide-react';
import { FieldError, ErrorSummary } from '@/components/forms/FormError';
import { getContextualError } from '@/lib/validation/error-messages';

interface EmailSignupFormProps {
  onSubmit: (email: string, csrfToken: string) => Promise<void>;
  onValidationChange?: (isValid: boolean) => void;
  autoFocus?: boolean;
}

export function EmailSignupForm({ 
  onSubmit, 
  onValidationChange,
  autoFocus = false 
}: EmailSignupFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);
  
  const { token: csrfToken, loading: csrfLoading, error: csrfError } = useCsrfToken();
  
  // Mobile optimizations
  const { 
    isMobile, 
    isSubmitting: isMobileSubmitting, 
    startSubmit, 
    endSubmit, 
    formRef 
  } = useMobileOptimization({
    enableScrollOnFocus: true,
    preventDoubleSubmit: true,
  });
  
  // Get mobile-optimized input attributes
  const emailInputAttrs = getMobileInputAttributes('email');

  // Debounced validation function
  const validateEmailDebounced = useMemo(() => debounce(async (value: string) => {
    if (!value) {
      setError(null);
      setIsValid(false);
      setIsValidating(false);
      onValidationChange?.(false);
      return;
    }

    setIsValidating(true);
    
    const result = validateEmail(value);
    
    setError(result.error || null);
    setIsValid(result.success);
    setIsValidating(false);
    onValidationChange?.(result.success);
  }, 500), [onValidationChange]);

  // Validate email on change
  useEffect(() => {
    if (touched) {
      validateEmailDebounced(email);
    }
  }, [email, touched, validateEmailDebounced]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    if (!touched) {
      setTouched(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double-submission
    if (!isValid || isSubmitting || isMobileSubmitting) {
      return;
    }

    // Ensure CSRF token is available
    if (!csrfToken) {
      setError('Security token not available. Please refresh the page.');
      return;
    }

    setIsSubmitting(true);
    startSubmit(); // Mobile double-submit prevention
    
    try {
      await onSubmit(email, csrfToken);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send verification email');
    } finally {
      setIsSubmitting(false);
      endSubmit();
    }
  };

  const showValidationIcon = touched && email && !isValidating;
  const showError = touched && error && !isValidating;

  // Collect all errors for summary
  const allErrors: string[] = [];
  if (csrfError) allErrors.push('Security token error. Please refresh the page.');
  if (showError && error) allErrors.push(getContextualError('email', error));

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {/* Error Summary */}
      {allErrors.length > 0 && (
        <ErrorSummary errors={allErrors} />
      )}

      {/* Email Input */}
      <div>
        <label 
          htmlFor="email" 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Email address
        </label>
        <div className="relative">
          <input
            id="email"
            name="email"
            {...emailInputAttrs}
            autoComplete="email"
            autoFocus={autoFocus}
            required
            value={email}
            onChange={handleEmailChange}
            disabled={isSubmitting || csrfLoading}
            className={`
              block w-full px-4 py-3 pr-12
              min-h-[44px]
              border rounded-lg
              text-gray-900 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-offset-2
              disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
              transition-colors
              ${showError 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : isValid 
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                  : 'border-gray-300 focus:border-[#2c6ecb] focus:ring-[#2c6ecb]'
              }
            `}
            placeholder="you@example.com"
            aria-invalid={showError ? 'true' : 'false'}
            aria-describedby={showError ? 'email-error' : undefined}
          />
          
          {/* Validation Icons */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {isValidating && (
              <Loader2 
                className="w-5 h-5 text-gray-400 animate-spin" 
                aria-label="Validating email"
              />
            )}
            {showValidationIcon && isValid && (
              <Check 
                className="w-5 h-5 text-green-500" 
                aria-label="Valid email"
              />
            )}
          </div>
        </div>
        
        {/* Field Error */}
        {showError && error && (
          <FieldError 
            error={getContextualError('email', error)} 
            fieldId="email"
          />
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isValid || isSubmitting || isMobileSubmitting || csrfLoading || !!csrfError}
        className={`
          w-full flex items-center justify-center gap-2
          px-6 py-3 rounded-lg
          min-h-[44px]
          font-semibold text-white
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c6ecb]
          ${isValid && !isSubmitting && !isMobileSubmitting && !csrfLoading && !csrfError
            ? 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
            : 'bg-gray-300 cursor-not-allowed'
          }
        `}
        aria-busy={isSubmitting || isMobileSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            <span>Sending verification email...</span>
          </>
        ) : (
          <span>Continue with Email</span>
        )}
      </button>

      {/* Helper Text */}
      <p className="text-sm text-gray-600 text-center">
        We'll send you a magic link to sign in
      </p>
    </form>
  );
}
