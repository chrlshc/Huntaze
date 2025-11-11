import Redis from "ioredis";

export interface OutboxRecord<T = unknown> {
  payload: T;
  at: string; // ISO
}

export class RedisOutbox {
  private redis: Redis | null = null;
  private memory: Map<string, string> | null = null;
  private prefix: string;

  constructor(opts?: { url?: string; prefix?: string }) {
    this.prefix = opts?.prefix ?? "outbox:processed";
    const useMock = process.env.BUILD_REDIS_MOCK === '1';
    const url = opts?.url ?? process.env.REDIS_URL;
    if (useMock || !url) {
      this.memory = new Map<string, string>();
      return;
    }
    const commonOpts = { lazyConnect: true, enableOfflineQueue: false, maxRetriesPerRequest: 0, retryStrategy: () => null } as const;
    this.redis = new Redis(url, commonOpts);
    this.redis.on('error', (e) => { try { console.error('Redis error', (e as any)?.message || e) } catch {} });
  }

  private k(key: string) {
    return `${this.prefix}:${key}`;
  }

  async isProcessed(key: string): Promise<boolean> {
    if (this.memory) return this.memory.has(this.k(key));
    return (await this.redis!.exists(this.k(key))) === 1;
  }

  async markProcessed<T = unknown>(key: string, payload: T, ttlSec = 7 * 24 * 3600): Promise<boolean> {
    const value: OutboxRecord<T> = { payload, at: new Date().toISOString() };
    const k = this.k(key);
    if (this.memory) {
      if (this.memory.has(k)) return false;
      this.memory.set(k, JSON.stringify(value));
      // TTL best-effort in memory
      setTimeout(() => { this.memory!.delete(k); }, ttlSec * 1000).unref?.();
      return true;
    }
    const res = await (this.redis as any).set(k, JSON.stringify(value), "NX", "EX", ttlSec);
    return res === "OK";
  }

  async get<T = unknown>(key: string): Promise<OutboxRecord<T> | null> {
    if (this.memory) {
      const v = this.memory.get(this.k(key));
      return v ? (JSON.parse(v) as OutboxRecord<T>) : null;
    }
    const v = await this.redis!.get(this.k(key));
    return v ? (JSON.parse(v) as OutboxRecord<T>) : null;
  }
}
