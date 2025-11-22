/**
 * Admin AI Cost Monitoring Dashboard API
 * 
 * GET /api/admin/ai-costs
 * 
 * Provides comprehensive AI usage cost monitoring across all creators with:
 * - Automatic retry logic with exponential backoff
 * - Structured error handling with correlation IDs
 * - Performance monitoring and logging
 * - CSV export functionality
 * - Anomaly detection
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 * 
 * @endpoint GET /api/admin/ai-costs
 * @authentication Required (Admin only)
 * @rateLimit Standard rate limiting applies
 * 
 * @queryParams
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - creatorId: Filter by specific creator (optional)
 * - feature: Filter by feature (optional)
 * - format: 'json' | 'csv' (default: 'json')
 * - limit: Number of top creators to return (default: 100)
 * 
 * @responseBody Success (200)
 * {
 *   success: true,
 *   data: {
 *     totalSpending: { costUsd: number, tokensInput: number, tokensOutput: number },
 *     perCreatorBreakdown: Array<CreatorCostBreakdown>,
 *     highCostCreators: Array<CreatorCostBreakdown>,
 *     anomalies: Array<Anomaly>
 *   },
 *   metadata: {
 *     period: { start: string, end: string },
 *     filters: { creatorId: string, feature: string },
 *     recordCount: number
 *   },
 *   duration: number
 * }
 * 
 * @responseBody Error (401/400/500/503)
 * {
 *   success: false,
 *   error: string,
 *   code: string,
 *   correlationId: string,
 *   retryable?: boolean
 * }
 * 
 * @see app/api/admin/ai-costs/README.md
 * @see tests/integration/api/admin-ai-costs.integration.test.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createLogger } from '@/lib/utils/logger';
import { getServerSession } from '@/lib/auth';
import { isAdmin } from '@/lib/auth/admin';
import type {
  AICostsResponse,
  AICostsErrorResponse,
  CreatorCostBreakdown,
  Anomaly,
  TotalSpending,
} from './types';

// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const logger = createLogger('admin-ai-costs-api');

// ============================================================================
// Configuration & Constants
// ============================================================================

const REQUEST_TIMEOUT_MS = 30000; // 30 seconds
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000;

// ============================================================================
// Retry Configuration
// ============================================================================

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 2000,
  backoffFactor: 2,
  retryableErrors: [
    'P2024', // Prisma: Timed out fetching a new connection
    'P2034', // Prisma: Transaction failed due to a write conflict
    'P1001', // Prisma: Can't reach database server
    'P1002', // Prisma: Database server timeout
    'P1008', // Prisma: Operations timed out
    'P1017', // Prisma: Server closed the connection
  ],
};

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRY_CONFIG.retryableErrors.includes(error.code);
  }

  // Network errors
  if (error.code) {
    const networkErrors = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH'];
    return networkErrors.includes(error.code);
  }

  return false;
}

/**
 * Retry database operation with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  correlationId: string,
  attempt = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const retryable = isRetryableError(error);

    if (!retryable || attempt >= RETRY_CONFIG.maxRetries) {
      throw error;
    }

    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
      RETRY_CONFIG.maxDelay
    );

    logger.warn('Retrying database operation', {
      correlationId,
      attempt,
      delay,
      error: error.message,
      errorCode: error.code,
    });

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, correlationId, attempt + 1);
  }
}

/**
 * GET /api/admin/ai-costs
 * 
 * Query parameters:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - creatorId: Filter by specific creator (optional)
 * - feature: Filter by feature (optional)
 * - format: 'json' | 'csv' (default: 'json')
 * - limit: Number of top creators to return (default: 100)
 * 
 * Returns:
 * - totalSpending: Total AI costs across all creators
 * - perCreatorBreakdown: Array of creator spending with feature breakdown
 * - highCostCreators: Ranked list of creators by spending
 * - anomalies: Detected unusual spending patterns
 */
