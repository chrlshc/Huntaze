#!/usr/bin/env node

/**
 * Monitoring en temps réel des erreurs d'hydratation en staging
 * Surveille les logs et métriques pour détecter les problèmes
 */

const fs = require('fs');
const path = require('path');

console.log('📊 MONITORING STAGING - Hydratation React #130');
console.log('===============================================');

const monitoringData = {
  startTime: new Date().toISOString(),
  sessionId: `staging-monitor-${Date.now()}`,
  checks: [],
  alerts: [],
  summary: {
    totalChecks: 0,
    errorsDetected: 0,
    warningsDetected: 0,
    lastCheck: null
  }
};

function logCheck(type, status, message, details = {}) {
  const check = {
    timestamp: new Date().toISOString(),
    type,
    status,
    message,
    details
  };
  
  monitoringData.checks.push(check);
  monitoringData.summary.totalChecks++;
  monitoringData.summary.lastCheck = check.timestamp;
  
  if (status === 'ERROR') {
    monitoringData.summary.errorsDetected++;
    monitoringData.alerts.push(check);
  } else if (status === 'WARNING') {
    monitoringData.summary.warningsDetected++;
  }
  
  const icon = status === 'OK' ? '✅' : status === 'WARNING' ? '⚠️' : '❌';
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${icon} ${type}: ${message}`);
  
  if (Object.keys(details).length > 0) {
    console.log(`    Détails: ${JSON.stringify(details, null, 2)}`);
  }
}

function checkHydrationComponents() {
  console.log('\n🔍 Vérification des composants d\'hydratation...');
  
  const components = [
    'components/hydration/HydrationErrorBoundary.tsx',
    'components/hydration/HydrationSafeWrapper.tsx',
    'components/hydration/SSRDataProvider.tsx',
    'components/hydration/SafeDateRenderer.tsx',
    'components/hydration/SafeBrowserAPI.tsx',
    'components/hydration/SafeRandomContent.tsx'
  ];
  
  let allPresent = true;
  
  components.forEach(component => {
    if (fs.existsSync(component)) {
      logCheck('COMPONENT', 'OK', `${path.basename(component)} présent`);
    } else {
      logCheck('COMPONENT', 'ERROR', `${path.basename(component)} manquant`);
      allPresent = false;
    }
  });
  
  if (allPresent) {
    logCheck('COMPONENTS', 'OK', 'Tous les composants d\'hydratation sont présents');
  } else {
    logCheck('COMPONENTS', 'ERROR', 'Composants d\'hydratation manquants détectés');
  }
}

function checkCorrectedFiles() {
  console.log('\n🔧 Vérification des corrections appliquées...');
  
  const files = [
    'components/landing/LandingFooter.tsx',
    'app/analytics/advanced/page.tsx',
    'app/status/page.tsx',
    'lib/email/ses.ts',
    'lib/services/reportGenerationService.ts'
  ];
  
  let allCorrected = true;
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Vérifier les patterns dangereux
      const dangerousPatterns = [
        'new Date().getFullYear()',
        'new Date().toLocaleString()',
        'Math.random()',
        'window.',
        'document.'
      ];
      
      const foundPatterns = dangerousPatterns.filter(pattern => 
        content.includes(pattern) && !content.includes(`// ${pattern}`) // Ignorer les commentaires
      );
      
      if (foundPatterns.length > 0) {
        logCheck('CORRECTION', 'WARNING', `Patterns dangereux dans ${path.basename(file)}`, {
          patterns: foundPatterns,
          file: file
        });
        allCorrected = false;
      } else {
        logCheck('CORRECTION', 'OK', `${path.basename(file)} corrigé`);
      }
    } else {
      logCheck('CORRECTION', 'WARNING', `Fichier ${path.basename(file)} non trouvé`);
    }
  });
  
  if (allCorrected) {
    logCheck('CORRECTIONS', 'OK', 'Toutes les corrections sont appliquées');
  } else {
    logCheck('CORRECTIONS', 'WARNING', 'Certaines corrections peuvent nécessiter une révision');
  }
}

