/**
 * Huntaze Design System - Type Definitions
 * 
 * Centralized type definitions for design tokens ensuring
 * consistency across the entire application.
 * 
 * Based on 4px grid system and Shopify Polaris-inspired design.
 */

// ========================================
// SPACING TOKENS
// ========================================

/**
 * Spacing scale based on 4px grid
 * All values must be multiples of 4px
 */
export interface SpacingTokens {
  '0': string;   // 0px
  '1': string;   // 4px
  '2': string;   // 8px
  '3': string;   // 12px
  '4': string;   // 16px
  '5': string;   // 20px
  '6': string;   // 24px
  '7': string;   // 28px
  '8': string;   // 32px
  '10': string;  // 40px
  '12': string;  // 48px
  '16': string;  // 64px
  '20': string;  // 80px
  '24': string;  // 96px
  '32': string;  // 128px
}

// ========================================
// COLOR TOKENS
// ========================================

export interface SurfaceColors {
  base: string;      // Primary background (zinc-950)
  card: string;      // Card background (zinc-800)
  subdued: string;   // Subdued surface (zinc-900)
  elevated: string;  // Elevated surface (zinc-800)
}

export interface TextColors {
  primary: string;   // Primary text (zinc-50)
  secondary: string; // Secondary text (zinc-400)
  subdued: string;   // Subdued text (zinc-500)
  inverse: string;   // Inverse text for light backgrounds
}

export interface ActionColors {
  primary: string;        // Primary action (violet-500)
  primaryHover: string;   // Primary hover (violet-600)
  primaryActive: string;  // Primary active (violet-700)
  secondary: string;      // Secondary action
}

export interface StatusColors {
  success: string;   // Success state (emerald-500)
  warning: string;   // Warning state (amber-500)
  critical: string;  // Critical/error state (red-500)
  info: string;      // Info state (blue-500)
}

export interface BorderColors {
  default: string;   // Default border
  subtle: string;    // Subtle border
  emphasis: string;  // Emphasized border
  strong: string;    // Strong border
}

export interface ColorTokens {
  surface: SurfaceColors;
  text: TextColors;
  action: ActionColors;
  status: StatusColors;
  border: BorderColors;
}

// ========================================
// TYPOGRAPHY TOKENS
// ========================================

export interface TypographySizes {
  xs: string;    // 12px
  sm: string;    // 14px
  base: string;  // 16px
  lg: string;    // 20px
  xl: string;    // 24px
  '2xl': string; // 28px
}

export interface TypographyWeights {
  regular: number;   // 400
  medium: number;    // 500
  semibold: number;  // 600
}

export interface TypographyTokens {
  fontFamily: string;
  sizes: TypographySizes;
  weights: TypographyWeights;
}

// ========================================
// SHADOW TOKENS
// ========================================

export interface ShadowTokens {
  card: string;      // Card shadow
  elevated: string;  // Elevated shadow
  focus: string;     // Focus ring shadow
  innerGlow: string; // Inner glow for glass effects
}

// ========================================
// RADIUS TOKENS
// ========================================

export interface RadiusTokens {
  sm: string;    // 4px
  base: string;  // 8px
  lg: string;    // 12px
  xl: string;    // 16px
  full: string;  // 9999px (pill shape)
}

// ========================================
// MAIN DESIGN TOKENS INTERFACE
// ========================================

export interface DesignTokens {
  spacing: SpacingTokens;
  colors: ColorTokens;
  typography: TypographyTokens;
  shadows: ShadowTokens;
  radius: RadiusTokens;
}

// ========================================
// TOKEN SERIALIZATION
// ========================================

export interface TokenSerializer {
  /**
   * Serialize design tokens to JSON string
   */
  toJSON(tokens: DesignTokens): string;
  
  /**
   * Deserialize JSON string to design tokens
   */
  fromJSON(json: string): DesignTokens;
  
  /**
   * Convert design tokens to CSS custom properties string
   */
  toCSSVariables(tokens: DesignTokens): string;
}

// ========================================
// TOKEN VALIDATION
// ========================================

export interface TokenValidationResult {
  valid: boolean;
  errors: TokenValidationError[];
}

export interface TokenValidationError {
  path: string;
  message: string;
  expectedType: string;
  receivedValue: unknown;
}

// ========================================
// TOKEN SCHEMA (for serialization)
// ========================================

export interface TokenValue {
  value: string;
  description?: string;
  type: 'spacing' | 'color' | 'typography' | 'shadow' | 'radius';
}

export interface TokenCategory {
  [tokenName: string]: TokenValue | TokenCategory;
}

export interface DesignTokenSchema {
  version: string;
  tokens: {
    spacing: TokenCategory;
    colors: TokenCategory;
    typography: TokenCategory;
    shadows: TokenCategory;
    radius: TokenCategory;
  };
}

// ========================================
// COMPONENT STATE MODELS
// ========================================

export interface LoadingState {
  isLoading: boolean;
  skeleton: 'card' | 'table' | 'list' | 'text';
}

export interface EmptyStateConfig {
  isEmpty: boolean;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  illustration?: string;
}

export interface HoverState {
  isHovered: boolean;
  rowId?: string;
}

export interface FocusState {
  isFocused: boolean;
  focusRing: boolean;
}

// ========================================
// DEFAULT TOKEN VALUES
// ========================================

export const DEFAULT_SPACING_TOKENS: SpacingTokens = {
  '0': '0px',
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '7': '28px',
  '8': '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
  '32': '128px',
};

export const DEFAULT_COLOR_TOKENS: ColorTokens = {
  surface: {
    base: '#09090b',      // zinc-950
    card: '#27272a',      // zinc-800
    subdued: '#18181b',   // zinc-900
    elevated: '#27272a',  // zinc-800
  },
  text: {
    primary: '#fafafa',   // zinc-50
    secondary: '#a1a1aa', // zinc-400
    subdued: '#71717a',   // zinc-500
    inverse: '#09090b',   // zinc-950
  },
  action: {
    primary: '#8b5cf6',       // violet-500
    primaryHover: '#7c3aed',  // violet-600
    primaryActive: '#6d28d9', // violet-700
    secondary: '#27272a',     // zinc-800
  },
  status: {
    success: '#10b981',   // emerald-500
    warning: '#f59e0b',   // amber-500
    critical: '#ef4444',  // red-500
    info: '#3b82f6',      // blue-500
  },
  border: {
    default: 'rgba(255, 255, 255, 0.12)',
    subtle: 'rgba(255, 255, 255, 0.12)',
    emphasis: 'rgba(255, 255, 255, 0.18)',
    strong: 'rgba(255, 255, 255, 0.24)',
  },
};

export const DEFAULT_TYPOGRAPHY_TOKENS: TypographyTokens = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  sizes: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '28px',
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
  },
};

export const DEFAULT_SHADOW_TOKENS: ShadowTokens = {
  card: '0px 1px 3px rgba(0, 0, 0, 0.4)',
  elevated: '0px 4px 12px rgba(0, 0, 0, 0.5)',
  focus: '0 0 0 3px rgba(139, 92, 246, 0.3)',
  innerGlow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
};

export const DEFAULT_RADIUS_TOKENS: RadiusTokens = {
  sm: '4px',
  base: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  spacing: DEFAULT_SPACING_TOKENS,
  colors: DEFAULT_COLOR_TOKENS,
  typography: DEFAULT_TYPOGRAPHY_TOKENS,
  shadows: DEFAULT_SHADOW_TOKENS,
  radius: DEFAULT_RADIUS_TOKENS,
};
