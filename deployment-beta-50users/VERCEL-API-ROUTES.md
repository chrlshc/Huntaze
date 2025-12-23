# 🔌 Vercel API Routes - Azure Service Bus Integration

**Objectif**: Créer les API routes Vercel pour enqueue des jobs sur Azure Service Bus  
**Durée**: 15 minutes  
**Prérequis**: `SERVICEBUS_CONNECTION_SEND` configuré dans Vercel

---

## 📋 Routes à Créer

```
app/api/jobs/
├── video-analysis/
│   └── route.ts          # POST /api/jobs/video-analysis
├── chat-suggestions/
│   └── route.ts          # POST /api/jobs/chat-suggestions
├── content-suggestions/
│   └── route.ts          # POST /api/jobs/content-suggestions
├── content-analysis/
│   └── route.ts          # POST /api/jobs/content-analysis
└── status/
    └── [jobId]/
        └── route.ts      # GET /api/jobs/status/:jobId
```

---

## 🎬 1. Video Analysis Route

**Fichier**: `app/api/jobs/video-analysis/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ServiceBusClient } from '@azure/service-bus';

const connectionString = process.env.SERVICEBUS_CONNECTION_SEND!;

if (!connectionString) {
  throw new Error('SERVICEBUS_CONNECTION_SEND is not configured');
}

const client = new ServiceBusClient(connectionString);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoUrl, creatorId, metadata } = body;
    
    // Validation
    if (!videoUrl || !creatorId) {
      return NextResponse.json(
        { error: 'Missing required fields: videoUrl, creatorId' },
        { status: 400 }
      );
    }
    
    // Validate video URL (must be S3)
    if (!videoUrl.includes('s3.amazonaws.com') && !videoUrl.includes('cloudfront.net')) {
      return NextResponse.json(
        { error: 'Video URL must be from S3 or CloudFront' },
        { status: 400 }
      );
    }
    
    // Generate job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create sender
    const sender = client.createSender('huntaze-jobs');
    
    // Send message
    await sender.sendMessages({
      body: {
        jobId,
        jobType: 'video.analysis',
        creatorId,
        payload: {
          videoUrl,
          metadata: metadata || {},
        },
        attempt: 0,
        createdAt: new Date().toISOString(),
        deadlineMs: 120000, // 2 minutes SLA
      },
      contentType: 'application/json',
      applicationProperties: {
        jobType: 'video.analysis', // For SQL filter routing
        jobId,
        creatorId,
      },
    });
    
    await sender.close();
    
    // Log to database (optional)
    // await prisma.job.create({
    //   data: {
    //     id: jobId,
    //     type: 'video.analysis',
    //     status: 'pending',
    //     creatorId,
    //     payload: { videoUrl, metadata },
    //   },
    // });
    
    return NextResponse.json({
      success: true,
      jobId,
      status: 'pending',
      message: 'Video analysis job queued successfully',
      estimatedCompletionTime: '2 minutes',
    });
    
  } catch (error: any) {
    console.error('[VideoAnalysisAPI] Failed to queue job:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to queue video analysis job',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    service: 'video-analysis',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
}
```

---

## 💬 2. Chat Suggestions Route

**Fichier**: `app/api/jobs/chat-suggestions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ServiceBusClient } from '@azure/service-bus';

const connectionString = process.env.SERVICEBUS_CONNECTION_SEND!;
const client = new ServiceBusClient(connectionString);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fanMessage, context, creatorId, conversationId } = body;
    
    // Validation
    if (!fanMessage || !creatorId) {
      return NextResponse.json(
        { error: 'Missing required fields: fanMessage, creatorId' },
        { status: 400 }
      );
    }
    
    // Generate job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create sender
    const sender = client.createSender('huntaze-jobs');
    
    // Send message
    await sender.sendMessages({
      body: {
        jobId,
        jobType: 'chat.suggest',
        creatorId,
        payload: {
          fanMessage,
          context: context || {},
          conversationId,
        },
        attempt: 0,
        createdAt: new Date().toISOString(),
        deadlineMs: 90000, // 90 seconds
      },
      contentType: 'application/json',
      applicationProperties: {
        jobType: 'chat.suggest', // For SQL filter routing
        jobId,
        creatorId,
      },
    });
    
    await sender.close();
    
    return NextResponse.json({
      success: true,
      jobId,
      status: 'pending',
      message: 'Chat suggestions job queued successfully',
      estimatedCompletionTime: '90 seconds',
    });
    
  } catch (error: any) {
    console.error('[ChatSuggestionsAPI] Failed to queue job:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to queue chat suggestions job',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'chat-suggestions',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
}
```

