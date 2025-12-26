/**
 * Content Factory Job API Routes
 * 
 * GET /api/content/factory/[id] - Get job details
 * POST /api/content/factory/[id]/approve - Approve job (needs_review -> ready)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';

export type JobStatus = 'queued' | 'processing' | 'needs_review' | 'ready' | 'failed';

export interface ProductionJob {
  id: string;
  status: JobStatus;
  sourceType: 'upload' | 'link';
  sourceUrl?: string;
  filePath?: string;
  idea: string;
  script?: {
    hook: string;
    body: string;
    cta: string;
  };
  targets: string[];
  settings: {
    captions: boolean;
    smartCuts: boolean;
    safeZoneCrop: boolean;
    watermarkFree: boolean;
  };
  outputs?: {
    variant: string;
    url: string;
    duration: string;
  }[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// In production, this would be a database lookup
// For demo, we return mock data
function getJobById(id: string): ProductionJob | null {
  // Mock job for demo
  if (id.startsWith('job_')) {
    return {
      id,
      status: 'ready',
      sourceType: 'upload',
      filePath: '/uploads/video.mp4',
      idea: 'Morning routine reveal',
      script: {
        hook: '"Wait, you\'re still doing it wrong..."',
        body: 'Here\'s the thing about morning routines...',
        cta: 'Link in bio for the full guide!',
      },
      targets: ['tiktok', 'instagram'],
      settings: {
        captions: true,
        smartCuts: true,
        safeZoneCrop: true,
        watermarkFree: true,
      },
      outputs: [
        { variant: '15s TikTok', url: `/api/content/factory/${id}/download?variant=15s`, duration: '0:15' },
        { variant: '25s Reels', url: `/api/content/factory/${id}/download?variant=25s`, duration: '0:25' },
        { variant: 'Story Crop', url: `/api/content/factory/${id}/download?variant=story`, duration: '0:12' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!ENABLE_MOCK_DATA) {
      return NextResponse.json(
        { error: { code: 'NOT_IMPLEMENTED', message: 'Content factory demo is only available in dev mode' } },
        { status: 501, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const { id } = await params;
    const job = getJobById(id);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job,
    });

  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!ENABLE_MOCK_DATA) {
      return NextResponse.json(
        { error: { code: 'NOT_IMPLEMENTED', message: 'Content factory demo is only available in dev mode' } },
        { status: 501, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const job = getJobById(id);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      if (job.status !== 'needs_review') {
        return NextResponse.json(
          { error: 'Job is not in needs_review status' },
          { status: 400 }
        );
      }

      // In production, update database
      job.status = 'ready';
      job.updatedAt = new Date().toISOString();

      return NextResponse.json({
        success: true,
        job,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}
