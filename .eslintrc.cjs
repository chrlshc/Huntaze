/* Guardrails: enforce structured logs in server code and prevent direct base-logger imports */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', '@next/eslint-plugin-next'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'next/core-web-vitals'],
  rules: {
    // Allow console generally; we tighten in server overrides below
    'no-console': 'off',
    'no-restricted-imports': ['error', {
      paths: [
        { name: '@/lib/base-logger', message: 'Use makeReqLogger() from src/lib/logger.ts instead.' },
        { name: '@/src/lib/base-logger', message: 'Use makeReqLogger() from src/lib/logger.ts instead.' },
        { name: 'src/lib/base-logger', message: 'Use makeReqLogger() from src/lib/logger.ts instead.' },
      ],
    }],
  },
  overrides: [
    // Server-only code: disallow console completely; require wrapper logger
    {
      files: [
        'app/api/**/*.ts',
        'src/services/**/*.ts',
        'src/server/**/*.ts',
        'src/db/**/*.ts',
        'src/queue/**/*.ts',
        'src/lib/workers/**/*.ts',
        'workers/**/*.ts',
      ],
      rules: {
        'no-console': ['error', { allow: [] }],
      },
    },
    // Allow importing base-logger only inside the wrapper file
    {
      files: ['src/lib/logger.ts'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ],
};
