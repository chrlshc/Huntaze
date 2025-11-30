import { NextRequest, NextResponse } from 'next/server';
import { dataProcessingWorker } from '../../../../lib/workers/dataProcessingWorker';
import { logger } from '../../../../lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'start':
        await dataProcessingWorker.start();
        return NextResponse.json({
          success: true,
          message: 'Data processing worker started',
          status: dataProcessingWorker.getStatus()
        });

      case 'stop':
        await dataProcessingWorker.stop();
        return NextResponse.json({
          success: true,
          message: 'Data processing worker stopped'
        });

      case 'process-dead-letter':
        const body = await request.json();
        const maxItems = body.maxItems || 10;
        
        const results = await dataProcessingWorker.processDeadLetterQueue(maxItems);
        
        return NextResponse.json({
          success: true,
          message: 'Dead letter queue processed',
          results
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, stop, or process-dead-letter' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Data processing worker endpoint failed', error instanceof Error ? error : new Error(String(error)), {});
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const status = dataProcessingWorker.getStatus();
    
    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Data processing worker status endpoint failed', error instanceof Error ? error : new Error(String(error)), {});
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}