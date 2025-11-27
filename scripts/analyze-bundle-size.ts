#!/usr/bin/env tsx
/**
 * Bundle Size Analyzer
 * 
 * Analyzes Next.js build output to ensure chunks don't exceed 200KB limit
 * Validates: Requirements 6.1, 6.5
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface ChunkInfo {
  name: string;
  size: number;
  sizeKB: number;
  path: string;
  exceedsLimit: boolean;
}

const MAX_CHUNK_SIZE_KB = 200;
const BUILD_DIR = join(process.cwd(), '.next');

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function analyzeChunks(dir: string, prefix = ''): ChunkInfo[] {
  const chunks: ChunkInfo[] = [];
  
  try {
    const files = readdirSync(dir);
    
    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      
      if (stat.isDirectory()) {
        chunks.push(...analyzeChunks(filePath, `${prefix}${file}/`));
      } else if (file.endsWith('.js')) {
        const sizeKB = stat.size / 1024;
        chunks.push({
          name: `${prefix}${file}`,
          size: stat.size,
          sizeKB,
          path: filePath,
          exceedsLimit: sizeKB > MAX_CHUNK_SIZE_KB,
        });
      }
    }
  } catch (error) {
    // Directory might not exist yet
  }
  
  return chunks;
}

function main() {
  console.log('🔍 Analyzing Next.js bundle sizes...\n');
  
  // Analyze static chunks
  const staticChunks = analyzeChunks(join(BUILD_DIR, 'static', 'chunks'));
  
  if (staticChunks.length === 0) {
    console.log('⚠️  No build output found. Run `npm run build` first.');
    process.exit(1);
  }
  
  // Sort by size descending
  staticChunks.sort((a, b) => b.size - a.size);
  
  // Find chunks exceeding limit
  const oversizedChunks = staticChunks.filter(c => c.exceedsLimit);
  
  console.log(`📦 Total chunks analyzed: ${staticChunks.length}`);
  console.log(`📏 Maximum chunk size limit: ${MAX_CHUNK_SIZE_KB} KB\n`);
  
  // Show top 10 largest chunks
  console.log('🔝 Top 10 largest chunks:');
  console.log('─'.repeat(80));
  staticChunks.slice(0, 10).forEach((chunk, i) => {
    const status = chunk.exceedsLimit ? '❌' : '✅';
    console.log(`${i + 1}. ${status} ${chunk.name}`);
    console.log(`   Size: ${formatBytes(chunk.size)}`);
  });
  console.log();
  
  // Report oversized chunks
  if (oversizedChunks.length > 0) {
    console.log(`❌ ${oversizedChunks.length} chunk(s) exceed the ${MAX_CHUNK_SIZE_KB}KB limit:\n`);
    oversizedChunks.forEach(chunk => {
      console.log(`  • ${chunk.name}: ${formatBytes(chunk.size)}`);
    });
    console.log('\n💡 Suggestions:');
    console.log('  - Use dynamic imports for large components');
    console.log('  - Split large libraries into separate chunks');
    console.log('  - Review and remove unused dependencies');
    console.log('  - Consider lazy loading heavy features\n');
    
    process.exit(1);
  } else {
    console.log('✅ All chunks are within the size limit!\n');
    
    // Calculate total bundle size
    const totalSize = staticChunks.reduce((sum, chunk) => sum + chunk.size, 0);
    console.log(`📊 Total bundle size: ${formatBytes(totalSize)}`);
    console.log(`📊 Average chunk size: ${formatBytes(totalSize / staticChunks.length)}\n`);
  }
}

main();
