/**
 * Signup Validation Schemas and Utilities
 * 
 * Provides Zod schemas and validation functions for signup forms.
 * Includes email validation, password strength calculation, and error messages.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { z } from 'zod';

/**
 * Password strength levels
 */
export enum PasswordStrength {
  WEAK = 'weak',
  FAIR = 'fair',
  GOOD = 'good',
  STRONG = 'strong',
}

/**
 * Password strength result
 */
export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number; // 0-100
  feedback: string[];
  meetsRequirements: boolean;
}

/**
 * Email validation schema
 * 
 * Validates email format according to RFC 5322 simplified rules:
 * - Must contain @ symbol
 * - Must have local part before @
 * - Must have domain part after @
 * - Domain must have at least one dot
 * - No spaces allowed
 * 
 * Requirements: 4.1, 4.2, 4.3
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email is too long')
  .refine(
    (email) => {
      // Additional validation: no spaces
      return !/\s/.test(email);
    },
    { message: 'Email cannot contain spaces' }
  )
  .refine(
    (email) => {
      // Additional validation: domain must have TLD
      const parts = email.split('@');
      if (parts.length !== 2) return false;
      const domain = parts[1];
      return domain.includes('.') && domain.split('.').every(part => part.length > 0);
    },
    { message: 'Please enter a valid email domain' }
  );

/**
 * Password validation schema
 * 
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * Requirements: 4.4
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .refine(
    (password) => /[A-Z]/.test(password),
    { message: 'Password must contain at least one uppercase letter' }
  )
  .refine(
    (password) => /[a-z]/.test(password),
    { message: 'Password must contain at least one lowercase letter' }
  )
  .refine(
    (password) => /[0-9]/.test(password),
    { message: 'Password must contain at least one number' }
  )
  .refine(
    (password) => /[^A-Za-z0-9]/.test(password),
    { message: 'Password must contain at least one special character' }
  );

/**
 * Signup form schema
 * 
 * Combines email and password validation
 */
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Email-only signup schema (for magic link flow)
 * 
 * Requirements: 2.1
 */
export const emailOnlySignupSchema = z.object({
  email: emailSchema,
});

/**
 * Validate email format
 * 
 * @param email - Email address to validate
 * @returns Validation result with success flag and error message
 * 
 * Requirements: 4.1, 4.2, 4.3
 */
export function validateEmail(email: string): {
  success: boolean;
  error?: string;
} {
  const result = emailSchema.safeParse(email);
  
  if (result.success) {
    return { success: true };
  }
  
  // Get the first error message from Zod
  const firstError = result.error?.issues?.[0];
  const errorMessage = firstError?.message || 'Invalid email';
  
  return {
    success: false,
    error: errorMessage,
  };
}

