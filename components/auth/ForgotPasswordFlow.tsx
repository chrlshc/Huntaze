'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const codeSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
  password: z.string()
    .min(14, 'Password must be at least 14 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 
      'Password must contain uppercase, lowercase, number and special character'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

export default function ForgotPasswordFlow() {
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const emailForm = useForm({
    resolver: zodResolver(emailSchema)
  });
  
  const codeForm = useForm({
    resolver: zodResolver(codeSchema)
  });
  
  const handleEmailSubmit = async (data: z.infer<typeof emailSchema>) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });
      
      if (!response.ok && response.status !== 429) {
        throw new Error('Failed to send reset code');
      }
      
      if (response.status === 429) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Too many attempts. Please try again later.');
      }
      
      setEmail(data.email);
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCodeSubmit = async (data: z.infer<typeof codeSchema>) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/confirm-forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: data.code,
          password: data.password,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }
      
      setStep('success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok && response.status !== 429) {
        throw new Error('Failed to resend code');
      }
      
      if (response.status === 429) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Too many attempts. Please try again later.');
      }
      
      setError('');
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'mb-4 p-3 bg-green-50 text-green-700 rounded';
      successDiv.textContent = 'A new code has been sent to your email';
      const form = document.getElementById('code-form');
      form?.insertBefore(successDiv, form.firstChild);
      setTimeout(() => successDiv.remove(), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <h2 className="text-xl font-bold text-green-800 dark:text-green-400 mb-4">
          Password Reset Successful
        </h2>
        <p className="text-green-600 dark:text-green-300 mb-4">
          Your password has been successfully reset.
        </p>
        <a 
          href="/auth" 
          className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
        >
          Return to Login
        </a>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {step === 'email' ? (
        <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)}>
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Reset Password</h2>
          
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <Input
              {...emailForm.register('email')}
              type="email"
              placeholder="your@email.com"
              className="w-full"
            />
            {emailForm.formState.errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {emailForm.formState.errors.email.message}
              </p>
            )}
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded">
              {error}
            </div>
          )}
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Reset Code'}
          </Button>
          
          <div className="mt-4 text-center">
            <a href="/auth" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Back to Login
            </a>
          </div>
        </form>
      ) : (
        <form onSubmit={codeForm.handleSubmit(handleCodeSubmit)} id="code-form">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Enter Reset Code</h2>
          
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            We've sent a 6-digit code to {email}
          </p>
          
          <div className="mb-4">
            <label htmlFor="code" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Verification Code
            </label>
            <Input
              {...codeForm.register('code')}
              type="text"
              maxLength={6}
              className="w-full text-center text-2xl tracking-widest"
              placeholder="000000"
            />
            {codeForm.formState.errors.code && (
              <p className="text-red-500 text-sm mt-1">
                {codeForm.formState.errors.code.message}
              </p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              New Password
            </label>
            <Input
              {...codeForm.register('password')}
              type="password"
              className="w-full"
            />
            {codeForm.formState.errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {codeForm.formState.errors.password.message}
              </p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm New Password
            </label>
            <Input
              {...codeForm.register('confirmPassword')}
              type="password"
              className="w-full"
            />
            {codeForm.formState.errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {codeForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded">
              {error}
            </div>
          )}
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
          
          <div className="mt-4 flex justify-between">
            <button
              type="button"
              onClick={() => setStep('email')}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Back to Email
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
            >
              Resend Code
            </button>
          </div>
        </form>
      )}
    </div>
  );
}