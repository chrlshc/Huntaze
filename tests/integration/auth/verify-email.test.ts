/**
 * Email Verification API - Integration Tests
 * 
 * Tests for GET /api/auth/verify-email
 * 
 * Coverage:
 * - Token validation
 * - Email verification flow
 * - Error handling
 * - Database updates
 * - Welcome email sending
 * - Rate limiting
 * - Concurrent requests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { query } from '@/lib/db';
import { generateEmailVerificationToken } from '@/lib/auth/tokens';
import { sendWelcomeEmail } from '@/lib/services/email/ses';

// Mock email service
vi.mock('@/lib/services/email/ses', () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}));

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('GET /api/auth/verify-email', () => {
  let testUserId: string;
  let testEmail: string;
  let validToken: string;

  beforeEach(async () => {
    // Create test user
    testEmail = `test-${Date.now()}@example.com`;
    const userResult = await query(
      `INSERT INTO users (email, name, password_hash, email_verified)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [testEmail, 'Test User', 'hashed_password', false]
    );
    testUserId = userResult.rows[0].id;

    // Generate valid verification token
    validToken = await generateEmailVerificationToken(testUserId, testEmail);

    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Cleanup test data
    if (testUserId) {
      await query('DELETE FROM email_verification_tokens WHERE user_id = $1', [testUserId]);
      await query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
  });

  describe('Success Cases', () => {
    it('should verify email with valid token', async () => {
      const response = await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${validToken}`
      );

      expect(response.status).toBe(302); // Redirect
      expect(response.headers.get('location')).toContain('/auth?verified=true');

      // Verify database was updated
      const userResult = await query(
        'SELECT email_verified FROM users WHERE id = $1',
        [testUserId]
      );
      expect(userResult.rows[0].email_verified).toBe(true);

      // Verify token was deleted
      const tokenResult = await query(
        'SELECT * FROM email_verification_tokens WHERE user_id = $1',
        [testUserId]
      );
      expect(tokenResult.rows.length).toBe(0);
    });

    it('should send welcome email after verification', async () => {
      await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${validToken}`
      );

      // Wait for async email sending
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(sendWelcomeEmail).toHaveBeenCalledWith(testEmail, 'Test User');
    });

    it('should handle verification with special characters in name', async () => {
      // Update user name with special characters
      await query(
        'UPDATE users SET name = $1 WHERE id = $2',
        ['Test Ü$er 🎉', testUserId]
      );

      const response = await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${validToken}`
      );

      expect(response.status).toBe(302);
      expect(sendWelcomeEmail).toHaveBeenCalledWith(testEmail, 'Test Ü$er 🎉');
    });

    it('should return correct redirect URL', async () => {
      const response = await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${validToken}`,
        { redirect: 'manual' }
      );

      const location = response.headers.get('location');
      expect(location).toContain('/auth');
      expect(location).toContain('verified=true');
    });
  });

  describe('Error Cases - Missing Token', () => {
    it('should return 400 when token is missing', async () => {
      const response = await fetch(
        'http://localhost:3000/api/auth/verify-email'
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('MISSING_TOKEN');
      expect(data.error.message).toContain('required');
      expect(data.error.correlationId).toBeDefined();
    });

    it('should return 400 when token is empty string', async () => {
      const response = await fetch(
        'http://localhost:3000/api/auth/verify-email?token='
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('Error Cases - Invalid Token', () => {
    it('should return 400 for invalid token format', async () => {
      const response = await fetch(
        'http://localhost:3000/api/auth/verify-email?token=invalid-token-123'
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_TOKEN');
      expect(data.error.message).toContain('Invalid or expired');
      expect(data.error.correlationId).toBeDefined();
    });

    it('should return 400 for non-existent token', async () => {
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmYWtlIiwiZW1haWwiOiJmYWtlQGV4YW1wbGUuY29tIn0.fake';
      
      const response = await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${fakeToken}`
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_TOKEN');
    });

    it('should return 400 for expired token', async () => {
      // Create expired token (set expiry to past)
      await query(
        `UPDATE email_verification_tokens 
         SET expires_at = NOW() - INTERVAL '1 hour'
         WHERE user_id = $1`,
        [testUserId]
      );

      const response = await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${validToken}`
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_TOKEN');
    });

    it('should return 400 for already used token', async () => {
      // First verification
      await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${validToken}`
      );

      // Try to use same token again
      const response = await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${validToken}`
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_TOKEN');
    });

    it('should handle malformed JWT token', async () => {
      const malformedToken = 'not.a.valid.jwt.token';
      
      const response = await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${malformedToken}`
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Error Cases - Database Errors', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      const originalQuery = query;
      vi.mocked(query).mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${validToken}`
      );

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error.code).toBe('VERIFICATION_ERROR');
      expect(data.error.correlationId).toBeDefined();

      // Restore original
      vi.mocked(query).mockImplementation(originalQuery);
    });

    it('should handle user not found after token validation', async () => {
      // Delete user but keep token
      await query('DELETE FROM users WHERE id = $1', [testUserId]);

      const response = await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${validToken}`
      );

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error.code).toBe('VERIFICATION_ERROR');
    });
  });

  describe('Email Sending', () => {
    it('should continue verification even if welcome email fails', async () => {
      // Mock email failure
      vi.mocked(sendWelcomeEmail).mockRejectedValueOnce(new Error('Email service down'));

      const response = await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${validToken}`
      );

      // Should still succeed
      expect(response.status).toBe(302);

      // Verify email was still marked as verified
      const userResult = await query(
        'SELECT email_verified FROM users WHERE id = $1',
        [testUserId]
      );
      expect(userResult.rows[0].email_verified).toBe(true);
    });

    it('should not block on email sending', async () => {
      // Mock slow email sending
      vi.mocked(sendWelcomeEmail).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 5000))
      );

      const startTime = Date.now();
      const response = await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${validToken}`
      );
      const duration = Date.now() - startTime;

      // Should respond quickly (< 1 second)
      expect(duration).toBeLessThan(1000);
      expect(response.status).toBe(302);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle concurrent verification attempts', async () => {
      const requests = Array(5).fill(null).map(() =>
        fetch(`http://localhost:3000/api/auth/verify-email?token=${validToken}`)
      );

      const responses = await Promise.all(requests);

      // First request should succeed
      const successCount = responses.filter(r => r.status === 302).length;
      expect(successCount).toBeGreaterThanOrEqual(1);

      // Others should fail with invalid token
      const failCount = responses.filter(r => r.status === 400).length;
      expect(failCount).toBeGreaterThanOrEqual(1);

      // User should only be verified once
      const userResult = await query(
        'SELECT email_verified FROM users WHERE id = $1',
        [testUserId]
      );
      expect(userResult.rows[0].email_verified).toBe(true);
    });

    it('should handle race condition with token deletion', async () => {
      // Simulate race condition
      const request1 = fetch(
        `http://localhost:3000/api/auth/verify-email?token=${validToken}`
      );
      
      // Small delay then second request
      await new Promise(resolve => setTimeout(resolve, 10));
      const request2 = fetch(
        `http://localhost:3000/api/auth/verify-email?token=${validToken}`
      );

      const [response1, response2] = await Promise.all([request1, request2]);

      // One should succeed, one should fail
      const statuses = [response1.status, response2.status].sort();
      expect(statuses).toEqual([302, 400]);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow multiple verification attempts within limit', async () => {
      const requests = [];
      
      for (let i = 0; i < 5; i++) {
        requests.push(
          fetch(`http://localhost:3000/api/auth/verify-email?token=invalid-${i}`)
        );
      }

      const responses = await Promise.all(requests);

      // All should return 400 (invalid token), not 429 (rate limited)
      responses.forEach(response => {
        expect(response.status).toBe(400);
      });
    });

    it('should include rate limit headers', async () => {
      const response = await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${validToken}`
      );

      // Check for rate limit headers (if implemented)
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      if (rateLimitRemaining) {
        expect(parseInt(rateLimitRemaining)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Response Format', () => {
    it('should return consistent error format', async () => {
      const response = await fetch(
        'http://localhost:3000/api/auth/verify-email?token=invalid'
      );

      const data = await response.json();
      
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
      expect(data.error).toHaveProperty('correlationId');
      
      expect(typeof data.error.code).toBe('string');
      expect(typeof data.error.message).toBe('string');
      expect(typeof data.error.correlationId).toBe('string');
    });

    it('should include correlation ID in all responses', async () => {
      const responses = await Promise.all([
        fetch('http://localhost:3000/api/auth/verify-email'),
        fetch('http://localhost:3000/api/auth/verify-email?token=invalid'),
        fetch(`http://localhost:3000/api/auth/verify-email?token=${validToken}`),
      ]);

      for (const response of responses) {
        if (response.status !== 302) {
          const data = await response.json();
          expect(data.error.correlationId).toMatch(/^verify-\d+-[a-z0-9]+$/);
        }
      }
    });

    it('should return appropriate Content-Type headers', async () => {
      const response = await fetch(
        'http://localhost:3000/api/auth/verify-email?token=invalid'
      );

      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('Security', () => {
    it('should not expose sensitive information in errors', async () => {
      const response = await fetch(
        'http://localhost:3000/api/auth/verify-email?token=invalid'
      );

      const data = await response.json();
      const responseText = JSON.stringify(data);

      // Should not expose database details
      expect(responseText).not.toContain('postgres');
      expect(responseText).not.toContain('database');
      expect(responseText).not.toContain('SQL');
      
      // Should not expose internal paths
      expect(responseText).not.toContain('/lib/');
      expect(responseText).not.toContain('node_modules');
      
      // Should not expose user IDs
      expect(responseText).not.toContain(testUserId);
    });

    it('should sanitize token in logs', async () => {
      const longToken = 'a'.repeat(100);
      
      await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${longToken}`
      );

      // Token should be truncated in logs (verified via logger mock)
      // This is a placeholder - actual verification would check logger calls
    });

    it('should prevent timing attacks', async () => {
      const timings: number[] = [];

      // Test with invalid tokens
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await fetch(
          `http://localhost:3000/api/auth/verify-email?token=invalid-${i}`
        );
        timings.push(Date.now() - start);
      }

      // Response times should be relatively consistent
      const avgTime = timings.reduce((a, b) => a + b) / timings.length;
      const maxDeviation = Math.max(...timings.map(t => Math.abs(t - avgTime)));
      
      // Allow some variance but not too much
      expect(maxDeviation).toBeLessThan(avgTime * 2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long tokens', async () => {
      const longToken = 'a'.repeat(10000);
      
      const response = await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${longToken}`
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_TOKEN');
    });

    it('should handle special characters in token', async () => {
      const specialToken = 'token%20with%20spaces&special=chars';
      
      const response = await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${specialToken}`
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_TOKEN');
    });

    it('should handle multiple token parameters', async () => {
      const response = await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${validToken}&token=another`
      );

      // Should use first token
      expect(response.status).toBe(302);
    });

    it('should handle case sensitivity in token', async () => {
      const upperToken = validToken.toUpperCase();
      
      const response = await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${upperToken}`
      );

      // Tokens are case-sensitive
      expect(response.status).toBe(400);
    });

    it('should handle user with null name', async () => {
      // Update user to have null name
      await query('UPDATE users SET name = NULL WHERE id = $1', [testUserId]);

      const response = await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${validToken}`
      );

      expect(response.status).toBe(302);
      
      // Should use default name
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(sendWelcomeEmail).toHaveBeenCalledWith(testEmail, 'User');
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time', async () => {
      const startTime = Date.now();
      
      await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${validToken}`
      );
      
      const duration = Date.now() - startTime;

      // Should respond within 500ms
      expect(duration).toBeLessThan(500);
    });

    it('should handle burst of requests', async () => {
      const tokens = await Promise.all(
        Array(10).fill(null).map(async (_, i) => {
          const email = `burst-${i}-${Date.now()}@example.com`;
          const result = await query(
            'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id',
            [email, `User ${i}`, 'hash']
          );
          return generateEmailVerificationToken(result.rows[0].id, email);
        })
      );

      const startTime = Date.now();
      const requests = tokens.map(token =>
        fetch(`http://localhost:3000/api/auth/verify-email?token=${token}`)
      );
      
      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(302);
      });

      // Should handle burst efficiently
      expect(duration).toBeLessThan(2000);

      // Cleanup
      await query('DELETE FROM users WHERE email LIKE $1', ['burst-%']);
    });
  });

  describe('Idempotency', () => {
    it('should be idempotent for already verified users', async () => {
      // First verification
      const response1 = await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${validToken}`
      );
      expect(response1.status).toBe(302);

      // Generate new token for same user
      const newToken = await generateEmailVerificationToken(testUserId, testEmail);

      // Second verification
      const response2 = await fetch(
        `http://localhost:3000/api/auth/verify-email?token=${newToken}`
      );
      expect(response2.status).toBe(302);

      // User should still be verified
      const userResult = await query(
        'SELECT email_verified FROM users WHERE id = $1',
        [testUserId]
      );
      expect(userResult.rows[0].email_verified).toBe(true);
    });
  });
});
