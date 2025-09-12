import { type Config } from 'tailwindcss';

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
      colors: {
        // Huntaze Design System Colors
        surface: {
          DEFAULT: 'var(--color-surface)',
          light: 'var(--color-surface-light)',
          elevated: 'var(--color-surface-elevated)',
          'elevated-light': 'var(--color-surface-elevated-light)',
          hover: 'var(--color-surface-hover)',
          'hover-light': 'var(--color-surface-hover-light)',
        },
        content: {
          primary: 'var(--color-content-primary)',
          secondary: 'var(--color-content-secondary)',
          tertiary: 'var(--color-content-tertiary)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          light: 'var(--color-border-light)',
        },
        primary: {
          DEFAULT: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          hover: 'rgb(var(--color-teal-600-rgb) / <alpha-value>)',
          foreground: 'var(--color-btn-primary-text)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary-rgb) / <alpha-value>)',
          foreground: 'var(--text-primary)',
        },
        danger: 'var(--color-danger)',
        input: {
          bg: {
            DEFAULT: 'var(--color-input-bg)',
            light: 'var(--color-input-bg-light)',
          },
          border: {
            DEFAULT: 'var(--color-input-border)',
            light: 'var(--color-input-border-light)',
          },
        },
        neutral: {
          200: 'var(--color-neutral-200)',
          300: 'var(--color-neutral-300)',
          700: 'var(--color-neutral-700)',
          800: 'var(--color-neutral-800)',
        },
        // Professional Dark Mode Color System (Legacy)
        background: {
          primary: 'var(--background-primary)',
          secondary: 'var(--background-secondary)',
          elevated: 'var(--background-elevated)',
          overlay: 'var(--background-overlay)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          disabled: 'var(--text-disabled)',
        },
        accent: {
          primary: 'var(--accent-primary)',
          hover: 'var(--accent-hover)',
          active: 'var(--accent-active)',
          muted: 'var(--accent-muted)',
        },
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'soft': 'var(--shadow-soft)',
      },
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
