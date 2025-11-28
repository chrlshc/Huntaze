#!/usr/bin/env tsx
/**
 * CSS Analyzer Script for Codebase Cleanup
 * 
 * This script analyzes CSS files to identify:
 * - Duplicate CSS properties across files
 * - Inline styles that should use Tailwind
 * - Mobile CSS files for consolidation opportunities
 * 
 * Generates: css-consolidation-plan.md
 */

import * as fs from 'fs';
import * as path from 'path';

interface CSSFile {
  path: string;
  size: number;
  properties: Map<string, string[]>; // property -> values
  selectors: string[];
}

interface DuplicateProperty {
  property: string;
  files: string[];
  values: string[];
  occurrences: number;
}

interface MobileFile {
  path: string;
  size: number;
  mediaQueries: number;
  viewportFixes: number;
}

interface AnalysisResults {
  cssFiles: CSSFile[];
  duplicateProperties: DuplicateProperty[];
  mobileFiles: MobileFile[];
  totalSize: number;
  inlineStylesCount: number;
}

const CSS_DIRS = ['app', 'styles', 'components'];
const EXCLUDE_DIRS = ['node_modules', '.next', 'dist', 'build'];

// Mobile CSS files to consolidate
const MOBILE_CSS_FILES = [
  'app/mobile.css',
  'app/mobile-optimized.css',
  'app/mobile-emergency-fix.css',
  'app/nuclear-mobile-fix.css',
];

/**
 * Parse CSS file and extract properties
 */
