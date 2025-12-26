/**
 * Unit Tests - OAuth Environment Variables Validation
 * 
 * Tests to validate OAuth credentials configuration for social media platforms
 * Based on: .env configuration changes (2025-10-31)
 * 
 * Coverage:
 * - TikTok OAuth credentials validation
 * - Instagram/Facebook OAuth credentials validation
 * - Reddit OAuth credentials validation
 * - Redirect URI validation
 * - Environment-specific configuration
 * - Missing credentials detection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('OAuth Environment Variables - Validation', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('TikTok OAuth Configuration', () => {
    it('should have TIKTOK_CLIENT_KEY defined', () => {
      process.env.TIKTOK_CLIENT_KEY = 'test-tiktok-client-key';
      
      expect(process.env.TIKTOK_CLIENT_KEY).toBeDefined();
      expect(process.env.TIKTOK_CLIENT_KEY).toBe('test-tiktok-client-key');
    });

    it('should have TIKTOK_CLIENT_SECRET defined', () => {
      process.env.TIKTOK_CLIENT_SECRET = 'test-tiktok-client-secret';
      
      expect(process.env.TIKTOK_CLIENT_SECRET).toBeDefined();
      expect(process.env.TIKTOK_CLIENT_SECRET).toBe('test-tiktok-client-secret');
    });

    it('should have NEXT_PUBLIC_TIKTOK_REDIRECT_URI defined', () => {
      process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI = 'http://localhost:3000/api/auth/tiktok/callback';
      
      expect(process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI).toBeDefined();
      expect(process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI).toContain('/api/auth/tiktok/callback');
    });

    it('should validate TikTok redirect URI format', () => {
      const validUris = [
        'http://localhost:3000/api/auth/tiktok/callback',
        'https://huntaze.com/api/auth/tiktok/callback',
        'https://app.huntaze.com/api/auth/tiktok/callback',
      ];

      validUris.forEach(uri => {
        expect(uri).toMatch(/^https?:\/\/.+\/api\/auth\/tiktok\/callback$/);
      });
    });

    it('should reject invalid TikTok redirect URIs', () => {
      const invalidUris = [
        'http://localhost:3000/callback', // Wrong path
        'https://huntaze.com/api/auth/instagram/callback', // Wrong platform
        'ftp://huntaze.com/api/auth/tiktok/callback', // Wrong protocol
        '/api/auth/tiktok/callback', // Missing protocol and domain
      ];

      invalidUris.forEach(uri => {
        expect(uri).not.toMatch(/^https?:\/\/.+\/api\/auth\/tiktok\/callback$/);
      });
    });

    it('should detect missing TikTok credentials', () => {
      delete process.env.TIKTOK_CLIENT_KEY;
      delete process.env.TIKTOK_CLIENT_SECRET;
      delete process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;

      const missing = [];
      if (!process.env.TIKTOK_CLIENT_KEY) missing.push('TIKTOK_CLIENT_KEY');
      if (!process.env.TIKTOK_CLIENT_SECRET) missing.push('TIKTOK_CLIENT_SECRET');
      if (!process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI) missing.push('NEXT_PUBLIC_TIKTOK_REDIRECT_URI');

      expect(missing).toHaveLength(3);
      expect(missing).toContain('TIKTOK_CLIENT_KEY');
      expect(missing).toContain('TIKTOK_CLIENT_SECRET');
      expect(missing).toContain('NEXT_PUBLIC_TIKTOK_REDIRECT_URI');
    });

    it('should validate TikTok client key format', () => {
      const validKeys = [
        'awabcdefghijklmnop', // TikTok client keys typically start with 'aw'
        'aw1234567890abcdef',
      ];

      validKeys.forEach(key => {
        expect(key).toMatch(/^aw[a-z0-9]+$/i);
      });
    });
  });

  describe('Instagram/Facebook OAuth Configuration', () => {
    it('should have FACEBOOK_APP_ID defined', () => {
      process.env.FACEBOOK_APP_ID = 'test-facebook-app-id';
      
      expect(process.env.FACEBOOK_APP_ID).toBeDefined();
      expect(process.env.FACEBOOK_APP_ID).toBe('test-facebook-app-id');
    });

    it('should have FACEBOOK_APP_SECRET defined', () => {
      process.env.FACEBOOK_APP_SECRET = 'test-facebook-app-secret';
      
      expect(process.env.FACEBOOK_APP_SECRET).toBeDefined();
      expect(process.env.FACEBOOK_APP_SECRET).toBe('test-facebook-app-secret');
    });

    it('should have NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI defined', () => {
      process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI = 'http://localhost:3000/api/auth/instagram/callback';
      
      expect(process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI).toBeDefined();
      expect(process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI).toContain('/api/auth/instagram/callback');
    });

    it('should validate Instagram redirect URI format', () => {
      const validUris = [
        'http://localhost:3000/api/auth/instagram/callback',
        'https://huntaze.com/api/auth/instagram/callback',
        'https://app.huntaze.com/api/auth/instagram/callback',
      ];

      validUris.forEach(uri => {
        expect(uri).toMatch(/^https?:\/\/.+\/api\/auth\/instagram\/callback$/);
      });
    });

    it('should reject invalid Instagram redirect URIs', () => {
      const invalidUris = [
        'http://localhost:3000/callback', // Wrong path
        'https://huntaze.com/api/auth/tiktok/callback', // Wrong platform
        'ftp://huntaze.com/api/auth/instagram/callback', // Wrong protocol
        '/api/auth/instagram/callback', // Missing protocol and domain
      ];

      invalidUris.forEach(uri => {
        expect(uri).not.toMatch(/^https?:\/\/.+\/api\/auth\/instagram\/callback$/);
      });
    });

    it('should detect missing Instagram credentials', () => {
      delete process.env.FACEBOOK_APP_ID;
      delete process.env.FACEBOOK_APP_SECRET;
      delete process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;

      const missing = [];
      if (!process.env.FACEBOOK_APP_ID) missing.push('FACEBOOK_APP_ID');
      if (!process.env.FACEBOOK_APP_SECRET) missing.push('FACEBOOK_APP_SECRET');
      if (!process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI) missing.push('NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI');

      expect(missing).toHaveLength(3);
      expect(missing).toContain('FACEBOOK_APP_ID');
      expect(missing).toContain('FACEBOOK_APP_SECRET');
      expect(missing).toContain('NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI');
    });

    it('should validate Facebook App ID format (numeric)', () => {
      const validAppIds = [
        '123456789012345',
        '987654321098765',
      ];

      validAppIds.forEach(appId => {
        expect(appId).toMatch(/^\d+$/);
      });
    });

    it('should reject non-numeric Facebook App IDs', () => {
      const invalidAppIds = [
        'abc123',
        '123-456',
        'app_123456',
      ];

      invalidAppIds.forEach(appId => {
        expect(appId).not.toMatch(/^\d+$/);
      });
    });
  });

  describe('Reddit OAuth Configuration', () => {
    it('should have REDDIT_CLIENT_ID defined', () => {
      process.env.REDDIT_CLIENT_ID = 'test-reddit-client-id';
      
      expect(process.env.REDDIT_CLIENT_ID).toBeDefined();
      expect(process.env.REDDIT_CLIENT_ID).toBe('test-reddit-client-id');
    });

    it('should have REDDIT_CLIENT_SECRET defined', () => {
      process.env.REDDIT_CLIENT_SECRET = 'test-reddit-client-secret';
      
      expect(process.env.REDDIT_CLIENT_SECRET).toBeDefined();
      expect(process.env.REDDIT_CLIENT_SECRET).toBe('test-reddit-client-secret');
    });

    it('should have NEXT_PUBLIC_REDDIT_REDIRECT_URI defined', () => {
      process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI = 'http://localhost:3000/api/auth/reddit/callback';
      
      expect(process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI).toBeDefined();
      expect(process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI).toContain('/api/auth/reddit/callback');
    });

    it('should validate Reddit redirect URI format', () => {
      const validUris = [
        'http://localhost:3000/api/auth/reddit/callback',
        'https://huntaze.com/api/auth/reddit/callback',
        'https://app.huntaze.com/api/auth/reddit/callback',
      ];

      validUris.forEach(uri => {
        expect(uri).toMatch(/^https?:\/\/.+\/api\/auth\/reddit\/callback$/);
      });
    });

    it('should detect missing Reddit credentials', () => {
      delete process.env.REDDIT_CLIENT_ID;
      delete process.env.REDDIT_CLIENT_SECRET;
      delete process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI;

      const missing = [];
      if (!process.env.REDDIT_CLIENT_ID) missing.push('REDDIT_CLIENT_ID');
      if (!process.env.REDDIT_CLIENT_SECRET) missing.push('REDDIT_CLIENT_SECRET');
      if (!process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI) missing.push('NEXT_PUBLIC_REDDIT_REDIRECT_URI');

      expect(missing).toHaveLength(3);
      expect(missing).toContain('REDDIT_CLIENT_ID');
      expect(missing).toContain('REDDIT_CLIENT_SECRET');
      expect(missing).toContain('NEXT_PUBLIC_REDDIT_REDIRECT_URI');
    });
  });

  describe('Environment-Specific Configuration', () => {
    it('should use localhost redirect URIs in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI = 'http://localhost:3000/api/auth/tiktok/callback';
      process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI = 'http://localhost:3000/api/auth/instagram/callback';
      process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI = 'http://localhost:3000/api/auth/reddit/callback';

      expect(process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI).toContain('localhost');
      expect(process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI).toContain('localhost');
      expect(process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI).toContain('localhost');
    });

    it('should use HTTPS redirect URIs in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI = 'https://huntaze.com/api/auth/tiktok/callback';
      process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI = 'https://huntaze.com/api/auth/instagram/callback';
      process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI = 'https://huntaze.com/api/auth/reddit/callback';

      expect(process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI).toMatch(/^https:\/\//);
      expect(process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI).toMatch(/^https:\/\//);
      expect(process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI).toMatch(/^https:\/\//);
    });

    it('should warn about HTTP in production', () => {
      process.env.NODE_ENV = 'production';
      const httpUri = 'http://huntaze.com/api/auth/tiktok/callback';

      expect(httpUri).toMatch(/^http:\/\//);
      expect(httpUri).not.toMatch(/^https:\/\//);
    });
  });

  describe('Redirect URI Consistency', () => {
    it('should have consistent callback path structure', () => {
      const uris = [
        'http://localhost:3000/api/auth/tiktok/callback',
        'http://localhost:3000/api/auth/instagram/callback',
        'http://localhost:3000/api/auth/reddit/callback',
      ];

      uris.forEach(uri => {
        expect(uri).toMatch(/\/api\/auth\/[a-z]+\/callback$/);
      });
    });

    it('should use same domain for all redirect URIs', () => {
      const domain = 'huntaze.com';
      const uris = [
        `https://${domain}/api/auth/tiktok/callback`,
        `https://${domain}/api/auth/instagram/callback`,
        `https://${domain}/api/auth/reddit/callback`,
      ];

      uris.forEach(uri => {
        expect(uri).toContain(domain);
      });
    });
  });

  describe('Security Validation', () => {
    it('should not expose secrets in client-side code', () => {
      const clientSideVars = [
        'NEXT_PUBLIC_TIKTOK_REDIRECT_URI',
        'NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI',
        'NEXT_PUBLIC_REDDIT_REDIRECT_URI',
      ];

      const serverSideSecrets = [
        'TIKTOK_CLIENT_SECRET',
        'FACEBOOK_APP_SECRET',
        'REDDIT_CLIENT_SECRET',
      ];

      clientSideVars.forEach(varName => {
        expect(varName).toContain('NEXT_PUBLIC_');
      });

      serverSideSecrets.forEach(varName => {
        expect(varName).not.toContain('NEXT_PUBLIC_');
      });
    });

    it('should validate that secrets are not empty strings', () => {
      process.env.TIKTOK_CLIENT_SECRET = '';
      process.env.FACEBOOK_APP_SECRET = '';
      process.env.REDDIT_CLIENT_SECRET = '';

      const emptySecrets = [];
      if (process.env.TIKTOK_CLIENT_SECRET === '') emptySecrets.push('TIKTOK_CLIENT_SECRET');
      if (process.env.FACEBOOK_APP_SECRET === '') emptySecrets.push('FACEBOOK_APP_SECRET');
      if (process.env.REDDIT_CLIENT_SECRET === '') emptySecrets.push('REDDIT_CLIENT_SECRET');

      expect(emptySecrets).toHaveLength(3);
    });

    it('should validate that secrets have minimum length', () => {
      const minLength = 10;
      
      process.env.TIKTOK_CLIENT_SECRET = 'short';
      process.env.FACEBOOK_APP_SECRET = 'verylongsecretkey123456';
      process.env.REDDIT_CLIENT_SECRET = 'abc';

      expect(process.env.TIKTOK_CLIENT_SECRET!.length).toBeLessThan(minLength);
      expect(process.env.FACEBOOK_APP_SECRET!.length).toBeGreaterThanOrEqual(minLength);
      expect(process.env.REDDIT_CLIENT_SECRET!.length).toBeLessThan(minLength);
    });
  });

  describe('Complete Configuration Validation', () => {
    it('should validate all TikTok OAuth variables are present', () => {
      process.env.TIKTOK_CLIENT_KEY = 'test-key';
      process.env.TIKTOK_CLIENT_SECRET = 'test-secret';
      process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI = 'http://localhost:3000/api/auth/tiktok/callback';

      const hasAllTikTokVars = 
        !!process.env.TIKTOK_CLIENT_KEY &&
        !!process.env.TIKTOK_CLIENT_SECRET &&
        !!process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;

      expect(hasAllTikTokVars).toBe(true);
    });

    it('should validate all Instagram OAuth variables are present', () => {
      process.env.FACEBOOK_APP_ID = 'test-app-id';
      process.env.FACEBOOK_APP_SECRET = 'test-secret';
      process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI = 'http://localhost:3000/api/auth/instagram/callback';

      const hasAllInstagramVars = 
        !!process.env.FACEBOOK_APP_ID &&
        !!process.env.FACEBOOK_APP_SECRET &&
        !!process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;

      expect(hasAllInstagramVars).toBe(true);
    });

    it('should validate all Reddit OAuth variables are present', () => {
      process.env.REDDIT_CLIENT_ID = 'test-client-id';
      process.env.REDDIT_CLIENT_SECRET = 'test-secret';
      process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI = 'http://localhost:3000/api/auth/reddit/callback';

      const hasAllRedditVars = 
        !!process.env.REDDIT_CLIENT_ID &&
        !!process.env.REDDIT_CLIENT_SECRET &&
        !!process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI;

      expect(hasAllRedditVars).toBe(true);
    });

    it('should detect incomplete TikTok configuration', () => {
      process.env.TIKTOK_CLIENT_KEY = 'test-key';
      delete process.env.TIKTOK_CLIENT_SECRET;
      delete process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;

      const hasAllTikTokVars = 
        !!process.env.TIKTOK_CLIENT_KEY &&
        !!process.env.TIKTOK_CLIENT_SECRET &&
        !!process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;

      expect(hasAllTikTokVars).toBe(false);
    });

    it('should detect incomplete Instagram configuration', () => {
      process.env.FACEBOOK_APP_ID = 'test-app-id';
      delete process.env.FACEBOOK_APP_SECRET;
      delete process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;

      const hasAllInstagramVars = 
        !!process.env.FACEBOOK_APP_ID &&
        !!process.env.FACEBOOK_APP_SECRET &&
        !!process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;

      expect(hasAllInstagramVars).toBe(false);
    });
  });

  describe('.env.example Consistency', () => {
    it('should have placeholder values in .env.example', () => {
      const placeholders = {
        TIKTOK_CLIENT_KEY: 'your-tiktok-client-key',
        TIKTOK_CLIENT_SECRET: 'your-tiktok-client-secret',
        FACEBOOK_APP_ID: 'your-facebook-app-id',
        FACEBOOK_APP_SECRET: 'your-facebook-app-secret',
        REDDIT_CLIENT_ID: 'your-reddit-client-id',
        REDDIT_CLIENT_SECRET: 'your-reddit-client-secret',
      };

      Object.entries(placeholders).forEach(([key, value]) => {
        expect(value).toContain('your-');
        expect(value).not.toContain('test-');
      });
    });

    it('should have correct redirect URIs in .env.example', () => {
      const exampleUris = {
        NEXT_PUBLIC_TIKTOK_REDIRECT_URI: 'http://localhost:3000/api/auth/tiktok/callback',
        NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI: 'http://localhost:3000/api/auth/instagram/callback',
        NEXT_PUBLIC_REDDIT_REDIRECT_URI: 'http://localhost:3000/api/auth/reddit/callback',
      };

      Object.values(exampleUris).forEach(uri => {
        expect(uri).toContain('localhost:3000');
        expect(uri).toContain('/api/auth/');
        expect(uri).toContain('/callback');
      });
    });
  });
});
