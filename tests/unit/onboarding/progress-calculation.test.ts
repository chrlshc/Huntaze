/**
 * Unit tests for onboarding progress calculation logic
 */

import { describe, it, expect, beforeEach, vi as jest } from 'vitest';

// Mock types
interface MockStep {
  id: string;
  weight: number;
  required: boolean;
  status: 'todo' | 'done' | 'skipped';
}

interface ProgressResult {
  progress: number;
  totalSteps: number;
  completedSteps: number;
  skippedSteps: number;
  remainingSteps: number;
}

/**
 * Calculate progress based on step weights and statuses
 * This mimics the database function calculate_onboarding_progress
 */
function calculateProgress(steps: MockStep[]): number {
  if (steps.length === 0) return 0;

  const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0);
  if (totalWeight === 0) return 0;

  const completedWeight = steps
    .filter(step => step.status === 'done')
    .reduce((sum, step) => sum + step.weight, 0);

  const skippedWeight = steps
    .filter(step => step.status === 'skipped' && !step.required)
    .reduce((sum, step) => sum + step.weight, 0);

  const achievedWeight = completedWeight + skippedWeight;
  return Math.round((achievedWeight / totalWeight) * 100);
}

/**
 * Get detailed progress information
 */
function getDetailedProgress(steps: MockStep[]): ProgressResult {
  const completedSteps = steps.filter(s => s.status === 'done').length;
  const skippedSteps = steps.filter(s => s.status === 'skipped').length;
  const remainingSteps = steps.filter(s => s.status === 'todo').length;

  return {
    progress: calculateProgress(steps),
    totalSteps: steps.length,
    completedSteps,
    skippedSteps,
    remainingSteps,
  };
}

