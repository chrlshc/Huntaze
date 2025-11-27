#!/usr/bin/env tsx
/**
 * Test AWS Connection
 * 
 * Verifies AWS credentials and tests connectivity to required services:
 * - CloudWatch
 * - CloudWatch Logs
 * - S3
 * - SNS
 */

import { CloudWatchClient, ListMetricsCommand } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { SNSClient, ListTopicsCommand } from '@aws-sdk/client-sns';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load AWS credentials from .env.aws.local
dotenv.config({ path: path.join(process.cwd(), '.env.aws.local') });

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

interface TestResult {
  service: string;
  status: 'success' | 'error';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

/**
 * Test CloudWatch connectivity
 */
async function testCloudWatch(): Promise<TestResult> {
  try {
    const client = new CloudWatchClient({ region: AWS_REGION });
    const command = new ListMetricsCommand({ MaxRecords: 1 });
    const response = await client.send(command);
    
    return {
      service: 'CloudWatch',
      status: 'success',
      message: 'Successfully connected to CloudWatch',
      details: {
        region: AWS_REGION,
        metricsFound: response.Metrics?.length || 0,
      },
    };
  } catch (error: any) {
    return {
      service: 'CloudWatch',
      status: 'error',
      message: `Failed to connect to CloudWatch: ${error.message}`,
      details: error,
    };
  }
}

/**
 * Test CloudWatch Logs connectivity
 */
async function testCloudWatchLogs(): Promise<TestResult> {
  try {
    const client = new CloudWatchLogsClient({ region: AWS_REGION });
    const command = new DescribeLogGroupsCommand({ limit: 1 });
    const response = await client.send(command);
    
    return {
      service: 'CloudWatch Logs',
      status: 'success',
      message: 'Successfully connected to CloudWatch Logs',
      details: {
        region: AWS_REGION,
        logGroupsFound: response.logGroups?.length || 0,
      },
    };
  } catch (error: any) {
    return {
      service: 'CloudWatch Logs',
      status: 'error',
      message: `Failed to connect to CloudWatch Logs: ${error.message}`,
      details: error,
    };
  }
}

/**
 * Test S3 connectivity
 */
async function testS3(): Promise<TestResult> {
  try {
    const client = new S3Client({ region: AWS_REGION });
    const command = new ListBucketsCommand({});
    const response = await client.send(command);
    
    return {
      service: 'S3',
      status: 'success',
      message: 'Successfully connected to S3',
      details: {
        region: AWS_REGION,
        bucketsFound: response.Buckets?.length || 0,
        buckets: response.Buckets?.map(b => b.Name).slice(0, 5) || [],
      },
    };
  } catch (error: any) {
    return {
      service: 'S3',
      status: 'error',
      message: `Failed to connect to S3: ${error.message}`,
      details: error,
    };
  }
}

/**
 * Test SNS connectivity
 */
async function testSNS(): Promise<TestResult> {
  try {
    const client = new SNSClient({ region: AWS_REGION });
    const command = new ListTopicsCommand({});
    const response = await client.send(command);
    
    return {
      service: 'SNS',
      status: 'success',
      message: 'Successfully connected to SNS',
      details: {
        region: AWS_REGION,
        topicsFound: response.Topics?.length || 0,
      },
    };
  } catch (error: any) {
    return {
      service: 'SNS',
      status: 'error',
      message: `Failed to connect to SNS: ${error.message}`,
      details: error,
    };
  }
}

/**
 * Verify environment variables
 */
function verifyEnvironment(): TestResult {
  const required = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_SESSION_TOKEN',
    'AWS_REGION',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    return {
      service: 'Environment',
      status: 'error',
      message: `Missing required environment variables: ${missing.join(', ')}`,
      details: { missing },
    };
  }
  
  return {
    service: 'Environment',
    status: 'success',
    message: 'All required environment variables are set',
    details: {
      region: process.env.AWS_REGION,
      accountId: process.env.AWS_ACCOUNT_ID,
      hasSessionToken: !!process.env.AWS_SESSION_TOKEN,
    },
  };
}

/**
 * Print results
 */
function printResults(results: TestResult[]) {
  console.log('\n' + '='.repeat(60));
  console.log('AWS Connection Test Results');
  console.log('='.repeat(60) + '\n');
  
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  
  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : '❌';
    console.log(`${icon} ${result.service}`);
    console.log(`   ${result.message}`);
    
    if (result.details && result.status === 'success') {
      Object.entries(result.details).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          console.log(`   ${key}: ${value.join(', ')}`);
        } else {
          console.log(`   ${key}: ${value}`);
        }
      });
    }
    
    if (result.status === 'error' && result.details?.message) {
      console.log(`   Error: ${result.details.message}`);
    }
    
    console.log('');
  });
  
  console.log('='.repeat(60));
  console.log(`Summary: ${successCount} passed, ${errorCount} failed`);
  console.log('='.repeat(60) + '\n');
  
  if (errorCount > 0) {
    console.log('⚠️  Some tests failed. Please check your AWS credentials and permissions.\n');
    process.exit(1);
  } else {
    console.log('🎉 All tests passed! AWS connection is working correctly.\n');
    process.exit(0);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Testing AWS connection...\n');
  
  // Verify environment
  results.push(verifyEnvironment());
  
  if (results[0].status === 'error') {
    printResults(results);
    return;
  }
  
  // Test services
  results.push(await testCloudWatch());
  results.push(await testCloudWatchLogs());
  results.push(await testS3());
  results.push(await testSNS());
  
  // Print results
  printResults(results);
}

// Run tests
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
