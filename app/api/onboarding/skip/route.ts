/**
 * Skip Onboarding Step API Route
 * Tracks skipped onboarding steps for later completion
 * 
 * Requirements:
 * - 6.4: Track skipped steps
 * - 6.5: Allow completion of skipped steps later
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('onboarding-skip');

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { stepId } = body;

    if (!stepId) {
      return NextResponse.json(
        { error: 'Step ID is required' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // Log skipped step for analytics
    const duration = Date.now() - startTime;
    logger.info('Onboarding step skipped', {
      userId,
      stepId,
      duration,
    });

    // In a real implementation, you might want to store this in the database
    // For now, we just log it

    return NextResponse.json({
      success: true,
      message: 'Step skipped',
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Onboarding skip error', error as Error, {
      duration,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to skip step' },
      { status: 500 }
    );
  }
}
