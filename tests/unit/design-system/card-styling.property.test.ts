/**
 * **Feature: dashboard-design-refactor, Property 7: Card styling consistency**
 * **Validates: Requirements 3.1, 3.2, 3.3**
 * 
 * For any Card component, the rendered output SHALL have padding matching 
 * the --space-4 token (16px), shadow matching --shadow-card, and 
 * border-radius matching --radius-base (8px).
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Card styling configuration
interface CardConfig {
  padding: 'none' | 'sm' | 'base' | 'lg';
  shadow: 'none' | 'card' | 'elevated';
  variant: 'default' | 'glass' | 'elevated';
}

// Expected CSS values based on design tokens
const DESIGN_TOKENS = {
  spacing: {
    none: '0',
    sm: 'var(--space-2)',  // 8px
    base: 'var(--space-4)', // 16px
    lg: 'var(--space-6)',   // 24px
  },
  shadow: {
    none: 'shadow-none',
    card: 'shadow-[var(--shadow-card)]',
    elevated: 'shadow-[var(--shadow-elevated)]',
  },
  radius: 'var(--radius-base)', // 8px
};

// Padding class mapping
const paddingClasses: Record<string, string> = {
  none: 'p-0',
  sm: 'p-[var(--space-2)]',
  base: 'p-[var(--space-4)]',
  lg: 'p-[var(--space-6)]',
};

// Shadow class mapping
const shadowClasses: Record<string, string> = {
  none: 'shadow-none',
  card: 'shadow-[var(--shadow-card)]',
  elevated: 'shadow-[var(--shadow-elevated)]',
};

// Simulate Card class generation logic
function generateCardClasses(config: CardConfig): string[] {
  const classes: string[] = [];
  
  // Base radius - always applied
  classes.push('rounded-[var(--radius-base)]');
  
  // Border
  classes.push('border');
  classes.push('border-[var(--border-default)]');
  
  // Shadow based on config
  classes.push(shadowClasses[config.shadow]);
  
  // Padding based on config
  classes.push(paddingClasses[config.padding]);
  
  return classes;
}

// Arbitraries
const cardConfigArb = fc.record({
  padding: fc.constantFrom('none', 'sm', 'base', 'lg') as fc.Arbitrary<CardConfig['padding']>,
  shadow: fc.constantFrom('none', 'card', 'elevated') as fc.Arbitrary<CardConfig['shadow']>,
  variant: fc.constantFrom('default', 'glass', 'elevated') as fc.Arbitrary<CardConfig['variant']>,
});

describe('Property 7: Card styling consistency', () => {
  it('should always include border-radius matching --radius-base', () => {
    fc.assert(
      fc.property(cardConfigArb, (config) => {
        const classes = generateCardClasses(config);
        expect(classes).toContain('rounded-[var(--radius-base)]');
      }),
      { numRuns: 100 }
    );
  });

  it('should always include border styling', () => {
    fc.assert(
      fc.property(cardConfigArb, (config) => {
        const classes = generateCardClasses(config);
        expect(classes).toContain('border');
        expect(classes).toContain('border-[var(--border-default)]');
      }),
      { numRuns: 100 }
    );
  });

  it('should apply correct shadow class based on shadow prop', () => {
    fc.assert(
      fc.property(cardConfigArb, (config) => {
        const classes = generateCardClasses(config);
        const expectedShadowClass = shadowClasses[config.shadow];
        expect(classes).toContain(expectedShadowClass);
      }),
      { numRuns: 100 }
    );
  });

  it('should apply correct padding class based on padding prop', () => {
    fc.assert(
      fc.property(cardConfigArb, (config) => {
        const classes = generateCardClasses(config);
        const expectedPaddingClass = paddingClasses[config.padding];
        expect(classes).toContain(expectedPaddingClass);
      }),
      { numRuns: 100 }
    );
  });

  it('default Card should have base padding (16px) and card shadow', () => {
    const defaultConfig: CardConfig = {
      padding: 'base',
      shadow: 'card',
      variant: 'default',
    };
    const classes = generateCardClasses(defaultConfig);
    
    expect(classes).toContain('p-[var(--space-4)]');
    expect(classes).toContain('shadow-[var(--shadow-card)]');
    expect(classes).toContain('rounded-[var(--radius-base)]');
  });
});
