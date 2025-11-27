#!/usr/bin/env tsx

/**
 * Verify AWS Deployment
 * 
 * Comprehensive verification of all AWS resources:
 * - Lambda@Edge functions
 * - S3 bucket configuration
 * - CloudFront distribution
 * - CloudWatch alarms
 */

import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { S3Client, GetBucketPolicyCommand, GetBucketCorsCommand, GetBucketLifecycleConfigurationCommand, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, GetDistributionCommand } from '@aws-sdk/client-cloudfront';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';

const REGION = 'us-east-1';
const BUCKET_NAME = 'huntaze-assets';
const DISTRIBUTION_ID = 'E21VMD5A9KDBOO';

const lambda = new LambdaClient({ region: REGION });
const s3 = new S3Client({ region: REGION });
const cloudfront = new CloudFrontClient({ region: REGION });
const cloudwatch = new CloudWatchClient({ region: REGION });

interface VerificationResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

const results: VerificationResult[] = [];

function addResult(name: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any) {
  results.push({ name, status, message, details });
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${message}`);
  if (details) {
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }
}

async function verifyLambdaFunctions() {
  console.log('\n📦 Verifying Lambda@Edge Functions...\n');
  
  // Viewer Request
  try {
    const viewerRequest = await lambda.send(new GetFunctionCommand({
      FunctionName: 'huntaze-viewer-request'
    }));
    
    if (viewerRequest.Configuration?.State === 'Active') {
      addResult(
        'Lambda Viewer Request',
        'pass',
        `Active (Version: ${viewerRequest.Configuration.Version})`,
        {
          runtime: viewerRequest.Configuration.Runtime,
          size: viewerRequest.Configuration.CodeSize,
          timeout: viewerRequest.Configuration.Timeout
        }
      );
    } else {
      addResult(
        'Lambda Viewer Request',
        'warning',
        `State: ${viewerRequest.Configuration?.State}`
      );
    }
  } catch (error: any) {
    addResult('Lambda Viewer Request', 'fail', error.message);
  }
  
  // Origin Response
  try {
    const originResponse = await lambda.send(new GetFunctionCommand({
      FunctionName: 'huntaze-origin-response'
    }));
    
    if (originResponse.Configuration?.State === 'Active') {
      addResult(
        'Lambda Origin Response',
        'pass',
        `Active (Version: ${originResponse.Configuration.Version})`,
        {
          runtime: originResponse.Configuration.Runtime,
          size: originResponse.Configuration.CodeSize,
          timeout: originResponse.Configuration.Timeout
        }
      );
    } else {
      addResult(
        'Lambda Origin Response',
        'warning',
        `State: ${originResponse.Configuration?.State}`
      );
    }
  } catch (error: any) {
    addResult('Lambda Origin Response', 'fail', error.message);
  }
}

async function verifyS3Configuration() {
  console.log('\n🪣 Verifying S3 Bucket Configuration...\n');
  
  // Bucket Policy
  try {
    const policy = await s3.send(new GetBucketPolicyCommand({ Bucket: BUCKET_NAME }));
    const policyObj = JSON.parse(policy.Policy || '{}');
    const hasCloudFrontAccess = policyObj.Statement?.some((s: any) => 
      s.Principal?.Service === 'cloudfront.amazonaws.com'
    );
    
    if (hasCloudFrontAccess) {
      addResult('S3 Bucket Policy', 'pass', 'CloudFront access configured');
    } else {
      addResult('S3 Bucket Policy', 'warning', 'CloudFront access not found in policy');
    }
  } catch (error: any) {
    addResult('S3 Bucket Policy', 'fail', error.message);
  }
  
  // CORS Configuration
  try {
    const cors = await s3.send(new GetBucketCorsCommand({ Bucket: BUCKET_NAME }));
    if (cors.CORSRules && cors.CORSRules.length > 0) {
      addResult('S3 CORS', 'pass', `${cors.CORSRules.length} rule(s) configured`);
    } else {
      addResult('S3 CORS', 'warning', 'No CORS rules found');
    }
  } catch (error: any) {
    addResult('S3 CORS', 'fail', error.message);
  }
  
  // Lifecycle Configuration
  try {
    const lifecycle = await s3.send(new GetBucketLifecycleConfigurationCommand({ Bucket: BUCKET_NAME }));
    if (lifecycle.Rules && lifecycle.Rules.length > 0) {
      addResult('S3 Lifecycle', 'pass', `${lifecycle.Rules.length} rule(s) configured`);
    } else {
      addResult('S3 Lifecycle', 'warning', 'No lifecycle rules found');
    }
  } catch (error: any) {
    if (error.name === 'NoSuchLifecycleConfiguration') {
      addResult('S3 Lifecycle', 'warning', 'No lifecycle configuration');
    } else {
      addResult('S3 Lifecycle', 'fail', error.message);
    }
  }
  
  // Test Upload/Download
  try {
    const testKey = `test-verification-${Date.now()}.txt`;
    const testContent = 'AWS Deployment Verification Test';
    
    // Upload
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain'
    }));
    
    // Download
    const getResult = await s3.send(new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: testKey
    }));
    
    const downloadedContent = await getResult.Body?.transformToString();
    
    if (downloadedContent === testContent) {
      addResult('S3 Upload/Download', 'pass', 'Successfully uploaded and downloaded test file');
    } else {
      addResult('S3 Upload/Download', 'fail', 'Content mismatch');
    }
  } catch (error: any) {
    addResult('S3 Upload/Download', 'fail', error.message);
  }
}

async function verifyCloudFront() {
  console.log('\n☁️  Verifying CloudFront Distribution...\n');
  
  try {
    const distribution = await cloudfront.send(new GetDistributionCommand({
      Id: DISTRIBUTION_ID
    }));
    
    const config = distribution.Distribution;
    
    if (config?.Status === 'Deployed') {
      addResult('CloudFront Status', 'pass', 'Deployed and active');
    } else {
      addResult('CloudFront Status', 'warning', `Status: ${config?.Status}`);
    }
    
    // Check Lambda@Edge associations
    const defaultBehavior = config?.DistributionConfig?.DefaultCacheBehavior;
    const lambdaAssociations = defaultBehavior?.LambdaFunctionAssociations;
    
    if (lambdaAssociations && lambdaAssociations.Quantity && lambdaAssociations.Quantity > 0) {
      addResult(
        'CloudFront Lambda@Edge',
        'pass',
        `${lambdaAssociations.Quantity} function(s) attached`,
        lambdaAssociations.Items?.map(item => ({
          eventType: item.EventType,
          arn: item.LambdaFunctionARN
        }))
      );
    } else {
      addResult('CloudFront Lambda@Edge', 'warning', 'No Lambda@Edge functions attached');
    }
    
    // Check compression
    if (defaultBehavior?.Compress) {
      addResult('CloudFront Compression', 'pass', 'Enabled');
    } else {
      addResult('CloudFront Compression', 'warning', 'Not enabled');
    }
    
    // Test CloudFront URL
    try {
      const cloudfrontUrl = `https://${config?.DomainName}/test-verification-${Date.now()}.txt`;
      const response = await fetch(cloudfrontUrl);
      
      if (response.ok) {
        const headers = {
          'x-content-type-options': response.headers.get('x-content-type-options'),
          'strict-transport-security': response.headers.get('strict-transport-security'),
          'x-frame-options': response.headers.get('x-frame-options'),
          'content-encoding': response.headers.get('content-encoding')
        };
        
        addResult('CloudFront Response', 'pass', 'Successfully fetched content', headers);
      } else {
        addResult('CloudFront Response', 'warning', `Status: ${response.status}`);
      }
    } catch (error: any) {
      addResult('CloudFront Response', 'warning', `Fetch failed: ${error.message}`);
    }
    
  } catch (error: any) {
    addResult('CloudFront Distribution', 'fail', error.message);
  }
}

