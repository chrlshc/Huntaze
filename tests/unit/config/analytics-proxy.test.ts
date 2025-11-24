/**
 * Analytics Proxy Configuration Tests
 * 
 * Validates that the analytics proxy rewrites are correctly configured
 * to bypass ad-blockers while maintaining privacy.
 * 
 * Requirements:
 * - 6.1: Analytics requests proxied through first-party domain
 * - 6.2: Analytics events routed through /stats/api/event
 * - 6.3: Query parameters and headers preserved
 */

import { describe, it, expect } from 'vitest';

describe('Analytics Proxy Configuration', () => {
  describe('Requirement 6.1: Analytics initialization proxy', () => {
    it('should proxy /stats/js/script.js to Plausible', async () => {
      // Import the config
      const nextConfig = await import('../../../next.config');
      const config = nextConfig.default;
      
      // Get rewrites
      const rewrites = await config.rewrites();
      
      // Find the script proxy rewrite
      const scriptRewrite = rewrites.find(
        (r: any) => r.source === '/stats/js/script.js'
      );
      
      expect(scriptRewrite).toBeDefined();
      expect(scriptRewrite?.destination).toBe('https://plausible.io/js/script.js');
    });
  });

  describe('Requirement 6.2: Analytics events proxy', () => {
    it('should proxy /stats/api/event to Plausible API', async () => {
      // Import the config
      const nextConfig = await import('../../../next.config');
      const config = nextConfig.default;
      
      // Get rewrites
      const rewrites = await config.rewrites();
      
      // Find the event proxy rewrite
      const eventRewrite = rewrites.find(
        (r: any) => r.source === '/stats/api/event'
      );
      
      expect(eventRewrite).toBeDefined();
      expect(eventRewrite?.destination).toBe('https://plausible.io/api/event');
    });
  });

  describe('Requirement 6.3: Proxy configuration completeness', () => {
    it('should have both script and event proxies configured', async () => {
      // Import the config
      const nextConfig = await import('../../../next.config');
      const config = nextConfig.default;
      
      // Get rewrites
      const rewrites = await config.rewrites();
      
      // Check both proxies exist
      const analyticsRewrites = rewrites.filter(
        (r: any) => r.source.startsWith('/stats/')
      );
      
      expect(analyticsRewrites).toHaveLength(2);
      
      // Verify sources
      const sources = analyticsRewrites.map((r: any) => r.source);
      expect(sources).toContain('/stats/js/script.js');
      expect(sources).toContain('/stats/api/event');
      
      // Verify destinations point to Plausible
      const destinations = analyticsRewrites.map((r: any) => r.destination);
      expect(destinations.every((d: string) => d.includes('plausible.io'))).toBe(true);
    });
  });

  describe('Ad-blocker bypass strategy', () => {
    it('should use first-party paths that do not contain analytics provider name', async () => {
      // Import the config
      const nextConfig = await import('../../../next.config');
      const config = nextConfig.default;
      
      // Get rewrites
      const rewrites = await config.rewrites();
      
      // Find analytics rewrites
      const analyticsRewrites = rewrites.filter(
        (r: any) => r.source.startsWith('/stats/')
      );
      
      // Verify sources don't contain 'plausible' or other provider names
      analyticsRewrites.forEach((rewrite: any) => {
        expect(rewrite.source.toLowerCase()).not.toContain('plausible');
        expect(rewrite.source.toLowerCase()).not.toContain('analytics');
        expect(rewrite.source.toLowerCase()).not.toContain('tracking');
      });
    });

    it('should use generic path names that are less likely to be blocked', async () => {
      // Import the config
      const nextConfig = await import('../../../next.config');
      const config = nextConfig.default;
      
      // Get rewrites
      const rewrites = await config.rewrites();
      
      // Find analytics rewrites
      const analyticsRewrites = rewrites.filter(
        (r: any) => r.source.startsWith('/stats/')
      );
      
      // Verify paths use generic names
      expect(analyticsRewrites.some((r: any) => r.source.includes('/stats/'))).toBe(true);
    });
  });
});