function parseCSSFile(filePath: string): CSSFile {
  const content = fs.readFileSync(filePath, 'utf-8');
  const stats = fs.statSync(filePath);
  
  const properties = new Map<string, string[]>();
  const selectors: string[] = [];

  // Simple CSS parsing (property: value)
  const propertyRegex = /([a-z-]+)\s*:\s*([^;]+);/gi;
  const selectorRegex = /([.#]?[\w-]+(?:\s*[>+~]\s*[\w-]+)*)\s*{/g;

  let match;
  while ((match = propertyRegex.exec(content)) !== null) {
    const [, property, value] = match;
    const prop = property.trim();
    const val = value.trim();
    
    if (!properties.has(prop)) {
      properties.set(prop, []);
    }
    properties.get(prop)!.push(val);
  }

  while ((match = selectorRegex.exec(content)) !== null) {
    selectors.push(match[1].trim());
  }

  return {
    path: filePath,
    size: stats.size,
    properties,
    selectors,
  };
}

/**
 * Analyze mobile CSS file
 */
function analyzeMobileCSS(filePath: string): MobileFile {
  const content = fs.readFileSync(filePath, 'utf-8');
  const stats = fs.statSync(filePath);

  // Count media queries
  const mediaQueries = (content.match(/@media/g) || []).length;
  
  // Count viewport fixes
  const viewportFixes = (content.match(/viewport|vh|vw|vmin|vmax/gi) || []).length;

  return {
    path: filePath,
    size: stats.size,
    mediaQueries,
    viewportFixes,
  };
}

/**
 * Scan directory for CSS files
 */
function scanForCSSFiles(dir: string, results: CSSFile[], rootDir: string = dir): void {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !EXCLUDE_DIRS.includes(entry.name)) {
        scanForCSSFiles(fullPath, results, rootDir);
      } else if (entry.isFile() && entry.name.endsWith('.css')) {
        const relativePath = path.relative(rootDir, fullPath);
        const cssFile = parseCSSFile(fullPath);
        cssFile.path = relativePath;
        results.push(cssFile);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }
}

/**
 * Find duplicate properties across CSS files
 */
function findDuplicateProperties(cssFiles: CSSFile[]): DuplicateProperty[] {
  const propertyMap = new Map<string, Map<string, string[]>>();

  // Build map of property -> file -> values
  for (const file of cssFiles) {
    for (const [property, values] of file.properties) {
      if (!propertyMap.has(property)) {
        propertyMap.set(property, new Map());
      }
      propertyMap.get(property)!.set(file.path, values);
    }
  }

  // Find properties that appear in multiple files
  const duplicates: DuplicateProperty[] = [];
  for (const [property, fileMap] of propertyMap) {
    if (fileMap.size > 1) {
      const files = Array.from(fileMap.keys());
      const allValues = Array.from(fileMap.values()).flat();
      const uniqueValues = [...new Set(allValues)];
      
      duplicates.push({
        property,
        files,
        values: uniqueValues,
        occurrences: allValues.length,
      });
    }
  }

  // Sort by number of occurrences
  return duplicates.sort((a, b) => b.occurrences - a.occurrences);
}

/**
 * Scan for inline styles in TSX/JSX files
 */
function scanForInlineStyles(dir: string, rootDir: string = dir): number {
  let count = 0;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !EXCLUDE_DIRS.includes(entry.name)) {
        count += scanForInlineStyles(fullPath, rootDir);
      } else if (entry.isFile() && /\.(tsx|jsx)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        // Look for style={{ }} patterns
        const matches = content.match(/style=\{\{[^}]+\}\}/g);
        if (matches) {
          count += matches.length;
        }
      }
    }
  } catch (error) {
    // Ignore errors
  }

  return count;
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

  lines.push('# CSS Consolidation Plan');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Total CSS files**: ${results.cssFiles.length}`);
  lines.push(`- **Total CSS size**: ${formatSize(results.totalSize)}`);
  lines.push(`- **Duplicate properties found**: ${results.duplicateProperties.length}`);
  lines.push(`- **Mobile CSS files**: ${results.mobileFiles.length}`);
  lines.push(`- **Inline styles found**: ${results.inlineStylesCount}`);
  lines.push('');

  // Duplicate Properties Section
  lines.push('## Duplicate CSS Properties');
  lines.push('');
  if (results.duplicateProperties.length === 0) {
    lines.push('✅ No duplicate properties found.');
  } else {
    lines.push('The following CSS properties are defined in multiple files and should be consolidated:');
    lines.push('');
    lines.push('| Property | Files | Unique Values | Occurrences |');
    lines.push('|----------|-------|---------------|-------------|');
    
    // Show top 20 duplicates
    const topDuplicates = results.duplicateProperties.slice(0, 20);
    for (const dup of topDuplicates) {
      lines.push(`| \`${dup.property}\` | ${dup.files.length} | ${dup.values.length} | ${dup.occurrences} |`);
    }
    
    if (results.duplicateProperties.length > 20) {
      lines.push('');
      lines.push(`*Showing top 20 of ${results.duplicateProperties.length} duplicate properties*`);
    }
  }
  lines.push('');

  // Mobile CSS Files Section
  lines.push('## Mobile CSS Files Analysis');
  lines.push('');
  if (results.mobileFiles.length === 0) {
    lines.push('✅ No mobile CSS files found.');
  } else {
    lines.push('The following mobile CSS files should be consolidated:');
    lines.push('');
    lines.push('| File | Size | Media Queries | Viewport Fixes |');
    lines.push('|------|------|---------------|----------------|');
    for (const file of results.mobileFiles) {
      lines.push(`| ${file.path} | ${formatSize(file.size)} | ${file.mediaQueries} | ${file.viewportFixes} |`);
    }
    lines.push('');
    lines.push('**Consolidation Strategy:**');
    lines.push('- Merge all mobile CSS files into `app/mobile.css`');
    lines.push('- Remove duplicate viewport fixes');
    lines.push('- Convert media queries to Tailwind responsive utilities where possible');
    lines.push('- Use `@container` queries for component-level responsiveness');
  }
  lines.push('');

  // Inline Styles Section
  lines.push('## Inline Styles Analysis');
  lines.push('');
  if (results.inlineStylesCount === 0) {
    lines.push('✅ No inline styles found.');
  } else {
    lines.push(`Found **${results.inlineStylesCount}** inline style declarations in TSX/JSX files.`);
    lines.push('');
    lines.push('**Recommendation:**');
    lines.push('- Convert inline styles to Tailwind utility classes');
    lines.push('- Use CSS modules for complex component-specific styles');
    lines.push('- Reserve inline styles only for dynamic values');
  }
  lines.push('');

  // Consolidation Recommendations
  lines.push('## Consolidation Recommendations');
  lines.push('');
  lines.push('### 1. Create Design Tokens File');
  lines.push('');
  lines.push('Create `styles/design-tokens.css` with standardized values:');
  lines.push('```css');
  lines.push(':root {');
  lines.push('  /* Background colors */');
  lines.push('  --bg-primary: theme(colors.zinc.950);');
  lines.push('  --bg-card: linear-gradient(to-br, rgba(255,255,255,0.03), transparent);');
  lines.push('  ');
  lines.push('  /* Borders */');
  lines.push('  --border-subtle: rgba(255,255,255,0.08);');
  lines.push('  ');
  lines.push('  /* Shadows */');
  lines.push('  --shadow-inner-glow: inset 0 1px 0 0 rgba(255,255,255,0.05);');
  lines.push('  ');
  lines.push('  /* Text colors */');
  lines.push('  --text-primary: theme(colors.zinc.100);');
  lines.push('  --text-secondary: theme(colors.zinc.500);');
  lines.push('  --text-accent: theme(colors.emerald.400);');
  lines.push('}');
  lines.push('```');
  lines.push('');

  lines.push('### 2. Consolidate Mobile CSS');
  lines.push('');
  lines.push('Merge mobile CSS files in this order:');
  for (let i = 0; i < results.mobileFiles.length; i++) {
    lines.push(`${i + 1}. ${results.mobileFiles[i].path}`);
  }
  lines.push('');

  lines.push('### 3. Refactor Glass Effects');
  lines.push('');
  lines.push('Standardize glass effects to use:');
  lines.push('- `bg-white/5` for background');
  lines.push('- `backdrop-blur-xl` for blur');
  lines.push('- `border-white/10` for borders');
  lines.push('');

  lines.push('### 4. Priority Actions');
  lines.push('');
  lines.push('1. **High Priority**: Consolidate mobile CSS files (saves space, reduces complexity)');
  lines.push('2. **Medium Priority**: Create design tokens file (establishes consistency)');
  lines.push('3. **Medium Priority**: Refactor top 10 duplicate properties');
  lines.push('4. **Low Priority**: Convert inline styles to Tailwind (gradual improvement)');
  lines.push('');

  // File List
  lines.push('## All CSS Files');
  lines.push('');
  lines.push('| File | Size | Properties | Selectors |');
  lines.push('|------|------|------------|-----------|');
  for (const file of results.cssFiles) {
    const propCount = Array.from(file.properties.values()).flat().length;
    lines.push(`| ${file.path} | ${formatSize(file.size)} | ${propCount} | ${file.selectors.length} |`);
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * Main execution
 */
function main() {
  console.log('🎨 Analyzing CSS files for consolidation opportunities...\n');

  const rootDir = process.cwd();
  const cssFiles: CSSFile[] = [];
  let totalSize = 0;

  // Scan for CSS files
  for (const dir of CSS_DIRS) {
    const fullPath = path.join(rootDir, dir);
    if (fs.existsSync(fullPath)) {
      scanForCSSFiles(fullPath, cssFiles, rootDir);
    }
  }

  // Calculate total size
  for (const file of cssFiles) {
    totalSize += file.size;
  }

  // Find duplicate properties
  const duplicateProperties = findDuplicateProperties(cssFiles);

  // Analyze mobile CSS files
  const mobileFiles: MobileFile[] = [];
  for (const mobilePath of MOBILE_CSS_FILES) {
    const fullPath = path.join(rootDir, mobilePath);
    if (fs.existsSync(fullPath)) {
      mobileFiles.push(analyzeMobileCSS(fullPath));
    }
  }

  // Scan for inline styles
  console.log('Scanning for inline styles...');
  let inlineStylesCount = 0;
  for (const dir of CSS_DIRS) {
    const fullPath = path.join(rootDir, dir);
    if (fs.existsSync(fullPath)) {
      inlineStylesCount += scanForInlineStyles(fullPath, rootDir);
    }
  }

  const results: AnalysisResults = {
    cssFiles,
    duplicateProperties,
    mobileFiles,
    totalSize,
    inlineStylesCount,
  };

  // Generate report
  const report = generateReport(results);
  const reportPath = path.join(rootDir, 'css-consolidation-plan.md');
  fs.writeFileSync(reportPath, report, 'utf-8');

  // Print summary
  console.log('✅ Analysis complete!\n');
  console.log('Summary:');
  console.log(`  - CSS files: ${cssFiles.length}`);
  console.log(`  - Total size: ${formatSize(totalSize)}`);
  console.log(`  - Duplicate properties: ${duplicateProperties.length}`);
  console.log(`  - Mobile CSS files: ${mobileFiles.length}`);
  console.log(`  - Inline styles: ${inlineStylesCount}\n`);
  console.log(`📄 Report generated: ${reportPath}`);
}

// Run the script
main();
