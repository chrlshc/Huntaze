import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth';
import { enqueueLogin } from '@/lib/queue/of-sqs';

const schema = z.object({
  otp: z.string().optional(),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession().catch(() => null);
    const { otp, userId } = schema.parse(await req.json().catch(() => ({})));
    const effectiveUserId = userId || (session as any)?.user?.id;
    if (!effectiveUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await enqueueLogin({ userId: effectiveUserId, otp });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: 'Invalid request', details: e.issues }, { status: 400 });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

