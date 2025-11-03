/**
 * Developer Guides Validation Tests
 * 
 * Validates that developer documentation is complete and technically accurate
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Developer Guides Validation', () => {
  describe('Social Integrations Developer Guide', () => {
    const guidePath = path.join(process.cwd(), 'docs/DEVELOPER_GUIDE_SOCIAL_INTEGRATIONS.md');

    it('should exist', () => {
      expect(fs.existsSync(guidePath)).toBe(true);
    });

    it('should include architecture overview', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Architecture');
      expect(content).toContain('Overview');
    });

    it('should document database schema', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Database');
      expect(content).toContain('Schema');
      expect(content).toContain('CREATE TABLE');
    });

    it('should document OAuth services', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('OAuth');
      expect(content).toContain('TikTok');
      expect(content).toContain('Instagram');
    });

    it('should include code examples', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('```typescript');
      expect(content).toContain('```sql');
      expect(content).toContain('```bash');
    });
  });

  describe('Content Creation Developer Guide', () => {
    const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');

    it('should exist', () => {
      expect(fs.existsSync(guidePath)).toBe(true);
    });

    it('should include architecture diagram', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Architecture');
      expect(content).toContain('Frontend Layer');
      expect(content).toContain('API Layer');
      expect(content).toContain('Service Layer');
    });

    it('should document database schema', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Database Schema');
      expect(content).toContain('content_items');
      expect(content).toContain('media_assets');
      expect(content).toContain('templates');
      expect(content).toContain('content_variations');
    });

    it('should document all API endpoints', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('API Endpoints');
      expect(content).toContain('POST /api/content');
      expect(content).toContain('GET /api/content');
      expect(content).toContain('PATCH /api/content');
    });

    it('should document media upload endpoints', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('POST /api/content/media/upload');
      expect(content).toContain('POST /api/content/media/[id]/edit');
      expect(content).toContain('multipart/form-data');
    });

    it('should document AI assistant endpoints', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('POST /api/content/ai/suggestions');
      expect(content).toContain('OpenAI');
    });

    it('should document platform optimization', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('POST /api/content/optimize');
      expect(content).toContain('platform');
    });

    it('should include service implementations', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('MediaUploadService');
      expect(content).toContain('AIContentService');
      expect(content).toContain('PlatformOptimizerService');
    });

    it('should document MediaUploadService', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('class MediaUploadService');
      expect(content).toContain('uploadImage');
      expect(content).toContain('S3Client');
      expect(content).toContain('sharp');
    });

    it('should document AIContentService', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('class AIContentService');
      expect(content).toContain('generateCaption');
      expect(content).toContain('suggestHashtags');
      expect(content).toContain('OpenAI');
    });

    it('should document PlatformOptimizerService', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('class PlatformOptimizerService');
      expect(content).toContain('optimizeForPlatform');
      expect(content).toContain('platformRequirements');
    });

    it('should document workers', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Workers');
      expect(content).toContain('ContentSchedulingWorker');
      expect(content).toContain('processScheduledContent');
    });

    it('should include testing examples', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Testing');
      expect(content).toContain('Unit Tests');
      expect(content).toContain('Integration Tests');
      expect(content).toContain('describe');
      expect(content).toContain('it(');
    });

    it('should document performance optimization', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Performance Optimization');
      expect(content).toContain('Image Optimization');
      expect(content).toContain('Caching');
    });

    it('should document security best practices', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Security');
      expect(content).toContain('File Upload Security');
      expect(content).toContain('Rate Limiting');
    });

    it('should document monitoring', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Monitoring');
      expect(content).toContain('Key Metrics');
      expect(content).toContain('Logging');
    });

    it('should link to deployment guide', () => {
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('Deployment');
      expect(content).toContain('CONTENT_CREATION_DEPLOYMENT.md');
    });
  });

  describe('Code Quality in Documentation', () => {
    it('should use TypeScript for code examples', () => {
      const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      expect(content).toContain('```typescript');
      expect(content).toContain(': string');
      expect(content).toContain(': Promise<');
      expect(content).toContain('interface');
    });

    it('should include proper SQL syntax', () => {
      const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      expect(content).toContain('CREATE TABLE');
      expect(content).toContain('PRIMARY KEY');
      expect(content).toContain('REFERENCES');
      expect(content).toContain('CREATE INDEX');
    });

    it('should include proper API request/response examples', () => {
      const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      expect(content).toContain('POST');
      expect(content).toContain('GET');
      expect(content).toContain('PATCH');
      expect(content).toContain('Response:');
      expect(content).toContain('Content-Type:');
    });

    it('should use consistent code formatting', () => {
      const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      // Check for consistent indentation in code blocks
      const codeBlocks = content.match(/```typescript[\s\S]*?```/g) || [];
      expect(codeBlocks.length).toBeGreaterThan(0);

      // Each code block should have proper indentation
      codeBlocks.forEach(block => {
        expect(block).toMatch(/\n  /); // Should have indentation
      });
    });
  });

  describe('Documentation Structure', () => {
    it('should have developer guides directory', () => {
      const devGuidesDir = path.join(process.cwd(), 'docs/developer-guides');
      expect(fs.existsSync(devGuidesDir)).toBe(true);
    });

    it('should follow consistent heading structure', () => {
      const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      // Should have hierarchical headings
      expect(content).toMatch(/^# /m);
      expect(content).toMatch(/^## /m);
      expect(content).toMatch(/^### /m);
    });

    it('should include table of contents or clear sections', () => {
      const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      const majorSections = [
        'Architecture',
        'Database Schema',
        'API Endpoints',
        'Services',
        'Testing',
        'Security',
        'Monitoring',
      ];

      majorSections.forEach(section => {
        expect(content).toContain(section);
      });
    });
  });

  describe('Technical Accuracy', () => {
    it('should reference actual file paths', () => {
      const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      expect(content).toContain('lib/services/');
      expect(content).toContain('lib/workers/');
      expect(content).toContain('tests/');
    });

    it('should use correct AWS service names', () => {
      const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      expect(content).toContain('S3');
      expect(content).toContain('CloudFront');
    });

    it('should reference correct npm packages', () => {
      const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      expect(content).toContain('sharp');
      expect(content).toContain('@aws-sdk/client-s3');
      expect(content).toContain('openai');
    });

    it('should include version information', () => {
      const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      expect(content).toContain('Version');
      expect(content).toContain('Last Updated');
    });
  });

  describe('Completeness', () => {
    it('should cover all major components', () => {
      const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      const components = [
        'ContentEditor',
        'MediaPicker',
        'AIAssistant',
        'ImageEditor',
        'VideoEditor',
        'TemplateSelector',
        'ContentCalendar',
      ];

      // Should mention most major components
      const mentionedCount = components.filter(comp => content.includes(comp)).length;
      expect(mentionedCount).toBeGreaterThan(components.length * 0.7);
    });

    it('should document error handling', () => {
      const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      expect(content).toMatch(/error|Error|catch|throw/);
    });

    it('should document environment variables', () => {
      const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      expect(content).toContain('process.env');
      expect(content).toMatch(/AWS_|OPENAI_|DATABASE_/);
    });
  });
});
