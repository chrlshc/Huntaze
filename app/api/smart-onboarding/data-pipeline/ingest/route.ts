import { NextRequest, NextResponse } from 'next/server';
import { behavioralDataProcessor } from '../../../../../lib/smart-onboarding/services/behavioralDataProcessor';
import { dataValidationService } from '../../../../../lib/smart-onboarding/services/dataValidationService';
import { BehaviorEvent } from '../../../../../lib/smart-onboarding/types';
import { logger } from '../../../../../lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle single event or batch of events
    const events: BehaviorEvent[] = Array.isArray(body) ? body : [body];
    
    if (events.length === 0) {
      return NextResponse.json(
        { error: 'No events provided' },
        { status: 400 }
      );
    }

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
      validationResults: [] as any[]
    };

    // Process each event
    for (const event of events) {
      try {
        // Validate event
        const validationResult = await dataValidationService.validateEvent(event);
        results.validationResults.push({
          eventId: event.id,
          isValid: validationResult.isValid,
          qualityScore: validationResult.qualityScore,
          errors: validationResult.errors,
          warnings: validationResult.warnings
        });

        if (!validationResult.isValid) {
          results.failed++;
          results.errors.push(`Event ${event.id}: ${validationResult.errors.join(', ')}`);
          continue;
        }

        // Clean event data
        const cleanedEvent = await dataValidationService.cleanEvent(event);

        // Queue for processing
        await behavioralDataProcessor.queueEvent(cleanedEvent);
        
        results.processed++;

      } catch (error) {
        results.failed++;
        results.errors.push(`Event ${event.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        logger.error('Event processing failed', { error, eventId: event.id });
      }
    }

    // Return processing results
    return NextResponse.json({
      success: true,
      results,
      queueStatus: behavioralDataProcessor.getQueueStatus(),
      processingMetrics: behavioralDataProcessor.getMetrics()
    });

  } catch (error) {
    logger.error('Data ingestion endpoint failed', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeMetrics = searchParams.get('metrics') === 'true';
    const includeQueue = searchParams.get('queue') === 'true';

    const response: any = {
      status: 'operational',
      timestamp: new Date().toISOString()
    };

    if (includeQueue) {
      response.queueStatus = behavioralDataProcessor.getQueueStatus();
    }

    if (includeMetrics) {
      response.processingMetrics = behavioralDataProcessor.getMetrics();
      response.validationStats = dataValidationService.getValidationStats();
    }

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Data pipeline status endpoint failed', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}