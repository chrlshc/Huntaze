'use server';

import { requireUser } from '@/lib/server-auth';
import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Toggle Onboarding Step
 * 
 * Securely updates a user's onboarding progress by adding a completed step.
 * The userId is extracted from the authenticated session, not from client input.
 * 
 * Security:
 * - User ID is obtained from server-side session (requireUser)
 * - Client cannot manipulate other users' onboarding data
 * - Uses upsert to handle both new and existing onboarding records
 * 
 * @param stepId - The ID of the onboarding step to mark as completed
 * @returns Promise with success status and optional error message
 */
export async function toggleOnboardingStep(
  stepId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Security: Get userId from session, NOT from client payload
    const user = await requireUser();
    
    if (!user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Convert user.id to number (Prisma schema uses Int for userId)
    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    
    if (isNaN(userId)) {
      return { success: false, error: 'Invalid user ID' };
    }

    // Get current onboarding record
    // @ts-ignore - UserOnboarding model needs to be added to Prisma schema
    const currentOnboarding = await db.userOnboarding.findUnique({
      where: { userId },
      select: { completedSteps: true },
    });

    // Check if step is already completed
    const completedSteps = currentOnboarding?.completedSteps || [];
    if (completedSteps.includes(stepId)) {
      // Step already completed, no need to update
      return { success: true };
    }

    // Add the new step to completed steps
    const updatedSteps = [...completedSteps, stepId];

    // Database mutation with upsert for safety
    // @ts-ignore - UserOnboarding model needs to be added to Prisma schema
    await db.userOnboarding.upsert({
      where: { userId },
      update: {
        completedSteps: updatedSteps,
        updatedAt: new Date(),
      },
      create: {
        userId,
        completedSteps: [stepId],
      },
    });

    // Revalidate specific path to update UI
    revalidatePath('/dashboard');
    revalidatePath('/(app)', 'layout');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to update onboarding:', error);
    
    // Return generic error message to avoid leaking implementation details
    return { 
      success: false, 
      error: 'Failed to update onboarding progress' 
    };
  }
}

/**
 * Server Action: Get Onboarding Progress
 * 
 * Retrieves the current user's onboarding progress.
 * 
 * @returns Promise with onboarding data or null if not found
 */
export async function getOnboardingProgress(): Promise<{
  completedSteps: string[];
  createdAt: Date;
  updatedAt: Date;
} | null> {
  try {
    const user = await requireUser();
    
    if (!user?.id) {
      return null;
    }

    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    
    if (isNaN(userId)) {
      return null;
    }

    // @ts-ignore - UserOnboarding model needs to be added to Prisma schema
    const onboarding = await db.userOnboarding.findUnique({
      where: { userId },
      select: {
        completedSteps: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return onboarding;
  } catch (error) {
    console.error('Failed to fetch onboarding progress:', error);
    return null;
  }
}

/**
 * Server Action: Reset Onboarding Progress
 * 
 * Clears all completed steps for the current user.
 * Useful for testing or allowing users to restart onboarding.
 * 
 * @returns Promise with success status
 */
export async function resetOnboardingProgress(): Promise<{ 
  success: boolean; 
  error?: string 
}> {
  try {
    const user = await requireUser();
    
    if (!user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    
    if (isNaN(userId)) {
      return { success: false, error: 'Invalid user ID' };
    }

    // @ts-ignore - UserOnboarding model needs to be added to Prisma schema
    await db.userOnboarding.update({
      where: { userId },
      data: {
        completedSteps: [],
        updatedAt: new Date(),
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/(app)', 'layout');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to reset onboarding:', error);
    return { 
      success: false, 
      error: 'Failed to reset onboarding progress' 
    };
  }
}
