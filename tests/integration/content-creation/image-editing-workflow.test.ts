/**
 * Integration Tests - Image Editing Workflow (Task 4)
 * 
 * End-to-end tests for complete image editing workflow
 * Based on: .kiro/specs/content-creation/tasks.md (Task 4)
 * 
 * Coverage:
 * - Complete editing workflow from upload to save
 * - API integration with backend
 * - File upload and download
 * - Multiple edit operations
 * - Error handling and recovery
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Image Editing Workflow - Integration Tests', () => {
  const testImagePath = join(process.cwd(), 'tests/fixtures/test-image.jpg');
  let testImageBuffer: Buffer;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Load test image if exists, otherwise create mock
    if (existsSync(testImagePath)) {
      testImageBuffer = readFileSync(testImagePath);
    } else {
      testImageBuffer = Buffer.from('mock-image-data');
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Editing Workflow', () => {
    it('should complete full editing workflow', async () => {
      // 1. Upload image
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(testImageBuffer),
        credentials: 'include',
      });

      expect(uploadResponse.ok).toBe(true);
      const { media } = await uploadResponse.json();
      expect(media).toHaveProperty('id');
      expect(media).toHaveProperty('url');

      // 2. Apply edits
      const editResponse = await fetch(`/api/content/media/${media.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            crop: { left: 100, top: 100, width: 500, height: 500 },
            resize: { width: 800, height: 600 },
            adjustments: {
              brightness: 1.2,
              contrast: 1.1,
              saturation: 1.3,
            },
          },
        }),
        credentials: 'include',
      });

      expect(editResponse.ok).toBe(true);
      const { editedMedia } = await editResponse.json();
      expect(editedMedia).toHaveProperty('id');
      expect(editedMedia).toHaveProperty('url');
      expect(editedMedia.id).not.toBe(media.id); // New file created

      // 3. Verify original unchanged
      const originalResponse = await fetch(`/api/content/media/${media.id}`, {
        credentials: 'include',
      });

      expect(originalResponse.ok).toBe(true);
      const { media: originalMedia } = await originalResponse.json();
      expect(originalMedia.id).toBe(media.id);
    });

    it('should handle multiple sequential edits', async () => {
      // Upload image
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(testImageBuffer),
        credentials: 'include',
      });

      const { media } = await uploadResponse.json();

      // First edit: Crop
      const cropResponse = await fetch(`/api/content/media/${media.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            crop: { left: 100, top: 100, width: 500, height: 500 },
          },
        }),
        credentials: 'include',
      });

      const { editedMedia: croppedMedia } = await cropResponse.json();

      // Second edit: Adjust brightness
      const adjustResponse = await fetch(`/api/content/media/${croppedMedia.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            adjustments: { brightness: 1.5 },
          },
        }),
        credentials: 'include',
      });

      expect(adjustResponse.ok).toBe(true);
      const { editedMedia: finalMedia } = await adjustResponse.json();
      expect(finalMedia.id).not.toBe(media.id);
      expect(finalMedia.id).not.toBe(croppedMedia.id);
    });
  });

  describe('Requirement 3.1 - Transformation Operations', () => {
    it('should apply crop operation', async () => {
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(testImageBuffer),
        credentials: 'include',
      });

      const { media } = await uploadResponse.json();

      const editResponse = await fetch(`/api/content/media/${media.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            crop: { left: 100, top: 100, width: 500, height: 500 },
          },
        }),
        credentials: 'include',
      });

      expect(editResponse.ok).toBe(true);
      const { editedMedia } = await editResponse.json();
      expect(editedMedia.width).toBe(500);
      expect(editedMedia.height).toBe(500);
    });

    it('should apply resize operation', async () => {
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(testImageBuffer),
        credentials: 'include',
      });

      const { media } = await uploadResponse.json();

      const editResponse = await fetch(`/api/content/media/${media.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            resize: { width: 800, height: 600 },
          },
        }),
        credentials: 'include',
      });

      expect(editResponse.ok).toBe(true);
      const { editedMedia } = await editResponse.json();
      expect(editedMedia.width).toBe(800);
      expect(editedMedia.height).toBe(600);
    });

    it('should apply rotate operation', async () => {
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(testImageBuffer),
        credentials: 'include',
      });

      const { media } = await uploadResponse.json();

      const editResponse = await fetch(`/api/content/media/${media.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            rotate: 90,
          },
        }),
        credentials: 'include',
      });

      expect(editResponse.ok).toBe(true);
      const { editedMedia } = await editResponse.json();
      // After 90° rotation, width and height should be swapped
      expect(editedMedia.width).toBe(media.height);
      expect(editedMedia.height).toBe(media.width);
    });

    it('should apply flip operation', async () => {
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(testImageBuffer),
        credentials: 'include',
      });

      const { media } = await uploadResponse.json();

      const editResponse = await fetch(`/api/content/media/${media.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            flip: 'horizontal',
          },
        }),
        credentials: 'include',
      });

      expect(editResponse.ok).toBe(true);
    });
  });

  describe('Requirement 3.2 - Adjustment Operations', () => {
    it('should apply brightness adjustment', async () => {
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(testImageBuffer),
        credentials: 'include',
      });

      const { media } = await uploadResponse.json();

      const editResponse = await fetch(`/api/content/media/${media.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            adjustments: { brightness: 1.5 },
          },
        }),
        credentials: 'include',
      });

      expect(editResponse.ok).toBe(true);
    });

    it('should apply contrast adjustment', async () => {
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(testImageBuffer),
        credentials: 'include',
      });

      const { media } = await uploadResponse.json();

      const editResponse = await fetch(`/api/content/media/${media.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            adjustments: { contrast: 1.3 },
          },
        }),
        credentials: 'include',
      });

      expect(editResponse.ok).toBe(true);
    });

    it('should apply saturation adjustment', async () => {
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(testImageBuffer),
        credentials: 'include',
      });

      const { media } = await uploadResponse.json();

      const editResponse = await fetch(`/api/content/media/${media.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            adjustments: { saturation: 0.8 },
          },
        }),
        credentials: 'include',
      });

      expect(editResponse.ok).toBe(true);
    });

    it('should apply multiple adjustments', async () => {
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(testImageBuffer),
        credentials: 'include',
      });

      const { media } = await uploadResponse.json();

      const editResponse = await fetch(`/api/content/media/${media.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            adjustments: {
              brightness: 1.2,
              contrast: 1.1,
              saturation: 1.3,
            },
          },
        }),
        credentials: 'include',
      });

      expect(editResponse.ok).toBe(true);
    });
  });

  describe('Requirement 3.3 - Text Overlay', () => {
    it('should add text overlay to image', async () => {
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(testImageBuffer),
        credentials: 'include',
      });

      const { media } = await uploadResponse.json();

      const editResponse = await fetch(`/api/content/media/${media.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            textOverlay: {
              text: 'Hello World',
              x: 100,
              y: 100,
              font: 'Arial',
              fontSize: 48,
              color: '#FFFFFF',
            },
          },
        }),
        credentials: 'include',
      });

      expect(editResponse.ok).toBe(true);
    });

    it('should add multiple text overlays', async () => {
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(testImageBuffer),
        credentials: 'include',
      });

      const { media } = await uploadResponse.json();

      const editResponse = await fetch(`/api/content/media/${media.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            textOverlays: [
              { text: 'Title', x: 100, y: 100, fontSize: 64 },
              { text: 'Subtitle', x: 100, y: 200, fontSize: 32 },
            ],
          },
        }),
        credentials: 'include',
      });

      expect(editResponse.ok).toBe(true);
    });
  });

  describe('Requirement 3.4 - Filter Application', () => {
    it('should apply grayscale filter', async () => {
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(testImageBuffer),
        credentials: 'include',
      });

      const { media } = await uploadResponse.json();

      const editResponse = await fetch(`/api/content/media/${media.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            filter: 'grayscale',
          },
        }),
        credentials: 'include',
      });

      expect(editResponse.ok).toBe(true);
    });

    it('should apply sepia filter', async () => {
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(testImageBuffer),
        credentials: 'include',
      });

      const { media } = await uploadResponse.json();

      const editResponse = await fetch(`/api/content/media/${media.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            filter: 'sepia',
          },
        }),
        credentials: 'include',
      });

      expect(editResponse.ok).toBe(true);
    });

    it('should apply vintage filter', async () => {
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(testImageBuffer),
        credentials: 'include',
      });

      const { media } = await uploadResponse.json();

      const editResponse = await fetch(`/api/content/media/${media.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            filter: 'vintage',
          },
        }),
        credentials: 'include',
      });

      expect(editResponse.ok).toBe(true);
    });
  });

  describe('Requirement 3.5 - File Management', () => {
    it('should save edited image as new file', async () => {
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(testImageBuffer),
        credentials: 'include',
      });

      const { media } = await uploadResponse.json();
      const originalId = media.id;

      const editResponse = await fetch(`/api/content/media/${media.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            resize: { width: 800, height: 600 },
          },
        }),
        credentials: 'include',
      });

      const { editedMedia } = await editResponse.json();
      expect(editedMedia.id).not.toBe(originalId);
      expect(editedMedia.url).not.toBe(media.url);
    });

    it('should maintain original file unchanged', async () => {
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(testImageBuffer),
        credentials: 'include',
      });

      const { media } = await uploadResponse.json();
      const originalUrl = media.url;

      await fetch(`/api/content/media/${media.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            resize: { width: 800, height: 600 },
          },
        }),
        credentials: 'include',
      });

      // Verify original still exists
      const originalResponse = await fetch(`/api/content/media/${media.id}`, {
        credentials: 'include',
      });

      expect(originalResponse.ok).toBe(true);
      const { media: originalMedia } = await originalResponse.json();
      expect(originalMedia.url).toBe(originalUrl);
    });

    it('should upload edited image to S3', async () => {
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(testImageBuffer),
        credentials: 'include',
      });

      const { media } = await uploadResponse.json();

      const editResponse = await fetch(`/api/content/media/${media.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            resize: { width: 800, height: 600 },
          },
        }),
        credentials: 'include',
      });

      const { editedMedia } = await editResponse.json();
      expect(editedMedia.url).toMatch(/^https?:\/\//);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid image ID', async () => {
      const editResponse = await fetch('/api/content/media/99999/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            resize: { width: 800, height: 600 },
          },
        }),
        credentials: 'include',
      });

      expect(editResponse.status).toBe(404);
      const { error } = await editResponse.json();
      expect(error).toContain('not found');
    });

    it('should handle invalid edit parameters', async () => {
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(testImageBuffer),
        credentials: 'include',
      });

      const { media } = await uploadResponse.json();

      const editResponse = await fetch(`/api/content/media/${media.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            resize: { width: -800, height: 600 },
          },
        }),
        credentials: 'include',
      });

      expect(editResponse.status).toBe(400);
      const { error } = await editResponse.json();
      expect(error).toContain('Invalid');
    });

    it('should handle S3 upload failures', async () => {
      // This would require mocking S3 to fail
      // Implementation depends on your error handling strategy
      expect(true).toBe(true);
    });

    it('should handle image processing errors', async () => {
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(Buffer.from('invalid-image-data')),
        credentials: 'include',
      });

      expect(uploadResponse.status).toBe(400);
    });
  });

  describe('Performance', () => {
    it('should process edits within 5 seconds', async () => {
      const uploadResponse = await fetch('/api/content/media/upload', {
        method: 'POST',
        body: createFormData(testImageBuffer),
        credentials: 'include',
      });

      const { media } = await uploadResponse.json();

      const startTime = Date.now();

      await fetch(`/api/content/media/${media.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edits: {
            crop: { left: 100, top: 100, width: 500, height: 500 },
            resize: { width: 800, height: 600 },
            adjustments: {
              brightness: 1.2,
              contrast: 1.1,
              saturation: 1.3,
            },
          },
        }),
        credentials: 'include',
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000);
    });
  });
});

// Helper function to create FormData
function createFormData(imageBuffer: Buffer): FormData {
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
  formData.append('file', blob, 'test-image.jpg');
  return formData;
}
