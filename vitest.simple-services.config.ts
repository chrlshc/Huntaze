import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

/**
 * Configuration Vitest spécifique pour les tests des services simplifiés
 */
export default defineConfig({
  test: {
    // Environnement de test
    environment: 'node',
    
    // Fichiers de test à inclure
    include: [
      'tests/unit/simple-*.test.ts',
      'tests/integration/user-billing-integration.test.ts',
      'tests/unit/simple-services-validation.test.ts'
    ],
    
    // Fichiers à exclure
    exclude: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'coverage/**'
    ],
    
    // Configuration de la couverture de code
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/simple-services',
      include: [
        'lib/services/simple-*.ts',
        'tests/unit/simple-*.test.ts',
        'tests/integration/user-billing-integration.test.ts'
      ],
      exclude: [
        'node_modules/**',
        'tests/**/*.test.ts',
        'dist/**',
        '.next/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Configuration des timeouts
    testTimeout: 10000, // 10 secondes
    hookTimeout: 10000, // 10 secondes
    
    // Configuration des reporters
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/simple-services-results.json',
      html: './test-results/simple-services-report.html'
    },
    
    // Configuration des mocks
    globals: true,
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    
    // Configuration de l'isolation des tests
    isolate: true,
    
    // Configuration du parallélisme
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },
    
    // Configuration des variables d'environnement pour les tests
    env: {
      NODE_ENV: 'test',
      NEXT_PUBLIC_URL: 'https://test.huntaze.com',
      STRIPE_SECRET_KEY: 'sk_test_mock_key',
      STRIPE_PRO_MONTHLY_PRICE_ID: 'price_pro_monthly',
      STRIPE_PRO_YEARLY_PRICE_ID: 'price_pro_yearly',
      STRIPE_ENTERPRISE_MONTHLY_PRICE_ID: 'price_enterprise_monthly',
      STRIPE_ENTERPRISE_YEARLY_PRICE_ID: 'price_enterprise_yearly'
    },
    
    // Configuration des fichiers de setup
    setupFiles: [
      './tests/setup/simple-services-setup.ts'
    ],
    
    // Configuration du retry pour les tests flaky
    retry: 2,
    
    // Configuration des snapshots
    resolveSnapshotPath: (testPath, snapExtension) => {
      return testPath.replace('/tests/', '/tests/__snapshots__/') + snapExtension;
    }
  },
  
  // Configuration des alias de chemins
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@/lib': resolve(__dirname, 'lib'),
      '@/tests': resolve(__dirname, 'tests'),
      '@/components': resolve(__dirname, 'components'),
      '@/app': resolve(__dirname, 'app')
    }
  },
  
  // Configuration des plugins
  plugins: [],
  
  // Configuration pour TypeScript
  esbuild: {
    target: 'node18'
  }
});