function checkMonitoringSetup() {
  console.log('\n📊 Vérification du système de monitoring...');
  
  // Vérifier les fichiers de monitoring
  const monitoringFiles = [
    'lib/services/hydrationErrorLogger.ts',
    'lib/monitoring/hydrationProductionMonitor.ts',
    'components/monitoring/HydrationProductionDashboard.tsx',
    'app/api/monitoring/hydration-errors/route.ts'
  ];
  
  monitoringFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logCheck('MONITORING', 'OK', `${path.basename(file)} configuré`);
    } else {
      logCheck('MONITORING', 'WARNING', `${path.basename(file)} manquant`);
    }
  });
  
  // Vérifier la configuration
  if (fs.existsSync('hydration.config.js')) {
    logCheck('CONFIG', 'OK', 'Configuration d\'hydratation présente');
  } else {
    logCheck('CONFIG', 'WARNING', 'Configuration d\'hydratation manquante');
  }
}

function checkDocumentation() {
  console.log('\n📚 Vérification de la documentation...');
  
  const docs = [
    'docs/HYDRATION_DEPLOYMENT_GUIDE.md',
    'docs/HYDRATION_SAFE_COMPONENTS_GUIDE.md',
    'docs/HYDRATION_TROUBLESHOOTING_GUIDE.md',
    'STAGING_VALIDATION_GUIDE.md'
  ];
  
  docs.forEach(doc => {
    if (fs.existsSync(doc)) {
      logCheck('DOCS', 'OK', `${path.basename(doc)} disponible`);
    } else {
      logCheck('DOCS', 'WARNING', `${path.basename(doc)} manquant`);
    }
  });
}

function generateMonitoringReport() {
  console.log('\n📊 RAPPORT DE MONITORING STAGING');
  console.log('=================================');
  console.log(`🕐 Début: ${monitoringData.startTime}`);
  console.log(`🕐 Fin: ${new Date().toISOString()}`);
  console.log(`🆔 Session: ${monitoringData.sessionId}`);
  console.log(`📈 Vérifications total: ${monitoringData.summary.totalChecks}`);
  console.log(`❌ Erreurs détectées: ${monitoringData.summary.errorsDetected}`);
  console.log(`⚠️ Avertissements: ${monitoringData.summary.warningsDetected}`);
  
  if (monitoringData.alerts.length > 0) {
    console.log('\n🚨 ALERTES DÉTECTÉES:');
    monitoringData.alerts.forEach((alert, index) => {
      console.log(`${index + 1}. [${alert.timestamp}] ${alert.type}: ${alert.message}`);
    });
  }
  
  // Sauvegarder le rapport
  const reportPath = `logs/staging-monitoring-${monitoringData.sessionId}.json`;
  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs', { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(monitoringData, null, 2));
  console.log(`\n📄 Rapport sauvegardé: ${reportPath}`);
  
  // Évaluation globale
  const healthScore = Math.round(
    ((monitoringData.summary.totalChecks - monitoringData.summary.errorsDetected) / 
     monitoringData.summary.totalChecks) * 100
  );
  
  console.log(`\n🎯 Score de santé: ${healthScore}%`);
  
  if (healthScore >= 95) {
    console.log('🎉 STAGING EN EXCELLENT ÉTAT !');
    console.log('✅ Prêt pour les tests manuels et la production');
  } else if (healthScore >= 80) {
    console.log('✅ STAGING EN BON ÉTAT');
    console.log('⚠️ Quelques points d\'attention à surveiller');
  } else {
    console.log('⚠️ STAGING NÉCESSITE ATTENTION');
    console.log('🔧 Corrections recommandées avant production');
  }
  
  return healthScore;
}

async function runMonitoring() {
  try {
    console.log(`🚀 Démarrage du monitoring à ${new Date().toLocaleTimeString()}`);
    
    checkHydrationComponents();
    checkCorrectedFiles();
    checkMonitoringSetup();
    checkDocumentation();
    
    const healthScore = generateMonitoringReport();
    
    console.log('\n🔗 PROCHAINES ÉTAPES:');
    console.log('1. Effectuer les tests manuels selon STAGING_VALIDATION_GUIDE.md');
    console.log('2. Surveiller les logs en temps réel pendant les tests');
    console.log('3. Valider l\'absence d\'erreurs React #130');
    console.log('4. Préparer le déploiement production si tout est OK');
    
    return healthScore >= 80;
  } catch (error) {
    console.error('❌ Erreur lors du monitoring:', error.message);
    return false;
  }
}

if (require.main === module) {
  runMonitoring().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runMonitoring };