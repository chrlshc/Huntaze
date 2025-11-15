/**
 * Auth Service - Input Validation
 * 
 * Validates registration and login inputs
 */

import { RegisterRequest, ValidationResult, ValidationError } from './types';

/**
 * Email regex pattern (RFC 5322 simplified)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password requirements
 */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

/**
 * Name requirements
 */
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;

/**
 * Validate registration request
 */
export function validateRegisterRequest(data: RegisterRequest): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate fullName
  if (!data.fullName || typeof data.fullName !== 'string') {
    errors.push({
      field: 'fullName',
      message: 'Full name is required',
    });
  } else if (data.fullName.trim().length < NAME_MIN_LENGTH) {
    errors.push({
      field: 'fullName',
      message: `Name must be at least ${NAME_MIN_LENGTH} characters`,
    });
  } else if (data.fullName.length > NAME_MAX_LENGTH) {
    errors.push({
      field: 'fullName',
      message: `Name must not exceed ${NAME_MAX_LENGTH} characters`,
    });
  }

  // Validate email
  if (!data.email || typeof data.email !== 'string') {
    errors.push({
      field: 'email',
      message: 'Email is required',
    });
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address',
    });
  } else if (data.email.length > 255) {
    errors.push({
      field: 'email',
      message: 'Email must not exceed 255 characters',
    });
  }

  // Validate password
  if (!data.password || typeof data.password !== 'string') {
    errors.push({
      field: 'password',
      message: 'Password is required',
    });
  } else if (data.password.length < PASSWORD_MIN_LENGTH) {
    errors.push({
      field: 'password',
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    });
  } else if (data.password.length > PASSWORD_MAX_LENGTH) {
    errors.push({
      field: 'password',
      message: `Password must not exceed ${PASSWORD_MAX_LENGTH} characters`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize email (lowercase, trim)
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Sanitize name (trim, normalize spaces)
 */
export function sanitizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
  score: number; // 0-4
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length
  if (password.length >= 12) {
    score++;
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    feedback.push('Password is too short');
  }

  // Lowercase
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Add lowercase letters');
  }

  // Uppercase
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Add uppercase letters');
  }

  // Numbers
  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('Add numbers');
  }

  // Special characters
  if (/[^a-zA-Z0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Add special characters');
  }

  return { score: Math.min(score, 4), feedback };
}
