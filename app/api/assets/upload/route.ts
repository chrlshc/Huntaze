/**
 * API Route: Upload and optimize images
 * POST /api/assets/upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAssetOptimizer } from '@/lib/aws/asset-optimizer';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for image processing

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const filename = formData.get('filename') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Image must be smaller than 10MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique key
    const fileId = nanoid();
    const extension = filename.split('.').pop() || 'jpg';
    const baseKey = `uploads/${fileId}`;

    // Get optimizer instance
    const optimizer = getAssetOptimizer();

    // Optimize image
    const optimized = await optimizer.optimizeImage({
      buffer,
      filename,
      contentType: file.type,
    });

    // Upload to S3
    const assetMetadata = await optimizer.uploadOptimizedImage(
      optimized,
      baseKey
    );

    return NextResponse.json({
      success: true,
      assetMetadata,
    });

  } catch (error) {
    console.error('Image upload error:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 }
    );
  }
}
