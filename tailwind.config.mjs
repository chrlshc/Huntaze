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
        // Theme System Colors (CSS Variables)
        'theme-bg': 'var(--bg)',
        'theme-surface': 'var(--surface)',
        'theme-text': 'var(--text)',
        'theme-muted': 'var(--muted)',
        'theme-border': 'var(--border)',
        
        // Shadcn/UI Colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Auth System Design Colors
        auth: {
          primary: '#6366f1',        // Indigo 500
          'primary-hover': '#4f46e5', // Indigo 600
          success: '#10b981',         // Green 500
          'success-light': '#d1fae5', // Green 100
          error: '#ef4444',           // Red 500
          'error-light': '#fee2e2',   // Red 100
        },
        // Huntaze Design System Colors
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
        danger: 'var(--color-danger)',
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
        neutral: {
          200: 'var(--color-neutral-200)',
          300: 'var(--color-neutral-300)',
          700: 'var(--color-neutral-700)',
          800: 'var(--color-neutral-800)',
        },

      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
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
