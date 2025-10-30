'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthInput } from './AuthInput';
import { AuthButton } from './AuthButton';
import { PasswordStrength } from './PasswordStrength';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { 
  validateRegisterForm, 
  validateEmail, 
  validatePassword,
  validateName,
  focusFirstError,
  type RegisterData,
  type FormErrors 
} from '@/lib/auth/validation';

interface RegisterFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function RegisterForm({ onSuccess, onError }: RegisterFormProps) {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});

  // Handle input changes
  const handleInputChange = (field: keyof RegisterData, value: string) => {
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Update form data
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle input blur (for validation)
  const handleInputBlur = (field: keyof RegisterData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate field on blur
    let error = '';
    switch (field) {
      case 'name':
        const nameValidation = validateName(formData.name);
        error = nameValidation.error || '';
        break;
      case 'email':
        if (formData.email) {
          const emailValidation = validateEmail(formData.email);
          error = emailValidation.error || '';
        }
        break;
      case 'password':
        if (formData.password) {
          const validation = validatePassword(formData.password);
          if (!validation.isValid) {
            error = validation.errors[0];
          }
        }
        break;
    }
    
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Check if field has success state
  const getFieldSuccess = (field: keyof RegisterData): boolean => {
    if (!touched[field] || !formData[field] || errors[field]) return false;
    
    switch (field) {
      case 'name':
        return validateName(formData.name).isValid;
      case 'email':
        return validateEmail(formData.email).isValid;
      case 'password':
        return validatePassword(formData.password).isValid;
      default:
        return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const validationErrors = validateRegisterForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      focusFirstError(validationErrors);
      return;
    }
    
    setLoading(true);
    
    try {
      const success = await register(formData.name, formData.email, formData.password);
      
      if (success) {
        onSuccess?.();
        // AuthProvider will handle redirect to dashboard
      } else {
        const errorMessage = 'Registration failed. Please try again.';
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
      
      {/* Name field */}
      <AuthInput
        label="Full Name"
        type="text"
        value={formData.name}
        onChange={(value) => handleInputChange('name', value)}
        error={errors.name}
        success={getFieldSuccess('name')}
        placeholder="Enter your full name"
        required
        disabled={loading}
      />
      
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
      <div>
        <AuthInput
          label="Password"
          type="password"
          value={formData.password}
          onChange={(value) => handleInputChange('password', value)}
          error={errors.password}
          success={getFieldSuccess('password')}
          placeholder="Create a strong password"
          required
          showPasswordToggle
          disabled={loading}
        />
        
        {/* Password strength indicator */}
        <PasswordStrength password={formData.password} />
      </div>
      
      {/* Submit button */}
      <AuthButton
        type="submit"
        variant="primary"
        loading={loading}
        disabled={loading}
        fullWidth
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </AuthButton>
      
      {/* Login link */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link 
            href="/auth/login" 
            className="text-auth-primary hover:text-auth-primary-hover font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}