---

## 📝 3. Content Suggestions Route

**Fichier**: `app/api/jobs/content-suggestions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ServiceBusClient } from '@azure/service-bus';

const connectionString = process.env.SERVICEBUS_CONNECTION_SEND!;
const client = new ServiceBusClient(connectionString);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platform, contentType, creatorId, preferences } = body;
    
    // Validation
    if (!platform || !contentType || !creatorId) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, contentType, creatorId' },
        { status: 400 }
      );
    }
    
    // Generate job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create sender
    const sender = client.createSender('huntaze-jobs');
    
    // Send message
    await sender.sendMessages({
      body: {
        jobId,
        jobType: 'content.suggest',
        creatorId,
        payload: {
          platform,
          contentType,
          preferences: preferences || {},
        },
        attempt: 0,
        createdAt: new Date().toISOString(),
        deadlineMs: 90000, // 90 seconds
      },
      contentType: 'application/json',
      applicationProperties: {
        jobType: 'content.suggest', // For SQL filter routing
        jobId,
        creatorId,
      },
    });
    
    await sender.close();
    
    return NextResponse.json({
      success: true,
      jobId,
      status: 'pending',
      message: 'Content suggestions job queued successfully',
      estimatedCompletionTime: '90 seconds',
    });
    
  } catch (error: any) {
    console.error('[ContentSuggestionsAPI] Failed to queue job:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to queue content suggestions job',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'content-suggestions',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
}
```

---

## 🔍 4. Content Analysis Route

**Fichier**: `app/api/jobs/content-analysis/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ServiceBusClient } from '@azure/service-bus';

const connectionString = process.env.SERVICEBUS_CONNECTION_SEND!;
const client = new ServiceBusClient(connectionString);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contentUrl, contentType, creatorId, analysisType } = body;
    
    // Validation
    if (!contentUrl || !contentType || !creatorId) {
      return NextResponse.json(
        { error: 'Missing required fields: contentUrl, contentType, creatorId' },
        { status: 400 }
      );
    }
    
    // Generate job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create sender
    const sender = client.createSender('huntaze-jobs');
    
    // Send message
    await sender.sendMessages({
      body: {
        jobId,
        jobType: 'content.analyze',
        creatorId,
        payload: {
          contentUrl,
          contentType,
          analysisType: analysisType || 'full',
        },
        attempt: 0,
        createdAt: new Date().toISOString(),
        deadlineMs: 120000, // 2 minutes
      },
      contentType: 'application/json',
      applicationProperties: {
        jobType: 'content.analyze', // For SQL filter routing
        jobId,
        creatorId,
      },
    });
    
    await sender.close();
    
    return NextResponse.json({
      success: true,
      jobId,
      status: 'pending',
      message: 'Content analysis job queued successfully',
      estimatedCompletionTime: '2 minutes',
    });
    
  } catch (error: any) {
    console.error('[ContentAnalysisAPI] Failed to queue job:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to queue content analysis job',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'content-analysis',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
}
```

---

## 📊 5. Job Status Route

**Fichier**: `app/api/jobs/status/[jobId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assuming you have Prisma setup

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId parameter' },
        { status: 400 }
      );
    }
    
    // Query job status from database
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        type: true,
        status: true,
        result: true,
        error: true,
        createdAt: true,
        completedAt: true,
        attempts: true,
      },
    });
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Calculate duration if completed
    let durationMs = null;
    if (job.completedAt) {
      durationMs = job.completedAt.getTime() - job.createdAt.getTime();
    }
    
    return NextResponse.json({
      jobId: job.id,
      type: job.type,
      status: job.status,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString() || null,
      durationMs,
      attempts: job.attempts,
    });
    
  } catch (error: any) {
    console.error('[JobStatusAPI] Failed to get job status:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get job status',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
```

---

## 🗄️ 6. Prisma Schema (Job Tracking)

**Fichier**: `prisma/schema.prisma` (ajouter ce modèle)

```prisma
model Job {
  id          String   @id @default(cuid())
  type        String   // 'video.analysis', 'chat.suggest', etc.
  status      String   @default("pending") // 'pending', 'processing', 'completed', 'failed'
  creatorId   String
  payload     Json
  result      Json?
  error       String?
  attempts    Int      @default(0)
  createdAt   DateTime @default(now())
  completedAt DateTime?
  
  @@index([creatorId])
  @@index([status])
  @@index([type])
  @@index([createdAt])
}
```

**Migration**:
```bash
npx prisma migrate dev --name add_job_tracking
```

---

## 🧪 7. Tests

### Test 1: Video Analysis

