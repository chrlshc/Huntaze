/**
 * Complete Onboarding API Route
 * Marks user onboarding as completed
 * 
 * Requirements:
 * - 6.5: Mark onboarding as completed
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { query } from '@/lib/db';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('onboarding-complete');

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

    const userId = parseInt(session.user.id);

    // Mark onboarding as completed
    await query(
      `UPDATE users 
       SET onboarding_completed = true, 
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    const duration = Date.now() - startTime;
    logger.info('Onboarding completed', {
      userId,
      duration,
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed',
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Onboarding completion error', error as Error, {
      duration,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
