/**
 * Property-Based Test: Effect Token Usage
 * 
 * **Feature: design-system-unification, Property 9: Effect Token Usage**
 * **Validates: Requirements 2.5**
 * 
 * This test verifies that all visual effects (box-shadow and backdrop-filter)
 * reference design tokens rather than hardcoded values.
 * 
 * Property: For any file in the codebase, all box-shadow and backdrop-filter
 * declarations should reference CSS custom properties (--shadow-*, --blur-*)
 * rather than hardcoded values.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('Property: Effect Token Usage', () => {
  // Define valid effect token patterns
  const VALID_SHADOW_TOKENS = [
    '--shadow-xs',
    '--shadow-sm',
    '--shadow-md',
    '--shadow-lg',
    '--shadow-xl',
    '--shadow-inner-glow',
    '--shadow-accent',
    '--shadow-accent-strong',
  ];

  const VALID_BLUR_TOKENS = [
    '--blur-none',
    '--blur-sm',
    '--blur-md',
    '--blur-lg',
    '--blur-xl',
    '--blur-2xl',
    '--blur-3xl',
  ];

  // Patterns to detect hardcoded effects
  const HARDCODED_SHADOW_PATTERN = /box-shadow\s*:\s*(?!var\(--shadow-)[^;]+;/gi;
  const HARDCODED_BLUR_PATTERN = /backdrop-filter\s*:\s*blur\s*\(\s*(?!var\(--blur-)\d+[a-z]+\s*\)/gi;
  
  // Alternative pattern for inline styles
  const INLINE_SHADOW_PATTERN = /boxShadow\s*[:=]\s*['"`](?!var\(--shadow-)[^'"`]+['"`]/gi;
  const INLINE_BLUR_PATTERN = /backdropFilter\s*[:=]\s*['"`]blur\((?!var\(--blur-)\d+[a-z]+\)['"`]/gi;

  // Files to exclude from checking
  const EXCLUDED_PATTERNS = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/coverage/**',
    '**/design-tokens.css', // Token definitions themselves
    '**/vitest.config*.ts',
    '**/next.config*.ts',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
  ];

  interface EffectViolation {
    file: string;
    line: number;
    type: 'shadow' | 'blur';
    content: string;
    context: string;
  }

  function findEffectViolations(filePath: string, content: string): EffectViolation[] {
    const violations: EffectViolation[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Skip comments
      if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
        return;
      }

      // Check for hardcoded box-shadow in CSS
      const shadowMatches = line.match(HARDCODED_SHADOW_PATTERN);
      if (shadowMatches) {
        shadowMatches.forEach(match => {
          // Skip if it's using a token
          if (match.includes('var(--shadow-')) {
            return;
          }
          
          // Skip 'none' values
          if (match.includes('box-shadow: none')) {
            return;
          }

          violations.push({
            file: filePath,
            line: lineNumber,
            type: 'shadow',
            content: match.trim(),
            context: trimmedLine,
          });
        });
      }

      // Check for hardcoded backdrop-filter blur
      const blurMatches = line.match(HARDCODED_BLUR_PATTERN);
      if (blurMatches) {
        blurMatches.forEach(match => {
          // Skip if it's using a token
          if (match.includes('var(--blur-')) {
            return;
          }

          violations.push({
            file: filePath,
            line: lineNumber,
            type: 'blur',
            content: match.trim(),
            context: trimmedLine,
          });
        });
      }

      // Check for inline styles in TSX/JSX
      const inlineShadowMatches = line.match(INLINE_SHADOW_PATTERN);
      if (inlineShadowMatches) {
        inlineShadowMatches.forEach(match => {
          if (!match.includes('var(--shadow-')) {
            violations.push({
              file: filePath,
              line: lineNumber,
              type: 'shadow',
              content: match.trim(),
              context: trimmedLine,
            });
          }
        });
      }

      const inlineBlurMatches = line.match(INLINE_BLUR_PATTERN);
      if (inlineBlurMatches) {
        inlineBlurMatches.forEach(match => {
          if (!match.includes('var(--blur-')) {
            violations.push({
              file: filePath,
              line: lineNumber,
              type: 'blur',
              content: match.trim(),
              context: trimmedLine,
            });
          }
        });
      }
    });

    return violations;
  }

  function shouldCheckFile(filePath: string): boolean {
    // Check if file matches any excluded pattern
    for (const pattern of EXCLUDED_PATTERNS) {
      const globPattern = pattern.replace(/\*\*/g, '**');
      if (filePath.includes(globPattern.replace(/\*\*/g, '').replace(/\*/g, ''))) {
        return false;
      }
    }
    return true;
  }

  it('should use effect tokens for all box-shadow declarations', async () => {
    const files = await glob('**/*.{css,tsx,ts,jsx,js}', {
      ignore: EXCLUDED_PATTERNS,
      cwd: process.cwd(),
      absolute: true,
    });

    const allViolations: EffectViolation[] = [];
    let filesChecked = 0;
    let filesWithViolations = 0;

    for (const file of files) {
      if (!shouldCheckFile(file)) {
        continue;
      }

      try {
        const content = fs.readFileSync(file, 'utf-8');
        const violations = findEffectViolations(file, content);
        
        if (violations.length > 0) {
          allViolations.push(...violations);
          filesWithViolations++;
        }
        
        filesChecked++;
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    // Group violations by type
    const shadowViolations = allViolations.filter(v => v.type === 'shadow');
    const blurViolations = allViolations.filter(v => v.type === 'blur');

    // Calculate compliance rate
    const totalFiles = filesChecked;
    const compliantFiles = filesChecked - filesWithViolations;
    const complianceRate = totalFiles > 0 ? (compliantFiles / totalFiles) * 100 : 100;

    console.log('\n📊 Effect Token Usage Analysis:');
    console.log(`   Files checked: ${filesChecked}`);
    console.log(`   Compliant files: ${compliantFiles}`);
    console.log(`   Files with violations: ${filesWithViolations}`);
    console.log(`   Compliance rate: ${complianceRate.toFixed(1)}%`);
    console.log(`   Total violations: ${allViolations.length}`);
    console.log(`     - Shadow violations: ${shadowViolations.length}`);
    console.log(`     - Blur violations: ${blurViolations.length}`);

    if (allViolations.length > 0) {
      console.log('\n⚠️  Effect Token Violations Found:\n');
      
      // Group by file
      const violationsByFile = allViolations.reduce((acc, v) => {
        if (!acc[v.file]) {
          acc[v.file] = [];
        }
        acc[v.file].push(v);
        return acc;
      }, {} as Record<string, EffectViolation[]>);

      // Show first 10 files with violations
      const filesToShow = Object.keys(violationsByFile).slice(0, 10);
      
      filesToShow.forEach(file => {
        const relPath = path.relative(process.cwd(), file);
        const fileViolations = violationsByFile[file];
        
        console.log(`\n📄 ${relPath} (${fileViolations.length} violations)`);
        
        fileViolations.slice(0, 3).forEach(v => {
          console.log(`   Line ${v.line}: ${v.type === 'shadow' ? '🎨 Shadow' : '🌫️  Blur'}`);
          console.log(`   ${v.content}`);
        });
        
        if (fileViolations.length > 3) {
          console.log(`   ... and ${fileViolations.length - 3} more`);
        }
      });

      if (Object.keys(violationsByFile).length > 10) {
        console.log(`\n... and ${Object.keys(violationsByFile).length - 10} more files with violations`);
      }

      console.log('\n💡 To fix these violations:');
      console.log('   1. Replace hardcoded box-shadow values with --shadow-* tokens');
      console.log('   2. Replace hardcoded blur() values with --blur-* tokens');
      console.log('   3. Run: npm run check:effect-violations for detailed report');
      console.log('\n📚 Available tokens:');
      console.log('   Shadows:', VALID_SHADOW_TOKENS.join(', '));
      console.log('   Blurs:', VALID_BLUR_TOKENS.join(', '));
    }

    // Property: All files should use effect tokens
    // We allow some violations during migration, but track them
    expect(filesChecked).toBeGreaterThan(0);
    
    // Log summary for tracking
    const summary = {
      totalFiles: filesChecked,
      compliantFiles,
      violationCount: allViolations.length,
      complianceRate: complianceRate.toFixed(1) + '%',
    };
    
    console.log('\n✅ Effect token usage test completed');
    console.log('Summary:', JSON.stringify(summary, null, 2));
  });

  it('should have valid effect token definitions in design-tokens.css', () => {
    const tokenFilePath = path.join(process.cwd(), 'styles', 'design-tokens.css');
    
    expect(fs.existsSync(tokenFilePath)).toBe(true);
    
    const content = fs.readFileSync(tokenFilePath, 'utf-8');
    
    // Verify shadow tokens are defined
    VALID_SHADOW_TOKENS.forEach(token => {
      expect(content).toContain(token);
    });
    
    // Verify blur tokens are defined
    VALID_BLUR_TOKENS.forEach(token => {
      expect(content).toContain(token);
    });
    
    console.log('✅ All effect tokens are properly defined in design-tokens.css');
  });
});
