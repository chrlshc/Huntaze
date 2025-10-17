import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
  test('security headers are present', async ({ request }) => {
    const response = await request.get('/');
    
    // Check critical security headers
    expect(response.headers()['x-frame-options']).toBe('DENY');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['x-xss-protection']).toBe('1; mode=block');
    expect(response.headers()['strict-transport-security']).toContain('max-age=31536000');
    expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
    
    // Check CSP is present
    const csp = response.headers()['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
  });

  test('XSS prevention in user inputs', async ({ page }) => {
    // First login
    await page.goto('/auth');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('TestPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
    
    // Navigate to profile or a page with user inputs
    await page.goto('/profile');
    
    const xssPayload = '<script>alert("XSS")</script>';
    
    // Try to inject XSS in display name
    const displayNameInput = page.getByLabel(/display name/i);
    if (await displayNameInput.isVisible()) {
      await displayNameInput.fill(xssPayload);
      await page.getByRole('button', { name: /save/i }).click();
      
      // Reload to see if script executes
      await page.reload();
      
      // Check that the script is escaped, not executed
      const displayedName = await page.getByTestId('display-name').textContent();
      expect(displayedName).not.toContain('<script>');
      expect(displayedName).toContain('&lt;script&gt;') || expect(displayedName).toBe('');
    }
  });

  test('CSRF protection on state-changing operations', async ({ page, request }) => {
    // Try to make a direct POST request without proper authentication
    const response = await request.post('/api/user/update', {
      data: {
        name: 'Malicious Update'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Should be rejected
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('session timeout after token expiration', async ({ page, context }) => {
    // Login
    await page.goto('/auth');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('TestPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
    
    // Simulate token expiration by modifying the cookie
    const cookies = await context.cookies();
    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    
    if (accessTokenCookie) {
      // Set an expired cookie
      await context.addCookies([{
        ...accessTokenCookie,
        value: 'expired-token',
        expires: Date.now() / 1000 - 3600 // 1 hour ago
      }]);
    }
    
    // Try to navigate to a protected route
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/auth/);
  });

  test('rate limiting on authentication endpoints', async ({ request }) => {
    const attempts = [];
    
    // Make 6 rapid login attempts (assuming limit is 5)
    for (let i = 0; i < 6; i++) {
      attempts.push(
        request.post('/api/auth/login', {
          data: { 
            email: 'test@example.com', 
            password: 'wrong' 
          },
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    }
    
    const responses = await Promise.all(attempts);
    
    // Last request should be rate limited
    const lastResponse = responses[responses.length - 1];
    expect(lastResponse.status()).toBe(429);
    
    const rateLimitError = await lastResponse.json();
    expect(rateLimitError.error).toContain('Too Many Requests');
    
    // Check rate limit headers
    const headers = lastResponse.headers();
    expect(headers['x-ratelimit-remaining']).toBe('0');
    expect(headers['retry-after']).toBeDefined();
  });

  test('sensitive data is not exposed in responses', async ({ request }) => {
    // Try to access user endpoint
    const response = await request.get('/api/user/me');
    
    if (response.ok()) {
      const userData = await response.json();
      
      // Ensure sensitive fields are not exposed
      expect(userData.password).toBeUndefined();
      expect(userData.passwordHash).toBeUndefined();
      expect(userData.refreshToken).toBeUndefined();
      expect(userData.creditCard).toBeUndefined();
      
      // Check that safe fields are present
      if (userData.email) {
        expect(userData.email).toBeDefined();
        expect(userData.username).toBeDefined();
      }
    }
  });

  test('SQL injection prevention', async ({ page, request }) => {
    // Common SQL injection payloads
    const sqlInjectionPayloads = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "admin'--",
      "1; DELETE FROM users WHERE 1=1; --"
    ];
    
    for (const payload of sqlInjectionPayloads) {
      const response = await request.post('/api/auth/login', {
        data: {
          email: payload,
          password: payload
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Should not return 500 (database error)
      expect(response.status()).not.toBe(500);
      
      // Should return 400 or 401 (validation or auth error)
      expect([400, 401, 429]).toContain(response.status());
    }
  });

  test('secure cookie attributes', async ({ page, context }) => {
    // Login to get cookies
    await page.goto('/auth');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('TestPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
    
    // Check cookie attributes
    const cookies = await context.cookies();
    const authCookies = cookies.filter(c => 
      ['accessToken', 'refreshToken', 'idToken'].includes(c.name)
    );
    
    authCookies.forEach(cookie => {
      // Should have secure attributes
      expect(cookie.httpOnly).toBe(true);
      
      // In production, should be secure
      if (process.env.NODE_ENV === 'production') {
        expect(cookie.secure).toBe(true);
      }
      
      // Check SameSite attribute
      expect(['Lax', 'Strict']).toContain(cookie.sameSite);
      
      // RefreshToken should have stricter SameSite
      if (cookie.name === 'refreshToken') {
        expect(cookie.sameSite).toBe('Strict');
      }
    });
  });

  test('no sensitive data in localStorage', async ({ page }) => {
    // Login
    await page.goto('/auth');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('TestPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
    
    // Check localStorage
    const localStorageData = await page.evaluate(() => {
      const data: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key);
        }
      }
      return data;
    });
    
    // Ensure no sensitive data
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential'];
    Object.keys(localStorageData).forEach(key => {
      sensitiveKeys.forEach(sensitive => {
        expect(key.toLowerCase()).not.toContain(sensitive);
        
        // Also check the values
        const value = localStorageData[key];
        if (typeof value === 'string') {
          expect(value.toLowerCase()).not.toContain('password');
          expect(value).not.toMatch(/Bearer\s+[\w-]+\.[\w-]+\.[\w-]+/); // JWT pattern
        }
      });
    });
  });
});