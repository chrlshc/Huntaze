/**
 * Cache Warmer Service
 * Pre-populates caches with frequently accessed data
 */

import { cacheManager } from './cacheManager';
import { staticDataCache } from './staticDataCache';

interface WarmupTask {
  name: string;
  priority: number;
  execute: () => Promise<void>;
}

class CacheWarmer {
  private tasks: WarmupTask[] = [];
  private isWarming = false;

  constructor() {
    this.registerTasks();
  }

  private registerTasks() {
    // High priority tasks (critical for landing page)
    this.addTask('landing-page-data', 1, async () => {
      await staticDataCache.getLandingPageData();
    });

    this.addTask('platform-stats', 1, async () => {
      await staticDataCache.getPlatformStats();
    });

    // Medium priority tasks
    this.addTask('testimonials', 2, async () => {
      await staticDataCache.getTestimonials();
    });

    this.addTask('pricing-plans', 2, async () => {
      await staticDataCache.getPricingPlans();
    });

    // Low priority tasks (nice to have)
    this.addTask('health-checks', 3, async () => {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        await Promise.all([
          fetch(`${baseUrl}/api/health/auth`),
          fetch(`${baseUrl}/api/health/database`),
          fetch(`${baseUrl}/api/health/config`),
        ]);
      } catch (error) {
        console.warn('Health check warmup failed:', error);
      }
    });
  }

  private addTask(name: string, priority: number, execute: () => Promise<void>) {
    this.tasks.push({ name, priority, execute });
    // Sort by priority (lower number = higher priority)
    this.tasks.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Warm up all caches
   */
  async warmUp(options: { priority?: number; parallel?: boolean } = {}) {
    if (this.isWarming) {
      console.log('⏳ Cache warming already in progress...');
      return;
    }

    this.isWarming = true;
    const startTime = Date.now();

    try {
      console.log('🔥 Starting cache warmup...');

      // Filter tasks by priority if specified
      const tasksToRun = options.priority 
        ? this.tasks.filter(task => task.priority <= options.priority!)
        : this.tasks;

      if (options.parallel) {
        // Run all tasks in parallel (faster but more resource intensive)
        await Promise.allSettled(
          tasksToRun.map(async (task) => {
            try {
              await task.execute();
              console.log(`✅ Warmed up: ${task.name}`);
            } catch (error) {
              console.error(`❌ Failed to warm up ${task.name}:`, error);
            }
          })
        );
      } else {
        // Run tasks sequentially by priority
        for (const task of tasksToRun) {
          try {
            await task.execute();
            console.log(`✅ Warmed up: ${task.name}`);
          } catch (error) {
            console.error(`❌ Failed to warm up ${task.name}:`, error);
          }
        }
      }

      const duration = Date.now() - startTime;
      console.log(`🎯 Cache warmup completed in ${duration}ms`);
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Warm up critical caches only (for faster startup)
   */
  async warmUpCritical() {
    await this.warmUp({ priority: 1, parallel: true });
  }

  /**
   * Schedule periodic cache warming
   */
  startPeriodicWarmup(intervalMinutes: number = 30) {
    console.log(`⏰ Scheduling cache warmup every ${intervalMinutes} minutes`);
    
    setInterval(async () => {
      console.log('🔄 Periodic cache warmup starting...');
      await this.warmUp({ priority: 2, parallel: true });
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    const health = await cacheManager.healthCheck();
    
    return {
      redis: health.redis,
      memory: health.memory,
      memoryEntries: health.entries,
      isWarming: this.isWarming,
      registeredTasks: this.tasks.length,
      lastWarmup: new Date().toISOString(),
    };
  }
}

export const cacheWarmer = new CacheWarmer();

// Auto-start cache warming on module load (for production)
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  // Warm up critical caches immediately
  cacheWarmer.warmUpCritical().catch(console.error);
  
  // Start periodic warmup
  cacheWarmer.startPeriodicWarmup(30);
}
