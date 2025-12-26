/**
 * Unit Tests - Video Editing Task 5 Status
 * 
 * Tests to validate the completion status of Task 5
 * Based on: .kiro/specs/content-creation/tasks.md (Task 5)
 * 
 * Coverage:
 * - Task 5 completion status validation
 * - Video editor component existence
 * - Video editing service existence
 * - API endpoint existence
 * - Requirements coverage
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Content Creation - Task 5 Status (Video Editing)', () => {
  let tasksContent: string;
  let videoEditorExists: boolean;
  let videoServiceExists: boolean;
  let videoApiExists: boolean;

  beforeAll(() => {
    const tasksPath = join(process.cwd(), '.kiro/specs/content-creation/tasks.md');
    tasksContent = readFileSync(tasksPath, 'utf-8');

    // Check if implementation files exist
    videoEditorExists = existsSync(join(process.cwd(), 'components/content/VideoEditor.tsx'));
    videoServiceExists = existsSync(join(process.cwd(), 'lib/services/videoEditService.ts'));
    videoApiExists = existsSync(join(process.cwd(), 'app/api/content/media/[id]/edit-video/route.ts'));
  });

  describe('Task 5 Completion Status', () => {
    it('should mark Task 5 as complete', () => {
      expect(tasksContent).toContain('- [x] 5. Develop video editing capabilities');
    });

    it('should have video editor component file', () => {
      expect(videoEditorExists).toBe(true);
    });

    it('should have video editing service file', () => {
      expect(videoServiceExists).toBe(true);
    });

    it('should have video API endpoint file', () => {
      expect(videoApiExists).toBe(true);
    });
  });

  describe('Task 5 Subtasks', () => {
    it('should have subtask 5.1 complete', () => {
      expect(tasksContent).toContain('- [x] 5.1 Create video editor UI with timeline');
    });

    it('should have subtask 5.2 complete', () => {
      expect(tasksContent).toContain('- [x] 5.2 Implement video processing backend');
    });
  });

  describe('Task 5 Requirements', () => {
    it('should mention FFmpeg for video processing', () => {
      expect(tasksContent).toContain('FFmpeg');
    });

    it('should mention Bull for background processing', () => {
      expect(tasksContent).toContain('Bull');
    });

    it('should include timeline component requirement', () => {
      expect(tasksContent).toContain('Build timeline component with playback controls');
    });

    it('should include caption burning requirement', () => {
      expect(tasksContent).toContain('Implement caption burning into video file');
    });

    it('should reference Requirements 4.1, 4.2, 4.5', () => {
      expect(tasksContent).toContain('_Requirements: 4.1, 4.2, 4.5_');
    });

    it('should reference Requirements 4.3, 4.4', () => {
      expect(tasksContent).toContain('_Requirements: 4.3, 4.4_');
    });
  });

  describe('Task 5 Implementation', () => {
    it('should have video editor component implemented', () => {
      if (videoEditorExists) {
        const componentPath = join(process.cwd(), 'components/content/VideoEditor.tsx');
        const componentContent = readFileSync(componentPath, 'utf-8');
        expect(componentContent).toContain('VideoEditor');
        expect(componentContent).toContain('export');
      }
    });

    it('should have video editing service implemented', () => {
      if (videoServiceExists) {
        const servicePath = join(process.cwd(), 'lib/services/videoEditService.ts');
        const serviceContent = readFileSync(servicePath, 'utf-8');
        expect(serviceContent).toContain('videoEditService');
        expect(serviceContent).toContain('export');
      }
    });

    it('should have video API endpoint implemented', () => {
      if (videoApiExists) {
        const apiPath = join(process.cwd(), 'app/api/content/media/[id]/edit-video/route.ts');
        const apiContent = readFileSync(apiPath, 'utf-8');
        expect(apiContent).toContain('POST');
        expect(apiContent).toContain('NextResponse');
      }
    });
  });
});
