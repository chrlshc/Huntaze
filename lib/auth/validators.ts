/**
 * Authentication Validators
 * 
 * Input validation for authentication flows
 */

import type { ValidationResult, PasswordRequirements } from './types';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

// ============================================================================
// Email Validation
// ============================================================================

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  // Check if empty
  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
    return { valid: false, errors };
  }

  // Check format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  // Check length
  if (email.length > 254) {
    errors.push('Email is too long (max 254 characters)');
  }

  // Check for common typos
  const commonTypos = [
    { wrong: '@gmial.com', correct: '@gmail.com' },
    { wrong: '@gmai.com', correct: '@gmail.com' },
    { wrong: '@yahooo.com', correct: '@yahoo.com' },
    { wrong: '@hotmial.com', correct: '@hotmail.com' },
  ];

  for (const typo of commonTypos) {
    if (email.endsWith(typo.wrong)) {
      errors.push(`Did you mean ${email.replace(typo.wrong, typo.correct)}?`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize email (lowercase, trim)
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ============================================================================
// Password Validation
// ============================================================================

/**
 * Validate password strength
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): ValidationResult {
  const errors: string[] = [];

  // Check if empty
  if (!password || password.length === 0) {
    errors.push('Password is required');
    return { valid: false, errors };
  }

  // Check minimum length
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters`);
  }

  // Check maximum length (prevent DoS)
  if (password.length > 128) {
    errors.push('Password is too long (max 128 characters)');
  }

  // Check uppercase
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check lowercase
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check numbers
  if (requirements.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check special characters
  if (requirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', '12345678', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a stronger password');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate password strength score (0-100)
 */
export function calculatePasswordStrength(password: string): number {
  let score = 0;

  // Length score (max 40 points)
  score += Math.min(password.length * 4, 40);

  // Character variety (max 30 points)
  if (/[a-z]/.test(password)) score += 5;
  if (/[A-Z]/.test(password)) score += 5;
  if (/\d/.test(password)) score += 5;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9!@#$%^&*(),.?":{}|<>]/.test(password)) score += 5;

  // Pattern penalties (max -20 points)
  if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
  if (/^[a-zA-Z]+$/.test(password)) score -= 5; // Only letters
  if (/^\d+$/.test(password)) score -= 10; // Only numbers
  if (/^(012|123|234|345|456|567|678|789|890)/.test(password)) score -= 10; // Sequential

  // Entropy bonus (max 30 points)
  const uniqueChars = new Set(password).size;
  score += Math.min(uniqueChars * 2, 30);

  return Math.max(0, Math.min(100, score));
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(score: number): {
  label: string;
  color: string;
} {
  if (score < 30) return { label: 'Weak', color: 'red' };
  if (score < 60) return { label: 'Fair', color: 'orange' };
  if (score < 80) return { label: 'Good', color: 'yellow' };
  return { label: 'Strong', color: 'green' };
}

// ============================================================================
// Credentials Validation
// ============================================================================

/**
 * Validate sign in credentials
 */
export function validateSignInCredentials(
  email: string,
  password: string
): ValidationResult {
  const errors: string[] = [];

  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    errors.push(...emailValidation.errors);
  }

  // Validate password (basic check for sign in)
  if (!password || password.length === 0) {
    errors.push('Password is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate sign up credentials
 */
export function validateSignUpCredentials(
  email: string,
  password: string,
  confirmPassword?: string,
  name?: string
): ValidationResult {
  const errors: string[] = [];

  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    errors.push(...emailValidation.errors);
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    errors.push(...passwordValidation.errors);
  }

  // Validate password confirmation
  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.push('Passwords do not match');
  }

  // Validate name (optional)
  if (name !== undefined) {
    if (name.length > 0 && name.length < 2) {
      errors.push('Name must be at least 2 characters');
    }
    if (name.length > 100) {
      errors.push('Name is too long (max 100 characters)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// OAuth Validation
// ============================================================================

/**
 * Validate OAuth profile
 */
export function validateOAuthProfile(profile: any): ValidationResult {
  const errors: string[] = [];

  // Check required fields
  if (!profile.id) {
    errors.push('OAuth profile missing ID');
  }

  if (!profile.email) {
    errors.push('OAuth profile missing email');
  }

  // Validate email format
  if (profile.email) {
    const emailValidation = validateEmail(profile.email);
    if (!emailValidation.valid) {
      errors.push(...emailValidation.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Rate Limiting Helpers
// ============================================================================

/**
 * Generate rate limit key for authentication attempts
 */
export function getRateLimitKey(
  email: string,
  type: 'signin' | 'signup' | 'reset'
): string {
  const sanitized = sanitizeEmail(email);
  return `auth:${type}:${sanitized}`;
}

/**
 * Check if email is from disposable email provider
 */
export function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    'tempmail.com',
    'throwaway.email',
    'guerrillamail.com',
    '10minutemail.com',
    'mailinator.com',
    'trashmail.com',
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.includes(domain);
}

// ============================================================================
// Sanitization
// ============================================================================

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Sanitize name input
 */
export function sanitizeName(name: string): string {
  return sanitizeInput(name)
    .replace(/[^\w\s\-'.]/g, '') // Allow only word chars, spaces, hyphens, apostrophes, dots
    .substring(0, 100); // Limit length
}
