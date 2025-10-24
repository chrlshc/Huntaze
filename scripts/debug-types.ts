#!/usr/bin/env tsx

/**
 * Script de debug pour les erreurs de types TypeScript
 * Identifie et résout les problèmes d'imports et de types
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface TypeIssue {
  file: string;
  line?: number;
  column?: number;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

class TypeScriptDebugger {
  private issues: TypeIssue[] = [];
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
  }

  async runTypeCheck(): Promise<void> {
    console.log('🔍 Running TypeScript diagnostics...\n');

    try {
      // Exécuter tsc --noEmit pour vérifier les types
      const output = execSync('npx tsc --noEmit --pretty false', { 
        encoding: 'utf8',
        cwd: this.projectRoot 
      });
      
      console.log('✅ No TypeScript errors found!');
      
    } catch (error: any) {
      console.log('❌ TypeScript errors detected, analyzing...\n');
      
      // Parser la sortie d'erreur de TypeScript
      this.parseTypeScriptOutput(error.stdout || error.message);
      
      // Analyser les erreurs
      await this.analyzeIssues();
      
      // Proposer des solutions
      this.suggestFixes();
    }

    // Vérifier les imports manquants
    await this.checkMissingImports();
    
    // Vérifier les fichiers de définition de types
    this.checkTypeDefinitions();
    
    this.printReport();
  }

  /**
   * Parse la sortie de TypeScript
   */
  private parseTypeScriptOutput(output: string): void {
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Format: file(line,col): error TS#### message
      const match = line.match(/^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)$/);
      
      if (match) {
        const [, file, lineNum, colNum, severity, code, message] = match;
        
        this.issues.push({
          file: file.replace(this.projectRoot + '/', ''),
          line: parseInt(lineNum),
          column: parseInt(colNum),
          message,
          code: `TS${code}`,
          severity: severity as 'error' | 'warning',
        });
      }
    }
  }

  /**
   * Analyse les erreurs et catégorise
   */
  private async analyzeIssues(): Promise<void> {
    console.log(`📊 Found ${this.issues.length} TypeScript issues\n`);

    // Grouper par type d'erreur
    const errorGroups = this.groupIssuesByType();
    
    Object.entries(errorGroups).forEach(([type, issues]) => {
      console.log(`${type}: ${issues.length} issues`);
      issues.slice(0, 3).forEach(issue => {
        console.log(`  - ${issue.file}:${issue.line} - ${issue.message}`);
      });
      if (issues.length > 3) {
        console.log(`  ... and ${issues.length - 3} more`);
      }
      console.log();
    });
  }

  /**
   * Groupe les erreurs par type
   */
  private groupIssuesByType(): Record<string, TypeIssue[]> {
    const groups: Record<string, TypeIssue[]> = {};

    this.issues.forEach(issue => {
      let category = 'Other';

      if (issue.message.includes('Cannot find module')) {
        category = 'Missing Imports';
      } else if (issue.message.includes('Property') && issue.message.includes('does not exist')) {
        category = 'Property Errors';
      } else if (issue.message.includes('Type') && issue.message.includes('is not assignable')) {
        category = 'Type Mismatch';
      } else if (issue.message.includes('Argument of type')) {
        category = 'Argument Type Errors';
      } else if (issue.message.includes('Expected') && issue.message.includes('arguments')) {
        category = 'Function Signature Errors';
      }

      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(issue);
    });

    return groups;
  }

  /**
   * Suggère des corrections
   */
  private suggestFixes(): void {
    console.log('💡 Suggested Fixes:\n');

    const fixes = new Set<string>();

    this.issues.forEach(issue => {
      if (issue.message.includes('Cannot find module')) {
        const moduleName = this.extractModuleName(issue.message);
        if (moduleName) {
          fixes.add(`npm install ${moduleName}`);
        }
      }

      if (issue.message.includes('@types/')) {
        const typesPackage = issue.message.match(/@types\/[\w-]+/)?.[0];
        if (typesPackage) {
          fixes.add(`npm install --save-dev ${typesPackage}`);
        }
      }

      if (issue.code === 'TS2307' && issue.message.includes('./')) {
        fixes.add(`Check relative import path in ${issue.file}:${issue.line}`);
      }

      if (issue.code === 'TS2304') {
        fixes.add(`Add type definition or import for undefined type in ${issue.file}`);
      }
    });

    Array.from(fixes).forEach(fix => {
      console.log(`  - ${fix}`);
    });
    console.log();
  }

  /**
   * Extrait le nom du module d'un message d'erreur
   */
  private extractModuleName(message: string): string | null {
    const match = message.match(/Cannot find module '([^']+)'/);
    return match ? match[1] : null;
  }

  /**
   * Vérifie les imports manquants dans nos fichiers
   */
  private async checkMissingImports(): void {
    console.log('🔍 Checking for missing imports in optimization files...\n');

    const filesToCheck = [
      'lib/services/advanced-circuit-breaker.ts',
      'lib/services/smart-request-coalescer.ts',
      'lib/services/slo-monitoring-service.ts',
      'app/api/metrics/route.ts',
    ];

    for (const file of filesToCheck) {
      const fullPath = join(this.projectRoot, file);
      
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf8');
        this.checkFileImports(file, content);
      } else {
        console.log(`⚠️  File not found: ${file}`);
      }
    }
  }

  /**
   * Vérifie les imports d'un fichier
   */
  private checkFileImports(file: string, content: string): void {
    const lines = content.split('\n');
    const imports: string[] = [];
    const usedTypes: string[] = [];

    // Extraire les imports
    lines.forEach((line, index) => {
      if (line.trim().startsWith('import')) {
        imports.push(line.trim());
      }

      // Détecter les types utilisés (simplifié)
      const typeMatches = line.match(/:\s*([A-Z][a-zA-Z0-9_<>[\]|&\s]*)/g);
      if (typeMatches) {
        typeMatches.forEach(match => {
          const type = match.replace(':', '').trim();
          if (!usedTypes.includes(type)) {
            usedTypes.push(type);
          }
        });
      }
    });

    // Vérifier les types potentiellement manquants
    const commonMissingTypes = [
      'NextRequest',
      'NextResponse', 
      'Promise',
      'Record',
      'Array',
    ];

    const potentiallyMissing = commonMissingTypes.filter(type => 
      content.includes(type) && !imports.some(imp => imp.includes(type))
    );

    if (potentiallyMissing.length > 0) {
      console.log(`📄 ${file}:`);
      console.log(`  Potentially missing imports: ${potentiallyMissing.join(', ')}`);
    }
  }

  /**
   * Vérifie les fichiers de définition de types
   */
  private checkTypeDefinitions(): void {
    console.log('🔍 Checking type definitions...\n');

    const typeFiles = [
      'lib/types/api-errors.ts',
      'lib/types/api-types.ts',
    ];

    typeFiles.forEach(file => {
      const fullPath = join(this.projectRoot, file);
      
      if (existsSync(fullPath)) {
        console.log(`✅ ${file} exists`);
      } else {
        console.log(`❌ ${file} missing - this may cause type errors`);
        this.suggestTypeFileCreation(file);
      }
    });
  }

  /**
   * Suggère la création de fichiers de types manquants
   */
  private suggestTypeFileCreation(file: string): void {
    console.log(`💡 Create ${file} with basic type definitions`);
    
    if (file.includes('api-errors')) {
      console.log('  - Add APIError, ValidationError, NetworkError interfaces');
    }
    
    if (file.includes('api-types')) {
      console.log('  - Add common API request/response types');
    }
  }

  /**
   * Affiche le rapport final
   */
  private printReport(): void {
    console.log('\n📋 TypeScript Debug Report');
    console.log('='.repeat(50));

    if (this.issues.length === 0) {
      console.log('✅ No TypeScript issues found!');
      console.log('🚀 All types are correctly defined and imported.');
    } else {
      const errors = this.issues.filter(i => i.severity === 'error').length;
      const warnings = this.issues.filter(i => i.severity === 'warning').length;

      console.log(`❌ Errors: ${errors}`);
      console.log(`⚠️  Warnings: ${warnings}`);
      console.log(`📊 Total Issues: ${this.issues.length}`);

      console.log('\n🔧 Quick Fixes:');
      console.log('1. Run: npm install --save-dev @types/node');
      console.log('2. Check import paths in reported files');
      console.log('3. Add missing type definitions');
      console.log('4. Run: npm run type-check to verify fixes');
    }

    console.log('\n🛠️  Useful Commands:');
    console.log('  npx tsc --noEmit          # Check types without compilation');
    console.log('  npm run type-check        # Run type checking (if configured)');
    console.log('  npm run lint              # Run linting');
    console.log('  npm run validate:optimizations  # Full validation');

    // Exit avec code d'erreur si des erreurs TypeScript
    const errorCount = this.issues.filter(i => i.severity === 'error').length;
    process.exit(errorCount > 0 ? 1 : 0);
  }
}

// Exécution du debug
async function main() {
  const debugger = new TypeScriptDebugger();
  await debugger.runTypeCheck();
}

main().catch(console.error);