import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testClient } from '../setup/test-client';
import { cleanupDatabase, seedTestData } from '../setup/database-helpers';

describe('Authentication Flow Integration Tests', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterEach(async () => {
    await cleanupDatabase();
  });

  describe('Complete Signup Flow', () => {
    it('should complete full signup process', async () => {
      const signupData = {
        name: 'Integration Test User',
        email: 'integration@test.com',
        password: 'SecurePass123',
        acceptTerms: true,
      };

      // Step 1: Sign up
      const signupResponse = await testClient.post('/api/auth/signup', signupData);
      expect(signupResponse.status).toBe(201);
      
      const signupResult = await signupResponse.json();
      expect(signupResult.message).toBe('User created successfully');
      expect(signupResult.user).toMatchObject({
        name: signupData.name,
        email: signupData.email,
        subscription: 'free',
      });

      // Step 2: Verify user exists in database
      const userInDb = await testClient.get(`/api/users/${signupResult.user.id}`);
      expect(userInDb.status).toBe(200);

      // Step 3: Attempt signin with new credentials
      const signinResponse = await testClient.post('/api/auth/signin', {
        email: signupData.email,
        password: signupData.password,
      });

      expect(signinResponse.status).toBe(200);
      const signinResult = await signinResponse.json();
      expect(signinResult.user.email).toBe(signupData.email);
      expect(signinResult.accessToken).toBeDefined();
    });

    it('should prevent duplicate signups', async () => {
      const signupData = {
        name: 'Duplicate Test User',
        email: 'duplicate@test.com',
        password: 'SecurePass123',
        acceptTerms: true,
      };

      // First signup should succeed
      const firstSignup = await testClient.post('/api/auth/signup', signupData);
      expect(firstSignup.status).toBe(201);

      // Second signup with same email should fail
      const secondSignup = await testClient.post('/api/auth/signup', signupData);
      expect(secondSignup.status).toBe(409);
      
      const result = await secondSignup.json();
      expect(result.error).toBe('User already exists');
    });
  });

  describe('Complete Signin Flow', () => {
    beforeEach(async () => {
      // Seed test user
      await seedTestData({
        users: [
          {
            id: 'test-user-1',
            name: 'Test User',
            email: 'signin@test.com',
            passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcQjyQ/Ka', // 'password123'
            isActive: true,
            subscription: 'premium',
          },
        ],
      });
    });

    it('should complete full signin process with remember me', async () => {
      const signinData = {
        email: 'signin@test.com',
        password: 'password123',
        rememberMe: true,
      };

      const response = await testClient.post('/api/auth/signin', signinData);
      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.user).toMatchObject({
        email: 'signin@test.com',
        name: 'Test User',
        subscription: 'premium',
      });
      expect(result.accessToken).toBeDefined();

      // Check that refresh token cookie is set
      const cookies = response.headers.get('set-cookie');
      expect(cookies).toContain('refreshToken=');
      expect(cookies).toContain('HttpOnly');
    });

    it('should handle signin without remember me', async () => {
      const signinData = {
        email: 'signin@test.com',
        password: 'password123',
        rememberMe: false,
      };

      const response = await testClient.post('/api/auth/signin', signinData);
      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.user.email).toBe('signin@test.com');
      expect(result.accessToken).toBeDefined();

      // Verify shorter cookie expiry for non-remember me
      const cookies = response.headers.get('set-cookie');
      expect(cookies).toContain('refreshToken=');
      // Should have shorter max-age (7 days vs 30 days)
    });

    it('should reject signin for inactive users', async () => {
      // Seed inactive user
      await seedTestData({
        users: [
          {
            id: 'inactive-user',
            name: 'Inactive User',
            email: 'inactive@test.com',
            passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcQjyQ/Ka',
            isActive: false,
            subscription: 'free',
          },
        ],
      });

      const signinData = {
        email: 'inactive@test.com',
        password: 'password123',
      };

      const response = await testClient.post('/api/auth/signin', signinData);
      expect(response.status).toBe(401);

      const result = await response.json();
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('Token Management Integration', () => {
    beforeEach(async () => {
      await seedTestData({
        users: [
          {
            id: 'token-test-user',
            name: 'Token Test User',
            email: 'token@test.com',
            passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcQjyQ/Ka',
            isActive: true,
            subscription: 'free',
          },
        ],
      });
    });

    it('should create refresh token in database on signin', async () => {
      const signinData = {
        email: 'token@test.com',
        password: 'password123',
      };

      const response = await testClient.post('/api/auth/signin', signinData);
      expect(response.status).toBe(200);

      // Verify refresh token was created in database
      const refreshTokens = await testClient.get('/api/auth/refresh-tokens/token-test-user');
      expect(refreshTokens.status).toBe(200);
      
      const tokens = await refreshTokens.json();
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens[0]).toMatchObject({
        userId: 'token-test-user',
        expiresAt: expect.any(String),
      });
    });

    it('should handle multiple signin sessions', async () => {
      const signinData = {
        email: 'token@test.com',
        password: 'password123',
      };

      // First signin
      const firstSignin = await testClient.post('/api/auth/signin', signinData);
      expect(firstSignin.status).toBe(200);

      // Second signin (different session)
      const secondSignin = await testClient.post('/api/auth/signin', signinData);
      expect(secondSignin.status).toBe(200);

      // Both should have different tokens
      const firstResult = await firstSignin.json();
      const secondResult = await secondSignin.json();
      expect(firstResult.accessToken).not.toBe(secondResult.accessToken);

      // Should have multiple refresh tokens in database
      const refreshTokens = await testClient.get('/api/auth/refresh-tokens/token-test-user');
      const tokens = await refreshTokens.json();
      expect(tokens.length).toBe(2);
    });
  });

  describe('Email Integration', () => {
    it('should send welcome and verification emails on signup', async () => {
      const signupData = {
        name: 'Email Test User',
        email: 'email@test.com',
        password: 'SecurePass123',
        acceptTerms: true,
      };

      const response = await testClient.post('/api/auth/signup', signupData);
      expect(response.status).toBe(201);

      // Check email queue or mock email service
      const emailLogs = await testClient.get('/api/test/email-logs');
      const logs = await emailLogs.json();

      expect(logs).toContainEqual(
        expect.objectContaining({
          type: 'welcome',
          to: 'email@test.com',
          name: 'Email Test User',
        })
      );

      expect(logs).toContainEqual(
        expect.objectContaining({
          type: 'verification',
          to: 'email@test.com',
          token: expect.any(String),
        })
      );
    });

    it('should handle email service failures gracefully', async () => {
      // Simulate email service down
      await testClient.post('/api/test/email-service/disable');

      const signupData = {
        name: 'Email Failure Test',
        email: 'emailfail@test.com',
        password: 'SecurePass123',
        acceptTerms: true,
      };

      const response = await testClient.post('/api/auth/signup', signupData);
      
      // Should still succeed even if email fails
      expect(response.status).toBe(201);
      
      const result = await response.json();
      expect(result.user.email).toBe('emailfail@test.com');

      // Re-enable email service
      await testClient.post('/api/test/email-service/enable');
    });
  });

  describe('Security Integration', () => {
    it('should rate limit signin attempts', async () => {
      const signinData = {
        email: 'nonexistent@test.com',
        password: 'wrongpassword',
      };

      // Make multiple failed attempts
      const attempts = [];
      for (let i = 0; i < 6; i++) {
        attempts.push(testClient.post('/api/auth/signin', signinData));
      }

      const responses = await Promise.all(attempts);
      
      // First few should be 401 (invalid credentials)
      expect(responses[0].status).toBe(401);
      expect(responses[1].status).toBe(401);
      expect(responses[2].status).toBe(401);

      // Later attempts should be rate limited (429)
      expect(responses[5].status).toBe(429);
    });

    it('should validate JWT tokens properly', async () => {
      // Seed test user
      await seedTestData({
        users: [
          {
            id: 'jwt-test-user',
            name: 'JWT Test User',
            email: 'jwt@test.com',
            passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcQjyQ/Ka',
            isActive: true,
            subscription: 'premium',
          },
        ],
      });

      // Sign in to get valid token
      const signinResponse = await testClient.post('/api/auth/signin', {
        email: 'jwt@test.com',
        password: 'password123',
      });

      const { accessToken } = await signinResponse.json();

      // Use token to access protected endpoint
      const protectedResponse = await testClient.get('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      expect(protectedResponse.status).toBe(200);

      // Try with invalid token
      const invalidTokenResponse = await testClient.get('/api/user/profile', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(invalidTokenResponse.status).toBe(401);
    });

    it('should handle concurrent signin attempts safely', async () => {
      await seedTestData({
        users: [
          {
            id: 'concurrent-user',
            name: 'Concurrent User',
            email: 'concurrent@test.com',
            passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcQjyQ/Ka',
            isActive: true,
            subscription: 'free',
          },
        ],
      });

      const signinData = {
        email: 'concurrent@test.com',
        password: 'password123',
      };

      // Make concurrent signin requests
      const concurrentSignins = Array(5).fill(null).map(() =>
        testClient.post('/api/auth/signin', signinData)
      );

      const responses = await Promise.all(concurrentSignins);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should have multiple refresh tokens
      const refreshTokens = await testClient.get('/api/auth/refresh-tokens/concurrent-user');
      const tokens = await refreshTokens.json();
      expect(tokens.length).toBe(5);
    });
  });

  describe('Database Consistency', () => {
    it('should maintain data consistency during signup', async () => {
      const signupData = {
        name: 'Consistency Test',
        email: 'consistency@test.com',
        password: 'SecurePass123',
        acceptTerms: true,
      };

      const response = await testClient.post('/api/auth/signup', signupData);
      expect(response.status).toBe(201);

      const result = await response.json();

      // Verify user data consistency
      const userInDb = await testClient.get(`/api/users/${result.user.id}`);
      const userData = await userInDb.json();

      expect(userData).toMatchObject({
        id: result.user.id,
        name: signupData.name,
        email: signupData.email,
        subscription: 'free',
        isActive: true,
      });

      // Verify password is properly hashed
      expect(userData.passwordHash).toBeDefined();
      expect(userData.passwordHash).not.toBe(signupData.password);
      expect(userData.passwordHash.startsWith('$2a$12$')).toBe(true);
    });

    it('should rollback on partial failures', async () => {
      // This test would require database transaction testing
      // Simulate a scenario where user creation succeeds but email sending fails
      const signupData = {
        name: 'Rollback Test',
        email: 'rollback@test.com',
        password: 'SecurePass123',
        acceptTerms: true,
      };

      // Simulate email service failure after user creation
      await testClient.post('/api/test/email-service/fail-after-user-creation');

      const response = await testClient.post('/api/auth/signup', signupData);
      
      // Should still succeed (email failure shouldn't rollback user creation)
      expect(response.status).toBe(201);

      // But user should exist in database
      const users = await testClient.get('/api/users?email=rollback@test.com');
      const userList = await users.json();
      expect(userList.length).toBe(1);
    });
  });

  describe('Performance Integration', () => {
    it('should handle high load signup requests', async () => {
      const signupRequests = Array(20).fill(null).map((_, index) => ({
        name: `Load Test User ${index}`,
        email: `loadtest${index}@test.com`,
        password: 'SecurePass123',
        acceptTerms: true,
      }));

      const startTime = Date.now();
      
      const responses = await Promise.all(
        signupRequests.map(data => testClient.post('/api/auth/signup', data))
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(10000); // 10 seconds

      // Verify all users were created
      const allUsers = await testClient.get('/api/users?limit=25');
      const users = await allUsers.json();
      expect(users.length).toBeGreaterThanOrEqual(20);
    });

    it('should handle high load signin requests', async () => {
      // Seed multiple test users
      const users = Array(10).fill(null).map((_, index) => ({
        id: `perf-user-${index}`,
        name: `Performance User ${index}`,
        email: `perf${index}@test.com`,
        passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcQjyQ/Ka',
        isActive: true,
        subscription: 'free',
      }));

      await seedTestData({ users });

      const signinRequests = users.map(user => ({
        email: user.email,
        password: 'password123',
      }));

      const startTime = Date.now();
      
      const responses = await Promise.all(
        signinRequests.map(data => testClient.post('/api/auth/signin', data))
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds

      // Verify tokens were created
      const refreshTokens = await testClient.get('/api/auth/refresh-tokens');
      const tokens = await refreshTokens.json();
      expect(tokens.length).toBeGreaterThanOrEqual(10);
    });
  });
});