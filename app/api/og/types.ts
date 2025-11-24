/**
 * TypeScript Types for OG Image API
 * 
 * Feature: mobile-ux-marketing-refactor
 * Requirements: 5.1, 5.4, 5.5
 */

/**
 * Query parameters for OG image generation
 */
export interface OGImageParams {
  /**
   * Title to display on the image
   * @default "Huntaze"
   * @maxLength 100
   */
  title?: string;
}

/**
 * Configuration for OG image generation
 */
export interface OGImageConfig {
  /**
   * Image width in pixels
   * @default 1200
   */
  width: number;
  
  /**
   * Image height in pixels
   * @default 630
   */
  height: number;
  
  /**
   * Default title when none provided
   * @default "Huntaze"
   */
  defaultTitle: string;
  
  /**
   * Maximum title length before truncation
   * @default 100
   */
  maxTitleLength: number;
  
  /**
   * Path to fallback image
   * @default "/og-image.png"
   */
  fallbackImage: string;
}

/**
 * Error response structure
 */
export interface OGImageError {
  /**
   * Error type/code
   */
  error: string;
  
  /**
   * Human-readable error message
   */
  message: string;
  
  /**
   * ISO timestamp of error
   */
  timestamp: string;
  
  /**
   * Request URL that caused the error
   */
  url?: string;
  
  /**
   * Duration of failed request in milliseconds
   */
  duration?: number;
}

/**
 * Logging metadata structure
 */
export interface OGImageLogMetadata {
  /**
   * Title being rendered
   */
  title?: string;
  
  /**
   * Raw title from query params
   */
  rawTitle?: string | null;
  
  /**
   * Request URL
   */
  url?: string;
  
  /**
   * Request duration in milliseconds
   */
  duration?: number;
  
  /**
   * Error message if applicable
   */
  error?: string;
  
  /**
   * Error stack trace if applicable
   */
  stack?: string;
}

/**
 * Color palette for OG images
 */
export interface OGImageColors {
  /**
   * Magic Blue accent color
   * @value "#5E6AD2"
   */
  magicBlue: string;
  
  /**
   * Dark background color
   * @value "#0F0F10"
   */
  backgroundDark: string;
  
  /**
   * Card background color
   * @value "#151516"
   */
  cardBackground: string;
  
  /**
   * Text color
   * @value "#EDEDED"
   */
  textColor: string;
  
  /**
   * Border color (with opacity)
   * @value "rgba(255,255,255,0.1)"
   */
  borderColor: string;
}

/**
 * Typography configuration
 */
export interface OGImageTypography {
  /**
   * Font size in pixels
   * @default 60
   */
  fontSize: number;
  
  /**
   * Font weight
   * @default 900
   */
  fontWeight: number;
  
  /**
   * Text color
   * @default "#EDEDED"
   */
  color: string;
}

/**
 * Style configuration for OG image card
 */
export interface OGImageCardStyle {
  /**
   * Padding (CSS format)
   * @default "20px 40px"
   */
  padding: string;
  
  /**
   * Border (CSS format)
   * @default "1px solid rgba(255,255,255,0.1)"
   */
  border: string;
  
  /**
   * Border radius in pixels
   * @default 20
   */
  borderRadius: number;
  
  /**
   * Background color
   * @default "#151516"
   */
  background: string;
  
  /**
   * Box shadow (CSS format)
   * @default "0px 10px 50px rgba(94, 106, 210, 0.3)"
   */
  boxShadow: string;
}

/**
 * Complete OG image style configuration
 */
export interface OGImageStyle {
  colors: OGImageColors;
  typography: OGImageTypography;
  card: OGImageCardStyle;
}

/**
 * Type guard to check if value is OGImageError
 */
export function isOGImageError(value: unknown): value is OGImageError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    'message' in value &&
    'timestamp' in value
  );
}

/**
 * Type guard to check if value is valid OGImageParams
 */
export function isValidOGImageParams(value: unknown): value is OGImageParams {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const params = value as Record<string, unknown>;
  
  // title is optional, but if present must be a string
  if ('title' in params && typeof params.title !== 'string') {
    return false;
  }
  
  return true;
}

/**
 * Default configuration values
 */
export const DEFAULT_OG_IMAGE_CONFIG: OGImageConfig = {
  width: 1200,
  height: 630,
  defaultTitle: 'Huntaze',
  maxTitleLength: 100,
  fallbackImage: '/og-image.png',
} as const;

/**
 * Default color palette
 */
export const DEFAULT_OG_IMAGE_COLORS: OGImageColors = {
  magicBlue: '#5E6AD2',
  backgroundDark: '#0F0F10',
  cardBackground: '#151516',
  textColor: '#EDEDED',
  borderColor: 'rgba(255,255,255,0.1)',
} as const;

/**
 * Default typography configuration
 */
export const DEFAULT_OG_IMAGE_TYPOGRAPHY: OGImageTypography = {
  fontSize: 60,
  fontWeight: 900,
  color: '#EDEDED',
} as const;

/**
 * Default card style configuration
 */
export const DEFAULT_OG_IMAGE_CARD_STYLE: OGImageCardStyle = {
  padding: '20px 40px',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 20,
  background: '#151516',
  boxShadow: '0px 10px 50px rgba(94, 106, 210, 0.3)',
} as const;
