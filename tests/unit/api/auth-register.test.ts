/**
 * Auth Register API - Unit Tests
 * 
 * Tests for the registration endpoint with:
 * - Input validation
 * - Error handling
 * - Retry logic
 * - User creation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RegistrationService } from '@/lib/services/auth/register';
import { AuthErrorType } from '@/lib/services/auth/types';

// Mock database
vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
}));

// Mock logger
vi.mock('@/lib/services/auth/logger', () => ({
  authLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    generateCorrelationId: () => 'test-correlation-id',
  },
}));

describe('RegistrationService', () => {
  let service: RegistrationService;
  let mockQuery: any;

  beforeEach(() => {
    service = new RegistrationService();
    mockQuery = require('@/lib/db').query;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Input Validation', () => {
    it('should reject missing fullName', async () => {
      try {
        await service.register({
          fullName: '',
          email: 'test@example.com',
          password: 'password123',
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.type).toBe(AuthErrorType.VALIDATION_ERROR);
        expect(error.userMessage).toContain('check your input');
      }
    });

    it('should reject invalid email', async () => {
      try {
        await service.register({
          fullName: 'John Doe',
          email: 'invalid-email',
          password: 'password123',
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.type).toBe(AuthErrorType.VALIDATION_ERROR);
      }
    });

    it('should reject short password', async () => {
      try {
        await service.register({
          fullName: 'John Doe',
          email: 'test@example.com',
          password: 'short',
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.type).toBe(AuthErrorType.VALIDATION_ERROR);
      }
    });

    it('should accept valid input', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // Check user exists
        .mockResolvedValueOnce({ // Create user
          rows: [{
            id: '123',
            email: 'test@example.com',
            name: 'John Doe',
            created_at: new Date(),
          }],
        });

      const result = await service.register({
        fullName: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('Duplicate Detection', () => {
    it('should reject duplicate email', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: '123' }], // User exists
      });

      try {
        await service.register({
          fullName: 'John Doe',
          email: 'existing@example.com',
          password: 'password123',
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.type).toBe(AuthErrorType.USER_EXISTS);
        expect(error.statusCode).toBe(409);
      }
    });

    it('should handle case-insensitive email check', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: '123' }], // User exists
      });

      try {
        await service.register({
          fullName: 'John Doe',
          email: 'EXISTING@EXAMPLE.COM',
          password: 'password123',
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.type).toBe(AuthErrorType.USER_EXISTS);
      }
    });
  });

  describe('Retry Logic', () => {
    it('should retry on database error', async () => {
      mockQuery
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockResolvedValueOnce({ rows: [] }) // Success on 3rd attempt
        .mockResolvedValueOnce({
          rows: [{
            id: '123',
            email: 'test@example.com',
            name: 'John Doe',
            created_at: new Date(),
          }],
        });

      const result = await service.register({
        fullName: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(mockQuery).toHaveBeenCalledTimes(4); // 3 retries + 1 create
    });

    it('should not retry on validation error', async () => {
      try {
        await service.register({
          fullName: 'John Doe',
          email: 'invalid-email',
          password: 'password123',
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(mockQuery).not.toHaveBeenCalled();
      }
    });

    it('should throw after max retries', async () => {
      mockQuery.mockRejectedValue(new Error('Connection refused'));

      try {
        await service.register({
          fullName: 'John Doe',
          email: 'test@example.com',
          password: 'password123',
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(mockQuery).toHaveBeenCalledTimes(3); // Max retries
      }
    });
  });

  describe('Password Hashing', () => {
    it('should hash password with bcrypt', async () => {
      const mockHash = require('bcryptjs').hash;
      
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{
            id: '123',
            email: 'test@example.com',
            name: 'John Doe',
            created_at: new Date(),
          }],
        });

      await service.register({
        fullName: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockHash).toHaveBeenCalledWith('password123', 12);
    });
  });

  describe('Email Sanitization', () => {
    it('should lowercase email', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{
            id: '123',
            email: 'test@example.com',
            name: 'John Doe',
            created_at: new Date(),
          }],
        });

      const result = await service.register({
        fullName: 'John Doe',
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      });

      expect(result.user.email).toBe('test@example.com');
    });

    it('should trim whitespace', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{
            id: '123',
            email: 'test@example.com',
            name: 'John Doe',
            created_at: new Date(),
          }],
        });

      await service.register({
        fullName: '  John Doe  ',
        email: '  test@example.com  ',
        password: 'password123',
      });

      const createUserCall = mockQuery.mock.calls[1];
      expect(createUserCall[1][0]).toBe('test@example.com');
      expect(createUserCall[1][1]).toBe('John Doe');
    });
  });

  describe('Error Messages', () => {
    it('should provide user-friendly error messages', async () => {
      try {
        await service.register({
          fullName: 'John Doe',
          email: 'invalid',
          password: 'password123',
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.userMessage).toBeDefined();
        expect(error.userMessage).not.toContain('SQL');
        expect(error.userMessage).not.toContain('database');
      }
    });

    it('should include correlation ID', async () => {
      try {
        await service.register({
          fullName: 'John Doe',
          email: 'invalid',
          password: 'password123',
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.correlationId).toBe('test-correlation-id');
      }
    });
  });

  describe('Response Format', () => {
    it('should return success response', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{
            id: '123',
            email: 'test@example.com',
            name: 'John Doe',
            created_at: new Date(),
          }],
        });

      const result = await service.register({
        fullName: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toMatchObject({
        success: true,
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'John Doe',
        },
        message: expect.any(String),
      });
    });

    it('should not include password in response', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{
            id: '123',
            email: 'test@example.com',
            name: 'John Doe',
            password: 'hashed_password',
            created_at: new Date(),
          }],
        });

      const result = await service.register({
        fullName: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user).not.toHaveProperty('password');
    });
  });
});
