import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  toggleOnboardingStep, 
  getOnboardingProgress,
  resetOnboardingProgress 
} from '@/app/actions/onboarding';

// Mock dependencies
vi.mock('@/lib/server-auth', () => ({
  requireUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  db: {
    userOnboarding: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { requireUser } from '@/lib/server-auth';
import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

describe('Onboarding Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('toggleOnboardingStep', () => {
    it('should successfully add a new step for existing user', async () => {
      // Arrange
      const mockUser = { id: '123', email: 'test@example.com' };
      const stepId = 'step-1';
      
      vi.mocked(requireUser).mockResolvedValue(mockUser);
      vi.mocked(db.userOnboarding.findUnique).mockResolvedValue({
        id: 'onboarding-1',
        userId: 123,
        completedSteps: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(db.userOnboarding.upsert).mockResolvedValue({
        id: 'onboarding-1',
        userId: 123,
        completedSteps: [stepId],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await toggleOnboardingStep(stepId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(db.userOnboarding.upsert).toHaveBeenCalledWith({
        where: { userId: 123 },
        update: {
          completedSteps: [stepId],
          updatedAt: expect.any(Date),
        },
        create: {
          userId: 123,
          completedSteps: [stepId],
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
      expect(revalidatePath).toHaveBeenCalledWith('/(app)', 'layout');
    });

    it('should create new onboarding record for new user', async () => {
      // Arrange
      const mockUser = { id: '456', email: 'newuser@example.com' };
      const stepId = 'step-1';
      
      vi.mocked(requireUser).mockResolvedValue(mockUser);
      vi.mocked(db.userOnboarding.findUnique).mockResolvedValue(null);
      vi.mocked(db.userOnboarding.upsert).mockResolvedValue({
        id: 'onboarding-2',
        userId: 456,
        completedSteps: [stepId],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await toggleOnboardingStep(stepId);

      // Assert
      expect(result.success).toBe(true);
      expect(db.userOnboarding.upsert).toHaveBeenCalledWith({
        where: { userId: 456 },
        update: {
          completedSteps: [stepId],
          updatedAt: expect.any(Date),
        },
        create: {
          userId: 456,
          completedSteps: [stepId],
        },
      });
    });

    it('should not duplicate steps that are already completed', async () => {
      // Arrange
      const mockUser = { id: '123', email: 'test@example.com' };
      const stepId = 'step-1';
      
      vi.mocked(requireUser).mockResolvedValue(mockUser);
      vi.mocked(db.userOnboarding.findUnique).mockResolvedValue({
        id: 'onboarding-1',
        userId: 123,
        completedSteps: [stepId], // Step already completed
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await toggleOnboardingStep(stepId);

      // Assert
      expect(result.success).toBe(true);
      expect(db.userOnboarding.upsert).not.toHaveBeenCalled();
    });

    it('should append new step to existing completed steps', async () => {
      // Arrange
      const mockUser = { id: '123', email: 'test@example.com' };
      const existingSteps = ['step-1', 'step-2'];
      const newStepId = 'step-3';
      
      vi.mocked(requireUser).mockResolvedValue(mockUser);
      vi.mocked(db.userOnboarding.findUnique).mockResolvedValue({
        id: 'onboarding-1',
        userId: 123,
        completedSteps: existingSteps,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(db.userOnboarding.upsert).mockResolvedValue({
        id: 'onboarding-1',
        userId: 123,
        completedSteps: [...existingSteps, newStepId],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await toggleOnboardingStep(newStepId);

      // Assert
      expect(result.success).toBe(true);
      expect(db.userOnboarding.upsert).toHaveBeenCalledWith({
        where: { userId: 123 },
        update: {
          completedSteps: [...existingSteps, newStepId],
          updatedAt: expect.any(Date),
        },
        create: {
          userId: 123,
          completedSteps: [newStepId],
        },
      });
    });

    it('should return error when user is not authenticated', async () => {
      // Arrange
      vi.mocked(requireUser).mockResolvedValue({ id: null as any, email: null });

      // Act
      const result = await toggleOnboardingStep('step-1');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
      expect(db.userOnboarding.upsert).not.toHaveBeenCalled();
    });

    it('should handle invalid user ID format', async () => {
      // Arrange
      vi.mocked(requireUser).mockResolvedValue({ id: 'invalid', email: 'test@example.com' });

      // Act
      const result = await toggleOnboardingStep('step-1');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid user ID');
      expect(db.userOnboarding.upsert).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const mockUser = { id: '123', email: 'test@example.com' };
      vi.mocked(requireUser).mockResolvedValue(mockUser);
      vi.mocked(db.userOnboarding.findUnique).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      const result = await toggleOnboardingStep('step-1');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update onboarding progress');
    });

    it('should handle numeric user IDs', async () => {
      // Arrange
      const mockUser = { id: 789, email: 'test@example.com' };
      const stepId = 'step-1';
      
      vi.mocked(requireUser).mockResolvedValue(mockUser as any);
      vi.mocked(db.userOnboarding.findUnique).mockResolvedValue(null);
      vi.mocked(db.userOnboarding.upsert).mockResolvedValue({
        id: 'onboarding-3',
        userId: 789,
        completedSteps: [stepId],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await toggleOnboardingStep(stepId);

      // Assert
      expect(result.success).toBe(true);
      expect(db.userOnboarding.upsert).toHaveBeenCalledWith({
        where: { userId: 789 },
        update: {
          completedSteps: [stepId],
          updatedAt: expect.any(Date),
        },
        create: {
          userId: 789,
          completedSteps: [stepId],
        },
      });
    });
  });

  describe('getOnboardingProgress', () => {
    it('should return onboarding progress for authenticated user', async () => {
      // Arrange
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockOnboarding = {
        completedSteps: ['step-1', 'step-2'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };
      
      vi.mocked(requireUser).mockResolvedValue(mockUser);
      // Mock returns only selected fields (matching Prisma select behavior)
      vi.mocked(db.userOnboarding.findUnique).mockResolvedValue(mockOnboarding as any);

      // Act
      const result = await getOnboardingProgress();

      // Assert
      expect(result).toEqual(mockOnboarding);
      expect(db.userOnboarding.findUnique).toHaveBeenCalledWith({
        where: { userId: 123 },
        select: {
          completedSteps: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should return null when user is not authenticated', async () => {
      // Arrange
      vi.mocked(requireUser).mockResolvedValue({ id: null as any, email: null });

      // Act
      const result = await getOnboardingProgress();

      // Assert
      expect(result).toBeNull();
      expect(db.userOnboarding.findUnique).not.toHaveBeenCalled();
    });

    it('should return null when onboarding record does not exist', async () => {
      // Arrange
      const mockUser = { id: '123', email: 'test@example.com' };
      vi.mocked(requireUser).mockResolvedValue(mockUser);
      vi.mocked(db.userOnboarding.findUnique).mockResolvedValue(null);

      // Act
      const result = await getOnboardingProgress();

      // Assert
      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const mockUser = { id: '123', email: 'test@example.com' };
      vi.mocked(requireUser).mockResolvedValue(mockUser);
      vi.mocked(db.userOnboarding.findUnique).mockRejectedValue(
        new Error('Database error')
      );

      // Act
      const result = await getOnboardingProgress();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('resetOnboardingProgress', () => {
    it('should clear all completed steps for authenticated user', async () => {
      // Arrange
      const mockUser = { id: '123', email: 'test@example.com' };
      vi.mocked(requireUser).mockResolvedValue(mockUser);
      vi.mocked(db.userOnboarding.update).mockResolvedValue({
        id: 'onboarding-1',
        userId: 123,
        completedSteps: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await resetOnboardingProgress();

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(db.userOnboarding.update).toHaveBeenCalledWith({
        where: { userId: 123 },
        data: {
          completedSteps: [],
          updatedAt: expect.any(Date),
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
      expect(revalidatePath).toHaveBeenCalledWith('/(app)', 'layout');
    });

    it('should return error when user is not authenticated', async () => {
      // Arrange
      vi.mocked(requireUser).mockResolvedValue({ id: null as any, email: null });

      // Act
      const result = await resetOnboardingProgress();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
      expect(db.userOnboarding.update).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const mockUser = { id: '123', email: 'test@example.com' };
      vi.mocked(requireUser).mockResolvedValue(mockUser);
      vi.mocked(db.userOnboarding.update).mockRejectedValue(
        new Error('Database error')
      );

      // Act
      const result = await resetOnboardingProgress();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to reset onboarding progress');
    });
  });
});
