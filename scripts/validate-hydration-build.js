#!/usr/bin/env node

/**
 * Script de validation d'hydratation pour le build
 * 
 * Ce script s'exécute pendant le processus de build pour détecter
 * automatiquement les problèmes d'hydratation potentiels.
 */

const { hydrationValidator } = require('../lib/validation/hydrationValidator');
const { writeFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

class BuildHydrationValidator {
  constructor() {
    this.projectRoot = process.cwd();
    this.outputDir = join(this.projectRoot, 'hydration-reports');
    this.config = this.loadConfig();
  }

  /**
   * Charge la configuration de validation
   */
  loadConfig() {
    const defaultConfig = {
      failOnError: true,
      failOnWarning: false,
      outputReport: true,
      excludePatterns: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**'
      ],
      customPatterns: []
    };

    try {
      const configPath = join(this.projectRoot, 'hydration.config.js');
      if (existsSync(configPath)) {
        const userConfig = require(configPath);
        return { ...defaultConfig, ...userConfig };
      }
    } catch (error) {
      console.warn('⚠️ Impossible de charger hydration.config.js, utilisation de la config par défaut');
    }

    return defaultConfig;
  }

  /**
   * Exécute la validation complète
   */
  async run() {
    console.log('🔍 Démarrage de la validation d\'hydratation...\n');

    try {
      // Validation du projet principal
      const projectResult = await hydrationValidator.validateProject(this.projectRoot);
      
      // Validation des composants hydration-safe
      const componentsResult = await hydrationValidator.validateHydrationComponents(this.projectRoot);

      // Combinaison des résultats
      const combinedResult = this.combineResults(projectResult, componentsResult);

      // Génération du rapport
      if (this.config.outputReport) {
        await this.generateReports(combinedResult, projectResult, componentsResult);
      }

      // Affichage des résultats
      this.displayResults(combinedResult);

      // Détermination du code de sortie
      const shouldFail = this.shouldFail(combinedResult);
      
      if (shouldFail) {
        console.error('\n❌ Validation d\'hydratation échouée');
        process.exit(1);
      } else {
        console.log('\n✅ Validation d\'hydratation réussie');
        process.exit(0);
      }

    } catch (error) {
      console.error('💥 Erreur lors de la validation:', error.message);
      process.exit(1);
    }
  }

  /**
   * Combine les résultats de validation
   */
  combineResults(projectResult, componentsResult) {
    return {
      passed: projectResult.passed && componentsResult.passed,
      issues: [...projectResult.issues, ...componentsResult.issues],
      summary: {
        totalFiles: projectResult.summary.totalFiles + componentsResult.summary.totalFiles,
        filesWithIssues: projectResult.summary.filesWithIssues + componentsResult.summary.filesWithIssues,
        errors: projectResult.summary.errors + componentsResult.summary.errors,
        warnings: projectResult.summary.warnings + componentsResult.summary.warnings,
        info: projectResult.summary.info + componentsResult.summary.info
      }
    };
  }

  /**
   * Génère les rapports de validation
   */
  async generateReports(combinedResult, projectResult, componentsResult) {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Rapport principal
    const mainReport = hydrationValidator.generateReport(combinedResult);
    writeFileSync(
      join(this.outputDir, `hydration-validation-${timestamp}.md`),
      mainReport
    );

    // Rapport détaillé du projet
    const projectReport = hydrationValidator.generateReport(projectResult);
    writeFileSync(
      join(this.outputDir, `project-validation-${timestamp}.md`),
      projectReport
    );

    // Rapport des composants
    const componentsReport = hydrationValidator.generateReport(componentsResult);
    writeFileSync(
      join(this.outputDir, `components-validation-${timestamp}.md`),
      componentsReport
    );

    // Rapport JSON pour l'intégration CI/CD
    const jsonReport = {
      timestamp: new Date().toISOString(),
      passed: combinedResult.passed,
      summary: combinedResult.summary,
      issues: combinedResult.issues.map(issue => ({
        ...issue,
        file: issue.file.replace(this.projectRoot, '.')
      }))
    };

    writeFileSync(
      join(this.outputDir, `hydration-validation-${timestamp}.json`),
      JSON.stringify(jsonReport, null, 2)
    );

    console.log(`📄 Rapports générés dans ${this.outputDir}`);
  }

  /**
   * Affiche les résultats dans la console
   */
  displayResults(result) {
    const { summary } = result;

    console.log('📊 Résultats de la validation:\n');
    console.log(`   Fichiers analysés: ${summary.totalFiles}`);
    console.log(`   Fichiers avec problèmes: ${summary.filesWithIssues}`);
    console.log(`   Erreurs: ${summary.errors}`);
    console.log(`   Avertissements: ${summary.warnings}`);
    console.log(`   Informations: ${summary.info}`);

    if (result.issues.length > 0) {
      console.log('\n🔍 Problèmes détectés:');
      
      // Grouper par sévérité
      const errorIssues = result.issues.filter(i => i.severity === 'error');
      const warningIssues = result.issues.filter(i => i.severity === 'warning');
      const infoIssues = result.issues.filter(i => i.severity === 'info');

      if (errorIssues.length > 0) {
        console.log(`\n❌ Erreurs (${errorIssues.length}):`);
        errorIssues.slice(0, 5).forEach(issue => {
          console.log(`   ${issue.file}:${issue.line} - ${issue.message}`);
        });
        if (errorIssues.length > 5) {
          console.log(`   ... et ${errorIssues.length - 5} autres erreurs`);
        }
      }

      if (warningIssues.length > 0) {
        console.log(`\n⚠️ Avertissements (${warningIssues.length}):`);
        warningIssues.slice(0, 3).forEach(issue => {
          console.log(`   ${issue.file}:${issue.line} - ${issue.message}`);
        });
        if (warningIssues.length > 3) {
          console.log(`   ... et ${warningIssues.length - 3} autres avertissements`);
        }
      }

      if (infoIssues.length > 0) {
        console.log(`\nℹ️ Informations (${infoIssues.length}):`);
        infoIssues.slice(0, 2).forEach(issue => {
          console.log(`   ${issue.file}:${issue.line} - ${issue.message}`);
        });
        if (infoIssues.length > 2) {
          console.log(`   ... et ${infoIssues.length - 2} autres informations`);
        }
      }
    }
  }

  /**
   * Détermine si le build doit échouer
   */
  shouldFail(result) {
    const hasErrors = result.summary.errors > 0;
    const hasWarnings = result.summary.warnings > 0;

    return (this.config.failOnError && hasErrors) || 
           (this.config.failOnWarning && hasWarnings);
  }
}

// Exécution si appelé directement
if (require.main === module) {
  const validator = new BuildHydrationValidator();
  validator.run().catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { BuildHydrationValidator };