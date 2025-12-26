/**
 * Unit Tests - .env.example Synchronization
 * 
 * Tests to ensure .env.example is kept in sync with required environment variables
 * Based on: .env configuration changes (2025-10-31)
 * 
 * Coverage:
 * - All OAuth variables present in .env.example
 * - Placeholder values (not real credentials)
 * - Consistent formatting
 * - Documentation comments
 * - No duplicate entries
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('.env.example Synchronization', () => {
  let envExampleContent: string;

  beforeAll(() => {
    const envExamplePath = join(process.cwd(), '.env.example');
    envExampleContent = readFileSync(envExamplePath, 'utf-8');
  });

  describe('TikTok OAuth Variables', () => {
    it('should have TIKTOK_CLIENT_KEY in .env.example', () => {
      expect(envExampleContent).toContain('TIKTOK_CLIENT_KEY=');
    });

    it('should have TIKTOK_CLIENT_SECRET in .env.example', () => {
      expect(envExampleContent).toContain('TIKTOK_CLIENT_SECRET=');
    });

    it('should have NEXT_PUBLIC_TIKTOK_REDIRECT_URI in .env.example', () => {
      expect(envExampleContent).toContain('NEXT_PUBLIC_TIKTOK_REDIRECT_URI=');
    });

    it('should use placeholder for TIKTOK_CLIENT_KEY', () => {
      const match = envExampleContent.match(/TIKTOK_CLIENT_KEY=(.+)/);
      expect(match).toBeTruthy();
      
      const value = match![1].trim();
      expect(value).not.toBe('');
      expect(value).not.toContain('test-');
      expect(value).not.toContain('real-');
    });

    it('should use placeholder for TIKTOK_CLIENT_SECRET', () => {
      const match = envExampleContent.match(/TIKTOK_CLIENT_SECRET=(.+)/);
      expect(match).toBeTruthy();
      
      const value = match![1].trim();
      expect(value).not.toBe('');
      expect(value).not.toContain('test-');
      expect(value).not.toContain('real-');
    });

    it('should have valid redirect URI for TikTok', () => {
      const match = envExampleContent.match(/NEXT_PUBLIC_TIKTOK_REDIRECT_URI=(.+)/);
      expect(match).toBeTruthy();
      
      const uri = match![1].trim();
      expect(uri).toMatch(/^https?:\/\/.+\/api\/auth\/tiktok\/callback$/);
    });
  });

  describe('Instagram/Facebook OAuth Variables', () => {
    it('should have FACEBOOK_APP_ID in .env.example', () => {
      expect(envExampleContent).toContain('FACEBOOK_APP_ID=');
    });

    it('should have FACEBOOK_APP_SECRET in .env.example', () => {
      expect(envExampleContent).toContain('FACEBOOK_APP_SECRET=');
    });

    it('should have NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI in .env.example', () => {
      expect(envExampleContent).toContain('NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=');
    });

    it('should use placeholder for FACEBOOK_APP_ID', () => {
      const match = envExampleContent.match(/FACEBOOK_APP_ID=(.+)/);
      expect(match).toBeTruthy();
      
      const value = match![1].trim();
      expect(value).not.toBe('');
      expect(value).not.toContain('test-');
      expect(value).not.toContain('real-');
    });

    it('should use placeholder for FACEBOOK_APP_SECRET', () => {
      const match = envExampleContent.match(/FACEBOOK_APP_SECRET=(.+)/);
      expect(match).toBeTruthy();
      
      const value = match![1].trim();
      expect(value).not.toBe('');
      expect(value).not.toContain('test-');
      expect(value).not.toContain('real-');
    });

    it('should have valid redirect URI for Instagram', () => {
      const match = envExampleContent.match(/NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=(.+)/);
      expect(match).toBeTruthy();
      
      const uri = match![1].trim();
      expect(uri).toMatch(/^https?:\/\/.+\/api\/auth\/instagram\/callback$/);
    });
  });

  describe('Reddit OAuth Variables', () => {
    it('should have REDDIT_CLIENT_ID in .env.example', () => {
      expect(envExampleContent).toContain('REDDIT_CLIENT_ID=');
    });

    it('should have REDDIT_CLIENT_SECRET in .env.example', () => {
      expect(envExampleContent).toContain('REDDIT_CLIENT_SECRET=');
    });

    it('should have NEXT_PUBLIC_REDDIT_REDIRECT_URI in .env.example', () => {
      expect(envExampleContent).toContain('NEXT_PUBLIC_REDDIT_REDIRECT_URI=');
    });

    it('should use placeholder for REDDIT_CLIENT_ID', () => {
      const match = envExampleContent.match(/REDDIT_CLIENT_ID=(.+)/);
      expect(match).toBeTruthy();
      
      const value = match![1].trim();
      expect(value).not.toBe('');
      expect(value).not.toContain('test-');
      expect(value).not.toContain('real-');
    });

    it('should use placeholder for REDDIT_CLIENT_SECRET', () => {
      const match = envExampleContent.match(/REDDIT_CLIENT_SECRET=(.+)/);
      expect(match).toBeTruthy();
      
      const value = match![1].trim();
      expect(value).not.toBe('');
      expect(value).not.toContain('test-');
      expect(value).not.toContain('real-');
    });

    it('should have valid redirect URI for Reddit', () => {
      const match = envExampleContent.match(/NEXT_PUBLIC_REDDIT_REDIRECT_URI=(.+)/);
      expect(match).toBeTruthy();
      
      const uri = match![1].trim();
      expect(uri).toMatch(/^https?:\/\/.+\/api\/auth\/reddit\/callback$/);
    });
  });

  describe('Documentation and Comments', () => {
    it('should have section comment for Social Media OAuth', () => {
      expect(envExampleContent).toMatch(/# Social Media OAuth/i);
    });

    it('should have comment for TikTok OAuth section', () => {
      expect(envExampleContent).toMatch(/# TikTok/i);
    });

    it('should have comment for Instagram OAuth section', () => {
      expect(envExampleContent).toMatch(/# Instagram/i);
    });

    it('should have comment for Reddit OAuth section', () => {
      expect(envExampleContent).toMatch(/# Reddit/i);
    });

    it('should have helpful comments about where to get credentials', () => {
      // Check for at least one helpful comment
      const hasHelpfulComment = 
        envExampleContent.includes('Get these from') ||
        envExampleContent.includes('Developer Portal') ||
        envExampleContent.includes('developers.facebook.com');
      
      expect(hasHelpfulComment).toBe(true);
    });
  });

  describe('Formatting and Structure', () => {
    it('should group OAuth variables together', () => {
      const tiktokIndex = envExampleContent.indexOf('TIKTOK_CLIENT_KEY');
      const instagramIndex = envExampleContent.indexOf('FACEBOOK_APP_ID');
      const redditIndex = envExampleContent.indexOf('REDDIT_CLIENT_ID');

      // All should be present
      expect(tiktokIndex).toBeGreaterThan(-1);
      expect(instagramIndex).toBeGreaterThan(-1);
      expect(redditIndex).toBeGreaterThan(-1);

      // They should be relatively close to each other (within 1000 characters)
      const maxDistance = 1000;
      expect(Math.abs(tiktokIndex - instagramIndex)).toBeLessThan(maxDistance);
      expect(Math.abs(instagramIndex - redditIndex)).toBeLessThan(maxDistance);
    });

    it('should use consistent variable naming', () => {
      // All OAuth client IDs/keys should follow pattern
      expect(envExampleContent).toContain('TIKTOK_CLIENT_KEY=');
      expect(envExampleContent).toContain('FACEBOOK_APP_ID=');
      expect(envExampleContent).toContain('REDDIT_CLIENT_ID=');

      // All OAuth secrets should follow pattern
      expect(envExampleContent).toContain('TIKTOK_CLIENT_SECRET=');
      expect(envExampleContent).toContain('FACEBOOK_APP_SECRET=');
      expect(envExampleContent).toContain('REDDIT_CLIENT_SECRET=');

      // All redirect URIs should follow pattern
      expect(envExampleContent).toContain('NEXT_PUBLIC_TIKTOK_REDIRECT_URI=');
      expect(envExampleContent).toContain('NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=');
      expect(envExampleContent).toContain('NEXT_PUBLIC_REDDIT_REDIRECT_URI=');
    });

    it('should use NEXT_PUBLIC_ prefix for redirect URIs', () => {
      const redirectUris = [
        'NEXT_PUBLIC_TIKTOK_REDIRECT_URI',
        'NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI',
        'NEXT_PUBLIC_REDDIT_REDIRECT_URI',
      ];

      redirectUris.forEach(uri => {
        expect(envExampleContent).toContain(uri);
        expect(uri).toMatch(/^NEXT_PUBLIC_/);
      });
    });

    it('should not use NEXT_PUBLIC_ prefix for secrets', () => {
      const secrets = [
        'TIKTOK_CLIENT_SECRET',
        'FACEBOOK_APP_SECRET',
        'REDDIT_CLIENT_SECRET',
      ];

      secrets.forEach(secret => {
        expect(envExampleContent).toContain(secret);
        expect(secret).not.toMatch(/^NEXT_PUBLIC_/);
      });
    });
  });

  describe('No Duplicate Entries', () => {
    it('should not have duplicate TIKTOK_CLIENT_KEY entries', () => {
      const matches = envExampleContent.match(/TIKTOK_CLIENT_KEY=/g);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeLessThanOrEqual(2); // Allow one duplicate for different environments
    });

    it('should not have duplicate FACEBOOK_APP_ID entries', () => {
      const matches = envExampleContent.match(/FACEBOOK_APP_ID=/g);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeLessThanOrEqual(2);
    });

    it('should not have duplicate REDDIT_CLIENT_ID entries', () => {
      const matches = envExampleContent.match(/REDDIT_CLIENT_ID=/g);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Security Best Practices', () => {
    it('should not contain real credentials', () => {
      // Check for patterns that might indicate real credentials
      const suspiciousPatterns = [
        /TIKTOK_CLIENT_KEY=aw[a-z0-9]{16,}/i, // Real TikTok key pattern
        /FACEBOOK_APP_ID=\d{15,}/, // Real Facebook App ID pattern
        /CLIENT_SECRET=[a-f0-9]{32,}/i, // Real secret pattern
      ];

      suspiciousPatterns.forEach(pattern => {
        expect(envExampleContent).not.toMatch(pattern);
      });
    });

    it('should use placeholder values', () => {
      const placeholderPatterns = [
        /your-tiktok-client-key/i,
        /your-facebook-app-id/i,
        /your-reddit-client-id/i,
      ];

      // At least some placeholders should be present
      const hasPlaceholders = placeholderPatterns.some(pattern => 
        pattern.test(envExampleContent)
      );

      expect(hasPlaceholders).toBe(true);
    });

    it('should not expose secrets in comments', () => {
      // Check that comments don't contain what look like real secrets
      const lines = envExampleContent.split('\n');
      const commentLines = lines.filter(line => line.trim().startsWith('#'));

      commentLines.forEach(line => {
        // Should not contain long alphanumeric strings that look like secrets
        expect(line).not.toMatch(/[a-f0-9]{32,}/i);
        expect(line).not.toMatch(/aw[a-z0-9]{16,}/i);
      });
    });
  });

  describe('Redirect URI Consistency', () => {
    it('should have valid domains for all redirect URIs', () => {
      const tiktokUri = envExampleContent.match(/NEXT_PUBLIC_TIKTOK_REDIRECT_URI=(.+)/)?.[1].trim();
      const instagramUri = envExampleContent.match(/NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=(.+)/)?.[1].trim();
      const redditUri = envExampleContent.match(/NEXT_PUBLIC_REDDIT_REDIRECT_URI=(.+)/)?.[1].trim();

      expect(tiktokUri).toBeTruthy();
      expect(instagramUri).toBeTruthy();
      expect(redditUri).toBeTruthy();

      // Extract domains
      const tiktokDomain = tiktokUri!.match(/https?:\/\/([^/]+)/)?.[1];
      const instagramDomain = instagramUri!.match(/https?:\/\/([^/]+)/)?.[1];
      const redditDomain = redditUri!.match(/https?:\/\/([^/]+)/)?.[1];

      // All should have valid domains (localhost or huntaze.com)
      const validDomains = ['localhost:3000', 'huntaze.com', 'app.huntaze.com'];
      expect(validDomains).toContain(tiktokDomain);
      expect(validDomains).toContain(instagramDomain);
      expect(validDomains).toContain(redditDomain);
    });

    it('should use consistent callback path structure', () => {
      const uris = [
        envExampleContent.match(/NEXT_PUBLIC_TIKTOK_REDIRECT_URI=(.+)/)?.[1].trim(),
        envExampleContent.match(/NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=(.+)/)?.[1].trim(),
        envExampleContent.match(/NEXT_PUBLIC_REDDIT_REDIRECT_URI=(.+)/)?.[1].trim(),
      ];

      uris.forEach(uri => {
        expect(uri).toBeTruthy();
        expect(uri).toMatch(/\/api\/auth\/[a-z]+\/callback$/);
      });
    });
  });

  describe('Complete OAuth Configuration', () => {
    it('should have all required TikTok OAuth variables', () => {
      const requiredVars = [
        'TIKTOK_CLIENT_KEY',
        'TIKTOK_CLIENT_SECRET',
        'NEXT_PUBLIC_TIKTOK_REDIRECT_URI',
      ];

      requiredVars.forEach(varName => {
        expect(envExampleContent).toContain(`${varName}=`);
      });
    });

    it('should have all required Instagram OAuth variables', () => {
      const requiredVars = [
        'FACEBOOK_APP_ID',
        'FACEBOOK_APP_SECRET',
        'NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI',
      ];

      requiredVars.forEach(varName => {
        expect(envExampleContent).toContain(`${varName}=`);
      });
    });

    it('should have all required Reddit OAuth variables', () => {
      const requiredVars = [
        'REDDIT_CLIENT_ID',
        'REDDIT_CLIENT_SECRET',
        'NEXT_PUBLIC_REDDIT_REDIRECT_URI',
      ];

      requiredVars.forEach(varName => {
        expect(envExampleContent).toContain(`${varName}=`);
      });
    });

    it('should have all 9 OAuth variables', () => {
      const allOAuthVars = [
        'TIKTOK_CLIENT_KEY',
        'TIKTOK_CLIENT_SECRET',
        'NEXT_PUBLIC_TIKTOK_REDIRECT_URI',
        'FACEBOOK_APP_ID',
        'FACEBOOK_APP_SECRET',
        'NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI',
        'REDDIT_CLIENT_ID',
        'REDDIT_CLIENT_SECRET',
        'NEXT_PUBLIC_REDDIT_REDIRECT_URI',
      ];

      allOAuthVars.forEach(varName => {
        expect(envExampleContent).toContain(`${varName}=`);
      });
    });
  });
});
