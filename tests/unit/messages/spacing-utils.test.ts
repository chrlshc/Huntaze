/**
 * Unit tests for spacing utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  snapToGrid,
  snapToFineGrid,
  isGridAligned,
  isFineGridAligned,
  warnIfNotGridAligned,
  parseCssValue,
  formatCssValue,
  getSpacing,
  multiplySpacing,
  createSpacingString,
  validateSpacing,
  SPACING_SCALE
} from '../../../lib/messages/spacing-utils';

describe('snapToGrid', () => {
  it('should snap values to nearest 8px increment', () => {
    expect(snapToGrid(0)).toBe(0);
    expect(snapToGrid(4)).toBe(8);  // Rounds up to nearest 8px
    expect(snapToGrid(5)).toBe(8);
    expect(snapToGrid(8)).toBe(8);
    expect(snapToGrid(10)).toBe(8);
    expect(snapToGrid(12)).toBe(16);
    expect(snapToGrid(13)).toBe(16);
    expect(snapToGrid(16)).toBe(16);
    expect(snapToGrid(20)).toBe(24);
  });

  it('should handle negative values', () => {
    expect(snapToGrid(-5)).toBe(-8);  // Rounds to nearest 8px
    expect(snapToGrid(-10)).toBe(-8);
    expect(snapToGrid(-13)).toBe(-16);
  });

  it('should support custom grid sizes', () => {
    expect(snapToGrid(13, 4)).toBe(12);
    expect(snapToGrid(13, 16)).toBe(16);
  });
});

describe('snapToFineGrid', () => {
  it('should snap values to nearest 4px increment', () => {
    expect(snapToFineGrid(0)).toBe(0);
    expect(snapToFineGrid(2)).toBe(4);  // Rounds up to nearest 4px
    expect(snapToFineGrid(3)).toBe(4);
    expect(snapToFineGrid(5)).toBe(4);
    expect(snapToFineGrid(6)).toBe(8);
    expect(snapToFineGrid(10)).toBe(12);
    expect(snapToFineGrid(13)).toBe(12);
  });
});

describe('isGridAligned', () => {
  it('should validate 8px grid alignment', () => {
    expect(isGridAligned(0)).toBe(true);
    expect(isGridAligned(8)).toBe(true);
    expect(isGridAligned(16)).toBe(true);
    expect(isGridAligned(24)).toBe(true);
    expect(isGridAligned(32)).toBe(true);
    
    expect(isGridAligned(4)).toBe(false);
    expect(isGridAligned(12)).toBe(false);
    expect(isGridAligned(13)).toBe(false);
    expect(isGridAligned(20)).toBe(false);
  });

  it('should support custom grid sizes', () => {
    expect(isGridAligned(12, 4)).toBe(true);
    expect(isGridAligned(12, 8)).toBe(false);
    expect(isGridAligned(16, 16)).toBe(true);
  });
});

describe('isFineGridAligned', () => {
  it('should validate 4px grid alignment', () => {
    expect(isFineGridAligned(0)).toBe(true);
    expect(isFineGridAligned(4)).toBe(true);
    expect(isFineGridAligned(8)).toBe(true);
    expect(isFineGridAligned(12)).toBe(true);
    expect(isFineGridAligned(16)).toBe(true);
    
    expect(isFineGridAligned(3)).toBe(false);
    expect(isFineGridAligned(5)).toBe(false);
    expect(isFineGridAligned(13)).toBe(false);
  });
});

describe('warnIfNotGridAligned', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should warn for non-aligned values in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    warnIfNotGridAligned(13, 'test-context');
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Spacing value 13px in 'test-context' is not aligned to 8px grid")
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Consider using 16px instead")
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should not warn for aligned values', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    warnIfNotGridAligned(16, 'test-context');
    
    expect(consoleWarnSpy).not.toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });

  it('should not warn in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    warnIfNotGridAligned(13, 'test-context');
    
    expect(consoleWarnSpy).not.toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });
});

describe('parseCssValue', () => {
  it('should parse pixel values', () => {
    expect(parseCssValue('16px')).toBe(16);
    expect(parseCssValue('0px')).toBe(0);
    expect(parseCssValue('24px')).toBe(24);
    expect(parseCssValue('13.5px')).toBe(13.5);
  });

  it('should handle values without px suffix', () => {
    expect(parseCssValue('16')).toBe(16);
  });

  it('should return NaN for non-pixel values', () => {
    // parseFloat('1rem') returns 1, parseFloat('auto') returns NaN
    expect(isNaN(parseCssValue('auto'))).toBe(true);
    expect(isNaN(parseCssValue('inherit'))).toBe(true);
  });
});

describe('formatCssValue', () => {
  it('should format numbers as pixel values', () => {
    expect(formatCssValue(16)).toBe('16px');
    expect(formatCssValue(0)).toBe('0px');
    expect(formatCssValue(24)).toBe('24px');
    expect(formatCssValue(13.5)).toBe('13.5px');
  });
});

describe('SPACING_SCALE', () => {
  it('should have correct values', () => {
    expect(SPACING_SCALE.xs).toBe(4);
    expect(SPACING_SCALE.sm).toBe(8);
    expect(SPACING_SCALE.md).toBe(12);
    expect(SPACING_SCALE.lg).toBe(16);
    expect(SPACING_SCALE.xl).toBe(20);
    expect(SPACING_SCALE['2xl']).toBe(24);
    expect(SPACING_SCALE['3xl']).toBe(32);
  });

  it('should have all values aligned to 4px grid', () => {
    Object.values(SPACING_SCALE).forEach(value => {
      expect(value % 4).toBe(0);
    });
  });
});

describe('getSpacing', () => {
  it('should return correct spacing values', () => {
    expect(getSpacing('xs')).toBe(4);
    expect(getSpacing('sm')).toBe(8);
    expect(getSpacing('md')).toBe(12);
    expect(getSpacing('lg')).toBe(16);
    expect(getSpacing('xl')).toBe(20);
    expect(getSpacing('2xl')).toBe(24);
    expect(getSpacing('3xl')).toBe(32);
  });
});

describe('multiplySpacing', () => {
  it('should multiply spacing values correctly', () => {
    expect(multiplySpacing('sm', 2)).toBe(16);
    expect(multiplySpacing('lg', 1.5)).toBe(24);
    expect(multiplySpacing('md', 0.5)).toBe(6);
  });
});

describe('createSpacingString', () => {
  it('should create spacing strings from scale keys', () => {
    expect(createSpacingString(['lg'])).toBe('16px');
    expect(createSpacingString(['lg', 'xl'])).toBe('16px 20px');
    expect(createSpacingString(['sm', 'md', 'lg', 'xl'])).toBe('8px 12px 16px 20px');
  });

  it('should create spacing strings from numbers', () => {
    expect(createSpacingString([16])).toBe('16px');
    expect(createSpacingString([16, 24])).toBe('16px 24px');
  });

  it('should handle mixed scale keys and numbers', () => {
    expect(createSpacingString(['lg', 24])).toBe('16px 24px');
    expect(createSpacingString([16, 'xl'])).toBe('16px 20px');
  });
});

describe('validateSpacing', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should validate aligned spacing values', () => {
    const result = validateSpacing({
      marginTop: '16px',
      paddingLeft: '24px',
      gap: '8px'
    }, 'test-component');

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect non-aligned spacing values', () => {
    const result = validateSpacing({
      marginTop: '13px',
      paddingLeft: '24px',
      gap: '7px'
    }, 'test-component');

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toContain('marginTop: 13px');
    expect(result.errors[1]).toContain('gap: 7px');
  });

  it('should ignore non-spacing properties', () => {
    const result = validateSpacing({
      color: 'red',
      fontSize: '13px',
      marginTop: '16px'
    }, 'test-component');

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should support custom grid sizes', () => {
    const result = validateSpacing({
      marginTop: '12px',
      paddingLeft: '16px'
    }, 'test-component', 4);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should warn in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    validateSpacing({
      marginTop: '13px'
    }, 'test-component');

    expect(consoleWarnSpy).toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });
});