```bash
curl -X POST https://your-app.vercel.app/api/jobs/video-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://huntaze-videos-beta.s3.us-east-2.amazonaws.com/test.mp4",
    "creatorId": "test-123",
    "metadata": {
      "title": "Test Video",
      "duration": 120
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "jobId": "job_1703260800000_abc123",
  "status": "pending",
  "message": "Video analysis job queued successfully",
  "estimatedCompletionTime": "2 minutes"
}
```

### Test 2: Chat Suggestions

```bash
curl -X POST https://your-app.vercel.app/api/jobs/chat-suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "fanMessage": "Hey! Love your content 😍",
    "creatorId": "test-123",
    "conversationId": "conv-456",
    "context": {
      "fanTier": "premium",
      "previousMessages": 5
    }
  }'
```

### Test 3: Job Status

```bash
curl https://your-app.vercel.app/api/jobs/status/job_1703260800000_abc123
```

**Expected Response**:
```json
{
  "jobId": "job_1703260800000_abc123",
  "type": "video.analysis",
  "status": "completed",
  "result": {
    "scenes": [...],
    "objects": [...],
    "transcript": "..."
  },
  "error": null,
  "createdAt": "2025-12-22T23:00:00.000Z",
  "completedAt": "2025-12-22T23:01:45.234Z",
  "durationMs": 105234,
  "attempts": 1
}
```

---

## 🔒 8. Rate Limiting (Optionnel)

**Fichier**: `lib/rate-limiter.ts`

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function checkRateLimit(
  creatorId: string,
  jobType: string,
  maxRequests: number = 10,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `ratelimit:${jobType}:${creatorId}`;
  
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  
  const allowed = count <= maxRequests;
  const remaining = Math.max(0, maxRequests - count);
  
  return { allowed, remaining };
}
```

**Usage dans API route**:
```typescript
// app/api/jobs/video-analysis/route.ts

import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const { creatorId } = await req.json();
  
  // Check rate limit: 10 video analysis jobs per minute
  const { allowed, remaining } = await checkRateLimit(
    creatorId,
    'video.analysis',
    10,
    60
  );
  
  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Maximum 10 video analysis jobs per minute',
        retryAfter: 60,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
          'Retry-After': '60',
        },
      }
    );
  }
  
  // Continue with job creation...
}
```

---

## 📊 9. Monitoring Dashboard

**Fichier**: `app/(app)/admin/jobs/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';

interface JobStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  avgDurationMs: number;
}

export default function JobsMonitoringPage() {
  const [stats, setStats] = useState<JobStats | null>(null);
  
  useEffect(() => {
    async function fetchStats() {
      const res = await fetch('/api/admin/jobs/stats');
      const data = await res.json();
      setStats(data);
    }
    
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Refresh every 5s
    
    return () => clearInterval(interval);
  }, []);
  
  if (!stats) return <div>Loading...</div>;
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Jobs Monitoring</h1>
      
      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} color="yellow" />
        <StatCard label="Processing" value={stats.processing} color="blue" />
        <StatCard label="Completed" value={stats.completed} color="green" />
        <StatCard label="Failed" value={stats.failed} color="red" />
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Performance</h2>
        <p>Average Duration: {(stats.avgDurationMs / 1000).toFixed(2)}s</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'gray' }: any) {
  return (
    <div className={`bg-${color}-100 p-4 rounded-lg`}>
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}
```

---

## ✅ Checklist

- [ ] Installer `@azure/service-bus` dans le projet Next.js
- [ ] Créer les 4 API routes (video, chat, content-suggest, content-analyze)
- [ ] Créer la route de status
- [ ] Ajouter le modèle `Job` dans Prisma schema
- [ ] Exécuter la migration Prisma
- [ ] Configurer `SERVICEBUS_CONNECTION_SEND` dans Vercel
- [ ] Tester chaque route avec curl
- [ ] Vérifier les logs Azure Functions
- [ ] (Optionnel) Ajouter rate limiting
- [ ] (Optionnel) Créer dashboard de monitoring

---

## 🚀 Déploiement

```bash
# 1. Install dependencies
npm install @azure/service-bus

# 2. Create API routes (copy code above)

# 3. Update Prisma schema
npx prisma migrate dev --name add_job_tracking

# 4. Deploy to Vercel
vercel --prod

# 5. Test
curl -X POST https://your-app.vercel.app/api/jobs/video-analysis \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://...", "creatorId": "test"}'
```

---

**Dernière mise à jour**: 2025-12-22 23:50 UTC  
**Statut**: ✅ PRÊT POUR IMPLÉMENTATION
