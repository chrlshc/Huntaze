#!/usr/bin/env tsx
/**
 * Component Analyzer Script for Codebase Cleanup
 * 
 * This script analyzes components to identify:
 * - Duplicate shadow effect components
 * - Neon canvas component variants
 * - Atomic background component duplicates
 * - Debug components in production directories
 * 
 * Generates: component-consolidation-plan.md
 */

import * as fs from 'fs';
import * as path from 'path';

interface Component {
  path: string;
  name: string;
  size: number;
  category: 'shadow' | 'neon' | 'atomic' | 'debug' | 'other';
}

interface ComponentGroup {
  category: string;
  components: Component[];
  recommendation: string;
  targetFile: string;
}

interface AnalysisResults {
  shadowEffects: Component[];
  neonCanvas: Component[];
  atomicBackground: Component[];
  debugComponents: Component[];
  totalSize: number;
}

const COMPONENT_DIRS = ['app/components', 'components', 'app'];
const EXCLUDE_DIRS = ['node_modules', '.next', 'dist', 'build', 'tests', 'test'];

// Patterns to identify component types
const SHADOW_PATTERNS = [
  /shadow.*effect/i,
  /.*shadow.*effect/i,
  /basic.*shadow/i,
  /perfect.*shadow/i,
  /huntaze.*shadow/i,
  /eminence.*shadow/i,
  /exact.*shadow/i,
];

const NEON_PATTERNS = [
  /neon.*canvas/i,
  /.*neon.*canvas/i,
  /optimized.*neon/i,
  /simple.*neon/i,
];

const ATOMIC_PATTERNS = [
  /atomic.*background/i,
  /.*atomic.*effect/i,
  /simple.*atomic/i,
  /i.*am.*atomic/i,
];

const DEBUG_PATTERNS = [
  /debug/i,
  /test(?!ing)/i, // Match 'test' but not 'testing'
  /demo/i,
];

/**
 * Categorize component by name
 */
function categorizeComponent(filename: string): 'shadow' | 'neon' | 'atomic' | 'debug' | 'other' {
  if (SHADOW_PATTERNS.some(p => p.test(filename))) return 'shadow';
  if (NEON_PATTERNS.some(p => p.test(filename))) return 'neon';
  if (ATOMIC_PATTERNS.some(p => p.test(filename))) return 'atomic';
  if (DEBUG_PATTERNS.some(p => p.test(filename))) return 'debug';
  return 'other';
}

/**
 * Scan directory for components
 */
