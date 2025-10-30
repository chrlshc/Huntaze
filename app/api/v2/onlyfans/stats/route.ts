/**
 * OnlyFans Service Statistics API
 * 
 * API pour obtenir les statistiques du service OnlyFans:
 * - Rate limiting stats
 * - Queue stats  
 * - Performance metrics
 * - Health status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEnhancedOnlyFansService } from '@/lib/services/enhanced-onlyfans-service';
import { getEnhancedRateLimiter } from '@/lib/services/enhanced-rate-limiter';
import { getIntelligentQueueManager } from '@/lib/services/intelligent-queue-manager';

/**
 * GET /api/v2/onlyfans/stats
 * Obtient les statistiques complètes du service OnlyFans
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const detailed = searchParams.get('detailed') === 'true';
    
    const onlyFansService = await getEnhancedOnlyFansService();
    
    // Obtenir les stats du service
    const serviceStats = await onlyFansService.getServiceStats();
    
    let detailedStats = {};
    
    if (detailed) {
      const [rateLimiter, queueManager] = await Promise.all([
        getEnhancedRateLimiter(),
        getIntelligentQueueManager()
      ]);
      
      // Stats détaillées si demandées
      const [globalRateStats, queueStats] = await Promise.all([
        rateLimiter.getGlobalStats(),
        queueManager.getQueueStats()
      ]);
      
      detailedStats = {
        globalRateLimiting: globalRateStats,
        detailedQueue: queueStats
      };
      
      // Stats utilisateur spécifique si fourni
      if (userId) {
        const userRateStats = await rateLimiter.getRateLimitStats(userId);
        detailedStats.userSpecific = {
          userId,
          rateLimiting: userRateStats
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        service: serviceStats,
        ...detailedStats,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[OnlyFans Stats API] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get statistics'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/onlyfans/health
 * Health check du service OnlyFans complet
 */
export async function POST(request: NextRequest) {
  try {
    const onlyFansService = await getEnhancedOnlyFansService();
    const health = await onlyFansService.healthCheck();
    
    const isHealthy = health.overall;
    
    return NextResponse.json({
      success: true,
      healthy: isHealthy,
      services: health,
      timestamp: new Date().toISOString()
    }, {
      status: isHealthy ? 200 : 503
    });
    
  } catch (error) {
    console.error('[OnlyFans Health API] Error:', error);
    
    return NextResponse.json({
      success: false,
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, {
      status: 503
    });
  }
}