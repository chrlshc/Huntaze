/**
 * Unit tests for onboarding gating logic
 */

import { describe, it, expect, beforeEach, vi as jest } from 'vitest';

// Mock types based on the actual middleware
interface GatingConfig {
  requiredStep: string;
  message?: string;
  action?: {
    type: 'open_modal' | 'redirect';
    modal?: string;
    url?: string;
    prefill?: Record<string, any>;
  };
  isCritical?: boolean;
}

interface GatingBlockedResponse {
  error: 'PRECONDITION_REQUIRED';
  message: string;
  missingStep: string;
  action: {
    type: 'open_modal' | 'redirect';
    modal?: string;
    url?: string;
    prefill?: Record<string, any>;
  };
  correlationId: string;
}

// Mock user onboarding repository
class MockUserOnboardingRepository {
  private completedSteps: Set<string> = new Set();

  setCompletedSteps(steps: string[]) {
    this.completedSteps = new Set(steps);
  }

  async hasStepDone(userId: string, stepId: string): Promise<boolean> {
    return this.completedSteps.has(stepId);
  }
}

/**
 * Simulate the requireStep middleware logic
 */
async function requireStep(
  config: GatingConfig,
  userId: string,
  repo: MockUserOnboardingRepository
): Promise<GatingBlockedResponse | null> {
  const { requiredStep, message, action, isCritical = false } = config;
  const correlationId = 'test-correlation-id';

  try {
    // Check if user has completed the required step
    const isComplete = await repo.hasStepDone(userId, requiredStep);

    if (isComplete) {
      return null; // Allow access
    }

    // Step is not complete - block access
    const defaultMessages: Record<string, string> = {
      email_verification: 'Vous devez vérifier votre email avant de continuer',
      payments: 'Vous devez configurer les paiements avant de publier votre boutique',
      theme: 'Vous devez configurer un thème avant de publier',
      product: 'Vous devez ajouter au moins un produit avant de publier',
    };

    const defaultActions: Record<string, GatingBlockedResponse['action']> = {
      email_verification: { type: 'open_modal', modal: 'email_verification' },
      payments: { type: 'open_modal', modal: 'payments_setup', prefill: {} },
      theme: { type: 'redirect', url: '/admin/themes' },
      product: { type: 'redirect', url: '/admin/products/new' },
    };

    const stepMessage =
      message ||
      defaultMessages[requiredStep] ||
      `Vous devez compléter l'étape "${requiredStep}" avant de continuer`;

    const stepAction = action || defaultActions[requiredStep] || {
      type: 'redirect' as const,
      url: '/onboarding',
    };

    return {
      error: 'PRECONDITION_REQUIRED',
      message: stepMessage,
      missingStep: requiredStep,
      action: stepAction,
      correlationId,
    };
  } catch (error) {
    // Simulate fail-open vs fail-closed behavior
    if (!isCritical) {
      return null; // Fail open - allow access
    }

    // Fail closed for critical routes
    return {
      error: 'PRECONDITION_REQUIRED',
      message: 'Unable to verify prerequisites. Please try again.',
      missingStep: requiredStep,
      action: { type: 'redirect' as const, url: '/onboarding' },
      correlationId: 'error-correlation-id',
    };
  }
}

