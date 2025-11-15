/**
 * Unit tests for step transition validation logic
 */

import { describe, it, expect } from 'vitest';

type StepStatus = 'todo' | 'done' | 'skipped';

/**
 * Validate if a status transition is allowed
 * Based on the database function can_transition_to
 */
function canTransitionTo(
  currentStatus: StepStatus,
  newStatus: StepStatus,
  isRequired: boolean
): boolean {
  // Same status is always allowed (idempotent)
  if (currentStatus === newStatus) {
    return true;
  }

  // From 'todo' state
  if (currentStatus === 'todo') {
    // Can transition to 'done' or 'skipped'
    return newStatus === 'done' || newStatus === 'skipped';
  }

  // From 'done' state
  if (currentStatus === 'done') {
    // Can only go back to 'todo' (undo completion)
    // Cannot skip a completed step
    return newStatus === 'todo';
  }

  // From 'skipped' state
  if (currentStatus === 'skipped') {
    // Required steps cannot be skipped, so this should not happen
    // But if it does, can go back to 'todo' or complete it
    if (isRequired) {
      // Required steps should not be skipped, but allow recovery
      return newStatus === 'todo' || newStatus === 'done';
    }
    // Optional steps can go from skipped to todo or done
    return newStatus === 'todo' || newStatus === 'done';
  }

  return false;
}

/**
 * Validate step status update
 */
function validateStepUpdate(
  currentStatus: StepStatus,
  newStatus: StepStatus,
  isRequired: boolean
): { valid: boolean; error?: string } {
  if (!canTransitionTo(currentStatus, newStatus, isRequired)) {
    return {
      valid: false,
      error: `Invalid status transition from ${currentStatus} to ${newStatus} for ${
        isRequired ? 'required' : 'optional'
      } step`,
    };
  }

  // Additional validation: required steps cannot be skipped
  if (isRequired && newStatus === 'skipped') {
    return {
      valid: false,
      error: 'Required steps cannot be skipped',
    };
  }

  return { valid: true };
}

