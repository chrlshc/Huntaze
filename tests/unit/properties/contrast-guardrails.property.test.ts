/**
 * Property Tests: Contrast Guardrails (Properties 25-29)
 *
 * **Feature: design-system-unification**
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7**
 *
 * This suite enforces the new contrast guardrails:
 * - Property 25: Border opacity minimum (>= 0.12)
 * - Property 26: Interactive elements show clear visual distinction
 * - Property 27: Nested backgrounds progressively lighten
 * - Property 28: Adjacent dark surfaces maintain visible separation
 * - Property 29: Cards include light accent treatments (border/glow/shadow)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

type BorderViolation = {
  file: string;
  line: number;
  value: number;
  token: string;
  context: string;
};

type DarkSurfaceViolation = {
  file: string;
  line: number;
  background: string;
  context: string;
};

const MIN_BORDER_OPACITY = 0.12;
const MIN_DARK_SURFACE_CONTRAST = 1.1;

const SCAN_GLOBS = ['**/*.{ts,tsx,js,jsx,css}'];
const IGNORE_GLOBS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/scripts/**',
  '**/public/**',
  '**/docs/**',
  '**/test-results/**',
  '**/tests/**',
  '**/*.test.*',
  '**/*.spec.*',
  '**/*.stories.*',
  '**/*.mdx',
  '**/*.md',
  '**/playwright-report/**',
];

const DESIGN_TOKENS_PATH = path.join(process.cwd(), 'styles/design-tokens.css');

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : null;
}

