/**
 * Huntaze Design System - Token Serializer
 * 
 * Handles serialization/deserialization of design tokens
 * for theming and export/import functionality.
 * 
 * Validates: Requirements 14.1, 14.2, 14.3
 */

import {
  DesignTokens,
  TokenSerializer,
  TokenValidationResult,
  TokenValidationError,
  SpacingTokens,
  ColorTokens,
  TypographyTokens,
  ShadowTokens,
  RadiusTokens,
  DEFAULT_DESIGN_TOKENS,
} from './types';

// ========================================
// VALIDATION HELPERS
// ========================================

/**
 * Check if a value is a valid CSS color
 */
export function isValidCSSColor(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  
  // Hex colors
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value)) {
    return true;
  }
  
  // RGB/RGBA (allow any numbers, browser will clamp)
  // Supports both comma and space syntax
  if (/^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(,\s*[\d.]+\s*)?\)$/.test(value)) {
    return true;
  }
  
  // HSL/HSLA
  if (/^hsla?\(\s*[\d.]+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(,\s*[\d.]+\s*)?\)$/.test(value)) {
    return true;
  }
  
  // Named colors (common ones) - case insensitive
  const namedColors = [
    'transparent', 'currentcolor', 'inherit',
    'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
  ];
  if (namedColors.includes(value.toLowerCase())) {
    return true;
  }
  
  return false;
}

/**
 * Check if a value is a valid CSS length
 */
export function isValidCSSLength(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  
  // Zero without unit
  if (value === '0') return true;
  
  // Number with unit
  if (/^-?[\d.]+(?:px|rem|em|%|vh|vw|vmin|vmax|ch|ex)$/.test(value)) {
    return true;
  }
  
  return false;
}

/**
 * Check if a value is a valid CSS box-shadow
 */
export function isValidCSSBoxShadow(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  
  // None
  if (value === 'none') return true;
  
  // Basic shadow pattern: offset-x offset-y [blur] [spread] color
  // Also supports inset and multiple shadows
  // Pattern allows: inset? offset-x offset-y [blur] [spread] color
  const shadowPattern = /^(inset\s+)?(-?[\d.]+(?:px|rem|em)?\s+){2,4}(rgba?\([^)]+\)|#[0-9A-Fa-f]{3,8}|\w+)/;
  
  // Split by comma for multiple shadows
  const shadows = value.split(/,(?![^(]*\))/);
  return shadows.every(shadow => shadowPattern.test(shadow.trim()));
}

/**
 * Check if spacing value is a multiple of 4px
 */
export function isMultipleOf4px(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  
  // Zero is valid
  if (value === '0' || value === '0px') return true;
  
  // Extract numeric value
  const match = value.match(/^(-?[\d.]+)px$/);
  if (!match) return false;
  
  const numValue = parseFloat(match[1]);
  return numValue % 4 === 0;
}

/**
 * Check if font size is in allowed scale
 */
export function isAllowedFontSize(value: string): boolean {
  const allowedSizes = ['12px', '14px', '16px', '20px', '24px', '28px'];
  return allowedSizes.includes(value);
}

/**
 * Check if font weight is in allowed values
 */
export function isAllowedFontWeight(value: number): boolean {
  const allowedWeights = [400, 500, 600];
  return allowedWeights.includes(value);
}

// ========================================
// TOKEN SERIALIZER IMPLEMENTATION
// ========================================

class DesignTokenSerializer implements TokenSerializer {
  /**
   * Serialize design tokens to JSON string
   * Validates: Requirements 14.1
   */
  toJSON(tokens: DesignTokens): string {
    const schema = {
      version: '1.0.0',
      tokens: {
        spacing: this.serializeSpacing(tokens.spacing),
        colors: this.serializeColors(tokens.colors),
        typography: this.serializeTypography(tokens.typography),
        shadows: this.serializeShadows(tokens.shadows),
        radius: this.serializeRadius(tokens.radius),
      },
    };
    return JSON.stringify(schema, null, 2);
  }