describe('Step Transition Validation', () => {
  describe('Valid transitions from todo', () => {
    it('should allow todo → done transition', () => {
      expect(canTransitionTo('todo', 'done', true)).toBe(true);
      expect(canTransitionTo('todo', 'done', false)).toBe(true);
    });

    it('should allow todo → skipped transition for optional steps', () => {
      expect(canTransitionTo('todo', 'skipped', false)).toBe(true);
    });

    it('should allow todo → skipped transition (validation happens elsewhere)', () => {
      // The canTransitionTo function allows it, but validateStepUpdate will block it
      expect(canTransitionTo('todo', 'skipped', true)).toBe(true);
    });

    it('should allow todo → todo transition (idempotent)', () => {
      expect(canTransitionTo('todo', 'todo', true)).toBe(true);
      expect(canTransitionTo('todo', 'todo', false)).toBe(true);
    });
  });

  describe('Valid transitions from done', () => {
    it('should allow done → todo transition (undo)', () => {
      expect(canTransitionTo('done', 'todo', true)).toBe(true);
      expect(canTransitionTo('done', 'todo', false)).toBe(true);
    });

    it('should allow done → done transition (idempotent)', () => {
      expect(canTransitionTo('done', 'done', true)).toBe(true);
      expect(canTransitionTo('done', 'done', false)).toBe(true);
    });

    it('should not allow done → skipped transition', () => {
      expect(canTransitionTo('done', 'skipped', true)).toBe(false);
      expect(canTransitionTo('done', 'skipped', false)).toBe(false);
    });
  });

  describe('Valid transitions from skipped', () => {
    it('should allow skipped → todo transition', () => {
      expect(canTransitionTo('skipped', 'todo', false)).toBe(true);
    });

    it('should allow skipped → done transition', () => {
      expect(canTransitionTo('skipped', 'done', false)).toBe(true);
    });

    it('should allow skipped → skipped transition (idempotent)', () => {
      expect(canTransitionTo('skipped', 'skipped', false)).toBe(true);
    });

    it('should allow recovery from skipped for required steps', () => {
      // Required steps should not be skipped, but allow recovery
      expect(canTransitionTo('skipped', 'todo', true)).toBe(true);
      expect(canTransitionTo('skipped', 'done', true)).toBe(true);
    });
  });

  describe('Invalid transitions', () => {
    it('should not allow done → skipped', () => {
      expect(canTransitionTo('done', 'skipped', true)).toBe(false);
      expect(canTransitionTo('done', 'skipped', false)).toBe(false);
    });
  });

  describe('Required vs optional step transitions', () => {
    it('should block skipping required steps in validateStepUpdate', () => {
      const result = validateStepUpdate('todo', 'skipped', true);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Required steps cannot be skipped');
    });

    it('should allow skipping optional steps', () => {
      const result = validateStepUpdate('todo', 'skipped', false);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should allow completing required steps', () => {
      const result = validateStepUpdate('todo', 'done', true);
      expect(result.valid).toBe(true);
    });

    it('should allow completing optional steps', () => {
      const result = validateStepUpdate('todo', 'done', false);
      expect(result.valid).toBe(true);
    });

    it('should allow undoing completion for both required and optional', () => {
      expect(validateStepUpdate('done', 'todo', true).valid).toBe(true);
      expect(validateStepUpdate('done', 'todo', false).valid).toBe(true);
    });
  });

  describe('Idempotent transitions', () => {
    it('should allow todo → todo', () => {
      expect(validateStepUpdate('todo', 'todo', true).valid).toBe(true);
      expect(validateStepUpdate('todo', 'todo', false).valid).toBe(true);
    });

    it('should allow done → done', () => {
      expect(validateStepUpdate('done', 'done', true).valid).toBe(true);
      expect(validateStepUpdate('done', 'done', false).valid).toBe(true);
    });

    it('should allow skipped → skipped', () => {
      expect(validateStepUpdate('skipped', 'skipped', false).valid).toBe(true);
    });
  });

  describe('Complex transition scenarios', () => {
    it('should handle full lifecycle: todo → done → todo → done', () => {
      // Start
      expect(canTransitionTo('todo', 'done', true)).toBe(true);
      // Undo
      expect(canTransitionTo('done', 'todo', true)).toBe(true);
      // Complete again
      expect(canTransitionTo('todo', 'done', true)).toBe(true);
    });

    it('should handle optional step lifecycle: todo → skipped → todo → done', () => {
      expect(canTransitionTo('todo', 'skipped', false)).toBe(true);
      expect(canTransitionTo('skipped', 'todo', false)).toBe(true);
      expect(canTransitionTo('todo', 'done', false)).toBe(true);
    });

    it('should prevent invalid path: todo → done → skipped', () => {
      expect(canTransitionTo('todo', 'done', false)).toBe(true);
      expect(canTransitionTo('done', 'skipped', false)).toBe(false);
    });

    it('should allow recovery path: skipped → done (optional)', () => {
      expect(canTransitionTo('skipped', 'done', false)).toBe(true);
    });
  });

  describe('Error messages', () => {
    it('should provide clear error for invalid transition', () => {
      const result = validateStepUpdate('done', 'skipped', false);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid status transition');
      expect(result.error).toContain('done');
      expect(result.error).toContain('skipped');
    });

    it('should indicate step type in error message', () => {
      const requiredResult = validateStepUpdate('done', 'skipped', true);
      expect(requiredResult.error).toContain('required');

      const optionalResult = validateStepUpdate('done', 'skipped', false);
      expect(optionalResult.error).toContain('optional');
    });

    it('should provide specific error for skipping required steps', () => {
      const result = validateStepUpdate('todo', 'skipped', true);
      expect(result.error).toBe('Required steps cannot be skipped');
    });
  });

  describe('Edge cases', () => {
    it('should handle all status combinations for required steps', () => {
      const statuses: StepStatus[] = ['todo', 'done', 'skipped'];
      const validTransitions = [
        ['todo', 'todo'],
        ['todo', 'done'],
        ['done', 'done'],
        ['done', 'todo'],
        ['skipped', 'todo'],
        ['skipped', 'done'],
        ['skipped', 'skipped'],
      ];

      for (const from of statuses) {
        for (const to of statuses) {
          const shouldBeValid = validTransitions.some(
            ([f, t]) => f === from && t === to
          );
          const isValid = canTransitionTo(from, to, true);

          if (shouldBeValid) {
            expect(isValid).toBe(true);
          }
        }
      }
    });

    it('should handle all status combinations for optional steps', () => {
      const statuses: StepStatus[] = ['todo', 'done', 'skipped'];
      const validTransitions = [
        ['todo', 'todo'],
        ['todo', 'done'],
        ['todo', 'skipped'],
        ['done', 'done'],
        ['done', 'todo'],
        ['skipped', 'todo'],
        ['skipped', 'done'],
        ['skipped', 'skipped'],
      ];

      for (const from of statuses) {
        for (const to of statuses) {
          const shouldBeValid = validTransitions.some(
            ([f, t]) => f === from && t === to
          );
          const isValid = canTransitionTo(from, to, false);

          if (shouldBeValid) {
            expect(isValid).toBe(true);
          }
        }
      }
    });
  });

  describe('State machine validation', () => {
    it('should maintain valid state transitions', () => {
      // Valid state machine for required steps:
      // todo ⟷ done
      // skipped → todo (recovery)
      // skipped → done (recovery)

      const validPaths = [
        { from: 'todo', to: 'done', required: true, valid: true },
        { from: 'done', to: 'todo', required: true, valid: true },
        { from: 'todo', to: 'skipped', required: true, valid: false }, // Blocked by validation
        { from: 'done', to: 'skipped', required: true, valid: false },
        { from: 'skipped', to: 'todo', required: true, valid: true },
        { from: 'skipped', to: 'done', required: true, valid: true },
      ];

      for (const path of validPaths) {
        const result = validateStepUpdate(
          path.from as StepStatus,
          path.to as StepStatus,
          path.required
        );
        expect(result.valid).toBe(path.valid);
      }
    });

    it('should maintain valid state transitions for optional steps', () => {
      // Valid state machine for optional steps:
      // todo ⟷ done
      // todo → skipped
      // skipped → todo
      // skipped → done

      const validPaths = [
        { from: 'todo', to: 'done', required: false, valid: true },
        { from: 'done', to: 'todo', required: false, valid: true },
        { from: 'todo', to: 'skipped', required: false, valid: true },
        { from: 'done', to: 'skipped', required: false, valid: false },
        { from: 'skipped', to: 'todo', required: false, valid: true },
        { from: 'skipped', to: 'done', required: false, valid: true },
      ];

      for (const path of validPaths) {
        const result = validateStepUpdate(
          path.from as StepStatus,
          path.to as StepStatus,
          path.required
        );
        expect(result.valid).toBe(path.valid);
      }
    });
  });
});
