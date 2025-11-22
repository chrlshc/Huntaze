#!/usr/bin/env tsx

/**
 * AI System Migration Verification Script
 * 
 * This script verifies that all AI system database migrations have been applied correctly.
 * Run this after deploying to production to ensure database schema is correct.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface VerificationResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: VerificationResult[] = [];

async function verifyTable(tableName: string, expectedColumns: string[]): Promise<boolean> {
  try {
    // Query information_schema to check if table exists
    const tableExists = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ${tableName}
    `;

    if (tableExists.length === 0) {
      results.push({
        name: `Table: ${tableName}`,
        passed: false,
        message: `Table does not exist`,
      });
      return false;
    }

    // Check columns
    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = ${tableName}
    `;

    const columnNames = columns.map(c => c.column_name);
    const missingColumns = expectedColumns.filter(col => !columnNames.includes(col));

    if (missingColumns.length > 0) {
      results.push({
        name: `Table: ${tableName}`,
        passed: false,
        message: `Missing columns: ${missingColumns.join(', ')}`,
      });
      return false;
    }

    results.push({
      name: `Table: ${tableName}`,
      passed: true,
      message: `All columns present (${expectedColumns.length} columns)`,
    });
    return true;
  } catch (error) {
    results.push({
      name: `Table: ${tableName}`,
      passed: false,
      message: `Error checking table: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return false;
  }
}

async function verifyIndex(tableName: string, indexName: string): Promise<boolean> {
  try {
    const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = ${tableName}
      AND indexname = ${indexName}
    `;

    if (indexes.length === 0) {
      results.push({
        name: `Index: ${indexName}`,
        passed: false,
        message: `Index does not exist on table ${tableName}`,
      });
      return false;
    }

    results.push({
      name: `Index: ${indexName}`,
      passed: true,
      message: `Index exists on table ${tableName}`,
    });
    return true;
  } catch (error) {
    results.push({
      name: `Index: ${indexName}`,
      passed: false,
      message: `Error checking index: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return false;
  }
}

async function verifyForeignKey(tableName: string, columnName: string, referencedTable: string): Promise<boolean> {
  try {
    const foreignKeys = await prisma.$queryRaw<Array<{ constraint_name: string }>>`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = ${tableName}
        AND kcu.column_name = ${columnName}
        AND ccu.table_name = ${referencedTable}
    `;

    if (foreignKeys.length === 0) {
      results.push({
        name: `Foreign Key: ${tableName}.${columnName} -> ${referencedTable}`,
        passed: false,
        message: `Foreign key constraint does not exist`,
      });
      return false;
    }

    results.push({
      name: `Foreign Key: ${tableName}.${columnName} -> ${referencedTable}`,
      passed: true,
      message: `Foreign key constraint exists`,
    });
    return true;
  } catch (error) {
    results.push({
      name: `Foreign Key: ${tableName}.${columnName} -> ${referencedTable}`,
      passed: false,
      message: `Error checking foreign key: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return false;
  }
}

async function main() {
  console.log('🔍 AI System Migration Verification');
  console.log('====================================\n');

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✓ Database connection successful\n');

    // Verify UsageLog table (usage_logs)
    console.log('Checking UsageLog table...');
    await verifyTable('usage_logs', [
      'id',
      'creatorId',
      'feature',
      'agentId',
      'model',
      'tokensInput',
      'tokensOutput',
      'costUsd',
      'createdAt',
    ]);

    // Verify MonthlyCharge table (monthly_charges)
    console.log('Checking MonthlyCharge table...');
    await verifyTable('monthly_charges', [
      'id',
      'creatorId',
      'month',
      'totalTokensInput',
      'totalTokensOutput',
      'totalCostUsd',
      'planPrice',
    ]);

    // Verify AIInsight table (ai_insights)
    console.log('Checking AIInsight table...');
    await verifyTable('ai_insights', [
      'id',
      'creatorId',
      'source',
      'type',
      'confidence',
      'data',
      'createdAt',
    ]);

    // Verify users table has ai_plan and role columns
    console.log('Checking users table columns...');
    const usersColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      AND column_name IN ('ai_plan', 'role')
    `;

    const hasAiPlan = usersColumns.some(c => c.column_name === 'ai_plan');
    const hasRole = usersColumns.some(c => c.column_name === 'role');

    results.push({
      name: 'Column: users.ai_plan',
      passed: hasAiPlan,
      message: hasAiPlan ? 'Column exists' : 'Column does not exist',
    });

    results.push({
      name: 'Column: users.role',
      passed: hasRole,
      message: hasRole ? 'Column exists' : 'Column does not exist',
    });

    // Verify indexes
    console.log('\nChecking indexes...');
    await verifyIndex('usage_logs', 'usage_logs_creatorId_createdAt_idx');
    await verifyIndex('monthly_charges', 'monthly_charges_creatorId_month_key');
    await verifyIndex('ai_insights', 'ai_insights_creatorId_type_createdAt_idx');
    await verifyIndex('users', 'idx_users_role');

    // Verify foreign keys
    console.log('\nChecking foreign keys...');
    await verifyForeignKey('usage_logs', 'creatorId', 'users');
    await verifyForeignKey('monthly_charges', 'creatorId', 'users');
    await verifyForeignKey('ai_insights', 'creatorId', 'users');

    // Print results
    console.log('\n📊 Verification Results');
    console.log('=======================\n');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    results.forEach(result => {
      const icon = result.passed ? '✓' : '✗';
      const color = result.passed ? '\x1b[32m' : '\x1b[31m';
      const reset = '\x1b[0m';
      console.log(`${color}${icon}${reset} ${result.name}: ${result.message}`);
    });

    console.log(`\n${passed} passed, ${failed} failed\n`);

    if (failed > 0) {
      console.log('❌ Some verifications failed. Please check the migration status.');
      console.log('Run: npx prisma migrate status');
      console.log('Apply migrations: npx prisma migrate deploy\n');
      process.exit(1);
    } else {
      console.log('✅ All verifications passed! AI system database schema is correct.\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
