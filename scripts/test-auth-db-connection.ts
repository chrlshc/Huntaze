#!/usr/bin/env ts-node

/**
 * Test Auth & Database Connection
 * 
 * Verifies:
 * - PostgreSQL connection
 * - Users table exists
 * - NextAuth configuration
 * - Environment variables
 */

import { query, getPool } from '../lib/db.js';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

async function testDatabaseConnection() {
  console.log('\n🔌 Testing Database Connection...\n');

  try {
    const pool = getPool();
    const client = await pool.connect();
    
    results.push({
      name: 'Database Connection',
      status: 'pass',
      message: 'Successfully connected to PostgreSQL',
    });

    client.release();
  } catch (error) {
    results.push({
      name: 'Database Connection',
      status: 'fail',
      message: 'Failed to connect to PostgreSQL',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

async function testUsersTable() {
  console.log('📊 Testing Users Table...\n');

  try {
    // Check if users table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      results.push({
        name: 'Users Table',
        status: 'fail',
        message: 'Users table does not exist',
      });
      return;
    }

    // Check table structure
    const columns = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    const requiredColumns = ['id', 'email', 'password', 'name'];
    const existingColumns = columns.rows.map((row: any) => row.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      results.push({
        name: 'Users Table Structure',
        status: 'warn',
        message: `Missing columns: ${missingColumns.join(', ')}`,
        details: { existingColumns, requiredColumns },
      });
    } else {
      results.push({
        name: 'Users Table Structure',
        status: 'pass',
        message: 'All required columns exist',
        details: { columns: existingColumns },
      });
    }

    // Check for test user
    const userCount = await query('SELECT COUNT(*) FROM users');
    results.push({
      name: 'Users Table Data',
      status: 'pass',
      message: `Found ${userCount.rows[0].count} users in database`,
    });

  } catch (error) {
    results.push({
      name: 'Users Table',
      status: 'fail',
      message: 'Failed to query users table',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

async function testEnvironmentVariables() {
  console.log('🔐 Testing Environment Variables...\n');

  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  const optionalVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      results.push({
        name: `Env: ${varName}`,
        status: 'pass',
        message: 'Variable is set',
      });
    } else {
      results.push({
        name: `Env: ${varName}`,
        status: 'fail',
        message: 'Required variable is missing',
      });
    }
  }

  for (const varName of optionalVars) {
    if (process.env[varName]) {
      results.push({
        name: `Env: ${varName}`,
        status: 'pass',
        message: 'Optional variable is set',
      });
    } else {
      results.push({
        name: `Env: ${varName}`,
        status: 'warn',
        message: 'Optional variable not set (Google OAuth disabled)',
      });
    }
  }
}

async function testPasswordHashing() {
  console.log('🔒 Testing Password Hashing...\n');

  try {
    const { hash, compare } = await import('bcryptjs');
    
    const testPassword = 'TestPassword123!';
    const hashed = await hash(testPassword, 12);
    const isValid = await compare(testPassword, hashed);

    if (isValid) {
      results.push({
        name: 'Password Hashing',
        status: 'pass',
        message: 'bcryptjs working correctly',
      });
    } else {
      results.push({
        name: 'Password Hashing',
        status: 'fail',
        message: 'Password verification failed',
      });
    }
  } catch (error) {
    results.push({
      name: 'Password Hashing',
      status: 'fail',
      message: 'bcryptjs not available',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

function printResults() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST RESULTS');
  console.log('='.repeat(60) + '\n');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warn').length;

  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.name}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
    console.log('');
  }

  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log('='.repeat(60) + '\n');

  if (failed > 0) {
    console.log('❌ Some tests failed. Please fix the issues above.\n');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('⚠️  All critical tests passed, but there are warnings.\n');
    process.exit(0);
  } else {
    console.log('✅ All tests passed! Auth system is ready.\n');
    process.exit(0);
  }
}

async function main() {
  console.log('\n🚀 Starting Auth & Database Connection Tests\n');
  console.log('='.repeat(60) + '\n');

  await testEnvironmentVariables();
  await testDatabaseConnection();
  await testUsersTable();
  await testPasswordHashing();

  printResults();
}

main().catch((error) => {
  console.error('\n❌ Fatal error during tests:', error);
  process.exit(1);
});
