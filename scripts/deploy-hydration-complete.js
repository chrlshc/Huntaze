#!/usr/bin/env node

/**
 * Script complet de déploiement et validation des corrections d'hydratation
 * Orchestre les tâches 9.1 et 9.2
 */

const HydrationStagingDeployer = require('./deploy-hydration-staging');
const HydrationProductionValidator = require('./validate-hydration-production');
const fs = require('fs');
const path = require('path');

class HydrationDeploymentOrchestrator {
  constructor() {
    this.orchestrationId = `hydration-deployment-${Date.now()}`;
    this.logFile = path.join(__dirname, '../logs', `deployment-orchestration-${this.orchestrationId}.log`);
    
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

  async executeFullDeployment() {
    const startTime = Date.now();
    
    try {
      this.log(`🚀 Début du déploiement complet des corrections d'hydratation`);
      this.log(`📋 ID d'orchestration: ${this.orchestrationId}`);
      
      // Phase 1: Déploiement en staging
      this.log('\n📍 PHASE 1: Déploiement en environnement de staging');
      this.log('=' .repeat(60));
      
      const stagingDeployer = new HydrationStagingDeployer();
      const stagingReport = await stagingDeployer.deploy();
      
      this.log(`✅ Phase 1 terminée - Staging déployé avec succès`);
      this.log(`📊 URL de staging: ${stagingReport.url}`);
      
      // Attendre un délai avant la validation production
      this.log('\n⏳ Attente avant validation production (30 secondes)...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Phase 2: Validation en production
      this.log('\n📍 PHASE 2: Validation du déploiement en production');
      this.log('=' .repeat(60));
      
      const productionValidator = new HydrationProductionValidator();
      const productionReport = await productionValidator.validate();
      
      this.log(`✅ Phase 2 terminée - Production validée`);
      this.log(`📊 Statut de validation: ${productionReport.status}`);
      
      // Génération du rapport final
      const finalReport = await this.generateFinalReport(stagingReport, productionReport);
      const totalDuration = Math.round((Date.now() - startTime) / 1000);
      
      this.log('\n🎉 DÉPLOIEMENT COMPLET TERMINÉ AVEC SUCCÈS !');
      this.log('=' .repeat(60));
      this.log(`⏱️ Durée totale: ${totalDuration}s`);
      this.log(`📊 Rapport final: ${finalReport.reportPath}`);
      
      return finalReport;
      
    } catch (error) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      this.log('\n💥 ÉCHEC DU DÉPLOIEMENT COMPLET');
      this.log('=' .repeat(60));
      this.log(`❌ Erreur: ${error.message}`);
      this.log(`⏱️ Durée avant échec: ${duration}s`);
      
      // Générer un rapport d'échec
      const failureReport = {
        orchestrationId: this.orchestrationId,
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: error.message,
        duration,
        phase: error.phase || 'unknown'
      };
      
      const reportPath = path.join(__dirname, '../logs', `deployment-failure-${this.orchestrationId}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(failureReport, null, 2));
      
      throw error;
    }
  }

  async generateFinalReport(stagingReport, productionReport) {
    this.log('📊 Génération du rapport final...');
    
    const finalReport = {
      orchestrationId: this.orchestrationId,
      timestamp: new Date().toISOString(),
      status: 'success',
      phases: {
        staging: {
          status: stagingReport.status,
          url: stagingReport.url,
          deploymentId: stagingReport.deploymentId,
          componentsFixed: stagingReport.hydrationFixes.componentsFixed,
          testsRun: stagingReport.hydrationFixes.testsRun
        },
        production: {
          status: productionReport.status,
          url: productionReport.url,
          validationId: productionReport.validationId,
          hydrationErrors: productionReport.metrics.hydrationErrors,
          userExperienceScore: productionReport.metrics.userExperienceScore,
          performanceMetrics: productionReport.metrics.performanceImpact
        }
      },
      summary: {
        hydrationErrorsResolved: productionReport.metrics.hydrationErrors === 0,
        stagingDeploymentSuccessful: stagingReport.status === 'success',
        productionValidationSuccessful: productionReport.status === 'success',
        overallSuccess: stagingReport.status === 'success' && productionReport.status === 'success'
      },
      recommendations: productionReport.recommendations,
      nextSteps: this.generateNextSteps(stagingReport, productionReport)
    };

    const reportPath = path.join(__dirname, '../logs', `final-deployment-report-${this.orchestrationId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));
    
    finalReport.reportPath = reportPath;
    
    this.log(`📊 Rapport final généré: ${reportPath}`);
    return finalReport;
  }

  generateNextSteps(stagingReport, productionReport) {
    const nextSteps = [];

    if (productionReport.status === 'success') {
      nextSteps.push('✅ Déploiement validé - Aucune action immédiate requise');
      nextSteps.push('📊 Continuer le monitoring des métriques d\'hydratation');
      nextSteps.push('📋 Planifier une revue post-déploiement dans 24h');
    } else {
      nextSteps.push('⚠️ Investiguer les problèmes identifiés en production');
      nextSteps.push('🔧 Appliquer les corrections recommandées');
      nextSteps.push('🔄 Relancer la validation après corrections');
    }

    if (productionReport.metrics.hydrationErrors > 0) {
      nextSteps.push('🐛 Analyser et corriger les erreurs d\'hydratation restantes');
    }

    if (productionReport.metrics.userExperienceScore < 80) {
      nextSteps.push('🎯 Optimiser l\'expérience utilisateur');
    }

    nextSteps.push('📚 Mettre à jour la documentation de déploiement');
    nextSteps.push('🎓 Former l\'équipe sur les nouvelles procédures');

    return nextSteps;
  }

  async displaySummary(report) {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 RÉSUMÉ DU DÉPLOIEMENT DES CORRECTIONS D\'HYDRATATION');
    console.log('='.repeat(80));
    
    console.log(`\n📋 ID d'orchestration: ${report.orchestrationId}`);
    console.log(`⏰ Timestamp: ${report.timestamp}`);
    console.log(`📊 Statut global: ${report.status === 'success' ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
    
    console.log('\n📍 PHASE 1 - STAGING:');
    console.log(`   Statut: ${report.phases.staging.status === 'success' ? '✅' : '❌'} ${report.phases.staging.status}`);
    console.log(`   URL: ${report.phases.staging.url}`);
    console.log(`   Composants corrigés: ${report.phases.staging.componentsFixed.length}`);
    
    console.log('\n📍 PHASE 2 - PRODUCTION:');
    console.log(`   Statut: ${report.phases.production.status === 'success' ? '✅' : '⚠️'} ${report.phases.production.status}`);
    console.log(`   URL: ${report.phases.production.url}`);
    console.log(`   Erreurs d'hydratation: ${report.phases.production.hydrationErrors}`);
    console.log(`   Score UX: ${report.phases.production.userExperienceScore}/100`);
    
    console.log('\n📊 RÉSUMÉ:');
    console.log(`   Erreurs d'hydratation résolues: ${report.summary.hydrationErrorsResolved ? '✅' : '❌'}`);
    console.log(`   Déploiement staging: ${report.summary.stagingDeploymentSuccessful ? '✅' : '❌'}`);
    console.log(`   Validation production: ${report.summary.productionValidationSuccessful ? '✅' : '⚠️'}`);
    console.log(`   Succès global: ${report.summary.overallSuccess ? '✅' : '❌'}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n📋 RECOMMANDATIONS:');
      report.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }
    
    if (report.nextSteps.length > 0) {
      console.log('\n🚀 PROCHAINES ÉTAPES:');
      report.nextSteps.forEach(step => console.log(`   • ${step}`));
    }
    
    console.log(`\n📄 Rapport complet: ${report.reportPath}`);
    console.log('='.repeat(80));
  }
}

// Exécution du script
if (require.main === module) {
  const orchestrator = new HydrationDeploymentOrchestrator();
  
  orchestrator.executeFullDeployment()
    .then(async report => {
      await orchestrator.displaySummary(report);
      
      if (report.summary.overallSuccess) {
        console.log('\n🎉 DÉPLOIEMENT COMPLET RÉUSSI !');
        process.exit(0);
      } else {
        console.log('\n⚠️ DÉPLOIEMENT TERMINÉ AVEC DES AVERTISSEMENTS');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 ÉCHEC DU DÉPLOIEMENT COMPLET:', error.message);
      console.error('Consultez les logs pour plus de détails.');
      process.exit(1);
    });
}

module.exports = HydrationDeploymentOrchestrator;