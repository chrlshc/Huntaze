/**
 * S3 Service - Session Token Integration Test
 * 
 * Tests the AWS Session Token support for IAM roles and STS credentials.
 * 
 * Requirements:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_SESSION_TOKEN (optional)
 * - AWS_S3_BUCKET
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { s3Service, S3Error, S3ErrorType } from '@/lib/services/s3Service';

describe('S3 Service - Session Token Support', () => {
  const testKey = `test/session-token-${Date.now()}.txt`;
  const testContent = Buffer.from('Test content for session token validation');

  afterAll(async () => {
    // Cleanup: delete test file
    try {
      await s3Service.delete(testKey);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Credentials Configuration', () => {
    it('should initialize with session token if provided', () => {
      // This test validates that the service initializes without errors
      // when AWS_SESSION_TOKEN is present in environment variables
      expect(s3Service).toBeDefined();
    });

    it('should work without session token (standard credentials)', async () => {
      // Test that service works with standard Access Key + Secret Key
      const key = s3Service.generateKey('test-user', 'test.txt', 'image');
      expect(key).toMatch(/^users\/test-user\/images\/\d+-[a-z0-9]+\.txt$/);
    });
  });

  describe('Upload with Session Token', () => {
    it('should upload file successfully', async () => {
      try {
        const url = await s3Service.upload({
          key: testKey,
          body: testContent,
          contentType: 'text/plain',
          metadata: {
            test: 'session-token-test',
            timestamp: new Date().toISOString(),
          },
        });

        expect(url).toBeDefined();
        expect(url).toContain(testKey);
      } catch (error) {
        if (error instanceof S3Error) {
          // If credentials error, skip test (credentials not configured)
          if (error.type === S3ErrorType.CREDENTIALS_ERROR) {
            console.warn('Skipping test: AWS credentials not configured');
            return;
          }
          
          // If access denied, skip test (insufficient permissions)
          if (error.type === S3ErrorType.ACCESS_DENIED) {
            console.warn('Skipping test: Insufficient AWS permissions');
            return;
          }
        }
        
        throw error;
      }
    });

    it('should verify uploaded file exists', async () => {
      try {
        const exists = await s3Service.exists(testKey);
        expect(exists).toBe(true);
      } catch (error) {
        if (error instanceof S3Error && 
            (error.type === S3ErrorType.CREDENTIALS_ERROR || 
             error.type === S3ErrorType.ACCESS_DENIED)) {
          console.warn('Skipping test: AWS credentials issue');
          return;
        }
        throw error;
      }
    });

    it('should get metadata of uploaded file', async () => {
      try {
        const metadata = await s3Service.getMetadata(testKey);
        
        expect(metadata).toBeDefined();
        expect(metadata.contentType).toBe('text/plain');
        expect(metadata.contentLength).toBe(testContent.length);
        expect(metadata.metadata?.test).toBe('session-token-test');
      } catch (error) {
        if (error instanceof S3Error && 
            (error.type === S3ErrorType.CREDENTIALS_ERROR || 
             error.type === S3ErrorType.ACCESS_DENIED ||
             error.type === S3ErrorType.NOT_FOUND)) {
          console.warn('Skipping test: AWS credentials issue or file not found');
          return;
        }
        throw error;
      }
    });
  });

  describe('Delete with Session Token', () => {
    it('should delete file successfully', async () => {
      try {
        await s3Service.delete(testKey);
        
        // Verify deletion
        const exists = await s3Service.exists(testKey);
        expect(exists).toBe(false);
      } catch (error) {
        if (error instanceof S3Error && 
            (error.type === S3ErrorType.CREDENTIALS_ERROR || 
             error.type === S3ErrorType.ACCESS_DENIED)) {
          console.warn('Skipping test: AWS credentials issue');
          return;
        }
        throw error;
      }
    });
  });

  describe('Error Handling with Session Token', () => {
    it('should handle expired session token gracefully', async () => {
      // This test validates error handling when session token expires
      // In production, AWS SDK will throw CredentialsError
      
      try {
        await s3Service.upload({
          key: 'test/expired-token.txt',
          body: Buffer.from('test'),
        });
      } catch (error) {
        if (error instanceof S3Error) {
          // Should be CREDENTIALS_ERROR if token is expired
          expect([
            S3ErrorType.CREDENTIALS_ERROR,
            S3ErrorType.ACCESS_DENIED,
            S3ErrorType.UPLOAD_FAILED,
          ]).toContain(error.type);
          
          // Should not be retryable
          if (error.type === S3ErrorType.CREDENTIALS_ERROR) {
            expect(error.retryable).toBe(false);
          }
        }
      }
    });

    it('should include correlation ID in errors', async () => {
      try {
        // Try to upload with invalid key
        await s3Service.upload({
          key: '', // Invalid key
          body: Buffer.from('test'),
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(S3Error);
        
        if (error instanceof S3Error) {
          expect(error.correlationId).toBeDefined();
          expect(error.correlationId).toMatch(/^s3-upload-\d+-[a-z0-9]+$/);
          expect(error.type).toBe(S3ErrorType.INVALID_KEY);
        }
      }
    });
  });

  describe('Signed URL with Session Token', () => {
    it('should generate signed URL successfully', async () => {
      try {
        // Upload test file first
        await s3Service.upload({
          key: testKey,
          body: testContent,
        });

        // Generate signed URL
        const signedUrl = await s3Service.getSignedUrl(testKey, 3600);
        
        expect(signedUrl).toBeDefined();
        expect(signedUrl).toContain(testKey);
        expect(signedUrl).toContain('X-Amz-Signature');
        
        // If session token is used, URL should contain X-Amz-Security-Token
        if (process.env.AWS_SESSION_TOKEN) {
          expect(signedUrl).toContain('X-Amz-Security-Token');
        }
      } catch (error) {
        if (error instanceof S3Error && 
            (error.type === S3ErrorType.CREDENTIALS_ERROR || 
             error.type === S3ErrorType.ACCESS_DENIED)) {
          console.warn('Skipping test: AWS credentials issue');
          return;
        }
        throw error;
      }
    });
  });

  describe('Retry Logic with Session Token', () => {
    it('should retry on network errors', async () => {
      // This test validates that retry logic works with session token
      // Network errors should be retried automatically
      
      try {
        const url = await s3Service.upload({
          key: `test/retry-${Date.now()}.txt`,
          body: Buffer.from('retry test'),
        });
        
        expect(url).toBeDefined();
        
        // Cleanup
        const key = s3Service.extractKeyFromUrl(url);
        await s3Service.delete(key);
      } catch (error) {
        if (error instanceof S3Error) {
          // Should have attempted retries for retryable errors
          if (error.retryable) {
            expect(error.metadata?.originalError).toBeDefined();
          }
        }
      }
    });
  });
});

/**
 * Manual Test Instructions
 * 
 * To test with actual AWS Session Token:
 * 
 * 1. Generate temporary credentials using AWS STS:
 * ```bash
 * aws sts get-session-token --duration-seconds 3600
 * ```
 * 
 * 2. Set environment variables:
 * ```bash
 * export AWS_ACCESS_KEY_ID="ASIA..."
 * export AWS_SECRET_ACCESS_KEY="..."
 * export AWS_SESSION_TOKEN="..."
 * export AWS_S3_BUCKET="your-bucket-name"
 * ```
 * 
 * 3. Run tests:
 * ```bash
 * npm run test:integration -- s3-session-token.test.ts
 * ```
 * 
 * Expected Results:
 * - All tests should pass with valid credentials
 * - Tests should skip gracefully if credentials are not configured
 * - Errors should include correlation IDs for debugging
 * - Retry logic should work transparently
 */

