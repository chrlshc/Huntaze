import { NextRequest, NextResponse } from 'next/server';

// In-memory job store (in production, use Redis or database)
const jobs = new Map<string, {
  status: 'queued' | 'running' | 'finished' | 'failed';
  progress: number;
  createdContentIds: string[];
  error?: string;
}>();

function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateContentId(): string {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const file = formData.get('file') as File | null;
    const tiktokUrl = formData.get('tiktokUrl') as string | null;
    const idea = formData.get('idea') as string | null;
    const targets = formData.get('targets') as string || 'all';
    const variants = parseInt(formData.get('variants') as string || '3', 10);
    const optionsStr = formData.get('options') as string | null;
    const scriptStr = formData.get('script') as string | null;

    // Parse options
    let options = {
      removeWatermark: false,
      autoCaptions: true,
      sendToMarketing: true,
    };
    if (optionsStr) {
      try {
        options = { ...options, ...JSON.parse(optionsStr) };
      } catch {
        // ignore parse errors
      }
    }

    // Validate source
    if (!file && !tiktokUrl?.trim()) {
      return NextResponse.json(
        { error: 'Either file or tiktokUrl is required' },
        { status: 400 }
      );
    }

    // Create job
    const jobId = generateJobId();
    const createdContentIds: string[] = [];

    // Generate content IDs for the drafts
    for (let i = 0; i < Math.min(variants, 3); i++) {
      createdContentIds.push(generateContentId());
    }

    // Initialize job
    jobs.set(jobId, {
      status: 'queued',
      progress: 15,
      createdContentIds,
    });

    // Simulate async processing (in production, this would be a worker queue)
    setTimeout(() => {
      const job = jobs.get(jobId);
      if (job) {
        job.status = 'running';
        job.progress = 40;
      }
    }, 1000);

    setTimeout(() => {
      const job = jobs.get(jobId);
      if (job) {
        job.progress = 70;
      }
    }, 3000);

    setTimeout(() => {
      const job = jobs.get(jobId);
      if (job) {
        job.status = 'finished';
        job.progress = 100;
      }
    }, 5000);

    // Log for debugging
    console.log('Content Factory - Production started:', {
      jobId,
      hasFile: !!file,
      tiktokUrl: tiktokUrl?.slice(0, 50),
      idea: idea?.slice(0, 50),
      targets,
      variants,
      options,
      createdContentIds,
    });

    return NextResponse.json({
      jobId,
      status: 'queued',
      progress: 15,
      createdContentIds,
    });
  } catch (error) {
    console.error('Content Factory produce error:', error);
    return NextResponse.json(
      { error: 'Failed to start production' },
      { status: 500 }
    );
  }
}

// Export jobs map for the jobs endpoint to access
export { jobs };