export async function GET(request: NextRequest): Promise<NextResponse<AICostsResponse | AICostsErrorResponse>> {
  const correlationId = `ai-costs-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const startTime = Date.now();

  try {
    logger.info('AI costs request received', { correlationId });

    // 1. Authentication check (Admin only)
    const session = await getServerSession();
    if (!session?.user?.id) {
      logger.warn('Unauthorized access attempt - no session', { correlationId });
      
      return NextResponse.json<AICostsErrorResponse>(
        {
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
          correlationId,
          retryable: false,
        },
        { 
          status: 401,
          headers: {
            'X-Correlation-Id': correlationId,
          },
        }
      );
    }

    // 2. Admin role check
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      logger.warn('Non-admin access attempt', { 
        correlationId, 
        userId: session.user.id,
        email: session.user.email,
      });
      
      return NextResponse.json<AICostsErrorResponse>(
        {
          success: false,
          error: 'Admin access required. This endpoint is restricted to administrators only.',
          code: 'FORBIDDEN',
          correlationId,
          retryable: false,
        },
        { 
          status: 403,
          headers: {
            'X-Correlation-Id': correlationId,
          },
        }
      );
    }

    logger.info('Admin access granted', {
      correlationId,
      userId: session.user.id,
      email: session.user.email,
    });

    // 3. Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const creatorIdParam = searchParams.get('creatorId');
    const feature = searchParams.get('feature');
    const format = searchParams.get('format') || 'json';
    const limitParam = searchParams.get('limit');

    // Validate format
    if (format !== 'json' && format !== 'csv') {
      logger.warn('Invalid format parameter', { correlationId, format });
      
      return NextResponse.json<AICostsErrorResponse>(
        {
          success: false,
          error: 'Invalid format. Must be "json" or "csv"',
          code: 'INVALID_FORMAT',
          correlationId,
          retryable: false,
        },
        { 
          status: 400,
          headers: {
            'X-Correlation-Id': correlationId,
          },
        }
      );
    }

    // Validate and parse dates
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateParam) {
      startDate = new Date(startDateParam);
      if (isNaN(startDate.getTime())) {
        logger.warn('Invalid startDate parameter', { correlationId, startDateParam });
        
        return NextResponse.json<AICostsErrorResponse>(
          {
            success: false,
            error: 'Invalid startDate format. Use ISO 8601 format',
            code: 'INVALID_START_DATE',
            correlationId,
            retryable: false,
          },
          { 
            status: 400,
            headers: {
              'X-Correlation-Id': correlationId,
            },
          }
        );
      }
    }

    if (endDateParam) {
      endDate = new Date(endDateParam);
      if (isNaN(endDate.getTime())) {
        logger.warn('Invalid endDate parameter', { correlationId, endDateParam });
        
        return NextResponse.json<AICostsErrorResponse>(
          {
            success: false,
            error: 'Invalid endDate format. Use ISO 8601 format',
            code: 'INVALID_END_DATE',
            correlationId,
            retryable: false,
          },
          { 
            status: 400,
            headers: {
              'X-Correlation-Id': correlationId,
            },
          }
        );
      }
    }

    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      logger.warn('Invalid date range', { correlationId, startDate, endDate });
      
      return NextResponse.json<AICostsErrorResponse>(
        {
          success: false,
          error: 'startDate must be before endDate',
          code: 'INVALID_DATE_RANGE',
          correlationId,
          retryable: false,
        },
        { 
          status: 400,
          headers: {
            'X-Correlation-Id': correlationId,
          },
        }
      );
    }

    // Validate and parse creatorId
    let creatorId: number | undefined;
    if (creatorIdParam) {
      creatorId = parseInt(creatorIdParam, 10);
      if (isNaN(creatorId) || creatorId <= 0) {
        logger.warn('Invalid creatorId parameter', { correlationId, creatorIdParam });
        
        return NextResponse.json<AICostsErrorResponse>(
          {
            success: false,
            error: 'Invalid creatorId. Must be a positive integer',
            code: 'INVALID_CREATOR_ID',
            correlationId,
            retryable: false,
          },
          { 
            status: 400,
            headers: {
              'X-Correlation-Id': correlationId,
            },
          }
        );
      }
    }

    // Validate and parse limit
    let limit = DEFAULT_LIMIT;
    if (limitParam) {
      limit = parseInt(limitParam, 10);
      if (isNaN(limit) || limit <= 0) {
        logger.warn('Invalid limit parameter', { correlationId, limitParam });
        
        return NextResponse.json<AICostsErrorResponse>(
          {
            success: false,
            error: 'Invalid limit. Must be a positive integer',
            code: 'INVALID_LIMIT',
            correlationId,
            retryable: false,
          },
          { 
            status: 400,
            headers: {
              'X-Correlation-Id': correlationId,
            },
          }
        );
      }
      
      if (limit > MAX_LIMIT) {
        logger.warn('Limit exceeds maximum', { correlationId, limit, maxLimit: MAX_LIMIT });
        limit = MAX_LIMIT;
      }
    }

    // Build where clause
    const where: any = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    
    if (creatorId) {
      where.creatorId = parseInt(creatorId);
    }
    
    if (feature) {
      where.feature = feature;
    }

    // 4. Fetch data with retry logic (Requirement 8.1, 8.2)
    logger.info('Fetching AI cost data', {
      correlationId,
      filters: { startDate, endDate, creatorId, feature },
      limit,
    });

    let totalSpendingResult;
    let perCreatorLogs;

    try {
      // Fetch total spending with retry
      totalSpendingResult = await retryWithBackoff(
        async () => {
          return await prisma.usageLog.aggregate({
            where,
            _sum: {
              costUsd: true,
              tokensInput: true,
              tokensOutput: true,
            },
          });
        },
        correlationId
      );

      // Fetch per-creator logs with retry
      perCreatorLogs = await retryWithBackoff(
        async () => {
          return await prisma.usageLog.findMany({
            where,
            select: {
              creatorId: true,
              feature: true,
              agentId: true,
              costUsd: true,
              tokensInput: true,
              tokensOutput: true,
              creator: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          });
        },
        correlationId
      );
    } catch (dbError: any) {
      logger.error('Database error fetching AI costs', dbError, {
        correlationId,
        duration: Date.now() - startTime,
        errorCode: dbError.code,
      });

      return NextResponse.json<AICostsErrorResponse>(
        {
          success: false,
          error: 'Service temporarily unavailable. Please try again.',
          code: 'DATABASE_ERROR',
          correlationId,
          retryable: true,
        },
        {
          status: 503,
          headers: {
            'X-Correlation-Id': correlationId,
            'Retry-After': '60',
          },
        }
      );
    }

    const totalSpending: TotalSpending = {
      costUsd: Number(totalSpendingResult._sum.costUsd ?? 0),
      tokensInput: totalSpendingResult._sum.tokensInput ?? 0,
      tokensOutput: totalSpendingResult._sum.tokensOutput ?? 0,
    };

    // 5. Aggregate data by creator (Requirement 8.2)
    logger.info('Aggregating cost data', {
      correlationId,
      recordCount: perCreatorLogs.length,
    });

    const creatorMap = new Map<number, CreatorCostBreakdown>();

    for (const log of perCreatorLogs) {
      if (!creatorMap.has(log.creatorId)) {
        creatorMap.set(log.creatorId, {
          creatorId: log.creatorId,
          email: log.creator.email,
          name: log.creator.name,
          totalCost: 0,
          totalTokens: 0,
          byFeature: {},
          byAgent: {},
        });
      }

      const creator = creatorMap.get(log.creatorId)!;
      const cost = Number(log.costUsd);
      const tokens = log.tokensInput + log.tokensOutput;

      creator.totalCost += cost;
      creator.totalTokens += tokens;

      // Aggregate by feature
      if (!creator.byFeature[log.feature]) {
        creator.byFeature[log.feature] = { cost: 0, tokens: 0 };
      }
      creator.byFeature[log.feature].cost += cost;
      creator.byFeature[log.feature].tokens += tokens;

      // Aggregate by agent
      if (log.agentId) {
        if (!creator.byAgent[log.agentId]) {
          creator.byAgent[log.agentId] = { cost: 0, tokens: 0 };
        }
        creator.byAgent[log.agentId].cost += cost;
        creator.byAgent[log.agentId].tokens += tokens;
      }
    }

    const perCreatorBreakdown = Array.from(creatorMap.values());

    // 6. Rank high-cost creators (Requirement 8.3)
    const highCostCreators = [...perCreatorBreakdown]
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, limit);

    logger.info('High-cost creators identified', {
      correlationId,
      topCreatorCount: highCostCreators.length,
      topCreatorCost: highCostCreators[0]?.totalCost || 0,
    });

    // 7. Detect anomalies (Requirement 8.4)
    const anomalies = detectAnomalies(perCreatorBreakdown);

    logger.info('Anomaly detection completed', {
      correlationId,
      anomalyCount: anomalies.length,
      highSeverityCount: anomalies.filter(a => a.severity === 'high').length,
    });

    const duration = Date.now() - startTime;

    // 8. Build response
    const responseData: AICostsResponse = {
      success: true,
      data: {
        totalSpending,
        perCreatorBreakdown,
        highCostCreators,
        anomalies,
      },
      metadata: {
        period: {
          start: startDate?.toISOString() || 'all time',
          end: endDate?.toISOString() || 'now',
        },
        filters: {
          creatorId: creatorId?.toString() || 'all',
          feature: feature || 'all',
        },
        recordCount: perCreatorLogs.length,
      },
      duration,
    };

    // 9. CSV export (Requirement 8.5)
    if (format === 'csv') {
      logger.info('Generating CSV export', {
        correlationId,
        creatorCount: perCreatorBreakdown.length,
      });

      const csv = generateCSV(perCreatorBreakdown);
      
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="ai-costs-${new Date().toISOString()}.csv"`,
          'X-Correlation-Id': correlationId,
          'X-Duration-Ms': duration.toString(),
        },
      });
    }

    // 10. Return JSON response
    logger.info('AI costs fetched successfully', {
      correlationId,
      totalCost: totalSpending.costUsd,
      creatorCount: perCreatorBreakdown.length,
      anomalyCount: anomalies.length,
      duration,
    });

    return NextResponse.json<AICostsResponse>(responseData, {
      status: 200,
      headers: {
        'X-Correlation-Id': correlationId,
        'X-Duration-Ms': duration.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Handle timeout errors
    if (error.message === 'Request timeout') {
      logger.error('Request timeout', error, {
        correlationId,
        duration,
        timeout: REQUEST_TIMEOUT_MS,
      });

      return NextResponse.json<AICostsErrorResponse>(
        {
          success: false,
          error: 'Request timed out. Please try again with a smaller date range.',
          code: 'TIMEOUT_ERROR',
          correlationId,
          retryable: true,
        },
        {
          status: 504,
          headers: {
            'X-Correlation-Id': correlationId,
            'Retry-After': '10',
          },
        }
      );
    }

    // Handle unexpected errors
    logger.error('Unexpected error fetching AI costs', error, {
      correlationId,
      duration,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack?.substring(0, 500),
    });

    return NextResponse.json<AICostsErrorResponse>(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
        code: 'INTERNAL_ERROR',
        correlationId,
        retryable: true,
      },
      {
        status: 500,
        headers: {
          'X-Correlation-Id': correlationId,
          'Retry-After': '10',
        },
      }
    );
  }
}

