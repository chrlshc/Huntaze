import { NextRequest, NextResponse } from 'next/server';
import { contentSchedulingWorker } from '@/lib/workers/contentSchedulingWorker';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      contentSchedulingWorker.start();
      return NextResponse.json({
        success: true,
        message: 'Content scheduling worker started',
        status: contentSchedulingWorker.getStatus()
      });
    } else if (action === 'stop') {
      contentSchedulingWorker.stop();
      return NextResponse.json({
        success: true,
        message: 'Content scheduling worker stopped',
        status: contentSchedulingWorker.getStatus()
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "start" or "stop"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Worker control error:', error);
    return NextResponse.json(
      { error: 'Failed to control worker' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const status = contentSchedulingWorker.getStatus();
    return NextResponse.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Worker status error:', error);
    return NextResponse.json(
      { error: 'Failed to get worker status' },
      { status: 500 }
    );
  }
}
