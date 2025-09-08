import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { crmData } from '@/lib/services/crmData';

export const runtime = 'nodejs';

async function getUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret');
    const { payload } = await jwtVerify(token, secret);
    return payload.userId as string;
  } catch {
    return null;
  }
}

const noStore = {
  'Cache-Control': 'no-store, no-transform',
};

async function computeUnread(userId: string): Promise<number> {
  const convs = crmData.listConversations(userId);
  let count = 0;
  for (const c of convs) {
    const msgs = crmData.listMessages(userId, c.id);
    count += msgs.filter((m) => m.direction === 'in' && !m.read).length;
  }
  return count;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ count: 0 }, { status: 200 });

    const { searchParams } = new URL(request.url);
    const sse = searchParams.get('sse') === '1';

    if (!sse) {
      const count = await computeUnread(userId);
      return NextResponse.json({ count }, { headers: noStore });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        let stopped = false;
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };
        const tick = async () => {
          if (stopped) return;
          try {
            const count = await computeUnread(userId);
            // Emit as "unread" to match client listener
            send('unread', { count });
          } catch {
            // On error, still emit 0 to keep stream alive
            send('unread', { count: 0 });
          }
        };
        // initial push
        void tick();
        const interval = setInterval(tick, 15000);

        // Close on client abort
        // @ts-ignore - NextRequest extends Request with signal
        request.signal?.addEventListener('abort', () => {
          clearInterval(interval);
          stopped = true;
          try { controller.close(); } catch {}
        });
      },
      cancel() {},
    });

    return new Response(stream, {
      headers: {
        ...noStore,
        'Content-Type': 'text/event-stream; charset=utf-8',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
