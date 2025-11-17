/**
 * Request Validation Middleware for API Routes
 * 
 * Provides input validation and sanitization for API requests.
 * Validates request body schemas and sanitizes user inputs to prevent
 * injection attacks and ensure data integrity.
 * 
 * Features:
 * - Schema-based validation
 * - Input sanitization (XSS prevention)
 * - Type coercion and normalization
 * - Detailed validation error messages
 * - Support for nested objects and arrays
 * 
 * @example
 * ```typescript
 * import { withValidation, validators } from '@/lib/api/middleware/validation';
 * 
 * const schema = {
 *   title: validators.string({ required: true, minLength: 1, maxLength: 200 }),
 *   type: validators.enum(['image', 'video', 'text'], { required: true }),
 * };
 * 
 * export const POST = withValidation(schema, async (req, body) => {
 *   // body is validated and typed
 *   return Response.json({ data: body });
 * });
 * ```
 */

import { NextRequest } from 'next/server';
import { errorResponse } from '../utils/response';

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Validation result
 */
export interface ValidationResult<T = any> {
  valid: boolean;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Field validator function
 */
export type FieldValidator<T = any> = (
  value: any,
  field: string
) => ValidationError | null;

/**
 * Validation schema
 */
export type ValidationSchema = Record<string, FieldValidator>;

/**
 * Sanitize string to prevent XSS attacks
 */
function sanitizeString(value: string): string {
  if (typeof value !== 'string') return value;
  
  // Remove potentially dangerous characters
  return value
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Deep sanitize an object
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Validate data against schema
 */
function validateSchema<T = any>(
  data: any,
  schema: ValidationSchema
): ValidationResult<T> {
  const errors: ValidationError[] = [];
  const validated: any = {};
  
  // Validate each field in schema
  for (const [field, validator] of Object.entries(schema)) {
    const value = data[field];
    const error = validator(value, field);
    
    if (error) {
      errors.push(error);
    } else {
      validated[field] = value;
    }
  }
  
  // Check for extra fields not in schema (optional: could be strict mode)
  for (const field of Object.keys(data)) {
    if (!(field in schema)) {
      validated[field] = data[field];
    }
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return { valid: true, data: validated as T };
}

/**
 * Built-in validators
 */
export const validators = {
  /**
   * String validator
   */
  string(options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    trim?: boolean;
    sanitize?: boolean;
  } = {}): FieldValidator<string> {
    const {
      required = false,
      minLength,
      maxLength,
      pattern,
      trim = true,
      sanitize = true,
    } = options;
    
    return (value: any, field: string): ValidationError | null => {
      // Check required
      if (required && (value === undefined || value === null || value === '')) {
        return { field, message: `${field} is required` };
      }
      
      // Allow optional empty values
      if (!required && (value === undefined || value === null || value === '')) {
        return null;
      }
      
      // Check type
      if (typeof value !== 'string') {
        return { field, message: `${field} must be a string`, value };
      }
      
      // Trim if requested
      let processedValue = trim ? value.trim() : value;
      
      // Sanitize if requested
      if (sanitize) {
        processedValue = sanitizeString(processedValue);
      }
      
      // Check min length
      if (minLength !== undefined && processedValue.length < minLength) {
        return {
          field,
          message: `${field} must be at least ${minLength} characters`,
          value: processedValue,
        };
      }
      
      // Check max length
      if (maxLength !== undefined && processedValue.length > maxLength) {
        return {
          field,
          message: `${field} must be at most ${maxLength} characters`,
          value: processedValue,
        };
      }
      
      // Check pattern
      if (pattern && !pattern.test(processedValue)) {
        return {
          field,
          message: `${field} has invalid format`,
          value: processedValue,
        };
      }
      
      return null;
    };
  },
  
  /**
   * Number validator
   */
  number(options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}): FieldValidator<number> {
    const { required = false, min, max, integer = false } = options;
    
    return (value: any, field: string): ValidationError | null => {
      // Check required
      if (required && (value === undefined || value === null)) {
        return { field, message: `${field} is required` };
      }
      
      // Allow optional empty values
      if (!required && (value === undefined || value === null)) {
        return null;
      }
      
      // Try to coerce to number
      const numValue = Number(value);
      
      // Check if valid number
      if (isNaN(numValue)) {
        return { field, message: `${field} must be a number`, value };
      }
      
      // Check integer
      if (integer && !Number.isInteger(numValue)) {
        return { field, message: `${field} must be an integer`, value: numValue };
      }
      
      // Check min
      if (min !== undefined && numValue < min) {
        return {
          field,
          message: `${field} must be at least ${min}`,
          value: numValue,
        };
      }
      
      // Check max
      if (max !== undefined && numValue > max) {
        return {
          field,
          message: `${field} must be at most ${max}`,
          value: numValue,
        };
      }
      
      return null;
    };
  },
  
  /**
   * Boolean validator
   */
  boolean(options: { required?: boolean } = {}): FieldValidator<boolean> {
    const { required = false } = options;
    
    return (value: any, field: string): ValidationError | null => {
      // Check required
      if (required && (value === undefined || value === null)) {
        return { field, message: `${field} is required` };
      }
      
      // Allow optional empty values
      if (!required && (value === undefined || value === null)) {
        return null;
      }
      
      // Check type (allow string 'true'/'false')
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        return { field, message: `${field} must be a boolean`, value };
      }
      
      return null;
    };
  },
  
