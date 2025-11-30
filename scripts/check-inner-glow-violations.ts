#!/usr/bin/env ts-node
/**
 * Inner Glow Violations Checker
 * 
 * Scans the codebase for hardcoded inner glow effects that should use --shadow-inner-glow token
 * 
 * Usage:
 *   npm run check:inner-glow-violations
 *   or
 *   ts-node scripts/check-inner-glow-violations.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Violation {
  file: string;
  line: number;
  content: string;
  pattern: string;
  severity: 'high' | 'medium' | 'low';
}

// Patterns that indicate inner glow violations
const VIOLATION_PATTERNS = {
  // CSS inset box-shadow with hardcoded values
  cssInsetShadow: /box-shadow:\s*inset\s+[^;]*(?!var\(--shadow-inner-glow\))[^;]*;/gi,
  
  // Tailwind arbitrary inset shadow values
  tailwindInsetShadow: /shadow-\[inset[^\]]+\]/g,
  
  // React inline style with inset box-shadow
  reactInsetShadow: /boxShadow:\s*['"]inset\s+[^'"]+['"]/g,
  
  // Common hardcoded inner glow patterns
  hardcodedInnerGlow: /inset\s+0\s+1px\s+0\s+0\s+rgba\(255,\s*255,\s*255,\s*0\.0[0-9]\)/gi,
};

/**
 * Scan a file for inner glow violations
 */
function scanFileForViolations(filePath: string): Violation[] {
  const violations: Violation[] = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Skip design-tokens.css as it contains the token definitions
    if (relativePath.includes('design-tokens.css')) {
      return violations;
    }
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check for hardcoded inset box-shadow in CSS
      if (VIOLATION_PATTERNS.cssInsetShadow.test(line)) {
        violations.push({
          file: relativePath,
          line: lineNumber,
          content: line.trim(),
          pattern: 'CSS hardcoded inset box-shadow',
          severity: 'high',
        });
      }
      
      // Check for Tailwind arbitrary inset shadow
      if (VIOLATION_PATTERNS.tailwindInsetShadow.test(line)) {
        violations.push({
          file: relativePath,
          line: lineNumber,
          content: line.trim(),
          pattern: 'Tailwind arbitrary inset shadow',
          severity: 'high',
        });
      }
      
      // Check for React inline inset shadow
      if (VIOLATION_PATTERNS.reactInsetShadow.test(line)) {
        violations.push({
          file: relativePath,
          line: lineNumber,
          content: line.trim(),
          pattern: 'React inline inset shadow',
          severity: 'high',
        });
      }
      
      // Check for common hardcoded inner glow pattern
      if (VIOLATION_PATTERNS.hardcodedInnerGlow.test(line)) {
        violations.push({
          file: relativePath,
          line: lineNumber,
          content: line.trim(),
          pattern: 'Hardcoded inner glow (should use --shadow-inner-glow)',
          severity: 'high',
        });
      }
    });
    
  } catch (error) {
    // Skip files that can't be read
  }
  
  return violations;
}

/**
 * Get all relevant files to scan
 */
