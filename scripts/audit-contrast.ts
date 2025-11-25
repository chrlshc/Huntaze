/**
 * Contrast Audit Script
 * 
 * Audits text contrast ratios across the application to ensure WCAG AA compliance
 * - Normal text: 4.5:1 minimum
 * - Large text (18pt+): 3:1 minimum
 */

interface ColorPair {
  foreground: string;
  background: string;
  location: string;
  element: string;
  isLargeText: boolean;
}

interface ContrastResult {
  ratio: number;
  passes: boolean;
  required: number;
  colorPair: ColorPair;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error(`Invalid color format: ${color1} or ${color2}`);
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
function meetsWCAG_AA(ratio: number, isLargeText: boolean): boolean {
  const required = isLargeText ? 3 : 4.5;
  return ratio >= required;
}

/**
 * Common color pairs used in the application
 */
const colorPairs: ColorPair[] = [
  // Hero section
  {
    foreground: '#FFFFFF',
    background: '#0F0F10',
    location: 'Hero Section',
    element: 'Main heading',
    isLargeText: true,
  },
  {
    foreground: '#EDEDEF',
    background: '#0F0F10',
    location: 'Hero Section',
    element: 'Subtitle text',
    isLargeText: false,
  },
  {
    foreground: '#9CA3AF',
    background: '#0F0F10',
    location: 'Hero Section',
    element: 'Description text',
    isLargeText: false,
  },

  // Purple/Violet backgrounds
  {
    foreground: '#FFFFFF',
    background: '#7D57C1',
    location: 'CTA Buttons',
    element: 'Button text',
    isLargeText: false,
  },
  {
    foreground: '#FFFFFF',
    background: '#6B47AF',
    location: 'CTA Buttons (hover)',
    element: 'Button text',
    isLargeText: false,
  },
  {
    foreground: '#FFFFFF',
    background: '#A78BFA',
    location: 'Secondary buttons',
    element: 'Button text',
    isLargeText: false,
  },

  // Dashboard demo
  {
    foreground: '#FFFFFF',
    background: '#131316',
    location: 'Dashboard Demo',
    element: 'Card headings',
    isLargeText: true,
  },
  {
    foreground: '#9CA3AF',
    background: '#131316',
    location: 'Dashboard Demo',
    element: 'Card descriptions',
    isLargeText: false,
  },
  {
    foreground: '#A78BFA',
    background: '#131316',
    location: 'Dashboard Demo',
    element: 'Icon colors',
    isLargeText: false,
  },

  // Form elements
  {
    foreground: '#EF4444',
    background: '#FFFFFF',
    location: 'Forms',
    element: 'Error messages',
    isLargeText: false,
  },
  {
    foreground: '#DC2626',
    background: '#FFFFFF',
    location: 'Forms',
    element: 'Error messages (dark)',
    isLargeText: false,
  },
  {
    foreground: '#10B981',
    background: '#FFFFFF',
    location: 'Forms',
    element: 'Success messages',
    isLargeText: false,
  },

  // Footer
  {
    foreground: '#9CA3AF',
    background: '#0F0F10',
    location: 'Footer',
    element: 'Link text',
    isLargeText: false,
  },
  {
    foreground: '#6B7280',
    background: '#0F0F10',
    location: 'Footer',
    element: 'Copyright text',
    isLargeText: false,
  },

  // Interactive demo tooltips
  {
    foreground: '#FFFFFF',
    background: '#1F2937',
    location: 'Tooltips',
    element: 'Tooltip text',
    isLargeText: false,
  },

  // Badge/Tag elements
  {
    foreground: '#A78BFA',
    background: '#1F2937',
    location: 'Badges',
    element: 'Badge text',
    isLargeText: false,
  },
];

/**
 * Run contrast audit
 */
function auditContrast(): ContrastResult[] {
  const results: ContrastResult[] = [];

  console.log('\n🔍 Running Contrast Audit...\n');
  console.log('WCAG AA Requirements:');
  console.log('- Normal text: 4.5:1 minimum');
  console.log('- Large text (18pt+): 3:1 minimum\n');
  console.log('─'.repeat(80));

  for (const pair of colorPairs) {
    const ratio = getContrastRatio(pair.foreground, pair.background);
    const required = pair.isLargeText ? 3 : 4.5;
    const passes = meetsWCAG_AA(ratio, pair.isLargeText);

    results.push({
      ratio,
      passes,
      required,
      colorPair: pair,
    });

    const status = passes ? '✅ PASS' : '❌ FAIL';
    const textSize = pair.isLargeText ? 'Large' : 'Normal';

    console.log(`\n${status} ${pair.location} - ${pair.element}`);
    console.log(`  Foreground: ${pair.foreground}`);
    console.log(`  Background: ${pair.background}`);
    console.log(`  Ratio: ${ratio.toFixed(2)}:1 (${textSize} text, requires ${required}:1)`);
  }

  console.log('\n' + '─'.repeat(80));

  const failedCount = results.filter((r) => !r.passes).length;
  const passedCount = results.filter((r) => r.passes).length;

  console.log(`\n📊 Summary:`);
  console.log(`  Total pairs tested: ${results.length}`);
  console.log(`  ✅ Passed: ${passedCount}`);
  console.log(`  ❌ Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.log(`\n⚠️  ${failedCount} color pair(s) need adjustment for WCAG AA compliance`);
    console.log('\nRecommendations:');
    results
      .filter((r) => !r.passes)
      .forEach((r) => {
        console.log(`\n  ${r.colorPair.location} - ${r.colorPair.element}:`);
        console.log(`    Current ratio: ${r.ratio.toFixed(2)}:1`);
        console.log(`    Required: ${r.required}:1`);
        console.log(`    Suggestion: Increase contrast by adjusting foreground or background`);
      });
  } else {
    console.log('\n✨ All color pairs meet WCAG AA standards!');
  }

  return results;
}

/**
 * Generate contrast fix suggestions
 */
function generateFixSuggestions(results: ContrastResult[]): void {
  const failed = results.filter((r) => !r.passes);

  if (failed.length === 0) return;

  console.log('\n' + '='.repeat(80));
  console.log('🔧 FIX SUGGESTIONS');
  console.log('='.repeat(80));

  failed.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.colorPair.location} - ${result.colorPair.element}`);
    console.log(`   Current: ${result.colorPair.foreground} on ${result.colorPair.background}`);
    console.log(`   Ratio: ${result.ratio.toFixed(2)}:1 (needs ${result.required}:1)`);

    // Calculate how much darker/lighter the color needs to be
    const improvement = result.required / result.ratio;
    console.log(`   Needs ${((improvement - 1) * 100).toFixed(0)}% more contrast`);

    console.log('\n   Options:');
    console.log('   a) Darken the background');
    console.log('   b) Lighten the foreground');
    console.log('   c) Use a different color combination');
    console.log('   d) Increase font size (if applicable)');
  });
}

// Run the audit
if (require.main === module) {
  const results = auditContrast();
  generateFixSuggestions(results);

  // Exit with error code if any tests failed
  const failedCount = results.filter((r) => !r.passes).length;
  process.exit(failedCount > 0 ? 1 : 0);
}

export { auditContrast, getContrastRatio, meetsWCAG_AA };
