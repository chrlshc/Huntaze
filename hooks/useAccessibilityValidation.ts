'use client';

/**
 * useAccessibilityValidation Hook
 * 
 * Development-only hook for validating accessibility compliance
 * Logs warnings for contrast ratios, touch targets, and focus indicators
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import { useEffect, useRef } from 'react';
import {
  validateColorContrast,
  validateTouchTarget,
  validateFocusIndicator,
} from '../lib/utils/accessibility';

interface AccessibilityValidationOptions {
  /**
   * Validate color contrast ratios
   */
  validateContrast?: boolean;
  
  /**
   * Validate touch target sizes
   */
  validateTouchTargets?: boolean;
  
  /**
   * Validate focus indicators
   */
  validateFocusIndicators?: boolean;
  
  /**
   * Context name for logging
   */
  context?: string;
}

/**
 * Hook to validate accessibility compliance in development
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const ref = useAccessibilityValidation({
 *     validateContrast: true,
 *     validateTouchTargets: true,
 *     context: 'MyComponent'
 *   });
 *   
 *   return <div ref={ref}>...</div>;
 * }
 * ```
 */
export function useAccessibilityValidation<T extends HTMLElement>(
  options: AccessibilityValidationOptions = {}
): React.RefObject<T> {
  const ref = useRef<T>(null);
  
  const {
    validateContrast = true,
    validateTouchTargets = true,
    validateFocusIndicators = true,
    context = 'Component',
  } = options;

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    if (!ref.current) {
      return;
    }

    const element = ref.current;

    // Validate color contrast
    if (validateContrast) {
      const computed = window.getComputedStyle(element);
      const color = computed.color;
      const backgroundColor = computed.backgroundColor;
      
      if (color && backgroundColor) {
        validateColorContrast(color, backgroundColor, context);
      }
    }

    // Validate touch targets for interactive elements
    if (validateTouchTargets) {
      const interactiveElements = element.querySelectorAll(
        'button, a, input, select, textarea, [role="button"], [role="link"], [tabindex]'
      );
      
      interactiveElements.forEach((el) => {
        validateTouchTarget(el as HTMLElement, `${context} > ${el.tagName}`);
      });
    }

    // Validate focus indicators for interactive elements
    if (validateFocusIndicators) {
      const interactiveElements = element.querySelectorAll(
        'button, a, input, select, textarea, [role="button"], [role="link"], [tabindex]'
      );
      
      interactiveElements.forEach((el) => {
        validateFocusIndicator(el as HTMLElement, `${context} > ${el.tagName}`);
      });
    }
  }, [validateContrast, validateTouchTargets, validateFocusIndicators, context]);

  return ref;
}

/**
 * Hook to validate a specific element's accessibility
 * 
 * @example
 * ```tsx
 * function MyButton() {
 *   const ref = useElementAccessibility('MyButton');
 *   return <button ref={ref}>Click me</button>;
 * }
 * ```
 */
export function useElementAccessibility<T extends HTMLElement>(
  context: string
): React.RefObject<T> {
  return useAccessibilityValidation<T>({
    validateContrast: true,
    validateTouchTargets: true,
    validateFocusIndicators: true,
    context,
  });
}
