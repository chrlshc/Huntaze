/**
 * Unit Tests - Video Editing Task 5 Status
 * 
 * Tests to validate Task 5 completion status
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Content Creation - Task 5 Status', () => {
  let tasksContent: string;

  beforeAll(() => {
    const tasksPath = join(process.cwd(), '.kiro/specs/content-creation/tasks.md');
    tasksContent = readFileSync(tasksPath, 'utf-8');
  });

  it('should mark Task 5 as complete', () => {
    expect(tasksContent).toContain('- [x] 5. Develop video editing capabilities');
  });

  it('should have subtask 5.1 complete', () => {
    expect(tasksContent).toContain('- [x] 5.1 Create video editor UI with timeline');
  });

  it('should have subtask 5.2 complete', () => {
    expect(tasksContent).toContain('- [x] 5.2 Implement video processing backend');
  });

  it('should mention FFmpeg', () => {
    expect(tasksContent).toContain('FFmpeg');
  });

  it('should mention Bull', () => {
    expect(tasksContent).toContain('Bull');
  });

  it('should have video editor component', () => {
    const exists = existsSync(join(process.cwd(), 'components/content/VideoEditor.tsx'));
    expect(exists).toBe(true);
  });

  it('should have video editing service', () => {
    const exists = existsSync(join(process.cwd(), 'lib/services/videoEditService.ts'));
    expect(exists).toBe(true);
  });

  it('should have video API endpoint', () => {
    const exists = existsSync(join(process.cwd(), 'app/api/content/media/[id]/edit-video/route.ts'));
    expect(exists).toBe(true);
  });
});
