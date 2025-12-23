import { NextRequest, NextResponse } from 'next/server';
import { ServiceBusClient } from '@azure/service-bus';

const client = new ServiceBusClient(process.env.SERVICEBUS_CONNECTION_SEND!);

export async function POST(req: NextRequest) {
  try {
    const { contentUrl, contentType, creatorId, analysisType } = await req.json();
    
    if (!contentUrl || !contentType || !creatorId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const sender = client.createSender('huntaze-jobs');
    
    await sender.sendMessages({
      body: {
        jobId,
        jobType: 'content.analyze',
        creatorId,
        payload: { contentUrl, contentType, analysisType: analysisType || 'full' },
        createdAt: new Date().toISOString(),
      },
      contentType: 'application/json',
      applicationProperties: { jobType: 'content.analyze' },
    });
    
    await sender.close();
    
    return NextResponse.json({ success: true, jobId });
  } catch (error: any) {
    console.error('Failed to queue job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
