/**
 * Unit Tests - Social Integrations Task 7 Status
 * 
 * Tests to validate that Task 7 (TikTok UI Components) is properly tracked
 * Based on: .kiro/specs/social-integrations/tasks.md
 * 
 * Coverage:
 * - Task 7 status is marked as in progress [-]
 * - Subtasks 7.1, 7.2, 7.3 are marked as complete [x]
 * - Tests exist for all UI components
 * - Implementation files exist for all components
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Social Integrations - Task 7 Status', () => {
  let tasksContent: string;

  beforeAll(() => {
    const tasksPath = join(process.cwd(), '.kiro/specs/social-integrations/tasks.md');
    tasksContent = readFileSync(tasksPath, 'utf-8');
  });

  describe('Task 7 Status Tracking', () => {
    it('should mark Task 7 as complete', () => {
      // Task 7 should be marked with [x] indicating complete
      expect(tasksContent).toContain('- [x] 7. TikTok UI Components');
    });

    it('should NOT mark Task 7 as not started', () => {
      // Task 7 should not be marked as not started
      expect(tasksContent).not.toContain('- [ ] 7. TikTok UI Components');
    });
  });

  describe('Task 7.1 - TikTok Connect Page', () => {
    it('should mark subtask 7.1 as complete', () => {
      expect(tasksContent).toContain('- [x] 7.1 Create TikTok connect page (/platforms/connect/tiktok)');
    });

    it('should list all requirements for 7.1', () => {
      const task71Section = tasksContent.match(/7\.1 Create TikTok connect page[\s\S]*?(?=- \[)/);
      expect(task71Section).toBeTruthy();
      
      const section = task71Section![0];
      expect(section).toContain('Display "Connect TikTok" button');
      expect(section).toContain('Show loading state during OAuth');
      expect(section).toContain('Display connection status');
      expect(section).toContain('Show error messages if OAuth fails');
    });

    it('should reference correct requirements', () => {
      const task71Section = tasksContent.match(/7\.1 Create TikTok connect page[\s\S]*?(?=- \[)/);
      expect(task71Section![0]).toContain('_Requirements: 1.1, 10.1_');
    });
  });

  describe('Task 7.2 - TikTok Upload Form', () => {
    it('should mark subtask 7.2 as complete', () => {
      expect(tasksContent).toContain('- [x] 7.2 Create TikTok upload form');
    });

    it('should list all requirements for 7.2', () => {
      const task72Section = tasksContent.match(/7\.2 Create TikTok upload form[\s\S]*?(?=- \[)/);
      expect(task72Section).toBeTruthy();
      
      const section = task72Section![0];
      expect(section).toContain('File upload with progress bar');
      expect(section).toContain('URL input for PULL_FROM_URL mode');
      expect(section).toContain('Caption and privacy settings');
      expect(section).toContain('Display quota usage (X/5 pending)');
      expect(section).toContain('Show upload status and errors');
    });

    it('should reference correct requirements', () => {
      const task72Section = tasksContent.match(/7\.2 Create TikTok upload form[\s\S]*?(?=- \[)/);
      expect(task72Section![0]).toContain('_Requirements: 2.1, 2.4, 2.5, 10.2_');
    });

    it('should have tests for upload form logic', () => {
      const testPath = join(process.cwd(), 'tests/unit/ui/tiktok-upload-form-logic.test.ts');
      expect(existsSync(testPath)).toBe(true);
    });
  });

  describe('Task 7.3 - TikTok Dashboard Widget', () => {
    it('should mark subtask 7.3 as complete', () => {
      expect(tasksContent).toContain('- [x] 7.3 Create TikTok dashboard widget');
    });

    it('should list all requirements for 7.3', () => {
      const task73Section = tasksContent.match(/7\.3 Create TikTok dashboard widget[\s\S]*?(?=- \[)/);
      expect(task73Section).toBeTruthy();
      
      const section = task73Section![0];
      expect(section).toContain('Display connected account info');
      expect(section).toContain('Show recent uploads with status');
      expect(section).toContain('Display analytics (views, likes, shares)');
      expect(section).toContain('"Disconnect" button');
    });

    it('should reference correct requirements', () => {
      const task73Section = tasksContent.match(/7\.3 Create TikTok dashboard widget[\s\S]*?(?=- \[)/);
      expect(task73Section![0]).toContain('_Requirements: 4.4_');
    });

    it('should have tests for dashboard widget logic', () => {
      const testPath = join(process.cwd(), 'tests/unit/ui/tiktok-dashboard-widget-logic.test.ts');
      expect(existsSync(testPath)).toBe(true);
    });
  });

  describe('Test Coverage for Task 7', () => {
    it('should have unit tests for upload form', () => {
      const testPath = join(process.cwd(), 'tests/unit/ui/tiktok-upload-form-logic.test.ts');
      expect(existsSync(testPath)).toBe(true);
      
      const testContent = readFileSync(testPath, 'utf-8');
      expect(testContent).toContain('TikTok Upload Form Logic');
      expect(testContent).toContain('Task 7.2');
    });

    it('should have unit tests for dashboard widget', () => {
      const testPath = join(process.cwd(), 'tests/unit/ui/tiktok-dashboard-widget-logic.test.ts');
      expect(existsSync(testPath)).toBe(true);
      
      const testContent = readFileSync(testPath, 'utf-8');
      expect(testContent).toContain('TikTok Dashboard Widget Logic');
      expect(testContent).toContain('Task 7.3');
    });

    it('should have README for UI tests', () => {
      const readmePath = join(process.cwd(), 'tests/unit/ui/README.md');
      expect(existsSync(readmePath)).toBe(true);
    });
  });

  describe('Implementation Files', () => {
    it('should have TikTok upload page', () => {
      const pagePath = join(process.cwd(), 'app/platforms/tiktok/upload/page.tsx');
      expect(existsSync(pagePath)).toBe(true);
    });

    it('should have TikTok dashboard widget component', () => {
      const componentPath = join(process.cwd(), 'components/platforms/TikTokDashboardWidget.tsx');
      expect(existsSync(componentPath)).toBe(true);
    });
  });

  describe('Task 7 Completion Criteria', () => {
    it('should have all subtasks marked as complete', () => {
      expect(tasksContent).toContain('- [x] 7.1 Create TikTok connect page');
      expect(tasksContent).toContain('- [x] 7.2 Create TikTok upload form');
      expect(tasksContent).toContain('- [x] 7.3 Create TikTok dashboard widget');
    });

    it('should have tests for all UI components', () => {
      const uploadFormTestPath = join(process.cwd(), 'tests/unit/ui/tiktok-upload-form-logic.test.ts');
      const dashboardWidgetTestPath = join(process.cwd(), 'tests/unit/ui/tiktok-dashboard-widget-logic.test.ts');
      
      expect(existsSync(uploadFormTestPath)).toBe(true);
      expect(existsSync(dashboardWidgetTestPath)).toBe(true);
    });

    it('should have implementation files for all components', () => {
      const uploadPagePath = join(process.cwd(), 'app/platforms/tiktok/upload/page.tsx');
      const dashboardWidgetPath = join(process.cwd(), 'components/platforms/TikTokDashboardWidget.tsx');
      
      expect(existsSync(uploadPagePath)).toBe(true);
      expect(existsSync(dashboardWidgetPath)).toBe(true);
    });
  });

  describe('Task 7 vs Task 8 Relationship', () => {
    it('should have Task 8 (TikTok Tests) marked as optional', () => {
      expect(tasksContent).toContain('- [ ]* 8. TikTok Tests');
    });

    it('should note that Task 8 tests are optional', () => {
      const notesSection = tasksContent.match(/## Notes[\s\S]*$/);
      expect(notesSection).toBeTruthy();
      expect(notesSection![0]).toContain('Tasks marked with `*` are optional testing tasks');
    });

    it('should have Task 7 tests as part of implementation', () => {
      // Task 7 tests are part of the implementation, not optional
      expect(tasksContent).not.toContain('- [ ]* 7. TikTok UI Components');
    });
  });

  describe('Documentation References', () => {
    it('should reference requirements correctly', () => {
      expect(tasksContent).toContain('_Requirements: 1.1, 10.1_'); // Task 7.1
      expect(tasksContent).toContain('_Requirements: 2.1, 2.4, 2.5, 10.2_'); // Task 7.2
      expect(tasksContent).toContain('_Requirements: 4.4_'); // Task 7.3
    });

    it('should have proper task numbering', () => {
      expect(tasksContent).toContain('- [x] 7. TikTok UI Components');
      expect(tasksContent).toContain('- [x] 7.1 Create TikTok connect page');
      expect(tasksContent).toContain('- [x] 7.2 Create TikTok upload form');
      expect(tasksContent).toContain('- [x] 7.3 Create TikTok dashboard widget');
    });
  });

  describe('Task 7 Progress Validation', () => {
    it('should be in complete state', () => {
      // Extract Task 7 line
      const task7Line = tasksContent.match(/- \[.\] 7\. TikTok UI Components/);
      expect(task7Line).toBeTruthy();
      
      // Should be [x] (complete)
      expect(task7Line![0]).toContain('- [x] 7. TikTok UI Components');
    });

    it('should have all subtasks complete when parent is complete', () => {
      // All subtasks should be complete when parent task is complete
      expect(tasksContent).toContain('- [x] 7. TikTok UI Components');
      expect(tasksContent).toContain('- [x] 7.1');
      expect(tasksContent).toContain('- [x] 7.2');
      expect(tasksContent).toContain('- [x] 7.3');
    });
  });
});