async function getFilesToScan(): Promise<string[]> {
  const patterns = [
    'app/**/*.{ts,tsx,css}',
    'components/**/*.{ts,tsx,css}',
    'styles/**/*.css',
    'lib/**/*.{ts,tsx}',
  ];
  
  const allFiles: string[] = [];
  
  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: process.cwd(),
      ignore: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
      ],
    });
    allFiles.push(...files);
  }
  
  return [...new Set(allFiles)];
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Scanning codebase for inner glow violations...\n');
  
  const files = await getFilesToScan();
  const allViolations: Violation[] = [];
  
  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    const violations = scanFileForViolations(filePath);
    allViolations.push(...violations);
  }
  
  // Group violations by file
  const violationsByFile = new Map<string, Violation[]>();
  allViolations.forEach(v => {
    if (!violationsByFile.has(v.file)) {
      violationsByFile.set(v.file, []);
    }
    violationsByFile.get(v.file)!.push(v);
  });
  
  // Generate report
  console.log('='.repeat(80));
  console.log('INNER GLOW CONSISTENCY VIOLATIONS REPORT');
  console.log('='.repeat(80));
  console.log('');
  
  console.log('📊 Summary:');
  console.log(`   Total files scanned: ${files.length}`);
  console.log(`   Files with violations: ${violationsByFile.size}`);
  console.log(`   Total violations: ${allViolations.length}`);
  console.log(`   Compliance rate: ${((1 - violationsByFile.size / files.length) * 100).toFixed(1)}%`);
  console.log('');
  
  // Group by severity
  const bySeverity = {
    high: allViolations.filter(v => v.severity === 'high'),
    medium: allViolations.filter(v => v.severity === 'medium'),
    low: allViolations.filter(v => v.severity === 'low'),
  };
  
  console.log('📈 By Severity:');
  console.log(`   High:   ${bySeverity.high.length} violations`);
  console.log(`   Medium: ${bySeverity.medium.length} violations`);
  console.log(`   Low:    ${bySeverity.low.length} violations`);
  console.log('');
  
  if (violationsByFile.size > 0) {
    // Show top violators
    const sortedFiles = Array.from(violationsByFile.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 15);
    
    console.log('🔥 Top 15 Files with Violations:');
    console.log('');
    sortedFiles.forEach(([file, violations], index) => {
      console.log(`${index + 1}. ${file}`);
      console.log(`   Violations: ${violations.length}`);
      
      // Show first 3 violations
      violations.slice(0, 3).forEach(v => {
        console.log(`   Line ${v.line}: ${v.pattern}`);
        console.log(`     ${v.content.substring(0, 70)}${v.content.length > 70 ? '...' : ''}`);
      });
      
      if (violations.length > 3) {
        console.log(`   ... and ${violations.length - 3} more violations`);
      }
      console.log('');
    });
    
    // Categorize by file type
    const byFileType = {
      tsx: allViolations.filter(v => v.file.endsWith('.tsx')),
      ts: allViolations.filter(v => v.file.endsWith('.ts') && !v.file.endsWith('.tsx')),
      css: allViolations.filter(v => v.file.endsWith('.css')),
    };
    
    console.log('📁 By File Type:');
    console.log(`   TSX files:  ${byFileType.tsx.length} violations`);
    console.log(`   TS files:   ${byFileType.ts.length} violations`);
    console.log(`   CSS files:  ${byFileType.css.length} violations`);
    console.log('');
    
    // Remediation guide
    console.log('='.repeat(80));
    console.log('REMEDIATION GUIDE');
    console.log('='.repeat(80));
    console.log('');
    console.log('✅ APPROVED PATTERNS:');
    console.log('');
    console.log('1. CSS with design token:');
    console.log('   box-shadow: var(--shadow-inner-glow);');
    console.log('');
    console.log('2. Tailwind utility class:');
    console.log('   className="glass"');
    console.log('   className="glass-card"');
    console.log('');
    console.log('3. React inline style with token:');
    console.log('   style={{ boxShadow: "var(--shadow-inner-glow)" }}');
    console.log('');
    console.log('❌ AVOID THESE PATTERNS:');
    console.log('');
    console.log('1. Hardcoded CSS inset shadow:');
    console.log('   box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.05);');
    console.log('');
    console.log('2. Tailwind arbitrary inset shadow:');
    console.log('   className="shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"');
    console.log('');
    console.log('3. React inline hardcoded:');
    console.log('   style={{ boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.05)" }}');
    console.log('');
    console.log('='.repeat(80));
    console.log('');
    console.log('💡 Token Definition:');
    console.log('   --shadow-inner-glow: inset 0 1px 0 0 rgba(255, 255, 255, 0.05);');
    console.log('   Location: styles/design-tokens.css');
    console.log('');
    console.log('📚 Documentation:');
    console.log('   See .kiro/specs/design-system-unification/design.md');
    console.log('   Property 12: Inner Glow Consistency');
    console.log('');
  } else {
    console.log('✅ No violations found! All inner glow effects use --shadow-inner-glow token.');
    console.log('');
  }
  
  // Exit with appropriate code
  if (allViolations.length > 0) {
    console.log(`⚠️  Found ${allViolations.length} violations that need attention.`);
    process.exit(1);
  } else {
    console.log('✅ All checks passed!');
    process.exit(0);
  }
}

// Run the script
main().catch(error => {
  console.error('Error running inner glow violations checker:', error);
  process.exit(1);
});
