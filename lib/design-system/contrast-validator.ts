/**
 * Contrast Validation Utilities
 * 
 * Provides utilities for validating WCAG AA contrast ratios (4.5:1 minimum)
 * between text and background colors.
 */

/**
 * Converts a hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Handle 3-digit hex
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }
  
  // Handle 6-digit hex
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }
  
  return null;
}

/**
 * Converts RGB color to relative luminance
 * Formula from WCAG 2.0: https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function getLuminance(r: number, g: number, b: number): number {
  // Convert to 0-1 range
  const [rs, gs, bs] = [r, g, b].map(val => {
    const sRGB = val / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  
  // Calculate relative luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates the contrast ratio between two colors
 * Formula from WCAG 2.0: https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 * 
 * @param foreground - Foreground color (hex format)
 * @param background - Background color (hex format)
 * @returns Contrast ratio (1-21)
 */
export function calculateContrastRatio(
  foreground: string,
  background: string
): number {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  
  if (!fgRgb || !bgRgb) {
    console.error('Invalid color format. Use hex format (#RGB or #RRGGBB)');
    return 0;
  }
  
  const fgLuminance = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  // Ensure lighter color is in numerator
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  
  // Calculate contrast ratio
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validates that a color combination meets WCAG AA standards
 * 
 * @param foreground - Foreground color (hex format)
 * @param background - Background color (hex format)
 * @param level - WCAG level ('AA' or 'AAA')
 * @param size - Text size ('normal' or 'large')
 * @returns Validation result with ratio and pass/fail status
 */
export function validateContrast(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): { ratio: number; passes: boolean; message: string } {
  const ratio = calculateContrastRatio(foreground, background);
  
  // WCAG contrast requirements
  const requirements = {
    AA: {
      normal: 4.5,
      large: 3.0,
    },
    AAA: {
      normal: 7.0,
      large: 4.5,
    },
  };
  
  const required = requirements[level][size];
  const passes = ratio >= required;
  
  const message = passes
    ? `✓ Contrast ratio ${ratio.toFixed(2)}:1 meets WCAG ${level} (${required}:1 minimum for ${size} text)`
    : `✗ Contrast ratio ${ratio.toFixed(2)}:1 fails WCAG ${level} (${required}:1 minimum for ${size} text)`;
  
  if (!passes) {
    console.warn(message, {
      foreground,
      background,
      ratio: ratio.toFixed(2),
      required,
      level,
      size,
    });
  }
  
  return { ratio, passes, message };
}

/**
 * Validates contrast for an HTML element
 * Extracts computed colors from the element and validates them
 * 
 * @param element - HTML element to validate
 * @param level - WCAG level ('AA' or 'AAA')
 * @returns Validation result
 */
export function validateElementContrast(
  element: HTMLElement,
  level: 'AA' | 'AAA' = 'AA'
): { ratio: number; passes: boolean; message: string } | null {
  const styles = window.getComputedStyle(element);
  const color = styles.color;
  const backgroundColor = styles.backgroundColor;
  
  // Convert rgb/rgba to hex
  const rgbToHex = (rgb: string): string | null => {
    const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return null;
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return '#' + [r, g, b]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
  };
  
  const fgHex = rgbToHex(color);
  const bgHex = rgbToHex(backgroundColor);
  
  if (!fgHex || !bgHex) {
    console.warn('Could not extract colors from element', element);
    return null;
  }
  
  // Determine text size (large text is 18px+ or 14px+ bold)
  const fontSize = parseFloat(styles.fontSize);
  const fontWeight = parseInt(styles.fontWeight);
  const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
  
  return validateContrast(
    fgHex,
    bgHex,
    level,
    isLargeText ? 'large' : 'normal'
  );
}

/**
 * Audits all text elements on a page for contrast issues
 * 
 * @param container - Container element to audit (defaults to document.body)
 * @param level - WCAG level ('AA' or 'AAA')
 * @returns Array of elements with contrast issues
 */
export function auditPageContrast(
  container: HTMLElement = document.body,
  level: 'AA' | 'AAA' = 'AA'
): Array<{ element: HTMLElement; result: ReturnType<typeof validateElementContrast> }> {
  const textElements = container.querySelectorAll<HTMLElement>(
    'p, span, a, button, h1, h2, h3, h4, h5, h6, label, li, td, th'
  );
  
  const issues: Array<{ element: HTMLElement; result: ReturnType<typeof validateElementContrast> }> = [];
  
  textElements.forEach(element => {
    const result = validateElementContrast(element, level);
    if (result && !result.passes) {
      issues.push({ element, result });
    }
  });
  
  if (issues.length > 0) {
    console.group(`Found ${issues.length} contrast issues (WCAG ${level})`);
    issues.forEach(({ element, result }) => {
      console.warn(result.message, element);
    });
    console.groupEnd();
  } else {
    console.log(`✓ All text elements pass WCAG ${level} contrast requirements`);
  }
  
  return issues;
}
