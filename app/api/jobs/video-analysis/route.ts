import { NextRequest, NextResponse } from 'next/server';
import { ServiceBusClient } from '@azure/service-bus';

const client = new ServiceBusClient(process.env.SERVICEBUS_CONNECTION_SEND!);

export async function POST(req: NextRequest) {
  try {
    const { videoUrl, creatorId } = await req.json();
    
    if (!videoUrl || !creatorId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
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
    console.error('Failed to queue job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
