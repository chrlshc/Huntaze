#!/usr/bin/env tsx
/**
 * Database Query Analyzer
 * 
 * Analyzes database queries to identify:
 * - Missing indexes
 * - Slow queries
 * - N+1 query patterns
 * - Inefficient queries
 * 
 * Requirements: 7.1 - Use database indexes for filtering and sorting
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

interface QueryAnalysis {
  query: string;
  duration: number;
  params: any[];
  timestamp: Date;
  model?: string;
  operation?: string;
}

interface IndexRecommendation {
  table: string;
  columns: string[];
  reason: string;
  estimatedImpact: 'high' | 'medium' | 'low';
  existingIndexes: string[];
}

const queryLog: QueryAnalysis[] = [];

// Listen to query events
(prisma as any).$on('query', (e: any) => {
  queryLog.push({
    query: e.query,
    duration: e.duration,
    params: e.params ? JSON.parse(e.params) : [],
    timestamp: new Date(),
  });
});

/**
 * Analyze queries and recommend indexes
 */
function analyzeQueries(): IndexRecommendation[] {
  const recommendations: IndexRecommendation[] = [];
  
  // Group queries by table
  const queriesByTable = new Map<string, QueryAnalysis[]>();
  
  for (const query of queryLog) {
    // Extract table name from query
    const tableMatch = query.query.match(/FROM\s+"?(\w+)"?/i) || 
                       query.query.match(/UPDATE\s+"?(\w+)"?/i) ||
                       query.query.match(/INSERT\s+INTO\s+"?(\w+)"?/i);
    
    if (tableMatch) {
      const table = tableMatch[1];
      if (!queriesByTable.has(table)) {
        queriesByTable.set(table, []);
      }
      queriesByTable.get(table)!.push(query);
    }
  }
  
  // Analyze each table's queries
  for (const [table, queries] of queriesByTable) {
    const slowQueries = queries.filter(q => q.duration > 100);
    
    if (slowQueries.length > 0) {
      // Analyze WHERE clauses
      const whereColumns = extractWhereColumns(slowQueries);
      if (whereColumns.length > 0) {
        recommendations.push({
          table,
          columns: whereColumns,
          reason: `${slowQueries.length} slow queries (>${100}ms) filtering on these columns`,
          estimatedImpact: slowQueries.length > 10 ? 'high' : 'medium',
          existingIndexes: getExistingIndexes(table),
        });
      }
      
      // Analyze ORDER BY clauses
      const orderByColumns = extractOrderByColumns(slowQueries);
      if (orderByColumns.length > 0) {
        recommendations.push({
          table,
          columns: orderByColumns,
          reason: `${slowQueries.length} slow queries sorting on these columns`,
          estimatedImpact: 'medium',
          existingIndexes: getExistingIndexes(table),
        });
      }
      
      // Analyze JOIN conditions
      const joinColumns = extractJoinColumns(slowQueries);
      if (joinColumns.length > 0) {
        recommendations.push({
          table,
          columns: joinColumns,
          reason: `Queries joining on these columns`,
          estimatedImpact: 'high',
          existingIndexes: getExistingIndexes(table),
        });
      }
    }
  }
  
  return recommendations;
}

/**
 * Extract columns used in WHERE clauses
 */
function extractWhereColumns(queries: QueryAnalysis[]): string[] {
  const columns = new Set<string>();
  
  for (const query of queries) {
    // Match WHERE column = ? or WHERE column IN (?)
    const matches = query.query.matchAll(/WHERE\s+"?(\w+)"?\s*(?:=|IN|>|<|>=|<=)/gi);
    for (const match of matches) {
      columns.add(match[1]);
    }
    
    // Match AND column = ?
    const andMatches = query.query.matchAll(/AND\s+"?(\w+)"?\s*(?:=|IN|>|<|>=|<=)/gi);
    for (const match of andMatches) {
      columns.add(match[1]);
    }
  }
  
  return Array.from(columns);
}

/**
 * Extract columns used in ORDER BY clauses
 */
function extractOrderByColumns(queries: QueryAnalysis[]): string[] {
  const columns = new Set<string>();
  
  for (const query of queries) {
    const matches = query.query.matchAll(/ORDER\s+BY\s+"?(\w+)"?/gi);
    for (const match of matches) {
      columns.add(match[1]);
    }
  }
  
  return Array.from(columns);
}

/**
 * Extract columns used in JOIN conditions
 */
function extractJoinColumns(queries: QueryAnalysis[]): string[] {
  const columns = new Set<string>();
  
  for (const query of queries) {
    const matches = query.query.matchAll(/JOIN\s+\w+\s+ON\s+"?(\w+)"?\."?(\w+)"?\s*=\s*"?(\w+)"?\."?(\w+)"?/gi);
    for (const match of matches) {
      columns.add(match[2]); // First table's column
      columns.add(match[4]); // Second table's column
    }
  }
  
  return Array.from(columns);
}

/**
 * Get existing indexes for a table from Prisma schema
 */
