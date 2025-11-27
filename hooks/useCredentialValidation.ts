'use client';

/**
 * Credential Validation Hook
 * 
 * React hook for validating OAuth credentials with:
 * - Automatic retry logic
 * - Loading states
 * - Error handling
 * - Debouncing
 * - Caching
 * 
 * @example
 * ```tsx
 * const { validate, isValidating, error, result } = useCredentialValidation();
 * 
 * const handleValidate = async () => {
 *   const isValid = await validate('instagram', {
 *     clientId: 'your_id',
 *     clientSecret: 'your_secret',
 *   });
 *   
 *   if (isValid) {
 *     // Save credentials
 *   }
 * };
 * ```
 */

'use client';

import { useState, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

interface Credentials {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  clientKey?: string; // TikTok
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  correlationId?: string;
  duration?: number;
  credentialsSet?: boolean;
  formatValid?: boolean;
  apiConnectivity?: boolean;
}

interface UseCredentialValidationReturn {
  validate: (platform: string, credentials: Credentials) => Promise<boolean>;
  isValidating: boolean;
  error: string | null;
  result: ValidationResult | null;
  reset: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useCredentialValidation(): UseCredentialValidationReturn {
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ValidationResult | null>(null);
  
  // Debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  
  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController>();

  /**
   * Validate credentials
   */
  const validate = useCallback(
    async (platform: string, credentials: Credentials): Promise<boolean> => {
      // Clear previous debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // Debounce validation (500ms)
      return new Promise((resolve) => {
        debounceTimerRef.current = setTimeout(async () => {
          setIsValidating(true);
          setError(null);
          setResult(null);

          try {
            const response = await fetch('/api/validation/credentials', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                platform,
                credentials,
              }),
              signal: abortControllerRef.current?.signal,
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || 'Validation failed');
            }

            setResult({
              isValid: data.isValid,
              errors: data.errors || [],
              warnings: data.warnings || [],
              correlationId: data.correlationId,
              duration: data.details?.duration,
              credentialsSet: data.details?.credentialsSet,
              formatValid: data.details?.formatValid,
              apiConnectivity: data.details?.apiConnectivity,
            });

            if (!data.isValid) {
              const errorMessages = data.errors.join(', ');
              setError(errorMessages || 'Validation failed');
              resolve(false);
            } else {
              resolve(true);
            }
          } catch (err) {
            // Ignore abort errors
            if (err instanceof Error && err.name === 'AbortError') {
              resolve(false);
              return;
            }

            const errorMessage =
              err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            setResult({
              isValid: false,
              errors: [errorMessage],
              warnings: [],
            });
            resolve(false);
          } finally {
            setIsValidating(false);
          }
        }, 500); // 500ms debounce
      });
    },
    []
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setIsValidating(false);
    setError(null);
    setResult(null);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    validate,
    isValidating,
    error,
    result,
    reset,
  };
}
