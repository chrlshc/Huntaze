#!/usr/bin/env ts-node

/**
 * Test S3 Setup
 * 
 * This script tests the S3 bucket configuration and upload/retrieval functionality.
 * 
 * Usage:
 *   npm run test:s3-setup
 *   tsx scripts/test-s3-setup.ts
 */

import { s3Service } from '../lib/services/s3Service';
import { randomBytes } from 'crypto';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

/**
 * Run a test and record the result
 */
async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    results.push({
      name,
      passed: true,
      duration: Date.now() - startTime,
    });
    console.log(`✅ ${name}`);
  } catch (error: any) {
    results.push({
      name,
      passed: false,
      error: error.message,
      duration: Date.now() - startTime,
    });
    console.error(`❌ ${name}: ${error.message}`);
  }
}

/**
 * Test 1: Upload a test file
 */
async function testUpload(): Promise<string> {
  const testKey = `test/${Date.now()}-test.txt`;
  const testContent = Buffer.from('Hello from Huntaze S3 test!');
  
  const url = await s3Service.upload({
    key: testKey,
    body: testContent,
  });
  
  if (!url.includes(testKey)) {
    throw new Error('Upload returned invalid URL');
  }
  
  return testKey;
}

/**
 * Test 2: Check if file exists
 */
async function testExists(key: string): Promise<void> {
  const exists = await s3Service.exists(key);
  
  if (!exists) {
    throw new Error('File should exist but does not');
  }
}

/**
 * Test 3: Get file metadata
 */
async function testMetadata(key: string): Promise<void> {
  const metadata = await s3Service.getMetadata(key);
  
  if (!metadata.contentType) {
    throw new Error('Metadata missing content type');
  }
  
  if (!metadata.lastModified) {
    throw new Error('Metadata missing last modified date');
  }
  
  if (metadata.contentLength === undefined) {
    throw new Error('Metadata missing content length');
  }
}

/**
 * Test 4: Get signed URL
 */
async function testSignedUrl(key: string): Promise<void> {
  const signedUrl = await s3Service.getSignedUrl(key, 300);
  
  if (!signedUrl.includes(key)) {
    throw new Error('Signed URL does not contain key');
  }
  
  if (!signedUrl.includes('X-Amz-Signature')) {
    throw new Error('Signed URL missing signature');
  }
}

/**
 * Test 5: Upload with custom content type
 */
async function testCustomContentType(): Promise<string> {
  const testKey = `test/${Date.now()}-custom.json`;
  const testContent = Buffer.from(JSON.stringify({ test: true }));
  
  await s3Service.upload({
    key: testKey,
    body: testContent,
    contentType: 'application/json',
  });
  
  const metadata = await s3Service.getMetadata(testKey);
  
  if (metadata.contentType !== 'application/json') {
    throw new Error(`Expected application/json, got ${metadata.contentType}`);
  }
  
  return testKey;
}

/**
 * Test 6: Upload with cache control
 */
async function testCacheControl(): Promise<string> {
  const testKey = `test/${Date.now()}-cached.txt`;
  const testContent = Buffer.from('Cached content');
  
  await s3Service.upload({
    key: testKey,
    body: testContent,
    cacheControl: 'public, max-age=3600',
  });
  
  const metadata = await s3Service.getMetadata(testKey);
  
  if (!metadata.cacheControl?.includes('max-age=3600')) {
    throw new Error(`Expected cache control with max-age=3600, got ${metadata.cacheControl}`);
  }
  
  return testKey;
}

/**
 * Test 7: Delete file
 */
async function testDelete(key: string): Promise<void> {
  await s3Service.delete(key);
  
  const exists = await s3Service.exists(key);
  
  if (exists) {
    throw new Error('File should be deleted but still exists');
  }
}

/**
 * Test 8: Content type auto-detection
 */
async function testContentTypeDetection(): Promise<void> {
  const tests = [
    { key: 'test/image.jpg', expected: 'image/jpeg' },
    { key: 'test/image.png', expected: 'image/png' },
    { key: 'test/font.woff2', expected: 'font/woff2' },
    { key: 'test/style.css', expected: 'text/css' },
    { key: 'test/script.js', expected: 'application/javascript' },
  ];
  
  for (const test of tests) {
    const content = Buffer.from('test content');
    await s3Service.upload({
      key: test.key,
      body: content,
    });
    
    const metadata = await s3Service.getMetadata(test.key);
    
    if (metadata.contentType !== test.expected) {
      throw new Error(`${test.key}: Expected ${test.expected}, got ${metadata.contentType}`);
    }
    
    // Clean up
    await s3Service.delete(test.key);
  }
}

/**
 * Main test runner
 */
async function runTests(): Promise<void> {
  console.log('🧪 Testing S3 Setup');
  console.log('==================\n');
  
  // Check environment variables
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ AWS credentials not configured');
    console.error('   Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables');
    process.exit(1);
  }
  
  console.log(`Bucket: ${process.env.AWS_S3_BUCKET || 'huntaze-beta-assets'}`);
  console.log(`Region: ${process.env.AWS_REGION || 'us-east-1'}\n`);
  
  let testKey1: string = '';
  let testKey2: string = '';
  let testKey3: string = '';
  
  // Run tests
  await runTest('Test 1: Upload file', async () => {
    testKey1 = await testUpload();
  });
  
  await runTest('Test 2: Check file exists', async () => {
    await testExists(testKey1);
  });
  
  await runTest('Test 3: Get file metadata', async () => {
    await testMetadata(testKey1);
  });
  
  await runTest('Test 4: Get signed URL', async () => {
    await testSignedUrl(testKey1);
  });
  
  await runTest('Test 5: Upload with custom content type', async () => {
    testKey2 = await testCustomContentType();
  });
  
  await runTest('Test 6: Upload with cache control', async () => {
    testKey3 = await testCacheControl();
  });
  
  await runTest('Test 7: Delete file', async () => {
    await testDelete(testKey1);
  });
  
  await runTest('Test 8: Content type auto-detection', async () => {
    await testContentTypeDetection();
  });
  
  // Clean up remaining test files
  try {
    await s3Service.delete(testKey2);
    await s3Service.delete(testKey3);
  } catch (error) {
    // Ignore cleanup errors
  }
  
  // Print summary
  console.log('\n==================');
  console.log('📊 Test Summary');
  console.log('==================');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
  
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Duration: ${totalDuration}ms\n`);
  
  if (failed > 0) {
    console.error('❌ Some tests failed');
    process.exit(1);
  }
  
  console.log('✅ All tests passed!');
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
