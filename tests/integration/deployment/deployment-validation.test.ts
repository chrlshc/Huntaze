/**
 * Deployment Validation Tests
 * 
 * Validates that all deployment configurations are correct and complete
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Deployment Configuration Validation', () => {
  describe('OnlyFans CRM Deployment', () => {
    it('should have OnlyFans Amplify configuration file', () => {
      const configPath = path.join(process.cwd(), 'docs/deployment/ONLYFANS_AMPLIFY_CONFIG.md');
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should document all required environment variables', () => {
      const configPath = path.join(process.cwd(), 'docs/deployment/ONLYFANS_AMPLIFY_CONFIG.md');
      const content = fs.readFileSync(configPath, 'utf-8');

      const requiredVars = [
        'NODE_ENV',
        'DATABASE_URL',
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL',
        'ONLYFANS_API_URL',
        'AWS_SQS_QUEUE_URL',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
      ];

      requiredVars.forEach(varName => {
        expect(content).toContain(varName);
      });
    });

    it('should include AWS infrastructure setup instructions', () => {
      const configPath = path.join(process.cwd(), 'docs/deployment/ONLYFANS_AMPLIFY_CONFIG.md');
      const content = fs.readFileSync(configPath, 'utf-8');

      expect(content).toContain('SQS');
      expect(content).toContain('IAM');
      expect(content).toContain('RDS');
      expect(content).toContain('PostgreSQL');
    });

    it('should include build settings for Amplify', () => {
      const configPath = path.join(process.cwd(), 'docs/deployment/ONLYFANS_AMPLIFY_CONFIG.md');
      const content = fs.readFileSync(configPath, 'utf-8');

      expect(content).toContain('version: 1');
      expect(content).toContain('preBuild');
      expect(content).toContain('build');
      expect(content).toContain('npm ci');
      expect(content).toContain('npm run build');
    });

    it('should include post-deployment verification steps', () => {
      const configPath = path.join(process.cwd(), 'docs/deployment/ONLYFANS_AMPLIFY_CONFIG.md');
      const content = fs.readFileSync(configPath, 'utf-8');

      expect(content).toContain('/api/health');
      expect(content).toContain('/api/onlyfans/messages/status');
      expect(content).toContain('curl');
    });
  });

  describe('Content Creation Deployment', () => {
    it('should have Content Creation deployment configuration file', () => {
      const configPath = path.join(process.cwd(), 'docs/deployment/CONTENT_CREATION_DEPLOYMENT.md');
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should document all required environment variables', () => {
      const configPath = path.join(process.cwd(), 'docs/deployment/CONTENT_CREATION_DEPLOYMENT.md');
      const content = fs.readFileSync(configPath, 'utf-8');

      const requiredVars = [
        'AWS_S3_BUCKET',
        'CLOUDFRONT_DOMAIN',
        'OPENAI_API_KEY',
        'OPENAI_MODEL',
        'MAX_FILE_SIZE',
        'PREVIEW_TOKEN_SECRET',
      ];

      requiredVars.forEach(varName => {
        expect(content).toContain(varName);
      });
    });

    it('should include S3 and CloudFront setup', () => {
      const configPath = path.join(process.cwd(), 'docs/deployment/CONTENT_CREATION_DEPLOYMENT.md');
      const content = fs.readFileSync(configPath, 'utf-8');

      expect(content).toContain('S3');
      expect(content).toContain('CloudFront');
      expect(content).toContain('CORS');
      expect(content).toContain('aws s3 mb');
    });

    it('should include FFmpeg installation for video processing', () => {
      const configPath = path.join(process.cwd(), 'docs/deployment/CONTENT_CREATION_DEPLOYMENT.md');
      const content = fs.readFileSync(configPath, 'utf-8');

      expect(content).toContain('ffmpeg');
    });

    it('should include Next.js configuration for large file uploads', () => {
      const configPath = path.join(process.cwd(), 'docs/deployment/CONTENT_CREATION_DEPLOYMENT.md');
      const content = fs.readFileSync(configPath, 'utf-8');

      expect(content).toContain('next.config.js');
      expect(content).toContain('bodyParser');
      expect(content).toContain('sizeLimit');
    });
  });

  describe('Quick Start Guide', () => {
    it('should have quick start deployment guide', () => {
      const guidePath = path.join(process.cwd(), 'docs/deployment/QUICK_START.md');
      expect(fs.existsSync(guidePath)).toBe(true);
    });

    it('should include secret generation commands', () => {
      const guidePath = path.join(process.cwd(), 'docs/deployment/QUICK_START.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      expect(content).toContain('openssl rand -base64 32');
      expect(content).toContain('JWT_SECRET');
      expect(content).toContain('NEXTAUTH_SECRET');
    });

    it('should include AWS infrastructure setup commands', () => {
      const guidePath = path.join(process.cwd(), 'docs/deployment/QUICK_START.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      expect(content).toContain('aws sqs create-queue');
      expect(content).toContain('aws s3 mb');
    });

    it('should include troubleshooting section', () => {
      const guidePath = path.join(process.cwd(), 'docs/deployment/QUICK_START.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      expect(content).toContain('Troubleshooting');
      expect(content).toContain('Build Failed');
      expect(content).toContain('Database Connection Error');
    });

    it('should include success checklist', () => {
      const guidePath = path.join(process.cwd(), 'docs/deployment/QUICK_START.md');
      const content = fs.readFileSync(guidePath, 'utf-8');

      expect(content).toContain('Success Checklist');
      expect(content).toContain('- [ ]');
    });
  });

  describe('Environment Variables Consistency', () => {
    it('should have consistent variable names across all deployment docs', () => {
      const onlyfansPath = path.join(process.cwd(), 'docs/deployment/ONLYFANS_AMPLIFY_CONFIG.md');
      const contentPath = path.join(process.cwd(), 'docs/deployment/CONTENT_CREATION_DEPLOYMENT.md');
      const quickStartPath = path.join(process.cwd(), 'docs/deployment/QUICK_START.md');

      const onlyfansContent = fs.readFileSync(onlyfansPath, 'utf-8');
      const contentContent = fs.readFileSync(contentPath, 'utf-8');
      const quickStartContent = fs.readFileSync(quickStartPath, 'utf-8');

      // Core variables should be consistent
      const coreVars = ['DATABASE_URL', 'JWT_SECRET', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];

      coreVars.forEach(varName => {
        expect(onlyfansContent).toContain(varName);
        expect(contentContent).toContain(varName);
        expect(quickStartContent).toContain(varName);
      });
    });
  });

  describe('Deployment Readiness', () => {
    it('should have all necessary deployment documentation', () => {
      const deploymentDir = path.join(process.cwd(), 'docs/deployment');
      expect(fs.existsSync(deploymentDir)).toBe(true);

      const files = fs.readdirSync(deploymentDir);
      expect(files).toContain('ONLYFANS_AMPLIFY_CONFIG.md');
      expect(files).toContain('CONTENT_CREATION_DEPLOYMENT.md');
      expect(files).toContain('QUICK_START.md');
    });

    it('should document estimated costs', () => {
      const onlyfansPath = path.join(process.cwd(), 'docs/deployment/ONLYFANS_AMPLIFY_CONFIG.md');
      const contentPath = path.join(process.cwd(), 'docs/deployment/CONTENT_CREATION_DEPLOYMENT.md');

      const onlyfansContent = fs.readFileSync(onlyfansPath, 'utf-8');
      const contentContent = fs.readFileSync(contentPath, 'utf-8');

      expect(onlyfansContent.toLowerCase()).toMatch(/cost|price|\$/);
      expect(contentContent.toLowerCase()).toMatch(/cost|price|\$/);
    });

    it('should include monitoring and observability setup', () => {
      const onlyfansPath = path.join(process.cwd(), 'docs/deployment/ONLYFANS_AMPLIFY_CONFIG.md');
      const contentPath = path.join(process.cwd(), 'docs/deployment/CONTENT_CREATION_DEPLOYMENT.md');

      const onlyfansContent = fs.readFileSync(onlyfansPath, 'utf-8');
      const contentContent = fs.readFileSync(contentPath, 'utf-8');

      expect(onlyfansContent).toContain('Monitoring');
      expect(contentContent).toContain('Monitoring');
    });
  });
});
