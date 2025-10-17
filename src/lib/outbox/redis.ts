import Redis from "ioredis";

export interface OutboxRecord<T = unknown> {
  payload: T;
  at: string; // ISO
}

export class RedisOutbox {
  private redis: Redis;
  private prefix: string;

  constructor(opts?: { url?: string; prefix?: string }) {
    this.redis = new Redis(opts?.url ?? process.env.REDIS_URL!);
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

