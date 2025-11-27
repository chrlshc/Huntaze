#!/usr/bin/env ts-node
/**
 * Performance Audit Script
 * 
 * Analyzes the application to identify performance bottlenecks:
 * - Bundle sizes and code splitting
 * - Loading states and excessive re-renders
 * - API request patterns
 * - Image optimization opportunities
 * - Cache configuration
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.5
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface AuditResult {
  category: string;
  severity: 'critical' | 'warning' | 'info';
  issue: string;
  details: string;
  recommendation: string;
  files?: string[];
}

interface BundleAnalysis {
  totalSize: number;
  largeChunks: Array<{ file: string; size: number }>;
  duplicateDependencies: string[];
}

interface LoadingStateAnalysis {
  totalLoadingComponents: number;
  filesWithMultipleLoaders: Array<{ file: string; count: number }>;
  filesWithoutSkeleton: string[];
}

interface ImageAnalysis {
  totalImages: number;
  unoptimizedImages: string[];
  missingLazyLoad: string[];
  largeImages: Array<{ file: string; size: number }>;
}

interface APIAnalysis {
  totalEndpoints: number;
  endpointsWithoutCache: string[];
  endpointsWithoutDebounce: string[];
  endpointsWithoutErrorHandling: string[];
}

class PerformanceAuditor {
  private results: AuditResult[] = [];
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Run complete audit
   */
  async runAudit(): Promise<AuditResult[]> {
    console.log('🔍 Starting Performance Audit...\n');

    await this.auditBundleSize();
    await this.auditLoadingStates();
    await this.auditImages();
    await this.auditAPIPatterns();
    await this.auditCacheStrategy();
    await this.auditCodeSplitting();

    return this.results;
  }

  /**
   * Audit 1: Bundle Size Analysis
   */
  private async auditBundleSize() {
    console.log('📦 Auditing bundle sizes...');

    try {
      const nextBuildDir = path.join(this.projectRoot, '.next');
      
      if (!fs.existsSync(nextBuildDir)) {
        this.addResult({
          category: 'Bundle Size',
          severity: 'warning',
          issue: 'No production build found',
          details: '.next directory does not exist',
          recommendation: 'Run `npm run build` to generate production build for analysis',
        });
        return;
      }

      // Analyze .next/static/chunks
      const chunksDir = path.join(nextBuildDir, 'static', 'chunks');
      if (fs.existsSync(chunksDir)) {
        const chunks = fs.readdirSync(chunksDir);
        const largeChunks: Array<{ file: string; size: number }> = [];

        for (const chunk of chunks) {
          const chunkPath = path.join(chunksDir, chunk);
          const stats = fs.statSync(chunkPath);
          const sizeKB = stats.size / 1024;

          if (sizeKB > 200) {
            largeChunks.push({ file: chunk, size: sizeKB });
          }
        }

        if (largeChunks.length > 0) {
          this.addResult({
            category: 'Bundle Size',
            severity: 'critical',
            issue: `${largeChunks.length} chunks exceed 200KB`,
            details: largeChunks
              .map((c) => `${c.file}: ${c.size.toFixed(2)}KB`)
              .join('\n'),
            recommendation:
              'Split large chunks using dynamic imports and route-based code splitting',
            files: largeChunks.map((c) => c.file),
          });
        }
      }

      // Check for duplicate dependencies
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf-8')
      );
      
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Common duplicates to check
      const duplicateChecks = [
        ['react', '@types/react'],
        ['lodash', 'lodash-es'],
        ['moment', 'dayjs', 'date-fns'],
      ];

      for (const group of duplicateChecks) {
        const found = group.filter((dep) => allDeps[dep]);
        if (found.length > 1) {
          this.addResult({
            category: 'Bundle Size',
            severity: 'warning',
            issue: 'Duplicate dependencies detected',
            details: `Multiple similar packages: ${found.join(', ')}`,
            recommendation: `Consolidate to a single package to reduce bundle size`,
          });
        }
      }
    } catch (error) {
      console.error('Error auditing bundle size:', error);
    }
  }

  /**
   * Audit 2: Loading States
   */
  private async auditLoadingStates() {
    console.log('⏳ Auditing loading states...');

    try {
      const files = await glob('**/*.{ts,tsx,js,jsx}', {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', '.next/**', 'dist/**'],
      });

      const filesWithLoading: Map<string, number> = new Map();
      const filesWithoutSkeleton: string[] = [];

      for (const file of files) {
        const filePath = path.join(this.projectRoot, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Count loading states
        const loadingMatches = content.match(/isLoading|loading|setLoading/gi);
        if (loadingMatches && loadingMatches.length > 3) {
          filesWithLoading.set(file, loadingMatches.length);
        }

        // Check for skeleton screens
        if (content.includes('isLoading') || content.includes('loading')) {
          if (!content.includes('skeleton') && !content.includes('Skeleton')) {
            filesWithoutSkeleton.push(file);
          }
        }
      }

      if (filesWithLoading.size > 0) {
        const topFiles = Array.from(filesWithLoading.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        this.addResult({
          category: 'Loading States',
          severity: 'warning',
          issue: `${filesWithLoading.size} files with excessive loading states`,
          details: topFiles
            .map(([file, count]) => `${file}: ${count} loading references`)
            .join('\n'),
          recommendation:
            'Consolidate loading states and use a centralized loading manager',
          files: topFiles.map(([file]) => file),
        });
      }

      if (filesWithoutSkeleton.length > 0) {
        this.addResult({
          category: 'Loading States',
          severity: 'info',
          issue: `${filesWithoutSkeleton.length} files use spinners instead of skeleton screens`,
          details: `Files: ${filesWithoutSkeleton.slice(0, 5).join(', ')}${
            filesWithoutSkeleton.length > 5 ? '...' : ''
          }`,
          recommendation:
            'Replace spinners with skeleton screens for better perceived performance',
          files: filesWithoutSkeleton.slice(0, 10),
        });
      }
    } catch (error) {
      console.error('Error auditing loading states:', error);
    }
  }

  /**
   * Audit 3: Image Optimization
   */
  private async auditImages() {
    console.log('🖼️  Auditing images...');

    try {
      const files = await glob('**/*.{ts,tsx,js,jsx}', {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', '.next/**', 'dist/**'],
      });

      const unoptimizedImages: string[] = [];
      const missingLazyLoad: string[] = [];

      for (const file of files) {
        const filePath = path.join(this.projectRoot, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Check for <img> tags instead of Next.js Image
        if (content.includes('<img') && !content.includes('next/image')) {
          unoptimizedImages.push(file);
        }

        // Check for missing lazy loading
        if (content.includes('next/image')) {
          const imageMatches = content.match(/<Image[^>]*>/g);
          if (imageMatches) {
            for (const match of imageMatches) {
              if (!match.includes('loading=') && !match.includes('priority')) {
                missingLazyLoad.push(file);
                break;
              }
            }
          }
        }
      }

      if (unoptimizedImages.length > 0) {
        this.addResult({
          category: 'Image Optimization',
          severity: 'critical',
          issue: `${unoptimizedImages.length} files use unoptimized <img> tags`,
          details: `Files: ${unoptimizedImages.slice(0, 5).join(', ')}${
            unoptimizedImages.length > 5 ? '...' : ''
          }`,
          recommendation:
            'Replace <img> tags with Next.js Image component for automatic optimization',
          files: unoptimizedImages.slice(0, 10),
        });
      }

      if (missingLazyLoad.length > 0) {
        this.addResult({
          category: 'Image Optimization',
          severity: 'warning',
          issue: `${missingLazyLoad.length} images missing lazy loading`,
          details: `Files: ${missingLazyLoad.slice(0, 5).join(', ')}${
            missingLazyLoad.length > 5 ? '...' : ''
          }`,
          recommendation:
            'Add loading="lazy" to off-screen images or priority to above-the-fold images',
          files: missingLazyLoad.slice(0, 10),
        });
      }

      // Check public directory for large images
      const publicDir = path.join(this.projectRoot, 'public');
      if (fs.existsSync(publicDir)) {
        const imageFiles = await glob('**/*.{jpg,jpeg,png,gif,webp}', {
          cwd: publicDir,
        });

        const largeImages: Array<{ file: string; size: number }> = [];

        for (const file of imageFiles) {
          const filePath = path.join(publicDir, file);
          const stats = fs.statSync(filePath);
          const sizeKB = stats.size / 1024;

          if (sizeKB > 500) {
            largeImages.push({ file, size: sizeKB });
          }
        }

        if (largeImages.length > 0) {
          this.addResult({
            category: 'Image Optimization',
            severity: 'warning',
            issue: `${largeImages.length} images exceed 500KB`,
            details: largeImages
              .map((img) => `${img.file}: ${img.size.toFixed(2)}KB`)
              .join('\n'),
            recommendation:
              'Compress images and consider using WebP/AVIF formats with CloudFront',
            files: largeImages.map((img) => img.file),
          });
        }
      }
    } catch (error) {
      console.error('Error auditing images:', error);
    }
  }

  /**
   * Audit 4: API Patterns
   */
  private async auditAPIPatterns() {
    console.log('🌐 Auditing API patterns...');

    try {
      const files = await glob('**/*.{ts,tsx,js,jsx}', {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', '.next/**', 'dist/**'],
      });

      const endpointsWithoutCache: string[] = [];
      const endpointsWithoutDebounce: string[] = [];
      const endpointsWithoutErrorHandling: string[] = [];

      for (const file of files) {
        const filePath = path.join(this.projectRoot, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Check for fetch/axios without cache
        const hasFetch = content.includes('fetch(') || content.includes('axios.');
        if (hasFetch) {
          if (
            !content.includes('cache') &&
            !content.includes('swr') &&
            !content.includes('react-query') &&
            !content.includes('tanstack')
          ) {
            endpointsWithoutCache.push(file);
          }

          // Check for debounce on search/filter endpoints
          if (
            (content.includes('search') || content.includes('filter')) &&
            !content.includes('debounce') &&
            !content.includes('throttle')
          ) {
            endpointsWithoutDebounce.push(file);
          }

          // Check for error handling
          if (!content.includes('catch') && !content.includes('try')) {
            endpointsWithoutErrorHandling.push(file);
          }
        }
      }

      if (endpointsWithoutCache.length > 0) {
        this.addResult({
          category: 'API Patterns',
          severity: 'critical',
          issue: `${endpointsWithoutCache.length} API calls without caching`,
          details: `Files: ${endpointsWithoutCache.slice(0, 5).join(', ')}${
            endpointsWithoutCache.length > 5 ? '...' : ''
          }`,
          recommendation:
            'Implement caching with SWR, React Query, or custom cache manager',
          files: endpointsWithoutCache.slice(0, 10),
        });
      }

      if (endpointsWithoutDebounce.length > 0) {
        this.addResult({
          category: 'API Patterns',
          severity: 'warning',
          issue: `${endpointsWithoutDebounce.length} search/filter endpoints without debouncing`,
          details: `Files: ${endpointsWithoutDebounce.slice(0, 5).join(', ')}${
            endpointsWithoutDebounce.length > 5 ? '...' : ''
          }`,
          recommendation:
            'Add debouncing (300ms) to search and filter API calls',
          files: endpointsWithoutDebounce.slice(0, 10),
        });
      }

      if (endpointsWithoutErrorHandling.length > 0) {
        this.addResult({
          category: 'API Patterns',
          severity: 'warning',
          issue: `${endpointsWithoutErrorHandling.length} API calls without error handling`,
          details: `Files: ${endpointsWithoutErrorHandling.slice(0, 5).join(', ')}${
            endpointsWithoutErrorHandling.length > 5 ? '...' : ''
          }`,
          recommendation:
            'Add try-catch blocks and implement exponential backoff retry',
          files: endpointsWithoutErrorHandling.slice(0, 10),
        });
      }
    } catch (error) {
      console.error('Error auditing API patterns:', error);
    }
  }

  /**
   * Audit 5: Cache Strategy
   */
  private async auditCacheStrategy() {
    console.log('💾 Auditing cache strategy...');

    try {
      // Check for Redis configuration
      const envFile = path.join(this.projectRoot, '.env');
      let hasRedis = false;

      if (fs.existsSync(envFile)) {
        const envContent = fs.readFileSync(envFile, 'utf-8');
        hasRedis = envContent.includes('REDIS_URL') || envContent.includes('REDIS_HOST');
      }

      if (!hasRedis) {
        this.addResult({
          category: 'Cache Strategy',
          severity: 'warning',
          issue: 'No Redis configuration found',
          details: 'Redis is not configured for server-side caching',
          recommendation:
            'Set up Redis for server-side caching to reduce database load',
        });
      }

      // Check for cache headers in API routes
      const apiFiles = await glob('app/api/**/*.{ts,js}', {
        cwd: this.projectRoot,
      });

      const routesWithoutCacheHeaders: string[] = [];

      for (const file of apiFiles) {
        const filePath = path.join(this.projectRoot, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        if (
          !content.includes('Cache-Control') &&
          !content.includes('cache-control')
        ) {
          routesWithoutCacheHeaders.push(file);
        }
      }

      if (routesWithoutCacheHeaders.length > 0) {
        this.addResult({
          category: 'Cache Strategy',
          severity: 'warning',
          issue: `${routesWithoutCacheHeaders.length} API routes without cache headers`,
          details: `Files: ${routesWithoutCacheHeaders.slice(0, 5).join(', ')}${
            routesWithoutCacheHeaders.length > 5 ? '...' : ''
          }`,
          recommendation:
            'Add appropriate Cache-Control headers to API responses',
          files: routesWithoutCacheHeaders.slice(0, 10),
        });
      }
    } catch (error) {
      console.error('Error auditing cache strategy:', error);
    }
  }

  /**
   * Audit 6: Code Splitting
   */
  private async auditCodeSplitting() {
    console.log('✂️  Auditing code splitting...');

    try {
      const files = await glob('**/*.{ts,tsx,js,jsx}', {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', '.next/**', 'dist/**'],
      });

      const filesWithoutDynamicImport: string[] = [];
      const largeComponents: string[] = [];

      for (const file of files) {
        const filePath = path.join(this.projectRoot, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const stats = fs.statSync(filePath);
        const sizeKB = stats.size / 1024;

        // Check for large components without dynamic import
        if (sizeKB > 50 && file.includes('components/')) {
          if (!content.includes('dynamic') && !content.includes('lazy')) {
            filesWithoutDynamicImport.push(file);
          }
          largeComponents.push(`${file} (${sizeKB.toFixed(2)}KB)`);
        }
      }

      if (filesWithoutDynamicImport.length > 0) {
        this.addResult({
          category: 'Code Splitting',
          severity: 'warning',
          issue: `${filesWithoutDynamicImport.length} large components without dynamic imports`,
          details: largeComponents.slice(0, 10).join('\n'),
          recommendation:
            'Use next/dynamic or React.lazy for large components to enable code splitting',
          files: filesWithoutDynamicImport.slice(0, 10),
        });
      }

      // Check for third-party libraries that should be lazy loaded
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf-8')
      );

      const heavyLibraries = [
        'chart.js',
        'recharts',
        'react-chartjs-2',
        'moment',
        'lodash',
        'date-fns',
      ];

      const installedHeavyLibs = heavyLibraries.filter(
        (lib) =>
          packageJson.dependencies?.[lib] || packageJson.devDependencies?.[lib]
      );

      if (installedHeavyLibs.length > 0) {
        this.addResult({
          category: 'Code Splitting',
          severity: 'info',
          issue: `${installedHeavyLibs.length} heavy libraries detected`,
          details: `Libraries: ${installedHeavyLibs.join(', ')}`,
          recommendation:
            'Ensure these libraries are dynamically imported only when needed',
        });
      }
    } catch (error) {
      console.error('Error auditing code splitting:', error);
    }
  }

  /**
   * Add audit result
   */
  private addResult(result: AuditResult) {
    this.results.push(result);
  }

  /**
   * Generate report
   */
  generateReport(): string {
    const critical = this.results.filter((r) => r.severity === 'critical');
    const warnings = this.results.filter((r) => r.severity === 'warning');
    const info = this.results.filter((r) => r.severity === 'info');

    let report = '# Performance Audit Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `## Summary\n\n`;
    report += `- 🔴 Critical Issues: ${critical.length}\n`;
    report += `- 🟡 Warnings: ${warnings.length}\n`;
    report += `- 🔵 Info: ${info.length}\n\n`;

    if (critical.length > 0) {
      report += `## 🔴 Critical Issues\n\n`;
      critical.forEach((result, index) => {
        report += this.formatResult(result, index + 1);
      });
    }

    if (warnings.length > 0) {
      report += `## 🟡 Warnings\n\n`;
      warnings.forEach((result, index) => {
        report += this.formatResult(result, index + 1);
      });
    }

    if (info.length > 0) {
      report += `## 🔵 Information\n\n`;
      info.forEach((result, index) => {
        report += this.formatResult(result, index + 1);
      });
    }

    return report;
  }

  /**
   * Format single result
   */
  private formatResult(result: AuditResult, index: number): string {
    let output = `### ${index}. ${result.issue}\n\n`;
    output += `**Category:** ${result.category}\n\n`;
    output += `**Details:**\n${result.details}\n\n`;
    output += `**Recommendation:**\n${result.recommendation}\n\n`;

    if (result.files && result.files.length > 0) {
      output += `**Affected Files:**\n`;
      result.files.forEach((file) => {
        output += `- ${file}\n`;
      });
      output += '\n';
    }

    output += '---\n\n';
    return output;
  }
}

// Run audit if executed directly
if (require.main === module) {
  const auditor = new PerformanceAuditor();
  
  auditor.runAudit().then((results) => {
    const report = auditor.generateReport();
    
    // Write to file
    const reportPath = path.join(process.cwd(), 'performance-audit-report.md');
    fs.writeFileSync(reportPath, report);
    
    console.log(`\n✅ Audit complete! Report saved to: ${reportPath}\n`);
    console.log(report);
    
    // Exit with error code if critical issues found
    const criticalCount = results.filter((r) => r.severity === 'critical').length;
    process.exit(criticalCount > 0 ? 1 : 0);
  });
}

export { PerformanceAuditor, type AuditResult };
