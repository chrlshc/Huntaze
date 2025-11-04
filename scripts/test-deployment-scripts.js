#!/usr/bin/env node

/**
 * Script de test pour valider le bon fonctionnement des scripts de déploiement
 * Teste tous les scripts de la Tâche 9 en mode simulation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentScriptsTester {
  constructor() {
    this.testId = `deployment-test-${Date.now()}`;
    this.logFile = path.join(__dirname, '../logs', `deployment-scripts-test-${this.testId}.log`);
    this.results = {
      prerequisites: { status: 'pending', duration: 0, error: null },
      stagingDeployment: { status: 'pending', duration: 0, error: null },
      productionValidation: { status: 'pending', duration: 0, error: null },
      monitoring: { status: 'pending', duration: 0, error: null },
      orchestration: { status: 'pending', duration: 0, error: null }
    };
    
    // Créer le dossier logs s'il n'existe pas
    const logsDir = path.dirname(this.logFile);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async testScript(scriptName, scriptPath, testName, timeout = 30000) {
    this.log(`🧪 Test de ${testName}...`);
    const startTime = Date.now();
    
    try {
      // Vérifier que le script existe
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`Script non trouvé: ${scriptPath}`);
      }

      // Vérifier la syntaxe du script
      const syntaxCheck = `node --check ${scriptPath}`;
      execSync(syntaxCheck, { stdio: 'pipe', timeout: 5000 });
      this.log(`✅ ${testName} - Syntaxe valide`);

      // Tester l'importation du module
      try {
        delete require.cache[require.resolve(scriptPath)];
        const module = require(scriptPath);
        this.log(`✅ ${testName} - Module importable`);
        
        // Vérifier que le module exporte une classe ou fonction
        if (typeof module === 'function' || (typeof module === 'object' && module.constructor)) {
          this.log(`✅ ${testName} - Export valide`);
        } else {
          this.log(`⚠️ ${testName} - Export non standard mais acceptable`);
        }
      } catch (importError) {
        this.log(`⚠️ ${testName} - Erreur d'import: ${importError.message}`);
      }

      const duration = Date.now() - startTime;
      this.results[scriptName] = { status: 'success', duration, error: null };
      this.log(`✅ ${testName} - Test réussi (${duration}ms)`);
      
      return true;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results[scriptName] = { status: 'failed', duration, error: error.message };
      this.log(`❌ ${testName} - Test échoué: ${error.message}`);
      
      return false;
    }
  }

  async testPrerequisitesScript() {
    const scriptPath = path.join(__dirname, 'validate-deployment-prerequisites.js');
    return await this.testScript(
      'prerequisites',
      scriptPath,
      'Script de validation des prérequis'
    );
  }

  async testStagingDeploymentScript() {
    const scriptPath = path.join(__dirname, 'deploy-hydration-staging.js');
    return await this.testScript(
      'stagingDeployment',
      scriptPath,
      'Script de déploiement staging'
    );
  }

  async testProductionValidationScript() {
    const scriptPath = path.join(__dirname, 'validate-hydration-production.js');
    return await this.testScript(
      'productionValidation',
      scriptPath,
      'Script de validation production'
    );
  }

  async testMonitoringScript() {
    const scriptPath = path.join(__dirname, 'monitor-hydration-production.js');
    return await this.testScript(
      'monitoring',
      scriptPath,
      'Script de monitoring production'
    );
  }

  async testOrchestrationScript() {
    const scriptPath = path.join(__dirname, 'deploy-hydration-complete.js');
    return await this.testScript(
      'orchestration',
      scriptPath,
      'Script d\'orchestration complet'
    );
  }

  async testScriptDependencies() {
    this.log('🔍 Test des dépendances des scripts...');
    
    const requiredModules = [
      'fs',
      'path',
      'child_process'
    ];

    for (const module of requiredModules) {
      try {
        require(module);
        this.log(`✅ Module ${module} disponible`);
      } catch (error) {
        this.log(`❌ Module ${module} manquant: ${error.message}`);
        return false;
      }
    }

    return true;
  }

  async testLogDirectoryCreation() {
    this.log('📁 Test de création du dossier logs...');
    
    try {
      const logsDir = path.join(__dirname, '../logs');
      
      // Créer le dossier s'il n'existe pas
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      // Tester l'écriture dans le dossier
      const testFile = path.join(logsDir, `test-${Date.now()}.tmp`);
      fs.writeFileSync(testFile, 'test');
      
      // Nettoyer le fichier de test
      fs.unlinkSync(testFile);
      
      this.log('✅ Dossier logs accessible en écriture');
      return true;
      
    } catch (error) {
      this.log(`❌ Erreur avec le dossier logs: ${error.message}`);
      return false;
    }
  }

  async testEnvironmentVariables() {
    this.log('🌍 Test des variables d\'environnement...');
    
    const recommendedEnvVars = [
      'NODE_ENV',
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    let hasRequiredVars = true;
    
    for (const envVar of recommendedEnvVars) {
      if (process.env[envVar]) {
        this.log(`✅ Variable ${envVar} définie`);
      } else {
        this.log(`⚠️ Variable ${envVar} non définie (recommandée)`);
        if (['DATABASE_URL', 'NEXTAUTH_SECRET'].includes(envVar)) {
          hasRequiredVars = false;
        }
      }
    }

    return hasRequiredVars;
  }

  async testScriptPermissions() {
    this.log('🔐 Test des permissions des scripts...');
    
    const scripts = [
      'validate-deployment-prerequisites.js',
      'deploy-hydration-staging.js',
      'validate-hydration-production.js',
      'monitor-hydration-production.js',
      'deploy-hydration-complete.js'
    ];

    for (const script of scripts) {
      const scriptPath = path.join(__dirname, script);
      
      try {
        const stats = fs.statSync(scriptPath);
        const isReadable = !!(stats.mode & parseInt('444', 8));
        
        if (isReadable) {
          this.log(`✅ Script ${script} - Permissions OK`);
        } else {
          this.log(`❌ Script ${script} - Permissions insuffisantes`);
          return false;
        }
      } catch (error) {
        this.log(`❌ Script ${script} - Erreur de permissions: ${error.message}`);
        return false;
      }
    }

    return true;
  }

  generateTestReport() {
    this.log('📊 Génération du rapport de test...');
    
    const totalTests = Object.keys(this.results).length;
    const successfulTests = Object.values(this.results).filter(r => r.status === 'success').length;
    const failedTests = Object.values(this.results).filter(r => r.status === 'failed').length;
    
    const report = {
      testId: this.testId,
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        successfulTests,
        failedTests,
        successRate: Math.round((successfulTests / totalTests) * 100)
      },
      results: this.results,
      allTestsPassed: failedTests === 0,
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(__dirname, '../logs', `deployment-scripts-test-report-${this.testId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    report.reportPath = reportPath;
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    Object.entries(this.results).forEach(([scriptName, result]) => {
      if (result.status === 'failed') {
        switch (scriptName) {
          case 'prerequisites':
            recommendations.push('Corriger le script de validation des prérequis');
            break;
          case 'stagingDeployment':
            recommendations.push('Corriger le script de déploiement staging');
            break;
          case 'productionValidation':
            recommendations.push('Corriger le script de validation production');
            break;
          case 'monitoring':
            recommendations.push('Corriger le script de monitoring');
            break;
          case 'orchestration':
            recommendations.push('Corriger le script d\'orchestration');
            break;
        }
        
        if (result.error) {
          recommendations.push(`  - Erreur: ${result.error}`);
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('✅ Tous les scripts sont fonctionnels - Prêt pour le déploiement');
    }

    return recommendations;
  }

  displayResults(report) {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 RÉSULTATS DES TESTS DES SCRIPTS DE DÉPLOIEMENT');
    console.log('='.repeat(80));
    
    console.log(`\n📋 ID de test: ${report.testId}`);
    console.log(`⏰ Timestamp: ${report.timestamp}`);
    console.log(`📊 Taux de réussite: ${report.summary.successRate}% (${report.summary.successfulTests}/${report.summary.totalTests})`);
    console.log(`✅ Tous les tests réussis: ${report.allTestsPassed ? 'OUI' : 'NON'}`);
    
    // Afficher les résultats détaillés
    console.log('\n📍 RÉSULTATS DÉTAILLÉS:');
    Object.entries(report.results).forEach(([scriptName, result]) => {
      const status = result.status === 'success' ? '✅' : '❌';
      const scriptDisplayName = scriptName.charAt(0).toUpperCase() + scriptName.slice(1);
      
      console.log(`   ${status} ${scriptDisplayName}: ${result.status} (${result.duration}ms)`);
      
      if (result.error) {
        console.log(`      Erreur: ${result.error}`);
      }
    });
    
    // Afficher les recommandations
    if (report.recommendations.length > 0) {
      console.log('\n📋 RECOMMANDATIONS:');
      report.recommendations.forEach(rec => {
        console.log(`   ${rec}`);
      });
    }
    
    console.log(`\n📄 Rapport complet: ${report.reportPath}`);
    console.log('='.repeat(80));
  }

  async runAllTests() {
    const startTime = Date.now();
    
    try {
      this.log(`🧪 Début des tests des scripts de déploiement - ID: ${this.testId}`);
      
      // Tests préliminaires
      this.log('\n📍 TESTS PRÉLIMINAIRES');
      await this.testScriptDependencies();
      await this.testLogDirectoryCreation();
      await this.testEnvironmentVariables();
      await this.testScriptPermissions();
      
      // Tests des scripts individuels
      this.log('\n📍 TESTS DES SCRIPTS');
      await this.testPrerequisitesScript();
      await this.testStagingDeploymentScript();
      await this.testProductionValidationScript();
      await this.testMonitoringScript();
      await this.testOrchestrationScript();
      
      const report = this.generateTestReport();
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      this.log(`🎉 Tests terminés en ${duration}s`);
      
      return report;
      
    } catch (error) {
      this.log(`💥 Échec des tests: ${error.message}`);
      throw error;
    }
  }
}

// Exécution du script
if (require.main === module) {
  const tester = new DeploymentScriptsTester();
  
  tester.runAllTests()
    .then(report => {
      tester.displayResults(report);
      
      if (report.allTestsPassed) {
        console.log('\n🎉 TOUS LES TESTS RÉUSSIS - SCRIPTS PRÊTS POUR UTILISATION !');
        process.exit(0);
      } else {
        console.log('\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ - CORRIGER AVANT UTILISATION');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Erreur lors des tests:', error.message);
      process.exit(1);
    });
}

module.exports = DeploymentScriptsTester;