  /**
   * Deserialize JSON string to design tokens
   * Validates: Requirements 14.2
   */
  fromJSON(json: string): DesignTokens {
    try {
      const schema = JSON.parse(json);
      
      if (!schema.tokens) {
        throw new Error('Invalid token schema: missing tokens property');
      }

      return {
        spacing: this.deserializeSpacing(schema.tokens.spacing),
        colors: this.deserializeColors(schema.tokens.colors),
        typography: this.deserializeTypography(schema.tokens.typography),
        shadows: this.deserializeShadows(schema.tokens.shadows),
        radius: this.deserializeRadius(schema.tokens.radius),
      };
    } catch (error) {
      throw new Error(`Token deserialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert design tokens to CSS custom properties string
   */
  toCSSVariables(tokens: DesignTokens): string {
    const lines: string[] = [':root {'];
    
    // Spacing
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      lines.push(`  --space-${key}: ${value};`);
    });
    
    // Colors - Surface
    Object.entries(tokens.colors.surface).forEach(([key, value]) => {
      lines.push(`  --bg-${key}: ${value};`);
    });
    
    // Colors - Text
    Object.entries(tokens.colors.text).forEach(([key, value]) => {
      lines.push(`  --text-${key}: ${value};`);
    });
    
    // Colors - Action
    lines.push(`  --accent-primary: ${tokens.colors.action.primary};`);
    lines.push(`  --accent-primary-hover: ${tokens.colors.action.primaryHover};`);
    lines.push(`  --accent-primary-active: ${tokens.colors.action.primaryActive};`);
    
    // Colors - Status
    Object.entries(tokens.colors.status).forEach(([key, value]) => {
      lines.push(`  --accent-${key}: ${value};`);
    });
    
    // Colors - Border
    Object.entries(tokens.colors.border).forEach(([key, value]) => {
      lines.push(`  --border-${key}: ${value};`);
    });
    
    // Typography
    lines.push(`  --font-sans: ${tokens.typography.fontFamily};`);
    Object.entries(tokens.typography.sizes).forEach(([key, value]) => {
      lines.push(`  --text-${key}: ${value};`);
    });
    lines.push(`  --font-weight-normal: ${tokens.typography.weights.regular};`);
    lines.push(`  --font-weight-medium: ${tokens.typography.weights.medium};`);
    lines.push(`  --font-weight-semibold: ${tokens.typography.weights.semibold};`);
    
    // Shadows
    lines.push(`  --shadow-card: ${tokens.shadows.card};`);
    lines.push(`  --shadow-elevated: ${tokens.shadows.elevated};`);
    lines.push(`  --shadow-focus: ${tokens.shadows.focus};`);
    lines.push(`  --shadow-inner-glow: ${tokens.shadows.innerGlow};`);
    
    // Radius
    Object.entries(tokens.radius).forEach(([key, value]) => {
      lines.push(`  --radius-${key}: ${value};`);
    });
    
    lines.push('}');
    return lines.join('\n');
  }

  // ========================================
  // PRIVATE SERIALIZATION METHODS
  // ========================================

  private serializeSpacing(spacing: SpacingTokens): Record<string, { value: string; type: string }> {
    const result: Record<string, { value: string; type: string }> = {};
    Object.entries(spacing).forEach(([key, value]) => {
      result[key] = { value, type: 'spacing' };
    });
    return result;
  }

  private serializeColors(colors: ColorTokens): Record<string, unknown> {
    return {
      surface: this.serializeColorGroup(colors.surface),
      text: this.serializeColorGroup(colors.text),
      action: this.serializeColorGroup(colors.action),
      status: this.serializeColorGroup(colors.status),
      border: this.serializeColorGroup(colors.border),
    };
  }

  private serializeColorGroup(group: Record<string, string>): Record<string, { value: string; type: string }> {
    const result: Record<string, { value: string; type: string }> = {};
    Object.entries(group).forEach(([key, value]) => {
      result[key] = { value, type: 'color' };
    });
    return result;
  }

  private serializeTypography(typography: TypographyTokens): Record<string, unknown> {
    return {
      fontFamily: { value: typography.fontFamily, type: 'typography' },
      sizes: Object.fromEntries(
        Object.entries(typography.sizes).map(([key, value]) => [
          key,
          { value, type: 'typography' },
        ])
      ),
      weights: Object.fromEntries(
        Object.entries(typography.weights).map(([key, value]) => [
          key,
          { value: value.toString(), type: 'typography' },
        ])
      ),
    };
  }

  private serializeShadows(shadows: ShadowTokens): Record<string, { value: string; type: string }> {
    const result: Record<string, { value: string; type: string }> = {};
    Object.entries(shadows).forEach(([key, value]) => {
      result[key] = { value, type: 'shadow' };
    });
    return result;
  }

  private serializeRadius(radius: RadiusTokens): Record<string, { value: string; type: string }> {
    const result: Record<string, { value: string; type: string }> = {};
    Object.entries(radius).forEach(([key, value]) => {
      result[key] = { value, type: 'radius' };
    });
    return result;
  }

  // ========================================
  // PRIVATE DESERIALIZATION METHODS
  // ========================================

  private deserializeSpacing(data: Record<string, { value: string }>): SpacingTokens {
    const result: Partial<SpacingTokens> = {};
    Object.entries(data).forEach(([key, item]) => {
      (result as Record<string, string>)[key] = item.value;
    });
    return result as SpacingTokens;
  }

  private deserializeColors(data: Record<string, unknown>): ColorTokens {
    return {
      surface: this.deserializeColorGroup(data.surface as Record<string, { value: string }>),
      text: this.deserializeColorGroup(data.text as Record<string, { value: string }>),
      action: this.deserializeColorGroup(data.action as Record<string, { value: string }>),
      status: this.deserializeColorGroup(data.status as Record<string, { value: string }>),
      border: this.deserializeColorGroup(data.border as Record<string, { value: string }>),
    } as ColorTokens;
  }

  private deserializeColorGroup(group: Record<string, { value: string }>): Record<string, string> {
    const result: Record<string, string> = {};
    Object.entries(group).forEach(([key, item]) => {
      result[key] = item.value;
    });
    return result;
  }

  private deserializeTypography(data: Record<string, unknown>): TypographyTokens {
    const fontFamilyData = data.fontFamily as { value: string };
    const sizesData = data.sizes as Record<string, { value: string }>;
    const weightsData = data.weights as Record<string, { value: string }>;

    return {
      fontFamily: fontFamilyData.value,
      sizes: Object.fromEntries(
        Object.entries(sizesData).map(([key, item]) => [key, item.value])
      ) as TypographyTokens['sizes'],
      weights: Object.fromEntries(
        Object.entries(weightsData).map(([key, item]) => [key, parseInt(item.value, 10)])
      ) as TypographyTokens['weights'],
    };
  }

  private deserializeShadows(data: Record<string, { value: string }>): ShadowTokens {
    return {
      card: data.card.value,
      elevated: data.elevated.value,
      focus: data.focus.value,
      innerGlow: data.innerGlow.value,
    };
  }

  private deserializeRadius(data: Record<string, { value: string }>): RadiusTokens {
    return {
      sm: data.sm.value,
      base: data.base.value,
      lg: data.lg.value,
      xl: data.xl.value,
      full: data.full.value,
    };
  }
}

// ========================================
// TOKEN VALIDATOR
// ========================================

export function validateTokens(tokens: DesignTokens): TokenValidationResult {
  const errors: TokenValidationError[] = [];

  // Validate spacing tokens (must be multiples of 4px)
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    if (!isMultipleOf4px(value)) {
      errors.push({
        path: `spacing.${key}`,
        message: `Spacing value must be a multiple of 4px`,
        expectedType: 'multiple of 4px',
        receivedValue: value,
      });
    }
  });

  // Validate color tokens
  const validateColorGroup = (group: Record<string, string>, path: string) => {
    Object.entries(group).forEach(([key, value]) => {
      if (!isValidCSSColor(value)) {
        errors.push({
          path: `${path}.${key}`,
          message: `Invalid CSS color value`,
          expectedType: 'CSS color',
          receivedValue: value,
        });
      }
    });
  };

  validateColorGroup(tokens.colors.surface, 'colors.surface');
  validateColorGroup(tokens.colors.text, 'colors.text');
  validateColorGroup(tokens.colors.action, 'colors.action');
  validateColorGroup(tokens.colors.status, 'colors.status');
  // Border colors can be rgba which is valid
  validateColorGroup(tokens.colors.border, 'colors.border');

  // Validate typography sizes
  Object.entries(tokens.typography.sizes).forEach(([key, value]) => {
    if (!isAllowedFontSize(value)) {
      errors.push({
        path: `typography.sizes.${key}`,
        message: `Font size must be one of: 12px, 14px, 16px, 20px, 24px, 28px`,
        expectedType: 'allowed font size',
        receivedValue: value,
      });
    }
  });

  // Validate typography weights
  Object.entries(tokens.typography.weights).forEach(([key, value]) => {
    if (!isAllowedFontWeight(value)) {
      errors.push({
        path: `typography.weights.${key}`,
        message: `Font weight must be one of: 400, 500, 600`,
        expectedType: 'allowed font weight',
        receivedValue: value,
      });
    }
  });

  // Validate shadow tokens
  Object.entries(tokens.shadows).forEach(([key, value]) => {
    if (!isValidCSSBoxShadow(value)) {
      errors.push({
        path: `shadows.${key}`,
        message: `Invalid CSS box-shadow value`,
        expectedType: 'CSS box-shadow',
        receivedValue: value,
      });
    }
  });

  // Validate radius tokens
  Object.entries(tokens.radius).forEach(([key, value]) => {
    if (!isValidCSSLength(value)) {
      errors.push({
        path: `radius.${key}`,
        message: `Invalid CSS length value`,
        expectedType: 'CSS length',
        receivedValue: value,
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ========================================
// EXPORTS
// ========================================

export const tokenSerializer = new DesignTokenSerializer();

export { DesignTokenSerializer };
