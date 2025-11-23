#!/usr/bin/env tsx
/**
 * Visual QA Script: Verify Lucide Icon Stroke Width
 * 
 * This script scans the codebase for Lucide icon usage and verifies that:
 * 1. All icons explicitly set strokeWidth={1.5}
 * 2. No icons use the default strokeWidth (which is 2)
 * 3. Reports any violations for manual review
 * 
 * Usage: tsx scripts/verify-icon-stroke-width.ts
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface IconUsage {
  file: string;
  line: number;
  iconName: string;
  hasStrokeWidth: boolean;
  strokeWidthValue?: string;
  code: string;
}

const EXPECTED_STROKE_WIDTH = '1.5';

/**
 * Scan a file for Lucide icon usage
 */
function scanFile(filePath: string): IconUsage[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const usages: IconUsage[] = [];

  // Check if file imports from lucide-react
  const hasLucideImport = content.includes("from 'lucide-react'") || 
                          content.includes('from "lucide-react"');
  
  if (!hasLucideImport) {
    return usages;
  }

  // Extract imported icon names
  const importMatch = content.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/);
  if (!importMatch) {
    return usages;
  }

  const importedIcons = importMatch[1]
    .split(',')
    .map(name => name.trim())
    .filter(name => name && !name.startsWith('type'));

  // Scan for icon usage in JSX
  lines.forEach((line, index) => {
    importedIcons.forEach((iconName) => {
      // Match JSX usage: <IconName ... />
      const jsxPattern = new RegExp(`<${iconName}\\s+([^/>]*)/?>`, 'g');
      const matches = line.matchAll(jsxPattern);

      for (const match of matches) {
        const props = match[1] || '';
        const hasStrokeWidth = props.includes('strokeWidth');
        
        let strokeWidthValue: string | undefined;
        if (hasStrokeWidth) {
          const strokeMatch = props.match(/strokeWidth\s*=\s*{?([^}\s]+)}?/);
          if (strokeMatch) {
            strokeWidthValue = strokeMatch[1].replace(/[{}]/g, '');
          }
        }

        usages.push({
          file: filePath,
          line: index + 1,
          iconName,
          hasStrokeWidth,
          strokeWidthValue,
          code: line.trim(),
        });
      }
    });
  });

  return usages;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Scanning codebase for Lucide icon usage...\n');

  // Find all TypeScript/TSX files
  const files = await glob('**/*.{ts,tsx}', {
    ignore: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
    ],
  });

  console.log(`📁 Found ${files.length} files to scan\n`);

  let allUsages: IconUsage[] = [];
  
  for (const file of files) {
    const usages = scanFile(file);
    allUsages = allUsages.concat(usages);
  }

  console.log(`📊 Found ${allUsages.length} icon usages\n`);

  // Categorize usages
  const withCorrectStrokeWidth = allUsages.filter(
    u => u.hasStrokeWidth && u.strokeWidthValue === EXPECTED_STROKE_WIDTH
  );
  
  const withIncorrectStrokeWidth = allUsages.filter(
    u => u.hasStrokeWidth && u.strokeWidthValue !== EXPECTED_STROKE_WIDTH
  );
  
  const withoutStrokeWidth = allUsages.filter(u => !u.hasStrokeWidth);

  // Report results
  console.log('=== Visual QA Results: Lucide Icon Stroke Width ===\n');
  
  console.log(`✅ Correct (strokeWidth={${EXPECTED_STROKE_WIDTH}}): ${withCorrectStrokeWidth.length}`);
  console.log(`⚠️  Missing strokeWidth prop: ${withoutStrokeWidth.length}`);
  console.log(`❌ Incorrect strokeWidth: ${withIncorrectStrokeWidth.length}\n`);

  // Show violations
  if (withIncorrectStrokeWidth.length > 0) {
    console.log('❌ Icons with incorrect strokeWidth:\n');
    withIncorrectStrokeWidth.forEach(usage => {
      console.log(`  ${usage.file}:${usage.line}`);
      console.log(`    Icon: ${usage.iconName}, strokeWidth: ${usage.strokeWidthValue}`);
      console.log(`    Code: ${usage.code}\n`);
    });
  }

  if (withoutStrokeWidth.length > 0) {
    console.log('⚠️  Icons missing strokeWidth prop (using default 2px):\n');
    
    // Group by file for better readability
    const byFile = withoutStrokeWidth.reduce((acc, usage) => {
      if (!acc[usage.file]) {
        acc[usage.file] = [];
      }
      acc[usage.file].push(usage);
      return acc;
    }, {} as Record<string, IconUsage[]>);

    Object.entries(byFile).forEach(([file, usages]) => {
      console.log(`  📄 ${file} (${usages.length} icons)`);
      usages.slice(0, 3).forEach(usage => {
        console.log(`    Line ${usage.line}: <${usage.iconName} />`);
      });
      if (usages.length > 3) {
        console.log(`    ... and ${usages.length - 3} more`);
      }
      console.log();
    });
  }

  // Summary
  console.log('\n=== Summary ===\n');
  const complianceRate = allUsages.length > 0 
    ? ((withCorrectStrokeWidth.length / allUsages.length) * 100).toFixed(1)
    : '0';
  
  console.log(`Compliance Rate: ${complianceRate}%`);
  console.log(`Total Icons: ${allUsages.length}`);
  console.log(`Compliant: ${withCorrectStrokeWidth.length}`);
  console.log(`Non-Compliant: ${withoutStrokeWidth.length + withIncorrectStrokeWidth.length}`);

  // Recommendations
  if (withoutStrokeWidth.length > 0 || withIncorrectStrokeWidth.length > 0) {
    console.log('\n=== Recommendations ===\n');
    console.log('To fix icons missing strokeWidth, add strokeWidth={1.5} prop:');
    console.log('  Before: <Menu />');
    console.log('  After:  <Menu strokeWidth={1.5} />\n');
    
    console.log('Consider creating a wrapper component for consistent icon styling:');
    console.log('  // components/ui/icon.tsx');
    console.log('  export const Icon = ({ icon: IconComponent, ...props }) => (');
    console.log('    <IconComponent strokeWidth={1.5} {...props} />');
    console.log('  );\n');
  }

  // Exit code
  const hasViolations = withIncorrectStrokeWidth.length > 0;
  if (hasViolations) {
    console.log('❌ Visual QA Failed: Icons with incorrect strokeWidth found');
    process.exit(1);
  } else if (withoutStrokeWidth.length > 0) {
    console.log('⚠️  Visual QA Warning: Icons missing strokeWidth prop');
    console.log('   (These will use the default 2px stroke width)');
    process.exit(0); // Warning, not failure
  } else {
    console.log('✅ Visual QA Passed: All icons use correct strokeWidth');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
