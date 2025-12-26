/**
 * Content Factory API Routes
 * 
 * Handles content creation jobs for the Content Factory feature.
 * 
 * POST /api/content/factory - Create a new production job
 * GET /api/content/factory - List all production jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';

export type SourceType = 'upload' | 'link';
export type JobStatus = 'queued' | 'processing' | 'needs_review' | 'ready' | 'failed';

export interface ProductionJobInput {
  sourceType: SourceType;
  sourceUrl?: string;
  filePath?: string;
  idea: string;
  script?: {
    hook: string;
    body: string;
    cta: string;
  };
  targets: ('tiktok' | 'instagram' | 'reddit')[];
  settings: {
    captions: boolean;
    smartCuts: boolean;
    safeZoneCrop: boolean;
    watermarkFree: boolean;
  };
}

export interface ProductionJob {
  id: string;
  status: JobStatus;
  sourceType: SourceType;
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

// In-memory store for demo (replace with DB in production)
const jobs: Map<string, ProductionJob> = new Map();

export async function POST(request: NextRequest) {
  try {
    if (!ENABLE_MOCK_DATA) {
      return NextResponse.json(
        { error: { code: 'NOT_IMPLEMENTED', message: 'Content factory demo is only available in dev mode' } },
        { status: 501, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const body: ProductionJobInput = await request.json();

    // Validate required fields
    if (!body.sourceType) {
      return NextResponse.json(
        { error: 'sourceType is required' },
        { status: 400 }
      );
    }

    if (body.sourceType === 'upload' && !body.filePath) {
      return NextResponse.json(
        { error: 'filePath is required for upload source type' },
        { status: 400 }
      );
    }

    if (body.sourceType === 'link' && !body.sourceUrl) {
      return NextResponse.json(
        { error: 'sourceUrl is required for link source type' },
        { status: 400 }
      );
    }

    if (!body.idea?.trim()) {
      return NextResponse.json(
        { error: 'idea is required' },
        { status: 400 }
      );
    }

    // Create new job
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const job: ProductionJob = {
      id: jobId,
      status: 'queued',
      sourceType: body.sourceType,
      sourceUrl: body.sourceUrl,
      filePath: body.filePath,
      idea: body.idea,
      script: body.script,
      targets: body.targets || ['tiktok', 'instagram'],
      settings: body.settings || {
        captions: true,
        smartCuts: true,
        safeZoneCrop: true,
        watermarkFree: true,
      },
      createdAt: now,
      updatedAt: now,
    };

    jobs.set(jobId, job);

    // In production, this would trigger a worker/queue
    // For now, simulate async processing
    simulateJobProcessing(jobId);

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        createdAt: job.createdAt,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating production job:', error);
    return NextResponse.json(
      { error: 'Failed to create production job' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!ENABLE_MOCK_DATA) {
      return NextResponse.json(
        { error: { code: 'NOT_IMPLEMENTED', message: 'Content factory demo is only available in dev mode' } },
        { status: 501, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let jobList = Array.from(jobs.values());

    // Filter by status if provided
    if (status) {
      jobList = jobList.filter(job => job.status === status);
    }

    // Sort by createdAt descending
    jobList.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply limit
    jobList = jobList.slice(0, limit);

    return NextResponse.json({
      success: true,
      jobs: jobList,
      total: jobs.size,
    });

  } catch (error) {
    console.error('Error fetching production jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production jobs' },
      { status: 500 }
    );
  }
}

// Simulate job processing (replace with actual worker in production)
async function simulateJobProcessing(jobId: string) {
  const delays = {
    queued: 1500,
    processing: 3000,
    needs_review: 1000,
  };

  // queued -> processing
  await new Promise(resolve => setTimeout(resolve, delays.queued));
  const job = jobs.get(jobId);
  if (job) {
    job.status = 'processing';
    job.updatedAt = new Date().toISOString();
    jobs.set(jobId, job);
  }

  // processing -> needs_review
  await new Promise(resolve => setTimeout(resolve, delays.processing));
  const job2 = jobs.get(jobId);
  if (job2) {
    job2.status = 'needs_review';
    job2.updatedAt = new Date().toISOString();
    jobs.set(jobId, job2);
  }

  // needs_review -> ready
  await new Promise(resolve => setTimeout(resolve, delays.needs_review));
  const job3 = jobs.get(jobId);
  if (job3) {
    job3.status = 'ready';
    job3.updatedAt = new Date().toISOString();
    job3.outputs = [
      { variant: '15s TikTok', url: `/api/content/factory/${jobId}/download?variant=15s`, duration: '0:15' },
      { variant: '25s Reels', url: `/api/content/factory/${jobId}/download?variant=25s`, duration: '0:25' },
      { variant: 'Story Crop', url: `/api/content/factory/${jobId}/download?variant=story`, duration: '0:12' },
    ];
    jobs.set(jobId, job3);
  }
}
