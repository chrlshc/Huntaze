// Simple in-memory Event Bus with optional external publisher hook and middlewares
// Usage is server-side only (Next.js API routes / server actions)
import { randomUUID } from 'crypto';

export type EventType = string;

export type EventPayload = unknown;

export type EventHandler = (data: any) => void | Promise<void>;

type HandlersMap = Map<EventType, Set<EventHandler>>;

export interface ExternalPublisher {
  publish: (event: { type: EventType; source?: string; payload?: EventPayload }) => Promise<void> | void;
}

export class EventBus {
  private subscribers: HandlersMap = new Map();
  private external?: ExternalPublisher;
  private source?: string;
  private middlewares: Middleware[] = [];

  constructor(opts?: { external?: ExternalPublisher; source?: string }) {
    this.external = opts?.external;
    this.source = opts?.source;
  }

  use(mw: Middleware) {
    this.middlewares.push(mw);
  }

  subscribe(eventType: EventType, handler: EventHandler) {
    const set = this.subscribers.get(eventType) ?? new Set<EventHandler>();
    set.add(handler as EventHandler);
    this.subscribers.set(eventType, set);
    return () => this.unsubscribe(eventType, handler as EventHandler);
  }

  unsubscribe(eventType: EventType, handler: EventHandler) {
    const set = this.subscribers.get(eventType);
    if (set) {
      set.delete(handler as EventHandler);
      if (set.size === 0) this.subscribers.delete(eventType);
    }
  }

  async publish(eventType: EventType, data?: EventPayload) {
    const ctx: EventContext = { type: eventType, eventId: randomUUID(), payload: data, ts: Date.now(), source: this.source };
    const run = async (i: number): Promise<void> => {
      if (i < this.middlewares.length) return this.middlewares[i](ctx, () => run(i + 1));
      // After middlewares, publish externally then fan-out to handlers
      if (this.external) {
        try {
          await this.external.publish({ type: eventType, source: this.source, payload: normalizePayload(data) });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[EventBus] external publish failed:', err);
        }
      }
      const handlers = Array.from(this.subscribers.get(eventType) ?? []);
      for (const h of handlers) {
        try {
          await h(data);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`[EventBus] handler error for ${eventType}:`, err);
        }
      }
    };
    await run(0);
  }
}

// Helper to attach AWS EventBridge publisher if env/config present
export function buildExternalPublisher(source: string): ExternalPublisher | undefined {
  // Import lazily to avoid bundling AWS SDK in client bundles
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@/lib/integration/module-event-bus');
    const publishModuleEvent: (args: {
      source: string;
      type: string;
      payload: Record<string, unknown>;
      onError?: (e: unknown) => void;
    }) => Promise<void> = mod.publishModuleEvent;

    return {
      publish: async ({ type, payload }) => {
        // Only attempt if a bus is configured; module handles errors
        await publishModuleEvent({ source: source as any, type, payload: (payload ?? {}) as Record<string, unknown> });
      },
    } as ExternalPublisher;
  } catch {
    return undefined;
  }
}

function normalizePayload(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return { value: payload as unknown } as Record<string, unknown>;
}

export type EventContext = {
  type: EventType;
  eventId: string;
  payload: unknown;
  ts: number;
  source?: string;
};
export type Middleware = (ctx: EventContext, next: () => Promise<void>) => Promise<void>;
