/**
 * Accessibility Utilities
 * 
 * Utilities for ensuring WCAG 2.1 AA compliance across the application.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

/**
 * Calculate relative luminance according to WCAG formula
 * https://www.w3.org/TR/WCAG20-TECHS/G17.html
 */
export function getLuminance(hex: string): number {
  // Handle rgba colors by extracting RGB
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
    const match = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return 0;
    const [, r, g, b] = match.map(Number);
    return calculateLuminance(r, g, b);
  }

  // Handle hex colors
  const cleanHex = hex.replace('#', '');
  const rgb = parseInt(cleanHex, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;

  return calculateLuminance(r, g, b);
}

function calculateLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG20-TECHS/G17.html
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a color combination meets WCAG AA standards
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  options: {
    isLargeText?: boolean;
    isUIComponent?: boolean;
  } = {}
): boolean {
  const ratio = getContrastRatio(foreground, background);
  
  // Large text (18pt+ or 14pt+ bold) requires 3:1
  if (options.isLargeText) {
    return ratio >= 3.0;
  }
  
  // UI components require 3:1
  if (options.isUIComponent) {
    return ratio >= 3.0;
  }
  
  // Normal text requires 4.5:1
  return ratio >= 4.5;
}

/**
 * Development warning for accessibility violations
 * Only logs in development environment
 */
export function warnAccessibilityViolation(
  message: string,
  details?: Record<string, any>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[A11Y] ${message}`, details || '');
  }
}

/**
 * Check if an element meets touch target size requirements (44x44px minimum)
 */
export function meetsTouchTargetSize(
  width: number,
  height: number,
  minSize: number = 44
): boolean {
  return width >= minSize && height >= minSize;
}

/**
 * Validate color contrast and log warnings in development
 */
export function validateColorContrast(
  foreground: string,
  background: string,
  context: string,
  options: {
    isLargeText?: boolean;
    isUIComponent?: boolean;
  } = {}
): void {
  const ratio = getContrastRatio(foreground, background);
  const meetsStandard = meetsWCAGAA(foreground, background, options);
  
  if (!meetsStandard) {
    const requiredRatio = options.isLargeText || options.isUIComponent ? 3.0 : 4.5;
    warnAccessibilityViolation(
      `Insufficient color contrast in ${context}`,
      {
        foreground,
        background,
        ratio: ratio.toFixed(2),
        required: requiredRatio,
        ...options,
      }
    );
  }
}

/**
 * Validate touch target size and log warnings in development
 */
export function validateTouchTarget(
  element: HTMLElement,
  context: string
): void {
  const { width, height } = element.getBoundingClientRect();
  
  if (!meetsTouchTargetSize(width, height)) {
    warnAccessibilityViolation(
      `Touch target too small in ${context}`,
      {
        width: `${width}px`,
        height: `${height}px`,
        required: '44x44px minimum',
      }
    );
  }
}

/**
 * Ensure an element has a visible focus indicator
 */
export function hasFocusIndicator(element: HTMLElement): boolean {
  const computed = window.getComputedStyle(element, ':focus-visible');
  const outlineWidth = computed.getPropertyValue('outline-width');
  const outlineStyle = computed.getPropertyValue('outline-style');
  const boxShadow = computed.getPropertyValue('box-shadow');
  
  // Check if there's a visible outline or box-shadow (ring)
  return (
    (outlineWidth !== '0px' && outlineStyle !== 'none') ||
    (boxShadow !== 'none' && boxShadow !== '')
  );
}

/**
 * Validate focus indicator and log warnings in development
 */
export function validateFocusIndicator(
  element: HTMLElement,
  context: string
): void {
  if (!hasFocusIndicator(element)) {
    warnAccessibilityViolation(
      `Missing focus indicator in ${context}`,
      {
        element: element.tagName,
        className: element.className,
      }
    );
  }
}
