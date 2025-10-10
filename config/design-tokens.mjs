/**
 * Huntaze design tokens shared between Tailwind and component styles.
 * These tokens intentionally stay small and opinionated to reduce duplication
 * across the many feature modules in the repository.
 */

export const brandPalette = {
  50: '#f5f2ff',
  100: '#ede7ff',
  200: '#dcd3ff',
  300: '#c3b1ff',
  400: '#a58cff',
  500: '#8665ff',
  600: '#6b46ff',
  700: '#5333cc',
  800: '#3a2296',
  900: '#24135f',
  950: '#150933',
};

export const neutralPalette = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
};

export const accentPalette = {
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

export const surfaceColors = {
  base: '#f8f9fc',
  muted: '#eef1f8',
  raised: '#ffffff',
  overlay: 'rgba(15, 23, 42, 0.08)',
  inverted: '#0f172a',
  invertedRaised: '#111c3b',
};

export const textColors = {
  primary: '#0f172a',
  secondary: '#334155',
  subtle: '#475569',
  inverted: '#e2e8f0',
  invertedSubtle: '#94a3b8',
  onBrand: '#ffffff',
};

export const borderColors = {
  subtle: 'rgba(15, 23, 42, 0.08)',
  default: 'rgba(15, 23, 42, 0.12)',
  strong: 'rgba(15, 23, 42, 0.24)',
  inverted: 'rgba(148, 163, 184, 0.24)',
};

export const elevations = {
  sm: '0 1px 2px rgba(15, 23, 42, 0.06)',
  md: '0 8px 24px rgba(15, 23, 42, 0.12)',
  lg: '0 20px 40px rgba(15, 23, 42, 0.16)',
};

export const radii = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  pill: '9999px',
};

export const spacingScale = {
  '3xs': '0.25rem',
  '2xs': '0.5rem',
  xs: '0.75rem',
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
  xl: '2.5rem',
  '2xl': '3rem',
  '3xl': '4rem',
};

export const transitions = {
  fast: '150ms ease',
  base: '200ms ease',
  slow: '300ms ease',
};

export const focusRing = {
  outline: `2px solid ${brandPalette[400]}`,
  offset: '2px',
};