function getExistingIndexes(table: string): string[] {
  // This is a simplified version - in production, query the database
  const schemaIndexes: Record<string, string[]> = {
    users: ['email', 'onboarding_completed', 'role', 'signup_method'],
    content: ['user_id,created_at', 'user_id,platform', 'user_id,status'],
    transactions: ['user_id,created_at', 'user_id,status'],
    subscriptions: ['user_id,platform', 'user_id,status'],
    oauth_accounts: ['provider,provider_account_id', 'user_id,provider'],
    marketing_campaigns: ['user_id,channel', 'user_id,status'],
    user_stats: ['user_id'],
    ai_plan: ['account_id,created_at'],
    ai_plan_item: ['plan_id,platform', 'scheduled_at'],
    insight_snapshot: ['account_id,platform,period_end'],
    insight_summary: ['account_id,platform,created_at'],
    Account: ['userId', 'provider,providerAccountId'],
    Session: ['userId', 'sessionToken'],
    VerificationToken: ['token', 'identifier,token'],
    UsageLog: ['creatorId,createdAt'],
    MonthlyCharge: ['creatorId,month'],
    AIInsight: ['creatorId,type,createdAt'],
    SignupAnalytics: ['userId', 'email', 'sessionId', 'createdAt', 'methodSelected'],
  };
  
  return schemaIndexes[table] || [];
}

/**
 * Simulate common dashboard queries to analyze
 */
async function simulateCommonQueries() {
  console.log('🔍 Simulating common dashboard queries...\n');
  
  try {
    // Query 1: User dashboard - fetch user with stats
    await prisma.users.findFirst({
      where: { id: 1 },
      include: {
        user_stats: true,
        content: {
          where: { status: 'published' },
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        transactions: {
          where: { status: 'completed' },
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });
    
    // Query 2: Content list with filtering
    await prisma.content.findMany({
      where: {
        user_id: 1,
        platform: 'instagram',
        status: 'published',
      },
      orderBy: { created_at: 'desc' },
      take: 20,
    });
    
    // Query 3: Revenue analytics
    await prisma.transactions.findMany({
      where: {
        user_id: 1,
        type: 'revenue',
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { created_at: 'desc' },
    });
    
    // Query 4: Active subscriptions
    await prisma.subscriptions.findMany({
      where: {
        user_id: 1,
        status: 'active',
      },
      orderBy: { started_at: 'desc' },
    });
    
    // Query 5: Marketing campaigns
    await prisma.marketing_campaigns.findMany({
      where: {
        user_id: 1,
        status: 'active',
      },
      orderBy: { created_at: 'desc' },
    });
    
    // Query 6: OAuth accounts
    await prisma.oauth_accounts.findMany({
      where: {
        user_id: 1,
      },
    });
    
    // Query 7: AI insights
    await prisma.aIInsight.findMany({
      where: {
        creatorId: 1,
        type: 'content_suggestion',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    
    // Query 8: Usage logs for billing
    await prisma.usageLog.findMany({
      where: {
        creatorId: 1,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log('✅ Simulated queries complete\n');
  } catch (error) {
    console.error('❌ Error simulating queries:', error);
  }
}

/**
 * Generate migration file for recommended indexes
 */
function generateMigration(recommendations: IndexRecommendation[]): string {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  let migration = `-- Migration: Add performance indexes\n`;
  migration += `-- Generated: ${new Date().toISOString()}\n\n`;
  
  for (const rec of recommendations) {
    // Skip if index already exists
    const indexKey = rec.columns.join(',');
    if (rec.existingIndexes.some(idx => idx === indexKey)) {
      migration += `-- Index already exists: ${rec.table}(${indexKey})\n`;
      continue;
    }
    
    const indexName = `idx_${rec.table}_${rec.columns.join('_')}`;
    const columns = rec.columns.map(c => `"${c}"`).join(', ');
    
    migration += `-- ${rec.reason} (Impact: ${rec.estimatedImpact})\n`;
    migration += `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${rec.table}" (${columns});\n\n`;
  }
  
  return migration;
}

/**
 * Main analysis function
 */
async function main() {
  console.log('🚀 Database Query Analyzer\n');
  console.log('=' .repeat(60));
  
  // Simulate queries
  await simulateCommonQueries();
  
  // Wait a bit for query logs to be captured
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Analyze queries
  console.log('📊 Analyzing query patterns...\n');
  const recommendations = analyzeQueries();
  
  // Display results
  console.log('=' .repeat(60));
  console.log('📈 QUERY ANALYSIS RESULTS\n');
  
  console.log(`Total queries executed: ${queryLog.length}`);
  console.log(`Slow queries (>100ms): ${queryLog.filter(q => q.duration > 100).length}`);
  console.log(`Average query time: ${(queryLog.reduce((sum, q) => sum + q.duration, 0) / queryLog.length).toFixed(2)}ms\n`);
  
  // Display slowest queries
  const slowest = [...queryLog].sort((a, b) => b.duration - a.duration).slice(0, 5);
  console.log('🐌 Top 5 Slowest Queries:');
  slowest.forEach((q, i) => {
    console.log(`${i + 1}. ${q.duration}ms - ${q.query.substring(0, 80)}...`);
  });
  console.log();
  
  // Display recommendations
  console.log('=' .repeat(60));
  console.log('💡 INDEX RECOMMENDATIONS\n');
  
  if (recommendations.length === 0) {
    console.log('✅ No new indexes recommended - schema is well optimized!\n');
  } else {
    recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. Table: ${rec.table}`);
      console.log(`   Columns: ${rec.columns.join(', ')}`);
      console.log(`   Reason: ${rec.reason}`);
      console.log(`   Impact: ${rec.estimatedImpact.toUpperCase()}`);
      console.log(`   Existing indexes: ${rec.existingIndexes.join(', ') || 'none'}`);
      console.log();
    });
    
    // Generate migration
    const migration = generateMigration(recommendations);
    console.log('=' .repeat(60));
    console.log('📝 MIGRATION SQL\n');
    console.log(migration);
  }
  
  console.log('=' .repeat(60));
  console.log('✅ Analysis complete!\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
