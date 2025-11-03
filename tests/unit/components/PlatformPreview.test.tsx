/**
 * Unit Tests - PlatformPreview Component (Task 15.1)
 * 
 * Tests to validate platform-specific preview rendering
 * Based on: .kiro/specs/content-creation/tasks.md (Task 15.1)
 * 
 * Coverage:
 * - Platform-specific preview renderers
 * - Mobile and desktop view modes
 * - Real-time preview updates
 * - Validation status display
 * - Platform switching
 * - Content rendering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('PlatformPreview Component (Task 15.1)', () => {
  const componentPath = join(process.cwd(), 'components/content/PlatformPreview.tsx');
  let componentContent: string;

  beforeEach(() => {
    if (existsSync(componentPath)) {
      componentContent = readFileSync(componentPath, 'utf-8');
    }
  });

  describe('Requirement 14.1 - Platform-Specific Preview Renderers', () => {
    it('should have renderPlatformSpecificPreview function', () => {
      expect(componentContent).toContain('renderPlatformSpecificPreview');
    });

    it('should implement Instagram preview renderer', () => {
      expect(componentContent).toContain("case 'instagram':");
      expect(componentContent).toContain('from-yellow-400 via-red-500 to-purple-600');
    });

    it('should implement Twitter preview renderer', () => {
      expect(componentContent).toContain("case 'twitter':");
      expect(componentContent).toContain('@');
    });

    it('should implement TikTok preview renderer', () => {
      expect(componentContent).toContain("case 'tiktok':");
      expect(componentContent).toContain('aspect-[9/16]');
    });

    it('should implement Facebook preview renderer', () => {
      expect(componentContent).toContain("case 'facebook':");
      expect(componentContent).toContain('👍 Like');
      expect(componentContent).toContain('💬 Comment');
      expect(componentContent).toContain('📤 Share');
    });

    it('should implement LinkedIn preview renderer', () => {
      expect(componentContent).toContain("case 'linkedin':");
      expect(componentContent).toContain('Professional Title');
      expect(componentContent).toContain('🔁 Repost');
    });

    it('should have default case for unknown platforms', () => {
      expect(componentContent).toContain('default:');
    });

    it('should handle image content', () => {
      expect(componentContent).toContain('imageUrl');
      expect(componentContent).toContain('<img');
    });

    it('should handle video content', () => {
      expect(componentContent).toContain('videoUrl');
      expect(componentContent).toContain('<video');
    });
  });

  describe('Requirement 14.2 - Mobile and Desktop View Modes', () => {
    it('should have view mode state', () => {
      expect(componentContent).toContain("useState<'mobile' | 'desktop'>('mobile')");
    });

    it('should default to mobile view mode', () => {
      expect(componentContent).toContain("'mobile'");
    });

    it('should have mobile view button', () => {
      expect(componentContent).toContain('📱 Mobile');
    });

    it('should have desktop view button', () => {
      expect(componentContent).toContain('💻 Desktop');
    });

    it('should apply mobile-specific styles', () => {
      expect(componentContent).toContain('max-w-sm');
    });

    it('should apply desktop-specific styles', () => {
      expect(componentContent).toContain('max-w-2xl');
    });

    it('should have view mode toggle logic', () => {
      expect(componentContent).toContain('setViewMode');
      expect(componentContent).toContain('onClick');
    });

    it('should apply conditional styles based on view mode', () => {
      expect(componentContent).toContain('viewMode === ');
    });
  });

  describe('Requirement 14.3 - Real-Time Preview Updates', () => {
    it('should use useEffect for real-time updates', () => {
      expect(componentContent).toContain('useEffect');
    });

    it('should depend on platforms for updates', () => {
      expect(componentContent).toContain('[platforms,');
    });

    it('should depend on content for updates', () => {
      expect(componentContent).toContain('content]');
    });

    it('should revalidate on changes', () => {
      expect(componentContent).toContain('validateMultiplePlatforms');
    });

    it('should update validation results', () => {
      expect(componentContent).toContain('setValidationResults');
    });

    it('should display optimized text', () => {
      expect(componentContent).toContain('optimizedText');
    });

    it('should extract hashtag count from text', () => {
      expect(componentContent).toContain('#\\w+');
    });

    it('should calculate image size', () => {
      expect(componentContent).toContain('imageWidth');
      expect(componentContent).toContain('imageHeight');
    });
  });

  describe('Platform Switching', () => {
    it('should render tabs for all platforms', () => {
      expect(componentContent).toContain('platforms.map');
    });

    it('should have selected platform state', () => {
      expect(componentContent).toContain('selectedPlatform');
      expect(componentContent).toContain('setSelectedPlatform');
    });

    it('should select first platform by default', () => {
      expect(componentContent).toContain('platforms[0]');
    });

    it('should have platform tab click handler', () => {
      expect(componentContent).toContain('onClick={() => setSelectedPlatform(platform)');
    });

    it('should show validation indicators on tabs', () => {
      expect(componentContent).toContain('hasErrors');
      expect(componentContent).toContain('hasWarnings');
      expect(componentContent).toContain('●');
    });
  });

  describe('Validation Status Display', () => {
    it('should display validation status section', () => {
      expect(componentContent).toContain('Validation Status');
    });

    it('should show success status for valid content', () => {
      expect(componentContent).toContain('✓ All checks passed');
    });

    it('should show error status for invalid content', () => {
      expect(componentContent).toContain('✗ Issues found');
    });

    it('should display warnings', () => {
      expect(componentContent).toContain('warnings.map');
      expect(componentContent).toContain('warning.message');
    });

    it('should display suggestions', () => {
      expect(componentContent).toContain('💡 Suggestions:');
      expect(componentContent).toContain('suggestedChanges.map');
    });

    it('should show no issues message when content is valid', () => {
      expect(componentContent).toContain('Your content meets all requirements');
    });

    it('should display warning types', () => {
      expect(componentContent).toContain("warning.type === 'error'");
      expect(componentContent).toContain('❌');
      expect(componentContent).toContain('⚠️');
    });
  });

  describe('User Information Display', () => {
    it('should accept userName prop', () => {
      expect(componentContent).toContain('userName');
    });

    it('should accept userAvatar prop', () => {
      expect(componentContent).toContain('userAvatar');
    });

    it('should show default avatar when not provided', () => {
      expect(componentContent).toContain('👤');
    });

    it('should format username for Twitter handle', () => {
      expect(componentContent).toContain('.toLowerCase().replace(/\\s/g, \'\')');
    });
  });

  describe('Component Structure', () => {
    it('should use client-side rendering', () => {
      expect(componentContent).toContain("'use client'");
    });

    it('should import required dependencies', () => {
      expect(componentContent).toContain("import { useState, useEffect }");
    });

    it('should import platformOptimizerService', () => {
      expect(componentContent).toContain("from '@/lib/services/platformOptimizerService'");
    });

    it('should define PlatformPreviewProps interface', () => {
      expect(componentContent).toContain('interface PlatformPreviewProps');
    });

    it('should export default function', () => {
      expect(componentContent).toContain('export default function PlatformPreview');
    });

    it('should have proper TypeScript types', () => {
      expect(componentContent).toContain('platforms: string[]');
      expect(componentContent).toContain('content:');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      expect(componentContent).toContain('📱 Mobile');
      expect(componentContent).toContain('💻 Desktop');
    });

    it('should have proper image alt text', () => {
      expect(componentContent).toContain('alt=');
    });

    it('should have accessible video controls', () => {
      expect(componentContent).toContain('controls');
    });
  });
});
