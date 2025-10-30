/**
 * Next.js 16 Features - Ready to Use Examples
 * 
 * Ces exemples sont prêts à copier-coller dans ton projet
 */

// ============================================================================
// 1. CACHE COMPONENTS ("use cache")
// ============================================================================

// app/components/SubscribersList.tsx
'use cache';

import { prisma } from '@/lib/prisma';

export async function SubscribersList({ userId }: { userId: string }) {
  const subscribers = await prisma.subscriber.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <div className="space-y-4">
      {subscribers.map(sub => (
        <div key={sub.id} className="p-4 border rounded">
          <h3>{sub.username}</h3>
          <p>{sub.email}</p>
          <span className="badge">{sub.tier}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// 2. PROXY.TS (remplace middleware.ts)
// ============================================================================

// proxy.ts
import { NextRequest, NextResponse } from 'next/server';

export default function proxy(req: NextRequest) {
  const host = req.headers.get('host');
  
  // 1. Redirect non-production hosts
  if (host && host !== 'app.huntaze.com' && process.env.NODE_ENV === 'production') {
    return NextResponse.redirect(
      new URL(req.nextUrl.pathname, 'https://app.huntaze.com')
    );
  }

  // 2. A/B Testing
  const variant = req.cookies.get('ab-test')?.value;
  if (variant === 'b') {
    return NextResponse.rewrite(new URL('/dashboard-v2', req.url));
  }

  // 3. Feature flags
  const hasNewFeature = req.cookies.get('feature-new-ui')?.value === 'true';
  if (hasNewFeature && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.rewrite(new URL('/dashboard-new', req.url));
  }

  // 4. Rate limiting headers
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', '99');
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

// ============================================================================
// 3. REVALIDATION CIBLÉE
// ============================================================================

// app/api/onlyfans/subscribers/route.ts
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const userId = session.user.id;

  // Create subscriber
  const subscriber = await prisma.subscriber.create({
    data: {
      userId,
      username: body.username,
      email: body.email,
      tier: body.tier || 'free',
      isActive: true,
    },
  });

  // Revalidate specific cache tags
  revalidateTag(`subscribers:${userId}`);
  revalidateTag(`subscribers:all`);

  return NextResponse.json({ success: true, data: subscriber });
}

// Côté data fetching avec tags
export async function getSubscribers(userId: string) {
  const response = await fetch(`/api/onlyfans/subscribers?userId=${userId}`, {
    next: {
      tags: [`subscribers:${userId}`, 'subscribers:all'],
      revalidate: 60, // 60 seconds
    },
  });

  return response.json();
}

// ============================================================================
// 4. SERVER ACTIONS (React 19)
// ============================================================================

// app/actions/subscribers.ts
'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const subscriberSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  tier: z.enum(['free', 'premium', 'vip']).default('free'),
});

export async function addSubscriber(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Validate
  const data = subscriberSchema.parse({
    username: formData.get('username'),
    email: formData.get('email'),
    tier: formData.get('tier'),
  });

  // Create
  const subscriber = await prisma.subscriber.create({
    data: {
      userId: session.user.id,
      ...data,
      isActive: true,
    },
  });

  // Revalidate
  revalidatePath('/onlyfans/subscribers');
  
  return { success: true, data: subscriber };
}

// Component usage
'use client';

import { addSubscriber } from '@/app/actions/subscribers';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? 'Adding...' : 'Add Subscriber'}
    </button>
  );
}

export function AddSubscriberForm() {
  return (
    <form action={addSubscriber} className="space-y-4">
      <input
        name="username"
        placeholder="Username"
        required
        className="input"
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="input"
      />
      <select name="tier" className="select">
        <option value="free">Free</option>
        <option value="premium">Premium</option>
        <option value="vip">VIP</option>
      </select>
      <SubmitButton />
    </form>
  );
}

// ============================================================================
// 5. SSE STREAMING (Chatbot)
// ============================================================================

