import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendOfMessage } from '@/lib/workers/of-browser-worker';
import { getServerSession } from '@/lib/auth';

const schema = z.object({
  conversationId: z.string().min(1),
  content: z.object({ text: z.string().min(1).max(1000) }),
  userId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession().catch(() => null);
    const body = await request.json();
    const { conversationId, content, userId } = schema.parse(body);

    const effectiveUserId = userId || (session as any)?.user?.id;
    if (!effectiveUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await sendOfMessage(effectiveUserId, {
      id: `tmp_${Date.now()}`,
      conversationId,
      content,
      timestamp: new Date(),
    } as any);

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: 'Invalid request', details: e.issues }, { status: 400 });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

