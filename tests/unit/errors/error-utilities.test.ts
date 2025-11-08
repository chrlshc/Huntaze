/**
 * Error Utilities Tests
 * 
 * Tests for the core error handling utilities in lib/errors/index.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isError,
  isString,
  isObject,
  isZodError,
  isAxiosError,
  getErrorMessage,
  createErrorResponse,
  logError,
  isDatabaseError,
  getDatabaseErrorMessage
} from '../../../lib/errors/index';

describe('Error Utilities', () => {
  describe('Type Guards', () => {
    describe('isError', () => {
      it('should return true for Error instances', () => {
        expect(isError(new Error('test'))).toBe(true);
        expect(isError(new TypeError('test'))).toBe(true);
        expect(isError(new ReferenceError('test'))).toBe(true);
      });

      it('should return false for non-Error values', () => {
        expect(isError('error string')).toBe(false);
        expect(isError({ message: 'error' })).toBe(false);
        expect(isError(null)).toBe(false);
        expect(isError(undefined)).toBe(false);
        expect(isError(123)).toBe(false);
      });
    });

    describe('isString', () => {
      it('should return true for string values', () => {
        expect(isString('test')).toBe(true);
        expect(isString('')).toBe(true);
        expect(isString('123')).toBe(true);
      });

      it('should return false for non-string values', () => {
        expect(isString(123)).toBe(false);
        expect(isString(null)).toBe(false);
        expect(isString(undefined)).toBe(false);
        expect(isString({})).toBe(false);
        expect(isString([])).toBe(false);
      });
    });

    describe('isObject', () => {
      it('should return true for plain objects', () => {
        expect(isObject({})).toBe(true);
        expect(isObject({ key: 'value' })).toBe(true);
        expect(isObject({ nested: { object: true } })).toBe(true);
      });

      it('should return false for non-objects', () => {
        expect(isObject(null)).toBe(false);
        expect(isObject(undefined)).toBe(false);
        expect(isObject('string')).toBe(false);
        expect(isObject(123)).toBe(false);
        expect(isObject([])).toBe(false);
        expect(isObject(new Date())).toBe(true); // Date is an object
      });
    });

    describe('isZodError', () => {
      it('should return true for Zod-like error objects', () => {
        const zodError = {
          issues: [
            { message: 'Required', path: ['field1'] },
            { message: 'Invalid email', path: ['email'] }
          ]
        };
        expect(isZodError(zodError)).toBe(true);
      });

      it('should return false for non-Zod errors', () => {
        expect(isZodError(new Error('test'))).toBe(false);
        expect(isZodError({ message: 'error' })).toBe(false);
        expect(isZodError({ issues: 'not an array' })).toBe(false);
        expect(isZodError({})).toBe(false);
      });
    });

    describe('isAxiosError', () => {
      it('should return true for Axios-like error objects', () => {
        const axiosError = {
          message: 'Request failed',
          response: { status: 404, data: { error: 'Not found' } }
        };
        expect(isAxiosError(axiosError)).toBe(true);

        const networkError = {
          message: 'Network Error',
          request: {}
        };
        expect(isAxiosError(networkError)).toBe(true);

        const timeoutError = {
          message: 'Timeout',
          code: 'ECONNABORTED'
        };
        expect(isAxiosError(timeoutError)).toBe(true);
      });

      it('should return false for non-Axios errors', () => {
        expect(isAxiosError(new Error('test'))).toBe(false);
        expect(isAxiosError({ message: 'error' })).toBe(false);
        expect(isAxiosError('error string')).toBe(false);
      });
    });

    describe('isDatabaseError', () => {
      it('should return true for database error objects', () => {
        const dbError = {
          code: '23505',
          detail: 'Key already exists',
          constraint: 'unique_constraint'
        };
        expect(isDatabaseError(dbError)).toBe(true);
      });

      it('should return false for non-database errors', () => {
        expect(isDatabaseError(new Error('test'))).toBe(false);
        expect(isDatabaseError({ message: 'error' })).toBe(false);
        expect(isDatabaseError({ code: 123 })).toBe(false); // code must be string
      });
    });
  });

  describe('Error Message Extraction', () => {
    describe('getErrorMessage', () => {
      it('should extract message from Error objects', () => {
        const error = new Error('Test error message');
        expect(getErrorMessage(error)).toBe('Test error message');
      });

      it('should return string errors as-is', () => {
        expect(getErrorMessage('String error')).toBe('String error');
      });

      it('should format Zod errors', () => {
        const zodError = {
          issues: [
            { message: 'Required', path: ['field1'] },
            { message: 'Invalid email', path: ['user', 'email'] }
          ]
        };
        const result = getErrorMessage(zodError);
        expect(result).toContain('field1: Required');
        expect(result).toContain('user.email: Invalid email');
      });

      it('should extract message from Axios errors', () => {
        const axiosError = {
          message: 'Request failed',
          response: {
            status: 400,
            data: { message: 'Validation failed' }
          }
        };
        expect(getErrorMessage(axiosError)).toBe('Validation failed');

        const axiosErrorWithError = {
          message: 'Request failed',
          response: {
            status: 500,
            data: { error: 'Internal server error' }
          }
        };
        expect(getErrorMessage(axiosErrorWithError)).toBe('Internal server error');

        const networkError = {
          message: 'Network Error',
          request: {}
        };
        expect(getErrorMessage(networkError)).toBe('Network Error');
      });

      it('should extract message from objects with message property', () => {
        const objectError = { message: 'Object error message' };
        expect(getErrorMessage(objectError)).toBe('Object error message');

        const objectWithError = { error: 'Object error property' };
        expect(getErrorMessage(objectWithError)).toBe('Object error property');
      });

      it('should stringify unknown objects', () => {
        const unknownObject = { code: 500, details: 'Something went wrong' };
        const result = getErrorMessage(unknownObject);
        expect(result).toContain('500');
        expect(result).toContain('Something went wrong');
      });

      it('should handle circular references in objects', () => {
        const circularObject: any = { name: 'test' };
        circularObject.self = circularObject;
        
        const result = getErrorMessage(circularObject);
        expect(result).toBe('Unknown error object');
      });

      it('should return fallback for unknown types', () => {
        expect(getErrorMessage(null)).toBe('An unknown error occurred');
        expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
        expect(getErrorMessage(123)).toBe('An unknown error occurred');
        expect(getErrorMessage([])).toBe('An unknown error occurred');
      });
    });

    describe('getDatabaseErrorMessage', () => {
      it('should return user-friendly messages for common database errors', () => {
        expect(getDatabaseErrorMessage({ code: '23505' })).toBe('This record already exists');
        expect(getDatabaseErrorMessage({ code: '23503' })).toBe('Referenced record does not exist');
        expect(getDatabaseErrorMessage({ code: '23502' })).toBe('Required field is missing');
        expect(getDatabaseErrorMessage({ code: '23514' })).toBe('Invalid data format');
        expect(getDatabaseErrorMessage({ code: '08006' })).toBe('Database connection failed');
        expect(getDatabaseErrorMessage({ code: '08001' })).toBe('Unable to connect to database');
      });

      it('should use detail for unknown error codes', () => {
        const dbError = {
          code: '99999',
          detail: 'Custom database error detail'
        };
        expect(getDatabaseErrorMessage(dbError)).toBe('Custom database error detail');
      });

      it('should fallback to getErrorMessage for non-database errors', () => {
        const regularError = new Error('Regular error');
        expect(getDatabaseErrorMessage(regularError)).toBe('Regular error');
      });
    });
  });

  describe('Error Response Creation', () => {
    describe('createErrorResponse', () => {
      it('should create standardized error response', () => {
        const error = new Error('Test error');
        const response = createErrorResponse(error, 400, 'req-123');
        
        expect(response.status).toBe(400);
        expect(response.headers.get('Content-Type')).toBe('application/json');
        
        // Parse response body
        return response.json().then(body => {
          expect(body.success).toBe(false);
          expect(body.error.message).toBe('Test error');
          expect(body.error.code).toBe(400);
          expect(body.error.requestId).toBe('req-123');
          expect(body.error.timestamp).toBeDefined();
        });
      });

      it('should use default status code 500', () => {
        const error = new Error('Test error');
        const response = createErrorResponse(error);
        
        expect(response.status).toBe(500);
      });

      it('should include stack trace in development', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';
        
        const error = new Error('Test error');
        const response = createErrorResponse(error, 500);
        
        return response.json().then(body => {
          expect(body.error.stack).toBeDefined();
          expect(body.error.name).toBe('Error');
          
          // Restore environment
          process.env.NODE_ENV = originalEnv;
        });
      });

      it('should hide sensitive details in production', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        
        const error = new Error('Sensitive internal error');
        const response = createErrorResponse(error, 500);
        
        return response.json().then(body => {
          expect(body.error.message).toBe('Internal server error');
          expect(body.error.stack).toBeUndefined();
          
          // Restore environment
          process.env.NODE_ENV = originalEnv;
        });
      });

      it('should preserve client error messages in production', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        
        const error = new Error('Validation failed');
        const response = createErrorResponse(error, 400);
        
        return response.json().then(body => {
          expect(body.error.message).toBe('Validation failed');
          
          // Restore environment
          process.env.NODE_ENV = originalEnv;
        });
      });
    });
  });

  describe('Safe Logging', () => {
    describe('logError', () => {
      let consoleSpy: any;

      beforeEach(() => {
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      });

      afterEach(() => {
        consoleSpy.mockRestore();
      });

      it('should log error with message and context', () => {
        const error = new Error('Test error');
        const context = { userId: '123', action: 'test' };
        
        logError('Operation failed', error, context);
        
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Operation failed')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Test error')
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('userId')
        );
      });

      it('should include stack trace in development', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';
        
        const error = new Error('Test error');
        logError('Operation failed', error);
        
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('stack')
        );
        
        // Restore environment
        process.env.NODE_ENV = originalEnv;
      });

      it('should handle unknown error types', () => {
        logError('Operation failed', 'string error');
        logError('Operation failed', { custom: 'error' });
        logError('Operation failed', null);
        
        expect(consoleSpy).toHaveBeenCalledTimes(3);
      });
    });
  });
});