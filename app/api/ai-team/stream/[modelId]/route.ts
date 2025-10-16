export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { sseRegistry } from '@/src/lib/sse/registry';

const encoder = new TextEncoder();

export async function GET(request: NextRequest, { params }: { params: { modelId: string } }) {
  const { modelId } = params;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const sink = (data: any) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      const unsubscribe = sseRegistry.subscribe(modelId, sink);

      // initial ready ping
      sink({ type: 'ready', modelId, ts: Date.now() });

      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(`: hb ${Date.now()}\n\n`)); } catch {}
      }, 20_000);

      const abortHandler = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try { controller.close(); } catch {}
      };
      request.signal.addEventListener('abort', abortHandler);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
