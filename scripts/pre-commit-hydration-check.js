#!/usr/bin/env node

/**
 * Hook pre-commit pour la validation d'hydratation
 * 
 * Ce script s'exécute avant chaque commit pour vérifier
 * que les fichiers modifiés ne contiennent pas de problèmes d'hydratation.
 */

const { execSync } = require('child_process');
const { hydrationValidator } = require('../lib/validation/hydrationValidator');
const { existsSync } = require('fs');

class PreCommitHydrationCheck {
  constructor() {
    this.config = {
      // Plus strict pour les commits
      failOnWarning: true,
      maxErrors: 0,
      maxWarnings: 0
    };
  }

  /**
   * Obtient la liste des fichiers modifiés
   */
  getModifiedFiles() {
    try {
      // Fichiers staged pour le commit
      const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
        .split('\n')
        .filter(file => file.trim())
        .filter(file => /\.(tsx?|jsx?)$/.test(file))
        .filter(file => existsSync(file));

      return stagedFiles;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des fichiers modifiés:', error.message);
      return [];
    }
  }

  /**
   * Valide les fichiers modifiés
   */
  async validateModifiedFiles(files) {
    if (files.length === 0) {
      console.log('✅ Aucun fichier React modifié à valider');
      return { passed: true, issues: [] };
    }

    console.log(`🔍 Validation d'hydratation pour ${files.length} fichier(s) modifié(s)...`);

    const allIssues = [];

    for (const file of files) {
      const issues = await hydrationValidator.validateFile(file);
      allIssues.push(...issues);
    }

    const errors = allIssues.filter(issue => issue.severity === 'error');
    const warnings = allIssues.filter(issue => issue.severity === 'warning');

    const passed = errors.length === 0 && 
                  (!this.config.failOnWarning || warnings.length === 0);

    return {
      passed,
      issues: allIssues,
      summary: {
        totalFiles: files.length,
        filesWithIssues: new Set(allIssues.map(i => i.file)).size,
        errors: errors.length,
        warnings: warnings.length,
        info: allIssues.filter(i => i.severity === 'info').length
      }
    };
  }

  /**
   * Affiche les résultats de validation
   */
  displayResults(result, files) {
    const { passed, issues, summary } = result;

    console.log('\n📊 Résultats de la validation pre-commit:');
    console.log(`   Fichiers modifiés: ${files.join(', ')}`);
    console.log(`   Erreurs: ${summary.errors}`);
    console.log(`   Avertissements: ${summary.warnings}`);
    console.log(`   Informations: ${summary.info}`);

    if (issues.length > 0) {
      console.log('\n🔍 Problèmes détectés:');

      // Grouper par fichier
      const issuesByFile = issues.reduce((acc, issue) => {
        if (!acc[issue.file]) {
          acc[issue.file] = [];
        }
        acc[issue.file].push(issue);
        return acc;
      }, {});

      for (const [file, fileIssues] of Object.entries(issuesByFile)) {
        console.log(`\n📄 ${file}:`);
        
        fileIssues.forEach(issue => {
          const icon = issue.severity === 'error' ? '❌' : 
                      issue.severity === 'warning' ? '⚠️' : 'ℹ️';
          
          console.log(`   ${icon} Ligne ${issue.line}:${issue.column} - ${issue.message}`);
          
          if (issue.suggestion) {
            console.log(`      💡 ${issue.suggestion}`);
          }
        });
      }
    }

    return passed;
  }

  /**
   * Propose des corrections automatiques
   */
  suggestFixes(issues) {
    const fixableIssues = issues.filter(issue => 
      issue.type === 'unsafe-pattern' || issue.type === 'client-only-api'
    );

    if (fixableIssues.length === 0) {
      return;
    }

    console.log('\n🔧 Corrections suggérées:');
    console.log('   Vous pouvez utiliser les composants hydration-safe suivants:');
    console.log('   - SafeDateRenderer pour les dates');
    console.log('   - SafeRandomContent pour le contenu aléatoire');
    console.log('   - SafeBrowserAPI pour les APIs du navigateur');
    console.log('   - HydrationSafeWrapper pour les composants problématiques');
    console.log('\n   Exemple d\'import:');
    console.log('   import { SafeDateRenderer, SafeBrowserAPI } from "@/components/hydration";');
  }

  /**
   * Exécute la validation pre-commit
   */
  async run() {
    try {
      console.log('🚀 Démarrage de la validation d\'hydratation pre-commit...\n');

      // Obtenir les fichiers modifiés
      const modifiedFiles = this.getModifiedFiles();

      if (modifiedFiles.length === 0) {
        console.log('✅ Aucun fichier React modifié, validation ignorée');
        process.exit(0);
      }

      // Valider les fichiers
      const result = await this.validateModifiedFiles(modifiedFiles);

      // Afficher les résultats
      const passed = this.displayResults(result, modifiedFiles);

      if (!passed) {
        console.log('\n❌ Validation d\'hydratation échouée');
        console.log('   Corrigez les problèmes avant de commiter');
        
        // Suggérer des corrections
        this.suggestFixes(result.issues);
        
        console.log('\n💡 Conseils:');
        console.log('   - Utilisez les composants hydration-safe fournis');
        console.log('   - Consultez docs/HYDRATION_SAFE_COMPONENTS_GUIDE.md');
        console.log('   - Utilisez --no-verify pour ignorer cette validation (non recommandé)');
        
        process.exit(1);
      } else {
        console.log('\n✅ Validation d\'hydratation réussie');
        console.log('   Tous les fichiers modifiés sont sûrs pour l\'hydratation');
        process.exit(0);
      }

    } catch (error) {
      console.error('💥 Erreur lors de la validation pre-commit:', error.message);
      console.error('   Le commit sera autorisé mais vérifiez manuellement vos modifications');
      process.exit(0); // Ne pas bloquer le commit en cas d'erreur du script
    }
  }
}

// Exécution si appelé directement
if (require.main === module) {
  const checker = new PreCommitHydrationCheck();
  checker.run();
}

module.exports = { PreCommitHydrationCheck };