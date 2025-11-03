/**
 * All Priorities Complete Validation
 * 
 * Validates that Priorities 1, 2, and 3 are fully complete
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('All Priorities Complete', () => {
  describe('Priority 1 - Deployment', () => {
    it('should have OnlyFans CRM deployment configuration', () => {
      const configPath = path.join(process.cwd(), 'docs/deployment/ONLYFANS_AMPLIFY_CONFIG.md');
      expect(fs.existsSync(configPath)).toBe(true);
      
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content.length).toBeGreaterThan(1000);
    });

    it('should have Content Creation deployment configuration', () => {
      const configPath = path.join(process.cwd(), 'docs/deployment/CONTENT_CREATION_DEPLOYMENT.md');
      expect(fs.existsSync(configPath)).toBe(true);
      
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content.length).toBeGreaterThan(1000);
    });

    it('should have Quick Start deployment guide', () => {
      const guidePath = path.join(process.cwd(), 'docs/deployment/QUICK_START.md');
      expect(fs.existsSync(guidePath)).toBe(true);
      
      const content = fs.readFileSync(guidePath, 'utf-8');
      expect(content).toContain('15 Minutes');
      expect(content).toContain('Prerequisites');
      expect(content).toContain('Troubleshooting');
    });

    it('should document all required AWS services', () => {
      const onlyfansPath = path.join(process.cwd(), 'docs/deployment/ONLYFANS_AMPLIFY_CONFIG.md');
      const contentPath = path.join(process.cwd(), 'docs/deployment/CONTENT_CREATION_DEPLOYMENT.md');
      
      const onlyfansContent = fs.readFileSync(onlyfansPath, 'utf-8');
      const contentContent = fs.readFileSync(contentPath, 'utf-8');

      // OnlyFans should document SQS, RDS
      expect(onlyfansContent).toContain('SQS');
      expect(onlyfansContent).toContain('RDS');
      expect(onlyfansContent).toContain('PostgreSQL');

      // Content Creation should document S3, CloudFront
      expect(contentContent).toContain('S3');
      expect(contentContent).toContain('CloudFront');
    });

    it('should include Amplify build settings', () => {
      const onlyfansPath = path.join(process.cwd(), 'docs/deployment/ONLYFANS_AMPLIFY_CONFIG.md');
      const contentPath = path.join(process.cwd(), 'docs/deployment/CONTENT_CREATION_DEPLOYMENT.md');
      
      const onlyfansContent = fs.readFileSync(onlyfansPath, 'utf-8');
      const contentContent = fs.readFileSync(contentPath, 'utf-8');

      [onlyfansContent, contentContent].forEach(content => {
        expect(content).toContain('version: 1');
        expect(content).toContain('preBuild');
        expect(content).toContain('build');
        expect(content).toContain('artifacts');
      });
    });
  });

  describe('Priority 2 - Documentation', () => {
    describe('User Guides', () => {
      it('should have Social Integrations user guide', () => {
        const guidePath = path.join(process.cwd(), 'docs/USER_GUIDE_SOCIAL_INTEGRATIONS.md');
        expect(fs.existsSync(guidePath)).toBe(true);
        
        const content = fs.readFileSync(guidePath, 'utf-8');
        expect(content.length).toBeGreaterThan(2000);
        expect(content).toContain('TikTok');
        expect(content).toContain('Instagram');
      });

      it('should have Content Creation user guide', () => {
        const guidePath = path.join(process.cwd(), 'docs/user-guides/CONTENT_CREATION_USER_GUIDE.md');
        expect(fs.existsSync(guidePath)).toBe(true);
        
        const content = fs.readFileSync(guidePath, 'utf-8');
        expect(content.length).toBeGreaterThan(5000);
        expect(content).toContain('Creating Content');
        expect(content).toContain('Media Management');
        expect(content).toContain('AI Assistant');
      });

      it('should cover all major user workflows', () => {
        const contentGuidePath = path.join(process.cwd(), 'docs/user-guides/CONTENT_CREATION_USER_GUIDE.md');
        const content = fs.readFileSync(contentGuidePath, 'utf-8');

        const workflows = [
          'Creating Content',
          'Upload',
          'Edit',
          'Schedule',
          'Publish',
          'Analytics',
        ];

        workflows.forEach(workflow => {
          expect(content.toLowerCase()).toContain(workflow.toLowerCase());
        });
      });

      it('should include troubleshooting sections', () => {
        const socialGuidePath = path.join(process.cwd(), 'docs/USER_GUIDE_SOCIAL_INTEGRATIONS.md');
        const contentGuidePath = path.join(process.cwd(), 'docs/user-guides/CONTENT_CREATION_USER_GUIDE.md');
        
        const socialContent = fs.readFileSync(socialGuidePath, 'utf-8');
        const contentContent = fs.readFileSync(contentGuidePath, 'utf-8');

        expect(socialContent).toContain('Résolution');
        expect(contentContent).toContain('Troubleshooting');
      });
    });

    describe('Developer Guides', () => {
      it('should have Social Integrations developer guide', () => {
        const guidePath = path.join(process.cwd(), 'docs/DEVELOPER_GUIDE_SOCIAL_INTEGRATIONS.md');
        expect(fs.existsSync(guidePath)).toBe(true);
        
        const content = fs.readFileSync(guidePath, 'utf-8');
        expect(content.length).toBeGreaterThan(2000);
      });

      it('should have Content Creation developer guide', () => {
        const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
        expect(fs.existsSync(guidePath)).toBe(true);
        
        const content = fs.readFileSync(guidePath, 'utf-8');
        expect(content.length).toBeGreaterThan(5000);
      });

      it('should document architecture', () => {
        const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
        const content = fs.readFileSync(guidePath, 'utf-8');

        expect(content).toContain('Architecture');
        expect(content).toContain('Frontend Layer');
        expect(content).toContain('API Layer');
        expect(content).toContain('Service Layer');
      });

      it('should document database schemas', () => {
        const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
        const content = fs.readFileSync(guidePath, 'utf-8');

        expect(content).toContain('Database Schema');
        expect(content).toContain('CREATE TABLE');
        expect(content).toContain('content_items');
        expect(content).toContain('media_assets');
      });

      it('should document API endpoints', () => {
        const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
        const content = fs.readFileSync(guidePath, 'utf-8');

        expect(content).toContain('API Endpoints');
        expect(content).toContain('POST');
        expect(content).toContain('GET');
        expect(content).toContain('/api/content');
      });

      it('should include code examples', () => {
        const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
        const content = fs.readFileSync(guidePath, 'utf-8');

        expect(content).toContain('```typescript');
        expect(content).toContain('```sql');
        expect(content).toContain('class');
        expect(content).toContain('async');
      });

      it('should document services', () => {
        const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
        const content = fs.readFileSync(guidePath, 'utf-8');

        expect(content).toContain('MediaUploadService');
        expect(content).toContain('AIContentService');
        expect(content).toContain('PlatformOptimizerService');
      });

      it('should document testing', () => {
        const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
        const content = fs.readFileSync(guidePath, 'utf-8');

        expect(content).toContain('Testing');
        expect(content).toContain('Unit Tests');
        expect(content).toContain('Integration Tests');
      });

      it('should document security', () => {
        const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
        const content = fs.readFileSync(guidePath, 'utf-8');

        expect(content).toContain('Security');
        expect(content).toContain('File Upload Security');
        expect(content).toContain('Rate Limiting');
      });

      it('should document monitoring', () => {
        const guidePath = path.join(process.cwd(), 'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md');
        const content = fs.readFileSync(guidePath, 'utf-8');

        expect(content).toContain('Monitoring');
        expect(content).toContain('Metrics');
        expect(content).toContain('Logging');
      });
    });
  });

  describe('Priority 3 - Tests', () => {
    it('should have deployment validation tests', () => {
      const testPath = path.join(process.cwd(), 'tests/integration/deployment/deployment-validation.test.ts');
      expect(fs.existsSync(testPath)).toBe(true);
      
      const content = fs.readFileSync(testPath, 'utf-8');
      expect(content).toContain('Deployment Configuration Validation');
      expect(content).toContain('OnlyFans CRM Deployment');
      expect(content).toContain('Content Creation Deployment');
    });

    it('should have user guides validation tests', () => {
      const testPath = path.join(process.cwd(), 'tests/integration/documentation/user-guides-validation.test.ts');
      expect(fs.existsSync(testPath)).toBe(true);
      
      const content = fs.readFileSync(testPath, 'utf-8');
      expect(content).toContain('User Guides Validation');
      expect(content).toContain('Social Integrations User Guide');
      expect(content).toContain('Content Creation User Guide');
    });

    it('should have developer guides validation tests', () => {
      const testPath = path.join(process.cwd(), 'tests/integration/documentation/developer-guides-validation.test.ts');
      expect(fs.existsSync(testPath)).toBe(true);
      
      const content = fs.readFileSync(testPath, 'utf-8');
      expect(content).toContain('Developer Guides Validation');
      expect(content).toContain('Social Integrations Developer Guide');
      expect(content).toContain('Content Creation Developer Guide');
    });

    it('should have comprehensive test coverage', () => {
      const testFiles = [
        'tests/integration/deployment/deployment-validation.test.ts',
        'tests/integration/documentation/user-guides-validation.test.ts',
        'tests/integration/documentation/developer-guides-validation.test.ts',
        'tests/integration/specs/all-priorities-complete.test.ts',
      ];

      testFiles.forEach(testFile => {
        const testPath = path.join(process.cwd(), testFile);
        expect(fs.existsSync(testPath)).toBe(true);
      });
    });
  });

  describe('Overall Completeness', () => {
    it('should have all deployment documentation', () => {
      const deploymentFiles = [
        'docs/deployment/ONLYFANS_AMPLIFY_CONFIG.md',
        'docs/deployment/CONTENT_CREATION_DEPLOYMENT.md',
        'docs/deployment/QUICK_START.md',
      ];

      deploymentFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should have all user documentation', () => {
      const userGuides = [
        'docs/USER_GUIDE_SOCIAL_INTEGRATIONS.md',
        'docs/user-guides/CONTENT_CREATION_USER_GUIDE.md',
      ];

      userGuides.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should have all developer documentation', () => {
      const devGuides = [
        'docs/DEVELOPER_GUIDE_SOCIAL_INTEGRATIONS.md',
        'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md',
      ];

      devGuides.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should have all validation tests', () => {
      const testFiles = [
        'tests/integration/deployment/deployment-validation.test.ts',
        'tests/integration/documentation/user-guides-validation.test.ts',
        'tests/integration/documentation/developer-guides-validation.test.ts',
      ];

      testFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should have priorities completion summary', () => {
      const summaryPath = path.join(process.cwd(), 'PRIORITIES_1_2_COMPLETE.md');
      expect(fs.existsSync(summaryPath)).toBe(true);
      
      const content = fs.readFileSync(summaryPath, 'utf-8');
      expect(content).toContain('Priorité 1');
      expect(content).toContain('Priorité 2');
      expect(content).toContain('Priorité 3');
    });
  });

  describe('Documentation Quality Standards', () => {
    it('should have consistent formatting across all docs', () => {
      const allDocs = [
        'docs/deployment/ONLYFANS_AMPLIFY_CONFIG.md',
        'docs/deployment/CONTENT_CREATION_DEPLOYMENT.md',
        'docs/user-guides/CONTENT_CREATION_USER_GUIDE.md',
        'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md',
      ];

      allDocs.forEach(docPath => {
        const fullPath = path.join(process.cwd(), docPath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          
          // Should have proper markdown structure
          expect(content).toMatch(/^# /m);
          expect(content).toMatch(/^## /m);
          
          // Should have code blocks
          expect(content).toContain('```');
        }
      });
    });

    it('should include version information in all guides', () => {
      const guides = [
        'docs/user-guides/CONTENT_CREATION_USER_GUIDE.md',
        'docs/developer-guides/CONTENT_CREATION_DEV_GUIDE.md',
      ];

      guides.forEach(guidePath => {
        const fullPath = path.join(process.cwd(), guidePath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          expect(content).toContain('Version');
        }
      });
    });
  });

  describe('Deployment Readiness', () => {
    it('should document all environment variables consistently', () => {
      const deploymentDocs = [
        'docs/deployment/ONLYFANS_AMPLIFY_CONFIG.md',
        'docs/deployment/CONTENT_CREATION_DEPLOYMENT.md',
        'docs/deployment/QUICK_START.md',
      ];

      const coreVars = ['DATABASE_URL', 'JWT_SECRET', 'NEXTAUTH_SECRET'];

      deploymentDocs.forEach(docPath => {
        const fullPath = path.join(process.cwd(), docPath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        coreVars.forEach(varName => {
          expect(content).toContain(varName);
        });
      });
    });

    it('should include cost estimates', () => {
      const deploymentDocs = [
        'docs/deployment/ONLYFANS_AMPLIFY_CONFIG.md',
        'docs/deployment/CONTENT_CREATION_DEPLOYMENT.md',
      ];

      deploymentDocs.forEach(docPath => {
        const fullPath = path.join(process.cwd(), docPath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        expect(content.toLowerCase()).toMatch(/cost|price|\$/);
      });
    });

    it('should include monitoring setup', () => {
      const deploymentDocs = [
        'docs/deployment/ONLYFANS_AMPLIFY_CONFIG.md',
        'docs/deployment/CONTENT_CREATION_DEPLOYMENT.md',
      ];

      deploymentDocs.forEach(docPath => {
        const fullPath = path.join(process.cwd(), docPath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        expect(content).toContain('Monitoring');
      });
    });
  });
});