// app/api/chatbot/stream/route.ts
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const message = searchParams.get('message');

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // Send ready event
      controller.enqueue(encoder.encode('event: ready\ndata: {}\n\n'));
      
      try {
        // Simulate AI streaming (replace with actual AI service)
        const tokens = message?.split(' ') || [];
        
        for (const token of tokens) {
          await new Promise(resolve => setTimeout(resolve, 100));
          
          controller.enqueue(
            encoder.encode(`event: token\ndata: ${JSON.stringify({ token })}\n\n`)
          );
        }
        
        // Send done event
        controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
      } catch (error) {
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Failed' })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Client usage
'use client';

import { useState, useEffect } from 'react';

export function ChatInterface() {
  const [messages, setMessages] = useState<string[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');

  function startStream(message: string) {
    const eventSource = new EventSource(
      `/api/chatbot/stream?message=${encodeURIComponent(message)}`
    );

    let buffer = '';

    eventSource.addEventListener('ready', () => {
      console.log('Stream ready');
    });

    eventSource.addEventListener('token', (event) => {
      const { token } = JSON.parse(event.data);
      buffer += token + ' ';
      setCurrentMessage(buffer);
    });

    eventSource.addEventListener('done', () => {
      setMessages(prev => [...prev, buffer]);
      setCurrentMessage('');
      eventSource.close();
    });

    eventSource.addEventListener('error', () => {
      eventSource.close();
    });
  }

  return (
    <div className="chat-interface">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className="message">{msg}</div>
        ))}
        {currentMessage && (
          <div className="message typing">{currentMessage}</div>
        )}
      </div>
      <button onClick={() => startStream('Hello AI!')}>
        Send Message
      </button>
    </div>
  );
}

// ============================================================================
// 6. S3 PRESIGNED UPLOAD
// ============================================================================

// app/api/content/upload-url/route.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type, name } = await request.json();
  const userId = session.user.id;
  const key = `${userId}/${Date.now()}-${name}`;

  const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
  });

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    ContentType: type,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });

  return NextResponse.json({
    success: true,
    data: { url, key },
  });
}

// Client usage
async function uploadFile(file: File) {
  // 1. Get presigned URL
  const urlResponse = await fetch('/api/content/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: file.type,
      name: file.name,
    }),
  });

  const { data } = await urlResponse.json();

  // 2. Upload directly to S3
  await fetch(data.url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  // 3. Save metadata
  await fetch('/api/content/library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: file.name,
      type: file.type,
      url: `https://cdn.huntaze.com/${data.key}`,
      key: data.key,
    }),
  });
}

// ============================================================================
// 7. SQS FIFO WITH IDEMPOTENCE
// ============================================================================

// lib/services/sqs.service.ts
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { createHash } from 'crypto';

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION!,
});

export async function sendToQueue(payload: {
  type: string;
  data: any;
  userId: string;
}) {
  // Generate idempotency key from payload
  const idempotencyKey = createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');

  const command = new SendMessageCommand({
    QueueUrl: process.env.SQS_QUEUE_URL!,
    MessageGroupId: 'onlyfans',
    MessageDeduplicationId: idempotencyKey, // Prevents duplicates
    MessageBody: JSON.stringify(payload),
    MessageAttributes: {
      userId: {
        DataType: 'String',
        StringValue: payload.userId,
      },
      type: {
        DataType: 'String',
        StringValue: payload.type,
      },
    },
  });

  await sqsClient.send(command);
}

// Usage
await sendToQueue({
  type: 'SEND_MESSAGE',
  data: {
    subscriberId: 'sub_123',
    message: 'Hello!',
  },
  userId: 'user_456',
});

// ============================================================================
// 8. PRISMA ACCELERATE
// ============================================================================

// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  }).$extends(withAccelerate());

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Usage with caching
const subscribers = await prisma.subscriber.findMany({
  where: { userId },
  cacheStrategy: {
    ttl: 60, // 60 seconds
    tags: [`subscribers:${userId}`],
  },
});

export default prisma;
