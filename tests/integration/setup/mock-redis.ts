/**
 * Mock Redis Client for Integration Tests
 * 
 * Provides in-memory Redis implementation for testing
 */

export class MockRedis {
  private store = new Map<string, { value: any; expiry?: number }>();
  private sortedSets = new Map<string, Map<string, number>>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    
    return typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
  }

  async set(key: string, value: any): Promise<void> {
    this.store.set(key, { value });
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    this.store.set(key, {
      value,
      expiry: Date.now() + ttl * 1000,
    });
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
      if (this.sortedSets.delete(key)) count++;
    }
    return count;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async exists(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.has(key) || this.sortedSets.has(key)) {
        count++;
      }
    }
    return count;
  }

  // Sorted set operations
  async zadd(key: string, score: number, member: string): Promise<number> {
    if (!this.sortedSets.has(key)) {
      this.sortedSets.set(key, new Map());
    }
    const set = this.sortedSets.get(key)!;
    const isNew = !set.has(member);
    set.set(member, score);
    return isNew ? 1 : 0;
  }

  async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
    const set = this.sortedSets.get(key);
    if (!set) return 0;
    
    let count = 0;
    for (const [member, score] of set.entries()) {
      if (score >= min && score <= max) {
        set.delete(member);
        count++;
      }
    }
    
    if (set.size === 0) {
      this.sortedSets.delete(key);
    }
    
    return count;
  }

  async zcard(key: string): Promise<number> {
    const set = this.sortedSets.get(key);
    return set ? set.size : 0;
  }

  async zcount(key: string, min: number, max: number): Promise<number> {
    const set = this.sortedSets.get(key);
    if (!set) return 0;
    
    let count = 0;
    for (const score of set.values()) {
      if (score >= min && score <= max) {
        count++;
      }
    }
    return count;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (item) {
      item.expiry = Date.now() + seconds * 1000;
      return 1;
    }
    
    const set = this.sortedSets.get(key);
    if (set) {
      // For sorted sets, we'll need to track expiry separately
      // This is a simplified implementation
      setTimeout(() => {
        this.sortedSets.delete(key);
      }, seconds * 1000);
      return 1;
    }
    
    return 0;
  }

  multi() {
    const commands: Array<() => Promise<any>> = [];
    
    const multiInstance = {
      zadd: (key: string, score: number, member: string) => {
        commands.push(() => this.zadd(key, score, member));
        return multiInstance;
      },
      zremrangebyscore: (key: string, min: number, max: number) => {
        commands.push(() => this.zremrangebyscore(key, min, max));
        return multiInstance;
      },
      zcard: (key: string) => {
        commands.push(() => this.zcard(key));
        return multiInstance;
      },
      zcount: (key: string, min: number, max: number) => {
        commands.push(() => this.zcount(key, min, max));
        return multiInstance;
      },
      expire: (key: string, seconds: number) => {
        commands.push(() => this.expire(key, seconds));
        return multiInstance;
      },
      set: (key: string, value: any) => {
        commands.push(() => this.set(key, value));
        return multiInstance;
      },
      setex: (key: string, ttl: number, value: string) => {
        commands.push(() => this.setex(key, ttl, value));
        return multiInstance;
      },
      del: (...keys: string[]) => {
        commands.push(() => this.del(...keys));
        return multiInstance;
      },
      exec: async () => {
        const results: any[] = [];
        for (const cmd of commands) {
          results.push(await cmd());
        }
        return results;
      },
    };
    
    return multiInstance;
  }

  // Clear all data
  clear() {
    this.store.clear();
    this.sortedSets.clear();
  }

  // Get all keys (for debugging)
  getAllKeys(): string[] {
    return [
      ...Array.from(this.store.keys()),
      ...Array.from(this.sortedSets.keys()),
    ];
  }

  // Get store size (for debugging)
  size(): number {
    return this.store.size + this.sortedSets.size;
  }
}
