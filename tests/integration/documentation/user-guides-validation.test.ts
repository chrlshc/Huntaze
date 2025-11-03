/**
 * User Guides Validation Tests
 * 
 * Validates that user documentation is complete and helpful
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('User Guides Validation', () => {
  describe('Social Integrations User Guide', () => {
    const guidePath = path.join(process.cwd(), 'docs/USER_GUIDE_SOCIAL_INTEGRATIONS.md');

    it('should exist', () => {
      expect(fs.existsSync(guidePath)).toBe(true);
    });

    it('should cover TikTok connection', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('TikTok');
      expect(content).toContain('Connect');
      expect(content).toContain('Authorize');
    });

    it('should cover Instagram connection', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Instagram');
      expect(content).toContain('Connect');
      expect(content).toContain('Facebook');
    });

    it('should explain publishing workflows', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Publication');
      expect(content).toContain('Upload');
      expect(content).toContain('Publier');
    });

    it('should explain scheduling', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Planification');
      expect(content).toContain('Programmer');
      expect(content).toContain('Calendrier');
    });

    it('should explain analytics', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Analytics');
      expect(content).toContain('Statistiques');
      expect(content).toContain('Métriques');
    });

    it('should include troubleshooting section', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Résolution');
      expect(content).toContain('Problèmes');
    });

    it('should include tips and best practices', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Conseils');
      expect(content).toContain('Bonnes Pratiques');
    });
  });

  describe('Content Creation User Guide', () => {
    const guidePath = path.join(process.cwd(), 'docs/user-guides/CONTENT_CREATION_USER_GUIDE.md');

    it('should exist', () => {
      expect(fs.existsSync(guidePath)).toBe(true);
    });

    it('should explain content creation workflow', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Creating Content');
      expect(content).toContain('Create New');
      expect(content).toContain('content type');
    });

    it('should explain rich text editor', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Rich Text Editor');
      expect(content).toContain('Bold');
      expect(content).toContain('Italic');
      expect(content).toContain('Emoji');
    });

    it('should explain media management', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Media Management');
      expect(content).toContain('Upload');
      expect(content).toContain('Image');
      expect(content).toContain('Video');
    });

    it('should explain image editing', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Image Editing');
      expect(content).toContain('Crop');
      expect(content).toContain('Resize');
      expect(content).toContain('Filter');
    });

    it('should explain video editing', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Video Editing');
      expect(content).toContain('Trim');
      expect(content).toContain('Split');
    });

    it('should explain AI assistant', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('AI Assistant');
      expect(content).toContain('suggestions');
      expect(content).toContain('caption');
    });

    it('should explain templates', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Templates');
      expect(content).toContain('Browse');
      expect(content).toContain('Custom');
    });

    it('should explain platform optimization', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Platform Optimization');
      expect(content).toContain('Instagram');
      expect(content).toContain('TikTok');
      expect(content).toContain('dimensions');
    });

    it('should explain content variations', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Variations');
      expect(content).toContain('A/B testing');
    });

    it('should explain scheduling', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Scheduling');
      expect(content).toContain('Schedule Posts');
      expect(content).toContain('Calendar');
    });

    it('should explain tags and organization', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Tags');
      expect(content).toContain('Organization');
      expect(content).toContain('Categories');
    });

    it('should explain analytics', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Analytics');
      expect(content).toContain('Performance');
      expect(content).toContain('Engagement');
    });

    it('should explain import features', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Import');
      expect(content).toContain('URL');
      expect(content).toContain('CSV');
    });

    it('should include troubleshooting', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Troubleshooting');
      expect(content).toContain('Upload Failed');
      expect(content).toContain('Solutions');
    });

    it('should include tips and best practices', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Tips');
      expect(content).toContain('Best Practices');
    });

    it('should include support information', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Support');
      expect(content).toContain('Email');
      expect(content).toContain('help');
    });
  });

  describe('Documentation Quality', () => {
    it('should have user guides directory', () => {
      const userGuidesDir = path.join(process.cwd(), 'docs/user-guides');
      expect(fs.existsSync(userGuidesDir)).toBe(true);
    });

    it('should use clear headings and structure', () => {
      const guidePath = path.join(process.cwd(), 'docs/user-guides/CONTENT_CREATION_USER_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      // Should have multiple heading levels
      expect(content).toMatch(/^# /m);
      expect(content).toMatch(/^## /m);
      expect(content).toMatch(/^### /m);
    });

    it('should include visual elements (emojis, formatting)', () => {
      const guidePath = path.join(process.cwd(), 'docs/user-guides/CONTENT_CREATION_USER_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      // Should have emojis for visual appeal
      expect(content).toMatch(/[🎨📝🖼️🤖📋🎯📅🏷️📊📥🔍💡🆘📞]/);
    });

    it('should include code examples where relevant', () => {
      const guidePath = path.join(process.cwd(), 'docs/user-guides/CONTENT_CREATION_USER_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      // Should have code blocks for shortcuts, etc.
      expect(content).toContain('```');
      expect(content).toContain('`');
    });

    it('should include tables for structured information', () => {
      const guidePath = path.join(process.cwd(), 'docs/user-guides/CONTENT_CREATION_USER_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      // Should have markdown tables
      expect(content).toMatch(/\|.*\|/);
    });
  });

  describe('Documentation Completeness', () => {
    it('should cover all major features', () => {
      const guidePath = path.join(process.cwd(), 'docs/user-guides/CONTENT_CREATION_USER_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      const majorFeatures = [
        'Content Creation',
        'Media Management',
        'AI Assistant',
        'Templates',
        'Platform Optimization',
        'Scheduling',
        'Analytics',
      ];

      majorFeatures.forEach(feature => {
        expect(content).toContain(feature);
      });
    });

    it('should provide step-by-step instructions', () => {
      const guidePath = path.join(process.cwd(), 'docs/user-guides/CONTENT_CREATION_USER_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      // Should have numbered steps
      expect(content).toMatch(/1\./);
      expect(content).toMatch(/2\./);
      expect(content).toMatch(/3\./);
    });

    it('should include version and update information', () => {
      const guidePath = path.join(process.cwd(), 'docs/user-guides/CONTENT_CREATION_USER_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      expect(content).toContain('Version');
      expect(content).toContain('Last Updated');
    });
  });
});
