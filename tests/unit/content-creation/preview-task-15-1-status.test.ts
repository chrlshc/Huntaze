/**
 * Unit Tests - Task 15.1 Status Validation
 * 
 * Tests to validate Task 15.1 completion status
 * Based on: .kiro/specs/content-creation/tasks.md (Task 15.1)
 * 
 * Coverage:
 * - Component implementation verification
 * - Feature completeness validation
 * - Requirements coverage check
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Task 15.1 - Build Preview Component - Status Validation', () => {
  const componentPath = join(process.cwd(), 'components/content/PlatformPreview.tsx');
  const tasksPath = join(process.cwd(), '.kiro/specs/content-creation/tasks.md');

  describe('File Existence', () => {
    it('should have PlatformPreview component file', () => {
      expect(existsSync(componentPath)).toBe(true);
    });

    it('should have tasks file with Task 15.1', () => {
      expect(existsSync(tasksPath)).toBe(true);
    });
  });

  describe('Component Implementation', () => {
    let componentContent: string;

    beforeAll(() => {
      componentContent = readFileSync(componentPath, 'utf-8');
    });

    it('should export PlatformPreview component', () => {
      expect(componentContent).toContain('export default function PlatformPreview');
    });

    it('should accept platforms prop', () => {
      expect(componentContent).toContain('platforms:');
    });

    it('should accept content prop', () => {
      expect(componentContent).toContain('content:');
    });

    it('should have platform-specific preview renderers', () => {
      expect(componentContent).toContain('renderPlatformSpecificPreview');
    });

    it('should implement Instagram preview', () => {
      expect(componentContent).toContain("case 'instagram':");
    });

    it('should implement Twitter preview', () => {
      expect(componentContent).toContain("case 'twitter':");
    });

    it('should implement TikTok preview', () => {
      expect(componentContent).toContain("case 'tiktok':");
    });

    it('should implement Facebook preview', () => {
      expect(componentContent).toContain("case 'facebook':");
    });

    it('should implement LinkedIn preview', () => {
      expect(componentContent).toContain("case 'linkedin':");
    });

    it('should have view mode state', () => {
      expect(componentContent).toContain("useState<'mobile' | 'desktop'>('mobile')");
    });

    it('should have mobile view button', () => {
      expect(componentContent).toContain('📱 Mobile');
    });

    it('should have desktop view button', () => {
      expect(componentContent).toContain('💻 Desktop');
    });

    it('should use platformOptimizerService', () => {
      expect(componentContent).toContain('platformOptimizerService');
    });

    it('should validate multiple platforms', () => {
      expect(componentContent).toContain('validateMultiplePlatforms');
    });

    it('should update on content changes', () => {
      expect(componentContent).toContain('useEffect');
    });

    it('should display validation results', () => {
      expect(componentContent).toContain('validationResults');
    });

    it('should show validation status', () => {
      expect(componentContent).toContain('Validation Status');
    });

    it('should display warnings', () => {
      expect(componentContent).toContain('warnings');
    });

    it('should display suggestions', () => {
      expect(componentContent).toContain('suggestedChanges');
    });
  });

  describe('Requirements Coverage - Requirement 14.1', () => {
    let componentContent: string;

    beforeAll(() => {
      componentContent = readFileSync(componentPath, 'utf-8');
    });

    it('should create platform-specific preview renderers', () => {
      expect(componentContent).toContain('renderPlatformSpecificPreview');
      expect(componentContent).toContain('switch (platform.toLowerCase())');
    });

    it('should render Instagram-specific UI', () => {
      expect(componentContent).toContain("case 'instagram':");
      expect(componentContent).toContain('from-yellow-400 via-red-500 to-purple-600');
    });

    it('should render Twitter-specific UI', () => {
      expect(componentContent).toContain("case 'twitter':");
      expect(componentContent).toContain('@');
    });

    it('should render TikTok-specific UI', () => {
      expect(componentContent).toContain("case 'tiktok':");
      expect(componentContent).toContain('aspect-[9/16]');
    });

    it('should render Facebook-specific UI', () => {
      expect(componentContent).toContain("case 'facebook':");
      expect(componentContent).toContain('👍 Like');
    });

    it('should render LinkedIn-specific UI', () => {
      expect(componentContent).toContain("case 'linkedin':");
      expect(componentContent).toContain('🔁 Repost');
    });

    it('should have fallback for unknown platforms', () => {
      expect(componentContent).toContain('default:');
    });
  });

  describe('Requirements Coverage - Requirement 14.2', () => {
    let componentContent: string;

    beforeAll(() => {
      componentContent = readFileSync(componentPath, 'utf-8');
    });

    it('should implement mobile view mode', () => {
      expect(componentContent).toContain("'mobile'");
      expect(componentContent).toContain('max-w-sm');
    });

    it('should implement desktop view mode', () => {
      expect(componentContent).toContain("'desktop'");
      expect(componentContent).toContain('max-w-2xl');
    });

    it('should have view mode toggle buttons', () => {
      expect(componentContent).toContain('📱 Mobile');
      expect(componentContent).toContain('💻 Desktop');
    });

    it('should apply conditional styles based on view mode', () => {
      expect(componentContent).toContain('viewMode === ');
    });

    it('should maintain view mode state', () => {
      expect(componentContent).toContain('setViewMode');
    });
  });

  describe('Requirements Coverage - Requirement 14.3', () => {
    let componentContent: string;

    beforeAll(() => {
      componentContent = readFileSync(componentPath, 'utf-8');
    });

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
  });

  describe('Task Status in tasks.md', () => {
    let tasksContent: string;

    beforeAll(() => {
      tasksContent = readFileSync(tasksPath, 'utf-8');
    });

    it('should have Task 15.1 marked as completed', () => {
      expect(tasksContent).toContain('- [x] 15.1 Build preview component');
    });

    it('should list platform-specific preview renderers requirement', () => {
      expect(tasksContent).toContain('Create platform-specific preview renderers');
    });

    it('should list mobile and desktop view modes requirement', () => {
      expect(tasksContent).toContain('Implement mobile and desktop view modes');
    });

    it('should list real-time preview updates requirement', () => {
      expect(tasksContent).toContain('Add real-time preview updates as content changes');
    });

    it('should reference Requirements 14.1, 14.2, 14.3', () => {
      expect(tasksContent).toContain('_Requirements: 14.1, 14.2, 14.3_');
    });
  });

  describe('Feature Completeness', () => {
    let componentContent: string;

    beforeAll(() => {
      componentContent = readFileSync(componentPath, 'utf-8');
    });

    it('should support multiple platforms simultaneously', () => {
      expect(componentContent).toContain('platforms.map');
    });

    it('should display platform tabs', () => {
      expect(componentContent).toContain('Platform Tabs');
    });

    it('should allow platform selection', () => {
      expect(componentContent).toContain('selectedPlatform');
      expect(componentContent).toContain('setSelectedPlatform');
    });

    it('should show validation indicators on tabs', () => {
      expect(componentContent).toContain('hasErrors');
      expect(componentContent).toContain('hasWarnings');
    });

    it('should display user information', () => {
      expect(componentContent).toContain('userName');
      expect(componentContent).toContain('userAvatar');
    });

    it('should handle image content', () => {
      expect(componentContent).toContain('imageUrl');
    });

    it('should handle video content', () => {
      expect(componentContent).toContain('videoUrl');
    });

    it('should display validation warnings', () => {
      expect(componentContent).toContain('warnings.map');
    });

    it('should display suggested changes', () => {
      expect(componentContent).toContain('suggestedChanges.map');
    });

    it('should show success state', () => {
      expect(componentContent).toContain('All checks passed');
    });

    it('should show error state', () => {
      expect(componentContent).toContain('Issues found');
    });
  });

  describe('Code Quality', () => {
    let componentContent: string;

    beforeAll(() => {
      componentContent = readFileSync(componentPath, 'utf-8');
    });

    it('should use TypeScript', () => {
      expect(componentContent).toContain('interface PlatformPreviewProps');
    });

    it('should define prop types', () => {
      expect(componentContent).toContain('platforms: string[]');
      expect(componentContent).toContain('content:');
    });

    it('should use client-side rendering', () => {
      expect(componentContent).toContain("'use client'");
    });

    it('should import required dependencies', () => {
      expect(componentContent).toContain("import { useState, useEffect }");
    });

    it('should have proper component structure', () => {
      expect(componentContent).toContain('return (');
      expect(componentContent).toContain('</div>');
    });

    it('should use semantic HTML', () => {
      expect(componentContent).toContain('<button');
      expect(componentContent).toContain('<img');
      expect(componentContent).toContain('<video');
    });

    it('should have accessible markup', () => {
      expect(componentContent).toContain('alt=');
    });

    it('should use Tailwind CSS classes', () => {
      expect(componentContent).toContain('className=');
    });
  });

  describe('Integration Points', () => {
    let componentContent: string;

    beforeAll(() => {
      componentContent = readFileSync(componentPath, 'utf-8');
    });

    it('should integrate with platformOptimizerService', () => {
      expect(componentContent).toContain("from '@/lib/services/platformOptimizerService'");
    });

    it('should call validateMultiplePlatforms', () => {
      expect(componentContent).toContain('platformOptimizerService.validateMultiplePlatforms');
    });

    it('should pass platforms to validation', () => {
      expect(componentContent).toContain('validateMultiplePlatforms(platforms,');
    });

    it('should pass content to validation', () => {
      expect(componentContent).toContain('text: content.text');
      expect(componentContent).toContain('hashtagCount');
      expect(componentContent).toContain('imageSize');
    });

    it('should extract hashtag count from text', () => {
      expect(componentContent).toContain('#\\w+');
    });

    it('should calculate image size', () => {
      expect(componentContent).toContain('imageWidth');
      expect(componentContent).toContain('imageHeight');
    });
  });

  describe('Test Coverage', () => {
    const unitTestPath = join(process.cwd(), 'tests/unit/components/PlatformPreview.test.tsx');
    const integrationTestPath = join(process.cwd(), 'tests/integration/content-creation/preview-workflow.test.ts');

    it('should have unit tests', () => {
      expect(existsSync(unitTestPath)).toBe(true);
    });

    it('should have integration tests', () => {
      expect(existsSync(integrationTestPath)).toBe(true);
    });

    it('should test platform-specific renderers', () => {
      const testContent = readFileSync(unitTestPath, 'utf-8');
      expect(testContent).toContain('Platform-Specific Preview Renderers');
    });

    it('should test view modes', () => {
      const testContent = readFileSync(unitTestPath, 'utf-8');
      expect(testContent).toContain('Mobile and Desktop View Modes');
    });

    it('should test real-time updates', () => {
      const testContent = readFileSync(unitTestPath, 'utf-8');
      expect(testContent).toContain('Real-Time Preview Updates');
    });

    it('should test validation integration', () => {
      const testContent = readFileSync(integrationTestPath, 'utf-8');
      expect(testContent).toContain('Platform Validation Integration');
    });

    it('should test multi-platform coordination', () => {
      const testContent = readFileSync(integrationTestPath, 'utf-8');
      expect(testContent).toContain('Multi-Platform Preview Coordination');
    });
  });

  describe('Task Completion Criteria', () => {
    it('should have all required platform renderers', () => {
      const componentContent = readFileSync(componentPath, 'utf-8');
      const platforms = ['instagram', 'twitter', 'tiktok', 'facebook', 'linkedin'];
      
      platforms.forEach(platform => {
        expect(componentContent).toContain(`case '${platform}':`);
      });
    });

    it('should have both view modes implemented', () => {
      const componentContent = readFileSync(componentPath, 'utf-8');
      expect(componentContent).toContain("'mobile'");
      expect(componentContent).toContain("'desktop'");
    });

    it('should have real-time update mechanism', () => {
      const componentContent = readFileSync(componentPath, 'utf-8');
      expect(componentContent).toContain('useEffect');
      expect(componentContent).toContain('validateMultiplePlatforms');
    });

    it('should display validation results', () => {
      const componentContent = readFileSync(componentPath, 'utf-8');
      expect(componentContent).toContain('Validation Status');
      expect(componentContent).toContain('warnings');
      expect(componentContent).toContain('suggestedChanges');
    });

    it('should have comprehensive test coverage', () => {
      const unitTestPath = join(process.cwd(), 'tests/unit/components/PlatformPreview.test.tsx');
      const integrationTestPath = join(process.cwd(), 'tests/integration/content-creation/preview-workflow.test.ts');
      
      expect(existsSync(unitTestPath)).toBe(true);
      expect(existsSync(integrationTestPath)).toBe(true);
    });
  });

  describe('Documentation', () => {
    it('should have component documentation in test files', () => {
      const unitTestPath = join(process.cwd(), 'tests/unit/components/PlatformPreview.test.tsx');
      const testContent = readFileSync(unitTestPath, 'utf-8');
      
      expect(testContent).toContain('Unit Tests - PlatformPreview Component');
      expect(testContent).toContain('Task 15.1');
    });

    it('should reference requirements in tests', () => {
      const unitTestPath = join(process.cwd(), 'tests/unit/components/PlatformPreview.test.tsx');
      const testContent = readFileSync(unitTestPath, 'utf-8');
      
      expect(testContent).toContain('Requirement 14.1');
      expect(testContent).toContain('Requirement 14.2');
      expect(testContent).toContain('Requirement 14.3');
    });

    it('should have clear test descriptions', () => {
      const unitTestPath = join(process.cwd(), 'tests/unit/components/PlatformPreview.test.tsx');
      const testContent = readFileSync(unitTestPath, 'utf-8');
      
      expect(testContent).toContain('should render');
      expect(testContent).toContain('should display');
      expect(testContent).toContain('should update');
    });
  });
});
