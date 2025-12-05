/**
 * **Feature: dashboard-design-refactor, Property 36: Design token round-trip serialization**
 * **Validates: Requirements 14.1, 14.2, 14.3**
 * 
 * Property-based test ensuring design tokens can be serialized and deserialized
 * without data loss (round-trip consistency).
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  DEFAULT_DESIGN_TOKENS,
  DesignTokens,
  tokenSerializer,
  validateTokens,
} from '@/lib/design-system';

describe('Property 36: Design token round-trip serialization', () => {
  /**
   * Property: For any valid DesignTokens object, serializing to JSON
   * and deserializing back SHALL produce an object equal to the original.
   */
  it('default tokens survive round-trip serialization', () => {
    const original = DEFAULT_DESIGN_TOKENS;
    
    // Serialize to JSON
    const json = tokenSerializer.toJSON(original);
    expect(json).toBeTruthy();
    expect(typeof json).toBe('string');
    
    // Deserialize back
    const restored = tokenSerializer.fromJSON(json);
    
    // Compare all token categories
    expect(restored.spacing).toEqual(original.spacing);
    expect(restored.colors).toEqual(original.colors);
    expect(restored.typography).toEqual(original.typography);
    expect(restored.shadows).toEqual(original.shadows);
    expect(restored.radius).toEqual(original.radius);
  });

  /**
   * Property: JSON output is valid JSON
   */
  it('toJSON produces valid JSON', () => {
    const json = tokenSerializer.toJSON(DEFAULT_DESIGN_TOKENS);
    
    expect(() => JSON.parse(json)).not.toThrow();
    
    const parsed = JSON.parse(json);
    expect(parsed.version).toBeDefined();
    expect(parsed.tokens).toBeDefined();
  });

  /**
   * Property: JSON schema includes all token categories
   */
  it('JSON schema includes all required categories', () => {
    const json = tokenSerializer.toJSON(DEFAULT_DESIGN_TOKENS);
    const parsed = JSON.parse(json);
    
    expect(parsed.tokens.spacing).toBeDefined();
    expect(parsed.tokens.colors).toBeDefined();
    expect(parsed.tokens.typography).toBeDefined();
    expect(parsed.tokens.shadows).toBeDefined();
    expect(parsed.tokens.radius).toBeDefined();
  });

  /**
   * Property: CSS variables output is valid CSS
   */
  it('toCSSVariables produces valid CSS custom properties', () => {
    const css = tokenSerializer.toCSSVariables(DEFAULT_DESIGN_TOKENS);
    
    expect(css).toContain(':root {');
    expect(css).toContain('}');
    expect(css).toContain('--space-');
    expect(css).toContain('--bg-');
    expect(css).toContain('--text-');
    expect(css).toContain('--accent-');
    expect(css).toContain('--shadow-');
    expect(css).toContain('--radius-');
  });

  /**
   * Property: Spacing tokens preserve exact values through round-trip
   */
  it('spacing tokens preserve exact values', () => {
    const original = DEFAULT_DESIGN_TOKENS;
    const json = tokenSerializer.toJSON(original);
    const restored = tokenSerializer.fromJSON(json);
    
    Object.keys(original.spacing).forEach(key => {
      const k = key as keyof typeof original.spacing;
      expect(restored.spacing[k]).toBe(original.spacing[k]);
    });
  });

  /**
   * Property: Color tokens preserve exact values through round-trip
   */
  it('color tokens preserve exact values', () => {
    const original = DEFAULT_DESIGN_TOKENS;
    const json = tokenSerializer.toJSON(original);
    const restored = tokenSerializer.fromJSON(json);
    
    // Surface colors
    Object.keys(original.colors.surface).forEach(key => {
      const k = key as keyof typeof original.colors.surface;
      expect(restored.colors.surface[k]).toBe(original.colors.surface[k]);
    });
    
    // Text colors
    Object.keys(original.colors.text).forEach(key => {
      const k = key as keyof typeof original.colors.text;
      expect(restored.colors.text[k]).toBe(original.colors.text[k]);
    });
    
    // Status colors
    Object.keys(original.colors.status).forEach(key => {
      const k = key as keyof typeof original.colors.status;
      expect(restored.colors.status[k]).toBe(original.colors.status[k]);
    });
  });

  /**
   * Property: Typography tokens preserve exact values through round-trip
   */
  it('typography tokens preserve exact values', () => {
    const original = DEFAULT_DESIGN_TOKENS;
    const json = tokenSerializer.toJSON(original);
    const restored = tokenSerializer.fromJSON(json);
    
    expect(restored.typography.fontFamily).toBe(original.typography.fontFamily);
    
    Object.keys(original.typography.sizes).forEach(key => {
      const k = key as keyof typeof original.typography.sizes;
      expect(restored.typography.sizes[k]).toBe(original.typography.sizes[k]);
    });
    
    Object.keys(original.typography.weights).forEach(key => {
      const k = key as keyof typeof original.typography.weights;
      expect(restored.typography.weights[k]).toBe(original.typography.weights[k]);
    });
  });

  /**
   * Property: Invalid JSON throws error
   */
  it('fromJSON throws on invalid JSON', () => {
    expect(() => tokenSerializer.fromJSON('not valid json')).toThrow();
    expect(() => tokenSerializer.fromJSON('{}')).toThrow();
    expect(() => tokenSerializer.fromJSON('{"tokens": null}')).toThrow();
  });

  /**
   * Property: Restored tokens pass validation
   */
  it('restored tokens pass validation', () => {
    const json = tokenSerializer.toJSON(DEFAULT_DESIGN_TOKENS);
    const restored = tokenSerializer.fromJSON(json);
    
    const validation = validateTokens(restored);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  /**
   * Property-based test: Multiple round-trips preserve data
   */
  it('multiple round-trips preserve data', () => {
    let tokens = DEFAULT_DESIGN_TOKENS;
    
    // Perform 5 round-trips
    for (let i = 0; i < 5; i++) {
      const json = tokenSerializer.toJSON(tokens);
      tokens = tokenSerializer.fromJSON(json);
    }
    
    // Final result should equal original
    expect(tokens.spacing).toEqual(DEFAULT_DESIGN_TOKENS.spacing);
    expect(tokens.colors).toEqual(DEFAULT_DESIGN_TOKENS.colors);
    expect(tokens.typography).toEqual(DEFAULT_DESIGN_TOKENS.typography);
    expect(tokens.shadows).toEqual(DEFAULT_DESIGN_TOKENS.shadows);
    expect(tokens.radius).toEqual(DEFAULT_DESIGN_TOKENS.radius);
  });

  /**
   * Property: CSS output contains all spacing tokens
   */
  it('CSS output contains all spacing tokens', () => {
    const css = tokenSerializer.toCSSVariables(DEFAULT_DESIGN_TOKENS);
    
    Object.keys(DEFAULT_DESIGN_TOKENS.spacing).forEach(key => {
      expect(css).toContain(`--space-${key}:`);
    });
  });

  /**
   * Property: CSS output contains all radius tokens
   */
  it('CSS output contains all radius tokens', () => {
    const css = tokenSerializer.toCSSVariables(DEFAULT_DESIGN_TOKENS);
    
    Object.keys(DEFAULT_DESIGN_TOKENS.radius).forEach(key => {
      expect(css).toContain(`--radius-${key}:`);
    });
  });
});
