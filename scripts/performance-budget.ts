/**
 * Performance Budget Validation Script
 * Validates bundle sizes and performance metrics against defined budgets
 * 
 * Validates: Requirements 8.1 (Performance budgets)
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface PerformanceBudget {
  resourceType: string;
  budget: number;
  unit: 'KB' | 'MB' | 'count';
  threshold: 'error' | 'warn';
}

interface BundleAnalysis {
  file: string;
  size: number;
  gzipSize?: number;
}

interface BudgetValidationResult {
  passed: boolean;
  violations: BudgetViolation[];
  warnings: BudgetViolation[];
  summary: {
    totalSize: number;
    totalFiles: number;
    largestFile: BundleAnalysis;
  };
}

interface BudgetViolation {
  resourceType: string;
  actual: number;
  budget: number;
  unit: string;
  severity: 'error' | 'warn';
  message: string;
}

// Performance budgets configuration
const PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  // JavaScript budgets
  { resourceType: 'js-total', budget: 500, unit: 'KB', threshold: 'error' },
  { resourceType: 'js-main-chunk', budget: 200, unit: 'KB', threshold: 'error' },
  { resourceType: 'js-vendor-chunk', budget: 300, unit: 'KB', threshold: 'warn' },
  
  // CSS budgets
  { resourceType: 'css-total', budget: 100, unit: 'KB', threshold: 'error' },
  
  // Image budgets
  { resourceType: 'images-total', budget: 1024, unit: 'KB', threshold: 'warn' },
  
  // Total bundle size
  { resourceType: 'bundle-total', budget: 2, unit: 'MB', threshold: 'error' },
  
  // File counts
  { resourceType: 'js-files', budget: 15, unit: 'count', threshold: 'warn' },
  { resourceType: 'css-files', budget: 5, unit: 'count', threshold: 'warn' },
];

class PerformanceBudgetValidator {
  private buildDir: string;
  
  constructor(buildDir: string = '.next') {
    this.buildDir = buildDir;
  }
  
  /**
   * Analyze bundle sizes from Next.js build output
   */
  analyzeBundles(): BundleAnalysis[] {
    const bundles: BundleAnalysis[] = [];
    
    try {
      // Run Next.js build analyzer
      const output = execSync('npm run build -- --profile', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      // Parse build output for bundle sizes
      const sizeRegex = /(\S+)\s+(\d+(?:\.\d+)?)\s*(KB|MB)/gi;
      let match;
      
      while ((match = sizeRegex.exec(output)) !== null) {
        const [, file, size, unit] = match;
        const sizeInKB = unit === 'MB' ? parseFloat(size) * 1024 : parseFloat(size);
        
        bundles.push({
          file,
          size: sizeInKB,
        });
      }
    } catch (error) {
      console.warn('Could not analyze bundles from build output:', error);
    }
    
    return bundles;
  }
  
  /**
   * Calculate total size by resource type
   */
  calculateResourceSizes(bundles: BundleAnalysis[]): Map<string, number> {
    const sizes = new Map<string, number>();
    
    let jsTotal = 0;
    let cssTotal = 0;
    let jsFiles = 0;
    let cssFiles = 0;
    let mainChunkSize = 0;
    let vendorChunkSize = 0;
    
    for (const bundle of bundles) {
      // Skip if bundle doesn't have required properties
      if (!bundle || !bundle.file || typeof bundle.size !== 'number') {
        continue;
      }
      
      if (bundle.file.endsWith('.js')) {
        jsTotal += bundle.size;
        jsFiles++;
        
        if (bundle.file.includes('main')) {
          mainChunkSize = Math.max(mainChunkSize, bundle.size);
        }
        if (bundle.file.includes('vendor') || bundle.file.includes('node_modules')) {
          vendorChunkSize += bundle.size;
        }
      } else if (bundle.file.endsWith('.css')) {
        cssTotal += bundle.size;
        cssFiles++;
      }
    }
    
    sizes.set('js-total', jsTotal);
    sizes.set('css-total', cssTotal);
    sizes.set('js-main-chunk', mainChunkSize);
    sizes.set('js-vendor-chunk', vendorChunkSize);
    sizes.set('bundle-total', (jsTotal + cssTotal) / 1024); // Convert to MB
    sizes.set('js-files', jsFiles);
    sizes.set('css-files', cssFiles);
    
    return sizes;
  }
  
  /**
   * Validate budgets against actual sizes
   */
  validateBudgets(bundles: BundleAnalysis[]): BudgetValidationResult {
    const resourceSizes = this.calculateResourceSizes(bundles);
    const violations: BudgetViolation[] = [];
    const warnings: BudgetViolation[] = [];
    
    for (const budget of PERFORMANCE_BUDGETS) {
      const actual = resourceSizes.get(budget.resourceType) || 0;
      const budgetValue = budget.budget;
      
      if (actual > budgetValue) {
        const violation: BudgetViolation = {
          resourceType: budget.resourceType,
          actual,
          budget: budgetValue,
          unit: budget.unit,
          severity: budget.threshold,
          message: `${budget.resourceType}: ${actual.toFixed(2)}${budget.unit} exceeds budget of ${budgetValue}${budget.unit}`,
        };
        
        if (budget.threshold === 'error') {
          violations.push(violation);
        } else {
          warnings.push(violation);
        }
      }
    }
    
    // Calculate summary
    const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
    const largestFile = bundles.reduce((largest, current) => 
      current.size > largest.size ? current : largest,
      bundles[0] || { file: 'none', size: 0 }
    );
    
    return {
      passed: violations.length === 0,
      violations,
      warnings,
      summary: {
        totalSize,
        totalFiles: bundles.length,
        largestFile,
      },
    };
  }
  
  /**
   * Generate detailed report
   */
  generateReport(result: BudgetValidationResult): string {
    const lines: string[] = [];
    
    lines.push('='.repeat(60));
    lines.push('PERFORMANCE BUDGET VALIDATION REPORT');
    lines.push('='.repeat(60));
    lines.push('');
    
    // Summary
    lines.push('Summary:');
    lines.push(`  Total Size: ${result.summary.totalSize.toFixed(2)} KB`);
    lines.push(`  Total Files: ${result.summary.totalFiles}`);
    lines.push(`  Largest File: ${result.summary.largestFile.file} (${result.summary.largestFile.size.toFixed(2)} KB)`);
    lines.push('');
    
    // Violations
    if (result.violations.length > 0) {
      lines.push('❌ BUDGET VIOLATIONS (Errors):');
      for (const violation of result.violations) {
        lines.push(`  - ${violation.message}`);
        lines.push(`    Overage: ${(violation.actual - violation.budget).toFixed(2)}${violation.unit}`);
      }
      lines.push('');
    }
    
    // Warnings
    if (result.warnings.length > 0) {
      lines.push('⚠️  BUDGET WARNINGS:');
      for (const warning of result.warnings) {
        lines.push(`  - ${warning.message}`);
        lines.push(`    Overage: ${(warning.actual - warning.budget).toFixed(2)}${warning.unit}`);
      }
      lines.push('');
    }
    
    // Overall result
    if (result.passed) {
      lines.push('✅ All performance budgets passed!');
    } else {
      lines.push('❌ Performance budget validation FAILED');
      lines.push(`   ${result.violations.length} error(s), ${result.warnings.length} warning(s)`);
    }
    
    lines.push('='.repeat(60));
    
    return lines.join('\n');
  }
  
  /**
   * Run validation and exit with appropriate code
   */
  async run(): Promise<void> {
    console.log('🔍 Analyzing bundle sizes...\n');
    
    const bundles = this.analyzeBundles();
    
    if (bundles.length === 0) {
      console.warn('⚠️  No bundles found. Make sure to run this after `npm run build`');
      process.exit(1);
    }
    
    console.log(`Found ${bundles.length} bundles\n`);
    
    const result = this.validateBudgets(bundles);
    const report = this.generateReport(result);
    
    console.log(report);
    
    // Exit with error code if validation failed
    if (!result.passed) {
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new PerformanceBudgetValidator();
  validator.run().catch((error) => {
    console.error('Error running performance budget validation:', error);
    process.exit(1);
  });
}

export { PerformanceBudgetValidator, PerformanceBudget, BudgetValidationResult };
