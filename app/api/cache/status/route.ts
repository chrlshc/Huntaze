/**
 * Cache Status API
 * Provides cache health and statistics information
 */

import { NextRequest, NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cache/cacheManager';
import { cacheWarmer } from '@/lib/cache/cacheWarmer';

export async function GET(request: NextRequest) {
  try {
    const [cacheHealth, cacheStats] = await Promise.all([
      cacheManager.healthCheck(),
      cacheWarmer.getCacheStats(),
    ]);

    const status = {
      timestamp: new Date().toISOString(),
      health: {
        overall: cacheHealth.redis || cacheHealth.memory ? 'healthy' : 'unhealthy',
        redis: {
          status: cacheHealth.redis ? 'connected' : 'disconnected',
          available: cacheHealth.redis,
        },
        memory: {
          status: cacheHealth.memory ? 'available' : 'unavailable',
          entries: cacheHealth.entries,
        },
      },
      statistics: {
        ...cacheStats,
        uptime: process.uptime(),
      },
      configuration: {
        redisEnabled: !!process.env.REDIS_URL,
        environment: process.env.NODE_ENV,
      },
    };

    return NextResponse.json(status, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Cache status error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get cache status',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'warmup':
        await cacheWarmer.warmUp({ parallel: true });
        return NextResponse.json({ 
          success: true, 
          message: 'Cache warmup initiated' 
        });

      case 'warmup-critical':
        await cacheWarmer.warmUpCritical();
        return NextResponse.json({ 
          success: true, 
          message: 'Critical cache warmup completed' 
        });

      case 'flush':
        await cacheManager.flush();
        return NextResponse.json({ 
          success: true, 
          message: 'Cache flushed successfully' 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Cache action error:', error);
    
    return NextResponse.json(
      { error: 'Failed to execute cache action' },
      { status: 500 }
    );
  }
}