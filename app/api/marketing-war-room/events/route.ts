import { NextRequest } from 'next/server';

/**
 * GET /api/marketing-war-room/events
 * 
 * Server-Sent Events (SSE) endpoint for real-time updates.
 * 
 * Event types:
 * - STATE_PATCH: Partial state update (queue, health, automations, trends)
 * - QUEUE_UPDATED: Full queue array update
 * - HEALTH_UPDATED: Health status update
 * 
 * In production, this would connect to a pub/sub system (Redis, PostgreSQL LISTEN/NOTIFY, etc.)
 * to push real-time updates when job_events are inserted.
 */

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectMsg = JSON.stringify({
        type: 'CONNECTED',
        timestamp: new Date().toISOString(),
      });
      controller.enqueue(encoder.encode(`data: ${connectMsg}\n\n`));
      
      // Heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = JSON.stringify({
            type: 'HEARTBEAT',
            timestamp: new Date().toISOString(),
          });
          controller.enqueue(encoder.encode(`data: ${heartbeat}\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 30000); // Every 30 seconds
      
      // TODO: In production, subscribe to a pub/sub channel here
      // Examples:
      // - Redis: redis.subscribe('war-room-updates')
      // - PostgreSQL: LISTEN war_room_channel
      // - BullMQ: queue.on('completed', ...)
      
      // Demo: Send a simulated update after 5 seconds
      const demoTimeout = setTimeout(() => {
        try {
          const demoUpdate = JSON.stringify({
            type: 'STATE_PATCH',
            payload: {
              health: {
                status: 'secure',
                label: 'Secure',
                details: 'Tokens OK • Quotas OK • Error rate OK • Cadence OK',
                checks: [
                  { key: 'tokens', label: 'Tokens valides', ok: true, detail: 'TikTok + IG' },
                  { key: 'rate', label: 'Rate limits', ok: true, detail: 'Dans les clous' },
                  { key: 'errors', label: 'Taux d\'échec 24h', ok: true, detail: '< 2%' },
                  { key: 'cadence', label: 'Cadence publishing', ok: true, detail: 'Safe ramp' },
                ],
              },
            },
          });
          controller.enqueue(encoder.encode(`data: ${demoUpdate}\n\n`));
        } catch {
          // Connection closed
        }
      }, 5000);
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        clearTimeout(demoTimeout);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

/**
 * Helper function to broadcast events to connected clients.
 * In production, call this from your worker when job status changes.
 * 
 * Usage (in worker):
 * ```
 * import { broadcastEvent } from '@/lib/marketing-war-room/sse';
 * 
 * await broadcastEvent({
 *   type: 'QUEUE_UPDATED',
 *   payload: updatedQueue,
 * });
 * ```
 */
export type SSEEventType = 'STATE_PATCH' | 'QUEUE_UPDATED' | 'HEALTH_UPDATED';

export interface SSEEvent {
  type: SSEEventType;
  payload: unknown;
}

// In production, implement with Redis pub/sub or similar:
// export async function broadcastEvent(event: SSEEvent) {
//   await redis.publish('war-room-updates', JSON.stringify(event));
// }
