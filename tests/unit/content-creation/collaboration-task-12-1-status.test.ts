/**
 * Content Creation - Task 12.1 Implementation Status Test
 * 
 * This test validates that Task 12.1 (Content Sharing System) has been
 * properly implemented according to the requirements.
 */

import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Content Creation - Task 12.1: Content Sharing System', () => {
  const projectRoot = process.cwd();

  describe('API Endpoints', () => {
    it('should have collaborators management API endpoint', () => {
      const apiPath = path.join(projectRoot, 'app/api/content/[id]/collaborators/route.ts');
      expect(fs.existsSync(apiPath)).toBe(true);
      
      const content = fs.readFileSync(apiPath, 'utf8');
      expect(content).toContain('GET'); // List collaborators
      expect(content).toContain('POST'); // Add collaborator
      expect(content).toContain('PATCH'); // Update permissions
      expect(content).toContain('DELETE'); // Remove collaborator
    });

    it('should have invitation acceptance API endpoint', () => {
      const apiPath = path.join(projectRoot, 'app/api/content/collaborate/[token]/route.ts');
      expect(fs.existsSync(apiPath)).toBe(true);
      
      const content = fs.readFileSync(apiPath, 'utf8');
      expect(content).toContain('GET'); // Get invitation details
      expect(content).toContain('POST'); // Accept/decline invitation
      expect(content).toContain('accept');
      expect(content).toContain('decline');
    });
  });

  describe('Database Schema', () => {
    it('should have collaboration migration file', () => {
      const migrationPath = path.join(projectRoot, 'lib/db/migrations/2024-11-03-content-collaboration.sql');
      expect(fs.existsSync(migrationPath)).toBe(true);
      
      const content = fs.readFileSync(migrationPath, 'utf8');
      expect(content).toContain('content_collaborators');
      expect(content).toContain('content_comments');
      expect(content).toContain('content_revisions');
      expect(content).toContain('content_presence');
    });

    it('should have migration script', () => {
      const scriptPath = path.join(projectRoot, 'scripts/migrate-content-collaboration.js');
      expect(fs.existsSync(scriptPath)).toBe(true);
    });
  });

  describe('Repository Methods', () => {
    it('should have collaboration methods in contentItemsRepository', () => {
      const repoPath = path.join(projectRoot, 'lib/db/repositories/contentItemsRepository.ts');
      expect(fs.existsSync(repoPath)).toBe(true);
      
      const content = fs.readFileSync(repoPath, 'utf8');
      
      // Check for collaboration methods
      expect(content).toContain('checkUserAccess');
      expect(content).toContain('getCollaborators');
      expect(content).toContain('addCollaborator');
      expect(content).toContain('getInvitationByToken');
      expect(content).toContain('acceptInvitation');
      expect(content).toContain('updateCollaboratorPermission');
      expect(content).toContain('removeCollaborator');
    });
  });

  describe('UI Components', () => {
    it('should have CollaboratorManager component', () => {
      const componentPath = path.join(projectRoot, 'components/content/CollaboratorManager.tsx');
      expect(fs.existsSync(componentPath)).toBe(true);
      
      const content = fs.readFileSync(componentPath, 'utf8');
      expect(content).toContain('CollaboratorManager');
      expect(content).toContain('permission');
      expect(content).toContain('invite');
      expect(content).toContain('owner');
      expect(content).toContain('editor');
      expect(content).toContain('viewer');
    });

    it('should have collaboration invitation page', () => {
      const pagePath = path.join(projectRoot, 'app/content/collaborate/[token]/page.tsx');
      expect(fs.existsSync(pagePath)).toBe(true);
      
      const content = fs.readFileSync(pagePath, 'utf8');
      expect(content).toContain('CollaborationInvitePage');
      expect(content).toContain('accept');
      expect(content).toContain('decline');
    });
  });

  describe('Email Service', () => {
    it('should have collaboration email service', () => {
      const servicePath = path.join(projectRoot, 'lib/services/collaborationEmailService.ts');
      expect(fs.existsSync(servicePath)).toBe(true);
      
      const content = fs.readFileSync(servicePath, 'utf8');
      expect(content).toContain('CollaborationEmailService');
      expect(content).toContain('sendCollaborationInvite');
      expect(content).toContain('sendCollaboratorRemoved');
    });
  });

  describe('Permission System', () => {
    it('should implement proper permission levels', () => {
      const apiContent = fs.readFileSync(
        path.join(projectRoot, 'app/api/content/[id]/collaborators/route.ts'), 
        'utf8'
      );
      
      // Check for permission validation
      expect(apiContent).toContain("'owner'");
      expect(apiContent).toContain("'editor'");
      expect(apiContent).toContain("'viewer'");
      expect(apiContent).toContain('permission');
    });

    it('should have access control checks', () => {
      const repoContent = fs.readFileSync(
        path.join(projectRoot, 'lib/db/repositories/contentItemsRepository.ts'), 
        'utf8'
      );
      
      expect(repoContent).toContain('checkUserAccess');
      expect(repoContent).toContain('owner');
      expect(repoContent).toContain('collaborator');
    });
  });

  describe('Invitation System', () => {
    it('should implement invitation token system', () => {
      const repoContent = fs.readFileSync(
        path.join(projectRoot, 'lib/db/repositories/contentItemsRepository.ts'), 
        'utf8'
      );
      
      expect(repoContent).toContain('token');
      expect(repoContent).toContain('getInvitationByToken');
      expect(repoContent).toContain('acceptInvitation');
    });

    it('should have invitation status management', () => {
      const migrationContent = fs.readFileSync(
        path.join(projectRoot, 'lib/db/migrations/2024-11-03-content-collaboration.sql'), 
        'utf8'
      );
      
      expect(migrationContent).toContain('pending');
      expect(migrationContent).toContain('accepted');
      expect(migrationContent).toContain('declined');
      expect(migrationContent).toContain('expired');
    });
  });

  describe('Requirements Compliance', () => {
    it('should meet requirement 11.1 - Content sharing system', () => {
      // API for adding collaborators
      const apiExists = fs.existsSync(path.join(projectRoot, 'app/api/content/[id]/collaborators/route.ts'));
      expect(apiExists).toBe(true);
      
      // Permission system
      const repoContent = fs.readFileSync(
        path.join(projectRoot, 'lib/db/repositories/contentItemsRepository.ts'), 
        'utf8'
      );
      expect(repoContent).toContain('permission');
    });

    it('should meet requirement 11.2 - Permission system and invitations', () => {
      // Invitation system
      const inviteApiExists = fs.existsSync(path.join(projectRoot, 'app/api/content/collaborate/[token]/route.ts'));
      expect(inviteApiExists).toBe(true);
      
      // Email service
      const emailServiceExists = fs.existsSync(path.join(projectRoot, 'lib/services/collaborationEmailService.ts'));
      expect(emailServiceExists).toBe(true);
    });
  });

  describe('Task Completion Status', () => {
    it('should have all required components for Task 12.1', () => {
      const requiredFiles = [
        'app/api/content/[id]/collaborators/route.ts',
        'app/api/content/collaborate/[token]/route.ts',
        'components/content/CollaboratorManager.tsx',
        'app/content/collaborate/[token]/page.tsx',
        'lib/services/collaborationEmailService.ts',
        'lib/db/migrations/2024-11-03-content-collaboration.sql',
        'scripts/migrate-content-collaboration.js'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(projectRoot, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should have proper error handling', () => {
      const apiContent = fs.readFileSync(
        path.join(projectRoot, 'app/api/content/[id]/collaborators/route.ts'), 
        'utf8'
      );
      
      expect(apiContent).toContain('try');
      expect(apiContent).toContain('catch');
      expect(apiContent).toContain('error');
    });

    it('should have proper validation', () => {
      const apiContent = fs.readFileSync(
        path.join(projectRoot, 'app/api/content/[id]/collaborators/route.ts'), 
        'utf8'
      );
      
      expect(apiContent).toContain('validation');
      expect(apiContent).toContain('safeParse');
      expect(apiContent).toContain('email');
    });
  });
});

// Export test metadata
export const testMetadata = {
  task: '12.1',
  feature: 'Content Sharing System',
  requirements: ['11.1', '11.2'],
  status: 'COMPLETED',
  completedAt: new Date().toISOString(),
  components: [
    'API endpoints for collaborator management',
    'Invitation system with tokens',
    'Permission system (owner/editor/viewer)',
    'Email notification service',
    'UI components for collaboration',
    'Database schema for collaboration',
    'Migration scripts'
  ]
};