import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testClient, APIResponseHelper } from '../setup/test-client';
import { cleanupDatabase, seedTestData, TestFixtures } from '../setup/database-helpers';

describe('Authentication Security Regression Tests', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterEach(async () => {
    await cleanupDatabase();
  });

  describe('Password Security Regression', () => {
    it('should prevent password hash exposure in API responses', async () => {
      // Regression test for accidentally exposing password hashes
      const user = await TestFixtures.createActiveUser({
        email: 'security@test.com',
        password: 'SecurePass123',
      });

      const signinResponse = await testClient.post('/api/auth/signin', {
        email: 'security@test.com',
        password: 'SecurePass123',
      });

      const signinData = await APIResponseHelper.expectSuccess(signinResponse);

      // Ensure password hash is never exposed
      expect(signinData.user).not.toHaveProperty('passwordHash');
      expect(signinData.user).not.toHaveProperty('password');
      expect(JSON.stringify(signinData)).not.toContain('$2a$');
      expect(JSON.stringify(signinData)).not.toContain('$2b$');
    });

    it('should enforce minimum password strength requirements', async () => {
      // Regression test for weak password acceptance
      const weakPasswords = [
        'password',      // Common password
        '12345678',      // Only numbers
        'abcdefgh',      // Only lowercase
        'ABCDEFGH',      // Only uppercase
        'Pass123',       // Too short
        'password123',   // No uppercase
        'PASSWORD123',   // No lowercase
        'Password',      // No numbers
      ];

      for (const weakPassword of weakPasswords) {
        const response = await testClient.post('/api/auth/signup', {
          name: 'Weak Password Test',
          email: `weak${Date.now()}@test.com`,
          password: weakPassword,
          acceptTerms: true,
        });

        await APIResponseHelper.expectValidationError(response);
      }
    });

    it('should use secure password hashing with proper cost factor', async () => {
      // Regression test for weak password hashing
      const response = await testClient.post('/api/auth/signup', {
        name: 'Hash Test User',
        email: 'hashtest@example.com',
        password: 'SecurePass123',
        acceptTerms: true,
      });

      await APIResponseHelper.expectSuccess(response, 201);

      // Verify password is hashed with bcrypt and proper cost factor
      const user = await testClient.get('/api/test/users/hashtest@example.com');
      const userData = await user.json();

      expect(userData.passwordHash).toMatch(/^\$2[ab]\$12\$/); // bcrypt with cost 12
      expect(userData.passwordHash).not.toBe('SecurePass123');
    });
  });

  describe('Session Security Regression', () => {
    it('should set secure cookie attributes in production', async () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        const user = await TestFixtures.createActiveUser({
          email: 'cookie@test.com',
          password: 'SecurePass123',
        });

        const response = await testClient.post('/api/auth/signin', {
          email: 'cookie@test.com',
          password: 'SecurePass123',
        });

        expect(response.status).toBe(200);

        const setCookieHeader = response.headers.get('Set-Cookie');
        expect(setCookieHeader).toContain('HttpOnly');
        expect(setCookieHeader).toContain('Secure');
        expect(setCookieHeader).toContain('SameSite=Strict');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should generate cryptographically secure tokens', async () => {
      // Regression test for predictable token generation
      const user = await TestFixtures.createActiveUser({
        email: 'token@test.com',
        password: 'SecurePass123',
      });

      const tokens = [];
      
      // Generate multiple tokens
      for (let i = 0; i < 10; i++) {
        const response = await testClient.post('/api/auth/signin', {
          email: 'token@test.com',
          password: 'SecurePass123',
        });

        const data = await response.json();
        tokens.push(data.accessToken);
      }

      // Ensure all tokens are unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);

      // Ensure tokens are not predictable (basic entropy check)
      tokens.forEach(token => {
        expect(token.length).toBeGreaterThan(20);
        expect(token).toMatch(/^[A-Za-z0-9._-]+$/); // JWT format
      });
    });

    it('should properly expire and invalidate tokens', async () => {
      // Regression test for token expiration issues
      const user = await TestFixtures.createActiveUser({
        email: 'expire@test.com',
        password: 'SecurePass123',
      });

      const signinResponse = await testClient.post('/api/auth/signin', {
        email: 'expire@test.com',
        password: 'SecurePass123',
      });

      const { accessToken } = await signinResponse.json();

      // Mock expired token by manipulating JWT (in real scenario, wait for expiration)
      const expiredToken = accessToken.replace(/\./g, '.expired.');

      const protectedResponse = await testClient.get('/api/user/profile', {
        headers: { Authorization: `Bearer ${expiredToken}` },
      });

      await APIResponseHelper.expectAuthenticationError(protectedResponse);
    });
  });

  describe('Rate Limiting Regression', () => {
    it('should enforce rate limits on signin attempts', async () => {
      // Regression test for rate limiting bypass
      const attempts = [];
      
      for (let i = 0; i < 6; i++) {
        attempts.push(
          testClient.post('/api/auth/signin', {
            email: 'nonexistent@test.com',
            password: 'wrongpassword',
          })
        );
      }

      const responses = await Promise.all(attempts);

      // First few should be 401 (invalid credentials)
      expect(responses[0].status).toBe(401);
      expect(responses[1].status).toBe(401);
      expect(responses[2].status).toBe(401);

      // Later attempts should be rate limited
      const rateLimitedResponses = responses.slice(3);
      const hasRateLimit = rateLimitedResponses.some(r => r.status === 429);
      expect(hasRateLimit).toBe(true);
    });

    it('should enforce rate limits on signup attempts', async () => {
      // Regression test for signup rate limiting
      const signupAttempts = [];
      
      for (let i = 0; i < 10; i++) {
        signupAttempts.push(
          testClient.post('/api/auth/signup', {
            name: `Spam User ${i}`,
            email: `spam${i}@test.com`,
            password: 'SecurePass123',
            acceptTerms: true,
          })
        );
      }

      const responses = await Promise.all(signupAttempts);

      // Should have some rate limited responses
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    });

    it('should reset rate limits after time window', async () => {
      // Make initial requests to trigger rate limit
      for (let i = 0; i < 5; i++) {
        await testClient.post('/api/auth/signin', {
          email: 'ratelimit@test.com',
          password: 'wrongpassword',
        });
      }

      // Next request should be rate limited
      const rateLimitedResponse = await testClient.post('/api/auth/signin', {
        email: 'ratelimit@test.com',
        password: 'wrongpassword',
      });

      expect(rateLimitedResponse.status).toBe(429);

      // Mock time passage (in real scenario, wait for window reset)
      // This would require mocking the rate limiter's time source
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Should be able to make requests again after reset
      const afterResetResponse = await testClient.post('/api/auth/signin', {
        email: 'ratelimit@test.com',
        password: 'wrongpassword',
      });

      // Should get 401 (invalid credentials) instead of 429 (rate limited)
      expect(afterResetResponse.status).toBe(401);
    });
  });

  describe('Input Validation Regression', () => {
    it('should prevent SQL injection in email field', async () => {
      // Regression test for SQL injection vulnerabilities
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin@test.com'; UPDATE users SET isActive=false; --",
        "test@test.com' UNION SELECT * FROM users --",
      ];

      for (const maliciousEmail of sqlInjectionAttempts) {
        const response = await testClient.post('/api/auth/signin', {
          email: maliciousEmail,
          password: 'password123',
        });

        // Should either be validation error or authentication error, never succeed
        expect([400, 401]).toContain(response.status);
      }
    });

    it('should prevent XSS in user input fields', async () => {
      // Regression test for XSS vulnerabilities
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '"><script>alert(document.cookie)</script>',
      ];

      for (const payload of xssPayloads) {
        const response = await testClient.post('/api/auth/signup', {
          name: payload,
          email: 'xss@test.com',
          password: 'SecurePass123',
          acceptTerms: true,
        });

        if (response.ok) {
          const data = await response.json();
          // Ensure payload is sanitized
          expect(data.user.name).not.toContain('<script>');
          expect(data.user.name).not.toContain('javascript:');
          expect(data.user.name).not.toContain('onerror');
        }
      }
    });

    it('should validate email format strictly', async () => {
      // Regression test for loose email validation
      const invalidEmails = [
        'plainaddress',
        '@missingdomain.com',
        'missing@.com',
        'missing@domain',
        'spaces @domain.com',
        'multiple@@domain.com',
        'trailing.dot.@domain.com',
        '.leading.dot@domain.com',
      ];

      for (const invalidEmail of invalidEmails) {
        const response = await testClient.post('/api/auth/signup', {
          name: 'Test User',
          email: invalidEmail,
          password: 'SecurePass123',
          acceptTerms: true,
        });

        await APIResponseHelper.expectValidationError(response);
      }
    });
  });

  describe('Authorization Regression', () => {
    it('should prevent privilege escalation through user creation', async () => {
      // Regression test for privilege escalation
      const response = await testClient.post('/api/auth/signup', {
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'SecurePass123',
        acceptTerms: true,
        role: 'admin', // Attempt to set admin role
        isActive: true,
        subscription: 'enterprise',
      });

      if (response.ok) {
        const data = await response.json();
        // Should not allow setting privileged fields
        expect(data.user.role).not.toBe('admin');
        expect(data.user.subscription).toBe('free'); // Should default to free
      }
    });

    it('should prevent account takeover through email change', async () => {
      // Create two users
      const user1 = await TestFixtures.createActiveUser({
        email: 'user1@test.com',
        password: 'password123',
      });

      const user2 = await TestFixtures.createActiveUser({
        email: 'user2@test.com',
        password: 'password123',
      });

      // Sign in as user1
      const signinResponse = await testClient.post('/api/auth/signin', {
        email: 'user1@test.com',
        password: 'password123',
      });

      const { accessToken } = await signinResponse.json();

      // Attempt to change email to user2's email
      const updateResponse = await testClient.patch('/api/user/profile', {
        email: 'user2@test.com',
      }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Should prevent email conflict
      expect([400, 409]).toContain(updateResponse.status);
    });
  });

  describe('Session Management Regression', () => {
    it('should prevent session fixation attacks', async () => {
      // Regression test for session fixation
      const user = await TestFixtures.createActiveUser({
        email: 'session@test.com',
        password: 'SecurePass123',
      });

      // Get initial session
      const initialResponse = await testClient.post('/api/auth/signin', {
        email: 'session@test.com',
        password: 'SecurePass123',
      });

      const { accessToken: token1 } = await initialResponse.json();

      // Sign in again
      const secondResponse = await testClient.post('/api/auth/signin', {
        email: 'session@test.com',
        password: 'SecurePass123',
      });

      const { accessToken: token2 } = await secondResponse.json();

      // Tokens should be different (new session created)
      expect(token1).not.toBe(token2);
    });

    it('should handle concurrent sessions properly', async () => {
      // Regression test for concurrent session issues
      const user = await TestFixtures.createActiveUser({
        email: 'concurrent@test.com',
        password: 'SecurePass123',
      });

      // Create multiple concurrent sessions
      const sessionPromises = Array(5).fill(null).map(() =>
        testClient.post('/api/auth/signin', {
          email: 'concurrent@test.com',
          password: 'SecurePass123',
        })
      );

      const responses = await Promise.all(sessionPromises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // All tokens should be unique
      const tokens = await Promise.all(
        responses.map(r => r.json().then(data => data.accessToken))
      );

      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);
    });
  });

  describe('Data Leakage Regression', () => {
    it('should not expose sensitive data in error messages', async () => {
      // Regression test for information disclosure
      const response = await testClient.post('/api/auth/signin', {
        email: 'nonexistent@test.com',
        password: 'wrongpassword',
      });

      const errorData = await response.json();

      // Should not reveal whether email exists
      expect(errorData.error).toBe('Invalid credentials');
      expect(errorData.error).not.toContain('email not found');
      expect(errorData.error).not.toContain('user does not exist');
      expect(errorData.error).not.toContain('wrong password');
    });

    it('should not expose user enumeration through timing attacks', async () => {
      // Create a user
      await TestFixtures.createActiveUser({
        email: 'existing@test.com',
        password: 'SecurePass123',
      });

      // Measure response times
      const timings = [];

      // Test with existing user
      const start1 = Date.now();
      await testClient.post('/api/auth/signin', {
        email: 'existing@test.com',
        password: 'wrongpassword',
      });
      timings.push(Date.now() - start1);

      // Test with non-existing user
      const start2 = Date.now();
      await testClient.post('/api/auth/signin', {
        email: 'nonexistent@test.com',
        password: 'wrongpassword',
      });
      timings.push(Date.now() - start2);

      // Response times should be similar (within reasonable variance)
      const [existingTime, nonExistentTime] = timings;
      const timeDifference = Math.abs(existingTime - nonExistentTime);
      
      // Allow for some variance but prevent obvious timing attacks
      expect(timeDifference).toBeLessThan(1000); // 1 second max difference
    });
  });

  describe('CSRF Protection Regression', () => {
    it('should validate CSRF tokens on state-changing operations', async () => {
      // This test would verify CSRF protection is in place
      // Implementation depends on CSRF token mechanism used
      
      const response = await testClient.post('/api/auth/signup', {
        name: 'CSRF Test',
        email: 'csrf@test.com',
        password: 'SecurePass123',
        acceptTerms: true,
      }, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest', // Missing CSRF token
        },
      });

      // Should require proper CSRF protection
      // Exact implementation depends on CSRF strategy
      expect([400, 403]).toContain(response.status);
    });
  });
});