/**
 * Calculate password strength
 * 
 * Scoring criteria:
 * - Length (0-30 points): 3 points per character up to 10 characters
 * - Uppercase letters (0-15 points): 5 points per unique uppercase letter (max 3)
 * - Lowercase letters (0-15 points): 5 points per unique lowercase letter (max 3)
 * - Numbers (0-15 points): 5 points per unique number (max 3)
 * - Special characters (0-25 points): 5 points per unique special character (max 5)
 * 
 * Total: 0-100 points
 * - 0-25: Weak
 * - 26-50: Fair
 * - 51-75: Good
 * - 76-100: Strong
 * 
 * @param password - Password to evaluate
 * @returns Password strength result with score and feedback
 * 
 * Requirements: 4.4
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  let score = 0;
  const feedback: string[] = [];
  
  // Length score (0-30 points)
  const lengthScore = Math.min(password.length * 3, 30);
  score += lengthScore;
  
  if (password.length < 8) {
    feedback.push('Use at least 8 characters');
  } else if (password.length < 12) {
    feedback.push('Consider using 12+ characters for better security');
  }
  
  // Uppercase letters (0-15 points)
  const uppercaseMatches = password.match(/[A-Z]/g);
  const uniqueUppercase = uppercaseMatches ? new Set(uppercaseMatches).size : 0;
  const uppercaseScore = Math.min(uniqueUppercase * 5, 15);
  score += uppercaseScore;
  
  if (uniqueUppercase === 0) {
    feedback.push('Add uppercase letters (A-Z)');
  }
  
  // Lowercase letters (0-15 points)
  const lowercaseMatches = password.match(/[a-z]/g);
  const uniqueLowercase = lowercaseMatches ? new Set(lowercaseMatches).size : 0;
  const lowercaseScore = Math.min(uniqueLowercase * 5, 15);
  score += lowercaseScore;
  
  if (uniqueLowercase === 0) {
    feedback.push('Add lowercase letters (a-z)');
  }
  
  // Numbers (0-15 points)
  const numberMatches = password.match(/[0-9]/g);
  const uniqueNumbers = numberMatches ? new Set(numberMatches).size : 0;
  const numberScore = Math.min(uniqueNumbers * 5, 15);
  score += numberScore;
  
  if (uniqueNumbers === 0) {
    feedback.push('Add numbers (0-9)');
  }
  
  // Special characters (0-25 points)
  const specialMatches = password.match(/[^A-Za-z0-9]/g);
  const uniqueSpecial = specialMatches ? new Set(specialMatches).size : 0;
  const specialScore = Math.min(uniqueSpecial * 5, 25);
  score += specialScore;
  
  if (uniqueSpecial === 0) {
    feedback.push('Add special characters (!@#$%^&*)');
  }
  
  // Determine strength level
  let strength: PasswordStrength;
  if (score <= 25) {
    strength = PasswordStrength.WEAK;
  } else if (score <= 50) {
    strength = PasswordStrength.FAIR;
  } else if (score <= 75) {
    strength = PasswordStrength.GOOD;
  } else {
    strength = PasswordStrength.STRONG;
  }
  
  // Check if meets minimum requirements
  const meetsRequirements = passwordSchema.safeParse(password).success;
  
  // Add positive feedback for strong passwords
  if (score >= 76 && feedback.length === 0) {
    feedback.push('Excellent password strength!');
  } else if (score >= 51 && feedback.length === 0) {
    feedback.push('Good password strength');
  }
  
  return {
    strength,
    score,
    feedback,
    meetsRequirements,
  };
}

/**
 * Validate password
 * 
 * @param password - Password to validate
 * @returns Validation result with success flag, error message, and strength info
 * 
 * Requirements: 4.4
 */
export function validatePassword(password: string): {
  success: boolean;
  error?: string;
  strength?: PasswordStrengthResult;
} {
  const result = passwordSchema.safeParse(password);
  const strength = calculatePasswordStrength(password);
  
  if (result.success) {
    return { success: true, strength };
  }
  
  // Get the first error message from Zod
  const firstError = result.error?.issues?.[0];
  const errorMessage = firstError?.message || 'Invalid password';
  
  return {
    success: false,
    error: errorMessage,
    strength,
  };
}

/**
 * Validate signup form data
 * 
 * @param data - Form data to validate
 * @returns Validation result with success flag and errors
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export function validateSignupForm(data: {
  email: string;
  password: string;
}): {
  success: boolean;
  errors?: {
    email?: string;
    password?: string;
  };
} {
  const result = signupSchema.safeParse(data);
  
  if (result.success) {
    return { success: true };
  }
  
  const errors: { email?: string; password?: string } = {};
  
  result.error.issues.forEach((error) => {
    const field = error.path[0] as 'email' | 'password';
    if (!errors[field]) {
      errors[field] = error.message;
    }
  });
  
  return {
    success: false,
    errors,
  };
}

/**
 * Get user-friendly error message for validation errors
 * 
 * Maps technical validation errors to human-friendly messages
 * 
 * @param error - Error message from validation
 * @returns User-friendly error message
 * 
 * Requirements: 5.4
 */
export function getUserFriendlyErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    'Email is required': 'Please enter your email address',
    'Please enter a valid email address': 'This doesn\'t look like a valid email. Please check and try again',
    'Email is too long': 'This email address is too long. Please use a shorter one',
    'Email cannot contain spaces': 'Email addresses can\'t have spaces. Please remove them',
    'Please enter a valid email domain': 'Please enter a complete email address (e.g., you@example.com)',
    'Password must be at least 8 characters': 'Your password needs to be at least 8 characters long',
    'Password is too long': 'Your password is too long. Please use fewer than 128 characters',
    'Password must contain at least one uppercase letter': 'Add at least one uppercase letter (A-Z)',
    'Password must contain at least one lowercase letter': 'Add at least one lowercase letter (a-z)',
    'Password must contain at least one number': 'Add at least one number (0-9)',
    'Password must contain at least one special character': 'Add at least one special character (!@#$%^&*)',
  };
  
  return errorMap[error] || error;
}

/**
 * Debounce function for real-time validation
 * 
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 * 
 * Requirements: 4.3
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}
