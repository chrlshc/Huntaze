/**
 * Onboarding Completion API
 * 
 * Marks user onboarding as complete and optionally saves onboarding answers.
 * Uses NextAuth session-based authentication.
 * 
 * Requirements: 2.2, 4.2, 4.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { query } from '@/lib/db';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('onboarding-complete');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify authentication using NextAuth session
    const session = await getSession();
    
    if (!session?.user?.id) {
      logger.warn('Onboarding completion failed: Unauthorized', {
        hasSession: !!session,
        duration: Date.now() - startTime,
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { answers, skipped } = body;

    // Update onboarding_completed status in database
    await query(
      'UPDATE users SET onboarding_completed = true WHERE id = $1',
      [session.user.id]
    );

    // Optionally save onboarding answers to database
    if (answers && !skipped) {
      try {
        // Check if onboarding_answers table exists and save answers
        await query(
          `INSERT INTO onboarding_answers (user_id, answers, created_at, updated_at)
           VALUES ($1, $2, NOW(), NOW())
           ON CONFLICT (user_id) 
           DO UPDATE SET answers = $2, updated_at = NOW()`,
          [session.user.id, JSON.stringify(answers)]
        );
        
        logger.info('Onboarding answers saved', {
          userId: session.user.id,
          answerCount: Object.keys(answers).length,
          duration: Date.now() - startTime,
        });
      } catch (answerError) {
        // Log error but don't fail the request if answers table doesn't exist
        logger.warn('Failed to save onboarding answers', {
          userId: session.user.id,
          error: answerError instanceof Error ? answerError.message : String(answerError),
        });
      }
    }

    logger.info('Onboarding completed successfully', {
      userId: session.user.id,
      email: session.user.email,
      skipped: !!skipped,
      hasAnswers: !!answers,
      duration: Date.now() - startTime,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Onboarding completion error', error as Error, {
      duration,
    });
    
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
