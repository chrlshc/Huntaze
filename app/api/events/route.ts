import { eventEmitter } from '@/lib/services/eventEmitter'

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Register client
      eventEmitter.addClient(controller);
      // Heartbeat every 30s
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: heartbeat\n\n`));
      }, 30000);

      const abortHandler = () => {
        clearInterval(heartbeat);
        eventEmitter.removeClient(controller);
        try { controller.close(); } catch {}
      };

      req.signal.addEventListener('abort', abortHandler);
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
