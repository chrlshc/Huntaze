import { type Config } from 'tailwindcss';
import {
  accentPalette,
  borderColors,
  brandPalette,
  elevations,
  neutralPalette,
  radii,
  spacingScale,
  surfaceColors,
  textColors,
} from './config/design-tokens.mjs';

/**
 * Tailwind CSS configuration for the OFM Social OS site.
 *
 * The content array tells Tailwind where to find class names so that unused
 * styles can be purged from the final build. We include the `app` and
 * `components` directories because the Next.js App Router places pages and
 * reusable components there. You can add additional paths if you create
 * more directories containing Tailwind classes.
 */
export default {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  safelist: [
    // Needed for dynamic niche color classes like bg-${color}-500
    { pattern: /^(bg|text|border)-(purple|pink|blue|green|emerald|indigo|red|gray|rose|amber|violet|cyan|orange)-(50|100|200|500|600)$/ },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: brandPalette,
        neutral: neutralPalette,
        accent: accentPalette,
        surface: {
          DEFAULT: surfaceColors.base,
          muted: surfaceColors.muted,
          raised: surfaceColors.raised,
          overlay: surfaceColors.overlay,
          inverted: surfaceColors.inverted,
          'inverted-raised': surfaceColors.invertedRaised,
        },
        content: {
          primary: textColors.primary,
          secondary: textColors.secondary,
          subtle: textColors.subtle,
          inverted: textColors.inverted,
          'inverted-subtle': textColors.invertedSubtle,
          'on-brand': textColors.onBrand,
        },
        border: {
          DEFAULT: borderColors.default,
          subtle: borderColors.subtle,
          strong: borderColors.strong,
          inverted: borderColors.inverted,
        },
        primary: {
          DEFAULT: brandPalette[600],
          hover: brandPalette[700],
          active: brandPalette[800],
          foreground: textColors.onBrand,
        },
        secondary: {
          DEFAULT: surfaceColors.raised,
          hover: neutralPalette[100],
          border: borderColors.default,
          foreground: textColors.secondary,
        },
        danger: accentPalette.danger,
        success: accentPalette.success,
        warning: accentPalette.warning,
        info: accentPalette.info,
        input: {
          bg: {
            DEFAULT: surfaceColors.raised,
            muted: neutralPalette[50],
          },
          border: {
            DEFAULT: borderColors.default,
            focus: brandPalette[400],
          },
          text: {
            DEFAULT: textColors.primary,
            subtle: textColors.subtle,
            inverted: textColors.inverted,
          },
        },
        background: {
          primary: surfaceColors.base,
          secondary: surfaceColors.muted,
          elevated: surfaceColors.raised,
          overlay: surfaceColors.overlay,
        },
        text: {
          primary: textColors.primary,
          secondary: textColors.secondary,
          tertiary: textColors.subtle,
          disabled: 'rgba(15, 23, 42, 0.38)',
        },
        accent: {
          primary: brandPalette[500],
          hover: brandPalette[600],
          active: brandPalette[700],
          muted: neutralPalette[200],
        },
      },
      backgroundImage: {
        'gradient-primary': `linear-gradient(135deg, ${brandPalette[500]} 0%, ${brandPalette[700]} 100%)`,
      },
      boxShadow: {
        sm: elevations.sm,
        md: elevations.md,
        lg: elevations.lg,
        xl: '0 32px 60px rgba(15, 23, 42, 0.18)',
        soft: '0 12px 30px rgba(15, 23, 42, 0.12)',
      },
      borderRadius: {
        sm: radii.sm,
        DEFAULT: radii.md,
        md: radii.md,
        lg: radii.lg,
        xl: radii.xl,
        full: radii.pill,
      },
      spacing: spacingScale,
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-up': 'fadeUp 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.8), 0 0 40px rgba(139, 92, 246, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
