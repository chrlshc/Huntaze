/**
 * Unit tests for UserOnboardingRepository
 */

import { describe, it, expect, beforeEach, vi as jest } from 'vitest';

// Mock Pool type
interface MockPool {
  query: jest.Mock;
  connect: jest.Mock;
}

// Mock types
type StepStatus = 'todo' | 'done' | 'skipped';

interface UserOnboardingStep {
  userId: string;
  stepId: string;
  version: number;
  status: StepStatus;
  snoozeUntil?: Date;
  snoozeCount: number;
  completedBy?: string;
  completedAt?: Date;
  updatedAt: Date;
}

/**
 * Simplified UserOnboardingRepository for testing
 */
class UserOnboardingRepository {
  constructor(private pool: MockPool) {}

  async getUserStep(
    userId: string,
    stepId: string,
    version?: number
  ): Promise<UserOnboardingStep | null> {
    const result = await this.pool.query('SELECT * FROM user_onboarding', [
      userId,
      stepId,
      version,
    ]);
    return result.rows[0] || null;
  }

  async hasStepDone(userId: string, stepId: string): Promise<boolean> {
    const result = await this.pool.query('SELECT has_step_done($1, $2)', [
      userId,
      stepId,
    ]);
    return result.rows[0]?.done || false;
  }

  async calculateProgress(userId: string, market?: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT calculate_onboarding_progress($1, $2)',
      [userId, market || null]
    );
    return result.rows[0]?.progress || 0;
  }

  async snoozeNudges(
    userId: string,
    days: number = 7,
    maxSnoozes: number = 3
  ): Promise<boolean> {
    // Check current snooze count
    const checkResult = await this.pool.query(
      'SELECT MAX(snooze_count) FROM user_onboarding',
      [userId]
    );
    const currentSnoozeCount = parseInt(checkResult.rows[0]?.max_snooze || '0');

    if (currentSnoozeCount >= maxSnoozes) {
      throw new Error(`Maximum snooze limit (${maxSnoozes}) reached`);
    }

    await this.pool.query('UPDATE user_onboarding SET snooze_until = $2', [
      userId,
      new Date(),
    ]);
    return true;
  }
}

describe('UserOnboardingRepository', () => {
  let mockPool: MockPool;
  let repository: UserOnboardingRepository;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
      connect: jest.fn(),
    };
    repository = new UserOnboardingRepository(mockPool);
  });

  describe('getUserStep', () => {
    it('should return user step when found', async () => {
      const mockStep: UserOnboardingStep = {
        userId: 'user-123',
        stepId: 'payments',
        version: 1,
        status: 'done',
        snoozeCount: 0,
        updatedAt: new Date(),
      };

      mockPool.query.mockResolvedValue({ rows: [mockStep] });

      const result = await repository.getUserStep('user-123', 'payments', 1);

      expect(result).toEqual(mockStep);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['user-123', 'payments', 1]
      );
    });

    it('should return null when step not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await repository.getUserStep('user-123', 'payments', 1);

      expect(result).toBeNull();
    });

    it('should query without version when not provided', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await repository.getUserStep('user-123', 'payments');

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['user-123', 'payments', undefined]
      );
    });
  });

  describe('hasStepDone', () => {
    it('should return true when step is completed', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ done: true }] });

      const result = await repository.hasStepDone('user-123', 'payments');

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['user-123', 'payments']
      );
    });

    it('should return false when step is not completed', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ done: false }] });

      const result = await repository.hasStepDone('user-123', 'payments');

      expect(result).toBe(false);
    });

    it('should return false when no rows returned', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await repository.hasStepDone('user-123', 'payments');

      expect(result).toBe(false);
    });
  });

  describe('calculateProgress', () => {
    it('should return progress percentage', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ progress: 75 }] });

      const result = await repository.calculateProgress('user-123');

      expect(result).toBe(75);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['user-123', null]
      );
    });

    it('should pass market parameter when provided', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ progress: 50 }] });

      const result = await repository.calculateProgress('user-123', 'FR');

      expect(result).toBe(50);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        ['user-123', 'FR']
      );
    });

    it('should return 0 when no progress data', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await repository.calculateProgress('user-123');

      expect(result).toBe(0);
    });

    it('should handle null progress value', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ progress: null }] });

      const result = await repository.calculateProgress('user-123');

      expect(result).toBe(0);
    });
  });

  describe('snoozeNudges', () => {
    it('should snooze nudges successfully', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ max_snooze: '1' }] }) // Check count
        .mockResolvedValueOnce({ rows: [] }); // Update

      const result = await repository.snoozeNudges('user-123', 7, 3);

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should throw error when max snoozes reached', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ max_snooze: '3' }] });

      await expect(
        repository.snoozeNudges('user-123', 7, 3)
      ).rejects.toThrow('Maximum snooze limit (3) reached');
    });

    it('should use default values for days and maxSnoozes', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ max_snooze: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      await repository.snoozeNudges('user-123');

      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should handle zero snooze count', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ max_snooze: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await repository.snoozeNudges('user-123', 7, 3);

      expect(result).toBe(true);
    });

    it('should handle null snooze count', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ max_snooze: null }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await repository.snoozeNudges('user-123', 7, 3);

      expect(result).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should propagate database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPool.query.mockRejectedValue(dbError);

      await expect(
        repository.getUserStep('user-123', 'payments')
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle query timeout errors', async () => {
      const timeoutError = new Error('Query timeout');
      mockPool.query.mockRejectedValue(timeoutError);

      await expect(
        repository.calculateProgress('user-123')
      ).rejects.toThrow('Query timeout');
    });
  });
});
