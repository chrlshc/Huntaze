/**
 * Analytics API - Integration Tests
 * 
 * Tests analytics endpoints with real database interactions
 * Requirements: 7.5
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { query } from '@/lib/db';

describe('Analytics API - Integration Tests', () => {
  const baseUrl = process.env.TEST_API_URL || 'http://localhost:3000';
  let testSessionCookie: string;
  let testUserId: string;

  beforeAll(async () => {
    // Setup test user and session
    const email = `test-analytics-${Date.now()}@example.com`;
    
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test User',
        email,
        password: 'SecurePassword123!',
      }),
    });

    const registerData = await registerResponse.json();
    testUserId = registerData.user.id;
    testSessionCookie = 'test-session-cookie';
  });

  afterAll(async () => {
    // Cleanup
    try {
      await query('DELETE FROM users WHERE id = $1', [testUserId]);
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  });

  describe('GET /api/analytics/overview', () => {
    it('should return analytics overview', async () => {
      const response = await fetch(`${baseUrl}/api/analytics/overview`, {
        headers: { Cookie: testSessionCookie },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('arpu');
      expect(data.data).toHaveProperty('ltv');
      expect(data.data).toHaveProperty('churnRate');
      expect(data.data).toHaveProperty('activeSubscribers');
      expect(data.data).toHaveProperty('totalRevenue');
    });

    it('should return 401 without authentication', async () => {
      const response = await fetch(`${baseUrl}/api/analytics/overview`);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/analytics/trends', () => {
    it('should return trend data', async () => {
      const response = await fetch(
        `${baseUrl}/api/analytics/trends?metric=revenue&period=day&days=7`,
        {
          headers: { Cookie: testSessionCookie },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should validate metric parameter', async () => {
      const response = await fetch(
        `${baseUrl}/api/analytics/trends?metric=invalid`,
        {
          headers: { Cookie: testSessionCookie },
        }
      );

      expect(response.status).toBe(400);
    });
  });
});
