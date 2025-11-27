#!/usr/bin/env ts-node

/**
 * Script to attach Lambda@Edge functions to CloudFront distribution
 * 
 * This script:
 * 1. Reads the current CloudFront distribution config
 * 2. Adds Lambda@Edge function associations
 * 3. Updates the distribution
 * 4. Waits for deployment to complete
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const DISTRIBUTION_ID = 'E21VMD5A9KDBOO';
const VIEWER_REQUEST_ARN = 'arn:aws:lambda:us-east-1:317805897534:function:huntaze-viewer-request:1';
const ORIGIN_RESPONSE_ARN = 'arn:aws:lambda:us-east-1:317805897534:function:huntaze-origin-response:1';

async function attachLambdaEdge() {
  console.log('🚀 Attaching Lambda@Edge functions to CloudFront...\n');

  try {
    // Read the distribution config
    console.log('📥 Reading CloudFront distribution config...');
    const configJson = readFileSync('cloudfront-dist-config.json', 'utf-8');
    const config = JSON.parse(configJson);

    // Update Lambda function associations
    console.log('🔧 Adding Lambda@Edge function associations...');
    config.DefaultCacheBehavior.LambdaFunctionAssociations = {
      Quantity: 2,
      Items: [
        {
          LambdaFunctionARN: VIEWER_REQUEST_ARN,
          EventType: 'viewer-request',
          IncludeBody: false
        },
        {
          LambdaFunctionARN: ORIGIN_RESPONSE_ARN,
          EventType: 'origin-response',
          IncludeBody: false
        }
      ]
    };

    // Write updated config
    writeFileSync('cloudfront-dist-config-updated.json', JSON.stringify(config, null, 2));
    console.log('✅ Configuration updated\n');

    // Get ETag
    const etagOutput = execSync('jq -r ".ETag" cloudfront-config.json').toString().trim();
    console.log(`📋 ETag: ${etagOutput}\n`);

    // Update distribution
    console.log('📤 Updating CloudFront distribution...');
    execSync(`aws cloudfront update-distribution \
      --id ${DISTRIBUTION_ID} \
      --if-match "${etagOutput}" \
      --distribution-config file://cloudfront-dist-config-updated.json`, 
      { stdio: 'inherit' }
    );

    console.log('\n✅ Distribution update initiated!\n');
    console.log('⏳ Waiting for deployment to complete (15-20 minutes)...');
    console.log('   You can check status at: https://console.aws.amazon.com/cloudfront/v3/home#/distributions/' + DISTRIBUTION_ID);
    console.log('\n💡 To wait for deployment completion, run:');
    console.log(`   aws cloudfront wait distribution-deployed --id ${DISTRIBUTION_ID}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

attachLambdaEdge();
