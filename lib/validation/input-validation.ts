/**
 * Input Validation Utilities
 * 
 * Provides validation functions for dashboard view inputs including:
 * - Search input validation (max length, no HTML tags)
 * - Form input validation
 * - Error message generation
 */

export interface ValidationResult {
  /** Whether the input is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
}

/**
 * Validates search input
 * 
 * Rules:
 * - Maximum 100 characters
 * - No HTML tags (< or >)
 * - No script tags or dangerous content
 * 
 * @param input - The search input to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateSearchInput(input: string): ValidationResult {
  // Check for empty input (valid)
  if (!input || input.trim().length === 0) {
    return { valid: true };
  }

  // Check maximum length
  if (input.length > 100) {
    return {
      valid: false,
      error: 'Search query too long (maximum 100 characters)',
    };
  }

  // Check for HTML tags
  if (input.includes('<') || input.includes('>')) {
    return {
      valid: false,
      error: 'Invalid characters in search query',
    };
  }

  // Check for script tags (case-insensitive)
  const scriptPattern = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
  if (scriptPattern.test(input)) {
    return {
      valid: false,
      error: 'Invalid content in search query',
    };
  }

  // Check for common XSS patterns
  const xssPatterns = [
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick=, onload=, etc.
    /data:text\/html/gi,
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      return {
        valid: false,
        error: 'Invalid content in search query',
      };
    }
  }

  return { valid: true };
}

/**
 * Validates email input
 * 
 * @param email - The email to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return {
      valid: false,
      error: 'Email is required',
    };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return {
      valid: false,
      error: 'Invalid email address',
    };
  }

  return { valid: true };
}

/**
 * Validates required text input
 * 
 * @param value - The value to validate
 * @param fieldName - Name of the field for error messages
 * @param minLength - Minimum length (default: 1)
 * @param maxLength - Maximum length (default: 500)
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateRequiredText(
  value: string,
  fieldName: string,
  minLength: number = 1,
  maxLength: number = 500
): ValidationResult {
  if (!value || value.trim().length === 0) {
    return {
      valid: false,
      error: `${fieldName} is required`,
    };
  }

  if (value.length < minLength) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${minLength} characters`,
    };
  }

  if (value.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must be less than ${maxLength} characters`,
    };
  }

  return { valid: true };
}

/**
 * Validates numeric input
 * 
 * @param value - The value to validate
 * @param fieldName - Name of the field for error messages
 * @param min - Minimum value (optional)
 * @param max - Maximum value (optional)
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateNumber(
  value: string | number,
  fieldName: string,
  min?: number,
  max?: number
): ValidationResult {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return {
      valid: false,
      error: `${fieldName} must be a valid number`,
    };
  }

  if (min !== undefined && numValue < min) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${min}`,
    };
  }

  if (max !== undefined && numValue > max) {
    return {
      valid: false,
      error: `${fieldName} must be at most ${max}`,
    };
  }

  return { valid: true };
}

/**
 * Validates URL input
 * 
 * @param url - The URL to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateUrl(url: string): ValidationResult {
  if (!url || url.trim().length === 0) {
    return {
      valid: false,
      error: 'URL is required',
    };
  }

  try {
    new URL(url);
    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Sanitizes search input by removing dangerous characters
 * 
 * @param input - The input to sanitize
 * @returns Sanitized input string
 */
export function sanitizeSearchInput(input: string): string {
  if (!input) return '';

  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 100); // Enforce max length
}

/**
 * Debounces a validation function
 * 
 * @param validationFn - The validation function to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns Debounced validation function
 */
export function debounceValidation<T extends (...args: any[]) => ValidationResult>(
  validationFn: T,
  delay: number = 300
): (...args: Parameters<T>) => Promise<ValidationResult> {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>): Promise<ValidationResult> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        resolve(validationFn(...args));
      }, delay);
    });
  };
}
