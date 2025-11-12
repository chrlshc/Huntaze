/**
 * Unit tests for onboarding-gating middleware
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock types
interface GatingConfig {
  requiredStep: string;
  message?: string;
  isCritical?: boolean;
}

interface GatingBlockedResponse {
  error: 'PRECONDITION_REQUIRED';
  message: string;
  missingStep: string;
  correlationId: string;
}

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

/**
 * Simplified gating middleware for testing
 */
class OnboardingGatingMiddleware {
  constructor(
    private userRepo: any,
    private logger: typeof mockLogger = mockLogger
  ) {}

  async checkGating(
    userId: string,
    config: GatingConfig
  ): Promise<GatingBlockedResponse | null> {
    const correlationId = this.generateCorrelationId();
    const { requiredStep, message, isCritical = false } = config;

    try {
      this.logger.info('Gating check started', {
        userId,
        requiredStep,
        correlationId,
      });

      const isComplete = await this.userRepo.hasStepDone(userId, requiredStep);

      if (isComplete) {
        this.logger.info('Gating check passed', {
          userId,
          requiredStep,
          correlationId,
        });
        return null;
      }

      this.logger.info('Gating check blocked', {
        userId,
        requiredStep,
        correlationId,
      });

      return {
        error: 'PRECONDITION_REQUIRED',
        message: message || `Step ${requiredStep} required`,
        missingStep: requiredStep,
        correlationId,
      };
    } catch (error) {
      this.logger.error('Gating check failed', { error, correlationId });

      if (!isCritical) {
        this.logger.warn('Allowing access due to check failure (non-critical)', {
          requiredStep,
          correlationId,
        });
        return null; // Fail open
      }

      return {
        error: 'PRECONDITION_REQUIRED',
        message: 'Impossible de vérifier les prérequis. Veuillez réessayer.',
        missingStep: requiredStep,
        correlationId,
      };
    }
  }

  private generateCorrelationId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

describe('Onboarding Gating Middleware', () => {
  let mockUserRepo: any;
  let middleware: OnboardingGatingMiddleware;
  const userId = 'test-user-123';

  beforeEach(() => {
    mockUserRepo = {
      hasStepDone: jest.fn(),
    };
    middleware = new OnboardingGatingMiddleware(mockUserRepo, mockLogger);
    jest.clearAllMocks();
  });

  describe('Successful gating checks', () => {
    it('should allow access when step is completed', async () => {
      mockUserRepo.hasStepDone.mockResolvedValue(true);

      const result = await middleware.checkGating(userId, {
        requiredStep: 'payments',
      });

      expect(result).toBeNull();
      expect(mockUserRepo.hasStepDone).toHaveBeenCalledWith(userId, 'payments');
    });

    it('should log info when check passes', async () => {
      mockUserRepo.hasStepDone.mockResolvedValue(true);

      await middleware.checkGating(userId, { requiredStep: 'payments' });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Gating check started',
        expect.objectContaining({ userId, requiredStep: 'payments' })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Gating check passed',
        expect.objectContaining({ userId, requiredStep: 'payments' })
      );
    });
  });

  describe('Blocked gating checks', () => {
    it('should block access when step is not completed', async () => {
      mockUserRepo.hasStepDone.mockResolvedValue(false);

      const result = await middleware.checkGating(userId, {
        requiredStep: 'payments',
      });

      expect(result).not.toBeNull();
      expect(result?.error).toBe('PRECONDITION_REQUIRED');
      expect(result?.missingStep).toBe('payments');
    });

    it('should use custom message when provided', async () => {
      mockUserRepo.hasStepDone.mockResolvedValue(false);

      const customMessage = 'Custom error message';
      const result = await middleware.checkGating(userId, {
        requiredStep: 'payments',
        message: customMessage,
      });

      expect(result?.message).toBe(customMessage);
    });

    it('should use default message when not provided', async () => {
      mockUserRepo.hasStepDone.mockResolvedValue(false);

      const result = await middleware.checkGating(userId, {
        requiredStep: 'payments',
      });

      expect(result?.message).toBe('Step payments required');
    });

    it('should include correlation ID in blocked response', async () => {
      mockUserRepo.hasStepDone.mockResolvedValue(false);

      const result = await middleware.checkGating(userId, {
        requiredStep: 'payments',
      });

      expect(result?.correlationId).toBeDefined();
      expect(typeof result?.correlationId).toBe('string');
      expect(result?.correlationId).toMatch(/^test-/);
    });

    it('should log info when check blocks', async () => {
      mockUserRepo.hasStepDone.mockResolvedValue(false);

      await middleware.checkGating(userId, { requiredStep: 'payments' });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Gating check blocked',
        expect.objectContaining({ userId, requiredStep: 'payments' })
      );
    });
  });

