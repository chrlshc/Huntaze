/**
 * Onboarding Service - Unit Tests
 * 
 * Tests for onboarding status management with:
 * - Status checking
 * - Completion tracking
 * - Error handling
 * - Retry logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OnboardingService } from '../../../lib/services/auth/onboarding';
import { AuthErrorType } from '../../../lib/services/auth/types';

// Mock database
vi.mock('@/lib/db', () => ({
  query: vi.fn(),
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

import { query } from '@/lib/db';

describe('OnboardingService', () => {
  let service: OnboardingService;

  beforeEach(() => {
    service = new OnboardingService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isOnboardingCompleted', () => {
    it('should return true when onboarding is completed', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({
        rows: [{ onboarding_completed: true }],
        rowCount: 1,
      } as any);

      const result = await service.isOnboardingCompleted('user_123');
      
      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT onboarding_completed FROM users WHERE id = $1',
        ['user_123']
      );
    });

    it('should return false when onboarding is not completed', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({
        rows: [{ onboarding_completed: false }],
        rowCount: 1,
      } as any);

      const result = await service.isOnboardingCompleted('user_123');
      
      expect(result).toBe(false);
    });

    it('should return false when onboarding_completed is null', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({
        rows: [{ onboarding_completed: null }],
        rowCount: 1,
      } as any);

      const result = await service.isOnboardingCompleted('user_123');
      
      expect(result).toBe(false);
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      try {
        await service.isOnboardingCompleted('nonexistent_user');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.type).toBe(AuthErrorType.USER_NOT_FOUND);
        expect(error.statusCode).toBe(404);
      }
    });

    it('should retry on database error', async () => {
      const mockQuery = vi.mocked(query);
      
      // Fail twice, succeed on third attempt
      mockQuery
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValueOnce({
          rows: [{ onboarding_completed: true }],
          rowCount: 1,
        } as any);

      const result = await service.isOnboardingCompleted('user_123');
      
      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledTimes(3);
    });
  });

  describe('completeOnboarding', () => {
    it('should mark onboarding as completed', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'user_123', onboarding_completed: true }],
        rowCount: 1,
      } as any);

      await service.completeOnboarding('user_123');
      
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        ['user_123']
      );
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      try {
        await service.completeOnboarding('nonexistent_user');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.type).toBe(AuthErrorType.USER_NOT_FOUND);
        expect(error.statusCode).toBe(404);
      }
    });

    it('should retry on database error', async () => {
      const mockQuery = vi.mocked(query);
      
      // Fail once, succeed on second attempt
      mockQuery
        .mockRejectedValueOnce(new Error('Deadlock detected'))
        .mockResolvedValueOnce({
          rows: [{ id: 'user_123', onboarding_completed: true }],
          rowCount: 1,
        } as any);

      await service.completeOnboarding('user_123');
      
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe('resetOnboarding', () => {
    it('should reset onboarding status', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'user_123', onboarding_completed: false }],
        rowCount: 1,
      } as any);

      await service.resetOnboarding('user_123');
      
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        ['user_123']
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('onboarding_completed = false'),
        ['user_123']
      );
    });
  });

  describe('getOnboardingStats', () => {
    it('should return onboarding statistics', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({
        rows: [{
          total: '100',
          completed: '75',
          pending: '25',
        }],
        rowCount: 1,
      } as any);

      const stats = await service.getOnboardingStats();
      
      expect(stats).toEqual({
        total: 100,
        completed: 75,
        pending: 25,
        completionRate: 75,
      });
    });

    it('should handle zero users', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({
        rows: [{
          total: '0',
          completed: '0',
          pending: '0',
        }],
        rowCount: 1,
      } as any);

      const stats = await service.getOnboardingStats();
      
      expect(stats).toEqual({
        total: 0,
        completed: 0,
        pending: 0,
        completionRate: 0,
      });
    });

    it('should calculate completion rate correctly', async () => {
      const mockQuery = vi.mocked(query);
      mockQuery.mockResolvedValueOnce({
        rows: [{
          total: '150',
          completed: '100',
          pending: '50',
        }],
        rowCount: 1,
      } as any);

      const stats = await service.getOnboardingStats();
      
      expect(stats.completionRate).toBe(66.67);
    });
  });
});
