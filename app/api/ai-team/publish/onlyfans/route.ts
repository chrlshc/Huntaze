export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth';

const Body = z.object({
  modelId: z.string(),
  runId: z.string().uuid(),
  contents: z.array(
    z.object({
      idea: z.string(),
      text: z.string().min(1).max(1000),
      conversationId: z.string(),
    }),
  ),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession().catch(() => null);
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = Body.parse(await req.json());
    const results: Array<{ conversationId: string; externalId: string; status: 'queued' | 'local'; backend: 'sqs' | 'local' }> = [];

    // Try SQS first (prod path)
    try {
      const { enqueueSend } = await import('@/src/lib/queue/of-sqs');
      for (const c of body.contents) {
        const idempotencyKey = `${body.runId}:${c.idea}:${c.conversationId}`;
        await enqueueSend({ id: idempotencyKey, userId, conversationId: c.conversationId, content: { text: c.text } });
        results.push({ conversationId: c.conversationId, externalId: idempotencyKey, status: 'queued', backend: 'sqs' });
      }
      return NextResponse.json({ ok: true, results });
    } catch (e) {
      // Fallback to local in-memory queue (dev path)
      try {
        const { queueDmMessage } = await import('@/src/lib/queue/of-queue');
        for (const c of body.contents) {
          const mid = await queueDmMessage(userId, c.conversationId, { text: c.text });
          results.push({ conversationId: c.conversationId, externalId: mid, status: 'local', backend: 'local' });
        }
        return NextResponse.json({ ok: true, results });
      } catch (err) {
        return NextResponse.json({ ok: false, error: 'Dispatch failed' }, { status: 500 });
      }
    }
  } catch (error: any) {
    if (error?.issues) return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