  /**
   * Enum validator
   */
  enum<T extends string>(
    allowedValues: T[],
    options: { required?: boolean } = {}
  ): FieldValidator<T> {
    const { required = false } = options;
    
    return (value: any, field: string): ValidationError | null => {
      // Check required
      if (required && (value === undefined || value === null || value === '')) {
        return { field, message: `${field} is required` };
      }
      
      // Allow optional empty values
      if (!required && (value === undefined || value === null || value === '')) {
        return null;
      }
      
      // Check if value is in allowed list
      if (!allowedValues.includes(value)) {
        return {
          field,
          message: `${field} must be one of: ${allowedValues.join(', ')}`,
          value,
        };
      }
      
      return null;
    };
  },
  
  /**
   * Array validator
   */
  array(options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    itemValidator?: FieldValidator;
  } = {}): FieldValidator<any[]> {
    const { required = false, minLength, maxLength, itemValidator } = options;
    
    return (value: any, field: string): ValidationError | null => {
      // Check required
      if (required && (value === undefined || value === null)) {
        return { field, message: `${field} is required` };
      }
      
      // Allow optional empty values
      if (!required && (value === undefined || value === null)) {
        return null;
      }
      
      // Check type
      if (!Array.isArray(value)) {
        return { field, message: `${field} must be an array`, value };
      }
      
      // Check min length
      if (minLength !== undefined && value.length < minLength) {
        return {
          field,
          message: `${field} must have at least ${minLength} items`,
          value,
        };
      }
      
      // Check max length
      if (maxLength !== undefined && value.length > maxLength) {
        return {
          field,
          message: `${field} must have at most ${maxLength} items`,
          value,
        };
      }
      
      // Validate each item if validator provided
      if (itemValidator) {
        for (let i = 0; i < value.length; i++) {
          const error = itemValidator(value[i], `${field}[${i}]`);
          if (error) {
            return error;
          }
        }
      }
      
      return null;
    };
  },
  
  /**
   * Email validator
   */
  email(options: { required?: boolean } = {}): FieldValidator<string> {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return validators.string({
      ...options,
      pattern: emailPattern,
    });
  },
  
  /**
   * URL validator
   */
  url(options: { required?: boolean } = {}): FieldValidator<string> {
    const { required = false } = options;
    
    return (value: any, field: string): ValidationError | null => {
      // Check required
      if (required && (value === undefined || value === null || value === '')) {
        return { field, message: `${field} is required` };
      }
      
      // Allow optional empty values
      if (!required && (value === undefined || value === null || value === '')) {
        return null;
      }
      
      // Check type
      if (typeof value !== 'string') {
        return { field, message: `${field} must be a string`, value };
      }
      
      // Try to parse as URL
      try {
        new URL(value);
        return null;
      } catch {
        return { field, message: `${field} must be a valid URL`, value };
      }
    };
  },
  
  /**
   * Date validator
   */
  date(options: { required?: boolean } = {}): FieldValidator<Date> {
    const { required = false } = options;
    
    return (value: any, field: string): ValidationError | null => {
      // Check required
      if (required && (value === undefined || value === null)) {
        return { field, message: `${field} is required` };
      }
      
      // Allow optional empty values
      if (!required && (value === undefined || value === null)) {
        return null;
      }
      
      // Try to parse as date
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return { field, message: `${field} must be a valid date`, value };
      }
      
      return null;
    };
  },
  
  /**
   * Object validator
   */
  object(
    schema: ValidationSchema,
    options: { required?: boolean } = {}
  ): FieldValidator<any> {
    const { required = false } = options;
    
    return (value: any, field: string): ValidationError | null => {
      // Check required
      if (required && (value === undefined || value === null)) {
        return { field, message: `${field} is required` };
      }
      
      // Allow optional empty values
      if (!required && (value === undefined || value === null)) {
        return null;
      }
      
      // Check type
      if (typeof value !== 'object' || Array.isArray(value)) {
        return { field, message: `${field} must be an object`, value };
      }
      
      // Validate nested schema
      const result = validateSchema(value, schema);
      if (!result.valid && result.errors) {
        // Return first error with nested field path
        const firstError = result.errors[0];
        return {
          field: `${field}.${firstError.field}`,
          message: firstError.message,
          value: firstError.value,
        };
      }
      
      return null;
    };
  },
};

