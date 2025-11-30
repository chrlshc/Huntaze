#!/usr/bin/env tsx
/**
 * Test Index Usage
 * 
 * Verifies that database queries are using indexes properly
 * Uses EXPLAIN ANALYZE to check query plans
 * 
 * Requirements: 7.1 - Queries use indexes for filtering and sorting
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface QueryPlan {
  query: string;
  plan: string;
  usesIndex: boolean;
  indexName?: string;
  executionTime?: number;
}

/**
 * Execute EXPLAIN ANALYZE on a query
 */
async function explainQuery(query: string): Promise<QueryPlan> {
  try {
    const result = await prisma.$queryRawUnsafe<any[]>(`EXPLAIN ANALYZE ${query}`);
    const plan = result.map(r => r['QUERY PLAN']).join('\n');
    
    // Check if index is used
    const usesIndex = /Index Scan|Index Only Scan|Bitmap Index Scan/i.test(plan);
    const indexMatch = plan.match(/Index.*?on (\w+)/i);
    const indexName = indexMatch ? indexMatch[1] : undefined;
    
    // Extract execution time
    const timeMatch = plan.match(/Execution Time: ([\d.]+) ms/);
    const executionTime = timeMatch ? parseFloat(timeMatch[1]) : undefined;
    
    return {
      query,
      plan,
      usesIndex,
      indexName,
      executionTime,
    };
  } catch (error) {
    console.error('Error explaining query:', error);
    return {
      query,
      plan: 'Error',
      usesIndex: false,
    };
  }
}

/**
 * Test common dashboard queries
 */
async function testIndexUsage() {
  console.log('🔍 Testing Index Usage\n');
  console.log('=' .repeat(80));
  
  const tests: Array<{ name: string; query: string }> = [
    {
      name: 'User content by status',
      query: `SELECT * FROM "content" WHERE "user_id" = 1 AND "status" = 'published' ORDER BY "created_at" DESC LIMIT 10`,
    },
    {
      name: 'User content by platform',
      query: `SELECT * FROM "content" WHERE "user_id" = 1 AND "platform" = 'instagram' ORDER BY "created_at" DESC LIMIT 10`,
    },
    {
      name: 'Recent transactions by type',
      query: `SELECT * FROM "transactions" WHERE "user_id" = 1 AND "type" = 'revenue' ORDER BY "created_at" DESC LIMIT 20`,
    },
    {
      name: 'Active subscriptions',
      query: `SELECT * FROM "subscriptions" WHERE "user_id" = 1 AND "status" = 'active' ORDER BY "started_at" DESC`,
    },
    {
      name: 'Marketing campaigns by channel',
      query: `SELECT * FROM "marketing_campaigns" WHERE "user_id" = 1 AND "channel" = 'email' ORDER BY "created_at" DESC`,
    },
    {
      name: 'OAuth accounts by provider',
      query: `SELECT * FROM "oauth_accounts" WHERE "user_id" = 1 AND "provider" = 'google'`,
    },
    {
      name: 'Recent usage logs',
      query: `SELECT * FROM "usage_logs" WHERE "creatorId" = 1 ORDER BY "createdAt" DESC LIMIT 50`,
    },
    {
      name: 'AI insights by type',
      query: `SELECT * FROM "ai_insights" WHERE "creatorId" = 1 AND "type" = 'content_suggestion' ORDER BY "createdAt" DESC LIMIT 10`,
    },
    {
      name: 'Signup funnel analysis',
      query: `SELECT * FROM "signup_analytics" WHERE "methodSelected" = 'email' AND "signupCompleted" IS NOT NULL ORDER BY "createdAt" DESC LIMIT 100`,
    },
    {
      name: 'Unsent events',
      query: `SELECT * FROM "events_outbox" WHERE "sent_at" IS NULL ORDER BY "event_time" DESC LIMIT 100`,
    },
  ];
  
  const results: QueryPlan[] = [];
  
  for (const test of tests) {
    console.log(`\n📊 Testing: ${test.name}`);
    console.log('-'.repeat(80));
    
    const plan = await explainQuery(test.query);
    results.push(plan);
    
    if (plan.usesIndex) {
      console.log(`✅ Uses index: ${plan.indexName || 'yes'}`);
    } else {
      console.log(`❌ No index used - Sequential scan detected`);
    }
    
    if (plan.executionTime) {
      console.log(`⏱️  Execution time: ${plan.executionTime.toFixed(2)}ms`);
    }
    
    // Show first few lines of plan
    const planLines = plan.plan.split('\n').slice(0, 3);
    console.log(`\nQuery plan preview:`);
    planLines.forEach(line => console.log(`  ${line}`));
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📈 SUMMARY\n');
  
  const indexedQueries = results.filter(r => r.usesIndex).length;
  const totalQueries = results.length;
  const percentage = ((indexedQueries / totalQueries) * 100).toFixed(1);
  
  console.log(`Queries using indexes: ${indexedQueries}/${totalQueries} (${percentage}%)`);
  
  const avgTime = results
    .filter(r => r.executionTime)
    .reduce((sum, r) => sum + (r.executionTime || 0), 0) / results.length;
  
  if (avgTime > 0) {
    console.log(`Average execution time: ${avgTime.toFixed(2)}ms`);
  }
  
  // List queries not using indexes
  const unindexed = results.filter(r => !r.usesIndex);
  if (unindexed.length > 0) {
    console.log(`\n⚠️  Queries not using indexes:`);
    unindexed.forEach((r, i) => {
      console.log(`${i + 1}. ${r.query.substring(0, 60)}...`);
    });
  } else {
    console.log(`\n✅ All queries are using indexes!`);
  }
  
  console.log('\n' + '='.repeat(80));
}

/**
 * Test index effectiveness with benchmarks
 */
async function benchmarkQueries() {
  console.log('\n🏃 Running Query Benchmarks\n');
  console.log('=' .repeat(80));
  
  const iterations = 10;
  
  // Benchmark 1: Content query with index
  console.log('\n📊 Benchmark: Content query (should use index)');
  const contentStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    await prisma.content.findMany({
      where: {
        user_id: 1,
        status: 'published',
      },
      orderBy: { created_at: 'desc' },
      take: 10,
    });
  }
  const contentTime = Date.now() - contentStart;
  console.log(`Average time: ${(contentTime / iterations).toFixed(2)}ms`);
  
  // Benchmark 2: Transaction query with index
  console.log('\n📊 Benchmark: Transaction query (should use index)');
  const txStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    await prisma.transaction.findMany({
      where: {
        user_id: 1,
        type: 'revenue',
      },
      orderBy: { created_at: 'desc' },
      take: 20,
    });
  }
  const txTime = Date.now() - txStart;
  console.log(`Average time: ${(txTime / iterations).toFixed(2)}ms`);
  
  // Benchmark 3: Complex join query
  console.log('\n📊 Benchmark: User with relations (should use indexes)');
  const userStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    await prisma.users.findFirst({
      where: { id: 1 },
      include: {
        content: {
          where: { status: 'published' },
          orderBy: { created_at: 'desc' },
          take: 5,
        },
        transactions: {
          where: { status: 'completed' },
          orderBy: { created_at: 'desc' },
          take: 5,
        },
        subscriptions: {
          where: { status: 'active' },
        },
      },
    });
  }
  const userTime = Date.now() - userStart;
  console.log(`Average time: ${(userTime / iterations).toFixed(2)}ms`);
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Benchmarks complete!\n');
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Index Usage Test Suite\n');
  
  try {
    await testIndexUsage();
    await benchmarkQueries();
    
    console.log('✅ All tests complete!\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
