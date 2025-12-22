// Simple in-memory cache for Majordome responses
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class MajordomeCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Rate limiting
class RateLimiter {
  private requests = new Map<string, number[]>();
  private readonly WINDOW_SIZE = 60 * 1000; // 1 minute
  private readonly MAX_REQUESTS = 30; // Max 30 requests per minute

  isAllowed(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < this.WINDOW_SIZE);
    
    if (validRequests.length >= this.MAX_REQUESTS) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(userId, validRequests);
    return true;
  }

  getRemainingRequests(userId: string): number {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    const validRequests = userRequests.filter(time => now - time < this.WINDOW_SIZE);
    return Math.max(0, this.MAX_REQUESTS - validRequests.length);
  }
}

export const majordomeCache = new MajordomeCache();
export const rateLimiter = new RateLimiter();

// Cleanup cache every 10 minutes
setInterval(() => majordomeCache.cleanup(), 10 * 60 * 1000);
