import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'node_modules',
      '.next',
      'dist',
      'build',
      'coverage',
      'tests/**',
      'scripts/**',
      'infrastructure/stripe-eventbridge/cdk.out',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['app/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}', 'pages/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        XMLHttpRequest: 'readonly',
        EventSource: 'readonly',
        MessageEvent: 'readonly',
        Event: 'readonly',
        AbortController: 'readonly',
        ReadableStream: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        IntersectionObserver: 'readonly',
        
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        crypto: 'readonly',
        
        // TypeScript/React globals
        React: 'readonly',
        JSX: 'readonly',
        NodeJS: 'readonly',
        
        // HTML element types
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLVideoElement: 'readonly',
        HTMLHeadingElement: 'readonly',
        HTMLParagraphElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLIFrameElement: 'readonly',
        HTMLAnchorElement: 'readonly',
        
        // Event types
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        CustomEvent: 'readonly',
        EventListener: 'readonly',
        ErrorEvent: 'readonly',
        PromiseRejectionEvent: 'readonly',
        
        // Browser APIs
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        requestIdleCallback: 'readonly',
        cancelIdleCallback: 'readonly',
        performance: 'readonly',
        PerformanceObserver: 'readonly',
        MutationObserver: 'readonly',
        Worker: 'readonly',
        alert: 'readonly',
        ReadableStreamDefaultController: 'readonly',
        
        // Other common types
        RequestInit: 'readonly',
        HeadersInit: 'readonly',
        RequestInfo: 'readonly',
        ButtonHTMLAttributes: 'readonly',
        HTMLAttributes: 'readonly',
      },
    },
    rules: {
      // Critical errors only - relaxed for upgrade
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-console': 'off', // Temporarily disabled
      'no-empty': 'warn',
      'no-useless-escape': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'no-misleading-character-class': 'warn',
      'react-hooks/exhaustive-deps': 'off', // Temporarily disabled
      
      // Disabled rules for upgrade phase
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      'no-useless-catch': 'off',
      'no-case-declarations': 'off',
      'no-prototype-builtins': 'off',
    },
  },
];
