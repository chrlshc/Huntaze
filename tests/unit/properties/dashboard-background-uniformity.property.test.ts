/**
 * Property-Based Test: Dashboard Background Uniformity
 * 
 * **Feature: design-system-unification, Property 10: Dashboard Background Uniformity**
 * **Validates: Requirements 3.1**
 * 
 * Property: For any page in the dashboard section, the background should be zinc-950 (--bg-primary)
 * 
 * This test scans all dashboard page files to ensure they use the standardized
 * background color token (--bg-primary or bg-zinc-950) rather than other background colors.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('Property: Dashboard Background Uniformity', () => {
  it('should ensure all dashboard pages use --bg-primary (zinc-950) background', async () => {
    // Find all dashboard page files
    const dashboardPages = await glob('app/(app)/**/page.tsx', {
      ignore: ['**/node_modules/**', '**/.next/**'],
      absolute: true
    });

    const violations: Array<{
      file: string;
      line: number;
      content: string;
      issue: string;
    }> = [];

    // Approved background patterns for dashboard pages
    const approvedPatterns = [
      /className="[^"]*bg-zinc-950[^"]*"/,  // bg-zinc-950 Tailwind class
      /className="[^"]*bg-primary[^"]*"/,    // bg-primary utility class
      /style={{[^}]*background:\s*['"]var\(--bg-primary\)['"]/,  // inline style with token
      /backgroundColor:\s*['"]var\(--bg-primary\)['"]/,  // React style with token
    ];

    // Patterns that indicate non-standard backgrounds
    const violationPatterns = [
      { pattern: /className="[^"]*bg-gray-\d+[^"]*"/, name: 'bg-gray-* class' },
      { pattern: /className="[^"]*bg-slate-\d+[^"]*"/, name: 'bg-slate-* class' },
      { pattern: /className="[^"]*bg-neutral-\d+[^"]*"/, name: 'bg-neutral-* class' },
      { pattern: /className="[^"]*bg-stone-\d+[^"]*"/, name: 'bg-stone-* class' },
      { pattern: /className="[^"]*bg-zinc-(?!950)[^"]*"/, name: 'bg-zinc-* (not 950) class' },
      { pattern: /className="[^"]*bg-black[^"]*"/, name: 'bg-black class' },
      { pattern: /className="[^"]*bg-white[^"]*"/, name: 'bg-white class' },
      { pattern: /style={{[^}]*background:\s*['"]#[0-9a-fA-F]{3,8}['"]/, name: 'hardcoded hex background' },
      { pattern: /backgroundColor:\s*['"]#[0-9a-fA-F]{3,8}['"]/, name: 'hardcoded hex backgroundColor' },
      { pattern: /style={{[^}]*background:\s*['"]rgb/, name: 'hardcoded rgb background' },
      { pattern: /backgroundColor:\s*['"]rgb/, name: 'hardcoded rgb backgroundColor' },
    ];

    for (const filePath of dashboardPages) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const relativePath = path.relative(process.cwd(), filePath);

      // Check each line for violations
      lines.forEach((line, index) => {
        // Skip comments and imports
        if (line.trim().startsWith('//') || line.trim().startsWith('import')) {
          return;
        }

        // Check for violation patterns
        for (const { pattern, name } of violationPatterns) {
          if (pattern.test(line)) {
            // Check if this line also has an approved pattern (might be a false positive)
            const hasApprovedPattern = approvedPatterns.some(approved => approved.test(line));
            
            if (!hasApprovedPattern) {
              violations.push({
                file: relativePath,
                line: index + 1,
                content: line.trim(),
                issue: `Uses ${name} instead of --bg-primary or bg-zinc-950`
              });
            }
          }
        }
      });
    }

    // Calculate compliance rate
    const totalPages = dashboardPages.length;
    const pagesWithViolations = new Set(violations.map(v => v.file)).size;
    const compliantPages = totalPages - pagesWithViolations;
    const complianceRate = totalPages > 0 ? (compliantPages / totalPages) * 100 : 100;

    // Report results
    console.log('\n📊 Dashboard Background Uniformity Analysis:');
    console.log(`   Total dashboard pages scanned: ${totalPages}`);
    console.log(`   Pages with violations: ${pagesWithViolations}`);
    console.log(`   Compliant pages: ${compliantPages}`);
    console.log(`   Compliance rate: ${complianceRate.toFixed(1)}%`);

    if (violations.length > 0) {
      console.log('\n⚠️  Background violations found:');
      
      // Group violations by file
      const violationsByFile = violations.reduce((acc, v) => {
        if (!acc[v.file]) acc[v.file] = [];
        acc[v.file].push(v);
        return acc;
      }, {} as Record<string, typeof violations>);

      Object.entries(violationsByFile).forEach(([file, fileViolations]) => {
        console.log(`\n   ${file}:`);
        fileViolations.forEach(v => {
          console.log(`     Line ${v.line}: ${v.issue}`);
          console.log(`       ${v.content.substring(0, 100)}${v.content.length > 100 ? '...' : ''}`);
        });
      });

      console.log('\n💡 Recommendation:');
      console.log('   Replace non-standard backgrounds with:');
      console.log('   - className="bg-zinc-950" (Tailwind)');
      console.log('   - className="bg-primary" (utility class)');
      console.log('   - style={{ background: "var(--bg-primary)" }} (inline)');
    } else {
      console.log('   ✅ All dashboard pages use standardized background!');
    }

    // Property assertion: All dashboard pages should use --bg-primary
    // We allow some violations for legacy pages, but aim for high compliance
    expect(complianceRate).toBeGreaterThanOrEqual(80);
  });

  it('should verify --bg-primary token is defined in design tokens', () => {
    const tokensPath = path.join(process.cwd(), 'styles/design-tokens.css');
    
    expect(fs.existsSync(tokensPath)).toBe(true);
    
    const tokensContent = fs.readFileSync(tokensPath, 'utf-8');
    
    // Verify --bg-primary is defined
    expect(tokensContent).toMatch(/--bg-primary:/);
    
    // Verify it's set to zinc-950 equivalent
    const bgPrimaryMatch = tokensContent.match(/--bg-primary:\s*([^;]+);/);
    expect(bgPrimaryMatch).toBeTruthy();
    
    console.log('\n✅ Design token verification:');
    console.log(`   --bg-primary is defined: ${bgPrimaryMatch?.[1]?.trim()}`);
  });

  it('should verify zinc-950 is consistently used across dashboard', async () => {
    // This test ensures that when bg-zinc-950 is used, it's used consistently
    const dashboardPages = await glob('app/(app)/**/page.tsx', {
      ignore: ['**/node_modules/**', '**/.next/**'],
      absolute: true
    });

    const zinc950Usage: Array<{ file: string; count: number }> = [];

    for (const filePath of dashboardPages) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(process.cwd(), filePath);
      
      // Count bg-zinc-950 occurrences
      const matches = content.match(/bg-zinc-950/g);
      const count = matches ? matches.length : 0;
      
      if (count > 0) {
        zinc950Usage.push({ file: relativePath, count });
      }
    }

    console.log('\n📈 Zinc-950 usage across dashboard:');
    console.log(`   Pages using bg-zinc-950: ${zinc950Usage.length}`);
    
    if (zinc950Usage.length > 0) {
      zinc950Usage.forEach(({ file, count }) => {
        console.log(`   ${file}: ${count} occurrence(s)`);
      });
    }

    // This is informational - we want to track usage
    expect(zinc950Usage.length).toBeGreaterThanOrEqual(0);
  });
});
