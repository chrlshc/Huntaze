import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Configuration Vitest spécialisée pour les tests des services simplifiés Huntaze
 * Optimisée pour les tests unitaires et d'intégration des services user/billing
 */

export default defineConfig({
  test: {
    // Environnement de test
    environment: 'node',
    
    // Fichiers de test à inclure
    include: [
      'tests/unit/simple-user-service*.test.ts',
      'tests/unit/simple-billing-service*.test.ts',
      'tests/integration/user-billing-integration*.test.ts',
      'tests/unit/simple-services-validation.test.ts'
    ],
    
    // Fichiers à exclure
    exclude: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'coverage/**'
    ],
    
    // Configuration des globals
    globals: true,
    
    // Setup files
    setupFiles: [
      './tests/setup/simple-services-setup.ts'
    ],
    
    // Timeout pour les tests (30 secondes)
    testTimeout: 30000,
    
    // Timeout pour les hooks (10 secondes)
    hookTimeout: 10000,
    
    // Parallélisation des tests
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },
    
    // Configuration de la couverture de code
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/simple-services',
      
      // Fichiers à inclure dans la couverture
      include: [
        'lib/services/simple-user-service.ts',
        'lib/services/simple-billing-service.ts',
        'lib/utils/validation.ts'
      ],
      
      // Fichiers à exclure de la couverture
      exclude: [
        'node_modules/**',
        'tests/**',
        'dist/**',
        '.next/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ],
      
      // Seuils de couverture
      thresholds: {
        global: {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85
        },
        // Seuils spécifiques par fichier
        'lib/services/simple-user-service.ts': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'lib/services/simple-billing-service.ts': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90
        }
      },
      
      // Ignorer les lignes avec ces commentaires
      skipFull: false,
      
      // Générer un rapport même si les seuils ne sont pas atteints
      reportOnFailure: true
    },
    
    // Configuration des reporters
    reporters: [
      'default',
      'verbose',
      ['junit', { 
        outputFile: './reports/simple-services-junit.xml',
        classname: 'SimpleServices'
      }],
      ['json', { 
        outputFile: './reports/simple-services-results.json' 
      }]
    ],
    
    // Variables d'environnement pour les tests
    env: {
      NODE_ENV: 'test',
      VITEST_SIMPLE_SERVICES: 'true',
      // Mock Stripe keys pour les tests
      STRIPE_SECRET_KEY: 'sk_test_mock_key_for_simple_services',
      STRIPE_PRO_MONTHLY_PRICE_ID: 'price_pro_monthly_mock',
      STRIPE_PRO_YEARLY_PRICE_ID: 'price_pro_yearly_mock',
      STRIPE_ENTERPRISE_MONTHLY_PRICE_ID: 'price_enterprise_monthly_mock',
      STRIPE_ENTERPRISE_YEARLY_PRICE_ID: 'price_enterprise_yearly_mock',
      // Base URL pour les tests
      NEXT_PUBLIC_URL: 'https://test.huntaze.com'
    },
    
    // Configuration des mocks
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    
    // Retry des tests flaky
    retry: 2,
    
    // Bail sur le premier échec (pour CI/CD rapide)
    bail: process.env.CI ? 1 : 0,
    
    // Logging
    logHeapUsage: true,
    
    // Watch mode (développement local)
    watch: false,
    
    // Configuration des snapshots
    resolveSnapshotPath: (testPath, snapExtension) => {
      return path.join(
        path.dirname(testPath),
        '__snapshots__',
        path.basename(testPath) + snapExtension
      );
    }
  },
  
  // Résolution des modules
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/tests': path.resolve(__dirname, 'tests')
    }
  },
  
  // Configuration esbuild pour TypeScript
  esbuild: {
    target: 'node18'
  },
  
  // Définir les constantes pour les tests
  define: {
    __TEST__: true,
    __SIMPLE_SERVICES_TEST__: true
  }
});