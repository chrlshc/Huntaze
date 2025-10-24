/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './apps/**/*.{js,ts,jsx,tsx,mdx}',
    './packages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Shopify-inspired color palette
      colors: {
        // Primary brand colors
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Main brand green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        
        // Neutral grays (Shopify-like)
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        
        // Semantic colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          800: '#166534',
        },
        
        // Content colors for text
        content: {
          primary: '#171717',
          secondary: '#737373',
          tertiary: '#a3a3a3',
        },
        
        // Surface colors for backgrounds
        surface: {
          DEFAULT: '#ffffff',
          'light': '#f9fafb',
          'elevated': '#ffffff',
          'elevated-light': '#fafafa',
          'hover': '#f5f5f5',
          'hover-light': '#f9fafb',
        },
        
        // Border colors
        border: {
          DEFAULT: '#e5e5e5',
          light: '#f0f0f0',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
        info: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
        },
        
        // E-commerce specific colors
        price: {
          regular: '#262626',
          sale: '#dc2626',
          compare: '#737373',
        },
        
        // Status colors for orders
        status: {
          pending: '#f59e0b',
          confirmed: '#3b82f6',
          processing: '#8b5cf6',
          shipped: '#06b6d4',
          delivered: '#22c55e',
          cancelled: '#ef4444',
        }
      },
      
      // Typography scale
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      
      // Spacing scale (consistent with 8px grid)
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Border radius (Shopify-like rounded corners)
      borderRadius: {
        'sm': '0.25rem',
        'DEFAULT': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      
      // Box shadows (subtle, modern)
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)',
        'button': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'input': 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      
      // Animation and transitions
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      
      // Grid system
      gridTemplateColumns: {
        'auto-fit-xs': 'repeat(auto-fit, minmax(200px, 1fr))',
        'auto-fit-sm': 'repeat(auto-fit, minmax(250px, 1fr))',
        'auto-fit-md': 'repeat(auto-fit, minmax(300px, 1fr))',
        'auto-fit-lg': 'repeat(auto-fit, minmax(350px, 1fr))',
        'product-grid': 'repeat(auto-fill, minmax(280px, 1fr))',
        'admin-layout': '240px 1fr',
        'admin-layout-collapsed': '60px 1fr',
      },
      
      // Breakpoints (mobile-first)
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    
    // Custom plugin for component utilities
    function({ addUtilities, addComponents, theme }) {
      // Button variants
      addComponents({
        '.btn': {
          '@apply inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed': {},
        },
        '.btn-primary': {
          '@apply btn bg-primary-600 text-white border-primary-600 hover:bg-primary-700 focus:ring-primary-500': {},
        },
        '.btn-secondary': {
          '@apply btn bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50 focus:ring-primary-500': {},
        },
        '.btn-outline': {
          '@apply btn bg-transparent text-primary-600 border-primary-600 hover:bg-primary-50 focus:ring-primary-500': {},
        },
        '.btn-ghost': {
          '@apply btn bg-transparent text-neutral-700 border-transparent hover:bg-neutral-100 focus:ring-primary-500': {},
        },
        '.btn-danger': {
          '@apply btn bg-error-600 text-white border-error-600 hover:bg-error-700 focus:ring-error-500': {},
        },
        
        // Card components
        '.card': {
          '@apply bg-white rounded-lg shadow-card border border-neutral-200': {},
        },
        '.card-header': {
          '@apply px-6 py-4 border-b border-neutral-200': {},
        },
        '.card-body': {
          '@apply px-6 py-4': {},
        },
        '.card-footer': {
          '@apply px-6 py-4 border-t border-neutral-200 bg-neutral-50': {},
        },
        
        // Form components
        '.form-input': {
          '@apply block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-input placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500': {},
        },
        '.form-label': {
          '@apply block text-sm font-medium text-neutral-700 mb-1': {},
        },
        '.form-error': {
          '@apply text-sm text-error-600 mt-1': {},
        },
        '.form-help': {
          '@apply text-sm text-neutral-500 mt-1': {},
        },
        
        // Badge components
        '.badge': {
          '@apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium': {},
        },
        '.badge-success': {
          '@apply badge bg-success-100 text-success-800': {},
        },
        '.badge-warning': {
          '@apply badge bg-warning-100 text-warning-800': {},
        },
        '.badge-error': {
          '@apply badge bg-error-100 text-error-800': {},
        },
        '.badge-info': {
          '@apply badge bg-info-100 text-info-800': {},
        },
        '.badge-neutral': {
          '@apply badge bg-neutral-100 text-neutral-800': {},
        },
        
        // Status badges for orders
        '.status-pending': {
          '@apply badge bg-yellow-100 text-yellow-800': {},
        },
        '.status-confirmed': {
          '@apply badge bg-blue-100 text-blue-800': {},
        },
        '.status-processing': {
          '@apply badge bg-purple-100 text-purple-800': {},
        },
        '.status-shipped': {
          '@apply badge bg-cyan-100 text-cyan-800': {},
        },
        '.status-delivered': {
          '@apply badge bg-green-100 text-green-800': {},
        },
        '.status-cancelled': {
          '@apply badge bg-red-100 text-red-800': {},
        },
      });
      
      // Utility classes
      addUtilities({
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.safe-top': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.safe-bottom': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
      });
    },
  ],
  
  // Dark mode support (class-based)
  darkMode: 'class',
};