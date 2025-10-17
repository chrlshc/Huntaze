import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeReqLogger } from '@/lib/logger';
import { tiktokService } from '@/lib/services/tiktok';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = makeReqLogger({ requestId });
  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const caption = formData.get('caption') as string;

    if (!videoFile || !caption) {
      const r = NextResponse.json({ error: 'Video and caption are required', requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // For sandbox mode, we'll simulate a successful upload
    if (process.env.TIKTOK_SANDBOX_MODE === 'true') {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const r = NextResponse.json({
        success: true,
        publish_id: `sandbox_${Date.now()}`,
        message: 'Video uploaded successfully (sandbox mode)',
        requestId,
      });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    // Production upload
    const result = await tiktokService.uploadVideo(videoFile, caption);
    
    if (result.error) {
      const r = NextResponse.json({ error: result.error, requestId }, { status: 400 });
      r.headers.set('X-Request-Id', requestId);
      return r;
    }

    const r = NextResponse.json({
      success: true,
      publish_id: result.publish_id,
      message: 'Video uploaded successfully',
      requestId,
    });
    r.headers.set('X-Request-Id', requestId);
    return r;
  } catch (error: any) {
    log.error('tiktok_upload_failed', { error: error?.message || 'unknown_error' });
    const r = NextResponse.json({ error: 'Failed to upload video', requestId }, { status: 500 });
    r.headers.set('X-Request-Id', requestId);
    return r;
  }
}
