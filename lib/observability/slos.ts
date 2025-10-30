/**
 * SLIs/SLOs Configuration
 * 
 * Service Level Indicators & Objectives
 */

export const SLOs = {
  // API Performance
  api: {
    // 95% des requêtes doivent répondre en moins de 250ms
    latencyP95: {
      target: 250, // ms
      threshold: 0.95, // 95%
    },
    
    // 99% des requêtes doivent répondre en moins de 1s
    latencyP99: {
      target: 1000, // ms
      threshold: 0.99, // 99%
    },
    
    // Taux d'erreur < 1%
    errorRate: {
      target: 0.01, // 1%
      threshold: 0.99, // 99% de succès
    },
    
    // Disponibilité > 99.9%
    availability: {
      target: 0.999, // 99.9%
    },
  },
  
  // Database
  database: {
    // Connexions disponibles > 20%
    connectionPool: {
      minAvailable: 0.2, // 20%
    },
    
    // CPU < 80%
    cpu: {
      maxUsage: 0.8, // 80%
    },
    
    // Query time p95 < 100ms
    queryLatencyP95: {
      target: 100, // ms
      threshold: 0.95,
    },
  },
  
  // Queue (SQS)
  queue: {
    // Messages en attente < 5000
    messagesInQueue: {
      warning: 5000,
      critical: 10000,
    },
    
    // Age des messages < 5 minutes
    messageAge: {
      warning: 5 * 60, // 5 minutes
      critical: 15 * 60, // 15 minutes
    },
  },
  
  // Storage (S3)
  storage: {
    // Upload success rate > 99%
    uploadSuccessRate: {
      target: 0.99,
    },
    
    // Download latency p95 < 500ms
    downloadLatencyP95: {
      target: 500, // ms
      threshold: 0.95,
    },
  },
} as const;

/**
 * CloudWatch Alarms Configuration
 */
export const CloudWatchAlarms = {
  // API 5xx errors > 2% (5 min)
  apiErrors: {
    metric: 'API5xxErrors',
    threshold: 0.02, // 2%
    evaluationPeriods: 1,
    datapointsToAlarm: 1,
    period: 300, // 5 minutes
    severity: 'critical',
    action: 'PagerDuty',
  },
  
  // Queue depth > 5000 (10 min)
  queueDepth: {
    metric: 'ApproximateNumberOfMessagesVisible',
    threshold: 5000,
    evaluationPeriods: 2,
    datapointsToAlarm: 2,
    period: 300, // 5 minutes
    severity: 'warning',
    action: 'Slack',
  },
  
  // DB CPU > 80% (15 min)
  dbCpu: {
    metric: 'CPUUtilization',
    threshold: 80, // %
    evaluationPeriods: 3,
    datapointsToAlarm: 3,
    period: 300, // 5 minutes
    severity: 'warning',
    action: 'Slack',
  },
  
  // DB connections > 90%
  dbConnections: {
    metric: 'DatabaseConnections',
    threshold: 0.9, // 90% of max
    evaluationPeriods: 2,
    datapointsToAlarm: 2,
    period: 60, // 1 minute
    severity: 'critical',
    action: 'PagerDuty',
  },
  
  // API latency p95 > 1s
  apiLatency: {
    metric: 'APILatencyP95',
    threshold: 1000, // ms
    evaluationPeriods: 2,
    datapointsToAlarm: 2,
    period: 300, // 5 minutes
    severity: 'warning',
    action: 'Slack',
  },
} as const;

/**
 * DORA Metrics
 * (DevOps Research and Assessment)
 */
export const DORAMetrics = {
  // Deployment Frequency
  deploymentFrequency: {
    elite: 'Multiple per day',
    high: 'Once per day to once per week',
    medium: 'Once per week to once per month',
    low: 'Once per month to once per 6 months',
  },
  
  // Lead Time for Changes
  leadTimeForChanges: {
    elite: '< 1 hour',
    high: '< 1 day',
    medium: '< 1 week',
    low: '< 1 month',
  },
  
  // Time to Restore Service
  timeToRestoreService: {
    elite: '< 1 hour',
    high: '< 1 day',
    medium: '< 1 week',
    low: '< 1 month',
  },
  
  // Change Failure Rate
  changeFailureRate: {
    elite: '< 5%',
    high: '< 10%',
    medium: '< 15%',
    low: '> 15%',
  },
} as const;

/**
 * Log Retention Policy
 */
export const LogRetention = {
  production: {
    application: 30, // days
    access: 90, // days
    audit: 365, // days (1 year)
    security: 730, // days (2 years)
  },
  
  staging: {
    application: 7, // days
    access: 14, // days
    audit: 30, // days
    security: 90, // days
  },
  
  development: {
    application: 3, // days
    access: 3, // days
    audit: 7, // days
    security: 7, // days
  },
} as const;

/**
 * Audit Log Events
 */
export const AuditEvents = {
  // User actions
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  
  // Data access
  MEDIA_VIEWED: 'media.viewed',
  MEDIA_DOWNLOADED: 'media.downloaded',
  SUBSCRIBER_VIEWED: 'subscriber.viewed',
  SUBSCRIBER_EXPORTED: 'subscriber.exported',
  
  // RBAC changes
  ROLE_ASSIGNED: 'role.assigned',
  ROLE_REVOKED: 'role.revoked',
  PERMISSION_GRANTED: 'permission.granted',
  PERMISSION_REVOKED: 'permission.revoked',
  
  // Security events
  PASSWORD_CHANGED: 'security.password_changed',
  MFA_ENABLED: 'security.mfa_enabled',
  MFA_DISABLED: 'security.mfa_disabled',
  SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
} as const;