async function verifyCloudWatchAlarms() {
  console.log('\n📊 Verifying CloudWatch Alarms...\n');
  
  try {
    const alarms = await cloudwatch.send(new DescribeAlarmsCommand({
      AlarmNamePrefix: 'Lambda-'
    }));
    
    const lambdaAlarms = alarms.MetricAlarms?.filter(alarm => 
      alarm.AlarmName?.includes('Lambda-ViewerRequest') || 
      alarm.AlarmName?.includes('Lambda-OriginResponse')
    );
    
    if (lambdaAlarms && lambdaAlarms.length > 0) {
      addResult(
        'CloudWatch Alarms',
        'pass',
        `${lambdaAlarms.length} alarm(s) configured`,
        lambdaAlarms.map(alarm => ({
          name: alarm.AlarmName,
          state: alarm.StateValue
        }))
      );
    } else {
      addResult('CloudWatch Alarms', 'warning', 'No Lambda@Edge alarms found');
    }
    
    // Check CloudFront alarms
    const cfAlarms = await cloudwatch.send(new DescribeAlarmsCommand({
      AlarmNamePrefix: 'CloudFront-'
    }));
    
    if (cfAlarms.MetricAlarms && cfAlarms.MetricAlarms.length > 0) {
      addResult('CloudFront Alarms', 'pass', `${cfAlarms.MetricAlarms.length} alarm(s) configured`);
    } else {
      addResult('CloudFront Alarms', 'warning', 'No CloudFront alarms found');
    }
    
  } catch (error: any) {
    addResult('CloudWatch Alarms', 'fail', error.message);
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60) + '\n');
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const total = results.length;
  
  console.log(`Total Checks: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  
  const percentage = Math.round((passed / total) * 100);
  console.log(`\n📈 Success Rate: ${percentage}%`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED CHECKS:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
  }
  
  if (warnings > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.filter(r => r.status === 'warning').forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (failed === 0 && warnings === 0) {
    console.log('🎉 All checks passed! Deployment is ready for production.');
  } else if (failed === 0) {
    console.log('✅ Deployment is functional but has some warnings to address.');
  } else {
    console.log('❌ Deployment has critical issues that need to be fixed.');
  }
  
  console.log('='.repeat(60) + '\n');
}

async function main() {
  console.log('🔍 AWS Deployment Verification\n');
  console.log('This script will verify all AWS resources are properly configured.\n');
  
  try {
    await verifyLambdaFunctions();
    await verifyS3Configuration();
    await verifyCloudFront();
    await verifyCloudWatchAlarms();
    
    printSummary();
    
    const failed = results.filter(r => r.status === 'fail').length;
    process.exit(failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  }
}

main();
