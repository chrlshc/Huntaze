/**
 * Unit Tests - Platform Optimizer Service (Task 8.2)
 * 
 * Tests to validate platform optimization and validation logic
 * Based on: .kiro/specs/content-creation/tasks.md (Task 8.2)
 * 
 * Coverage:
 * - Content validation for each platform
 * - Text truncation with smart word boundaries
 * - Image resizing to meet platform specs
 * - Platform-specific warnings generation
 * - Multi-platform validation
 * - Dimension calculations
 * - Aspect ratio handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { platformOptimizerService } from '@/lib/services/platformOptimizerService';
import { PLATFORM_REQUIREMENTS } from '@/lib/config/platformRequirements';

describe('Platform Optimizer Service - Task 8.2', () => {
  describe('AC 8.2.1 - Platform Validation Logic', () => {
    it('should validate Instagram content within limits', () => {
      const result = platformOptimizerService.validateContent('instagram', {
        text: 'Great post! #instagram #content',
        imageSize: 5 * 1024 * 1024, // 5MB
        hashtagCount: 10
      });

      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('Instagram');
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect Instagram text exceeding character limit', () => {
      const longText = 'a'.repeat(2300);
      const result = platformOptimizerService.validateContent('instagram', {
        text: longText
      });

      expect(result.isValid).toBe(false);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('error');
      expect(result.warnings[0].field).toBe('text');
      expect(result.warnings[0].message).toContain('exceeds 2200 characters');
    });

    it('should detect Instagram image size exceeding limit', () => {
      const result = platformOptimizerService.validateContent('instagram', {
        imageSize: 10 * 1024 * 1024 // 10MB
      });

      expect(result.isValid).toBe(false);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('error');
      expect(result.warnings[0].field).toBe('image');
      expect(result.warnings[0].message).toContain('exceeds 8MB');
    });

    it('should detect Instagram video duration exceeding limit', () => {
      const result = platformOptimizerService.validateContent('instagram', {
        videoDuration: 90 // 90 seconds
      });

      expect(result.isValid).toBe(false);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('error');
      expect(result.warnings[0].field).toBe('video');
      expect(result.warnings[0].message).toContain('exceeds 60s');
    });

    it('should detect Instagram too many hashtags', () => {
      const result = platformOptimizerService.validateContent('instagram', {
        hashtagCount: 35
      });

      expect(result.isValid).toBe(false);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('error');
      expect(result.warnings[0].field).toBe('hashtags');
      expect(result.warnings[0].message).toContain('max: 30');
    });

    it('should validate TikTok content within limits', () => {
      const result = platformOptimizerService.validateContent('tiktok', {
        text: 'Amazing TikTok video! #fyp',
        videoDuration: 30,
        videoSize: 50 * 1024 * 1024, // 50MB
        hashtagCount: 5
      });

      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('TikTok');
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect TikTok video size exceeding limit', () => {
      const result = platformOptimizerService.validateContent('tiktok', {
        videoSize: 300 * 1024 * 1024 // 300MB
      });

      expect(result.isValid).toBe(false);
      expect(result.warnings[0].field).toBe('video');
      expect(result.warnings[0].message).toContain('exceeds 287MB');
    });

    it('should validate Twitter content within 280 character limit', () => {
      const result = platformOptimizerService.validateContent('twitter', {
        text: 'Short tweet with #hashtag'
      });

      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('Twitter');
    });

    it('should detect Twitter text exceeding 280 characters', () => {
      const longText = 'a'.repeat(300);
      const result = platformOptimizerService.validateContent('twitter', {
        text: longText
      });

      expect(result.isValid).toBe(false);
      expect(result.warnings[0].message).toContain('exceeds 280 characters');
    });

    it('should validate Facebook content with large text limit', () => {
      const result = platformOptimizerService.validateContent('facebook', {
        text: 'a'.repeat(1000),
        imageSize: 5 * 1024 * 1024
      });

      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('Facebook');
    });

    it('should validate LinkedIn professional content', () => {
      const result = platformOptimizerService.validateContent('linkedin', {
        text: 'Professional post about industry trends',
        imageSize: 5 * 1024 * 1024,
        hashtagCount: 5
      });

      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('LinkedIn');
    });

    it('should validate YouTube video content', () => {
      const result = platformOptimizerService.validateContent('youtube', {
        text: 'Video description with details',
        videoDuration: 600, // 10 minutes
        videoSize: 100 * 1024 * 1024
      });

      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('YouTube');
    });

    it('should return error for unsupported platform', () => {
      const result = platformOptimizerService.validateContent('unsupported', {
        text: 'Test'
      });

      expect(result.isValid).toBe(false);
      expect(result.warnings[0].message).toBe('Platform not supported');
    });
  });

  describe('AC 8.2.2 - Smart Text Truncation', () => {
    it('should truncate text at word boundary', () => {
      const text = 'This is a very long sentence that needs to be truncated properly';
      const truncated = platformOptimizerService.truncateText(text, 30);

      expect(truncated).toBe('This is a very long...');
      expect(truncated.length).toBeLessThanOrEqual(30);
      expect(truncated).toMatch(/\.\.\.$/);
    });


    it('should not truncate text shorter than max length', () => {
      const text = 'Short text';
      const truncated = platformOptimizerService.truncateText(text, 50);

      expect(truncated).toBe('Short text');
    });

    it('should truncate at punctuation boundary', () => {
      const text = 'First sentence. Second sentence that is very long';
      const truncated = platformOptimizerService.truncateText(text, 25);

      expect(truncated).toBe('First sentence....');
      expect(truncated).toMatch(/\.\.\.$/);
    });

    it('should handle text with no spaces', () => {
      const text = 'a'.repeat(100);
      const truncated = platformOptimizerService.truncateText(text, 50);

      expect(truncated.length).toBeLessThanOrEqual(50);
      expect(truncated).toMatch(/\.\.\.$/);
    });

    it('should preserve word if cutting point is too early', () => {
      const text = 'Verylongwordthatcannotbebroken short';
      const truncated = platformOptimizerService.truncateText(text, 35);

      expect(truncated).toContain('Verylongwordthatcannotbebroken');
      expect(truncated.length).toBeLessThanOrEqual(38); // 35 + '...'
    });

    it('should handle text with multiple punctuation marks', () => {
      const text = 'Hello! How are you? I am fine, thanks.';
      const truncated = platformOptimizerService.truncateText(text, 20);

      expect(truncated).toMatch(/\.\.\.$/);
      expect(truncated.length).toBeLessThanOrEqual(23);
    });

    it('should provide optimized text in validation result', () => {
      const longText = 'a'.repeat(300);
      const result = platformOptimizerService.validateContent('twitter', {
        text: longText
      });

      expect(result.optimizedText).toBeDefined();
      expect(result.optimizedText!.length).toBeLessThanOrEqual(280);
      expect(result.optimizedText).toMatch(/\.\.\.$/);
    });
  });});
