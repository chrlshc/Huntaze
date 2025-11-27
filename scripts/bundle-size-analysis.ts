/**
 * Bundle Size Analysis Script
 * Analyzes Next.js bundle composition and identifies optimization opportunities
 * 
 * Validates: Requirements 6.1 (Bundle size < 200KB per chunk)
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { gzipSync } from 'zlib';

interface BundleFile {
  path: string;
  name: string;
  size: number;
  gzipSize: number;
  type: 'js' | 'css' | 'other';
  route?: string;
}

interface BundleAnalysisReport {
  totalSize: number;
  totalGzipSize: number;
  files: BundleFile[];
  byType: {
    js: { count: number; size: number; gzipSize: number };
    css: { count: number; size: number; gzipSize: number };
    other: { count: number; size: number; gzipSize: number };
  };
  largestFiles: BundleFile[];
  recommendations: string[];
}

class BundleSizeAnalyzer {
  private buildDir: string;
  private chunkSizeLimit: number;
  
  constructor(buildDir: string = '.next', chunkSizeLimit: number = 200 * 1024) {
    this.buildDir = buildDir;
    this.chunkSizeLimit = chunkSizeLimit;
  }
  
  /**
   * Recursively scan directory for bundle files
   */
  private scanDirectory(dir: string, baseDir: string = dir): BundleFile[] {
    const files: BundleFile[] = [];
    
    try {
      const entries = readdirSync(dir);
      
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Recursively scan subdirectories
          files.push(...this.scanDirectory(fullPath, baseDir));
        } else if (stat.isFile()) {
          const ext = extname(entry);
          
          // Only analyze JS and CSS files
          if (ext === '.js' || ext === '.css') {
            const content = readFileSync(fullPath);
            const gzipSize = gzipSync(content).length;
            
            files.push({
              path: fullPath.replace(baseDir + '/', ''),
              name: entry,
              size: stat.size,
              gzipSize,
              type: ext === '.js' ? 'js' : ext === '.css' ? 'css' : 'other',
              route: this.extractRoute(fullPath),
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Could not scan directory ${dir}:`, error);
    }
    
    return files;
  }
  
  /**
   * Extract route name from file path
   */
  private extractRoute(filePath: string): string | undefined {
    // Extract route from Next.js build structure
    const routeMatch = filePath.match(/pages\/(.+)\.(js|css)$/);
    if (routeMatch) {
      return routeMatch[1].replace(/\[.*?\]/g, '[dynamic]');
    }
    
    const appRouteMatch = filePath.match(/app\/(.+)\/page\.(js|css)$/);
    if (appRouteMatch) {
      return appRouteMatch[1];
    }
    
    return undefined;
  }
  
  /**
   * Analyze bundle composition
   */
  analyze(): BundleAnalysisReport {
    console.log(`🔍 Analyzing bundles in ${this.buildDir}...\n`);
    
    const staticDir = join(this.buildDir, 'static');
    const files = this.scanDirectory(staticDir);
    
    // Calculate totals
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const totalGzipSize = files.reduce((sum, f) => sum + f.gzipSize, 0);
    
    // Group by type
    const byType = {
      js: { count: 0, size: 0, gzipSize: 0 },
      css: { count: 0, size: 0, gzipSize: 0 },
      other: { count: 0, size: 0, gzipSize: 0 },
    };
    
    for (const file of files) {
      byType[file.type].count++;
      byType[file.type].size += file.size;
      byType[file.type].gzipSize += file.gzipSize;
    }
    
    // Find largest files
    const largestFiles = [...files]
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(files, largestFiles);
    
    return {
      totalSize,
      totalGzipSize,
      files,
      byType,
      largestFiles,
      recommendations,
    };
  }
  
  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(files: BundleFile[], largestFiles: BundleFile[]): string[] {
    const recommendations: string[] = [];
    
    // Check for oversized chunks
    const oversizedChunks = files.filter(f => f.size > this.chunkSizeLimit);
    if (oversizedChunks.length > 0) {
      recommendations.push(
        `⚠️  ${oversizedChunks.length} chunk(s) exceed ${this.chunkSizeLimit / 1024}KB limit:`
      );
      for (const chunk of oversizedChunks.slice(0, 5)) {
        recommendations.push(
          `   - ${chunk.name}: ${(chunk.size / 1024).toFixed(2)}KB (consider code splitting)`
        );
      }
    }
    
    // Check compression ratio
    for (const file of largestFiles.slice(0, 3)) {
      const compressionRatio = file.gzipSize / file.size;
      if (compressionRatio > 0.7) {
        recommendations.push(
          `📦 ${file.name} has poor compression (${(compressionRatio * 100).toFixed(1)}%). Consider minification.`
        );
      }
    }
    
    // Check for duplicate dependencies
    const jsFiles = files.filter(f => f.type === 'js');
    const vendorFiles = jsFiles.filter(f => f.name.includes('vendor') || f.name.includes('node_modules'));
    if (vendorFiles.length > 1) {
      recommendations.push(
        `🔄 Multiple vendor bundles detected. Consider optimizing splitChunks configuration.`
      );
    }
    
    // Check total bundle size
    const totalMB = files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);
    if (totalMB > 2) {
      recommendations.push(
        `📊 Total bundle size (${totalMB.toFixed(2)}MB) exceeds 2MB. Consider lazy loading.`
      );
    }
    
    return recommendations;
  }
  
  /**
   * Generate detailed report
   */
  generateReport(analysis: BundleAnalysisReport): string {
    const lines: string[] = [];
    
    lines.push('='.repeat(70));
    lines.push('BUNDLE SIZE ANALYSIS REPORT');
    lines.push('='.repeat(70));
    lines.push('');
    
    // Overall statistics
    lines.push('📊 Overall Statistics:');
    lines.push(`   Total Size: ${(analysis.totalSize / 1024).toFixed(2)} KB`);
    lines.push(`   Total Gzipped: ${(analysis.totalGzipSize / 1024).toFixed(2)} KB`);
    lines.push(`   Compression Ratio: ${((analysis.totalGzipSize / analysis.totalSize) * 100).toFixed(1)}%`);
    lines.push(`   Total Files: ${analysis.files.length}`);
    lines.push('');
    
    // By type
    lines.push('📁 By File Type:');
    for (const [type, stats] of Object.entries(analysis.byType)) {
      if (stats.count > 0) {
        lines.push(`   ${type.toUpperCase()}:`);
        lines.push(`     Files: ${stats.count}`);
        lines.push(`     Size: ${(stats.size / 1024).toFixed(2)} KB`);
        lines.push(`     Gzipped: ${(stats.gzipSize / 1024).toFixed(2)} KB`);
      }
    }
    lines.push('');
    
    // Largest files
    lines.push('📦 Top 10 Largest Files:');
    for (let i = 0; i < Math.min(10, analysis.largestFiles.length); i++) {
      const file = analysis.largestFiles[i];
      const sizeKB = (file.size / 1024).toFixed(2);
      const gzipKB = (file.gzipSize / 1024).toFixed(2);
      lines.push(`   ${i + 1}. ${file.name}`);
      lines.push(`      Size: ${sizeKB} KB (${gzipKB} KB gzipped)`);
      if (file.route) {
        lines.push(`      Route: ${file.route}`);
      }
    }
    lines.push('');
    
    // Recommendations
    if (analysis.recommendations.length > 0) {
      lines.push('💡 Recommendations:');
      for (const rec of analysis.recommendations) {
        lines.push(`   ${rec}`);
      }
      lines.push('');
    }
    
    lines.push('='.repeat(70));
    
    return lines.join('\n');
  }
  
  /**
   * Run analysis and generate report
   */
  async run(): Promise<void> {
    const analysis = this.analyze();
    const report = this.generateReport(analysis);
    
    console.log(report);
    
    // Check if any chunks exceed limit
    const oversizedChunks = analysis.files.filter(f => f.size > this.chunkSizeLimit);
    if (oversizedChunks.length > 0) {
      console.error(`\n❌ ${oversizedChunks.length} chunk(s) exceed size limit`);
      process.exit(1);
    }
    
    console.log('\n✅ All chunks within size limits');
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new BundleSizeAnalyzer();
  analyzer.run().catch((error) => {
    console.error('Error running bundle size analysis:', error);
    process.exit(1);
  });
}

export { BundleSizeAnalyzer, BundleAnalysisReport, BundleFile };
