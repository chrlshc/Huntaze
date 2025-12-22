/**
 * War Room Schedule API Routes
 * 
 * Handles content distribution scheduling for the Marketing War Room.
 * 
 * POST /api/warroom/schedule - Create a distribution job
 * GET /api/warroom/schedule - List scheduled distributions
 */

import { NextRequest, NextResponse } from 'next/server';

export type Platform = 'tiktok' | 'instagram' | 'reddit';
export type DistributionStatus = 'draft' | 'scheduled' | 'posted' | 'failed';

export interface DistributionJobInput {
  contentId: string;
  platform: Platform;
  scheduledAt?: string;
  caption?: string;
  postNow?: boolean;
}

export interface DistributionJob {
  id: string;
  contentId: string;
  platform: Platform;
  status: DistributionStatus;
  scheduledAt?: string;
  postedAt?: string;
  postUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory store for demo (replace with DB in production)
const distributions: Map<string, DistributionJob> = new Map();

export async function POST(request: NextRequest) {
  try {
    const body: DistributionJobInput = await request.json();

    // Validate required fields
    if (!body.contentId) {
      return NextResponse.json(
        { error: 'contentId is required' },
        { status: 400 }
      );
    }

    if (!body.platform) {
      return NextResponse.json(
        { error: 'platform is required' },
        { status: 400 }
      );
    }

    const validPlatforms: Platform[] = ['tiktok', 'instagram', 'reddit'];
    if (!validPlatforms.includes(body.platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be tiktok, instagram, or reddit' },
        { status: 400 }
      );
    }

    // Create distribution job
    const jobId = `dist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const job: DistributionJob = {
      id: jobId,
      contentId: body.contentId,
      platform: body.platform,
      status: body.postNow ? 'posted' : 'scheduled',
      scheduledAt: body.scheduledAt,
      postedAt: body.postNow ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };

    distributions.set(jobId, job);

    // In production:
    // - If postNow: trigger immediate posting via platform API
    // - If scheduled: add to scheduler queue

    return NextResponse.json({
      success: true,
      distribution: job,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating distribution job:', error);
    return NextResponse.json(
      { error: 'Failed to create distribution job' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as DistributionStatus | null;
    const platform = searchParams.get('platform') as Platform | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let jobList = Array.from(distributions.values());

    // Filter by status
    if (status) {
      jobList = jobList.filter(job => job.status === status);
    }

    // Filter by platform
    if (platform) {
      jobList = jobList.filter(job => job.platform === platform);
    }

    // Sort by scheduledAt or createdAt descending
    jobList.sort((a, b) => {
      const dateA = a.scheduledAt || a.createdAt;
      const dateB = b.scheduledAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    // Apply limit
    jobList = jobList.slice(0, limit);

    return NextResponse.json({
      success: true,
      distributions: jobList,
      total: distributions.size,
    });

  } catch (error) {
    console.error('Error fetching distributions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch distributions' },
      { status: 500 }
    );
  }
}