  describe('Error handling', () => {
    it('should fail open for non-critical routes on error', async () => {
      mockUserRepo.hasStepDone.mockRejectedValue(new Error('Database error'));

      const result = await middleware.checkGating(userId, {
        requiredStep: 'payments',
        isCritical: false,
      });

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Allowing access due to check failure (non-critical)',
        expect.any(Object)
      );
    });

    it('should fail closed for critical routes on error', async () => {
      mockUserRepo.hasStepDone.mockRejectedValue(new Error('Database error'));

      const result = await middleware.checkGating(userId, {
        requiredStep: 'payments',
        isCritical: true,
      });

      expect(result).not.toBeNull();
      expect(result?.error).toBe('PRECONDITION_REQUIRED');
      expect(result?.message).toBe(
        'Impossible de vérifier les prérequis. Veuillez réessayer.'
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should default to non-critical (fail-open) when not specified', async () => {
      mockUserRepo.hasStepDone.mockRejectedValue(new Error('Database error'));

      const result = await middleware.checkGating(userId, {
        requiredStep: 'payments',
      });

      expect(result).toBeNull();
    });

    it('should log error details', async () => {
      const dbError = new Error('Database connection failed');
      mockUserRepo.hasStepDone.mockRejectedValue(dbError);

      await middleware.checkGating(userId, {
        requiredStep: 'payments',
        isCritical: false,
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Gating check failed',
        expect.objectContaining({ error: dbError })
      );
    });
  });

  describe('Correlation ID propagation', () => {
    it('should generate unique correlation IDs', async () => {
      mockUserRepo.hasStepDone.mockResolvedValue(false);

      const result1 = await middleware.checkGating(userId, {
        requiredStep: 'payments',
      });
      const result2 = await middleware.checkGating(userId, {
        requiredStep: 'theme',
      });

      expect(result1?.correlationId).not.toBe(result2?.correlationId);
    });

    it('should include correlation ID in all log entries', async () => {
      mockUserRepo.hasStepDone.mockResolvedValue(false);

      await middleware.checkGating(userId, { requiredStep: 'payments' });

      const logCalls = mockLogger.info.mock.calls;
      const correlationIds = logCalls.map((call: any) => call[1]?.correlationId);

      expect(correlationIds.every((id: string) => id)).toBe(true);
      expect(new Set(correlationIds).size).toBe(1); // All same ID
    });
  });

  describe('Multiple step checks', () => {
    it('should handle multiple sequential checks', async () => {
      mockUserRepo.hasStepDone
        .mockResolvedValueOnce(true) // payments done
        .mockResolvedValueOnce(false) // theme not done
        .mockResolvedValueOnce(true); // product done

      const result1 = await middleware.checkGating(userId, {
        requiredStep: 'payments',
      });
      const result2 = await middleware.checkGating(userId, {
        requiredStep: 'theme',
      });
      const result3 = await middleware.checkGating(userId, {
        requiredStep: 'product',
      });

      expect(result1).toBeNull();
      expect(result2).not.toBeNull();
      expect(result3).toBeNull();
    });

    it('should call repository for each check', async () => {
      mockUserRepo.hasStepDone.mockResolvedValue(true);

      await middleware.checkGating(userId, { requiredStep: 'payments' });
      await middleware.checkGating(userId, { requiredStep: 'theme' });

      expect(mockUserRepo.hasStepDone).toHaveBeenCalledTimes(2);
      expect(mockUserRepo.hasStepDone).toHaveBeenCalledWith(userId, 'payments');
      expect(mockUserRepo.hasStepDone).toHaveBeenCalledWith(userId, 'theme');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty step ID', async () => {
      mockUserRepo.hasStepDone.mockResolvedValue(false);

      const result = await middleware.checkGating(userId, {
        requiredStep: '',
      });

      expect(result).not.toBeNull();
      expect(result?.missingStep).toBe('');
    });

    it('should handle very long step IDs', async () => {
      const longStepId = 'a'.repeat(1000);
      mockUserRepo.hasStepDone.mockResolvedValue(false);

      const result = await middleware.checkGating(userId, {
        requiredStep: longStepId,
      });

      expect(result?.missingStep).toBe(longStepId);
    });

    it('should handle special characters in step IDs', async () => {
      const specialStepId = 'step-with-special_chars.123';
      mockUserRepo.hasStepDone.mockResolvedValue(false);

      const result = await middleware.checkGating(userId, {
        requiredStep: specialStepId,
      });

      expect(result?.missingStep).toBe(specialStepId);
    });
  });
});
