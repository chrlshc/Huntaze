/**
 * Email Template Styles
 * 
 * Standardized styles for email templates.
 * Email clients don't support CSS variables, so we use constants.
 * 
 * These values mirror our design tokens but are safe for email clients.
 */

// Font stacks optimized for email client compatibility
export const EMAIL_FONTS = {
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "'Courier New', Courier, monospace",
} as const;

// Font sizes that match our design tokens
export const EMAIL_FONT_SIZES = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '28px',
  '4xl': '32px',
  '5xl': '48px',
} as const;

// Colors that match our design tokens
export const EMAIL_COLORS = {
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-tertiary)',
    tertiary: 'var(--text-tertiary)',
    muted: 'var(--text-secondary)',
  },
  background: {
    white: '#ffffff',
    gray: 'var(--bg-glass)',
  },
  accent: {
    primary: 'var(--accent-info)',
    success: 'var(--accent-success)',
    warning: 'var(--accent-warning)',
    error: 'var(--accent-error)',
  },
} as const;

// Helper function to generate inline styles for email
export function emailStyle(styles: Record<string, string>): string {
  return Object.entries(styles)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value}`;
    })
    .join('; ');
}

// Common email component styles
export const EMAIL_COMPONENTS = {
  container: emailStyle({
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: EMAIL_FONTS.sans,
    backgroundColor: EMAIL_COLORS.background.white,
  }),
  
  heading: emailStyle({
    margin: '0 0 20px',
    color: EMAIL_COLORS.text.primary,
    fontWeight: '600',
  }),
  
  paragraph: emailStyle({
    margin: '0 0 16px',
    color: EMAIL_COLORS.text.secondary,
    fontSize: EMAIL_FONT_SIZES.base,
    lineHeight: '1.6',
  }),
  
  button: emailStyle({
    display: 'inline-block',
    padding: '16px 32px',
    backgroundColor: EMAIL_COLORS.accent.primary,
    color: EMAIL_COLORS.background.white,
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: EMAIL_FONT_SIZES.base,
  }),
  
  footer: emailStyle({
    marginTop: '30px',
    color: EMAIL_COLORS.text.tertiary,
    fontSize: EMAIL_FONT_SIZES.xs,
    textAlign: 'center',
  }),
} as const;

/**
 * Example usage:
 * 
 * ```typescript
 * const html = `
 *   <div style="${EMAIL_COMPONENTS.container}">
 *     <h1 style="${EMAIL_COMPONENTS.heading}; font-size: ${EMAIL_FONT_SIZES['2xl']}">
 *       Welcome!
 *     </h1>
 *     <p style="${EMAIL_COMPONENTS.paragraph}">
 *       Your content here
 *     </p>
 *   </div>
 * `;
 * ```
 */
