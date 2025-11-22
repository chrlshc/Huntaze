/**
 * S3 Service Integration Tests
 * 
 * Tests the S3 service with actual AWS S3 operations.
 * Requires valid AWS credentials and S3 bucket.
 * 
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { s3Service, S3Error, S3ErrorType } from '../../../lib/services/s3Service';
import crypto from 'crypto';

// Test configuration
const TEST_PREFIX = 'test-integration';
const TEST_USER_ID = 'test-user-123';

// Test files to cleanup after tests
const testKeys: string[] = [];

// Helper to generate test key
function generateTestKey(filename: string): string {
  const key = `${TEST_PREFIX}/${TEST_USER_ID}/${Date.now()}-${filename}`;
  testKeys.push(key);
  return key;
}

// Helper to create test buffer
function createTestBuffer(size: number = 1024): Buffer {
  return Buffer.from(crypto.randomBytes(size));
}

// Cleanup function
async function cleanup() {
  console.log(`Cleaning up ${testKeys.length} test files...`);
  
  const results = await Promise.allSettled(
    testKeys.map(key => s3Service.delete(key))
  );
  
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`Cleanup: ${succeeded} succeeded, ${failed} failed`);
}

describe('S3 Service Integration Tests', () => {
  let skipTests = false;

  beforeAll(async () => {
    // Verify environment variables
    console.log('AWS Configuration:', {
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_S3_BUCKET,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      hasSessionToken: !!process.env.AWS_SESSION_TOKEN,
    });
    
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.warn('⚠️  AWS credentials not configured - S3 tests will be skipped');
      skipTests = true;
      return;
    }

    // Test if credentials are valid by attempting a simple operation
    try {
      const testKey = `${TEST_PREFIX}/credential-test-${Date.now()}.txt`;
      await s3Service.upload({
        key: testKey,
        body: Buffer.from('test'),
      });
      await s3Service.delete(testKey);
      console.log('✅ AWS credentials validated successfully');
    } catch (error) {
      console.warn('⚠️  AWS credentials invalid or expired - S3 tests will be skipped');
      console.warn('Error:', error instanceof Error ? error.message : String(error));
      skipTests = true;
    }
  });

  afterAll(async () => {
    if (!skipTests) {
      await cleanup();
    }
  });

  describe.skipIf(skipTests)('upload()', () => {
    it('should upload a file successfully', async () => {
      const key = generateTestKey('test-upload.txt');
      const buffer = Buffer.from('Hello, S3!');
      
      const url = await s3Service.upload({
        key,
        body: buffer,
      });
      
      expect(url).toBeTruthy();
      expect(url).toContain(key);
    });

    it('should upload with custom content-type', async () => {
      const key = generateTestKey('test-custom-type.json');
      const buffer = Buffer.from(JSON.stringify({ test: true }));
      
      const url = await s3Service.upload({
        key,
        body: buffer,
        contentType: 'application/json',
      });
      
      expect(url).toBeTruthy();
      
      // Verify content-type
      const metadata = await s3Service.getMetadata(key);
      expect(metadata.contentType).toBe('application/json');
    });

    it('should upload with custom metadata', async () => {
      const key = generateTestKey('test-metadata.txt');
      const buffer = Buffer.from('Test');
      
      await s3Service.upload({
        key,
        body: buffer,
        metadata: {
          userId: TEST_USER_ID,
          testKey: 'testValue',
        },
      });
      
      const metadata = await s3Service.getMetadata(key);
      console.log('Retrieved metadata:', JSON.stringify(metadata.metadata, null, 2));
      expect(metadata.metadata).toBeDefined();
      expect(metadata.metadata?.userId || metadata.metadata?.userid).toBe(TEST_USER_ID);
      expect(metadata.metadata?.testKey || metadata.metadata?.testkey).toBe('testValue');
    });

    it('should auto-detect content-type from extension', async () => {
      const key = generateTestKey('test-image.jpg');
      const buffer = createTestBuffer(1024);
      
      await s3Service.upload({
        key,
        body: buffer,
      });
      
      const metadata = await s3Service.getMetadata(key);
      expect(metadata.contentType).toBe('image/jpeg');
    });

    it('should throw error for invalid key', async () => {
      const buffer = Buffer.from('Test');
      
      await expect(
        s3Service.upload({
          key: '',
          body: buffer,
        })
      ).rejects.toThrow(S3Error);
    });

    it('should throw error for invalid body', async () => {
      const key = generateTestKey('test-invalid-body.txt');
      
      await expect(
        s3Service.upload({
          key,
          body: null as any,
        })
      ).rejects.toThrow(S3Error);
    });
  });

  describe.skipIf(skipTests)('exists()', () => {
    it('should return true for existing file', async () => {
      const key = generateTestKey('test-exists.txt');
      const buffer = Buffer.from('Test');
      
      await s3Service.upload({ key, body: buffer });
      
      const exists = await s3Service.exists(key);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      const key = `${TEST_PREFIX}/non-existing-file.txt`;
      
      const exists = await s3Service.exists(key);
      expect(exists).toBe(false);
    });

    it('should throw error for invalid key', async () => {
      await expect(
        s3Service.exists('')
      ).rejects.toThrow(S3Error);
    });
  });

  describe.skipIf(skipTests)('delete()', () => {
    it('should delete existing file', async () => {
      const key = generateTestKey('test-delete.txt');
      const buffer = Buffer.from('Test');
      
      await s3Service.upload({ key, body: buffer });
      
      // Verify file exists
      let exists = await s3Service.exists(key);
      expect(exists).toBe(true);
      
      // Delete file
      await s3Service.delete(key);
      
      // Verify file deleted
      exists = await s3Service.exists(key);
      expect(exists).toBe(false);
    });

    it('should be idempotent (delete non-existing file)', async () => {
      const key = `${TEST_PREFIX}/non-existing-file.txt`;
      
      // Should not throw error
      await expect(
        s3Service.delete(key)
      ).resolves.not.toThrow();
    });

    it('should throw error for invalid key', async () => {
      await expect(
        s3Service.delete('')
      ).rejects.toThrow(S3Error);
    });
  });

  describe.skipIf(skipTests)('getMetadata()', () => {
    it('should get metadata for existing file', async () => {
      const key = generateTestKey('test-metadata-get.txt');
      const buffer = Buffer.from('Test content');
      
      await s3Service.upload({ key, body: buffer });
      
      const metadata = await s3Service.getMetadata(key);
      
      expect(metadata).toBeDefined();
      expect(metadata.contentType).toBeTruthy();
      expect(metadata.contentLength).toBe(buffer.length);
      expect(metadata.lastModified).toBeInstanceOf(Date);
      expect(metadata.etag).toBeTruthy();
    });

    it('should throw NOT_FOUND for non-existing file', async () => {
      const key = `${TEST_PREFIX}/non-existing-file.txt`;
      
      try {
        await s3Service.getMetadata(key);
        expect.fail('Should have thrown S3Error');
      } catch (error) {
        expect(error).toBeInstanceOf(S3Error);
        expect((error as S3Error).type).toBe(S3ErrorType.NOT_FOUND);
      }
    });

    it('should throw error for invalid key', async () => {
      await expect(
        s3Service.getMetadata('')
      ).rejects.toThrow(S3Error);
    });
  });

  describe.skipIf(skipTests)('getSig() => {
    it('should generate signed URL', async () => {
      const key = generateTestKey('test-signed-url.txt');
      const buffer = Buffer.from('Test');
      
      await s3Service.upload({ key, body: buffer });
      
      const url = await s3Service.getSignedUrl(key, 3600);
      
      expect(url).toBeTruthy();
      expect(url).toContain(key);
      expect(url).toContain('X-Amz-Signature');
    });

    it('should generate URL with custom expiration', async () => {
      const key = generateTestKey('test-signed-url-custom.txt');
      const buffer = Buffer.from('Test');
      
      await s3Service.upload({ key, body: buffer });
      
      const url = await s3Service.getSignedUrl(key, 1800); // 30 minutes
      
      expect(url).toBeTruthy();
      expect(url).toContain('X-Amz-Expires=1800');
    });

    it('should throw error for invalid expiration', async () => {
      const key = generateTestKey('test-signed-url-invalid.txt');
      
      await expect(
        s3Service.getSignedUrl(key, 0)
      ).rejects.toThrow(S3Error);
      
      await expect(
        s3Service.getSignedUrl(key, 700000) // > 7 days
      ).rejects.toThrow(S3Error);
    });

    it('should throw error for invalid key', async () => {
      await expect(
        s3Service.getSignedUrl('', 3600)
      ).rejects.toThrow(S3Error);
    });
  });

  describe('generateKey()', () => {
    it('should generate unique keys', () => {
      const key1 = s3Service.generateKey(TEST_USER_ID, 'test.jpg', 'image');
      const key2 = s3Service.generateKey(TEST_USER_ID, 'test.jpg', 'image');
      
      expect(key1).not.toBe(key2);
      expect(key1).toContain(`users/${TEST_USER_ID}/images/`);
      expect(key1).toMatch(/\.jpg$/);
    });

    it('should generate keys for different types', () => {
      const imageKey = s3Service.generateKey(TEST_USER_ID, 'test.jpg', 'image');
      const videoKey = s3Service.generateKey(TEST_USER_ID, 'test.mp4', 'video');
      
      expect(imageKey).toContain('/images/');
      expect(videoKey).toContain('/videos/');
    });

    it('should sanitize file extensions', () => {
      const key = s3Service.generateKey(TEST_USER_ID, 'test.JPG', 'image');
      
      expect(key).toMatch(/\.jpg$/);
    });
  });

  describe('extractKeyFromUrl()', () => {
    it('should extract key from CDN URL', () => {
      const key = 'users/123/images/avatar.jpg';
      const url = `https://cdn.example.com/${key}`;
      
      const extracted = s3Service.extractKeyFromUrl(url);
      
      expect(extracted).toBe(key);
    });

    it('should handle URLs with query parameters', () => {
      const key = 'users/123/images/avatar.jpg';
      const url = `https://cdn.example.com/${key}?v=123`;
      
      const extracted = s3Service.extractKeyFromUrl(url);
      
      expect(extracted).toBe(key);
    });

    it('should return input for invalid URLs', () => {
      const invalidUrl = 'not-a-url';
      
      const extracted = s3Service.extractKeyFromUrl(invalidUrl);
      
      expect(extracted).toBe(invalidUrl);
    });
  });

  describe('Error Handling', () => {
    it('should include correlation ID in errors', async () => {
      try {
        await s3Service.upload({
          key: '',
          body: Buffer.from('Test'),
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(S3Error);
        expect((error as S3Error).correlationId).toBeTruthy();
      }
    });

    it('should mark retryable errors correctly', async () => {
      // This test would require mocking AWS SDK to simulate retryable errors
      // For now, we just verify the error structure
      try {
        await s3Service.upload({
          key: '',
          body: Buffer.from('Test'),
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(S3Error);
        expect((error as S3Error).retryable).toBeDefined();
      }
    });

    it('should include metadata in errors', async () => {
      try {
        await s3Service.upload({
          key: '',
          body: Buffer.from('Test'),
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(S3Error);
        expect((error as S3Error).metadata).toBeDefined();
      }
    });
  });

  describe('Performance', () => {
    it('should upload small file quickly (< 1s)', async () => {
      const key = generateTestKey('test-perf-small.txt');
      const buffer = createTestBuffer(1024); // 1KB
      
      const start = Date.now();
      await s3Service.upload({ key, body: buffer });
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent uploads', async () => {
      const uploads = Array.from({ length: 5 }, (_, i) => ({
        key: generateTestKey(`test-concurrent-${i}.txt`),
        buffer: createTestBuffer(1024),
      }));
      
      const start = Date.now();
      
      await Promise.all(
        uploads.map(({ key, buffer }) =>
          s3Service.upload({ key, body: buffer })
        )
      );
      
      const duration = Date.now() - start;
      
      // Should complete in reasonable time (< 5s for 5 files)
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Cache Control', () => {
    it('should set immutable cache for hashed files', async () => {
      const key = generateTestKey('test.abc12345.js');
      const buffer = Buffer.from('console.log("test")');
      
      await s3Service.upload({ key, body: buffer });
      
      const metadata = await s3Service.getMetadata(key);
      expect(metadata.cacheControl).toContain('immutable');
    });

    it('should set long cache for images', async () => {
      const key = generateTestKey('test-image.jpg');
      const buffer = createTestBuffer(1024);
      
      await s3Service.upload({ key, body: buffer });
      
      const metadata = await s3Service.getMetadata(key);
      expect(metadata.cacheControl).toContain('max-age=2592000'); // 30 days
    });

    it('should set short cache for HTML', async () => {
      const key = generateTestKey('test.html');
      const buffer = Buffer.from('<html></html>');
      
      await s3Service.upload({ key, body: buffer });
      
      const metadata = await s3Service.getMetadata(key);
      expect(metadata.cacheControl).toContain('max-age=3600'); // 1 hour
    });
  });
});