function scanForComponents(
  dir: string,
  results: Component[],
  rootDir: string = dir
): void {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !EXCLUDE_DIRS.includes(entry.name)) {
        scanForComponents(fullPath, results, rootDir);
      } else if (entry.isFile() && /\.(tsx|jsx)$/.test(entry.name)) {
        const category = categorizeComponent(entry.name);
        if (category !== 'other') {
          const stats = fs.statSync(fullPath);
          const relativePath = path.relative(rootDir, fullPath);
          
          results.push({
            path: relativePath,
            name: entry.name,
            size: stats.size,
            category,
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }
}

/**
 * Format file size
 */
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Generate consolidation plan report
 */
function generateReport(results: AnalysisResults): string {
  const lines: string[] = [];

  lines.push('# Component Consolidation Plan');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Shadow effect components**: ${results.shadowEffects.length}`);
  lines.push(`- **Neon canvas components**: ${results.neonCanvas.length}`);
  lines.push(`- **Atomic background components**: ${results.atomicBackground.length}`);
  lines.push(`- **Debug components**: ${results.debugComponents.length}`);
  lines.push(`- **Total size**: ${formatSize(results.totalSize)}`);
  lines.push('');

  // Shadow Effects Section
  lines.push('## Shadow Effect Components');
  lines.push('');
  if (results.shadowEffects.length === 0) {
    lines.push('✅ No duplicate shadow effect components found.');
  } else {
    lines.push(`Found **${results.shadowEffects.length}** shadow effect component variants:`);
    lines.push('');
    lines.push('| Component | Path | Size |');
    lines.push('|-----------|------|------|');
    for (const comp of results.shadowEffects) {
      lines.push(`| ${comp.name} | ${comp.path} | ${formatSize(comp.size)} |`);
    }
    lines.push('');
    lines.push('**Consolidation Strategy:**');
    lines.push('');
    lines.push('1. Review all shadow effect components');
    lines.push('2. Identify the most optimized version (likely `HuntazeShadowEffect.tsx`)');
    lines.push('3. Create `components/effects/ShadowEffect.tsx` with variant props');
    lines.push('4. Add TypeScript types for variant options');
    lines.push('5. Update all imports to use the consolidated component');
    lines.push('6. Remove old shadow effect component files');
    lines.push('');
    lines.push('**Target:** `components/effects/ShadowEffect.tsx`');
  }
  lines.push('');

  // Neon Canvas Section
  lines.push('## Neon Canvas Components');
  lines.push('');
  if (results.neonCanvas.length === 0) {
    lines.push('✅ No duplicate neon canvas components found.');
  } else {
    lines.push(`Found **${results.neonCanvas.length}** neon canvas component variants:`);
    lines.push('');
    lines.push('| Component | Path | Size |');
    lines.push('|-----------|------|------|');
    for (const comp of results.neonCanvas) {
      lines.push(`| ${comp.name} | ${comp.path} | ${formatSize(comp.size)} |`);
    }
    lines.push('');
    lines.push('**Consolidation Strategy:**');
    lines.push('');
    lines.push('1. Keep `OptimizedNeonCanvas.tsx` as the production version');
    lines.push('2. Create `components/effects/NeonCanvas.tsx`');
    lines.push('3. Remove `SimpleNeonCanvas.tsx` and `SimpleNeonTest.tsx`');
    lines.push('4. Update all imports to use new location');
    lines.push('');
    lines.push('**Target:** `components/effects/NeonCanvas.tsx`');
  }
  lines.push('');

  // Atomic Background Section
  lines.push('## Atomic Background Components');
  lines.push('');
  if (results.atomicBackground.length === 0) {
    lines.push('✅ No duplicate atomic background components found.');
  } else {
    lines.push(`Found **${results.atomicBackground.length}** atomic background component variants:`);
    lines.push('');
    lines.push('| Component | Path | Size |');
    lines.push('|-----------|------|------|');
    for (const comp of results.atomicBackground) {
      lines.push(`| ${comp.name} | ${comp.path} | ${formatSize(comp.size)} |`);
    }
    lines.push('');
    lines.push('**Consolidation Strategy:**');
    lines.push('');
    lines.push('1. Identify production-ready atomic background component');
    lines.push('2. Create `components/effects/AtomicBackground.tsx`');
    lines.push('3. Remove test and simple variants');
    lines.push('4. Update all imports');
    lines.push('');
    lines.push('**Target:** `components/effects/AtomicBackground.tsx`');
  }
  lines.push('');

  // Debug Components Section
  lines.push('## Debug Components in Production');
  lines.push('');
  if (results.debugComponents.length === 0) {
    lines.push('✅ No debug components found in production directories.');
  } else {
    lines.push(`Found **${results.debugComponents.length}** debug/test components in production directories:`);
    lines.push('');
    lines.push('| Component | Path | Size |');
    lines.push('|-----------|------|------|');
    for (const comp of results.debugComponents) {
      lines.push(`| ${comp.name} | ${comp.path} | ${formatSize(comp.size)} |`);
    }
    lines.push('');
    lines.push('**Consolidation Strategy:**');
    lines.push('');
    lines.push('1. Create `components/debug/` directory');
    lines.push('2. Move all debug components to debug directory');
    lines.push('3. Update imports in files using debug components');
    lines.push('4. Add `README.md` in debug directory explaining purpose');
    lines.push('5. Consider adding environment checks to prevent debug components in production builds');
    lines.push('');
    lines.push('**Target:** `components/debug/`');
  }
  lines.push('');

  // Component Organization
  lines.push('## Recommended Component Structure');
  lines.push('');
  lines.push('```');
  lines.push('components/');
  lines.push('├── effects/');
  lines.push('│   ├── ShadowEffect.tsx       (consolidated from 7 variants)');
  lines.push('│   ├── NeonCanvas.tsx          (optimized version)');
  lines.push('│   ├── AtomicBackground.tsx    (production version)');
  lines.push('│   └── index.ts                (barrel exports)');
  lines.push('├── debug/');
  lines.push('│   ├── DebugLogin.tsx');
  lines.push('│   ├── DebugAtomicEffect.tsx');
  lines.push('│   ├── DebugWrapper.tsx');
  lines.push('│   ├── HydrationDebugPanel.tsx');
  lines.push('│   ├── index.ts                (barrel exports)');
  lines.push('│   └── README.md               (documentation)');
  lines.push('└── dashboard/                  (existing, keep as-is)');
  lines.push('```');
  lines.push('');

  // Implementation Steps
  lines.push('## Implementation Steps');
  lines.push('');
  lines.push('### Phase 1: Shadow Effects Consolidation');
  lines.push('');
  lines.push('1. Create `components/effects/` directory');
  lines.push('2. Review all shadow effect components and identify best implementation');
  lines.push('3. Create unified `ShadowEffect.tsx` with variant props:');
  lines.push('   ```typescript');
  lines.push('   type ShadowVariant = "basic" | "perfect" | "huntaze" | "eminence" | "exact";');
  lines.push('   interface ShadowEffectProps {');
  lines.push('     variant?: ShadowVariant;');
  lines.push('     intensity?: number;');
  lines.push('     // ... other props');
  lines.push('   }');
  lines.push('   ```');
  lines.push('4. Update all imports across codebase');
  lines.push('5. Remove old component files');
  lines.push('');

  lines.push('### Phase 2: Neon Canvas Consolidation');
  lines.push('');
  lines.push('1. Copy `OptimizedNeonCanvas.tsx` to `components/effects/NeonCanvas.tsx`');
  lines.push('2. Update all imports');
  lines.push('3. Remove old files');
  lines.push('');

  lines.push('### Phase 3: Atomic Background Consolidation');
  lines.push('');
  lines.push('1. Identify production-ready version');
  lines.push('2. Move to `components/effects/AtomicBackground.tsx`');
  lines.push('3. Update imports');
  lines.push('4. Remove duplicates');
  lines.push('');

  lines.push('### Phase 4: Debug Components Organization');
  lines.push('');
  lines.push('1. Create `components/debug/` directory');
  lines.push('2. Move all debug components');
  lines.push('3. Create barrel export (`index.ts`)');
  lines.push('4. Add `README.md` with usage guidelines');
  lines.push('5. Update imports');
  lines.push('');

  lines.push('### Phase 5: Create Barrel Exports');
  lines.push('');
  lines.push('1. Create `components/effects/index.ts`:');
  lines.push('   ```typescript');
  lines.push('   export { ShadowEffect } from "./ShadowEffect";');
  lines.push('   export { NeonCanvas } from "./NeonCanvas";');
  lines.push('   export { AtomicBackground } from "./AtomicBackground";');
  lines.push('   ```');
  lines.push('2. Create `components/debug/index.ts` with all debug exports');
  lines.push('');

  // Savings Estimate
  lines.push('## Estimated Savings');
  lines.push('');
  const shadowSize = results.shadowEffects.reduce((sum, c) => sum + c.size, 0);
  const neonSize = results.neonCanvas.reduce((sum, c) => sum + c.size, 0);
  const atomicSize = results.atomicBackground.reduce((sum, c) => sum + c.size, 0);
  
  lines.push(`- **Shadow effects**: ${formatSize(shadowSize)} → ~${formatSize(shadowSize / results.shadowEffects.length)} (keep 1 of ${results.shadowEffects.length})`);
  lines.push(`- **Neon canvas**: ${formatSize(neonSize)} → ~${formatSize(neonSize / results.neonCanvas.length)} (keep 1 of ${results.neonCanvas.length})`);
  lines.push(`- **Atomic background**: ${formatSize(atomicSize)} → ~${formatSize(atomicSize / results.atomicBackground.length)} (keep 1 of ${results.atomicBackground.length})`);
  lines.push('');
  
  const totalSavings = shadowSize + neonSize + atomicSize;
  const estimatedFinal = totalSavings / (results.shadowEffects.length + results.neonCanvas.length + results.atomicBackground.length) * 3;
  lines.push(`**Total potential savings**: ~${formatSize(totalSavings - estimatedFinal)}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Main execution
 */
function main() {
  console.log('🧩 Analyzing components for consolidation opportunities...\n');

  const rootDir = process.cwd();
  const allComponents: Component[] = [];

  // Scan for components
  for (const dir of COMPONENT_DIRS) {
    const fullPath = path.join(rootDir, dir);
    if (fs.existsSync(fullPath)) {
      scanForComponents(fullPath, allComponents, rootDir);
    }
  }

  // Categorize components
  const shadowEffects = allComponents.filter(c => c.category === 'shadow');
  const neonCanvas = allComponents.filter(c => c.category === 'neon');
  const atomicBackground = allComponents.filter(c => c.category === 'atomic');
  const debugComponents = allComponents.filter(c => c.category === 'debug');

  const totalSize = allComponents.reduce((sum, c) => sum + c.size, 0);

  const results: AnalysisResults = {
    shadowEffects,
    neonCanvas,
    atomicBackground,
    debugComponents,
    totalSize,
  };

  // Generate report
  const report = generateReport(results);
  const reportPath = path.join(rootDir, 'component-consolidation-plan.md');
  fs.writeFileSync(reportPath, report, 'utf-8');

  // Print summary
  console.log('✅ Analysis complete!\n');
  console.log('Summary:');
  console.log(`  - Shadow effects: ${shadowEffects.length}`);
  console.log(`  - Neon canvas: ${neonCanvas.length}`);
  console.log(`  - Atomic background: ${atomicBackground.length}`);
  console.log(`  - Debug components: ${debugComponents.length}`);
  console.log(`  - Total size: ${formatSize(totalSize)}\n`);
  console.log(`📄 Report generated: ${reportPath}`);
}

// Run the script
main();
