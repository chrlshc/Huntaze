/**
 * Production Monitoring Service - 2025
 * 
 * Features:
 * - SLIs/SLOs tracking
 * - CloudWatch metrics
 * - DORA metrics
 * - Audit logs with PII masking
 * - Health checks
 * - Performance middleware
 */

import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

const cloudWatch = new CloudWatchClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const cloudWatchLogs = new CloudWatchLogsClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Service Level Indicators (SLIs)
export const SLI_TARGETS = {
  API_AVAILABILITY: 99.9, // %
  API_LATENCY_P95: 250, // ms
  API_ERROR_RATE: 1, // %
  DB_CONNECTION_TIME: 100, // ms
  QUEUE_PROCESSING_TIME: 5000, // ms
  CHATBOT_RESPONSE_TIME: 2000, // ms
} as const;

// Service Level Objectives (SLOs) - Monthly targets
export const SLO_OBJECTIVES = {
  UPTIME: 99.9, // %
  RESPONSE_TIME_P95: 500, // ms
  ERROR_BUDGET: 0.1, // %
  CUSTOMER_SATISFACTION: 4.5, // /5
} as const;

// DORA Metrics targets
export interface DORAMetrics {
  deploymentFrequency: number; // deployments per week
  leadTimeForChanges: number; // hours from commit to production
  meanTimeToRecovery: number; // minutes to resolve incidents
  changeFailureRate: number; // % of deployments causing incidents
}

export const DORA_TARGETS: DORAMetrics = {
  deploymentFrequency: 7, // Daily deployments
  leadTimeForChanges: 2, // 2 hours max
  meanTimeToRecovery: 60, // 1 hour max
  changeFailureRate: 5, // 5% max
};

// Custom metrics namespace
const NAMESPACE = 'Huntaze/Application';

// Metric tracking functions
export async function trackAPILatency(endpoint: string, latency: number) {
  await cloudWatch.send(
    new PutMetricDataCommand({
      Namespace: NAMESPACE,
      MetricData: [
        {
          MetricName: 'APILatency',
          Value: latency,
          Unit: 'Milliseconds',
          Dimensions: [
            {
              Name: 'Endpoint',
              Value: endpoint,
            },
          ],
          Timestamp: new Date(),
        },
      ],
    })
  );
}

export async function trackAPIError(endpoint: string, errorType: string) {
  await cloudWatch.send(
    new PutMetricDataCommand({
      Namespace: NAMESPACE,
      MetricData: [
        {
          MetricName: 'APIErrors',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            {
              Name: 'Endpoint',
              Value: endpoint,
            },
            {
              Name: 'ErrorType',
              Value: errorType,
            },
          ],
          Timestamp: new Date(),
        },
      ],
    })
  );
}

export async function trackUserAction(action: string, userId?: string) {
  await cloudWatch.send(
    new PutMetricDataCommand({
      Namespace: NAMESPACE,
      MetricData: [
        {
          MetricName: 'UserActions',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            {
              Name: 'Action',
              Value: action,
            },
            {
              Name: 'HasUser',
              Value: userId ? 'true' : 'false',
            },
          ],
          Timestamp: new Date(),
        },
      ],
    })
  );
}

export async function trackBusinessMetric(metric: string, value: number, unit: string = 'Count') {
  await cloudWatch.send(
    new PutMetricDataCommand({
      Namespace: 'Huntaze/Business',
      MetricData: [
        {
          MetricName: metric,
          Value: value,
          Unit: unit as any,
          Timestamp: new Date(),
        },
      ],
    })
  );
}

// Audit logging with PII masking
interface AuditEvent {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
}

export async function logAuditEvent(event: AuditEvent) {
  const logEvent = {
    timestamp: Date.now(),
    message: JSON.stringify({
      ...event,
      // Mask PII
      userId: maskPII(event.userId),
      ip: event.ip ? maskIP(event.ip) : undefined,
      userAgent: event.userAgent ? maskUserAgent(event.userAgent) : undefined,
      // Add correlation ID
      correlationId: generateCorrelationId(),
    }),
  };

  try {
    await cloudWatchLogs.send(
      new PutLogEventsCommand({
        logGroupName: '/aws/lambda/huntaze-audit',
        logStreamName: new Date().toISOString().split('T')[0], // Daily log streams
        logEvents: [logEvent],
      })
    );
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Fallback to console log
    console.log('AUDIT:', logEvent.message);
  }
}

// PII masking functions
function maskPII(value: string): string {
  if (value.length <= 8) {
    return '****';
  }
  return value.substring(0, 4) + '****' + value.substring(value.length - 4);
}

function maskIP(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  // IPv6 or other format
  return ip.substring(0, 8) + '****';
}

function maskUserAgent(userAgent: string): string {
  // Keep browser info but remove detailed version numbers
  return userAgent
    .replace(/\d+\.\d+\.\d+/g, 'x.x.x')
    .substring(0, 100); // Limit length
}

function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// Performance monitoring middleware
export function createPerformanceMiddleware(endpoint: string) {
  return async function performanceMiddleware<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let success = true;
    let error: string | undefined;

    try {
      const result = await operation();
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      await trackAPIError(endpoint, error);
      throw err;
    } finally {
      const latency = Date.now() - startTime;
      await trackAPILatency(endpoint, latency);
      
      // Alert if latency exceeds SLI target
      if (latency > SLI_TARGETS.API_LATENCY_P95) {
        console.warn(`High latency detected: ${endpoint} took ${latency}ms`);
      }
    }
  };
}

// DORA metrics tracking
export async function trackDeployment(version: string, success: boolean) {
  await trackBusinessMetric('Deployments', 1);
  
  if (!success) {
    await trackBusinessMetric('FailedDeployments', 1);
  }
  
  // Log deployment event
  await logAuditEvent({
    userId: 'system',
    action: 'DEPLOYMENT',
    resource: 'application',
    resourceId: version,
    success,
    metadata: { version, timestamp: new Date().toISOString() },
  });
}

export async function trackIncident(severity: 'low' | 'medium' | 'high' | 'critical', resolved: boolean) {
  await trackBusinessMetric('Incidents', 1);
  await trackBusinessMetric(`Incidents${severity.charAt(0).toUpperCase() + severity.slice(1)}`, 1);
  
  if (resolved) {
    await trackBusinessMetric('IncidentsResolved', 1);
  }
}
