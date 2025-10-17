/** ESLint: English-only UI hardening */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  env: { browser: true, es2022: true, node: true },
  plugins: ['@typescript-eslint', 'i18next', 'i18n-json'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:i18next/recommended',
  ],
  ignorePatterns: ['node_modules/', '.next/', 'dist/', 'coverage/', 'playwright-report/'],
  overrides: [
    {
      files: ['app/**/*.{ts,tsx,js,jsx}', 'components/**/*.{ts,tsx,js,jsx}'],
      rules: {
        'i18next/no-literal-string': ['warn', { markupOnly: true }],
        'no-restricted-syntax': [
          'error',
          {
            selector: "NewExpression[callee.object.name='Intl'][callee.property.name='NumberFormat'][arguments.length=0]",
            message: 'Always pass an explicit English locale to Intl.NumberFormat.',
          },
          {
            selector: "NewExpression[callee.object.name='Intl'][callee.property.name='DateTimeFormat'][arguments.length=0]",
            message: 'Always pass an explicit English locale to Intl.DateTimeFormat.',
          },
          {
            selector: "CallExpression[callee.property.name=/^toLocale/][arguments.length=0]",
            message: 'Always pass an explicit English locale to toLocaleString / toLocaleDateString / toLocaleTimeString.',
          },
        ],
      },
    },
    {
      files: [
        'app/(dashboard)/marketing/**/*.{ts,tsx}',
        'app/(dashboard)/ops/**/*.{ts,tsx}',
        'app/(dashboard)/settings/**/*.{ts,tsx}',
        'app/(auth)/**/*.{ts,tsx}',
        'app/global-error.tsx',
        'app/not-found.tsx',
        'app/analytics/**/*.{ts,tsx}',
        'components/Sidebar.tsx',
        'components/Topbar.tsx',
      ],
      rules: {
        'i18next/no-literal-string': 'off',
      },
    },
    {
      files: ['lib/copy/**/*.json'],
      rules: {
        'i18n-json/valid-json': 'error',
        'i18n-json/sorted-keys': ['warn', { order: 'asc', indentSpaces: 2 }],
        'i18n-json/valid-message-syntax': ['warn', { syntax: 'icu' }],
      },
    },
    {
      files: ['**/*.test.{ts,tsx,js,jsx}', '**/*.spec.{ts,tsx,js,jsx}', 'tests/**/*.{ts,tsx,js,jsx}'],
      rules: { 'i18next/no-literal-string': 'off' },
    },
  ],
};
