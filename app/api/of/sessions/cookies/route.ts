import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth';
import { putEncryptedCookies } from '@/lib/of/aws-session-store';

const cookieSchema = z.object({
  name: z.string(),
  value: z.string(),
  domain: z.string(),
  path: z.string().default('/'),
  expires: z.number().optional(),
  httpOnly: z.boolean().optional(),
  secure: z.boolean().optional(),
  sameSite: z.enum(['Lax', 'Strict', 'None']).optional(),
});

const bodySchema = z.object({
  cookies: z.array(cookieSchema).min(1),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession().catch(() => null);
    const { cookies, userId } = bodySchema.parse(await req.json());
    const effectiveUserId = userId || (session as any)?.user?.id;
    if (!effectiveUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const onlyfans = cookies.filter((c) => c.domain.includes('onlyfans.com'));
    if (!onlyfans.length) return NextResponse.json({ error: 'No onlyfans.com cookies' }, { status: 400 });

    await putEncryptedCookies(effectiveUserId, JSON.stringify(onlyfans));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: 'Invalid cookie payload', details: e.issues }, { status: 400 });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

