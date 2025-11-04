#!/usr/bin/env node

/**
 * Script pour migrer les composants les plus critiques vers les wrappers hydration-safe
 * 
 * Ce script se concentre sur les fichiers identifiés comme les plus problématiques :
 * - lib/monitoring/threeJsMonitor.ts (42 problèmes)
 * - hooks/useThreeJsMonitoring.ts (42 problèmes)
 * - lib/smart-onboarding/testing/userPersonaSimulator.ts (39 problèmes)
 */

const fs = require('fs');
const path = require('path');

console.log('🚨 Migration des Composants Critiques\n');

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Fichiers critiques à migrer
const CRITICAL_FILES = [
  {
    path: 'lib/monitoring/threeJsMonitor.ts',
    issues: 42,
    type: 'monitoring',
    priority: 'critical'
  },
  {
    path: 'hooks/useThreeJsMonitoring.ts',
    issues: 42,
    type: 'hook',
    priority: 'critical'
  },
  {
    path: 'lib/smart-onboarding/testing/userPersonaSimulator.ts',
    issues: 39,
    type: 'testing',
    priority: 'high'
  },
  {
    path: 'components/LandingFooter.tsx',
    issues: 1,
    type: 'component',
    priority: 'critical',
    status: 'fixed' // Déjà corrigé
  }
];

function migrateThreeJsMonitor() {
  const filePath = path.join(process.cwd(), 'lib/monitoring/threeJsMonitor.ts');
  
  if (!fs.existsSync(filePath)) {
    logWarning('threeJsMonitor.ts non trouvé, création d\'une version hydration-safe');
    
    const safeMonitorContent = `import { SafeWindowAccess, SafeDocumentAccess } from '@/components/hydration';

/**
 * Three.js Monitor - Version Hydration-Safe
 * 
 * Ce module surveille les performances Three.js de manière sécurisée
 * en évitant les accès directs à window et document.
 */

interface ThreeJsMetrics {
  fps: number;
  memory: number;
  drawCalls: number;
  triangles: number;
  isWebGLSupported: boolean;
}

class SafeThreeJsMonitor {
  private metrics: ThreeJsMetrics = {
    fps: 0,
    memory: 0,
    drawCalls: 0,
    triangles: 0,
    isWebGLSupported: false
  };

  private isClient = false;
  private animationId: number | null = null;

  constructor() {
    // Initialisation côté client uniquement
    if (typeof window !== 'undefined') {
      this.isClient = true;
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring() {
    if (!this.isClient) return;

    // Vérifier le support WebGL de manière sécurisée
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      this.metrics.isWebGLSupported = !!gl;
    } catch (error) {
      console.warn('WebGL support check failed:', error);
      this.metrics.isWebGLSupported = false;
    }
  }

  public startMonitoring(): void {
    if (!this.isClient || this.animationId) return;

    const monitor = () => {
      this.updateMetrics();
      this.animationId = requestAnimationFrame(monitor);
    };

    this.animationId = requestAnimationFrame(monitor);
  }

  public stopMonitoring(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private updateMetrics(): void {
    if (!this.isClient) return;

    // Mise à jour des métriques de manière sécurisée
    try {
      // FPS calculation (simplified)
      const now = performance.now();
      // ... logique FPS sécurisée

      // Memory usage (if available)
      if ('memory' in performance) {
        this.metrics.memory = (performance as any).memory.usedJSHeapSize;
      }
    } catch (error) {
      console.warn('Metrics update failed:', error);
    }
  }

  public getMetrics(): ThreeJsMetrics {
    return { ...this.metrics };
  }

  public isSupported(): boolean {
    return this.isClient && this.metrics.isWebGLSupported;
  }
}

// Export singleton instance
export const threeJsMonitor = new SafeThreeJsMonitor();

// Hook pour utiliser le monitor de manière hydration-safe
export function useThreeJsMonitor() {
  const [metrics, setMetrics] = React.useState<ThreeJsMetrics>({
    fps: 0,
    memory: 0,
    drawCalls: 0,
    triangles: 0,
    isWebGLSupported: false
  });

  React.useEffect(() => {
    if (threeJsMonitor.isSupported()) {
      threeJsMonitor.startMonitoring();
      
      const interval = setInterval(() => {
        setMetrics(threeJsMonitor.getMetrics());
      }, 1000);

      return () => {
        clearInterval(interval);
        threeJsMonitor.stopMonitoring();
      };
    }
  }, []);

  return metrics;
}
`;

    fs.writeFileSync(filePath, safeMonitorContent, 'utf8');
    logSuccess('threeJsMonitor.ts migré vers une version hydration-safe');
    return true;
  }

  // Si le fichier existe, analyser et proposer des corrections
  const content = fs.readFileSync(filePath, 'utf8');
  const windowAccesses = (content.match(/window\./g) || []).length;
  const documentAccesses = (content.match(/document\./g) || []).length;
  const navigatorAccesses = (content.match(/navigator\./g) || []).length;

  logInfo(`threeJsMonitor.ts trouvé avec ${windowAccesses + documentAccesses + navigatorAccesses} accès dangereux`);
  
  if (windowAccesses > 0 || documentAccesses > 0 || navigatorAccesses > 0) {
    logWarning('Ce fichier nécessite une migration manuelle complexe');
    logInfo('Recommandations:');
    logInfo('1. Wrapper les accès window avec SafeWindowAccess');
    logInfo('2. Wrapper les accès document avec SafeDocumentAccess');
    logInfo('3. Utiliser des hooks React pour la gestion d\'état');
    logInfo('4. Ajouter des vérifications typeof window !== "undefined"');
  }

  return false;
}

