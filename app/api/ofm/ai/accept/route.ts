import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth';
import { enqueueSend as enqueueSqs } from '@/lib/queue/of-sqs';
import { queueDmMessage } from '@/lib/queue/of-queue';
import { checkAndIncrementCaps } from '@/lib/of/caps';

const schema = z.object({
  conversationId: z.string().min(1),
  message: z.string().min(1).max(1000),
  idempotencyKey: z.string().optional(),
  ppv: z
    .object({
      priceCents: z.number().int().min(100).max(50000),
      caption: z.string().optional(),
      mediaVaultId: z.string().optional(),
    })
    .optional(),
  ab: z.object({ campaignId: z.string().optional(), variantId: z.enum(['A', 'B', 'C']).optional() }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession().catch(() => null);
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { conversationId, message, ppv } = schema.parse(body);

    // Caps check (soft-fail to 429)
    const fanId = 'unknown'; // Optionally resolve from thread if needed
    const ok = await checkAndIncrementCaps(userId, fanId, ppv ? 'PPV' : 'DM');
    if (!ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    if (process.env.OF_SQS_SEND_QUEUE_URL) {
      await enqueueSqs({ id: `job_${Date.now()}`, userId, conversationId, content: { text: message } });
      return NextResponse.json({ ok: true, backend: 'sqs' });
    }

    // Dev fallback
    const messageId = await queueDmMessage(userId, conversationId, { text: message });
    return NextResponse.json({ ok: true, backend: 'local', messageId });
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: 'Invalid request', details: e.issues }, { status: 400 });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

