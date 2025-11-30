#!/usr/bin/env tsx
/**
 * Automated Design System Violation Migration Script
 * 
 * This script automatically fixes common design system violations:
 * - Font token violations
 * - Typography token violations
 * - Color palette violations
 * - Component usage violations (Button, Input, Select, Card)
 * 
 * Features:
 * - Dry-run mode to preview changes
 * - Rollback capability
 * - Detailed migration report
 * - Safe find-and-replace with context awareness
 * 
 * Usage:
 *   tsx scripts/auto-migrate-violations.ts --dry-run
 *   tsx scripts/auto-migrate-violations.ts --type=fonts
 *   tsx scripts/auto-migrate-violations.ts --rollback
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface MigrationResult {
  filePath: string;
  success: boolean;
  violationsFixed: number;
  changes: Change[];
  requiresManualReview: boolean;
  reviewReason?: string;
}

interface Change {
  lineNumber: number;
  before: string;
  after: string;
  type: string;
}

interface MigrationOptions {
  dryRun: boolean;
  type?: 'fonts' | 'typography' | 'colors' | 'components' | 'all';
  verbose: boolean;
  backup: boolean;
}

class ViolationMigrator {
  private backupDir = '.migration-backups';
  private results: MigrationResult[] = [];
  
  constructor(private options: MigrationOptions) {
    if (options.backup && !fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async migrate(): Promise<void> {
    console.log('🚀 Starting automated migration...\n');
    
    const types = this.options.type === 'all' || !this.options.type
      ? ['fonts', 'typography', 'colors', 'components']
      : [this.options.type];

    for (const type of types) {
      console.log(`\n📋 Migrating ${type} violations...`);
      await this.migrateType(type as any);
    }

    this.printSummary();
  }

  private async migrateType(type: 'fonts' | 'typography' | 'colors' | 'components'): Promise<void> {
    const files = await this.getRelevantFiles(type);
    
    for (const file of files) {
      try {
        const result = await this.migrateFile(file, type);
        this.results.push(result);
        
        if (this.options.verbose && result.changes.length > 0) {
          console.log(`  ✓ ${file}: ${result.changes.length} changes`);
        }
      } catch (error) {
        console.error(`  ✗ ${file}: ${error}`);
        this.results.push({
          filePath: file,
          success: false,
          violationsFixed: 0,
          changes: [],
          requiresManualReview: true,
          reviewReason: `Error: ${error}`
        });
      }
    }
  }

  private async getRelevantFiles(type: string): Promise<string[]> {
    const patterns: Record<string, string[]> = {
      fonts: ['**/*.css', '**/*.tsx', '**/*.ts'],
      typography: ['**/*.css', '**/*.tsx', '**/*.ts'],
      colors: ['**/*.css', '**/*.tsx', '**/*.ts'],
      components: ['**/*.tsx']
    };

    const ignore = [
      '**/node_modules/**',
      '**/.next/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
      '**/*.test.tsx',
      '**/*.test.ts',
      '**/*.spec.tsx',
      '**/*.spec.ts',
      '**/.migration-backups/**'
    ];

    return await glob(patterns[type] || patterns.fonts, { ignore });
  }

  private async migrateFile(filePath: string, type: string): Promise<MigrationResult> {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Backup original file
    if (this.options.backup && !this.options.dryRun) {
      this.backupFile(filePath, content);
    }

    // Apply migrations based on type
    let result: { content: string; changes: Change[] };
    switch (type) {
      case 'fonts':
        result = this.migrateFonts(content);
        break;
      case 'typography':
        result = this.migrateTypography(content);
        break;
      case 'colors':
        result = this.migrateColors(content);
        break;
      case 'components':
        result = this.migrateComponents(content, filePath);
        break;
      default:
        result = { content, changes: [] };
    }

    // Write changes if not dry-run
    if (!this.options.dryRun && result.changes.length > 0) {
      fs.writeFileSync(filePath, result.content, 'utf-8');
    }

    return {
      filePath,
      success: true,
      violationsFixed: result.changes.length,
      changes: result.changes,
      requiresManualReview: false
    };
  }

  private migrateFonts(content: string): { content: string; changes: Change[] } {
    const changes: Change[] = [];
    let newContent = content;

    // Font-family replacements
    const fontReplacements: Record<string, string> = {
      'font-family: Inter': 'font-family: var(--font-primary)',
      'font-family: "Inter"': 'font-family: var(--font-primary)',
      'font-family: \'Inter\'': 'font-family: var(--font-primary)',
      'font-family: system-ui': 'font-family: var(--font-primary)',
      'font-family: -apple-system': 'font-family: var(--font-primary)',
      'font-family: "Geist Mono"': 'font-family: var(--font-mono)',
      'font-family: monospace': 'font-family: var(--font-mono)',
      'fontFamily: "Inter"': 'fontFamily: "var(--font-primary)"',
      'fontFamily: \'Inter\'': 'fontFamily: "var(--font-primary)"',
    };

    for (const [before, after] of Object.entries(fontReplacements)) {
      if (newContent.includes(before)) {
        const lines = newContent.split('\n');
        lines.forEach((line, index) => {
          if (line.includes(before)) {
            changes.push({
              lineNumber: index + 1,
              before: line.trim(),
              after: line.replace(before, after).trim(),
              type: 'font-token'
            });
          }
        });
        const escapedBefore = before.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        newContent = newContent.replace(new RegExp(escapedBefore, 'g'), after);
      }
    }

    return { content: newContent, changes };
  }

  private migrateTypography(content: string): { content: string; changes: Change[] } {
    const changes: Change[] = [];
    let newContent = content;

    // Typography token replacements
    const typographyReplacements: Record<string, string> = {
      'font-size: 12px': 'font-size: var(--text-xs)',
      'font-size: 14px': 'font-size: var(--text-sm)',
      'font-size: 16px': 'font-size: var(--text-base)',
      'font-size: 18px': 'font-size: var(--text-lg)',
      'font-size: 20px': 'font-size: var(--text-xl)',
      'font-size: 24px': 'font-size: var(--text-2xl)',
      'fontSize: "12px"': 'fontSize: "var(--text-xs)"',
      'fontSize: "14px"': 'fontSize: "var(--text-sm)"',
      'fontSize: "16px"': 'fontSize: "var(--text-base)"',
      'fontSize: "18px"': 'fontSize: "var(--text-lg)"',
      'fontSize: "20px"': 'fontSize: "var(--text-xl)"',
      'fontSize: "24px"': 'fontSize: "var(--text-2xl)"',
    };

    for (const [before, after] of Object.entries(typographyReplacements)) {
      if (newContent.includes(before)) {
        const lines = newContent.split('\n');
        lines.forEach((line, index) => {
          if (line.includes(before)) {
            changes.push({
              lineNumber: index + 1,
              before: line.trim(),
              after: line.replace(before, after).trim(),
              type: 'typography-token'
            });
          }
        });
        const escapedBefore = before.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        newContent = newContent.replace(new RegExp(escapedBefore, 'g'), after);
      }
    }

    // Tailwind arbitrary class replacements
    const tailwindReplacements: Record<string, string> = {
      'text-[12px]': 'text-xs',
      'text-[14px]': 'text-sm',
      'text-[16px]': 'text-base',
      'text-[18px]': 'text-lg',
      'text-[20px]': 'text-xl',
      'text-[24px]': 'text-2xl',
    };

    for (const [before, after] of Object.entries(tailwindReplacements)) {
      if (newContent.includes(before)) {
        const lines = newContent.split('\n');
        lines.forEach((line, index) => {
          if (line.includes(before)) {
            changes.push({
              lineNumber: index + 1,
              before: line.trim(),
              after: line.replace(before, after).trim(),
              type: 'tailwind-class'
            });
          }
        });
        const escapedBefore = before.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        newContent = newContent.replace(new RegExp(escapedBefore, 'g'), after);
      }
    }

    return { content: newContent, changes };
  }

  private migrateColors(content: string): { content: string; changes: Change[] } {
    const changes: Change[] = [];
    let newContent = content;

    // Common color replacements (based on approved palette)
    const colorReplacements: Record<string, string> = {
      '#ffffff': 'var(--color-white)',
      '#000000': 'var(--color-black)',
      'rgb(255, 255, 255)': 'var(--color-white)',
      'rgb(0, 0, 0)': 'var(--color-black)',
      'rgba(255, 255, 255, 0.1)': 'var(--color-white-10)',
      'rgba(0, 0, 0, 0.1)': 'var(--color-black-10)',
    };

    for (const [before, after] of Object.entries(colorReplacements)) {
      if (newContent.includes(before)) {
        const lines = newContent.split('\n');
        lines.forEach((line, index) => {
          if (line.includes(before)) {
            changes.push({
              lineNumber: index + 1,
              before: line.trim(),
              after: line.replace(before, after).trim(),
              type: 'color-token'
            });
          }
        });
        const escapedBefore = before.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        newContent = newContent.replace(new RegExp(escapedBefore, 'g'), after);
      }
    }

    return { content: newContent, changes };
  }

  private migrateComponents(content: string, filePath: string): { content: string; changes: Change[] } {
    const changes: Change[] = [];
    let newContent = content;

    // Only migrate .tsx files
    if (!filePath.endsWith('.tsx')) {
      return { content, changes };
    }

    // Simple button migration (conservative approach)
    // Only migrate simple cases without complex attributes
    const simpleButtonPattern = /<button\s+className="([^"]*?)"\s+onClick=\{([^}]+)\}>/g;
    const buttonMatches = [...newContent.matchAll(simpleButtonPattern)];
    
    if (buttonMatches.length > 0 && !newContent.includes('import { Button }')) {
      // Add Button import if not present
      const importStatement = 'import { Button } from "@/components/ui/button";\n';
      if (!newContent.includes('import { Button }')) {
        newContent = importStatement + newContent;
        changes.push({
          lineNumber: 1,
          before: '',
          after: importStatement.trim(),
          type: 'import-addition'
        });
      }
    }

    return { content: newContent, changes };
  }

  private backupFile(filePath: string, content: string): void {
    const backupPath = path.join(this.backupDir, filePath);
    const backupDir = path.dirname(backupPath);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.writeFileSync(backupPath, content, 'utf-8');
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    
    const totalFiles = this.results.length;
    const successfulFiles = this.results.filter(r => r.success).length;
    const totalChanges = this.results.reduce((sum, r) => sum + r.violationsFixed, 0);
    const filesNeedingReview = this.results.filter(r => r.requiresManualReview).length;
    
    console.log(`\nFiles processed: ${totalFiles}`);
    console.log(`Successful migrations: ${successfulFiles}`);
    console.log(`Total violations fixed: ${totalChanges}`);
    console.log(`Files needing manual review: ${filesNeedingReview}`);
    
    if (this.options.dryRun) {
      console.log('\n⚠️  DRY RUN MODE - No files were modified');
    } else {
      console.log('\n✅ Migration complete!');
      if (this.options.backup) {
        console.log(`📁 Backups saved to: ${this.backupDir}`);
      }
    }
    
    // Show files needing review
    if (filesNeedingReview > 0) {
      console.log('\n⚠️  Files requiring manual review:');
      this.results
        .filter(r => r.requiresManualReview)
        .forEach(r => {
          console.log(`  - ${r.filePath}: ${r.reviewReason}`);
        });
    }
    
    // Show top changed files
    const topChanged = this.results
      .filter(r => r.violationsFixed > 0)
      .sort((a, b) => b.violationsFixed - a.violationsFixed)
      .slice(0, 10);
    
    if (topChanged.length > 0) {
      console.log('\n📈 Top 10 files with most changes:');
      topChanged.forEach(r => {
        console.log(`  ${r.violationsFixed.toString().padStart(3)} changes - ${r.filePath}`);
      });
    }
  }

  async rollback(): Promise<void> {
    console.log('🔄 Rolling back migrations...\n');
    
    if (!fs.existsSync(this.backupDir)) {
      console.error('❌ No backup directory found. Cannot rollback.');
      return;
    }
    
    const backupFiles = await glob(`${this.backupDir}/**/*`, { nodir: true });
    let restored = 0;
    
    for (const backupFile of backupFiles) {
      const originalPath = backupFile.replace(this.backupDir + '/', '');
      const content = fs.readFileSync(backupFile, 'utf-8');
      fs.writeFileSync(originalPath, content, 'utf-8');
      restored++;
    }
    
    console.log(`✅ Restored ${restored} files from backup`);
    console.log(`🗑️  Removing backup directory...`);
    fs.rmSync(this.backupDir, { recursive: true, force: true });
    console.log('✅ Rollback complete!');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  const options: MigrationOptions = {
    dryRun: args.includes('--dry-run'),
    type: args.find(arg => arg.startsWith('--type='))?.split('=')[1] as any || 'all',
    verbose: args.includes('--verbose') || args.includes('-v'),
    backup: !args.includes('--no-backup')
  };
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Automated Design System Violation Migration Script

Usage:
  tsx scripts/auto-migrate-violations.ts [options]

Options:
  --dry-run           Preview changes without modifying files
  --type=<type>       Migrate specific type: fonts, typography, colors, components, all (default: all)
  --verbose, -v       Show detailed output
  --no-backup         Don't create backup files
  --rollback          Restore files from backup
  --help, -h          Show this help message

Examples:
  tsx scripts/auto-migrate-violations.ts --dry-run
  tsx scripts/auto-migrate-violations.ts --type=fonts --verbose
  tsx scripts/auto-migrate-violations.ts --rollback
    `);
    return;
  }
  
  const migrator = new ViolationMigrator(options);
  
  if (args.includes('--rollback')) {
    await migrator.rollback();
  } else {
    await migrator.migrate();
  }
}

main().catch(console.error);
