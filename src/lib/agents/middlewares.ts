import type { Middleware } from '@/src/lib/agents/event-bus';
import type { Outbox } from '@/src/lib/agents/outbox';
import { sseRegistry } from '@/src/lib/sse/registry';

export const withConsoleLog = (): Middleware => async (ctx, next) => {
  // eslint-disable-next-line no-console
  console.log(`[BUS] ${ctx.type} ${ctx.eventId}`, { ts: ctx.ts });
  await next();
};

export const withOutbox = (outbox: Outbox): Middleware => async (ctx, next) => {
  await outbox.persist(ctx);
  await next();
};

export const withSseFanout = (): Middleware => async (ctx, next) => {
  try {
    const modelId = (ctx.payload as any)?.correlation?.modelId;
    if (modelId) {
      sseRegistry.emit(modelId, { type: ctx.type, eventId: ctx.eventId, payload: ctx.payload, ts: ctx.ts });
    }
  } catch {}
  await next();
};

