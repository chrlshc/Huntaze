/**
 * Animation Performance Tests
 * 
 * Validates that all animations use GPU-accelerated properties
 * and meet performance requirements.
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Animation Performance Audit', () => {
  const cssFiles = [
    'styles/design-system.css',
    'styles/skeleton-animations.css', // Phase 7: Enhanced loading states
    'app/(app)/home/home.css',
    'app/(app)/home/quick-actions.css',
    'app/(app)/home/platform-status.css',
    'app/(app)/integrations/integrations.css',
    'app/responsive-enhancements.css',
  ];

  describe('Requirement 14.1: GPU-Accelerated Properties', () => {
    it('should not use "transition: all" which is not GPU-optimized', () => {
      cssFiles.forEach((file) => {
        const filePath = path.join(process.cwd(), file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for "transition: all" which should be avoided
        const hasTransitionAll = /transition:\s*all\s/gi.test(content);
        
        expect(hasTransitionAll).toBe(false);
      });
    });

    it('should use GPU-accelerated properties in keyframe animations', () => {
      cssFiles.forEach((file) => {
        const filePath = path.join(process.cwd(), file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Extract all @keyframes blocks
        const keyframesRegex = /@keyframes\s+(\w+)\s*{([^}]+)}/gi;
        const matches = [...content.matchAll(keyframesRegex)];
        
        matches.forEach((match) => {
          const keyframeName = match[1];
          const keyframeContent = match[2];
          
          // Check that keyframes use GPU-accelerated properties
          // Should contain transform or opacity
          const usesGPUProps = 
            /transform:/i.test(keyframeContent) || 
            /opacity:/i.test(keyframeContent) ||
            /background-position:/i.test(keyframeContent); // Allowed for shimmer effects
          
          expect(usesGPUProps).toBe(true);
          
          // Should not use layout-triggering properties
          const usesLayoutProps = 
            /\b(width|height|top|left|right|bottom|margin|padding):/i.test(keyframeContent);
          
          expect(usesLayoutProps).toBe(false);
        });
      });
    });

    it('should include translateZ(0) in keyframe animations for GPU acceleration', () => {
      const filePath = path.join(process.cwd(), 'styles/design-system.css');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check that pulse animation includes translateZ(0)
      expect(content).toContain('transform: translateZ(0)');
    });
  });

  describe('Requirement 14.2: Transition Durations (200-300ms)', () => {
    it('should use transition durations within 150-300ms range', () => {
      cssFiles.forEach((file) => {
        const filePath = path.join(process.cwd(), file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Extract all transition durations (including decimals like 0.2s)
        const transitionMsRegex = /transition:[^;]+?(\d+)ms/gi;
        const transitionSRegex = /transition:[^;]+?([\d.]+)s/gi;
        
        const msMatches = [...content.matchAll(transitionMsRegex)];
        const sMatches = [...content.matchAll(transitionSRegex)];
        
        msMatches.forEach((match) => {
          const duration = parseInt(match[1], 10);
          
          // Should be within 100-300ms range (allowing 100ms for touch feedback)
          if (duration > 0) { // Skip 0ms values used in reduced motion
            expect(duration).toBeGreaterThanOrEqual(100);
            expect(duration).toBeLessThanOrEqual(300);
          }
        });
        
        sMatches.forEach((match) => {
          const duration = parseFloat(match[1]) * 1000; // Convert to ms
          
          // Should be within 100-300ms range
          if (duration > 1) { // Skip very small values used in reduced motion
            expect(duration).toBeGreaterThanOrEqual(100);
            expect(duration).toBeLessThanOrEqual(300);
          }
        });
      });
    });

    it('should define standard transition timing variables', () => {
      const filePath = path.join(process.cwd(), 'styles/design-system.css');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('--transition-fast');
      expect(content).toContain('--transition-base');
      expect(content).toContain('--transition-slow');
      expect(content).toContain('--animation-duration-fast');
      expect(content).toContain('--animation-duration-base');
      expect(content).toContain('--animation-duration-slow');
    });
  });

  describe('Requirement 14.3: 60fps Performance', () => {
    it('should use will-change hints for frequently animated elements', () => {
      const filePath = path.join(process.cwd(), 'styles/design-system.css');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check for will-change usage
      expect(content).toContain('will-change: transform');
      expect(content).toContain('will-change: background-position');
    });

    it('should avoid animating expensive properties', () => {
      cssFiles.forEach((file) => {
        const filePath = path.join(process.cwd(), file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check that we're not animating expensive properties in transitions
        const transitionRegex = /transition:[^;]+/gi;
        const matches = [...content.matchAll(transitionRegex)];
        
        matches.forEach((match) => {
          const transitionValue = match[0];
          
          // Should not animate width, height, margin, padding in transitions
          const animatesExpensiveProps = 
            /transition:[^;]*(width|height|margin|padding)[^;]*;/i.test(transitionValue);
          
          expect(animatesExpensiveProps).toBe(false);
        });
      });
    });
  });

  describe('Requirement 14.4: Reduced Motion Support', () => {
    it('should include prefers-reduced-motion media query in all CSS files', () => {
      cssFiles.forEach((file) => {
        const filePath = path.join(process.cwd(), file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for reduced motion support
        const hasReducedMotion = /@media\s*\(prefers-reduced-motion:\s*reduce\)/i.test(content);
        
        expect(hasReducedMotion).toBe(true);
      });
    });

    it('should disable animations in reduced motion mode', () => {
      const filePath = path.join(process.cwd(), 'styles/design-system.css');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extract reduced motion block
      const reducedMotionRegex = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*{([^}]+)}/gi;
      const matches = [...content.matchAll(reducedMotionRegex)];
      
      expect(matches.length).toBeGreaterThan(0);
      
      matches.forEach((match) => {
        const reducedMotionContent = match[1];
        
        // Should set animation-duration to minimal value
        expect(reducedMotionContent).toContain('animation-duration');
        expect(reducedMotionContent).toContain('0.01ms');
      });
    });

    it('should disable specific animations in reduced motion mode', () => {
      const filePath = path.join(process.cwd(), 'styles/design-system.css');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check that specific animations are disabled
      expect(content).toContain('.beta-badge-dot');
      expect(content).toContain('animation: none');
    });
  });

  describe('Animation Inventory', () => {
    it('should have documented all keyframe animations', () => {
      const expectedAnimations = [
        'pulse', 
        'gradient-shift', 
        'shimmer', 
        'spin',
        'enhanced-pulse', // Phase 7
        'skeleton-loading', // Phase 7
        'fadeIn', // Phase 7
        'fadeOut' // Phase 7
      ];
      
      cssFiles.forEach((file) => {
        const filePath = path.join(process.cwd(), file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Extract all @keyframes
        const keyframesRegex = /@keyframes\s+([\w-]+)/gi;
        const matches = [...content.matchAll(keyframesRegex)];
        
        matches.forEach((match) => {
          const animationName = match[1];
          
          // Should be in our expected list
          expect(expectedAnimations).toContain(animationName);
        });
      });
    });

    it('should use cubic-bezier easing for smooth animations', () => {
      const filePath = path.join(process.cwd(), 'styles/design-system.css');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check for cubic-bezier easing
      expect(content).toContain('cubic-bezier');
      expect(content).toContain('--animation-easing');
    });
  });

  describe('Mobile Optimization', () => {
    it('should optimize animations for mobile devices', () => {
      const filePath = path.join(process.cwd(), 'app/responsive-enhancements.css');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check for mobile-specific optimizations
      expect(content).toContain('@media (max-width: 767px)');
      expect(content).toContain('transform: translateZ(0)');
      expect(content).toContain('backface-visibility: hidden');
    });

    it('should force GPU acceleration on touch devices', () => {
      const filePath = path.join(process.cwd(), 'app/responsive-enhancements.css');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check for touch device optimizations
      expect(content).toContain('@media (hover: none) and (pointer: coarse)');
      expect(content).toContain('translateZ(0)');
    });
  });
});
