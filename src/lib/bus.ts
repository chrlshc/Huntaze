import Redis from "ioredis";

type Handler = (data: any) => void;

export class Bus {
  private pub: Redis;
  private sub: Redis;

  constructor(url = process.env.REDIS_URL!) {
    this.pub = new Redis(url, { lazyConnect: true, enableOfflineQueue: false, maxRetriesPerRequest: 0, retryStrategy: () => null });
    this.sub = new Redis(url, { lazyConnect: true, enableOfflineQueue: false, maxRetriesPerRequest: 0, retryStrategy: () => null });
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

function createMockBus() {
  const noop = async () => {};
  return {
    publish: noop,
    subscribe: async (_event: string, _onMessage: (data: any) => void) => {
      return async () => {};
    },
  } as unknown as Bus;
}

let _bus: Bus | null = null;
export function getBus(): Bus {
  if (_bus) return _bus;
  if (process.env.BUILD_REDIS_MOCK === '1') {
    _bus = createMockBus();
    return _bus;
  }
  _bus = new Bus();
  return _bus;
}

// Avoid creating a Redis connection at import-time during builds.
// Call getBus() where you need it (e.g., inside route handlers).
