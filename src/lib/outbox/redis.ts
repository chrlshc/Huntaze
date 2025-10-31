import Redis from "ioredis";

export interface OutboxRecord<T = unknown> {
  payload: T;
  at: string; // ISO
}

export class RedisOutbox {
  private redis: Redis;
  private prefix: string;

  constructor(opts?: { url?: string; prefix?: string }) {
    const url = opts?.url ?? process.env.REDIS_URL;
    const commonOpts = { lazyConnect: true, enableOfflineQueue: false, maxRetriesPerRequest: 0, retryStrategy: () => null } as const;
    // Avoid connecting during build/import time. If URL is provided, pass it; otherwise rely on options-only ctor.
    this.redis = url ? new Redis(url, commonOpts) : new Redis(commonOpts as any);
    this.redis.on('error', (e) => { try { console.error('Redis error', (e as any)?.message || e) } catch {} });
    this.prefix = opts?.prefix ?? "outbox:processed";
  }

  private k(key: string) {
    return `${this.prefix}:${key}`;
  }

  async isProcessed(key: string): Promise<boolean> {
    return (await this.redis.exists(this.k(key))) === 1;
  }

  async markProcessed<T = unknown>(key: string, payload: T, ttlSec = 7 * 24 * 3600): Promise<boolean> {
    const value: OutboxRecord<T> = { payload, at: new Date().toISOString() };
    const res = await this.redis.set(this.k(key), JSON.stringify(value), "NX", "EX", ttlSec);
    return res === "OK";
  }

  async get<T = unknown>(key: string): Promise<OutboxRecord<T> | null> {
    const v = await this.redis.get(this.k(key));
    return v ? (JSON.parse(v) as OutboxRecord<T>) : null;
  }
}