function rgbaStringToRgb(rgba: string): { rgb: [number, number, number]; alpha: number } | null {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
  if (!match) return null;

  const [, r, g, b, a] = match;
  const alpha = a !== undefined ? parseFloat(a) : 1;
  return {
    rgb: [parseInt(r, 10), parseInt(g, 10), parseInt(b, 10)],
    alpha,
  };
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
  const lum1 = getLuminance(...color1);
  const lum2 = getLuminance(...color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseAlphaFromRgba(rgba: string): number | null {
  const parsed = rgbaStringToRgb(rgba);
  return parsed ? parsed.alpha : null;
}

function parseTailwindOpacity(token: string): number | null {
  // border-white/10 -> 0.1
  const simpleMatch = token.match(/\/(\d{1,3})$/);
  if (simpleMatch) {
    return parseInt(simpleMatch[1], 10) / 100;
  }

  // border-white/[0.08] -> 0.08
  const bracketMatch = token.match(/\/\[(\d*\.?\d+)\]/);
  if (bracketMatch) {
    return parseFloat(bracketMatch[1]);
  }

  // Arbitrary border-[rgba(..., 0.08)]
  const rgbaMatch = token.match(/rgba?\([^)]+\)/);
  if (rgbaMatch) {
    return parseAlphaFromRgba(rgbaMatch[0]);
  }

  return null;
}

function loadDesignTokens(): string {
  expect(fs.existsSync(DESIGN_TOKENS_PATH)).toBe(true);
  return fs.readFileSync(DESIGN_TOKENS_PATH, 'utf-8');
}

function getAllFiles(): string[] {
  return glob.sync(SCAN_GLOBS, {
    cwd: process.cwd(),
    absolute: true,
    ignore: IGNORE_GLOBS,
  });
}

function findLowOpacityBorders(filePath: string): BorderViolation[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relative = path.relative(process.cwd(), filePath);
  const violations: BorderViolation[] = [];

  lines.forEach((line, index) => {
    if (!line.toLowerCase().includes('border')) {
      return;
    }

    const tailwindTokens = line.match(/border-[^\s"'>]+/g) ?? [];
    tailwindTokens.forEach(token => {
      const opacity = parseTailwindOpacity(token);
      if (opacity !== null && opacity < MIN_BORDER_OPACITY) {
        violations.push({
          file: relative,
          line: index + 1,
          value: opacity,
          token,
          context: line.trim().slice(0, 160),
        });
      }
    });

    // CSS/inline rgba border declarations
    const rgbaMatches = line.match(/rgba?\([^)]+\)/g) ?? [];
    rgbaMatches.forEach(match => {
      const alpha = parseAlphaFromRgba(match);
      if (alpha !== null && alpha < MIN_BORDER_OPACITY) {
        violations.push({
          file: relative,
          line: index + 1,
          value: alpha,
          token: match,
          context: line.trim().slice(0, 160),
        });
      }
    });
  });

  return violations;
}

function findDarkSurfaceViolations(filePath: string): DarkSurfaceViolation[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relative = path.relative(process.cwd(), filePath);
  const violations: DarkSurfaceViolation[] = [];

  const darkBgPattern = /(bg-(?:zinc-9\d{2})|bg-\[var\(--bg-(?:primary|secondary|tertiary|card-elevated)\)\])/;

  lines.forEach((line, index) => {
    if (!darkBgPattern.test(line)) return;

    // Skip dual-theme declarations where dark mode inherits an existing separation
    if (line.includes('dark:')) return;

    const tokenMatch = line.match(darkBgPattern);
    const token = tokenMatch ? tokenMatch[0] : '';
    if (token.includes('--bg-primary')) return;

    const hasSeparation = /(border|ring-|shadow|divide-|outline)/.test(line);
    if (!hasSeparation) {
      violations.push({
        file: relative,
        line: index + 1,
        background: (line.match(darkBgPattern) || [''])[0],
        context: line.trim().slice(0, 160),
      });
    }
  });

  return violations;
}

function extractCssVariable(value: string, token: string): string | null {
  const match = value.match(new RegExp(`${token}:\\s*([^;]+);`));
  return match ? match[1].trim() : null;
}

function resolveColor(value: string, background?: [number, number, number]): [number, number, number] | null {
  if (value.startsWith('#')) {
    return hexToRgb(value);
  }
  if (value.startsWith('rgba') && background) {
    const parsed = rgbaStringToRgb(value);
    if (!parsed) return null;
    const [r, g, b] = parsed.rgb;
    const a = parsed.alpha;
    const [br, bg, bb] = background;
    return [
      Math.round(r * a + br * (1 - a)),
      Math.round(g * a + bg * (1 - a)),
      Math.round(b * a + bb * (1 - a)),
    ];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Property 25: Border opacity minimum
// ---------------------------------------------------------------------------

describe('Property 25: Border Opacity Minimum', () => {
  it('enforces border opacity >= 0.12 across source files', async () => {
    const files = getAllFiles();
    expect(files.length).toBeGreaterThan(0);

    const violations = files.flatMap(findLowOpacityBorders);

    if (violations.length > 0) {
      console.error('\n⚠️  Low-opacity border declarations found (< 0.12):');
      violations.slice(0, 15).forEach(v => {
        console.error(` - ${v.file}:${v.line} → ${v.token} (${v.value})`);
        console.error(`   ${v.context}`);
      });
      if (violations.length > 15) {
        console.error(` ... and ${violations.length - 15} more`);
      }
    }

    expect(violations.length).toBe(0);
  });

  it('keeps border tokens at or above minimum opacity', () => {
    const tokens = loadDesignTokens();
    const borderTokens = ['--border-subtle', '--border-default', '--border-emphasis', '--border-strong'];

    borderTokens.forEach(token => {
      const value = extractCssVariable(tokens, token);
      expect(value).toBeTruthy();

      if (value && value.includes('rgba')) {
        const alpha = parseAlphaFromRgba(value);
        expect(alpha).not.toBeNull();
        if (alpha !== null) {
          expect(alpha).toBeGreaterThanOrEqual(MIN_BORDER_OPACITY);
        }
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Property 26: Interactive element visual distinction
// ---------------------------------------------------------------------------

describe('Property 26: Interactive Element Visual Distinction', () => {
  const INTERACTIVE_COMPONENTS = [
    'components/ui/button.tsx',
    'components/ui/input.tsx',
    'components/ui/link.tsx',
    'components/ui/card.tsx',
  ];

  it('ensures core interactive components include borders, color, or shadow affordances', () => {
    INTERACTIVE_COMPONENTS.forEach(componentPath => {
      const fullPath = path.join(process.cwd(), componentPath);
      expect(fs.existsSync(fullPath)).toBe(true);

      const content = fs.readFileSync(fullPath, 'utf-8');
      const hasVisibleAffordance =
        content.includes('border-[var(--border') ||
        content.includes('border-[length:var(--input-border-width)') ||
        content.includes('shadow-[var(--shadow') ||
        content.includes('bg-[var(--bg-') ||
        /hover:border-|hover:bg-|hover:shadow/.test(content);

      expect(hasVisibleAffordance).toBe(true);
    });
  });

  it('retains focus ring tokens for keyboard visibility', () => {
    const tokens = loadDesignTokens();
    ['--focus-ring-width', '--focus-ring-color', '--focus-ring-offset'].forEach(token => {
      expect(tokens).toContain(token);
    });
  });

  it('verifies link variants keep explicit affordance via color or underline', () => {
    const linkPath = path.join(process.cwd(), 'components/ui/link.tsx');
    const content = fs.readFileSync(linkPath, 'utf-8');

    expect(content).toMatch(/underline|hover:underline/);
    expect(content).toMatch(/text-\[var\(--accent-primary\)\]|text-\[var\(--text-secondary\)\]/);
  });
});

// ---------------------------------------------------------------------------
// Property 27: Nested background hierarchy
// ---------------------------------------------------------------------------

describe('Property 27: Nested Background Hierarchy', () => {
  it('defines progressively lighter nested background tokens', () => {
    const tokens = loadDesignTokens();
    const primary = extractCssVariable(tokens, '--bg-primary');
    const secondary = extractCssVariable(tokens, '--bg-secondary');
    const tertiary = extractCssVariable(tokens, '--bg-tertiary');
    const glassHover = extractCssVariable(tokens, '--bg-glass-hover');

    expect(primary && secondary && tertiary && glassHover).toBeTruthy();

    const primaryRgb = resolveColor(primary!);
    const secondaryRgb = resolveColor(secondary!);
    const tertiaryRgb = resolveColor(tertiary!);
    const glassHoverRgb = resolveColor(glassHover!, primaryRgb ?? undefined);

    expect(primaryRgb && tertiaryRgb && secondaryRgb && glassHoverRgb).toBeTruthy();

    if (primaryRgb && tertiaryRgb && secondaryRgb && glassHoverRgb) {
      const EPSILON = 0.001;
      const luminances = [
        getLuminance(...primaryRgb),
        getLuminance(...secondaryRgb),
        getLuminance(...tertiaryRgb),
        getLuminance(...glassHoverRgb),
      ];

      expect(luminances[1]).toBeGreaterThan(luminances[0] - EPSILON);
      expect(luminances[2]).toBeGreaterThan(luminances[1] - EPSILON);
      expect(luminances[3]).toBeGreaterThan(luminances[2] - EPSILON);
    }
  });

  it('ships nesting utility classes for background hierarchy', () => {
    const tokens = loadDesignTokens();
    ['nesting-level-0', 'nesting-level-1', 'nesting-level-2', 'nesting-level-3'].forEach(cls => {
      expect(tokens).toContain(`.${cls}`);
    });
  });

  it('has adoption of nesting utilities in components', () => {
    const files = glob.sync(['components/**/*.{tsx,ts}', 'app/**/*.{tsx,ts}'], {
      cwd: process.cwd(),
      absolute: true,
      ignore: IGNORE_GLOBS,
    });

    const nestingUsage = files.reduce((count, file) => {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = content.match(/nesting-level-[0-3]/g);
      return count + (matches ? matches.length : 0);
    }, 0);

    expect(nestingUsage).toBeGreaterThan(3);
  });
});

// ---------------------------------------------------------------------------
// Property 28: Adjacent element contrast
// ---------------------------------------------------------------------------

describe('Property 28: Adjacent Element Contrast', () => {
  it('keeps adjacent dark surfaces above minimum contrast and separation', () => {
    const tokens = loadDesignTokens();
    const primary = extractCssVariable(tokens, '--bg-primary');
    const secondary = extractCssVariable(tokens, '--bg-secondary');
    const tertiary = extractCssVariable(tokens, '--bg-tertiary');
    const card = extractCssVariable(tokens, '--bg-card-elevated') ?? tertiary;

    expect(primary && secondary && tertiary && card).toBeTruthy();

    const primaryRgb = primary && resolveColor(primary);
    const secondaryRgb = secondary && resolveColor(secondary);
    const tertiaryRgb = tertiary && resolveColor(tertiary);
    const cardRgb = card && resolveColor(card);

    if (primaryRgb && secondaryRgb && tertiaryRgb && cardRgb) {
      const combos: Array<[string, [number, number, number], [number, number, number]]> = [
        ['primary-secondary', primaryRgb, secondaryRgb],
        ['primary-card', primaryRgb, cardRgb],
        ['secondary-tertiary', secondaryRgb, tertiaryRgb],
      ];

      combos.forEach(([label, a, b]) => {
        const ratio = getContrastRatio(a, b);
        expect(ratio).toBeGreaterThanOrEqual(MIN_DARK_SURFACE_CONTRAST);
      });
    }

    const files = getAllFiles();
    const violations = files.flatMap(findDarkSurfaceViolations);

    if (violations.length > 0) {
      console.error('\n⚠️  Dark surfaces without separation found:');
      violations.slice(0, 10).forEach(v => {
        console.error(` - ${v.file}:${v.line} → ${v.background}`);
        console.error(`   ${v.context}`);
      });
      if (violations.length > 10) {
        console.error(` ... and ${violations.length - 10} more`);
      }
    }

    expect(violations.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Property 29: Card light accent presence
// ---------------------------------------------------------------------------

describe('Property 29: Card Light Accent Presence', () => {
  it('ensures card utilities include border and light accent treatments', () => {
    const tokens = loadDesignTokens();

    const glassCard = tokens.match(/\.glass-card\s*\{[^}]+\}/s);
    const cardElevated = tokens.match(/\.card-elevated\s*\{[^}]+\}/s);
    const nestingLevel1 = tokens.match(/\.nesting-level-1\s*\{[^}]+\}/s);

    [glassCard, cardElevated, nestingLevel1].forEach(block => {
      expect(block).toBeTruthy();
      if (block) {
        expect(block[0]).toMatch(/border/);
        expect(block[0]).toMatch(/shadow/);
      }
    });
  });

  it('confirms card usages include visible borders or shadows', () => {
    const KNOWN_ACCENT_CLASSES = [
      'beta-stat-card',
      'beta-feature-card',
      'elevated-card',
      'pattern-card',
      'recommendation-card',
      'stat-card',
      'quick-actions-card',
      'recent-activity-card',
      'platform-status-card',
      'quick-action-button',
      'skeleton-card-mobile',
      'card-header',
      'card-value',
      'card-description',
      'platform-status-item',
      'huntaze-card',
      'huntaze-card-grid',
      'tool-card',
    ];

    const files = glob.sync(['components/**/*.{tsx,ts}', 'app/**/*.{tsx,ts}'], {
      cwd: process.cwd(),
      absolute: true,
      ignore: IGNORE_GLOBS,
    });

    const cardUsageViolations: Array<{ file: string; line: number; context: string }> = [];

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        // Skip explicit Card component usage (component already enforces accents)
        if (/<Card[\s>]/.test(line)) {
          return;
        }

        const classMatch = line.match(/className=["']([^"']+)["']/);
        if (!classMatch) return;

        const classes = classMatch[1];
        const referencesCard = /(glass-card|card-elevated|nesting-level-[0-3]|\bcard\b|card-)/.test(classes);
        if (!referencesCard) return;

        const hasAccent =
          /(border|shadow|glass-card|card-elevated|nesting-level-)/.test(classes) ||
          KNOWN_ACCENT_CLASSES.some(cls => classes.includes(cls));
        if (!hasAccent) {
          cardUsageViolations.push({
            file: path.relative(process.cwd(), file),
            line: index + 1,
            context: line.trim().slice(0, 160),
          });
        }
      });
    });

    expect(cardUsageViolations.length).toBe(0);
  });

  it('uses property-based sampling to keep card accent adoption consistent', () => {
    const files = glob.sync(['components/**/*.{tsx,ts}', 'app/**/*.{tsx,ts}'], {
      cwd: process.cwd(),
      absolute: true,
      ignore: IGNORE_GLOBS,
    });

    fc.assert(
      fc.property(fc.constantFrom(...files.slice(0, Math.min(50, files.length))), file => {
        const content = fs.readFileSync(file, 'utf-8');
        const usage = content.match(/Card|card-elevated|glass-card|nesting-level-[0-3]/g);
        if (!usage) return true;
        return /(border|shadow|glass-card|card-elevated|nesting-level-)/.test(content);
      }),
      { numRuns: Math.min(50, files.length) || 1 }
    );
  });
});
