/**
 * Validateur d'hydratation automatique
 * 
 * Ce module fournit des outils pour valider automatiquement
 * la sécurité d'hydratation des composants React.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

export interface HydrationIssue {
  file: string;
  line: number;
  column: number;
  type: 'unsafe-pattern' | 'missing-wrapper' | 'client-only-api' | 'dynamic-content';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  code?: string;
}

export interface ValidationResult {
  passed: boolean;
  issues: HydrationIssue[];
  summary: {
    totalFiles: number;
    filesWithIssues: number;
    errors: number;
    warnings: number;
    info: number;
  };
}

export class HydrationValidator {
  private patterns = {
    // Patterns dangereux pour l'hydratation
    unsafePatterns: [
      {
        pattern: /new Date\(\)(?!.*useSSRValue|.*SafeDateRenderer)/g,
        type: 'unsafe-pattern' as const,
        severity: 'error' as const,
        message: 'Utilisation directe de new Date() sans protection SSR',
        suggestion: 'Utilisez SafeDateRenderer ou useSSRValue pour les dates'
      },
      {
        pattern: /Math\.random\(\)(?!.*SafeRandomContent)/g,
        type: 'unsafe-pattern' as const,
        severity: 'error' as const,
        message: 'Utilisation de Math.random() sans seed cohérent',
        suggestion: 'Utilisez SafeRandomContent avec une seed fixe'
      },
      {
        pattern: /window\.(?!.*SafeWindowAccess|.*SafeBrowserAPI)/g,
        type: 'client-only-api' as const,
        severity: 'error' as const,
        message: 'Accès direct à window sans protection',
        suggestion: 'Utilisez SafeWindowAccess ou SafeBrowserAPI'
      },
      {
        pattern: /document\.(?!.*SafeDocumentAccess|.*SafeBrowserAPI)/g,
        type: 'client-only-api' as const,
        severity: 'error' as const,
        message: 'Accès direct à document sans protection',
        suggestion: 'Utilisez SafeDocumentAccess ou SafeBrowserAPI'
      },
      {
        pattern: /localStorage|sessionStorage(?!.*SafeBrowserAPI)/g,
        type: 'client-only-api' as const,
        severity: 'warning' as const,
        message: 'Utilisation de storage sans protection',
        suggestion: 'Utilisez SafeBrowserAPI pour accéder au storage'
      },
      {
        pattern: /navigator\.(?!.*SafeBrowserAPI)/g,
        type: 'client-only-api' as const,
        severity: 'warning' as const,
        message: 'Accès à navigator sans protection',
        suggestion: 'Utilisez SafeBrowserAPI'
      }
    ],

    // Patterns de contenu dynamique problématique
    dynamicContentPatterns: [
      {
        pattern: /key=\{Math\.random\(\)\}/g,
        type: 'dynamic-content' as const,
        severity: 'error' as const,
        message: 'Clé React générée aléatoirement',
        suggestion: 'Utilisez des clés stables basées sur les données'
      },
      {
        pattern: /key=\{Date\.now\(\)\}/g,
        type: 'dynamic-content' as const,
        severity: 'error' as const,
        message: 'Clé React basée sur le timestamp',
        suggestion: 'Utilisez des clés stables basées sur les données'
      },
      {
        pattern: /\{.*\?\s*<.*>\s*:\s*null\}(?!.*HydrationSafeWrapper)/g,
        type: 'dynamic-content' as const,
        severity: 'warning' as const,
        message: 'Rendu conditionnel sans wrapper de sécurité',
        suggestion: 'Enveloppez dans HydrationSafeWrapper si nécessaire'
      }
    ],

    // Patterns de composants manquants
    missingWrapperPatterns: [
      {
        pattern: /useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*?window[\s\S]*?\}\s*,\s*\[\]\s*\)(?!.*HydrationSafeWrapper)/g,
        type: 'missing-wrapper' as const,
        severity: 'info' as const,
        message: 'useEffect avec accès window sans wrapper',
        suggestion: 'Considérez HydrationSafeWrapper ou ClientOnly'
      }
    ]
  };

  /**
   * Valide tous les fichiers React dans le projet
   */
  async validateProject(projectRoot: string = process.cwd()): Promise<ValidationResult> {
    const files = await this.findReactFiles(projectRoot);
    const issues: HydrationIssue[] = [];

    for (const file of files) {
      const fileIssues = await this.validateFile(file);
      issues.push(...fileIssues);
    }

    return this.generateResult(files, issues);
  }

  /**
   * Valide un fichier spécifique
   */
  async validateFile(filePath: string): Promise<HydrationIssue[]> {
    if (!existsSync(filePath)) {
      return [];
    }

    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const issues: HydrationIssue[] = [];

    // Vérifier tous les patterns
    const allPatterns = [
      ...this.patterns.unsafePatterns,
      ...this.patterns.dynamicContentPatterns,
      ...this.patterns.missingWrapperPatterns
    ];

    for (const patternConfig of allPatterns) {
      const matches = content.matchAll(patternConfig.pattern);
      
      for (const match of matches) {
        const position = this.getLineAndColumn(content, match.index || 0);
        
        issues.push({
          file: filePath,
          line: position.line,
          column: position.column,
          type: patternConfig.type,
          severity: patternConfig.severity,
          message: patternConfig.message,
          suggestion: patternConfig.suggestion,
          code: match[0]
        });
      }
    }

    return issues;
  }

  /**
   * Trouve tous les fichiers React dans le projet
   */
  private async findReactFiles(projectRoot: string): Promise<string[]> {
    const patterns = [
      'app/**/*.{tsx,jsx}',
      'components/**/*.{tsx,jsx}',
      'lib/**/*.{tsx,jsx}',
      'hooks/**/*.{tsx,jsx}',
      'pages/**/*.{tsx,jsx}',
      'src/**/*.{tsx,jsx}'
    ];

    const files: string[] = [];
    
    for (const pattern of patterns) {
      const globAsync = glob as unknown as (pattern: string, options: any) => Promise<string[]>;
      const matches = await globAsync(pattern, { 
        cwd: projectRoot,
        absolute: true,
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/.next/**',
          '**/tests/**',
          '**/*.test.*',
          '**/*.spec.*'
        ]
      });
      files.push(...matches);
    }

    return [...new Set(files)]; // Dédupliquer
  }

  /**
   * Calcule la ligne et la colonne d'une position dans le texte
   */
  private getLineAndColumn(content: string, index: number): { line: number; column: number } {
    const beforeIndex = content.substring(0, index);
    const lines = beforeIndex.split('\n');
    
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }

  /**
   * Génère le résultat final de validation
   */
  private generateResult(files: string[], issues: HydrationIssue[]): ValidationResult {
    const filesWithIssues = new Set(issues.map(issue => issue.file)).size;
    const errors = issues.filter(issue => issue.severity === 'error').length;
    const warnings = issues.filter(issue => issue.severity === 'warning').length;
    const info = issues.filter(issue => issue.severity === 'info').length;

    return {
      passed: errors === 0,
      issues,
      summary: {
        totalFiles: files.length,
        filesWithIssues,
        errors,
        warnings,
        info
      }
    };
  }

  /**
   * Génère un rapport formaté
   */
  generateReport(result: ValidationResult): string {
    const { summary, issues } = result;
    
    let report = `
# Rapport de Validation d'Hydratation

## Résumé
- **Statut**: ${result.passed ? '✅ SUCCÈS' : '❌ ÉCHEC'}
- **Fichiers analysés**: ${summary.totalFiles}
- **Fichiers avec problèmes**: ${summary.filesWithIssues}
- **Erreurs**: ${summary.errors}
- **Avertissements**: ${summary.warnings}
- **Informations**: ${summary.info}

`;

    if (issues.length === 0) {
      report += '🎉 Aucun problème d\'hydratation détecté !\n';
      return report;
    }

    // Grouper par fichier
    const issuesByFile = issues.reduce((acc, issue) => {
      if (!acc[issue.file]) {
        acc[issue.file] = [];
      }
      acc[issue.file].push(issue);
      return acc;
    }, {} as Record<string, HydrationIssue[]>);

    report += '## Problèmes Détectés\n\n';

    for (const [file, fileIssues] of Object.entries(issuesByFile)) {
      report += `### ${file}\n\n`;
      
      for (const issue of fileIssues) {
        const icon = issue.severity === 'error' ? '❌' : 
                    issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        
        report += `${icon} **Ligne ${issue.line}:${issue.column}** - ${issue.message}\n`;
        
        if (issue.code) {
          report += `   \`${issue.code.trim()}\`\n`;
        }
        
        if (issue.suggestion) {
          report += `   💡 **Suggestion**: ${issue.suggestion}\n`;
        }
        
        report += '\n';
      }
    }

    return report;
  }

  /**
   * Valide les composants hydration-safe existants
   */
  async validateHydrationComponents(projectRoot: string = process.cwd()): Promise<ValidationResult> {
    const globAsync = glob as unknown as (pattern: string, options: any) => Promise<string[]>;
    const hydrationFiles = await globAsync('components/hydration/**/*.{tsx,ts}', {
      cwd: projectRoot,
      absolute: true
    });

    const issues: HydrationIssue[] = [];

    for (const file of hydrationFiles) {
      const content = readFileSync(file, 'utf-8');
      
      // Vérifications spécifiques aux composants d'hydratation
      if (file.includes('HydrationSafeWrapper') && !content.includes('suppressHydrationWarning')) {
        issues.push({
          file,
          line: 1,
          column: 1,
          type: 'missing-wrapper',
          severity: 'warning',
          message: 'HydrationSafeWrapper devrait gérer suppressHydrationWarning',
          suggestion: 'Ajoutez la prop suppressHydrationWarning si nécessaire'
        });
      }

      if (file.includes('SafeDate') && !content.includes('useSSRValue')) {
        issues.push({
          file,
          line: 1,
          column: 1,
          type: 'missing-wrapper',
          severity: 'info',
          message: 'Composant de date devrait utiliser useSSRValue',
          suggestion: 'Utilisez useSSRValue pour la cohérence SSR/client'
        });
      }
    }

    return this.generateResult(hydrationFiles, issues);
  }
}

// Instance singleton
export const hydrationValidator = new HydrationValidator();
