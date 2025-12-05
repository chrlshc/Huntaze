/**
 * AI Metrics Dashboard API Endpoint
 * 
 * Returns real-time metrics for both Foundry and Legacy providers.
 * Includes A/B comparison data for canary deployment monitoring.
 * 
 * Requirements: 5.2, 5.5 - Dashboard and A/B comparison
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMetricsCollector } from '@/lib/ai/canary/metrics-collector';
import { getTrafficSplitter } from '@/lib/ai/canary/traffic-splitter';
import { getAIProviderConfig } from '@/lib/ai/config/provider-config';

export const dynamic = 'force-dynamic';

interface MetricsResponse {
  success: boolean;
  data?: {
    config: {
      provider: string;
      canaryPercentage: number;
      fallbackEnabled: boolean;
    };
    traffic: {
      totalRequests: number;
      foundryRequests: number;
      legacyRequests: number;
      actualFoundryPercentage: number;
      targetPercentage: number;
      deviationPercentage: number;
      isHealthy: boolean;
    };
    metrics: {
      foundry: {
        requestCount: number;
        errorCount: number;
        errorRate: number;
        latencyP50: number;
        latencyP95: number;
        latencyP99: number;
        latencyAvg: number;
        totalCostUsd: number;
        avgCostPerRequest: number;
        modelBreakdown: Record<string, {
          model: string;
          requestCount: number;
          avgLatency: number;
          avgCost: number;
          errorRate: number;
        }>;
      };
      legacy: {
        requestCount: number;
        errorCount: number;
        errorRate: number;
        latencyP50: number;
        latencyP95: number;
        latencyP99: number;
        latencyAvg: number;
        totalCostUsd: number;
        avgCostPerRequest: number;
        modelBreakdown: Record<string, {
          model: string;
          requestCount: number;
          avgLatency: number;
          avgCost: number;
          errorRate: number;
        }>;
      };
    };
    comparison: {
      errorRateDiff: number;
      latencyP95Diff: number;
      costDiff: number;
      foundryBetter: boolean;
    };
    window: {
      startAt: string;
      endAt: string;
      durationMs: number;
    };
    health: {
      foundryErrorRateOk: boolean;
      foundryLatencyOk: boolean;
      foundryCostOk: boolean;
      overallHealthy: boolean;
      alerts: string[];
    };
  };
  error?: string;
}

/**
 * GET /api/admin/ai-metrics
 * 
 * Returns comprehensive AI metrics for dashboard display
 */
export async function GET(request: NextRequest): Promise<NextResponse<MetricsResponse>> {
  try {
    // Get configuration
    const config = getAIProviderConfig();
    const trafficSplitter = getTrafficSplitter();
    const metricsCollector = getMetricsCollector();

    // Get traffic metrics
    const trafficMetrics = trafficSplitter.getMetrics();

    // Get comparison metrics
    const comparison = metricsCollector.getComparisonMetrics();

    // Calculate health status
    const alerts: string[] = [];
    const errorThreshold = 0.05; // 5%
    const latencyThreshold = 5000; // 5 seconds
    const costThreshold = 0.10; // $0.10 per request

    const foundryErrorRateOk = comparison.foundry.errorRate <= errorThreshold;
    const foundryLatencyOk = comparison.foundry.latencyP95 <= latencyThreshold;
    const foundryCostOk = comparison.foundry.avgCostPerRequest <= costThreshold;

    if (!foundryErrorRateOk) {
      alerts.push(`Foundry error rate (${(comparison.foundry.errorRate * 100).toFixed(2)}%) exceeds threshold (${errorThreshold * 100}%)`);
    }
    if (!foundryLatencyOk) {
      alerts.push(`Foundry latency p95 (${comparison.foundry.latencyP95.toFixed(0)}ms) exceeds threshold (${latencyThreshold}ms)`);
    }
    if (!foundryCostOk) {
      alerts.push(`Foundry cost ($${comparison.foundry.avgCostPerRequest.toFixed(4)}/req) exceeds threshold ($${costThreshold}/req)`);
    }

    const overallHealthy = foundryErrorRateOk && foundryLatencyOk && foundryCostOk;

    return NextResponse.json({
      success: true,
      data: {
        config: {
          provider: config.getProvider(),
          canaryPercentage: config.getCanaryPercentage(),
          fallbackEnabled: config.isFallbackEnabled(),
        },
        traffic: {
          totalRequests: trafficMetrics.totalRequests,
          foundryRequests: trafficMetrics.foundryRequests,
          legacyRequests: trafficMetrics.legacyRequests,
          actualFoundryPercentage: trafficMetrics.actualFoundryPercentage,
          targetPercentage: trafficMetrics.targetPercentage,
          deviationPercentage: trafficMetrics.deviationPercentage,
          isHealthy: trafficSplitter.isDistributionHealthy(),
        },
        metrics: {
          foundry: comparison.foundry,
          legacy: comparison.legacy,
        },
        comparison: comparison.comparison,
        window: {
          startAt: comparison.window.startAt.toISOString(),
          endAt: comparison.window.endAt.toISOString(),
          durationMs: comparison.window.durationMs,
        },
        health: {
          foundryErrorRateOk,
          foundryLatencyOk,
          foundryCostOk,
          overallHealthy,
          alerts,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching AI metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ai-metrics
 * 
 * Record a new metric (for internal use)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const metricsCollector = getMetricsCollector();

    const {
      requestId,
      correlationId,
      provider,
      model,
      latencyMs,
      costUsd,
      success,
      errorMessage,
      userTier,
      agentType,
    } = body;

    if (success) {
      metricsCollector.recordSuccess({
        requestId,
        correlationId,
        provider,
        model,
        latencyMs,
        costUsd,
        userTier,
        agentType,
      });
    } else {
      metricsCollector.recordFailure({
        requestId,
        correlationId,
        provider,
        model,
        latencyMs,
        costUsd,
        errorMessage: errorMessage || 'Unknown error',
        userTier,
        agentType,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording AI metric:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
