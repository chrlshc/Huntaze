/**
 * Integration Types - Unit Tests
 * 
 * Tests for type guards and utility functions in integration types
 * 
 * @see lib/services/integrations/types.ts
 */

import { describe, it, expect } from 'vitest';
import {
  isIntegrationError,
  isSuccessResponse,
  isErrorResponse,
  isValidIntegrationData,
  isMultiAccountProvider,
  getMultiAccountProviders,
  createIntegrationError,
  IntegrationErrorCode,
  type IntegrationApiData,
  type ApiResponse,
  type Provider,
} from '@/lib/services/integrations/types';

describe('Integration Types - Type Guards', () => {
  describe('isIntegrationError', () => {
    it('should return true for valid IntegrationError', () => {
      const error = createIntegrationError(
        IntegrationErrorCode.NETWORK_ERROR,
        'Network error'
      );
      
      expect(isIntegrationError(error)).toBe(true);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Regular error');
      
      expect(isIntegrationError(error)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isIntegrationError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isIntegrationError(undefined)).toBe(false);
    });

    it('should return false for object without required fields', () => {
      const error = { code: 'ERROR', message: 'Error' };
      
      expect(isIntegrationError(error)).toBe(false);
    });
  });

  describe('isSuccessResponse', () => {
    it('should return true for successful response', () => {
      const response: ApiResponse<{ id: number }> = {
        success: true,
        data: { id: 1 },
      };
      
      expect(isSuccessResponse(response)).toBe(true);
    });

    it('should return false for error response', () => {
      const response: ApiResponse<any> = {
        success: false,
        error: {
          code: 'ERROR',
          message: 'Error occurred',
        },
      };
      
      expect(isSuccessResponse(response)).toBe(false);
    });

    it('should return false for response without data', () => {
      const response: ApiResponse<any> = {
        success: true,
      };
      
      expect(isSuccessResponse(response)).toBe(false);
    });
  });

  describe('isErrorResponse', () => {
    it('should return true for error response', () => {
      const response: ApiResponse<any> = {
        success: false,
        error: {
          code: 'ERROR',
          message: 'Error occurred',
        },
      };
      
      expect(isErrorResponse(response)).toBe(true);
    });

    it('should return false for successful response', () => {
      const response: ApiResponse<{ id: number }> = {
        success: true,
        data: { id: 1 },
      };
      
      expect(isErrorResponse(response)).toBe(false);
    });

    it('should return false for response without error', () => {
      const response: ApiResponse<any> = {
        success: false,
      };
      
      expect(isErrorResponse(response)).toBe(false);
    });
  });

  describe('isValidIntegrationData', () => {
    it('should return true for valid integration data', () => {
      const data: IntegrationApiData = {
        id: 1,
        provider: 'instagram',
        accountId: 'account123',
        accountName: '@user',
        status: 'connected',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };
      
      expect(isValidIntegrationData(data)).toBe(true);
    });

    it('should return false for data missing required fields', () => {
      const data = {
        id: 1,
        provider: 'instagram',
        // Missing accountId, status, createdAt, updatedAt
      };
      
      expect(isValidIntegrationData(data)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isValidIntegrationData(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidIntegrationData(undefined)).toBe(false);
    });
  });

  describe('isMultiAccountProvider', () => {
    it('should return true for provider with multiple accounts', () => {
      const integrations: IntegrationApiData[] = [
        {
          id: 1,
          provider: 'instagram',
          accountId: 'account1',
          accountName: '@user1',
          status: 'connected',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 2,
          provider: 'instagram',
          accountId: 'account2',
          accountName: '@user2',
          status: 'connected',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];
      
      expect(isMultiAccountProvider('instagram', integrations)).toBe(true);
    });

    it('should return false for provider with single account', () => {
      const integrations: IntegrationApiData[] = [
        {
          id: 1,
          provider: 'instagram',
          accountId: 'account1',
          accountName: '@user1',
          status: 'connected',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];
      
      expect(isMultiAccountProvider('instagram', integrations)).toBe(false);
    });

    it('should return false for provider with no accounts', () => {
      const integrations: IntegrationApiData[] = [];
      
      expect(isMultiAccountProvider('instagram', integrations)).toBe(false);
    });

    it('should only count accounts for specified provider', () => {
      const integrations: IntegrationApiData[] = [
        {
          id: 1,
          provider: 'instagram',
          accountId: 'account1',
          accountName: '@user1',
          status: 'connected',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 2,
          provider: 'tiktok',
          accountId: 'account2',
          accountName: '@user2',
          status: 'connected',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];
      
      expect(isMultiAccountProvider('instagram', integrations)).toBe(false);
      expect(isMultiAccountProvider('tiktok', integrations)).toBe(false);
    });
  });

  describe('getMultiAccountProviders', () => {
    it('should return providers with multiple accounts', () => {
      const integrations: IntegrationApiData[] = [
        {
          id: 1,
          provider: 'instagram',
          accountId: 'account1',
          accountName: '@user1',
          status: 'connected',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 2,
          provider: 'instagram',
          accountId: 'account2',
          accountName: '@user2',
          status: 'connected',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 3,
          provider: 'tiktok',
          accountId: 'account3',
          accountName: '@user3',
          status: 'connected',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];
      
      const result = getMultiAccountProviders(integrations);
      
      expect(result).toEqual(['instagram']);
      expect(result).not.toContain('tiktok');
    });

    it('should return empty array when no multi-account providers', () => {
      const integrations: IntegrationApiData[] = [
        {
          id: 1,
          provider: 'instagram',
          accountId: 'account1',
          accountName: '@user1',
          status: 'connected',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 2,
          provider: 'tiktok',
          accountId: 'account2',
          accountName: '@user2',
          status: 'connected',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];
      
      const result = getMultiAccountProviders(integrations);
      
      expect(result).toEqual([]);
    });

    it('should return multiple providers with multiple accounts', () => {
      const integrations: IntegrationApiData[] = [
        {
          id: 1,
          provider: 'instagram',
          accountId: 'account1',
          accountName: '@user1',
          status: 'connected',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 2,
          provider: 'instagram',
          accountId: 'account2',
          accountName: '@user2',
          status: 'connected',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 3,
          provider: 'tiktok',
          accountId: 'account3',
          accountName: '@user3',
          status: 'connected',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 4,
          provider: 'tiktok',
          accountId: 'account4',
          accountName: '@user4',
          status: 'connected',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];
      
      const result = getMultiAccountProviders(integrations);
      
      expect(result).toHaveLength(2);
      expect(result).toContain('instagram');
      expect(result).toContain('tiktok');
    });

    it('should return empty array for empty integrations', () => {
      const result = getMultiAccountProviders([]);
      
      expect(result).toEqual([]);
    });
  });

  describe('createIntegrationError', () => {
    it('should create error with all properties', () => {
      const error = createIntegrationError(
        IntegrationErrorCode.NETWORK_ERROR,
        'Network error occurred',
        {
          provider: 'instagram',
          statusCode: 500,
          correlationId: 'abc-123',
          metadata: { attempt: 1 },
        }
      );
      
      expect(error.code).toBe(IntegrationErrorCode.NETWORK_ERROR);
      expect(error.message).toBe('Network error occurred');
      expect(error.provider).toBe('instagram');
      expect(error.statusCode).toBe(500);
      expect(error.correlationId).toBe('abc-123');
      expect(error.metadata).toEqual({ attempt: 1 });
      expect(error.retryable).toBe(true);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should mark network errors as retryable', () => {
      const error = createIntegrationError(
        IntegrationErrorCode.NETWORK_ERROR,
        'Network error'
      );
      
      expect(error.retryable).toBe(true);
    });

    it('should mark validation errors as non-retryable', () => {
      const error = createIntegrationError(
        IntegrationErrorCode.VALIDATION_ERROR,
        'Validation error'
      );
      
      expect(error.retryable).toBe(false);
    });

    it('should mark OAuth errors as non-retryable', () => {
      const error = createIntegrationError(
        IntegrationErrorCode.INVALID_STATE,
        'Invalid OAuth state'
      );
      
      expect(error.retryable).toBe(false);
    });

    it('should include cause if provided', () => {
      const cause = new Error('Original error');
      const error = createIntegrationError(
        IntegrationErrorCode.API_ERROR,
        'API error',
        { cause }
      );
      
      expect(error.cause).toBe(cause);
    });
  });
});