/**
 * Detect anomalies in spending patterns
 * Requirement 8.3: Add anomaly detection alerts
 */
function detectAnomalies(creators: Array<{
  creatorId: number;
  email: string;
  totalCost: number;
  totalTokens: number;
  byFeature: Record<string, { cost: number; tokens: number }>;
}>) {
  const anomalies: Array<{
    type: string;
    creatorId: number;
    email: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }> = [];

  if (creators.length === 0) return anomalies;

  // Calculate average cost
  const avgCost = creators.reduce((sum, c) => sum + c.totalCost, 0) / creators.length;
  const stdDev = Math.sqrt(
    creators.reduce((sum, c) => sum + Math.pow(c.totalCost - avgCost, 2), 0) / creators.length
  );

  // Detect creators with spending > 2 standard deviations above mean
  for (const creator of creators) {
    if (creator.totalCost > avgCost + 2 * stdDev && creator.totalCost > 10) {
      anomalies.push({
        type: 'high_spending',
        creatorId: creator.creatorId,
        email: creator.email,
        message: `Spending $${creator.totalCost.toFixed(2)} is significantly above average ($${avgCost.toFixed(2)})`,
        severity: creator.totalCost > avgCost + 3 * stdDev ? 'high' : 'medium',
      });
    }

    // Detect unusual feature distribution (one feature > 80% of total)
    for (const [feature, stats] of Object.entries(creator.byFeature)) {
      const percentage = (stats.cost / creator.totalCost) * 100;
      if (percentage > 80 && creator.totalCost > 5) {
        anomalies.push({
          type: 'feature_concentration',
          creatorId: creator.creatorId,
          email: creator.email,
          message: `${percentage.toFixed(0)}% of spending on ${feature} feature`,
          severity: 'low',
        });
      }
    }
  }

  return anomalies;
}

/**
 * Generate CSV export
 * Requirement 8.5: Implement CSV export functionality
 */
function generateCSV(creators: Array<{
  creatorId: number;
  email: string;
  name: string | null;
  totalCost: number;
  totalTokens: number;
  byFeature: Record<string, { cost: number; tokens: number }>;
  byAgent: Record<string, { cost: number; tokens: number }>;
}>) {
  const headers = [
    'Creator ID',
    'Email',
    'Name',
    'Total Cost (USD)',
    'Total Tokens',
    'Features',
    'Agents',
  ];

  const rows = creators.map(creator => [
    creator.creatorId,
    creator.email,
    creator.name || '',
    creator.totalCost.toFixed(6),
    creator.totalTokens,
    Object.entries(creator.byFeature)
      .map(([f, s]) => `${f}:$${s.cost.toFixed(2)}`)
      .join('; '),
    Object.entries(creator.byAgent)
      .map(([a, s]) => `${a}:$${s.cost.toFixed(2)}`)
      .join('; '),
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
}
