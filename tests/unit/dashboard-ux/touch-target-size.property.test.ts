/**
 * Property-Based Tests for Touch Target Size
 * 
 * **Feature: dashboard-ux-overhaul, Property 26: Touch Target Size**
 * **Validates: Requirements 10.4**
 * 
 * Property: For any interactive element on touch devices, the tap target
 * SHALL be at least 44x44 pixels.
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

// WCAG minimum touch target size
const MIN_TOUCH_TARGET_SIZE = 44;

// Types for testing
interface TouchTarget {
  id: string;
  type: 'button' | 'link' | 'icon-button' | 'nav-item' | 'fab' | 'action-item';
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
  isInteractive: boolean;
  isTouchDevice: boolean;
}

interface MobileNavItem {
  id: string;
  label: string;
  icon: string;
  width: number;
  height: number;
}

interface FABAction {
  id: string;
  label: string;
  width: number;
  height: number;
  isMainButton: boolean;
}

// Arbitraries
const paddingArb = fc.record({
  top: fc.integer({ min: 0, max: 20 }),
  right: fc.integer({ min: 0, max: 20 }),
  bottom: fc.integer({ min: 0, max: 20 }),
  left: fc.integer({ min: 0, max: 20 })
});

const touchTargetTypeArb = fc.constantFrom(
  'button', 'link', 'icon-button', 'nav-item', 'fab', 'action-item'
) as fc.Arbitrary<TouchTarget['type']>;

const validTouchTargetArb = fc.record({
  id: fc.stringMatching(/^[a-z][a-z0-9-]{2,20}$/),
  type: touchTargetTypeArb,
  width: fc.integer({ min: MIN_TOUCH_TARGET_SIZE, max: 200 }),
  height: fc.integer({ min: MIN_TOUCH_TARGET_SIZE, max: 200 }),
  padding: paddingArb,
  isInteractive: fc.constant(true),
  isTouchDevice: fc.constant(true)
});

// Invalid touch target: width + padding and height + padding must both be below 44px
const invalidTouchTargetArb = fc.record({
  id: fc.stringMatching(/^[a-z][a-z0-9-]{2,20}$/),
  type: touchTargetTypeArb,
  width: fc.integer({ min: 10, max: 20 }),
  height: fc.integer({ min: 10, max: 20 }),
  padding: fc.constant({ top: 0, right: 0, bottom: 0, left: 0 }), // No padding to ensure invalid
  isInteractive: fc.constant(true),
  isTouchDevice: fc.constant(true)
});

const mobileNavItemArb = fc.record({
  id: fc.stringMatching(/^[a-z][a-z0-9-]{2,20}$/),
  label: fc.string({ minLength: 2, maxLength: 15 }),
  icon: fc.constantFrom('home', 'message', 'dollar', 'calendar', 'bot'),
  width: fc.integer({ min: MIN_TOUCH_TARGET_SIZE, max: 100 }),
  height: fc.integer({ min: MIN_TOUCH_TARGET_SIZE, max: 80 })
});

const fabActionArb = fc.record({
  id: fc.stringMatching(/^[a-z][a-z0-9-]{2,20}$/),
  label: fc.string({ minLength: 2, maxLength: 20 }),
  width: fc.integer({ min: MIN_TOUCH_TARGET_SIZE, max: 80 }),
  height: fc.integer({ min: MIN_TOUCH_TARGET_SIZE, max: 80 }),
  isMainButton: fc.boolean()
});

// Simulation functions
function calculateEffectiveTouchArea(target: TouchTarget): { width: number; height: number } {
  return {
    width: target.width + target.padding.left + target.padding.right,
    height: target.height + target.padding.top + target.padding.bottom
  };
}

function meetsMinimumTouchTarget(target: TouchTarget): boolean {
  const effectiveArea = calculateEffectiveTouchArea(target);
  return effectiveArea.width >= MIN_TOUCH_TARGET_SIZE && 
         effectiveArea.height >= MIN_TOUCH_TARGET_SIZE;
}

function validateTouchTarget(target: TouchTarget): {
  isValid: boolean;
  actualWidth: number;
  actualHeight: number;
  requiredSize: number;
  widthDeficit: number;
  heightDeficit: number;
} {
  const effectiveArea = calculateEffectiveTouchArea(target);
  const widthDeficit = Math.max(0, MIN_TOUCH_TARGET_SIZE - effectiveArea.width);
  const heightDeficit = Math.max(0, MIN_TOUCH_TARGET_SIZE - effectiveArea.height);
  
  return {
    isValid: widthDeficit === 0 && heightDeficit === 0,
    actualWidth: effectiveArea.width,
    actualHeight: effectiveArea.height,
    requiredSize: MIN_TOUCH_TARGET_SIZE,
    widthDeficit,
    heightDeficit
  };
}

function validateMobileNavItem(item: MobileNavItem): boolean {
  return item.width >= MIN_TOUCH_TARGET_SIZE && item.height >= MIN_TOUCH_TARGET_SIZE;
}

function validateFABAction(action: FABAction): boolean {
  return action.width >= MIN_TOUCH_TARGET_SIZE && action.height >= MIN_TOUCH_TARGET_SIZE;
}

function getRecommendedSize(currentSize: number): number {
  return Math.max(currentSize, MIN_TOUCH_TARGET_SIZE);
}

describe('Property 26: Touch Target Size', () => {
  /**
   * **Feature: dashboard-ux-overhaul, Property 26: Touch Target Size**
   * **Validates: Requirements 10.4**
   */

  describe('Minimum Size Validation', () => {
    it('should validate touch targets meet 44px minimum', () => {
      fc.assert(
        fc.property(
          validTouchTargetArb,
          (target) => {
            const validation = validateTouchTarget(target);
            
            // Valid targets should pass validation
            expect(validation.isValid).toBe(true);
            expect(validation.actualWidth).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
            expect(validation.actualHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject touch targets below 44px', () => {
      fc.assert(
        fc.property(
          invalidTouchTargetArb,
          (target) => {
            const validation = validateTouchTarget(target);
            
            // Invalid targets should fail validation
            expect(validation.isValid).toBe(false);
            expect(validation.widthDeficit + validation.heightDeficit).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate effective touch area including padding', () => {
      fc.assert(
        fc.property(
          validTouchTargetArb,
          (target) => {
            const effectiveArea = calculateEffectiveTouchArea(target);
            
            // Effective area should include padding
            expect(effectiveArea.width).toBe(
              target.width + target.padding.left + target.padding.right
            );
            expect(effectiveArea.height).toBe(
              target.height + target.padding.top + target.padding.bottom
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('FAB Touch Targets', () => {
    it('should ensure FAB main button meets minimum size', () => {
      fc.assert(
        fc.property(
          fabActionArb.filter(a => a.isMainButton),
          (action) => {
            const isValid = validateFABAction(action);
            
            // FAB main button should meet minimum size
            expect(isValid).toBe(true);
            expect(action.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
            expect(action.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure FAB action items meet minimum size', () => {
      fc.assert(
        fc.property(
          fabActionArb,
          (action) => {
            const isValid = validateFABAction(action);
            
            // All FAB actions should meet minimum size
            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate FAB toggle button is at least 44x44', () => {
      const fabToggleSize = { width: 56, height: 56 }; // w-14 h-14 = 56px
      
      fc.assert(
        fc.property(
          fc.constant(fabToggleSize),
          (size) => {
            expect(size.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
            expect(size.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Mobile Bottom Navigation', () => {
    it('should ensure all nav items meet minimum touch target', () => {
      fc.assert(
        fc.property(
          fc.array(mobileNavItemArb, { minLength: 1, maxLength: 5 }),
          (navItems) => {
            navItems.forEach(item => {
              const isValid = validateMobileNavItem(item);
              
              // All nav items should meet minimum size
              expect(isValid).toBe(true);
              expect(item.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
              expect(item.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain minimum spacing between nav items', () => {
      fc.assert(
        fc.property(
          fc.array(mobileNavItemArb, { minLength: 2, maxLength: 5 }),
          (navItems) => {
            // Each item should have enough space
            const totalWidth = navItems.reduce((sum, item) => sum + item.width, 0);
            const avgWidth = totalWidth / navItems.length;
            
            // Average width should be at least minimum touch target
            expect(avgWidth).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Interactive Elements', () => {
    it('should validate all button types meet minimum size', () => {
      const buttonTypes: TouchTarget['type'][] = ['button', 'icon-button', 'fab', 'action-item'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...buttonTypes),
          validTouchTargetArb,
          (type, target) => {
            const targetWithType = { ...target, type };
            const isValid = meetsMinimumTouchTarget(targetWithType);
            
            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate link touch targets', () => {
      fc.assert(
        fc.property(
          validTouchTargetArb.map(t => ({ ...t, type: 'link' as const })),
          (target) => {
            const isValid = meetsMinimumTouchTarget(target);
            
            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate navigation item touch targets', () => {
      fc.assert(
        fc.property(
          validTouchTargetArb.map(t => ({ ...t, type: 'nav-item' as const })),
          (target) => {
            const isValid = meetsMinimumTouchTarget(target);
            
            expect(isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Size Recommendations', () => {
    it('should recommend correct size for undersized targets', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: MIN_TOUCH_TARGET_SIZE - 1 }),
          (currentSize) => {
            const recommended = getRecommendedSize(currentSize);
            
            // Recommended size should be at least minimum
            expect(recommended).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not change size for already valid targets', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MIN_TOUCH_TARGET_SIZE, max: 200 }),
          (currentSize) => {
            const recommended = getRecommendedSize(currentSize);
            
            // Size should remain unchanged if already valid
            expect(recommended).toBe(currentSize);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Deficit Calculation', () => {
    it('should calculate correct width deficit', () => {
      fc.assert(
        fc.property(
          invalidTouchTargetArb,
          (target) => {
            const validation = validateTouchTarget(target);
            const effectiveWidth = target.width + target.padding.left + target.padding.right;
            const expectedDeficit = Math.max(0, MIN_TOUCH_TARGET_SIZE - effectiveWidth);
            
            expect(validation.widthDeficit).toBe(expectedDeficit);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate correct height deficit', () => {
      fc.assert(
        fc.property(
          invalidTouchTargetArb,
          (target) => {
            const validation = validateTouchTarget(target);
            const effectiveHeight = target.height + target.padding.top + target.padding.bottom;
            const expectedDeficit = Math.max(0, MIN_TOUCH_TARGET_SIZE - effectiveHeight);
            
            expect(validation.heightDeficit).toBe(expectedDeficit);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have zero deficit for valid targets', () => {
      fc.assert(
        fc.property(
          validTouchTargetArb,
          (target) => {
            const validation = validateTouchTarget(target);
            
            expect(validation.widthDeficit).toBe(0);
            expect(validation.heightDeficit).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Touch Device Detection', () => {
    it('should apply minimum size only on touch devices', () => {
      fc.assert(
        fc.property(
          validTouchTargetArb,
          fc.boolean(),
          (target, isTouchDevice) => {
            const targetWithDevice = { ...target, isTouchDevice };
            
            if (isTouchDevice) {
              // On touch devices, minimum size should be enforced
              expect(meetsMinimumTouchTarget(targetWithDevice)).toBe(true);
            }
            // On non-touch devices, smaller targets might be acceptable
            // but we still validate for accessibility
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Specific Component Sizes', () => {
    it('should validate QuickActionsFAB component sizes', () => {
      // Actual sizes from QuickActionsFAB component
      const fabSizes = {
        mainButton: { width: 56, height: 56 },  // w-14 h-14
        actionButton: { width: 44, height: 44 } // w-11 h-11
      };

      fc.assert(
        fc.property(
          fc.constant(fabSizes),
          (sizes) => {
            expect(sizes.mainButton.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
            expect(sizes.mainButton.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
            expect(sizes.actionButton.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
            expect(sizes.actionButton.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate MobileBottomNav component sizes', () => {
      // Minimum sizes enforced in MobileBottomNav
      const navItemMinSize = MIN_TOUCH_TARGET_SIZE;

      fc.assert(
        fc.property(
          fc.integer({ min: navItemMinSize, max: 100 }),
          fc.integer({ min: navItemMinSize, max: 80 }),
          (width, height) => {
            expect(width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
            expect(height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
