const nextCoreWebVitals = require('eslint-config-next/core-web-vitals');
const nextTypescript = require('eslint-config-next/typescript');

const baseRules = {
  'react/no-unescaped-entities': 'off',
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-unused-vars': 'off',
  '@typescript-eslint/ban-ts-comment': 'off',
  '@typescript-eslint/no-require-imports': 'off',
  '@next/next/no-sync-scripts': 'off',
  '@next/next/no-html-link-for-pages': 'off',
  '@next/next/no-img-element': 'warn',
  'react-hooks/preserve-manual-memoization': 'warn',
  'react-hooks/purity': 'warn',
  'prefer-const': 'warn',
  'no-restricted-imports': [
    'error',
    {
      paths: [
        {
          name: 'prom-client',
          message:
            "Importez dynamiquement dans le handler (await import('prom-client')) ou utilisez @/lib/metrics-registry pour éviter les erreurs de build.",
        },
        {
          name: '@/lib/monitoring',
          message:
            "withMonitoring est deprecated. Utilisez des imports dynamiques ou @/lib/metrics-registry.",
        },
      ],
    },
  ],
};

module.exports = [
  {
    name: 'huntaze/ignores',
    ignores: ['**/*.old.tsx', '.next/**', 'out/**', 'dist/**'],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    name: 'huntaze/base',
    rules: baseRules,
  },
  {
    name: 'huntaze/app-sections-animations',
    files: [
      'app/**/*.{ts,tsx}',
      'components/sections/**/*.{ts,tsx}',
      'components/animations/**/*.{ts,tsx}',
    ],
    rules: {
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'prefer-const': 'warn',
    },
  },
  {
    name: 'huntaze/src-components',
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'prefer-const': 'warn',
    },
  },
  {
    name: 'huntaze/app-api',
    files: ['app/api/**/*.{ts,tsx}'],
    rules: {
      'prefer-const': 'warn',
    },
  },
];
