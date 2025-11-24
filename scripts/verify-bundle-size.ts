#!/usr/bin/env tsx
/**
 * Bundle Size Verification Script
 * 
 * Verifies that initial JS bundles remain under 200KB as per Requirement 2.5
 * This script analyzes the Next.js build output and checks bundle sizes.
 * 
 * Usage:
 *   npm run build && tsx scripts/verify-bundle-size.ts
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const MAX_BUNDLE_SIZE_KB = 200;
const MAX_BUNDLE_SIZE_BYTES = MAX_BUNDLE_SIZE_KB * 1024;

interface BundleInfo {
  name: string;
  size: number;
  sizeKB: number;
  path: string;
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function analyzeBuildManifest(): BundleInfo[] {
  const buildDir = join(process.cwd(), '.next');
  const staticDir = join(buildDir, 'static', 'chunks');
  
  if (!readdirSync(buildDir).includes('static')) {
    console.error('❌ Build directory not found. Please run `npm run build` first.');
    process.exit(1);
  }

  const bundles: BundleInfo[] = [];
  
  // Analyze main chunks
  const chunkFiles = readdirSync(staticDir).filter(file => 
    file.endsWith('.js') && !file.includes('.map')
  );

  for (const file of chunkFiles) {
    const filePath = join(staticDir, file);
    const stats = statSync(filePath);
    
    bundles.push({
      name: file,
      size: stats.size,
      sizeKB: stats.size / 1024,
      path: filePath,
    });
  }

  // Also check pages directory for initial page bundles
  const pagesDir = join(buildDir, 'static', 'chunks', 'pages');
  if (readdirSync(staticDir).includes('pages')) {
    const pageFiles = readdirSync(pagesDir).filter(file => 
      file.endsWith('.js') && !file.includes('.map')
    );

    for (const file of pageFiles) {
      const filePath = join(pagesDir, file);
      const stats = statSync(filePath);
      
      bundles.push({
        name: `pages/${file}`,
        size: stats.size,
        sizeKB: stats.size / 1024,
        path: filePath,
      });
    }
  }

  return bundles;
}

function main() {
  console.log('🔍 Analyzing bundle sizes...\n');

  const bundles = analyzeBuildManifest();
  
  // Sort by size descending
  bundles.sort((a, b) => b.size - a.size);

  // Identify initial bundles (main framework chunks)
  const initialBundles = bundles.filter(bundle => 
    bundle.name.includes('main') || 
    bundle.name.includes('framework') ||
    bundle.name.includes('webpack') ||
    bundle.name === 'pages/_app.js' ||
    bundle.name === 'pages/index.js'
  );

  console.log('📦 Initial Bundle Analysis:');
  console.log('─'.repeat(70));
  
  let hasViolations = false;
  let totalInitialSize = 0;

  for (const bundle of initialBundles) {
    totalInitialSize += bundle.size;
    const status = bundle.size > MAX_BUNDLE_SIZE_BYTES ? '❌' : '✅';
    const warning = bundle.size > MAX_BUNDLE_SIZE_BYTES 
      ? ` (EXCEEDS ${MAX_BUNDLE_SIZE_KB}KB LIMIT!)` 
      : '';
    
    console.log(`${status} ${bundle.name.padEnd(40)} ${formatBytes(bundle.size)}${warning}`);
    
    if (bundle.size > MAX_BUNDLE_SIZE_BYTES) {
      hasViolations = true;
    }
  }

  console.log('─'.repeat(70));
  console.log(`📊 Total Initial Bundle Size: ${formatBytes(totalInitialSize)}`);
  console.log(`🎯 Target: Each bundle < ${MAX_BUNDLE_SIZE_KB}KB\n`);

  // Show top 10 largest bundles overall
  console.log('📊 Top 10 Largest Bundles:');
  console.log('─'.repeat(70));
  
  for (const bundle of bundles.slice(0, 10)) {
    console.log(`   ${bundle.name.padEnd(40)} ${formatBytes(bundle.size)}`);
  }
  console.log('─'.repeat(70));

  // Summary
  console.log('\n📈 Summary:');
  console.log(`   Total bundles analyzed: ${bundles.length}`);
  console.log(`   Initial bundles: ${initialBundles.length}`);
  console.log(`   Bundles over ${MAX_BUNDLE_SIZE_KB}KB: ${bundles.filter(b => b.size > MAX_BUNDLE_SIZE_BYTES).length}`);

  if (hasViolations) {
    console.log('\n❌ FAILED: Some initial bundles exceed the 200KB limit.');
    console.log('\n💡 Recommendations:');
    console.log('   1. Use dynamic imports for heavy components');
    console.log('   2. Review dependencies and consider lighter alternatives');
    console.log('   3. Enable tree-shaking for unused code');
    console.log('   4. Run `npm run build:analyze` to visualize bundle composition');
    process.exit(1);
  } else {
    console.log('\n✅ SUCCESS: All initial bundles are within the 200KB limit!');
    process.exit(0);
  }
}

main();
