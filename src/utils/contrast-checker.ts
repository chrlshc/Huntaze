/**
 * WCAG Contrast Ratio Checker
 * Ensures all color combinations meet WCAG AAA standards
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ContrastResult {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  passesAALarge: boolean;
  passesAAALarge: boolean;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance according to WCAG
 */
function relativeLuminance(rgb: RGB): number {
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function contrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    throw new Error('Invalid hex color');
  }
  
  const lum1 = relativeLuminance(rgb1);
  const lum2 = relativeLuminance(rgb2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG standards
 */
export function checkContrast(foreground: string, background: string): ContrastResult {
  const ratio = contrastRatio(foreground, background);
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    passesAA: ratio >= 4.5,        // Normal text AA
    passesAAA: ratio >= 7,         // Normal text AAA
    passesAALarge: ratio >= 3,     // Large text AA
    passesAAALarge: ratio >= 4.5   // Large text AAA
  };
}

/**
 * Huntaze Dark Mode Color Palette with Contrast Verification
 */
export const darkModeColors = {
  // Backgrounds
  backgrounds: {
    primary: '#0F0F10',
    secondary: '#151516',
    elevated: '#1A1A1C',
  },
  
  // Text colors
  text: {
    primary: '#EEEFF1',
    secondary: '#8C99AD',
    tertiary: '#6B7280',
    disabled: '#4B5563',
  },
  
  // Accent colors
  accents: {
    primary: '#A855F7',
    hover: '#C084FC',
    active: '#9333EA',
  }
};

/**
 * Verify all Huntaze dark mode combinations
 */
export function verifyDarkModeContrast() {
  interface ContrastTestResult extends ContrastResult {
    combination: string;
    foreground: string;
    background: string;
  }
  
  const results: ContrastTestResult[] = [];
  
  // Check primary text on all backgrounds
  Object.entries(darkModeColors.backgrounds).forEach(([bgName, bgColor]) => {
    Object.entries(darkModeColors.text).forEach(([textName, textColor]) => {
      const result = checkContrast(textColor, bgColor);
      results.push({
        combination: `${textName} text on ${bgName} background`,
        foreground: textColor,
        background: bgColor,
        ...result
      });
    });
  });
  
  // Check accent colors on backgrounds
  Object.entries(darkModeColors.backgrounds).forEach(([bgName, bgColor]) => {
    Object.entries(darkModeColors.accents).forEach(([accentName, accentColor]) => {
      const result = checkContrast(accentColor, bgColor);
      results.push({
        combination: `${accentName} accent on ${bgName} background`,
        foreground: accentColor,
        background: bgColor,
        ...result
      });
    });
  });
  
  return results;
}

/**
 * Get recommended color adjustments
 */
export function getColorRecommendation(
  foreground: string, 
  background: string, 
  targetRatio: number = 7
): string {
  const currentRatio = contrastRatio(foreground, background);
  
  if (currentRatio >= targetRatio) {
    return foreground; // Already meets target
  }
  
  // Lighten the foreground color to improve contrast
  const rgb = hexToRgb(foreground);
  if (!rgb) return foreground;
  
  let factor = 1;
  while (factor <= 2) {
    const adjusted = {
      r: Math.min(255, Math.round(rgb.r * factor)),
      g: Math.min(255, Math.round(rgb.g * factor)),
      b: Math.min(255, Math.round(rgb.b * factor))
    };
    
    const adjustedHex = `#${[adjusted.r, adjusted.g, adjusted.b]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('')}`;
    
    if (contrastRatio(adjustedHex, background) >= targetRatio) {
      return adjustedHex;
    }
    
    factor += 0.1;
  }
  
  return foreground; // Return original if can't meet target
}

/**
 * Example usage and testing
 */
export function testContrastCompliance() {
  console.log('=== Huntaze Dark Mode Contrast Report ===\n');
  
  const results = verifyDarkModeContrast();
  
  results.forEach(result => {
    const status = result.passesAAA ? '✅ AAA' : 
                   result.passesAA ? '⚠️  AA' : 
                   '❌ FAIL';
    
    console.log(`${status} ${result.combination}`);
    console.log(`   Ratio: ${result.ratio}:1`);
    console.log(`   Colors: ${result.foreground} on ${result.background}\n`);
  });
  
  // Summary
  const aaaCount = results.filter(r => r.passesAAA).length;
  const aaCount = results.filter(r => r.passesAA && !r.passesAAA).length;
  const failCount = results.filter(r => !r.passesAA).length;
  
  console.log('=== Summary ===');
  console.log(`✅ AAA Compliant: ${aaaCount}`);
  console.log(`⚠️  AA Compliant: ${aaCount}`);
  console.log(`❌ Failed: ${failCount}`);
}