/**
 * Validation middleware wrapper
 * 
 * @param schema - Validation schema
 * @param handler - Route handler that receives validated data
 * @returns Wrapped handler with validation
 * 
 * @example
 * ```typescript
 * const schema = {
 *   title: validators.string({ required: true, maxLength: 200 }),
 *   type: validators.enum(['image', 'video', 'text'], { required: true }),
 * };
 * 
 * export const POST = withValidation(schema, async (req, body) => {
 *   // body is validated and sanitized
 *   return Response.json({ data: body });
 * });
 * ```
 */
export function withValidation<T = any>(
  schema: ValidationSchema,
  handler: (req: NextRequest, body: T, context?: any) => Promise<Response> | Response
): (req: NextRequest, context?: any) => Promise<Response> {
  return async (req: NextRequest, context?: any) => {
    try {
      // Parse request body
      let body: any;
      try {
        body = await req.json();
      } catch (error) {
        return Response.json(
          errorResponse(
            'VALIDATION_ERROR',
            'Invalid JSON in request body',
            { error: 'Failed to parse JSON' }
          ),
          { status: 400 }
        );
      }
      
      // Sanitize input
      const sanitized = sanitizeObject(body);
      
      // Validate against schema
      const result = validateSchema<T>(sanitized, schema);
      
      if (!result.valid) {
        return Response.json(
          errorResponse(
            'VALIDATION_ERROR',
            'Request validation failed',
            { errors: result.errors }
          ),
          { status: 400 }
        );
      }
      
      // Call handler with validated data and context
      return await handler(req, result.data!, context);
      
    } catch (error) {
      console.error('[Validation] Error in validation middleware:', error);
      return Response.json(
        errorResponse(
          'INTERNAL_ERROR',
          'An error occurred during validation',
          { error: error instanceof Error ? error.message : String(error) }
        ),
        { status: 500 }
      );
    }
  };
}

/**
 * Sanitize request body without schema validation
 * Useful for endpoints that need sanitization but flexible validation
 */
export function withSanitization(
  handler: (req: NextRequest, body: any, context?: any) => Promise<Response> | Response
): (req: NextRequest, context?: any) => Promise<Response> {
  return async (req: NextRequest, context?: any) => {
    try {
      // Parse request body
      let body: any;
      try {
        body = await req.json();
      } catch (error) {
        return Response.json(
          errorResponse(
            'VALIDATION_ERROR',
            'Invalid JSON in request body'
          ),
          { status: 400 }
        );
      }
      
      // Sanitize input
      const sanitized = sanitizeObject(body);
      
      // Call handler with sanitized data and context
      return await handler(req, sanitized, context);
      
    } catch (error) {
      console.error('[Validation] Error in sanitization middleware:', error);
      return Response.json(
        errorResponse(
          'INTERNAL_ERROR',
          'An error occurred during sanitization'
        ),
        { status: 500 }
      );
    }
  };
}

/**
 * Validate query parameters
 */
export function validateQueryParams(
  req: NextRequest,
  schema: ValidationSchema
): ValidationResult {
  const { searchParams } = new URL(req.url);
  const params: Record<string, any> = {};
  
  // Convert URLSearchParams to object
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return validateSchema(params, schema);
}
