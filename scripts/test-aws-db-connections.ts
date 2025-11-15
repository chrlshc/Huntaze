#!/usr/bin/env tsx
/**
 * Test AWS and Database Connections
 * Validates all critical infrastructure connections
 */

import { SESClient, GetAccountCommand } from '@aws-sdk/client-ses';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { Pool } from 'pg';
import { Redis } from '@upstash/redis';

interface TestResult {
  service: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

// Test PostgreSQL Database
async function testDatabase() {
  console.log('\n🔍 Testing PostgreSQL Database...');
  
  if (!process.env.DATABASE_URL) {
    results.push({
      service: 'PostgreSQL',
      status: 'error',
      message: 'DATABASE_URL not configured'
    });
    return;
  }

  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
    });

    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    await pool.end();

    results.push({
      service: 'PostgreSQL',
      status: 'success',
      message: 'Database connection successful',
      details: { timestamp: result.rows[0].now }
    });
  } catch (error) {
    results.push({
      service: 'PostgreSQL',
      status: 'error',
      message: `Database connection failed: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

// Test Redis/Upstash
async function testRedis() {
  console.log('\n🔍 Testing Redis/Upstash...');
  
  if (!process.env.UPSTASH_REDIS_REST_URL && !process.env.REDIS_URL) {
    results.push({
      service: 'Redis',
      status: 'warning',
      message: 'Redis not configured (optional)'
    });
    return;
  }

  try {
    let redis: Redis;
    
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    } else if (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('https')) {
      redis = new Redis({
        url: process.env.REDIS_URL,
        token: process.env.REDIS_TOKEN || '',
      });
    } else {
      results.push({
        service: 'Redis',
        status: 'warning',
        message: 'Redis URL not compatible with Upstash client (requires HTTPS)'
      });
      return;
    }

    const testKey = 'test:connection';
    await redis.set(testKey, 'ok', { ex: 10 });
    const value = await redis.get(testKey);
    await redis.del(testKey);

    results.push({
      service: 'Redis',
      status: 'success',
      message: 'Redis connection successful',
      details: { testValue: value }
    });
  } catch (error) {
    results.push({
      service: 'Redis',
      status: 'error',
      message: `Redis connection failed: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

// Test AWS SES
async function testSES() {
  console.log('\n🔍 Testing AWS SES...');
  
  if (!process.env.AWS_REGION) {
    results.push({
      service: 'AWS SES',
      status: 'warning',
      message: 'AWS_REGION not configured'
    });
    return;
  }

  try {
    const sesClient = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    const command = new GetAccountCommand({});
    const response = await sesClient.send(command);

    results.push({
      service: 'AWS SES',
      status: 'success',
      message: 'AWS SES connection successful',
      details: {
        sendingEnabled: response.SendingEnabled,
        maxSendRate: response.MaxSendRate
      }
    });
  } catch (error) {
    results.push({
      service: 'AWS SES',
      status: 'error',
      message: `AWS SES connection failed: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

// Test AWS S3
async function testS3() {
  console.log('\n🔍 Testing AWS S3...');
  
  if (!process.env.AWS_REGION) {
    results.push({
      service: 'AWS S3',
      status: 'warning',
      message: 'AWS_REGION not configured'
    });
    return;
  }

  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);

    results.push({
      service: 'AWS S3',
      status: 'success',
      message: 'AWS S3 connection successful',
      details: {
        bucketsCount: response.Buckets?.length || 0
      }
    });
  } catch (error) {
    results.push({
      service: 'AWS S3',
      status: 'error',
      message: `AWS S3 connection failed: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

// Test Environment Variables
function testEnvironmentVariables() {
  console.log('\n🔍 Checking Environment Variables...');
  
  const criticalVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  const optionalVars = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'REDIS_URL',
    'UPSTASH_REDIS_REST_URL',
    'STRIPE_SECRET_KEY',
  ];

  const missing: string[] = [];
  const present: string[] = [];
  const optional: string[] = [];

  criticalVars.forEach(varName => {
    if (process.env[varName]) {
      present.push(varName);
    } else {
      missing.push(varName);
    }
  });

  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      optional.push(varName);
    }
  });

  if (missing.length > 0) {
    results.push({
      service: 'Environment Variables',
      status: 'error',
      message: `Missing critical variables: ${missing.join(', ')}`
    });
  } else {
    results.push({
      service: 'Environment Variables',
      status: 'success',
      message: 'All critical environment variables present',
      details: {
        critical: present.length,
        optional: optional.length
      }
    });
  }
}

// Print Results
function printResults() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 CONNECTION TEST RESULTS');
  console.log('='.repeat(60) + '\n');

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;

  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${result.service}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
    console.log('');
  });

  console.log('='.repeat(60));
  console.log(`Summary: ${successCount} success, ${errorCount} errors, ${warningCount} warnings`);
  console.log('='.repeat(60) + '\n');

  // Exit with error if any critical service failed
  if (errorCount > 0) {
    const criticalErrors = results.filter(r => 
      r.status === 'error' && 
      ['PostgreSQL', 'Environment Variables'].includes(r.service)
    );
    
    if (criticalErrors.length > 0) {
      console.error('❌ Critical services failed. Cannot proceed.');
      process.exit(1);
    }
  }

  console.log('✅ Connection tests complete!');
}

// Main execution
async function main() {
  console.log('🚀 Starting AWS and Database Connection Tests...\n');
  
  testEnvironmentVariables();
  await testDatabase();
  await testRedis();
  await testSES();
  await testS3();
  
  printResults();
}

main().catch(error => {
  console.error('Fatal error during connection tests:', error);
  process.exit(1);
});