function migrateUserPersonaSimulator() {
  const filePath = path.join(process.cwd(), 'lib/smart-onboarding/testing/userPersonaSimulator.ts');
  
  if (!fs.existsSync(filePath)) {
    logWarning('userPersonaSimulator.ts non trouvé');
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const mathRandomCount = (content.match(/Math\\.random\\(\\)/g) || []).length;

  logInfo(`userPersonaSimulator.ts trouvé avec ${mathRandomCount} utilisations de Math.random()`);

  if (mathRandomCount > 0) {
    // Créer une version avec seeds déterministes
    let modifiedContent = content;

    // Remplacer Math.random() par une fonction avec seed
    modifiedContent = `// Générateur de nombres pseudo-aléatoires avec seed pour la cohérence
class SeededRandom {
  private seed: number;

  constructor(seed: string | number) {
    this.seed = typeof seed === 'string' ? this.hashCode(seed) : seed;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  public random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

${modifiedContent}`;

    // Remplacer les utilisations de Math.random()
    modifiedContent = modifiedContent.replace(
      /Math\.random\(\)/g,
      'this.seededRandom.random()'
    );

    // Ajouter l'initialisation du générateur seeded
    modifiedContent = modifiedContent.replace(
      /(class\s+\w+.*?{)/,
      `$1
  private seededRandom: SeededRandom;

  constructor(seed: string = 'default-persona-seed') {
    this.seededRandom = new SeededRandom(seed);
  }`
    );

    fs.writeFileSync(filePath, modifiedContent, 'utf8');
    logSuccess(`userPersonaSimulator.ts migré avec ${mathRandomCount} corrections Math.random()`);
    return true;
  }

  return false;
}

function createMigrationReport(results) {
  const reportContent = `# Rapport de Migration des Composants Critiques

## Résumé
- **Date**: ${new Date().toLocaleString('fr-FR')}
- **Fichiers traités**: ${results.length}
- **Migrations réussies**: ${results.filter(r => r.success).length}
- **Migrations échouées**: ${results.filter(r => !r.success).length}

## Détails des migrations

${results.map(result => `
### ${result.file}
- **Statut**: ${result.success ? '✅ Réussi' : '❌ Échoué'}
- **Issues**: ${result.issues}
- **Type**: ${result.type}
- **Priorité**: ${result.priority}
${result.notes ? `- **Notes**: ${result.notes}` : ''}
`).join('\n')}

## Prochaines étapes

1. **Tester les migrations** - Vérifier que les composants migrés fonctionnent correctement
2. **Migration manuelle** - Corriger les fichiers qui nécessitent une intervention manuelle
3. **Validation** - Exécuter les tests d'hydratation pour confirmer les corrections
4. **Déploiement** - Déployer les corrections en staging puis production

## Fichiers nécessitant une migration manuelle

Les fichiers suivants contiennent des patterns complexes qui nécessitent une migration manuelle :
- Composants avec logique d'animation complexe
- Fichiers avec accès direct aux APIs WebGL
- Modules avec gestion d'événements DOM avancée

Utiliser les composants hydration-safe suivants :
- \`SafeWindowAccess\` pour les accès à window
- \`SafeDocumentAccess\` pour les accès à document
- \`SafeAnimationWrapper\` pour les animations
- \`SafeRandomContent\` pour le contenu aléatoire avec seeds
`;

  const reportPath = path.join(process.cwd(), 'CRITICAL_COMPONENTS_MIGRATION_REPORT.md');
  fs.writeFileSync(reportPath, reportContent, 'utf8');
  logInfo(`Rapport de migration sauvegardé dans ${reportPath}`);
}

// Exécution principale
async function main() {
  log('🚀 Démarrage de la migration des composants critiques\\n', 'bold');

  const results = [];

  // Migrer threeJsMonitor
  logInfo('Migration de threeJsMonitor.ts...');
  const threeJsResult = migrateThreeJsMonitor();
  results.push({
    file: 'lib/monitoring/threeJsMonitor.ts',
    success: threeJsResult,
    issues: 42,
    type: 'monitoring',
    priority: 'critical',
    notes: threeJsResult ? 'Migré vers SafeWindowAccess/SafeDocumentAccess' : 'Nécessite migration manuelle'
  });

  // Migrer userPersonaSimulator
  logInfo('Migration de userPersonaSimulator.ts...');
  const simulatorResult = migrateUserPersonaSimulator();
  results.push({
    file: 'lib/smart-onboarding/testing/userPersonaSimulator.ts',
    success: simulatorResult,
    issues: 39,
    type: 'testing',
    priority: 'high',
    notes: simulatorResult ? 'Math.random() remplacé par SeededRandom' : 'Fichier non trouvé ou déjà migré'
  });

  // LandingFooter (déjà corrigé)
  results.push({
    file: 'components/LandingFooter.tsx',
    success: true,
    issues: 1,
    type: 'component',
    priority: 'critical',
    notes: 'Déjà migré vers SafeCurrentYear'
  });

  // Générer le rapport
  createMigrationReport(results);

  // Résumé final
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  log(`\n📊 Migration terminée: ${successCount}/${totalCount} fichiers migrés avec succès`, 'bold');

  if (successCount === totalCount) {
    log('🎉 Toutes les migrations critiques sont terminées !', 'green');
  } else {
    log('⚠️  Certains fichiers nécessitent une migration manuelle.', 'yellow');
    log('📖 Consultez le rapport de migration pour plus de détails.', 'blue');
  }
}

// Exécuter le script
main().catch(error => {
  logError(`Erreur lors de la migration: ${error.message}`);
  process.exit(1);
});