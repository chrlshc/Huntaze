import { NextRequest, NextResponse } from 'next/server';
import { tiktokService } from '@/lib/services/tiktok';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    const caption = formData.get('caption') as string;

    if (!videoFile || !caption) {
      return NextResponse.json(
        { error: 'Video and caption are required' },
        { status: 400 }
      );
    }

    // For sandbox mode, we'll simulate a successful upload
    if (process.env.TIKTOK_SANDBOX_MODE === 'true') {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return NextResponse.json({
        success: true,
        publish_id: `sandbox_${Date.now()}`,
        message: 'Video uploaded successfully (sandbox mode)'
      });
    }

    // Production upload
    const result = await tiktokService.uploadVideo(videoFile, caption);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      publish_id: result.publish_id,
      message: 'Video uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
}