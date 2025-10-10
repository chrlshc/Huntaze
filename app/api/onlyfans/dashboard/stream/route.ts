export const runtime = 'nodejs';

import { NextRequest } from 'next/server';

import { getDashboardSnapshot, subscribeToDashboard } from '@/lib/of/dashboard-service';
import { toDashboardActionListDTO, toDashboardPayload } from '@/lib/of/dashboard-formatters';

const encoder = new TextEncoder();

function enqueueEvent(controller: ReadableStreamDefaultController<Uint8Array>, event: string, data: unknown) {
  controller.enqueue(
    encoder.encode(`event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`),
  );
}

export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get('accountId') ?? 'demo-account';

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const initialSnapshot = await getDashboardSnapshot(accountId);
        enqueueEvent(controller, 'snapshot', toDashboardPayload(initialSnapshot));
      } catch (error) {
        enqueueEvent(controller, 'error', { message: 'Failed to load dashboard snapshot', error: `${error}` });
      }

      const unsubscribe = subscribeToDashboard(accountId, (event) => {
        switch (event.type) {
          case 'snapshot': {
            enqueueEvent(controller, 'snapshot', toDashboardPayload(event.payload));
            return;
          }
          case 'actionList': {
            enqueueEvent(controller, 'actionList', toDashboardActionListDTO(event.payload));
            return;
          }
          case 'summary': {
            enqueueEvent(controller, 'summary', event.payload);
            return;
          }
          case 'signals': {
            enqueueEvent(controller, 'signals', event.payload);
            return;
          }
          case 'insights': {
            enqueueEvent(controller, 'insights', event.payload);
            return;
          }
          case 'bestTimes': {
            enqueueEvent(controller, 'bestTimes', event.payload);
            return;
          }
          default:
            return;
        }
      });

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
      }, 30_000);

      const abortHandler = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // ignore
        }
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