describe('Progress Calculation Logic', () => {
  describe('calculateProgress', () => {
    it('should return 0 for empty steps array', () => {
      const steps: MockStep[] = [];
      const progress = calculateProgress(steps);
      expect(progress).toBe(0);
    });

    it('should return 0 when all steps are todo', () => {
      const steps: MockStep[] = [
        { id: 'step1', weight: 10, required: true, status: 'todo' },
        { id: 'step2', weight: 10, required: true, status: 'todo' },
        { id: 'step3', weight: 10, required: false, status: 'todo' },
      ];
      const progress = calculateProgress(steps);
      expect(progress).toBe(0);
    });

    it('should return 100 when all steps are done', () => {
      const steps: MockStep[] = [
        { id: 'step1', weight: 10, required: true, status: 'done' },
        { id: 'step2', weight: 10, required: true, status: 'done' },
        { id: 'step3', weight: 10, required: false, status: 'done' },
      ];
      const progress = calculateProgress(steps);
      expect(progress).toBe(100);
    });

    it('should calculate 50% progress when half steps are done', () => {
      const steps: MockStep[] = [
        { id: 'step1', weight: 10, required: true, status: 'done' },
        { id: 'step2', weight: 10, required: true, status: 'todo' },
      ];
      const progress = calculateProgress(steps);
      expect(progress).toBe(50);
    });

    it('should handle weight-based progress calculation', () => {
      const steps: MockStep[] = [
        { id: 'step1', weight: 30, required: true, status: 'done' },
        { id: 'step2', weight: 20, required: true, status: 'done' },
        { id: 'step3', weight: 50, required: false, status: 'todo' },
      ];
      // (30 + 20) / (30 + 20 + 50) = 50 / 100 = 50%
      const progress = calculateProgress(steps);
      expect(progress).toBe(50);
    });

    it('should count skipped optional steps as progress', () => {
      const steps: MockStep[] = [
        { id: 'step1', weight: 10, required: true, status: 'done' },
        { id: 'step2', weight: 10, required: false, status: 'skipped' },
        { id: 'step3', weight: 10, required: true, status: 'todo' },
      ];
      // (10 + 10) / 30 = 20 / 30 = 67%
      const progress = calculateProgress(steps);
      expect(progress).toBe(67);
    });

    it('should not count skipped required steps as progress', () => {
      const steps: MockStep[] = [
        { id: 'step1', weight: 10, required: true, status: 'done' },
        { id: 'step2', weight: 10, required: true, status: 'skipped' },
        { id: 'step3', weight: 10, required: true, status: 'todo' },
      ];
      // Only completed required steps count: 10 / 30 = 33%
      const progress = calculateProgress(steps);
      expect(progress).toBe(33);
    });

    it('should handle unequal weights correctly', () => {
      const steps: MockStep[] = [
        { id: 'step1', weight: 5, required: true, status: 'done' },
        { id: 'step2', weight: 15, required: true, status: 'done' },
        { id: 'step3', weight: 30, required: true, status: 'todo' },
      ];
      // (5 + 15) / (5 + 15 + 30) = 20 / 50 = 40%
      const progress = calculateProgress(steps);
      expect(progress).toBe(40);
    });

    it('should round progress to nearest integer', () => {
      const steps: MockStep[] = [
        { id: 'step1', weight: 1, required: true, status: 'done' },
        { id: 'step2', weight: 2, required: true, status: 'todo' },
      ];
      // 1 / 3 = 0.333... = 33%
      const progress = calculateProgress(steps);
      expect(progress).toBe(33);
    });

    it('should handle zero weight steps', () => {
      const steps: MockStep[] = [
        { id: 'step1', weight: 0, required: true, status: 'done' },
        { id: 'step2', weight: 0, required: true, status: 'todo' },
      ];
      const progress = calculateProgress(steps);
      expect(progress).toBe(0);
    });

    it('should handle mixed status with various weights', () => {
      const steps: MockStep[] = [
        { id: 'step1', weight: 20, required: true, status: 'done' },
        { id: 'step2', weight: 15, required: false, status: 'skipped' },
        { id: 'step3', weight: 25, required: true, status: 'done' },
        { id: 'step4', weight: 10, required: false, status: 'todo' },
        { id: 'step5', weight: 30, required: true, status: 'todo' },
      ];
      // (20 + 15 + 25) / 100 = 60 / 100 = 60%
      const progress = calculateProgress(steps);
      expect(progress).toBe(60);
    });
  });

  describe('getDetailedProgress', () => {
    it('should return correct counts for all todo steps', () => {
      const steps: MockStep[] = [
        { id: 'step1', weight: 10, required: true, status: 'todo' },
        { id: 'step2', weight: 10, required: true, status: 'todo' },
        { id: 'step3', weight: 10, required: false, status: 'todo' },
      ];
      const result = getDetailedProgress(steps);
      
      expect(result.progress).toBe(0);
      expect(result.totalSteps).toBe(3);
      expect(result.completedSteps).toBe(0);
      expect(result.skippedSteps).toBe(0);
      expect(result.remainingSteps).toBe(3);
    });

    it('should return correct counts for mixed statuses', () => {
      const steps: MockStep[] = [
        { id: 'step1', weight: 10, required: true, status: 'done' },
        { id: 'step2', weight: 10, required: false, status: 'skipped' },
        { id: 'step3', weight: 10, required: true, status: 'todo' },
        { id: 'step4', weight: 10, required: true, status: 'done' },
      ];
      const result = getDetailedProgress(steps);
      
      expect(result.totalSteps).toBe(4);
      expect(result.completedSteps).toBe(2);
      expect(result.skippedSteps).toBe(1);
      expect(result.remainingSteps).toBe(1);
    });

    it('should return 100% progress when all steps are complete', () => {
      const steps: MockStep[] = [
        { id: 'step1', weight: 10, required: true, status: 'done' },
        { id: 'step2', weight: 10, required: true, status: 'done' },
      ];
      const result = getDetailedProgress(steps);
      
      expect(result.progress).toBe(100);
      expect(result.completedSteps).toBe(2);
      expect(result.remainingSteps).toBe(0);
    });

    it('should handle empty steps array', () => {
      const steps: MockStep[] = [];
      const result = getDetailedProgress(steps);
      
      expect(result.progress).toBe(0);
      expect(result.totalSteps).toBe(0);
      expect(result.completedSteps).toBe(0);
      expect(result.skippedSteps).toBe(0);
      expect(result.remainingSteps).toBe(0);
    });
  });

  describe('Market-specific progress calculation', () => {
    it('should calculate progress only for market-specific steps', () => {
      // Simulate filtering steps by market
      const allSteps: MockStep[] = [
        { id: 'step1', weight: 10, required: true, status: 'done' },
        { id: 'step2', weight: 10, required: true, status: 'done' },
        { id: 'step3', weight: 10, required: true, status: 'todo' }, // FR only
      ];
      
      // US market - only first 2 steps
      const usSteps = allSteps.slice(0, 2);
      const usProgress = calculateProgress(usSteps);
      expect(usProgress).toBe(100);
      
      // FR market - all 3 steps
      const frProgress = calculateProgress(allSteps);
      expect(frProgress).toBe(67);
    });

    it('should handle different step counts per market', () => {
      const frSteps: MockStep[] = [
        { id: 'step1', weight: 10, required: true, status: 'done' },
        { id: 'step2', weight: 10, required: true, status: 'done' },
        { id: 'step3', weight: 10, required: true, status: 'done' },
        { id: 'step4', weight: 10, required: true, status: 'todo' },
      ];
      
      const usSteps: MockStep[] = [
        { id: 'step1', weight: 10, required: true, status: 'done' },
        { id: 'step2', weight: 10, required: true, status: 'done' },
      ];
      
      expect(calculateProgress(frSteps)).toBe(75);
      expect(calculateProgress(usSteps)).toBe(100);
    });
  });

  describe('Edge cases', () => {
    it('should handle single step at 100%', () => {
      const steps: MockStep[] = [
        { id: 'step1', weight: 10, required: true, status: 'done' },
      ];
      expect(calculateProgress(steps)).toBe(100);
    });

    it('should handle single step at 0%', () => {
      const steps: MockStep[] = [
        { id: 'step1', weight: 10, required: true, status: 'todo' },
      ];
      expect(calculateProgress(steps)).toBe(0);
    });

    it('should handle very large weights', () => {
      const steps: MockStep[] = [
        { id: 'step1', weight: 1000, required: true, status: 'done' },
        { id: 'step2', weight: 1000, required: true, status: 'todo' },
      ];
      expect(calculateProgress(steps)).toBe(50);
    });

    it('should handle very small weights', () => {
      const steps: MockStep[] = [
        { id: 'step1', weight: 1, required: true, status: 'done' },
        { id: 'step2', weight: 1, required: true, status: 'todo' },
      ];
      expect(calculateProgress(steps)).toBe(50);
    });

    it('should handle all steps skipped (optional)', () => {
      const steps: MockStep[] = [
        { id: 'step1', weight: 10, required: false, status: 'skipped' },
        { id: 'step2', weight: 10, required: false, status: 'skipped' },
      ];
      expect(calculateProgress(steps)).toBe(100);
    });

    it('should handle mix of required and optional with different weights', () => {
      const steps: MockStep[] = [
        { id: 'step1', weight: 40, required: true, status: 'done' },
        { id: 'step2', weight: 30, required: false, status: 'skipped' },
        { id: 'step3', weight: 20, required: true, status: 'todo' },
        { id: 'step4', weight: 10, required: false, status: 'todo' },
      ];
      // (40 + 30) / 100 = 70%
      expect(calculateProgress(steps)).toBe(70);
    });
  });
});
