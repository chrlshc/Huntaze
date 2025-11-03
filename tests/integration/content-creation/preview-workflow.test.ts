/**
 * Integration Tests - Preview Workflow (Task 15.1)
 * 
 * Integration tests to validate complete preview functionality
 * Based on: .kiro/specs/content-creation/tasks.md (Task 15.1)
 * 
 * Coverage:
 * - End-to-end preview generation
 * - Platform validation integration
 * - Real-time updates workflow
 * - Multi-platform preview coordination
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { platformOptimizerService } from '../../../lib/services/platformOptimizerService';

describe('Preview Workflow - Integration Tests (Task 15.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('End-to-End Preview Generation', () => {
    it('should generate previews for multiple platforms', () => {
      const platforms = ['instagram', 'twitter', 'facebook'];
      const content = {
        text: 'Test content with #hashtag',
        hashtagCount: 1,
        imageSize: 1000000,
      };

      const results = platformOptimizerService.validateMultiplePlatforms(platforms, content);

      expect(results).toHaveProperty('instagram');
      expect(results).toHaveProperty('twitter');
      expect(results).toHaveProperty('facebook');
    });

    it('should validate content against platform requirements', () => {
      const platforms = ['instagram'];
      const content = {
        text: 'A'.repeat(3000), // Exceeds Instagram limit
        hashtagCount: 0,
      };

      const results = platformOptimizerService.validateMultiplePlatforms(platforms, content);

      expect(results.instagram.isValid).toBe(false);
      expect(results.instagram.warnings).toBeDefined();
      expect(results.instagram.warnings.length).toBeGreaterThan(0);
    });

    it('should optimize text for each platform', () => {
      const platforms = ['twitter'];
      const content = {
        text: 'A'.repeat(300), // Exceeds Twitter limit
        hashtagCount: 0,
      };

      const results = platformOptimizerService.validateMultiplePlatforms(platforms, content);

      expect(results.twitter.optimizedText).toBeDefined();
      expect(results.twitter.optimizedText.length).toBeLessThanOrEqual(280);
    });

    it('should provide platform-specific suggestions', () => {
      const platforms = ['instagram', 'twitter'];
      const content = {
        text: 'Short text',
        hashtagCount: 0,
      };

      const results = platformOptimizerService.validateMultiplePlatforms(platforms, content);

      // Each platform may have different suggestions
      expect(results.instagram).toHaveProperty('suggestedChanges');
      expect(results.twitter).toHaveProperty('suggestedChanges');
    });
  });

  describe('Platform Validation Integration', () => {
    it('should validate text length for Instagram', () => {
      const content = {
        text: 'A'.repeat(2201), // Just over Instagram limit
        hashtagCount: 0,
      };

      const results = platformOptimizerService.validateMultiplePlatforms(['instagram'], content);

      expect(results.instagram.isValid).toBe(false);
      const textWarning = results.instagram.warnings.find((w: any) => w.field === 'text');
      expect(textWarning).toBeDefined();
    });

    it('should validate hashtag count for Instagram', () => {
      const content = {
        text: 'Test',
        hashtagCount: 35, // Exceeds Instagram limit
      };

      const results = platformOptimizerService.validateMultiplePlatforms(['instagram'], content);

      expect(results.instagram.isValid).toBe(false);
      const hashtagWarning = results.instagram.warnings.find((w: any) => w.field === 'hashtags');
      expect(hashtagWarning).toBeDefined();
    });

    it('should validate image size for Instagram', () => {
      const content = {
        text: 'Test',
        hashtagCount: 0,
        imageSize: 10 * 1024 * 1024, // 10MB - exceeds limit
      };

      const results = platformOptimizerService.validateMultiplePlatforms(['instagram'], content);

      expect(results.instagram.isValid).toBe(false);
      const imageWarning = results.instagram.warnings.find((w: any) => w.field === 'image');
      expect(imageWarning).toBeDefined();
    });

    it('should validate text length for Twitter', () => {
      const content = {
        text: 'A'.repeat(281), // Exceeds Twitter limit
        hashtagCount: 0,
      };

      const results = platformOptimizerService.validateMultiplePlatforms(['twitter'], content);

      expect(results.twitter.isValid).toBe(false);
      const textWarning = results.twitter.warnings.find((w: any) => w.field === 'text');
      expect(textWarning).toBeDefined();
    });

    it('should validate text length for TikTok', () => {
      const content = {
        text: 'A'.repeat(2201), // Exceeds TikTok limit
        hashtagCount: 0,
      };

      const results = platformOptimizerService.validateMultiplePlatforms(['tiktok'], content);

      expect(results.tiktok.isValid).toBe(false);
      const textWarning = results.tiktok.warnings.find((w: any) => w.field === 'text');
      expect(textWarning).toBeDefined();
    });

    it('should pass validation for valid content', () => {
      const content = {
        text: 'Valid content with #hashtag',
        hashtagCount: 1,
        imageSize: 1000000, // 1MB
      };

      const results = platformOptimizerService.validateMultiplePlatforms(
        ['instagram', 'twitter', 'facebook'],
        content
      );

      expect(results.instagram.isValid).toBe(true);
      expect(results.twitter.isValid).toBe(true);
      expect(results.facebook.isValid).toBe(true);
    });
  });

  describe('Real-Time Updates Workflow', () => {
    it('should revalidate when text changes', () => {
      const platforms = ['instagram'];
      
      // Initial validation
      const content1 = {
        text: 'Initial text',
        hashtagCount: 0,
      };
      const results1 = platformOptimizerService.validateMultiplePlatforms(platforms, content1);
      expect(results1.instagram.optimizedText).toBe('Initial text');

      // Updated validation
      const content2 = {
        text: 'Updated text',
        hashtagCount: 0,
      };
      const results2 = platformOptimizerService.validateMultiplePlatforms(platforms, content2);
      expect(results2.instagram.optimizedText).toBe('Updated text');
    });

    it('should revalidate when hashtags change', () => {
      const platforms = ['instagram'];
      
      // Initial validation
      const content1 = {
        text: 'Text with #one',
        hashtagCount: 1,
      };
      const results1 = platformOptimizerService.validateMultiplePlatforms(platforms, content1);
      expect(results1.instagram.isValid).toBe(true);

      // Updated validation with too many hashtags
      const content2 = {
        text: 'Text with many hashtags',
        hashtagCount: 35,
      };
      const results2 = platformOptimizerService.validateMultiplePlatforms(platforms, content2);
      expect(results2.instagram.isValid).toBe(false);
    });

    it('should revalidate when image changes', () => {
      const platforms = ['instagram'];
      
      // Initial validation with valid image
      const content1 = {
        text: 'Text',
        hashtagCount: 0,
        imageSize: 1000000, // 1MB
      };
      const results1 = platformOptimizerService.validateMultiplePlatforms(platforms, content1);
      expect(results1.instagram.isValid).toBe(true);

      // Updated validation with large image
      const content2 = {
        text: 'Text',
        hashtagCount: 0,
        imageSize: 10 * 1024 * 1024, // 10MB
      };
      const results2 = platformOptimizerService.validateMultiplePlatforms(platforms, content2);
      expect(results2.instagram.isValid).toBe(false);
    });

    it('should handle rapid consecutive updates', () => {
      const platforms = ['instagram'];
      
      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        const content = {
          text: `Update ${i}`,
          hashtagCount: 0,
        };
        const results = platformOptimizerService.validateMultiplePlatforms(platforms, content);
        expect(results.instagram.optimizedText).toBe(`Update ${i}`);
      }
    });
  });

  describe('Multi-Platform Preview Coordination', () => {
    it('should generate consistent results for same content', () => {
      const platforms = ['instagram', 'twitter', 'facebook'];
      const content = {
        text: 'Same content for all platforms',
        hashtagCount: 1,
      };

      const results = platformOptimizerService.validateMultiplePlatforms(platforms, content);

      // All platforms should receive the same input
      expect(results.instagram.optimizedText).toContain('Same content');
      expect(results.twitter.optimizedText).toContain('Same content');
      expect(results.facebook.optimizedText).toContain('Same content');
    });

    it('should apply platform-specific optimizations', () => {
      const platforms = ['twitter', 'facebook'];
      const content = {
        text: 'A'.repeat(300), // Exceeds Twitter but not Facebook
        hashtagCount: 0,
      };

      const results = platformOptimizerService.validateMultiplePlatforms(platforms, content);

      // Twitter should truncate
      expect(results.twitter.optimizedText.length).toBeLessThanOrEqual(280);
      
      // Facebook should keep full text
      expect(results.facebook.optimizedText.length).toBe(300);
    });

    it('should track validation status independently per platform', () => {
      const platforms = ['instagram', 'twitter'];
      const content = {
        text: 'A'.repeat(300), // Valid for Instagram, invalid for Twitter
        hashtagCount: 0,
      };

      const results = platformOptimizerService.validateMultiplePlatforms(platforms, content);

      expect(results.instagram.isValid).toBe(true);
      expect(results.twitter.isValid).toBe(false);
    });

    it('should provide platform-specific warnings', () => {
      const platforms = ['instagram', 'twitter', 'tiktok'];
      const content = {
        text: 'Test',
        hashtagCount: 35, // Exceeds Instagram and Twitter limits
      };

      const results = platformOptimizerService.validateMultiplePlatforms(platforms, content);

      // Instagram should have hashtag warning (max 30)
      expect(results.instagram.warnings.some((w: any) => w.field === 'hashtags')).toBe(true);
      
      // Twitter should also have hashtag warning (max 30)
      expect(results.twitter.warnings.some((w: any) => w.field === 'hashtags')).toBe(true);
      
      // TikTok should not have hashtag warning (max 100)
      expect(results.tiktok.warnings.some((w: any) => w.field === 'hashtags')).toBe(false);
    });

    it('should handle platform addition dynamically', () => {
      const content = {
        text: 'Test content',
        hashtagCount: 1,
      };

      // Start with one platform
      const results1 = platformOptimizerService.validateMultiplePlatforms(['instagram'], content);
      expect(Object.keys(results1)).toHaveLength(1);

      // Add more platforms
      const results2 = platformOptimizerService.validateMultiplePlatforms(
        ['instagram', 'twitter', 'facebook'],
        content
      );
      expect(Object.keys(results2)).toHaveLength(3);
    });

    it('should handle platform removal dynamically', () => {
      const content = {
        text: 'Test content',
        hashtagCount: 1,
      };

      // Start with multiple platforms
      const results1 = platformOptimizerService.validateMultiplePlatforms(
        ['instagram', 'twitter', 'facebook'],
        content
      );
      expect(Object.keys(results1)).toHaveLength(3);

      // Remove platforms
      const results2 = platformOptimizerService.validateMultiplePlatforms(['instagram'], content);
      expect(Object.keys(results2)).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty platforms array', () => {
      const content = {
        text: 'Test',
        hashtagCount: 0,
      };

      const results = platformOptimizerService.validateMultiplePlatforms([], content);
      expect(results).toEqual({});
    });

    it('should handle missing content properties', () => {
      const platforms = ['instagram'];
      const content = {};

      const results = platformOptimizerService.validateMultiplePlatforms(platforms, content);
      expect(results.instagram).toBeDefined();
    });

    it('should handle null text', () => {
      const platforms = ['instagram'];
      const content = {
        text: null as any,
        hashtagCount: 0,
      };

      const results = platformOptimizerService.validateMultiplePlatforms(platforms, content);
      expect(results.instagram).toBeDefined();
    });

    it('should handle undefined hashtag count', () => {
      const platforms = ['instagram'];
      const content = {
        text: 'Test',
        hashtagCount: undefined as any,
      };

      const results = platformOptimizerService.validateMultiplePlatforms(platforms, content);
      expect(results.instagram).toBeDefined();
    });

    it('should handle unknown platforms gracefully', () => {
      const platforms = ['unknown_platform'];
      const content = {
        text: 'Test',
        hashtagCount: 0,
      };

      const results = platformOptimizerService.validateMultiplePlatforms(platforms, content);
      expect(results.unknown_platform).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should validate multiple platforms efficiently', () => {
      const platforms = ['instagram', 'twitter', 'facebook', 'linkedin', 'tiktok', 'youtube'];
      const content = {
        text: 'Test content',
        hashtagCount: 1,
      };

      const startTime = Date.now();
      const results = platformOptimizerService.validateMultiplePlatforms(platforms, content);
      const endTime = Date.now();

      expect(Object.keys(results)).toHaveLength(6);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle large text efficiently', () => {
      const platforms = ['instagram'];
      const content = {
        text: 'A'.repeat(10000),
        hashtagCount: 0,
      };

      const startTime = Date.now();
      const results = platformOptimizerService.validateMultiplePlatforms(platforms, content);
      const endTime = Date.now();

      expect(results.instagram).toBeDefined();
      expect(endTime - startTime).toBeLessThan(50); // Should complete in under 50ms
    });

    it('should handle many hashtags efficiently', () => {
      const platforms = ['instagram'];
      const content = {
        text: 'Test',
        hashtagCount: 100,
      };

      const startTime = Date.now();
      const results = platformOptimizerService.validateMultiplePlatforms(platforms, content);
      const endTime = Date.now();

      expect(results.instagram).toBeDefined();
      expect(endTime - startTime).toBeLessThan(50); // Should complete in under 50ms
    });
  });

  describe('Data Consistency', () => {
    it('should maintain validation result structure', () => {
      const platforms = ['instagram'];
      const content = {
        text: 'Test',
        hashtagCount: 0,
      };

      const results = platformOptimizerService.validateMultiplePlatforms(platforms, content);

      expect(results.instagram).toHaveProperty('isValid');
      expect(results.instagram).toHaveProperty('optimizedText');
      expect(results.instagram).toHaveProperty('warnings');
      expect(results.instagram).toHaveProperty('suggestedChanges');
    });

    it('should provide consistent warning structure', () => {
      const platforms = ['instagram'];
      const content = {
        text: 'A'.repeat(3000),
        hashtagCount: 0,
      };

      const results = platformOptimizerService.validateMultiplePlatforms(platforms, content);

      results.instagram.warnings.forEach((warning: any) => {
        expect(warning).toHaveProperty('type');
        expect(warning).toHaveProperty('field');
        expect(warning).toHaveProperty('message');
        expect(['error', 'warning']).toContain(warning.type);
      });
    });

    it('should provide array for suggested changes', () => {
      const platforms = ['instagram'];
      const content = {
        text: 'Test',
        hashtagCount: 0,
      };

      const results = platformOptimizerService.validateMultiplePlatforms(platforms, content);

      expect(Array.isArray(results.instagram.suggestedChanges)).toBe(true);
    });
  });
});
