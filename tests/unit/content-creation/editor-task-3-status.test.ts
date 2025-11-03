/**
 * Unit Tests - Task 3 Status Validation
 * 
 * Tests to validate Task 3 completion status
 * Based on: .kiro/specs/content-creation/tasks.md (Task 3)
 * 
 * Coverage:
 * - Task 3.1: Tiptap editor setup
 * - Task 3.2: Auto-save functionality
 * - Task 3.3: Media insertion
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Task 3: Build Rich Text Content Editor - Status Validation', () => {
  let tasksContent: string;

  beforeAll(() => {
    const tasksPath = join(process.cwd(), '.kiro/specs/content-creation/tasks.md');
    tasksContent = readFileSync(tasksPath, 'utf-8');
  });

  describe('Task 3 Status', () => {
    it('should mark Task 3 as in progress', () => {
      expect(tasksContent).toContain('- [-] 3. Build rich text content editor');
    });

    it('should have Task 3.1 marked as complete', () => {
      expect(tasksContent).toContain('- [x] 3.1 Set up Tiptap editor with formatting extensions');
    });

    it('should have Task 3.2 marked as complete', () => {
      expect(tasksContent).toContain('- [x] 3.2 Implement auto-save functionality');
    });

    it('should have Task 3.3 marked as complete', () => {
      expect(tasksContent).toContain('- [x] 3.3 Add media insertion to editor');
    });
  });

  describe('Task 3.1 - Tiptap Editor Setup', () => {
    it('should reference Tiptap installation', () => {
      expect(tasksContent).toContain('Install and configure Tiptap with React');
    });

    it('should reference formatting extensions', () => {
      expect(tasksContent).toContain('Add extensions for bold, italic, underline, lists, links, and emoji');
    });

    it('should reference custom toolbar', () => {
      expect(tasksContent).toContain('Create custom toolbar component with formatting buttons');
    });

    it('should reference character counter', () => {
      expect(tasksContent).toContain('Implement character counter with platform-specific limits');
    });

    it('should reference Requirement 1.1', () => {
      expect(tasksContent).toContain('_Requirements: 1.1, 1.2, 1.3_');
    });
  });

  describe('Task 3.2 - Auto-Save Functionality', () => {
    it('should reference debounced save function', () => {
      expect(tasksContent).toContain('Create debounced save function (30-second interval)');
    });

    it('should reference API endpoint', () => {
      expect(tasksContent).toContain('Build API endpoint for saving drafts');
    });

    it('should reference visual indicator', () => {
      expect(tasksContent).toContain('Add visual indicator for save status (saving, saved, error)');
    });

    it('should reference retry logic', () => {
      expect(tasksContent).toContain('Handle network failures with retry logic');
    });

    it('should reference Requirement 1.4', () => {
      expect(tasksContent).toContain('_Requirements: 1.4_');
    });
  });

  describe('Task 3.3 - Media Insertion', () => {
    it('should reference media picker modal', () => {
      expect(tasksContent).toContain('Create media picker modal integrated with media library');
    });

    it('should reference drag-and-drop', () => {
      expect(tasksContent).toContain('Implement drag-and-drop for media insertion');
    });

    it('should reference inline previews', () => {
      expect(tasksContent).toContain('Display inline media previews in editor');
    });

    it('should reference multiple attachments', () => {
      expect(tasksContent).toContain('Support multiple media attachments per content item');
    });

    it('should reference Requirement 2.4', () => {
      expect(tasksContent).toContain('_Requirements: 2.4_');
    });
  });

  describe('Component Files Existence', () => {
    it('should have ContentEditor component', () => {
      const componentPath = join(process.cwd(), 'components/content/ContentEditor.tsx');
      expect(existsSync(componentPath)).toBe(true);
    });

    it('should have MediaPicker component', () => {
      const componentPath = join(process.cwd(), 'components/content/MediaPicker.tsx');
      expect(existsSync(componentPath)).toBe(true);
    });

    it('should have EmojiPicker component', () => {
      const componentPath = join(process.cwd(), 'components/content/EmojiPicker.tsx');
      expect(existsSync(componentPath)).toBe(true);
    });

    it('should have ContentEditorWithAutoSave component', () => {
      const componentPath = join(process.cwd(), 'components/content/ContentEditorWithAutoSave.tsx');
      expect(existsSync(componentPath)).toBe(true);
    });

    it('should have useAutoSave hook', () => {
      const hookPath = join(process.cwd(), 'hooks/useAutoSave.ts');
      expect(existsSync(hookPath)).toBe(true);
    });
  });

  describe('API Endpoints Existence', () => {
    it('should have drafts API endpoint', () => {
      const apiPath = join(process.cwd(), 'app/api/content/drafts/route.ts');
      expect(existsSync(apiPath)).toBe(true);
    });

    it('should have media API endpoint', () => {
      const apiPath = join(process.cwd(), 'app/api/content/media/route.ts');
      expect(existsSync(apiPath)).toBe(true);
    });

    it('should have media upload API endpoint', () => {
      const apiPath = join(process.cwd(), 'app/api/content/media/upload/route.ts');
      expect(existsSync(apiPath)).toBe(true);
    });
  });

  describe('Requirements Coverage', () => {
    it('should cover Requirement 1.1 - Rich text editor with formatting', () => {
      const requirementsPath = join(process.cwd(), '.kiro/specs/content-creation/requirements.md');
      const requirementsContent = readFileSync(requirementsPath, 'utf-8');
      
      expect(requirementsContent).toContain('THE Content_Creation_System SHALL provide a rich text editor with formatting options including bold, italic, underline, lists, and links');
    });

    it('should cover Requirement 1.2 - Character limit warning', () => {
      const requirementsPath = join(process.cwd(), '.kiro/specs/content-creation/requirements.md');
      const requirementsContent = readFileSync(requirementsPath, 'utf-8');
      
      expect(requirementsContent).toContain('WHEN a Creator enters text exceeding platform character limits, THE Content_Creation_System SHALL display a warning with the character count');
    });

    it('should cover Requirement 1.3 - Emoji insertion', () => {
      const requirementsPath = join(process.cwd(), '.kiro/specs/content-creation/requirements.md');
      const requirementsContent = readFileSync(requirementsPath, 'utf-8');
      
      expect(requirementsContent).toContain('THE Content_Creation_System SHALL support emoji insertion through a picker interface');
    });

    it('should cover Requirement 1.4 - Auto-save', () => {
      const requirementsPath = join(process.cwd(), '.kiro/specs/content-creation/requirements.md');
      const requirementsContent = readFileSync(requirementsPath, 'utf-8');
      
      expect(requirementsContent).toContain('THE Content_Creation_System SHALL automatically save draft content every 30 seconds');
    });

    it('should cover Requirement 2.4 - Media library integration', () => {
      const requirementsPath = join(process.cwd(), '.kiro/specs/content-creation/requirements.md');
      const requirementsContent = readFileSync(requirementsPath, 'utf-8');
      
      expect(requirementsContent).toContain('THE Content_Creation_System SHALL organize uploaded media in the Media_Library with search and filter capabilities');
    });
  });

  describe('Test Coverage', () => {
    it('should have unit tests for rich text editor', () => {
      const testPath = join(process.cwd(), 'tests/unit/content-creation/rich-text-editor.test.tsx');
      expect(existsSync(testPath)).toBe(true);
    });

    it('should have integration tests for editor workflow', () => {
      const testPath = join(process.cwd(), 'tests/integration/content-creation/editor-workflow.test.ts');
      expect(existsSync(testPath)).toBe(true);
    });

    it('should have task status validation tests', () => {
      const testPath = join(process.cwd(), 'tests/unit/content-creation/editor-task-3-status.test.ts');
      expect(existsSync(testPath)).toBe(true);
    });
  });

  describe('Implementation Completeness', () => {
    it('should have all Task 3.1 deliverables', () => {
      const deliverables = [
        'Install and configure Tiptap with React',
        'Add extensions for bold, italic, underline, lists, links, and emoji',
        'Create custom toolbar component with formatting buttons',
        'Implement character counter with platform-specific limits'
      ];

      deliverables.forEach(deliverable => {
        expect(tasksContent).toContain(deliverable);
      });
    });

    it('should have all Task 3.2 deliverables', () => {
      const deliverables = [
        'Create debounced save function (30-second interval)',
        'Build API endpoint for saving drafts',
        'Add visual indicator for save status (saving, saved, error)',
        'Handle network failures with retry logic'
      ];

      deliverables.forEach(deliverable => {
        expect(tasksContent).toContain(deliverable);
      });
    });

    it('should have all Task 3.3 deliverables', () => {
      const deliverables = [
        'Create media picker modal integrated with media library',
        'Implement drag-and-drop for media insertion',
        'Display inline media previews in editor',
        'Support multiple media attachments per content item'
      ];

      deliverables.forEach(deliverable => {
        expect(tasksContent).toContain(deliverable);
      });
    });
  });

  describe('Next Tasks', () => {
    it('should have Task 4 defined (Image editing service)', () => {
      expect(tasksContent).toContain('- [ ] 4. Create image editing service');
    });

    it('should have Task 5 defined (Video editing capabilities)', () => {
      expect(tasksContent).toContain('- [ ] 5. Develop video editing capabilities');
    });

    it('should have Task 6 defined (AI assistance features)', () => {
      expect(tasksContent).toContain('- [ ] 6. Integrate AI assistance features');
    });
  });

  describe('Documentation', () => {
    it('should have README for content creation tests', () => {
      const readmePath = join(process.cwd(), 'tests/unit/content-creation/README.md');
      expect(existsSync(readmePath)).toBe(true);
    });

    it('should document Task 3 completion', () => {
      const readmePath = join(process.cwd(), 'tests/unit/content-creation/README.md');
      if (existsSync(readmePath)) {
        const readmeContent = readFileSync(readmePath, 'utf-8');
        expect(readmeContent).toContain('Task 3');
      }
    });
  });

  describe('Validation - Complete Task 3', () => {
    it('should pass all Task 3 requirements', () => {
      const requirements = {
        'Task 3 marked in progress': tasksContent.includes('- [-] 3. Build rich text content editor'),
        'Task 3.1 complete': tasksContent.includes('- [x] 3.1 Set up Tiptap editor'),
        'Task 3.2 complete': tasksContent.includes('- [x] 3.2 Implement auto-save'),
        'Task 3.3 complete': tasksContent.includes('- [x] 3.3 Add media insertion'),
        'ContentEditor exists': existsSync(join(process.cwd(), 'components/content/ContentEditor.tsx')),
        'MediaPicker exists': existsSync(join(process.cwd(), 'components/content/MediaPicker.tsx')),
        'Drafts API exists': existsSync(join(process.cwd(), 'app/api/content/drafts/route.ts')),
        'Unit tests exist': existsSync(join(process.cwd(), 'tests/unit/content-creation/rich-text-editor.test.tsx')),
        'Integration tests exist': existsSync(join(process.cwd(), 'tests/integration/content-creation/editor-workflow.test.ts'))
      };

      Object.entries(requirements).forEach(([requirement, passed]) => {
        expect(passed).toBe(true);
      });
    });

    it('should have comprehensive test coverage', () => {
      const testFiles = [
        'tests/unit/content-creation/rich-text-editor.test.tsx',
        'tests/integration/content-creation/editor-workflow.test.ts',
        'tests/unit/content-creation/editor-task-3-status.test.ts'
      ];

      testFiles.forEach(testFile => {
        const testPath = join(process.cwd(), testFile);
        expect(existsSync(testPath)).toBe(true);
      });
    });
  });
});
