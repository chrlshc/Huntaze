import { NextRequest } from 'next/server';
import { getServerAuth } from '@/lib/server-auth';
import { withErrorHandling } from '@/src/lib/http/errors';

// SSE Event types for Content Creation
export interface ContentCreationEvent {
  id: string;
  type: 'asset_uploaded' | 'asset_processed' | 'asset_updated' | 'asset_deleted' |
        'schedule_updated' | 'schedule_deleted' |
        'campaign_created' | 'campaign_updated' | 'campaign_metrics' | 'campaign_status' |
        'compliance_checked' | 'ai_insight' | 'ai_recommendation' | 'sync_conflict';
  data: any;
  timestamp: string;
  userId: string;
}

// In-memory store for SSE connections (in production, use Redis)
const connections = new Map<string, {
  controller: ReadableStreamDefaultController;
  userId: string;
  lastEventId?: string;
}>();

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const auth = await getServerAuth();
    if (!auth.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const url = new URL(request.url);
    const lastEventId = url.searchParams.get('lastEventId');
    const connectionId = `${auth.user.id}-${Date.now()}`;

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        // Store connection
        connections.set(connectionId, {
          controller,
          userId: auth.user.id,
          lastEventId: lastEventId || undefined,
        });

        // Send initial connection event
        const connectEvent = {
          id: `connect-${Date.now()}`,
          type: 'connected' as const,
          data: { connectionId, timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString(),
          userId: auth.user.id,
        };

        controller.enqueue(`data: ${JSON.stringify(connectEvent)}\n\n`);

        // Send missed events if lastEventId is provided
        if (lastEventId) {
          sendMissedEvents(controller, auth.user.id, lastEventId);
        }

        // Keep connection alive with heartbeat
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`);
          } catch (error) {
            clearInterval(heartbeat);
            connections.delete(connectionId);
          }
        }, 30000); // 30 seconds

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          connections.delete(connectionId);
          try {
            controller.close();
          } catch (error) {
            // Connection already closed
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  });
}

// Function to broadcast events to specific user
export function broadcastToUser(userId: string, event: Omit<ContentCreationEvent, 'userId'>) {
  const userConnections = Array.from(connections.entries())
    .filter(([_, conn]) => conn.userId === userId);

  const fullEvent: ContentCreationEvent = {
    ...event,
    userId,
  };

  userConnections.forEach(([connectionId, connection]) => {
    try {
      connection.controller.enqueue(`id: ${event.id}\n`);
      connection.controller.enqueue(`event: ${event.type}\n`);
      connection.controller.enqueue(`data: ${JSON.stringify(fullEvent)}\n\n`);
    } catch (error) {
      // Connection closed, remove it
      connections.delete(connectionId);
    }
  });

  // Store event for replay (in production, use Redis with TTL)
  storeEventForReplay(userId, fullEvent);
}

// Function to broadcast to all users (for system-wide events)
export function broadcastToAll(event: Omit<ContentCreationEvent, 'userId'>) {
  connections.forEach((connection, connectionId) => {
    const fullEvent: ContentCreationEvent = {
      ...event,
      userId: connection.userId,
    };

    try {
      connection.controller.enqueue(`id: ${event.id}\n`);
      connection.controller.enqueue(`event: ${event.type}\n`);
      connection.controller.enqueue(`data: ${JSON.stringify(fullEvent)}\n\n`);
    } catch (error) {
      connections.delete(connectionId);
    }
  });
}

// In-memory event store (use Redis in production)
const eventStore = new Map<string, ContentCreationEvent[]>();

function storeEventForReplay(userId: string, event: ContentCreationEvent) {
  if (!eventStore.has(userId)) {
    eventStore.set(userId, []);
  }
  
  const userEvents = eventStore.get(userId)!;
  userEvents.push(event);
  
  // Keep only last 100 events per user
  if (userEvents.length > 100) {
    userEvents.splice(0, userEvents.length - 100);
  }
}

function sendMissedEvents(
  controller: ReadableStreamDefaultController,
  userId: string,
  lastEventId: string
) {
  const userEvents = eventStore.get(userId) || [];
  const lastEventIndex = userEvents.findIndex(event => event.id === lastEventId);
  
  if (lastEventIndex !== -1) {
    const missedEvents = userEvents.slice(lastEventIndex + 1);
    
    missedEvents.forEach(event => {
      try {
        controller.enqueue(`id: ${event.id}\n`);
        controller.enqueue(`event: ${event.type}\n`);
        controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
      } catch (error) {
        // Connection closed
      }
    });
  }
}

// Utility function to get connection count
export function getConnectionCount(): number {
  return connections.size;
}

// Utility function to get connections for a user
export function getUserConnectionCount(userId: string): number {
  return Array.from(connections.values())
    .filter(conn => conn.userId === userId).length;
}