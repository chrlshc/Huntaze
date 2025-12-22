/**
 * Spacing Utilities for Messaging Interface
 * 
 * Provides utilities for working with the 8px grid system,
 * ensuring all spacing values align to the grid for consistency.
 */

/**
 * Snaps a value to the nearest 8px grid increment
 * 
 * @param value - The value to snap (in pixels)
 * @param gridSize - The grid size to snap to (default: 8)
 * @returns The snapped value
 * 
 * @example
 * snapToGrid(13) // Returns 16
 * snapToGrid(6)  // Returns 8
 * snapToGrid(10) // Returns 8
 */
export function snapToGrid(value: number, gridSize: number = 8): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snaps a value to the nearest 4px increment (for fine-tuning)
 * 
 * @param value - The value to snap (in pixels)
 * @returns The snapped value
 * 
 * @example
 * snapToFineGrid(13) // Returns 12
 * snapToFineGrid(6)  // Returns 8
 * snapToFineGrid(10) // Returns 12
 */
export function snapToFineGrid(value: number): number {
  return snapToGrid(value, 4);
}

/**
 * Validates if a value is aligned to the 8px grid
 * 
 * @param value - The value to validate (in pixels)
 * @param gridSize - The grid size to validate against (default: 8)
 * @returns True if the value is aligned to the grid
 * 
 * @example
 * isGridAligned(16) // Returns true
 * isGridAligned(13) // Returns false
 * isGridAligned(12, 4) // Returns true
 */
export function isGridAligned(value: number, gridSize: number = 8): boolean {
  return value % gridSize === 0;
}

/**
 * Validates if a value is aligned to the 4px fine grid
 * 
 * @param value - The value to validate (in pixels)
 * @returns True if the value is aligned to the 4px grid
 * 
 * @example
 * isFineGridAligned(12) // Returns true
 * isFineGridAligned(13) // Returns false
 */
export function isFineGridAligned(value: number): boolean {
  return isGridAligned(value, 4);
}

/**
 * Warns in development if a value is not grid-aligned
 * 
 * @param value - The value to check
 * @param context - Context for the warning message
 * @param gridSize - The grid size to check against (default: 8)
 * 
 * @example
 * warnIfNotGridAligned(13, 'message-padding')
 * // Console warning: "Spacing value 13px in 'message-padding' is not aligned to 8px grid. Consider using 16px instead."
 */
export function warnIfNotGridAligned(
  value: number,
  context: string,
  gridSize: number = 8
): void {
  if (process.env.NODE_ENV === 'development' && !isGridAligned(value, gridSize)) {
    const suggested = snapToGrid(value, gridSize);
    console.warn(
      `Spacing value ${value}px in '${context}' is not aligned to ${gridSize}px grid. ` +
      `Consider using ${suggested}px instead.`
    );
  }
}

/**
 * Converts a CSS value string to a number (strips 'px' suffix)
 * 
 * @param cssValue - The CSS value string (e.g., "16px")
 * @returns The numeric value
 * 
 * @example
 * parseCssValue("16px") // Returns 16
 * parseCssValue("1.5rem") // Returns NaN (not supported)
 */
export function parseCssValue(cssValue: string): number {
  return parseFloat(cssValue.replace('px', ''));
}

/**
 * Formats a number as a CSS pixel value
 * 
 * @param value - The numeric value
 * @returns The CSS value string (e.g., "16px")
 * 
 * @example
 * formatCssValue(16) // Returns "16px"
 */
export function formatCssValue(value: number): string {
  return `${value}px`;
}

/**
 * Gets a spacing token value from CSS custom properties
 * 
 * @param tokenName - The CSS custom property name (without '--' prefix)
 * @returns The computed value in pixels
 * 
 * @example
 * getSpacingToken('msg-space-lg') // Returns 16
 */
export function getSpacingToken(tokenName: string): number {
  if (typeof window === 'undefined') {
    return 0; // SSR fallback
  }
  
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${tokenName}`)
    .trim();
  
  return parseCssValue(value);
}

/**
 * Validates all spacing values in a style object against the grid
 * 
 * @param styles - Object containing CSS property names and values
 * @param context - Context for warning messages
 * @param gridSize - The grid size to validate against (default: 8)
 * @returns Object with validation results
 * 
 * @example
 * validateSpacing({
 *   marginTop: '16px',
 *   paddingLeft: '13px'
 * }, 'message-bubble')
 * // Returns: { valid: false, errors: ['paddingLeft: 13px not aligned'] }
 */
export function validateSpacing(
  styles: Record<string, string>,
  context: string,
  gridSize: number = 8
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const spacingProps = [
    'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'gap', 'rowGap', 'columnGap'
  ];
  
  for (const [prop, value] of Object.entries(styles)) {
    if (spacingProps.includes(prop)) {
      const numValue = parseCssValue(value);
      if (!isNaN(numValue) && !isGridAligned(numValue, gridSize)) {
        const suggested = snapToGrid(numValue, gridSize);
        errors.push(
          `${prop}: ${value} not aligned to ${gridSize}px grid (suggested: ${suggested}px)`
        );
      }
    }
  }
  
  if (errors.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn(`Spacing validation failed for '${context}':`, errors);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Spacing scale based on 8px grid
 * Use these constants for programmatic spacing calculations
 */
export const SPACING_SCALE = {
  xs: 4,   // Extra tight
  sm: 8,   // Tight
  md: 12,  // Comfortable
  lg: 16,  // Standard
  xl: 20,  // Generous
  '2xl': 24, // Section
  '3xl': 32  // Large section
} as const;

/**
 * Type for spacing scale keys
 */
export type SpacingScale = keyof typeof SPACING_SCALE;

/**
 * Gets a spacing value from the scale
 * 
 * @param scale - The scale key
 * @returns The spacing value in pixels
 * 
 * @example
 * getSpacing('lg') // Returns 16
 */
export function getSpacing(scale: SpacingScale): number {
  return SPACING_SCALE[scale];
}

/**
 * Multiplies a spacing scale value
 * 
 * @param scale - The scale key
 * @param multiplier - The multiplier
 * @returns The multiplied spacing value
 * 
 * @example
 * multiplySpacing('lg', 2) // Returns 32
 */
export function multiplySpacing(scale: SpacingScale, multiplier: number): number {
  return getSpacing(scale) * multiplier;
}

/**
 * Creates a spacing string for CSS (e.g., "16px 24px")
 * 
 * @param values - Array of spacing scale keys or numbers
 * @returns CSS spacing string
 * 
 * @example
 * createSpacingString(['lg', 'xl']) // Returns "16px 20px"
 * createSpacingString([16, 24]) // Returns "16px 24px"
 */
export function createSpacingString(values: (SpacingScale | number)[]): string {
  return values
    .map(v => typeof v === 'number' ? formatCssValue(v) : formatCssValue(getSpacing(v)))
    .join(' ');
}
