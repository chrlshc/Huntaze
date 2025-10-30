/**
 * Audit Logger
 * 
 * Logs des événements d'audit sans PII
 * Envoie vers CloudWatch Logs
 */

import { CloudWatchLogsClient, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { AuditEvents } from './slos';

const client = new CloudWatchLogsClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const LOG_GROUP = process.env.AUDIT_LOG_GROUP || '/huntaze/audit';
const LOG_STREAM = process.env.AUDIT_LOG_STREAM || 'production';

interface AuditLogEntry {
  event: typeof AuditEvents[keyof typeof AuditEvents];
  userId: string;
  resourceType?: string;
  resourceId?: string;
  action: string;
  result: 'success' | 'failure';
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Masque les PII dans les données
 */
function maskPII(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const masked = { ...data };
  const piiFields = ['email', 'phone', 'ssn', 'password', 'creditCard'];

  for (const key of Object.keys(masked)) {
    if (piiFields.includes(key.toLowerCase())) {
      masked[key] = '[REDACTED]';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskPII(masked[key]);
    }
  }

  return masked;
}

/**
 * Log un événement d'audit
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: entry.event,
      userId: entry.userId,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      action: entry.action,
      result: entry.result,
      metadata: maskPII(entry.metadata || {}),
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT]', JSON.stringify(logEntry, null, 2));
      return;
    }

    // Send to CloudWatch in production
    const command = new PutLogEventsCommand({
      logGroupName: LOG_GROUP,
      logStreamName: LOG_STREAM,
      logEvents: [
        {
          message: JSON.stringify(logEntry),
          timestamp: Date.now(),
        },
      ],
    });

    await client.send(command);
  } catch (error) {
    console.error('[Audit Logger] Failed to log audit event:', error);
    // Don't throw - audit logging should not break the app
  }
}

/**
 * Helper functions pour les événements courants
 */

export async function logUserLogin(userId: string, ipAddress: string, userAgent: string) {
  await logAudit({
    event: AuditEvents.USER_LOGIN,
    userId,
    action: 'login',
    result: 'success',
    ipAddress,
    userAgent,
  });
}

export async function logMediaDownload(
  userId: string,
  mediaId: string,
  ipAddress: string
) {
  await logAudit({
    event: AuditEvents.MEDIA_DOWNLOADED,
    userId,
    resourceType: 'media',
    resourceId: mediaId,
    action: 'download',
    result: 'success',
    ipAddress,
  });
}

export async function logDataExport(
  userId: string,
  exportType: string,
  recordCount: number,
  ipAddress: string
) {
  await logAudit({
    event: AuditEvents.SUBSCRIBER_EXPORTED,
    userId,
    resourceType: 'export',
    action: 'export',
    result: 'success',
    metadata: {
      exportType,
      recordCount,
    },
    ipAddress,
  });
}

export async function logRoleChange(
  adminUserId: string,
  targetUserId: string,
  role: string,
  action: 'assigned' | 'revoked',
  ipAddress: string
) {
  await logAudit({
    event: action === 'assigned' ? AuditEvents.ROLE_ASSIGNED : AuditEvents.ROLE_REVOKED,
    userId: adminUserId,
    resourceType: 'user',
    resourceId: targetUserId,
    action: `role_${action}`,
    result: 'success',
    metadata: {
      role,
    },
    ipAddress,
  });
}

export async function logSuspiciousActivity(
  userId: string,
  reason: string,
  ipAddress: string,
  metadata?: Record<string, any>
) {
  await logAudit({
    event: AuditEvents.SUSPICIOUS_ACTIVITY,
    userId,
    action: 'suspicious_activity_detected',
    result: 'failure',
    metadata: {
      reason,
      ...maskPII(metadata || {}),
    },
    ipAddress,
  });
}

/**
 * Usage examples:
 * 
 * // User login
 * await logUserLogin(userId, req.ip, req.headers['user-agent']);
 * 
 * // Media download
 * await logMediaDownload(userId, mediaId, req.ip);
 * 
 * // Data export
 * await logDataExport(userId, 'subscribers', 1000, req.ip);
 * 
 * // Role change
 * await logRoleChange(adminId, userId, 'admin', 'assigned', req.ip);
 * 
 * // Suspicious activity
 * await logSuspiciousActivity(userId, 'Multiple failed login attempts', req.ip);
 */
