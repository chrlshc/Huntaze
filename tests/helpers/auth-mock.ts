// Mock authentication helpers for testing
import { test as base } from '@playwright/test';

export const test = base.extend({
  // Add auth state to tests
  authenticatedPage: async ({ page }, use) => {
    // Set mock auth cookies for testing
    await page.context().addCookies([
      {
        name: 'accessToken',
        value: 'mock-access-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        expires: Date.now() / 1000 + 3600, // 1 hour from now
      },
      {
        name: 'refreshToken',
        value: 'mock-refresh-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Strict',
        expires: Date.now() / 1000 + 30 * 24 * 60 * 60, // 30 days
      },
      {
        name: 'idToken',
        value: 'mock-id-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        expires: Date.now() / 1000 + 3600,
      },
    ]);
    
    await use(page);
  },
});

// Helper to generate mock JWT tokens
export function generateMockJWT(payload: any): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }));
  
  // Mock signature
  const signature = 'mock-signature';
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Helper to mock API responses
export async function mockAuthAPI(page: any) {
  await page.route('**/api/auth/**', async (route: any) => {
    const url = route.request().url();
    
    if (url.includes('/login')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: generateMockJWT({ sub: 'test-user', email: 'test@example.com' }),
          refreshToken: 'mock-refresh-token',
          idToken: generateMockJWT({ sub: 'test-user', email: 'test@example.com' }),
        }),
      });
    } else if (url.includes('/refresh')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: generateMockJWT({ sub: 'test-user', email: 'test@example.com' }),
        }),
      });
    } else if (url.includes('/forgot-password')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'If an account exists with this email, a reset code has been sent.',
        }),
      });
    } else {
      await route.continue();
    }
  });
}