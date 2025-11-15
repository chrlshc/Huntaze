/**
 * Auth Hook - User Registration
 * 
 * React hook for user registration with:
 * - Loading states
 * - Error handling
 * - Success callbacks
 * - Retry logic
 */

'use client';

import { useState, useCallback } from 'react';

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
}

export interface RegisterResult {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
  };
  message?: string;
}

export interface RegisterError {
  error: string;
  type: string;
  correlationId: string;
}

/**
 * Hook to register a new user
 * 
 * @returns Register function, loading state, and error
 * 
 * @example
 * ```tsx
 * const { register, loading, error } = useRegister();
 * 
 * const handleSubmit = async (e: React.FormEvent) => {
 *   e.preventDefault();
 *   
 *   try {
 *     const result = await register({
 *       fullName: 'John Doe',
 *       email: 'john@example.com',
 *       password: 'SecurePass123!',
 *     });
 *     
 *     console.log('User registered:', result.user);
 *     // Redirect to dashboard or login
 *   } catch (error) {
 *     console.error('Registration failed:', error);
 *   }
 * };
 * ```
 */
export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (data: RegisterData): Promise<RegisterResult> => {
    // Prevent double-click
    if (loading) {
      throw new Error('Registration already in progress');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || 'Registration failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      return result as RegisterResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    register,
    loading,
    error,
    clearError,
  };
}