describe('Gating Logic', () => {
  let repo: MockUserOnboardingRepository;
  const userId = 'test-user-123';

  beforeEach(() => {
    repo = new MockUserOnboardingRepository();
  });

  describe('requireStep with completed steps', () => {
    it('should allow access when required step is completed', async () => {
      repo.setCompletedSteps(['payments']);

      const result = await requireStep(
        { requiredStep: 'payments' },
        userId,
        repo
      );

      expect(result).toBeNull();
    });

    it('should allow access when multiple steps are completed', async () => {
      repo.setCompletedSteps(['email_verification', 'payments', 'theme']);

      const result = await requireStep(
        { requiredStep: 'payments' },
        userId,
        repo
      );

      expect(result).toBeNull();
    });

    it('should allow access for any completed step', async () => {
      repo.setCompletedSteps(['theme']);

      const themeResult = await requireStep(
        { requiredStep: 'theme' },
        userId,
        repo
      );
      expect(themeResult).toBeNull();

      const paymentsResult = await requireStep(
        { requiredStep: 'payments' },
        userId,
        repo
      );
      expect(paymentsResult).not.toBeNull();
    });
  });

  describe('requireStep with incomplete steps', () => {
    it('should block access when required step is not completed', async () => {
      repo.setCompletedSteps([]);

      const result = await requireStep(
        { requiredStep: 'payments' },
        userId,
        repo
      );

      expect(result).not.toBeNull();
      expect(result?.error).toBe('PRECONDITION_REQUIRED');
      expect(result?.missingStep).toBe('payments');
    });

    it('should return default message for known steps', async () => {
      repo.setCompletedSteps([]);

      const result = await requireStep(
        { requiredStep: 'payments' },
        userId,
        repo
      );

      expect(result?.message).toBe(
        'Vous devez configurer les paiements avant de publier votre boutique'
      );
    });

    it('should return custom message when provided', async () => {
      repo.setCompletedSteps([]);

      const customMessage = 'Message personnalisé';
      const result = await requireStep(
        {
          requiredStep: 'payments',
          message: customMessage,
        },
        userId,
        repo
      );

      expect(result?.message).toBe(customMessage);
    });

    it('should return default action for known steps', async () => {
      repo.setCompletedSteps([]);

      const result = await requireStep(
        { requiredStep: 'payments' },
        userId,
        repo
      );

      expect(result?.action.type).toBe('open_modal');
      expect(result?.action.modal).toBe('payments_setup');
    });

    it('should return custom action when provided', async () => {
      repo.setCompletedSteps([]);

      const customAction = {
        type: 'redirect' as const,
        url: '/custom/path',
      };

      const result = await requireStep(
        {
          requiredStep: 'payments',
          action: customAction,
        },
        userId,
        repo
      );

      expect(result?.action).toEqual(customAction);
    });

    it('should include correlation ID in response', async () => {
      repo.setCompletedSteps([]);

      const result = await requireStep(
        { requiredStep: 'payments' },
        userId,
        repo
      );

      expect(result?.correlationId).toBeDefined();
      expect(typeof result?.correlationId).toBe('string');
    });
  });

  describe('Default messages and actions', () => {
    beforeEach(() => {
      repo.setCompletedSteps([]);
    });

    it('should use correct default for email_verification', async () => {
      const result = await requireStep(
        { requiredStep: 'email_verification' },
        userId,
        repo
      );

      expect(result?.message).toBe(
        'Vous devez vérifier votre email avant de continuer'
      );
      expect(result?.action.type).toBe('open_modal');
      expect(result?.action.modal).toBe('email_verification');
    });

    it('should use correct default for theme', async () => {
      const result = await requireStep(
        { requiredStep: 'theme' },
        userId,
        repo
      );

      expect(result?.message).toBe(
        'Vous devez configurer un thème avant de publier'
      );
      expect(result?.action.type).toBe('redirect');
      expect(result?.action.url).toBe('/admin/themes');
    });

    it('should use correct default for product', async () => {
      const result = await requireStep(
        { requiredStep: 'product' },
        userId,
        repo
      );

      expect(result?.message).toBe(
        'Vous devez ajouter au moins un produit avant de publier'
      );
      expect(result?.action.type).toBe('redirect');
      expect(result?.action.url).toBe('/admin/products/new');
    });

    it('should use generic message for unknown steps', async () => {
      const result = await requireStep(
        { requiredStep: 'unknown_step' },
        userId,
        repo
      );

      expect(result?.message).toBe(
        'Vous devez compléter l\'étape "unknown_step" avant de continuer'
      );
      expect(result?.action.type).toBe('redirect');
      expect(result?.action.url).toBe('/onboarding');
    });
  });

  describe('Fail-open vs fail-closed behavior', () => {
    it('should fail open (allow access) for non-critical routes on error', async () => {
      // Simulate error by using a repo that throws
      const errorRepo = {
        hasStepDone: jest.fn().mockRejectedValue(new Error('Database error')),
      } as any;

      const result = await requireStep(
        {
          requiredStep: 'payments',
          isCritical: false,
        },
        userId,
        errorRepo
      );

      expect(result).toBeNull();
    });

    it('should fail closed (block access) for critical routes on error', async () => {
      // Simulate error by using a repo that throws
      const errorRepo = {
        hasStepDone: jest.fn().mockRejectedValue(new Error('Database error')),
      } as any;

      const result = await requireStep(
        {
          requiredStep: 'payments',
          isCritical: true,
        },
        userId,
        errorRepo
      );

      expect(result).not.toBeNull();
      expect(result?.error).toBe('PRECONDITION_REQUIRED');
      expect(result?.message).toBe(
        'Unable to verify prerequisites. Please try again.'
      );
    });

    it('should default to non-critical (fail-open) when isCritical not specified', async () => {
      const errorRepo = {
        hasStepDone: jest.fn().mockRejectedValue(new Error('Database error')),
      } as any;

      const result = await requireStep(
        { requiredStep: 'payments' },
        userId,
        errorRepo
      );

      expect(result).toBeNull();
    });
  });

  describe('Multiple step scenarios', () => {
    it('should block when checking multiple steps and one is incomplete', async () => {
      repo.setCompletedSteps(['email_verification', 'theme']);

      const paymentsResult = await requireStep(
        { requiredStep: 'payments' },
        userId,
        repo
      );
      expect(paymentsResult).not.toBeNull();

      const themeResult = await requireStep(
        { requiredStep: 'theme' },
        userId,
        repo
      );
      expect(themeResult).toBeNull();
    });

    it('should allow when all required steps are completed', async () => {
      repo.setCompletedSteps(['email_verification', 'payments', 'theme', 'product']);

      const checks = ['email_verification', 'payments', 'theme', 'product'];
      
      for (const step of checks) {
        const result = await requireStep({ requiredStep: step }, userId, repo);
        expect(result).toBeNull();
      }
    });
  });

  describe('Action prefill data', () => {
    it('should include prefill data in modal actions', async () => {
      repo.setCompletedSteps([]);

      const result = await requireStep(
        {
          requiredStep: 'payments',
          action: {
            type: 'open_modal',
            modal: 'payments_setup',
            prefill: { currency: 'EUR', country: 'FR' },
          },
        },
        userId,
        repo
      );

      expect(result?.action.prefill).toEqual({ currency: 'EUR', country: 'FR' });
    });

    it('should not include prefill for redirect actions', async () => {
      repo.setCompletedSteps([]);

      const result = await requireStep(
        {
          requiredStep: 'theme',
          action: {
            type: 'redirect',
            url: '/admin/themes',
          },
        },
        userId,
        repo
      );

      expect(result?.action.prefill).toBeUndefined();
    });
  });
});
