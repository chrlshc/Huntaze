/**
 * Database Strategy for Huntaze
 * 
 * PostgreSQL: Relational data, transactions, complex queries
 * DynamoDB: Real-time data, high velocity, simple access patterns
 */

export const DATABASE_STRATEGY = {
  // PostgreSQL (via Prisma) - Données relationnelles et transactionnelles
  postgres: {
    // User & Auth
    users: 'User accounts, profiles, settings',
    auth_sessions: 'Authentication sessions, tokens',
    
    // Billing & Subscriptions
    subscriptions: 'User subscriptions, plans',
    invoices: 'Billing invoices, payment history',
    payment_methods: 'Stored payment methods',
    commission_tiers: 'Revenue share tiers',
    
    // Platform Connections
    platform_connections: 'OAuth connections (Reddit, TikTok, etc)',
    
    // AI Configuration
    ai_personalities: 'AI agent configurations',
    ai_templates: 'Message templates, playbooks',
    
    // Reporting & Analytics (aggregated)
    monthly_reports: 'Aggregated monthly metrics',
    revenue_reports: 'Financial summaries'
  },

  // DynamoDB - Données temps réel, haute vélocité
  dynamodb: {
    // Real-time Messaging
    'huntaze-messages': {
      description: 'Real-time messages from all platforms',
      partitionKey: 'platformId#userId',
      sortKey: 'timestamp',
      ttl: '90 days',
      gsi: ['fanId-timestamp-index']
    },
    
    // WebSocket Connections
    'huntaze-connections': {
      description: 'Active WebSocket connections',
      partitionKey: 'connectionId',
      ttl: '24 hours'
    },
    
    // OnlyFans Specific
    'huntaze-onlyfans-scraped-data': {
      description: 'Raw scraped data from OnlyFans',
      partitionKey: 'creatorId',
      sortKey: 'timestamp',
      ttl: '180 days',
      gsi: ['fanId-timestamp-index', 'dataType-timestamp-index']
    },
    
    // Analytics Events
    'huntaze-analytics-events': {
      description: 'Real-time analytics events',
      partitionKey: 'userId#date',
      sortKey: 'timestamp',
      ttl: '30 days'
    },
    
    // AI Decisions
    'huntaze-ai-decisions': {
      description: 'AI decision log for audit',
      partitionKey: 'userId',
      sortKey: 'decisionId',
      ttl: '365 days'
    },
    
    // Session Storage
    'huntaze-platform-sessions': {
      description: 'Encrypted platform session tokens',
      partitionKey: 'userId#platform',
      encryption: 'AES-256-GCM'
    }
  },

  // Decision Matrix
  getDatabase(dataType: string): 'postgres' | 'dynamodb' {
    const dynamoPatterns = [
      'message', 'event', 'metric', 'session', 'connection',
      'scraped', 'real-time', 'analytics', 'decision'
    ];
    
    return dynamoPatterns.some(pattern => 
      dataType.toLowerCase().includes(pattern)
    ) ? 'dynamodb' : 'postgres';
  }
} as const;

// Helper functions
export function isTransactional(operation: string): boolean {
  const transactionalOps = ['subscription', 'payment', 'billing'];
  return transactionalOps.some(op => operation.includes(op));
}

export function requiresComplexQuery(operation: string): boolean {
  const complexOps = ['report', 'aggregate', 'join', 'search'];
  return complexOps.some(op => operation.includes(op));
}

// Usage examples:
// For messages: use DynamoDB (real-time, high velocity)
// For user profile updates: use PostgreSQL (relational, transactional)
// For billing: use PostgreSQL (ACID compliance needed)
// For WebSocket state: use DynamoDB (ephemeral, high throughput)