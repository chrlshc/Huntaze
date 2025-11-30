'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface AuthInputProps {
  label: string;
  type: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  success?: boolean;
  placeholder?: string;
  required?: boolean;
  showPasswordToggle?: boolean;
  disabled?: boolean;
  id?: string;
}

export function AuthInput({
  label,
  type,
  value,
  onChange,
  error,
  success,
  placeholder,
  required = false,
  showPasswordToggle = false,
  disabled = false,
  id,
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  const inputType = type === 'password' && showPassword ? 'text' : type;
  const hasError = !!error;
  const hasSuccess = success && !hasError;
  
  return (
    <div className="w-full">
      <label htmlFor={inputId} className="auth-label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          id={inputId}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`auth-input pr-10 ${hasError ? 'error' : ''} ${hasSuccess ? 'success' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        
        {/* Success checkmark */}
        {hasSuccess && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Check className="w-5 h-5 text-green-500" />
          </div>
        )}
        
        {/* Password toggle */}
        {type === 'password' && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <p id={`${inputId}-error`} className="auth-error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
