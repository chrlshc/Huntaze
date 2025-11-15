#!/usr/bin/env tsx
/**
 * Comprehensive Connection Verification Script
 * Tests ALL configured services and generates detailed report
 */

import { SESClient, GetAccountCommand } from '@aws-sdk/client-ses';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { EventBridgeClient, ListEventBusesCommand } from '@aws-sdk/client-eventbridge';
import { SQSClient, ListQueuesCommand } from '@aws-sdk/client-sqs';
import { Pool } from 'pg';

interface ServiceStatus {
  service: string;
  category: string;
  status: 'connected' | 'not_configured' | 'error';
  message: string;
  details?: any;
  configured: boolean;
}

const results: ServiceStatus[] = [];

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 1. Database
async function checkDatabase() {
  log('cyan', '\n🔍 Checking PostgreSQL Database...');
  
  if (!process.env.DATABASE_URL) {
    results.push({
      service: 'PostgreSQL',
      category: 'Database',
      status: 'not_configured',
      message: 'DATABASE_URL not set',
      configured: false
    });
    log('yellow', '⚠️  DATABASE_URL not configured');
    return;
  }

  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
    });

    const client = await pool.connect();
    const result = await client.query('SELECT version(), current_database(), current_user');
    client.release();
    await pool.end();

    results.push({
      service: 'PostgreSQL',
      category: 'Database',
      status: 'connected',
      message: 'Database connection successful',
      configured: true,
      details: {
        database: result.rows[0].current_database,
        user: result.rows[0].current_user,
        version: result.rows[0].version.split(' ')[1]
      }
    });
    log('green', '✅ PostgreSQL connected');
  } catch (error) {
    results.push({
      service: 'PostgreSQL',
      category: 'Database',
      status: 'error',
      message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
      configured: true
    });
    log('red', `❌ PostgreSQL error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 2. AWS SES
async function checkSES() {
  log('cyan', '\n🔍 Checking AWS SES...');
  
  if (!process.env.AWS_REGION) {
    results.push({
      service: 'AWS SES',
      category: 'AWS',
      status: 'not_configured',
      message: 'AWS_REGION not set',
      configured: false
    });
    log('yellow', '⚠️  AWS_REGION not configured');
    return;
  }

  try {
    const sesClient = new SESClient({ region: process.env.AWS_REGION });
    const command = new GetAccountCommand({});
    const response = await sesClient.send(command);

    results.push({
      service: 'AWS SES',
      category: 'AWS',
      status: 'connected',
      message: 'SES connection successful',
      configured: true,
      details: {
        sendingEnabled: response.SendingEnabled,
        maxSendRate: response.MaxSendRate,
        max24HourSend: response.Max24HourSend
      }
    });
    log('green', '✅ AWS SES connected');
  } catch (error) {
    results.push({
      service: 'AWS SES',
      category: 'AWS',
      status: 'error',
      message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
      configured: true
    });
    log('red', `❌ AWS SES error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 3. AWS S3
async function checkS3() {
  log('cyan', '\n🔍 Checking AWS S3...');
  
  if (!process.env.AWS_REGION) {
    results.push({
      service: 'AWS S3',
      category: 'AWS',
      status: 'not_configured',
      message: 'AWS_REGION not set',
      configured: false
    });
    log('yellow', '⚠️  AWS_REGION not configured');
    return;
  }

  try {
    const s3Client = new S3Client({ region: process.env.AWS_REGION });
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);

    results.push({
      service: 'AWS S3',
      category: 'AWS',
      status: 'connected',
      message: 'S3 connection successful',
      configured: true,
      details: {
        bucketsCount: response.Buckets?.length || 0,
        buckets: response.Buckets?.map(b => b.Name).slice(0, 5) || []
      }
    });
    log('green', `✅ AWS S3 connected (${response.Buckets?.length || 0} buckets)`);
  } catch (error) {
    results.push({
      service: 'AWS S3',
      category: 'AWS',
      status: 'error',
      message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
      configured: true
    });
    log('red', `❌ AWS S3 error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 4. AWS EventBridge
async function checkEventBridge() {
  log('cyan', '\n🔍 Checking AWS EventBridge...');
  
  if (!process.env.AWS_REGION) {
    results.push({
      service: 'AWS EventBridge',
      category: 'AWS',
      status: 'not_configured',
      message: 'AWS_REGION not set',
      configured: false
    });
    log('yellow', '⚠️  AWS_REGION not configured');
    return;
  }

  try {
    const ebClient = new EventBridgeClient({ region: process.env.AWS_REGION });
    const command = new ListEventBusesCommand({});
    const response = await ebClient.send(command);

    results.push({
      service: 'AWS EventBridge',
      category: 'AWS',
      status: 'connected',
      message: 'EventBridge connection successful',
      configured: true,
      details: {
        eventBusesCount: response.EventBuses?.length || 0
      }
    });
    log('green', `✅ AWS EventBridge connected`);
  } catch (error) {
    results.push({
      service: 'AWS EventBridge',
      category: 'AWS',
      status: 'error',
      message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
      configured: true
    });
    log('red', `❌ AWS EventBridge error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 5. AWS SQS
async function checkSQS() {
  log('cyan', '\n🔍 Checking AWS SQS...');
  
  if (!process.env.AWS_REGION) {
    results.push({
      service: 'AWS SQS',
      category: 'AWS',
      status: 'not_configured',
      message: 'AWS_REGION not set',
      configured: false
    });
    log('yellow', '⚠️  AWS_REGION not configured');
    return;
  }

  try {
    const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
    const command = new ListQueuesCommand({});
    const response = await sqsClient.send(command);

    results.push({
      service: 'AWS SQS',
      category: 'AWS',
      status: 'connected',
      message: 'SQS connection successful',
      configured: true,
      details: {
        queuesCount: response.QueueUrls?.length || 0
      }
    });
    log('green', `✅ AWS SQS connected (${response.QueueUrls?.length || 0} queues)`);
  } catch (error) {
    results.push({
      service: 'AWS SQS',
      category: 'AWS',
      status: 'error',
      message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
      configured: true
    });
    log('red', `❌ AWS SQS error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 6. Check Environment Variables
function checkEnvironmentVariables() {
  log('cyan', '\n🔍 Checking Environment Variables...');
  
  const criticalVars = {
    'Database': ['DATABASE_URL'],
    'Auth': ['NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'JWT_SECRET'],
    'AWS': ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
    'AI': ['AZURE_OPENAI_API_KEY', 'AZURE_OPENAI_ENDPOINT'],
    'OAuth': ['INSTAGRAM_APP_ID', 'TIKTOK_CLIENT_KEY', 'REDDIT_CLIENT_ID'],
    'Payments': ['STRIPE_SECRET_KEY'],
  };

  const optionalVars = {
    'Cache': ['REDIS_URL', 'UPSTASH_REDIS_REST_URL'],
    'Email': ['FROM_EMAIL', 'SMTP_HOST'],
    'Monitoring': ['SENTRY_DSN'],
  };

  Object.entries(criticalVars).forEach(([category, vars]) => {
    vars.forEach(varName => {
      const configured = !!process.env[varName];
      results.push({
        service: varName,
        category: `Env: ${category}`,
        status: configured ? 'connected' : 'not_configured',
        message: configured ? 'Variable set' : 'Variable not set',
        configured
      });
      
      if (configured) {
        log('green', `✅ ${varName}`);
      } else {
        log('red', `❌ ${varName} (CRITICAL)`);
      }
    });
  });

  Object.entries(optionalVars).forEach(([category, vars]) => {
    vars.forEach(varName => {
      const configured = !!process.env[varName];
      results.push({
        service: varName,
        category: `Env: ${category}`,
        status: configured ? 'connected' : 'not_configured',
        message: configured ? 'Variable set' : 'Variable not set (optional)',
        configured
      });
      
      if (configured) {
        log('green', `✅ ${varName}`);
      } else {
        log('yellow', `⚠️  ${varName} (optional)`);
      }
    });
  });
}

// Generate Report
function generateReport() {
  log('blue', '\n' + '='.repeat(80));
  log('blue', '📊 COMPREHENSIVE CONNECTION VERIFICATION REPORT');
  log('blue', '='.repeat(80) + '\n');

  // Group by category
  const byCategory: Record<string, ServiceStatus[]> = {};
  results.forEach(result => {
    if (!byCategory[result.category]) {
      byCategory[result.category] = [];
    }
    byCategory[result.category].push(result);
  });

  // Print by category
  Object.entries(byCategory).forEach(([category, services]) => {
    log('cyan', `\n📁 ${category}`);
    log('cyan', '-'.repeat(80));
    
    services.forEach(service => {
      const icon = service.status === 'connected' ? '✅' : 
                   service.status === 'not_configured' ? '⚠️' : '❌';
      const color = service.status === 'connected' ? 'green' : 
                    service.status === 'not_configured' ? 'yellow' : 'red';
      
      log(color, `${icon} ${service.service}: ${service.message}`);
      
      if (service.details) {
        console.log('   Details:', JSON.stringify(service.details, null, 2));
      }
    });
  });

  // Summary
  const connected = results.filter(r => r.status === 'connected').length;
  const notConfigured = results.filter(r => r.status === 'not_configured').length;
  const errors = results.filter(r => r.status === 'error').length;
  const total = results.length;

  log('blue', '\n' + '='.repeat(80));
  log('blue', '📈 SUMMARY');
  log('blue', '='.repeat(80));
  log('green', `✅ Connected: ${connected}/${total}`);
  log('yellow', `⚠️  Not Configured: ${notConfigured}/${total}`);
  log('red', `❌ Errors: ${errors}/${total}`);
  
  // Critical services check
  const criticalServices = ['PostgreSQL', 'AWS SES', 'AWS S3', 'DATABASE_URL', 'NEXTAUTH_SECRET', 'AWS_REGION'];
  const criticalIssues = results.filter(r => 
    criticalServices.includes(r.service) && r.status !== 'connected'
  );

  if (criticalIssues.length > 0) {
    log('red', '\n🚨 CRITICAL ISSUES DETECTED:');
    criticalIssues.forEach(issue => {
      log('red', `   - ${issue.service}: ${issue.message}`);
    });
    log('red', '\n❌ System NOT ready for production');
    process.exit(1);
  } else {
    log('green', '\n✅ All critical services operational');
    log('green', '🚀 System ready for deployment');
  }
}

// Main execution
async function main() {
  log('blue', '🚀 Starting Comprehensive Connection Verification...\n');
  
  // Check all services
  await checkDatabase();
  await checkSES();
  await checkS3();
  await checkEventBridge();
  await checkSQS();
  checkEnvironmentVariables();
  
  // Generate report
  generateReport();
}

main().catch(error => {
  log('red', `\n💥 Fatal error: ${error}`);
  process.exit(1);
});
