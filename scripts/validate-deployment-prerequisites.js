#!/usr/bin/env node

/**
 * Script de validation des prérequis pour le déploiement des corrections d'hydratation
 * Vérifie que tous les éléments sont en place avant le déploiement
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentPrerequisitesValidator {
  constructor() {
    this.validationId = `prereq-validation-${Date.now()}`;
    this.logFile = path.join(__dirname, '../logs', `prerequisites-validation-${this.validationId}.log`);
    this.results = {
      environment: { passed: 0, failed: 0, checks: [] },
      dependencies: { passed: 0, failed: 0, checks: [] },
      components: { passed: 0, failed: 0, checks: [] },
      tests: { passed: 0, failed: 0, checks: [] },
      configuration: { passed: 0, failed: 0, checks: [] }
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

  addCheck(category, name, passed, message, details = null) {
    const check = {
      name,
      passed,
      message,
      details,
      timestamp: new Date().toISOString()
    };

    this.results[category].checks.push(check);
    
    if (passed) {
      this.results[category].passed++;
      this.log(`✅ ${name}: ${message}`);
    } else {
      this.results[category].failed++;
      this.log(`❌ ${name}: ${message}`);
      if (details) {
        this.log(`   Détails: ${details}`);
      }
    }
  }

  async validateEnvironmentVariables() {
    this.log('🔍 Validation des variables d\'environnement...');
    
    const requiredEnvVars = [
      { name: 'DATABASE_URL', description: 'URL de la base de données' },
      { name: 'NEXTAUTH_SECRET', description: 'Secret NextAuth' },
      { name: 'NEXTAUTH_URL', description: 'URL NextAuth' },
      { name: 'NODE_ENV', description: 'Environnement Node.js' }
    ];

    const optionalEnvVars = [
      { name: 'PRODUCTION_URL', description: 'URL de production' },
      { name: 'STAGING_URL', description: 'URL de staging' },
      { name: 'AWS_AMPLIFY_APP_ID', description: 'ID application Amplify' }
    ];

    // Vérifier les variables requises
    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar.name];
      const passed = !!value;
      
      this.addCheck(
        'environment',
        `Variable ${envVar.name}`,
        passed,
        passed ? 'Définie' : 'Manquante',
        passed ? null : `${envVar.description} requise pour le déploiement`
      );
    }

    // Vérifier les variables optionnelles
    for (const envVar of optionalEnvVars) {
      const value = process.env[envVar.name];
      const passed = !!value;
      
      this.addCheck(
        'environment',
        `Variable ${envVar.name} (optionnelle)`,
        true, // Toujours considérée comme réussie car optionnelle
        passed ? 'Définie' : 'Non définie',
        passed ? null : `${envVar.description} recommandée mais optionnelle`
      );
    }

    // Vérifier la validité de DATABASE_URL
    if (process.env.DATABASE_URL) {
      const isValidUrl = process.env.DATABASE_URL.startsWith('postgresql://') || 
                        process.env.DATABASE_URL.startsWith('postgres://');
      
      this.addCheck(
        'environment',
        'Format DATABASE_URL',
        isValidUrl,
        isValidUrl ? 'Format PostgreSQL valide' : 'Format invalide',
        isValidUrl ? null : 'DATABASE_URL doit commencer par postgresql:// ou postgres://'
      );
    }
  }

  async validateDependencies() {
    this.log('📦 Validation des dépendances...');
    
    try {
      // Vérifier package.json
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJsonExists = fs.existsSync(packageJsonPath);
      
      this.addCheck(
        'dependencies',
        'Fichier package.json',
        packageJsonExists,
        packageJsonExists ? 'Présent' : 'Manquant'
      );

      if (packageJsonExists) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Vérifier les dépendances critiques
        const criticalDeps = [
          'next',
          'react',
          'react-dom',
          'next-auth'
        ];

        for (const dep of criticalDeps) {
          const hasDepInDeps = packageJson.dependencies && packageJson.dependencies[dep];
          const hasDepInDevDeps = packageJson.devDependencies && packageJson.devDependencies[dep];
          const hasDep = hasDepInDeps || hasDepInDevDeps;
          
          this.addCheck(
            'dependencies',
            `Dépendance ${dep}`,
            hasDep,
            hasDep ? 'Présente' : 'Manquante',
            hasDep ? `Version: ${hasDepInDeps || hasDepInDevDeps}` : null
          );
        }
      }

      // Vérifier node_modules
      const nodeModulesExists = fs.existsSync(path.join(process.cwd(), 'node_modules'));
      this.addCheck(
        'dependencies',
        'Dossier node_modules',
        nodeModulesExists,
        nodeModulesExists ? 'Présent' : 'Manquant',
        nodeModulesExists ? null : 'Exécuter npm install'
      );

      // Vérifier npm/yarn
      try {
        execSync('npm --version', { stdio: 'pipe' });
        this.addCheck('dependencies', 'NPM disponible', true, 'Installé');
      } catch (error) {
        this.addCheck('dependencies', 'NPM disponible', false, 'Non installé');
      }

    } catch (error) {
      this.addCheck(
        'dependencies',
        'Validation des dépendances',
        false,
        'Erreur lors de la validation',
        error.message
      );
    }
  }

  async validateHydrationComponents() {
    this.log('🧩 Validation des composants d\'hydratation...');
    
    const requiredComponents = [
      {
        path: 'components/hydration/HydrationErrorBoundary.tsx',
        name: 'HydrationErrorBoundary'
      },
      {
        path: 'components/hydration/HydrationSafeWrapper.tsx',
        name: 'HydrationSafeWrapper'
      },
      {
        path: 'components/hydration/SSRDataProvider.tsx',
        name: 'SSRDataProvider'
      },
      {
        path: 'components/hydration/SafeDateRenderer.tsx',
        name: 'SafeDateRenderer'
      },
      {
        path: 'components/hydration/SafeBrowserAPI.tsx',
        name: 'SafeBrowserAPI'
      },
      {
        path: 'components/hydration/SafeRandomContent.tsx',
        name: 'SafeRandomContent'
      }
    ];

    for (const component of requiredComponents) {
      const componentPath = path.join(process.cwd(), component.path);
      const exists = fs.existsSync(componentPath);
      
      this.addCheck(
        'components',
        component.name,
        exists,
        exists ? 'Présent' : 'Manquant',
        exists ? `Chemin: ${component.path}` : `Fichier attendu: ${component.path}`
      );

      // Vérifier le contenu du composant s'il existe
      if (exists) {
        try {
          const content = fs.readFileSync(componentPath, 'utf8');
          const hasExport = content.includes('export') && 
                           (content.includes(`export default`) || content.includes(`export const ${component.name}`));
          
          this.addCheck(
            'components',
            `${component.name} - Export`,
            hasExport,
            hasExport ? 'Export valide' : 'Export manquant'
          );
        } catch (error) {
          this.addCheck(
            'components',
            `${component.name} - Lecture`,
            false,
            'Erreur de lecture',
            error.message
          );
        }
      }
    }

    // Vérifier le fichier d'index des composants
    const indexPath = path.join(process.cwd(), 'components/hydration/index.ts');
    const indexExists = fs.existsSync(indexPath);
    
    this.addCheck(
      'components',
      'Index des composants',
      indexExists,
      indexExists ? 'Présent' : 'Manquant',
      indexExists ? null : 'Fichier components/hydration/index.ts recommandé'
    );
  }

  async validateTests() {
    this.log('🧪 Validation des tests...');
    
    const testDirectories = [
      'tests/unit/hydration',
      'tests/integration/hydration',
      'tests/e2e/hydration'
    ];

    for (const testDir of testDirectories) {
      const testPath = path.join(process.cwd(), testDir);
      const exists = fs.existsSync(testPath);
      
      this.addCheck(
        'tests',
        `Dossier ${testDir}`,
        exists,
        exists ? 'Présent' : 'Manquant'
      );

      if (exists) {
        // Compter les fichiers de test
        try {
          const files = fs.readdirSync(testPath);
          const testFiles = files.filter(file => 
            file.endsWith('.test.ts') || 
            file.endsWith('.test.tsx') || 
            file.endsWith('.spec.ts') || 
            file.endsWith('.spec.tsx')
          );
          
          this.addCheck(
            'tests',
            `${testDir} - Fichiers de test`,
            testFiles.length > 0,
            `${testFiles.length} fichier(s) de test trouvé(s)`,
            testFiles.length > 0 ? `Fichiers: ${testFiles.join(', ')}` : null
          );
        } catch (error) {
          this.addCheck(
            'tests',
            `${testDir} - Lecture`,
            false,
            'Erreur de lecture',
            error.message
          );
        }
      }
    }

    // Vérifier la configuration de test
    const testConfigs = [
      'jest.config.js',
      'jest.config.ts',
      'vitest.config.ts',
      'vitest.setup.ts'
    ];

    let hasTestConfig = false;
    for (const config of testConfigs) {
      const configPath = path.join(process.cwd(), config);
      if (fs.existsSync(configPath)) {
        hasTestConfig = true;
        this.addCheck(
          'tests',
          `Configuration ${config}`,
          true,
          'Présente'
        );
        break;
      }
    }

    if (!hasTestConfig) {
      this.addCheck(
        'tests',
        'Configuration de test',
        false,
        'Aucune configuration trouvée',
        `Fichiers recherchés: ${testConfigs.join(', ')}`
      );
    }
  }

  async validateConfiguration() {
    this.log('⚙️ Validation de la configuration...');
    
    // Vérifier next.config.ts/js
    const nextConfigs = ['next.config.ts', 'next.config.js'];
    let hasNextConfig = false;
    
    for (const config of nextConfigs) {
      const configPath = path.join(process.cwd(), config);
      if (fs.existsSync(configPath)) {
        hasNextConfig = true;
        this.addCheck(
          'configuration',
          `Configuration Next.js (${config})`,
          true,
          'Présente'
        );
        break;
      }
    }

    if (!hasNextConfig) {
      this.addCheck(
        'configuration',
        'Configuration Next.js',
        false,
        'Manquante',
        'next.config.ts ou next.config.js requis'
      );
    }

    // Vérifier tailwind.config.mjs
    const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.mjs');
    const hasTailwindConfig = fs.existsSync(tailwindConfigPath);
    
    this.addCheck(
      'configuration',
      'Configuration Tailwind',
      hasTailwindConfig,
      hasTailwindConfig ? 'Présente' : 'Manquante'
    );

    // Vérifier tsconfig.json
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
    const hasTsconfig = fs.existsSync(tsconfigPath);
    
    this.addCheck(
      'configuration',
      'Configuration TypeScript',
      hasTsconfig,
      hasTsconfig ? 'Présente' : 'Manquante'
    );

    // Vérifier .env.example
    const envExamplePath = path.join(process.cwd(), '.env.example');
    const hasEnvExample = fs.existsSync(envExamplePath);
    
    this.addCheck(
      'configuration',
      'Fichier .env.example',
      hasEnvExample,
      hasEnvExample ? 'Présent' : 'Manquant',
      hasEnvExample ? null : 'Recommandé pour documenter les variables d\'environnement'
    );

    // Vérifier hydration.config.js
    const hydrationConfigPath = path.join(process.cwd(), 'hydration.config.js');
    const hasHydrationConfig = fs.existsSync(hydrationConfigPath);
    
    this.addCheck(
      'configuration',
      'Configuration hydratation',
      hasHydrationConfig,
      hasHydrationConfig ? 'Présente' : 'Manquante',
      hasHydrationConfig ? null : 'Configuration spécifique à l\'hydratation'
    );
  }

  generateSummaryReport() {
    this.log('📊 Génération du rapport de validation...');
    
    const totalChecks = Object.values(this.results).reduce((sum, category) => 
      sum + category.passed + category.failed, 0
    );
    const totalPassed = Object.values(this.results).reduce((sum, category) => 
      sum + category.passed, 0
    );
    const totalFailed = Object.values(this.results).reduce((sum, category) => 
      sum + category.failed, 0
    );

    const report = {
      validationId: this.validationId,
      timestamp: new Date().toISOString(),
      summary: {
        totalChecks,
        totalPassed,
        totalFailed,
        successRate: Math.round((totalPassed / totalChecks) * 100)
      },
      categories: this.results,
      readyForDeployment: totalFailed === 0,
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(__dirname, '../logs', `prerequisites-report-${this.validationId}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    report.reportPath = reportPath;
    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    // Analyser les échecs par catégorie
    Object.entries(this.results).forEach(([category, results]) => {
      if (results.failed > 0) {
        const failedChecks = results.checks.filter(check => !check.passed);
        
        switch (category) {
          case 'environment':
            recommendations.push('Configurer les variables d\'environnement manquantes');
            failedChecks.forEach(check => {
              if (check.details) {
                recommendations.push(`  - ${check.name}: ${check.details}`);
              }
            });
            break;
            
          case 'dependencies':
            recommendations.push('Installer les dépendances manquantes');
            recommendations.push('  - Exécuter: npm install');
            break;
            
          case 'components':
            recommendations.push('Créer les composants d\'hydratation manquants');
            failedChecks.forEach(check => {
              if (check.details) {
                recommendations.push(`  - ${check.details}`);
              }
            });
            break;
            
          case 'tests':
            recommendations.push('Créer les tests d\'hydratation manquants');
            recommendations.push('  - Configurer le framework de test');
            break;
            
          case 'configuration':
            recommendations.push('Compléter la configuration du projet');
            failedChecks.forEach(check => {
              if (check.details) {
                recommendations.push(`  - ${check.details}`);
              }
            });
            break;
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('✅ Tous les prérequis sont satisfaits - Prêt pour le déploiement');
    }

    return recommendations;
  }

  displayResults(report) {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 VALIDATION DES PRÉREQUIS DE DÉPLOIEMENT');
    console.log('='.repeat(80));
    
    console.log(`\n📋 ID de validation: ${report.validationId}`);
    console.log(`⏰ Timestamp: ${report.timestamp}`);
    console.log(`📊 Taux de réussite: ${report.summary.successRate}% (${report.summary.totalPassed}/${report.summary.totalChecks})`);
    console.log(`🚀 Prêt pour déploiement: ${report.readyForDeployment ? '✅ OUI' : '❌ NON'}`);
    
    // Afficher les résultats par catégorie
    Object.entries(report.categories).forEach(([category, results]) => {
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      const status = results.failed === 0 ? '✅' : '❌';
      
      console.log(`\n📍 ${categoryName.toUpperCase()}: ${status} ${results.passed}/${results.passed + results.failed}`);
      
      // Afficher les échecs
      const failedChecks = results.checks.filter(check => !check.passed);
      if (failedChecks.length > 0) {
        failedChecks.forEach(check => {
          console.log(`   ❌ ${check.name}: ${check.message}`);
          if (check.details) {
            console.log(`      ${check.details}`);
          }
        });
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

  async validate() {
    const startTime = Date.now();
    
    try {
      this.log(`🔍 Début de la validation des prérequis - ID: ${this.validationId}`);
      
      await this.validateEnvironmentVariables();
      await this.validateDependencies();
      await this.validateHydrationComponents();
      await this.validateTests();
      await this.validateConfiguration();
      
      const report = this.generateSummaryReport();
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      this.log(`🎉 Validation terminée en ${duration}s`);
      
      return report;
      
    } catch (error) {
      this.log(`💥 Échec de la validation: ${error.message}`);
      throw error;
    }
  }
}

// Exécution du script
if (require.main === module) {
  const validator = new DeploymentPrerequisitesValidator();
  
  validator.validate()
    .then(report => {
      validator.displayResults(report);
      
      if (report.readyForDeployment) {
        console.log('\n🎉 VALIDATION RÉUSSIE - PRÊT POUR LE DÉPLOIEMENT !');
        process.exit(0);
      } else {
        console.log('\n⚠️ VALIDATION ÉCHOUÉE - CORRIGER LES PROBLÈMES AVANT DÉPLOIEMENT');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Erreur lors de la validation:', error.message);
      process.exit(1);
    });
}

module.exports = DeploymentPrerequisitesValidator;