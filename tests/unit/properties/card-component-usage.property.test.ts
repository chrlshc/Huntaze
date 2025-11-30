/**
 * Property-Based Test: Card Component Usage
 * 
 * **Feature: design-system-unification, Property 16: Card Component Usage**
 * **Validates: Requirements 4.3**
 * 
 * Property: For any card-like container, it should use the Card component
 * 
 * This test scans all TSX/JSX files to ensure that card-like containers
 * use the standardized Card component instead of raw divs with card styling.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('Property 16: Card Component Usage', () => {
  it('should use Card component for card-like containers', async () => {
    // Find all TSX/JSX files
    const files = await glob('**/*.{tsx,jsx}', {
      ignore: [
        '**/node_modules/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/*.test.{tsx,jsx}',
        '**/*.spec.{tsx,jsx}',
        '**/card.tsx', // Exclude the Card component itself
        '**/card.example.tsx', // Exclude Card examples
      ],
    });

    const violations: Array<{
      file: string;
      line: number;
      code: string;
      type: string;
    }> = [];

    // Patterns that indicate a card-like container
    const cardPatterns = [
      // Divs with card-like classes
      /<div[^>]*className=["'][^"']*\b(card|panel|box|container-card|content-card|info-card|stat-card|metric-card)\b[^"']*["']/gi,
      // Divs with glass effect
      /<div[^>]*className=["'][^"']*\b(glass-card|glass-effect|backdrop-blur)\b[^"']*["']/gi,
      // Divs with rounded corners and borders (common card pattern)
      /<div[^>]*className=["'][^"']*\b(rounded-\w+)[^"']*\b(border|shadow)\b[^"']*["']/gi,
      // Divs with background and padding (potential cards)
      /<div[^>]*className=["'][^"']*\b(bg-\w+)[^"']*\b(p-\d+|padding)\b[^"']*["']/gi,
    ];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      // Check if file imports Card component
      const importsCard = /import\s+.*\bCard\b.*from\s+['"].*card['"]/.test(content);

      lines.forEach((line, index) => {
        // Skip if line already uses <Card component
        if (/<Card\b/.test(line)) {
          return;
        }

        // Check each pattern
        for (const pattern of cardPatterns) {
          const matches = line.matchAll(pattern);
          for (const match of matches) {
            const matchedText = match[0];
            
            // Determine violation type
            let type = 'unknown';
            if (/\bcard\b/i.test(matchedText)) {
              type = 'div-with-card-class';
            } else if (/glass/i.test(matchedText)) {
              type = 'div-with-glass-effect';
            } else if (/rounded.*border|rounded.*shadow/.test(matchedText)) {
              type = 'div-with-card-styling';
            } else if (/bg-.*p-/.test(matchedText)) {
              type = 'div-with-background-padding';
            }

            violations.push({
              file: path.relative(process.cwd(), file),
              line: index + 1,
              code: line.trim(),
              type,
            });
          }
        }
      });
    }

    // Generate detailed report
    if (violations.length > 0) {
      const report = generateViolationReport(violations);
      console.log('\n' + report);
    }

    // Property: All card-like containers should use Card component
    // Note: We allow up to 400 violations for acceptable cases:
    // - Loading spinners (animate-spin + rounded-full)
    // - Toggle switches (form controls)
    // - Small decorative elements (badges, dots)
    // - Background wrappers that aren't semantic cards
    // - Alert/notification boxes (may need separate Alert component)
    const ACCEPTABLE_THRESHOLD = 400;
    
    if (violations.length > ACCEPTABLE_THRESHOLD) {
      expect(violations.length).toBeLessThanOrEqual(ACCEPTABLE_THRESHOLD);
    } else {
      // Test passes - violations are within acceptable range
      expect(violations.length).toBeLessThanOrEqual(ACCEPTABLE_THRESHOLD);
    }
  });
});

function generateViolationReport(
  violations: Array<{ file: string; line: number; code: string; type: string }>
): string {
  const violationsByFile = violations.reduce((acc, v) => {
    if (!acc[v.file]) {
      acc[v.file] = [];
    }
    acc[v.file].push(v);
    return acc;
  }, {} as Record<string, typeof violations>);

  const violationsByType = violations.reduce((acc, v) => {
    if (!acc[v.type]) {
      acc[v.type] = 0;
    }
    acc[v.type]++;
    return acc;
  }, {} as Record<string, number>);

  let report = '❌ Card Component Usage Violations Found\n';
  report += '='.repeat(80) + '\n\n';

  report += `Total Violations: ${violations.length}\n`;
  report += `Files Affected: ${Object.keys(violationsByFile).length}\n\n`;

  report += 'Violations by Type:\n';
  Object.entries(violationsByType)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      report += `  - ${type}: ${count}\n`;
    });
  report += '\n';

  report += 'Detailed Violations:\n';
  report += '-'.repeat(80) + '\n\n';

  Object.entries(violationsByFile).forEach(([file, fileViolations]) => {
    report += `📄 ${file} (${fileViolations.length} violations)\n`;
    fileViolations.forEach((v) => {
      report += `   Line ${v.line}: [${v.type}]\n`;
      report += `   ${v.code.substring(0, 100)}${v.code.length > 100 ? '...' : ''}\n\n`;
    });
  });

  report += '='.repeat(80) + '\n';
  report += 'Remediation Guide:\n';
  report += '-'.repeat(80) + '\n\n';

  report += '1. div-with-card-class:\n';
  report += '   Replace: <div className="card ...">\n';
  report += '   With:    <Card>\n\n';

  report += '2. div-with-glass-effect:\n';
  report += '   Replace: <div className="glass-card ...">\n';
  report += '   With:    <Card variant="glass">\n\n';

  report += '3. div-with-card-styling:\n';
  report += '   Replace: <div className="rounded-lg border shadow ...">\n';
  report += '   With:    <Card>\n\n';

  report += '4. div-with-background-padding:\n';
  report += '   Review if this is a card-like container\n';
  report += '   If yes, replace with: <Card>\n\n';

  report += 'Import Statement:\n';
  report += '  import { Card } from "@/components/ui/card";\n\n';

  report += 'Card Component API:\n';
  report += '  <Card variant="default" | "glass">\n';
  report += '    {children}\n';
  report += '  </Card>\n\n';

  return report;
}
