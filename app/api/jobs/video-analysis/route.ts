import { NextRequest, NextResponse } from 'next/server';
import { getServiceBusClient } from '@/lib/servicebus/client';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { videoUrl, creatorId } = await req.json();
    
    if (!videoUrl || !creatorId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const client = getServiceBusClient();
    const sender = client.createSender('huntaze-jobs');
    
    await sender.sendMessages({
      body: {
        jobId,
        jobType: 'video.analysis',
        creatorId,
        payload: { videoUrl },
        createdAt: new Date().toISOString(),
      },
      contentType: 'application/json',
      applicationProperties: { jobType: 'video.analysis' },
    });
    
    await sender.close();
    
    return NextResponse.json({ success: true, jobId });
  } catch (error: any) {
    const message =
      typeof error?.message === 'string' && error.message.trim()
        ? error.message
        : String(error);
    const safeMessage =
      message && message !== '[object Object]' ? message : 'Service Bus request failed';

    if (error?.code === 'MISSING_ENV') {
      return NextResponse.json(
        { error: safeMessage, code: 'MISSING_ENV' },
        { status: 500 }
      );
    }

    console.error('Failed to queue job:', error);
    return NextResponse.json(
      { error: safeMessage, code: 'SERVICEBUS_ERROR' },
      { status: 503 }
    );
  }
}
