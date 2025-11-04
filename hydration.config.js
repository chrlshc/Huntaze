/**
 * Configuration de validation d'hydratation
 * 
 * Ce fichier configure le comportement du validateur d'hydratation
 * pour le projet Huntaze.
 */

module.exports = {
  // Faire échouer le build en cas d'erreur
  failOnError: true,
  
  // Faire échouer le build en cas d'avertissement (désactivé par défaut)
  failOnWarning: false,
  
  // Générer des rapports de validation
  outputReport: true,
  
  // Patterns à exclure de la validation
  excludePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/tests/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/coverage/**',
    '**/hydration-reports/**'
  ],
  
  // Patterns personnalisés spécifiques au projet
  customPatterns: [
    {
      pattern: /console\.log\(.*new Date\(\)/g,
      type: 'unsafe-pattern',
      severity: 'warning',
      message: 'Console.log avec new Date() peut causer des différences SSR/client',
      suggestion: 'Utilisez un timestamp fixe ou SafeDateRenderer pour le debug'
    },
    {
      pattern: /className=\{.*Math\.random\(\)/g,
      type: 'dynamic-content',
      severity: 'error',
      message: 'Classe CSS générée aléatoirement',
      suggestion: 'Utilisez des classes CSS stables ou SafeRandomContent'
    },
    {
      pattern: /style=\{\{.*Math\.random\(\)/g,
      type: 'dynamic-content',
      severity: 'error',
      message: 'Style inline généré aléatoirement',
      suggestion: 'Utilisez des valeurs stables ou SafeRandomContent'
    }
  ],
  
  // Configuration des seuils
  thresholds: {
    maxErrors: 0,        // Nombre maximum d'erreurs autorisées
    maxWarnings: 10,     // Nombre maximum d'avertissements autorisés
    maxInfo: 50          // Nombre maximum d'informations autorisées
  },
  
  // Fichiers critiques qui doivent être parfaits
  criticalFiles: [
    'app/page.tsx',
    'app/layout.tsx',
    'components/landing/**',
    'components/auth/**'
  ],
  
  // Configuration du monitoring en production
  monitoring: {
    enabled: true,
    endpoint: process.env.HYDRATION_MONITORING_ENDPOINT,
    apiKey: process.env.HYDRATION_MONITORING_API_KEY,
    sampleRate: 0.1, // 10% des erreurs sont envoyées
    maxErrorsPerMinute: 100
  },
  
  // Configuration des alertes
  alerts: {
    email: {
      enabled: process.env.NODE_ENV === 'production',
      recipients: ['dev-team@huntaze.com'],
      threshold: 5 // Alerter si plus de 5 erreurs par minute
    },
    slack: {
      enabled: process.env.NODE_ENV === 'production',
      webhook: process.env.SLACK_WEBHOOK_URL,
      channel: '#dev-alerts'
    }
  }
};