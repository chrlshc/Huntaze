/**
 * Integration Tests - OAuth Environment Variables
 * 
 * Integration tests to validate OAuth environment validation functions
 * Based on: lib/env.ts OAuth validation functions
 * 
 * Coverage:
 * - ensureTikTokOAuthEnv() function
 * - ensureInstagramOAuthEnv() function
 * - ensureRedditOAuthEnv() function
 * - ensureAllSocialOAuthEnv() function
 * - Production vs development behavior
 * - Error handling and warnings
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ensureTikTokOAuthEnv,
  ensureInstagramOAuthEnv,
  ensureRedditOAuthEnv,
  ensureAllSocialOAuthEnv,
} from '../../../lib/env';

describe('OAuth Environment Validation - Integration', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleWarnSpy: any;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Spy on console.warn
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Restore console.warn
    consoleWarnSpy.mockRestore();
  });

  describe('ensureTikTokOAuthEnv()', () => {
    it('should pass with all TikTok variables present', () => {
      process.env.TIKTOK_CLIENT_KEY = 'test-key';
      process.env.TIKTOK_CLIENT_SECRET = 'test-secret';
      process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI = 'http://localhost:3000/api/auth/tiktok/callback';
      process.env.NODE_ENV = 'development';

      expect(() => ensureTikTokOAuthEnv()).not.toThrow();
    });

    it('should throw in production with missing TIKTOK_CLIENT_KEY', () => {
      delete process.env.TIKTOK_CLIENT_KEY;
      process.env.TIKTOK_CLIENT_SECRET = 'test-secret';
      process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI = 'http://localhost:3000/api/auth/tiktok/callback';
      process.env.NODE_ENV = 'production';

      expect(() => ensureTikTokOAuthEnv()).toThrow('Missing TikTok OAuth env vars: TIKTOK_CLIENT_KEY');
    });

    it('should throw in production with missing TIKTOK_CLIENT_SECRET', () => {
      process.env.TIKTOK_CLIENT_KEY = 'test-key';
      delete process.env.TIKTOK_CLIENT_SECRET;
      process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI = 'http://localhost:3000/api/auth/tiktok/callback';
      process.env.NODE_ENV = 'production';

      expect(() => ensureTikTokOAuthEnv()).toThrow('Missing TikTok OAuth env vars: TIKTOK_CLIENT_SECRET');
    });

    it('should throw in production with missing NEXT_PUBLIC_TIKTOK_REDIRECT_URI', () => {
      process.env.TIKTOK_CLIENT_KEY = 'test-key';
      process.env.TIKTOK_CLIENT_SECRET = 'test-secret';
      delete process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;
      process.env.NODE_ENV = 'production';

      expect(() => ensureTikTokOAuthEnv()).toThrow('Missing TikTok OAuth env vars: NEXT_PUBLIC_TIKTOK_REDIRECT_URI');
    });

    it('should throw in production with all TikTok variables missing', () => {
      delete process.env.TIKTOK_CLIENT_KEY;
      delete process.env.TIKTOK_CLIENT_SECRET;
      delete process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;
      process.env.NODE_ENV = 'production';

      expect(() => ensureTikTokOAuthEnv()).toThrow('Missing TikTok OAuth env vars');
      expect(() => ensureTikTokOAuthEnv()).toThrow('TIKTOK_CLIENT_KEY');
      expect(() => ensureTikTokOAuthEnv()).toThrow('TIKTOK_CLIENT_SECRET');
      expect(() => ensureTikTokOAuthEnv()).toThrow('NEXT_PUBLIC_TIKTOK_REDIRECT_URI');
    });

    it('should warn in development with missing variables', () => {
      delete process.env.TIKTOK_CLIENT_KEY;
      delete process.env.TIKTOK_CLIENT_SECRET;
      delete process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;
      process.env.NODE_ENV = 'development';

      ensureTikTokOAuthEnv();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing TikTok OAuth env vars (dev)')
      );
    });

    it('should not throw in development with missing variables', () => {
      delete process.env.TIKTOK_CLIENT_KEY;
      delete process.env.TIKTOK_CLIENT_SECRET;
      delete process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;
      process.env.NODE_ENV = 'development';

      expect(() => ensureTikTokOAuthEnv()).not.toThrow();
    });
  });

  describe('ensureInstagramOAuthEnv()', () => {
    it('should pass with all Instagram variables present', () => {
      process.env.FACEBOOK_APP_ID = 'test-app-id';
      process.env.FACEBOOK_APP_SECRET = 'test-secret';
      process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI = 'http://localhost:3000/api/auth/instagram/callback';
      process.env.NODE_ENV = 'development';

      expect(() => ensureInstagramOAuthEnv()).not.toThrow();
    });

    it('should throw in production with missing FACEBOOK_APP_ID', () => {
      delete process.env.FACEBOOK_APP_ID;
      process.env.FACEBOOK_APP_SECRET = 'test-secret';
      process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI = 'http://localhost:3000/api/auth/instagram/callback';
      process.env.NODE_ENV = 'production';

      expect(() => ensureInstagramOAuthEnv()).toThrow('Missing Instagram OAuth env vars: FACEBOOK_APP_ID');
    });

    it('should throw in production with missing FACEBOOK_APP_SECRET', () => {
      process.env.FACEBOOK_APP_ID = 'test-app-id';
      delete process.env.FACEBOOK_APP_SECRET;
      process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI = 'http://localhost:3000/api/auth/instagram/callback';
      process.env.NODE_ENV = 'production';

      expect(() => ensureInstagramOAuthEnv()).toThrow('Missing Instagram OAuth env vars: FACEBOOK_APP_SECRET');
    });

    it('should throw in production with missing NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI', () => {
      process.env.FACEBOOK_APP_ID = 'test-app-id';
      process.env.FACEBOOK_APP_SECRET = 'test-secret';
      delete process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;
      process.env.NODE_ENV = 'production';

      expect(() => ensureInstagramOAuthEnv()).toThrow('Missing Instagram OAuth env vars: NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI');
    });

    it('should warn in development with missing variables', () => {
      delete process.env.FACEBOOK_APP_ID;
      delete process.env.FACEBOOK_APP_SECRET;
      delete process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;
      process.env.NODE_ENV = 'development';

      ensureInstagramOAuthEnv();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing Instagram OAuth env vars (dev)')
      );
    });

    it('should not throw in development with missing variables', () => {
      delete process.env.FACEBOOK_APP_ID;
      delete process.env.FACEBOOK_APP_SECRET;
      delete process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;
      process.env.NODE_ENV = 'development';

      expect(() => ensureInstagramOAuthEnv()).not.toThrow();
    });
  });

  describe('ensureRedditOAuthEnv()', () => {
    it('should pass with all Reddit variables present', () => {
      process.env.REDDIT_CLIENT_ID = 'test-client-id';
      process.env.REDDIT_CLIENT_SECRET = 'test-secret';
      process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI = 'http://localhost:3000/api/auth/reddit/callback';
      process.env.NODE_ENV = 'development';

      expect(() => ensureRedditOAuthEnv()).not.toThrow();
    });

    it('should throw in production with missing REDDIT_CLIENT_ID', () => {
      delete process.env.REDDIT_CLIENT_ID;
      process.env.REDDIT_CLIENT_SECRET = 'test-secret';
      process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI = 'http://localhost:3000/api/auth/reddit/callback';
      process.env.NODE_ENV = 'production';

      expect(() => ensureRedditOAuthEnv()).toThrow('Missing Reddit OAuth env vars: REDDIT_CLIENT_ID');
    });

    it('should throw in production with missing REDDIT_CLIENT_SECRET', () => {
      process.env.REDDIT_CLIENT_ID = 'test-client-id';
      delete process.env.REDDIT_CLIENT_SECRET;
      process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI = 'http://localhost:3000/api/auth/reddit/callback';
      process.env.NODE_ENV = 'production';

      expect(() => ensureRedditOAuthEnv()).toThrow('Missing Reddit OAuth env vars: REDDIT_CLIENT_SECRET');
    });

    it('should throw in production with missing NEXT_PUBLIC_REDDIT_REDIRECT_URI', () => {
      process.env.REDDIT_CLIENT_ID = 'test-client-id';
      process.env.REDDIT_CLIENT_SECRET = 'test-secret';
      delete process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI;
      process.env.NODE_ENV = 'production';

      expect(() => ensureRedditOAuthEnv()).toThrow('Missing Reddit OAuth env vars: NEXT_PUBLIC_REDDIT_REDIRECT_URI');
    });

    it('should warn in development with missing variables', () => {
      delete process.env.REDDIT_CLIENT_ID;
      delete process.env.REDDIT_CLIENT_SECRET;
      delete process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI;
      process.env.NODE_ENV = 'development';

      ensureRedditOAuthEnv();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing Reddit OAuth env vars (dev)')
      );
    });

    it('should not throw in development with missing variables', () => {
      delete process.env.REDDIT_CLIENT_ID;
      delete process.env.REDDIT_CLIENT_SECRET;
      delete process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI;
      process.env.NODE_ENV = 'development';

      expect(() => ensureRedditOAuthEnv()).not.toThrow();
    });
  });

  describe('ensureAllSocialOAuthEnv()', () => {
    it('should pass with all social OAuth variables present', () => {
      // TikTok
      process.env.TIKTOK_CLIENT_KEY = 'test-key';
      process.env.TIKTOK_CLIENT_SECRET = 'test-secret';
      process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI = 'http://localhost:3000/api/auth/tiktok/callback';
      
      // Instagram
      process.env.FACEBOOK_APP_ID = 'test-app-id';
      process.env.FACEBOOK_APP_SECRET = 'test-secret';
      process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI = 'http://localhost:3000/api/auth/instagram/callback';
      
      // Reddit
      process.env.REDDIT_CLIENT_ID = 'test-client-id';
      process.env.REDDIT_CLIENT_SECRET = 'test-secret';
      process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI = 'http://localhost:3000/api/auth/reddit/callback';
      
      process.env.NODE_ENV = 'development';

      expect(() => ensureAllSocialOAuthEnv()).not.toThrow();
    });

    it('should throw in production with missing TikTok variables', () => {
      // TikTok - missing
      delete process.env.TIKTOK_CLIENT_KEY;
      delete process.env.TIKTOK_CLIENT_SECRET;
      delete process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;
      
      // Instagram - present
      process.env.FACEBOOK_APP_ID = 'test-app-id';
      process.env.FACEBOOK_APP_SECRET = 'test-secret';
      process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI = 'http://localhost:3000/api/auth/instagram/callback';
      
      // Reddit - present
      process.env.REDDIT_CLIENT_ID = 'test-client-id';
      process.env.REDDIT_CLIENT_SECRET = 'test-secret';
      process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI = 'http://localhost:3000/api/auth/reddit/callback';
      
      process.env.NODE_ENV = 'production';

      expect(() => ensureAllSocialOAuthEnv()).toThrow('Social OAuth configuration errors');
      expect(() => ensureAllSocialOAuthEnv()).toThrow('TikTok');
    });

    it('should throw in production with missing Instagram variables', () => {
      // TikTok - present
      process.env.TIKTOK_CLIENT_KEY = 'test-key';
      process.env.TIKTOK_CLIENT_SECRET = 'test-secret';
      process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI = 'http://localhost:3000/api/auth/tiktok/callback';
      
      // Instagram - missing
      delete process.env.FACEBOOK_APP_ID;
      delete process.env.FACEBOOK_APP_SECRET;
      delete process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;
      
      // Reddit - present
      process.env.REDDIT_CLIENT_ID = 'test-client-id';
      process.env.REDDIT_CLIENT_SECRET = 'test-secret';
      process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI = 'http://localhost:3000/api/auth/reddit/callback';
      
      process.env.NODE_ENV = 'production';

      expect(() => ensureAllSocialOAuthEnv()).toThrow('Social OAuth configuration errors');
      expect(() => ensureAllSocialOAuthEnv()).toThrow('Instagram');
    });

    it('should throw in production with missing Reddit variables', () => {
      // TikTok - present
      process.env.TIKTOK_CLIENT_KEY = 'test-key';
      process.env.TIKTOK_CLIENT_SECRET = 'test-secret';
      process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI = 'http://localhost:3000/api/auth/tiktok/callback';
      
      // Instagram - present
      process.env.FACEBOOK_APP_ID = 'test-app-id';
      process.env.FACEBOOK_APP_SECRET = 'test-secret';
      process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI = 'http://localhost:3000/api/auth/instagram/callback';
      
      // Reddit - missing
      delete process.env.REDDIT_CLIENT_ID;
      delete process.env.REDDIT_CLIENT_SECRET;
      delete process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI;
      
      process.env.NODE_ENV = 'production';

      expect(() => ensureAllSocialOAuthEnv()).toThrow('Social OAuth configuration errors');
      expect(() => ensureAllSocialOAuthEnv()).toThrow('Reddit');
    });

    it('should throw in production with all variables missing', () => {
      // All missing
      delete process.env.TIKTOK_CLIENT_KEY;
      delete process.env.TIKTOK_CLIENT_SECRET;
      delete process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;
      delete process.env.FACEBOOK_APP_ID;
      delete process.env.FACEBOOK_APP_SECRET;
      delete process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;
      delete process.env.REDDIT_CLIENT_ID;
      delete process.env.REDDIT_CLIENT_SECRET;
      delete process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI;
      
      process.env.NODE_ENV = 'production';

      expect(() => ensureAllSocialOAuthEnv()).toThrow('Social OAuth configuration errors');
      expect(() => ensureAllSocialOAuthEnv()).toThrow('TikTok');
      expect(() => ensureAllSocialOAuthEnv()).toThrow('Instagram');
      expect(() => ensureAllSocialOAuthEnv()).toThrow('Reddit');
    });

    it('should not throw in development with missing variables', () => {
      // All missing
      delete process.env.TIKTOK_CLIENT_KEY;
      delete process.env.TIKTOK_CLIENT_SECRET;
      delete process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;
      delete process.env.FACEBOOK_APP_ID;
      delete process.env.FACEBOOK_APP_SECRET;
      delete process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;
      delete process.env.REDDIT_CLIENT_ID;
      delete process.env.REDDIT_CLIENT_SECRET;
      delete process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI;
      
      process.env.NODE_ENV = 'development';

      expect(() => ensureAllSocialOAuthEnv()).not.toThrow();
    });
  });

  describe('Error Message Quality', () => {
    it('should provide clear error messages for TikTok', () => {
      delete process.env.TIKTOK_CLIENT_KEY;
      delete process.env.TIKTOK_CLIENT_SECRET;
      process.env.NODE_ENV = 'production';

      try {
        ensureTikTokOAuthEnv();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('TikTok');
        expect((error as Error).message).toContain('TIKTOK_CLIENT_KEY');
        expect((error as Error).message).toContain('TIKTOK_CLIENT_SECRET');
      }
    });

    it('should provide clear error messages for Instagram', () => {
      delete process.env.FACEBOOK_APP_ID;
      delete process.env.FACEBOOK_APP_SECRET;
      process.env.NODE_ENV = 'production';

      try {
        ensureInstagramOAuthEnv();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Instagram');
        expect((error as Error).message).toContain('FACEBOOK_APP_ID');
        expect((error as Error).message).toContain('FACEBOOK_APP_SECRET');
      }
    });

    it('should provide clear error messages for Reddit', () => {
      delete process.env.REDDIT_CLIENT_ID;
      delete process.env.REDDIT_CLIENT_SECRET;
      process.env.NODE_ENV = 'production';

      try {
        ensureRedditOAuthEnv();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Reddit');
        expect((error as Error).message).toContain('REDDIT_CLIENT_ID');
        expect((error as Error).message).toContain('REDDIT_CLIENT_SECRET');
      }
    });
  });
});
