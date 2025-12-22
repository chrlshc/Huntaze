/** @type {import('tailwindcss').Config} */
module.exports = {
  // Limit Tailwind's content scan to application code only
  // This avoids picking up utility class strings from tests/docs
  // that can generate invalid or unused CSS.
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        polaris: {
          'bg-app': 'var(--polaris-bg-app)',
          'bg-surface': 'var(--polaris-bg-surface)',
          'bg-surface-secondary': 'var(--polaris-bg-surface-secondary)',
          'bg-surface-hover': 'var(--polaris-bg-surface-hover)',
          'text': 'var(--polaris-text)',
          'text-subdued': 'var(--polaris-text-subdued)',
          'text-disabled': 'var(--polaris-text-disabled)',
          'border': 'var(--polaris-border)',
          'border-hover': 'var(--polaris-border-hover)',
          'border-subdued': 'var(--polaris-border-subdued)',
          'focus': 'var(--polaris-focus)',
          'action-primary': 'var(--polaris-action-primary)',
          'action-primary-hover': 'var(--polaris-action-primary-hover)',
          'critical': 'var(--polaris-critical)',
          'success': 'var(--polaris-success)',
        },
      },
      fontFamily: {
        polaris: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'San Francisco', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      fontSize: {
        'polaris-75': '12px',
        'polaris-100': '13px',
        'polaris-200': '14px',
        'polaris-300': '16px',
        'polaris-400': '18px',
        'polaris-500': '20px',
      },
      spacing: {
        'polaris-100': '4px',
        'polaris-200': '8px',
        'polaris-300': '12px',
        'polaris-400': '16px',
        'polaris-500': '20px',
        'polaris-600': '24px',
        'polaris-800': '32px',
      },
      borderRadius: {
        'polaris-100': '4px',
        'polaris-150': '6px',
        'polaris-200': '8px',
        'polaris-300': '12px',
      },
      boxShadow: {
        'polaris-100': '0px 1px 0px 0px rgba(26, 26, 26, 0.07)',
        'polaris-200': '0px 3px 1px -1px rgba(26, 26, 26, 0.07)',
        'polaris-300': '0px 4px 6px -2px rgba(26, 26, 26, 0.20)',
        'polaris-400': '0px 8px 16px -4px rgba(26, 26, 26, 0.22)',
        'polaris-focus': '0 0 0 2px rgba(0, 91, 211, 1)',
      },
    },
  },
  plugins: [],
};

