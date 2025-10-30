'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthInput } from './AuthInput';
import { AuthButton } from './AuthButton';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { 
  validateLoginForm, 
  validateEmail,
  focusFirstError,
  type LoginData,
  type FormErrors 
} from '@/lib/auth/validation';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});

  // Handle input changes
  const handleInputChange = (field: keyof LoginData, value: string | boolean) => {
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Clear general error
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
    
    // Update form data
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle input blur (for validation)
  const handleInputBlur = (field: keyof LoginData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate field on blur
    let error = '';
    switch (field) {
      case 'email':
        if (formData.email) {
          const emailValidation = validateEmail(formData.email);
          error = emailValidation.error || '';
        }
        break;
    }
    
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Check if field has success state
  const getFieldSuccess = (field: keyof LoginData): boolean => {
    if (!touched[field] || !formData[field] || errors[field]) return false;
    
    switch (field) {
      case 'email':
        return validateEmail(formData.email).isValid;
      case 'password':
        return formData.password.length > 0;
      default:
        return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const validationErrors = validateLoginForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      focusFirstError(validationErrors);
      return;
    }
    
    setLoading(true);
    
    try {
      const success = await login(formData.email, formData.password, formData.rememberMe);
      
      if (success) {
        onSuccess?.();
        // AuthProvider will handle redirect to dashboard
      } else {
        const errorMessage = 'Invalid email or password';
        setErrors({ general: errorMessage });
        onError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = 'Something went wrong. Please try again.';
      setErrors({ general: errorMessage });
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General error message */}
      {errors.general && (
        <div className="bg-auth-error-light border border-auth-error/20 text-auth-error px-4 py-3 rounded-lg" role="alert">
          {errors.general}
        </div>
      )}
      
      {/* Email field */}
      <AuthInput
        label="Email Address"
        type="email"
        value={formData.email}
        onChange={(value) => handleInputChange('email', value)}
        error={errors.email}
        success={getFieldSuccess('email')}
        placeholder="Enter your email address"
        required
        disabled={loading}
      />
      
      {/* Password field */}
      <AuthInput
        label="Password"
        type="password"
        value={formData.password}
        onChange={(value) => handleInputChange('password', value)}
        error={errors.password}
        success={getFieldSuccess('password')}
        placeholder="Enter your password"
        required
        showPasswordToggle
        disabled={loading}
      />
      
      {/* Remember me and forgot password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.rememberMe || false}
            onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
            className="h-4 w-4 text-auth-primary focus:ring-auth-primary border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-600">Remember me</span>
        </label>
        
        <Link 
          href="/auth/forgot-password" 
          className="text-sm text-auth-primary hover:text-auth-primary-hover transition-colors"
        >
          Forgot password?
        </Link>
      </div>
      
      {/* Submit button */}
      <AuthButton
        type="submit"
        variant="primary"
        loading={loading}
        disabled={loading}
        fullWidth
      >
        {loading ? 'Signing In...' : 'Sign In'}
      </AuthButton>
      
      {/* Register link */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link 
            href="/auth/register" 
            className="text-auth-primary hover:text-auth-primary-hover font-medium transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </form>
  );
}
