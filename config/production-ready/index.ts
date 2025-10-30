/**
 * Production Ready Configuration - Index
 * 
 * Export all production-ready services for easy import
 */

// Secrets Management
export {
  getSecret,
  getSecretJSON,
  preloadSecrets,
  clearSecretCache,
  getCacheStats,
  secrets,
  healthCheck as secretsHealthCheck,
} from './secrets.service';

// Monitoring & Observability
export {
  SLI_TARGETS,
  SLO_OBJECTIVES,
  DORA_TARGETS,
  trackAPILatency,
  trackAPIError,
  trackUserAction,
  trackBusinessMetric,
  logAuditEvent,
  createPerformanceMiddleware,
  trackDeployment,
  trackIncident,
  type DORAMetrics,
} from './monitoring.service';

// Database
export {
  prisma,
  testConnectionBurst,
  healthCheckDB,
  disconnectDB,
  queryOptimizations,
} from './prisma.config';

// S3 Storage
export {
  generateUploadUrl,
  generateDownloadUrl,
  validateFileSize,
  getMaxFileSize,
} from './s3-presigned.service';

// Re-export types
export type { AuditEvent } from './monitoring.service';
export type { PresignedUploadOptions, PresignedDownloadOptions } from './s3-presigned.service';
