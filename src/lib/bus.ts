import Redis from "ioredis";

type Handler = (data: any) => void;

export class Bus {
  private pub: Redis;
  private sub: Redis;

  constructor(url = process.env.REDIS_URL!) {
    this.pub = new Redis(url);
    this.sub = new Redis(url);
  }

  async publish(event: string, data: any) {
    await this.pub.publish(`bus:${event}`, JSON.stringify(data));
  }

  async subscribe(event: string, onMessage: Handler): Promise<() => Promise<void>> {
    const channel = `bus:${event}`;
    const handler = (ch: string, msg: string) => {
      if (ch === channel) {
        try {
          onMessage(JSON.parse(msg));
        } catch {
          // noop
        }
      }
    };
    await this.sub.subscribe(channel);
    this.sub.on("message", handler);
    return async () => {
      this.sub.off("message", handler);
      await this.sub.unsubscribe(channel);
    };
  }
}

export const bus = new Bus();

