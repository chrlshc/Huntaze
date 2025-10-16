import { promises as fs } from 'fs';
import path from 'path';
import type { EventContext, ExternalPublisher } from '@/src/lib/agents/event-bus';

export interface Outbox {
  persist(ctx: EventContext): Promise<void>;
}

export class FileOutbox implements Outbox {
  private baseDir: string;
  private eventsPath: string;
  private deliveredPath: string;

  constructor(baseDir: string = path.join(process.cwd(), 'artifacts', 'outbox')) {
    this.baseDir = baseDir;
    this.eventsPath = path.join(this.baseDir, 'events.ndjson');
    this.deliveredPath = path.join(this.baseDir, 'delivered.json');
  }

  private async ensure(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true }).catch(() => {});
    try { await fs.access(this.deliveredPath); } catch { await fs.writeFile(this.deliveredPath, '{}', 'utf8'); }
    try { await fs.access(this.eventsPath); } catch { await fs.writeFile(this.eventsPath, '', 'utf8'); }
  }

  async persist(ctx: EventContext): Promise<void> {
    await this.ensure();
    const record = {
      id: ctx.eventId,
      type: ctx.type,
      ts: ctx.ts,
      source: ctx.source ?? 'ai-team',
      payload: ctx.payload ?? null,
    };
    const line = JSON.stringify(record);
    await fs.appendFile(this.eventsPath, line + '\n', 'utf8');
  }

  async readAll(): Promise<Array<{ id: string; type: string; ts: number; source?: string; payload: any }>> {
    await this.ensure();
    const data = await fs.readFile(this.eventsPath, 'utf8');
    const lines = data.split('\n').filter(Boolean);
    const out: Array<{ id: string; type: string; ts: number; source?: string; payload: any }> = [];
    for (const line of lines) {
      try { out.push(JSON.parse(line)); } catch { /* ignore bad line */ }
    }
    return out;
  }

  async readDelivered(): Promise<Record<string, number>> {
    await this.ensure();
    const raw = await fs.readFile(this.deliveredPath, 'utf8');
    try { return JSON.parse(raw) as Record<string, number>; } catch { return {}; }
  }

  async markDelivered(id: string, when: number = Date.now()): Promise<void> {
    const delivered = await this.readDelivered();
    delivered[id] = when;
    await fs.writeFile(this.deliveredPath, JSON.stringify(delivered), 'utf8');
  }
}

export async function replayUndelivered(params: {
  outbox: FileOutbox;
  external: ExternalPublisher;
  limit?: number;
}): Promise<{ attempted: number; delivered: number; remaining: number }> {
  const { outbox, external, limit = 100 } = params;
  const all = await outbox.readAll();
  const deliveredMap = await outbox.readDelivered();
  const undelivered = all.filter((e) => !deliveredMap[e.id]);
  let attempts = 0;
  let delivered = 0;
  for (const evt of undelivered.slice(0, limit)) {
    attempts++;
    try {
      await external.publish({ type: evt.type, source: evt.source, payload: normalizePayload(evt.payload) });
      await outbox.markDelivered(evt.id);
      delivered++;
    } catch (err) {
      // swallow and continue; keep for next replay
      // eslint-disable-next-line no-console
      console.error('[Outbox] replay failed:', err);
    }
  }
  return { attempted: attempts, delivered, remaining: undelivered.length - delivered };
}

function normalizePayload(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return { value: payload as unknown } as Record<string, unknown>;
}

