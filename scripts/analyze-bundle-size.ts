#!/usr/bin/env ts-node
/**
 * Bundle Size Analysis Script
 * 
 * Identifies components that exceed the 50KB threshold and should be lazy loaded.
 * This script analyzes the codebase to find heavy components like charts, editors,
 * and 3D libraries.
 * 
 * Requirements: 7.1, 7.4
 */

import * as fs from 'fs';
import * as path from 'path';

interface ComponentAnalysis {
  path: string;
  estimatedSizeKB: number;
  imports: string[];
  shouldLazyLoad: boolean;
  reason: string;
}

// Heavy libraries and their estimated sizes
const HEAVY_LIBRARIES: Record<string, number> = {
  '@react-three/fiber': 150,
  '@react-three/drei': 200,
  'three': 600,
  'react-chartjs-2': 100,
  'chart.js': 200,
  '@tiptap/react': 80,
  '@tiptap/starter-kit': 50,
  'framer-motion': 100,
};

const LAZY_LOAD_THRESHOLD = 50; // KB

function analyzeFile(filePath: string): ComponentAnalysis | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const imports: string[] = [];
    let estimatedSize = 0;

    // Extract imports
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      imports.push(importPath);

      // Check if it's a heavy library
      for (const [lib, size] of Object.entries(HEAVY_LIBRARIES)) {
        if (importPath.includes(lib)) {
          estimatedSize += size;
        }
      }
    }

    // Add base component size estimate
    const lines = content.split('\n').length;
    estimatedSize += Math.ceil(lines / 10); // Rough estimate: 10 lines = 1KB

    const shouldLazyLoad = estimatedSize > LAZY_LOAD_THRESHOLD;
    const reason = shouldLazyLoad
      ? `Estimated size: ${estimatedSize}KB (threshold: ${LAZY_LOAD_THRESHOLD}KB)`
      : 'Below threshold';

    return {
      path: filePath,
      estimatedSizeKB: estimatedSize,
      imports,
      shouldLazyLoad,
      reason,
    };
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);
    return null;
  }
}

function findComponentFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip node_modules, .next, and other build directories
    if (
      entry.name === 'node_modules' ||
      entry.name === '.next' ||
      entry.name === 'dist' ||
      entry.name === 'build' ||
      entry.name.startsWith('.')
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      findComponentFiles(fullPath, files);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) &&
      !entry.name.endsWith('.test.tsx') &&
      !entry.name.endsWith('.test.ts')
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function main() {
  console.log('🔍 Analyzing bundle sizes...\n');

  const componentsDir = path.join(process.cwd(), 'components');
  const appDir = path.join(process.cwd(), 'app');

  const componentFiles = [
    ...findComponentFiles(componentsDir),
    ...findComponentFiles(appDir),
  ];

  const analyses: ComponentAnalysis[] = [];

  for (const file of componentFiles) {
    const analysis = analyzeFile(file);
    if (analysis) {
      analyses.push(analysis);
    }
  }

  // Sort by size descending
  analyses.sort((a, b) => b.estimatedSizeKB - a.estimatedSizeKB);

  // Filter components that should be lazy loaded
  const heavyComponents = analyses.filter(a => a.shouldLazyLoad);

  console.log('📊 Heavy Components (>50KB) that should be lazy loaded:\n');
  console.log('─'.repeat(80));

  for (const component of heavyComponents) {
    const relativePath = path.relative(process.cwd(), component.path);
    console.log(`\n📦 ${relativePath}`);
    console.log(`   Size: ${component.estimatedSizeKB}KB`);
    console.log(`   Reason: ${component.reason}`);
    
    const heavyImports = component.imports.filter(imp =>
      Object.keys(HEAVY_LIBRARIES).some(lib => imp.includes(lib))
    );
    
    if (heavyImports.length > 0) {
      console.log(`   Heavy imports: ${heavyImports.join(', ')}`);
    }
  }

  console.log('\n' + '─'.repeat(80));
  console.log(`\n✅ Found ${heavyComponents.length} components that should be lazy loaded`);
  console.log(`📈 Total estimated size: ${heavyComponents.reduce((sum, c) => sum + c.estimatedSizeKB, 0)}KB`);

  // Generate report file
  const report = {
    timestamp: new Date().toISOString(),
    threshold: LAZY_LOAD_THRESHOLD,
    totalComponents: analyses.length,
    heavyComponents: heavyComponents.length,
    components: heavyComponents.map(c => ({
      path: path.relative(process.cwd(), c.path),
      sizeKB: c.estimatedSizeKB,
      imports: c.imports.filter(imp =>
        Object.keys(HEAVY_LIBRARIES).some(lib => imp.includes(lib))
      ),
    })),
  };

  const reportPath = path.join(process.cwd(), '.kiro/reports/bundle-analysis.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n📄 Report saved to: ${reportPath}`);
}

if (require.main === module) {
  main();
}

export { analyzeFile, findComponentFiles, HEAVY_LIBRARIES, LAZY_LOAD_THRESHOLD };
