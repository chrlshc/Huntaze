#!/usr/bin/env tsx

/**
 * Script de debug pour les dépendances et la configuration
 * Vérifie les packages manquants, versions incompatibles, etc.
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface DependencyIssue {
  package: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  solution: string;
}

class DependencyDebugger {
  private issues: DependencyIssue[] = [];
  private packageJson: any;
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.loadPackageJson();
  }

  private loadPackageJson(): void {
    try {
      const packagePath = join(this.projectRoot, 'package.json');
      const content = readFileSync(packagePath, 'utf8');
      this.packageJson = JSON.parse(content);
    } catch (error) {
      console.error('❌ Cannot read package.json:', error);
      process.exit(1);
    }
  }

  async runDependencyCheck(): Promise<void> {
    console.log('🔍 Checking dependencies and configuration...\n');

    // Vérifier les dépendances critiques
    this.checkCriticalDependencies();
    
    // Vérifier les versions Node.js
    this.checkNodeVersion();
    
    // Vérifier les scripts npm
    this.checkNpmScripts();
    
    // Vérifier les dépendances de développement
    this.checkDevDependencies();
    
    // Vérifier les conflits de versions
    await this.checkVersionConflicts();
    
    // Vérifier la configuration TypeScript
    this.checkTypeScriptConfig();
    
    // Vérifier Next.js
    this.checkNextJsConfig();

    this.printReport();
  }

  /**
   * Vérifie les dépendances critiques pour nos optimisations
   */
  private checkCriticalDependencies(): void {
    console.log('📦 Checking critical dependencies...');

    const criticalDeps = {
      // Runtime dependencies
      'zod': 'Schema validation for API requests',
      'next': 'Next.js framework',
      
      // Development dependencies
      'tsx': 'TypeScript execution for scripts',
      'typescript': 'TypeScript compiler',
      '@types/node': 'Node.js type definitions',
    };

    Object.entries(criticalDeps).forEach(([pkg, description]) => {
      const isInstalled = this.isDependencyInstalled(pkg);
      
      if (!isInstalled) {
        this.issues.push({
          package: pkg,
          issue: `Missing critical dependency: ${pkg}`,
          severity: 'error',
          solution: `npm install ${pkg} # ${description}`,
        });
      } else {
        console.log(`  ✅ ${pkg} - installed`);
      }
    });

    // Vérifier les dépendances optionnelles mais recommandées
    const recommendedDeps = {
      'vitest': 'Testing framework',
      '@types/react': 'React type definitions',
      'eslint': 'Code linting',
    };

    Object.entries(recommendedDeps).forEach(([pkg, description]) => {
      const isInstalled = this.isDependencyInstalled(pkg);
      
      if (!isInstalled) {
        this.issues.push({
          package: pkg,
          issue: `Recommended dependency missing: ${pkg}`,
          severity: 'warning',
          solution: `npm install --save-dev ${pkg} # ${description}`,
        });
      }
    });
  }

  /**
   * Vérifie si une dépendance est installée
   */
  private isDependencyInstalled(pkg: string): boolean {
    return !!(
      this.packageJson.dependencies?.[pkg] || 
      this.packageJson.devDependencies?.[pkg] ||
      this.packageJson.peerDependencies?.[pkg]
    );
  }

  /**
   * Vérifie la version de Node.js
   */
  private checkNodeVersion(): void {
    console.log('🟢 Checking Node.js version...');

    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    console.log(`  Current Node.js version: ${nodeVersion}`);

    if (majorVersion < 18) {
      this.issues.push({
        package: 'node',
        issue: `Node.js version ${nodeVersion} is too old`,
        severity: 'error',
        solution: 'Upgrade to Node.js 18+ for optimal performance and security',
      });
    } else if (majorVersion < 20) {
      this.issues.push({
        package: 'node',
        issue: `Node.js version ${nodeVersion} works but newer is recommended`,
        severity: 'warning',
        solution: 'Consider upgrading to Node.js 20+ for latest features',
      });
    } else {
      console.log('  ✅ Node.js version is compatible');
    }
  }

  /**
   * Vérifie les scripts npm requis
   */
  private checkNpmScripts(): void {
    console.log('📜 Checking npm scripts...');

    const requiredScripts = {
      'dev': 'Development server',
      'build': 'Production build',
      'start': 'Production server',
      'test': 'Run tests',
      'type-check': 'TypeScript type checking',
    };

    const optimizationScripts = {
      'validate:optimizations': 'Validate optimization patterns',
      'load-test:smoke': 'Quick load testing',
      'health-check': 'API health check',
      'setup:monitoring': 'Setup monitoring stack',
    };

    // Vérifier scripts requis
    Object.entries(requiredScripts).forEach(([script, description]) => {
      if (!this.packageJson.scripts?.[script]) {
        this.issues.push({
          package: 'npm-scripts',
          issue: `Missing required script: ${script}`,
          severity: 'warning',
          solution: `Add "${script}" script to package.json # ${description}`,
        });
      } else {
        console.log(`  ✅ ${script} - configured`);
      }
    });

    // Vérifier scripts d'optimisation
    Object.entries(optimizationScripts).forEach(([script, description]) => {
      if (!this.packageJson.scripts?.[script]) {
        this.issues.push({
          package: 'optimization-scripts',
          issue: `Missing optimization script: ${script}`,
          severity: 'info',
          solution: `Add "${script}" script for ${description}`,
        });
      } else {
        console.log(`  ✅ ${script} - configured`);
      }
    });
  }

  /**
   * Vérifie les dépendances de développement
   */
  private checkDevDependencies(): void {
    console.log('🛠️ Checking development dependencies...');

    const devDeps = {
      '@types/node': 'Node.js types',
      'typescript': 'TypeScript compiler',
      'tsx': 'TypeScript execution',
    };

    Object.entries(devDeps).forEach(([pkg, description]) => {
      if (!this.packageJson.devDependencies?.[pkg]) {
        this.issues.push({
          package: pkg,
          issue: `Missing dev dependency: ${pkg}`,
          severity: 'error',
          solution: `npm install --save-dev ${pkg} # ${description}`,
        });
      } else {
        console.log(`  ✅ ${pkg} - installed`);
      }
    });
  }

  /**
   * Vérifie les conflits de versions
   */
  private async checkVersionConflicts(): Promise<void> {
    console.log('⚖️ Checking for version conflicts...');

    try {
      // Exécuter npm ls pour détecter les conflits
      const output = execSync('npm ls --depth=0 2>&1', { 
        encoding: 'utf8',
        cwd: this.projectRoot 
      });

      if (output.includes('ERESOLVE') || output.includes('conflicting peer dependency')) {
        this.issues.push({
          package: 'npm-dependencies',
          issue: 'Dependency version conflicts detected',
          severity: 'warning',
          solution: 'Run: npm audit fix or resolve peer dependency conflicts',
        });
      } else {
        console.log('  ✅ No version conflicts detected');
      }

    } catch (error: any) {
      if (error.stdout?.includes('missing') || error.stdout?.includes('invalid')) {
        this.issues.push({
          package: 'npm-dependencies',
          issue: 'Missing or invalid dependencies detected',
          severity: 'error',
          solution: 'Run: npm install to fix missing dependencies',
        });
      }
    }
  }

  /**
   * Vérifie la configuration TypeScript
   */
  private checkTypeScriptConfig(): void {
    console.log('📘 Checking TypeScript configuration...');

    const tsconfigPath = join(this.projectRoot, 'tsconfig.json');
    
    if (!existsSync(tsconfigPath)) {
      this.issues.push({
        package: 'typescript-config',
        issue: 'tsconfig.json not found',
        severity: 'error',
        solution: 'Create tsconfig.json with proper configuration',
      });
      return;
    }

    try {
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));
      
      // Vérifier les options importantes
      const requiredOptions = {
        'strict': true,
        'esModuleInterop': true,
        'skipLibCheck': true,
        'forceConsistentCasingInFileNames': true,
      };

      Object.entries(requiredOptions).forEach(([option, expectedValue]) => {
        const currentValue = tsconfig.compilerOptions?.[option];
        
        if (currentValue !== expectedValue) {
          this.issues.push({
            package: 'typescript-config',
            issue: `TypeScript option ${option} should be ${expectedValue}`,
            severity: 'warning',
            solution: `Set "${option}": ${expectedValue} in tsconfig.json compilerOptions`,
          });
        }
      });

      console.log('  ✅ TypeScript configuration found');

    } catch (error) {
      this.issues.push({
        package: 'typescript-config',
        issue: 'Invalid tsconfig.json format',
        severity: 'error',
        solution: 'Fix JSON syntax in tsconfig.json',
      });
    }
  }

  /**
   * Vérifie la configuration Next.js
   */
  private checkNextJsConfig(): void {
    console.log('⚡ Checking Next.js configuration...');

    // Vérifier si Next.js est installé
    if (!this.isDependencyInstalled('next')) {
      this.issues.push({
        package: 'next',
        issue: 'Next.js not installed',
        severity: 'error',
        solution: 'npm install next react react-dom',
      });
      return;
    }

    // Vérifier next.config.js
    const nextConfigPath = join(this.projectRoot, 'next.config.js');
    const nextConfigMjsPath = join(this.projectRoot, 'next.config.mjs');
    
    if (!existsSync(nextConfigPath) && !existsSync(nextConfigMjsPath)) {
      this.issues.push({
        package: 'next-config',
        issue: 'next.config.js not found',
        severity: 'info',
        solution: 'Create next.config.js for custom Next.js configuration',
      });
    } else {
      console.log('  ✅ Next.js configuration found');
    }

    // Vérifier la structure des dossiers Next.js
    const requiredDirs = ['app', 'lib'];
    
    requiredDirs.forEach(dir => {
      const dirPath = join(this.projectRoot, dir);
      if (!existsSync(dirPath)) {
        this.issues.push({
          package: 'next-structure',
          issue: `Missing ${dir} directory`,
          severity: 'warning',
          solution: `Create ${dir} directory for Next.js app structure`,
        });
      }
    });
  }

  /**
   * Affiche le rapport de debug
   */
  private printReport(): void {
    console.log('\n📋 Dependency Debug Report');
    console.log('='.repeat(50));

    const errors = this.issues.filter(i => i.severity === 'error');
    const warnings = this.issues.filter(i => i.severity === 'warning');
    const infos = this.issues.filter(i => i.severity === 'info');

    console.log(`❌ Errors: ${errors.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    console.log(`ℹ️  Info: ${infos.length}`);

    if (this.issues.length === 0) {
      console.log('\n🎉 All dependencies and configuration look good!');
      console.log('✅ Ready for development and production deployment.');
    } else {
      // Afficher les erreurs
      if (errors.length > 0) {
        console.log('\n❌ Critical Issues (must fix):');
        errors.forEach(issue => {
          console.log(`  - ${issue.issue}`);
          console.log(`    Solution: ${issue.solution}`);
        });
      }

      // Afficher les warnings
      if (warnings.length > 0) {
        console.log('\n⚠️  Warnings (recommended to fix):');
        warnings.forEach(issue => {
          console.log(`  - ${issue.issue}`);
          console.log(`    Solution: ${issue.solution}`);
        });
      }

      // Afficher les infos
      if (infos.length > 0) {
        console.log('\nℹ️  Suggestions (optional improvements):');
        infos.forEach(issue => {
          console.log(`  - ${issue.issue}`);
          console.log(`    Solution: ${issue.solution}`);
        });
      }
    }

    // Commandes de réparation rapide
    console.log('\n🔧 Quick Fix Commands:');
    
    const installCommands = new Set<string>();
    
    this.issues.forEach(issue => {
      if (issue.solution.startsWith('npm install')) {
        const command = issue.solution.split(' #')[0]; // Remove comments
        installCommands.add(command);
      }
    });

    if (installCommands.size > 0) {
      console.log('  # Install missing dependencies:');
      Array.from(installCommands).forEach(cmd => {
        console.log(`  ${cmd}`);
      });
    }

    console.log('\n🛠️  Useful Commands:');
    console.log('  npm install                    # Install all dependencies');
    console.log('  npm audit                      # Check for vulnerabilities');
    console.log('  npm audit fix                  # Fix vulnerabilities');
    console.log('  npm outdated                   # Check for outdated packages');
    console.log('  npm run validate:optimizations # Validate setup');

    // Exit code basé sur la sévérité
    const errorCount = errors.length;
    process.exit(errorCount > 0 ? 1 : 0);
  }
}

// Exécution du debug
async function main() {
  const debugger = new DependencyDebugger();
  await debugger.runDependencyCheck();
}

main().catch(console.error);