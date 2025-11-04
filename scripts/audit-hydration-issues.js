#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class HydrationAuditor {
  constructor() {
    this.issues = [];
    this.scannedFiles = 0;
    this.patterns = {
      // Client-only APIs that cause hydration issues
      clientOnlyAPIs: [
        /window\./g,
        /document\./g,
        /navigator\./g,
        /localStorage\./g,
        /sessionStorage\./g,
        /location\./g,
        /history\./g,
        /screen\./g,
        /matchMedia\(/g,
        /addEventListener\(/g,
        /removeEventListener\(/g,
      ],
      
      // Time-sensitive patterns
      timeSensitive: [
        /new Date\(\)/g,
        /Date\.now\(\)/g,
        /Math\.random\(\)/g,
        /performance\.now\(\)/g,
        /setTimeout\(/g,
        /setInterval\(/g,
      ],
      
      // Dynamic content patterns
      dynamicContent: [
        /Math\.floor\(Math\.random\(\)/g,
        /uuid\(\)/g,
        /nanoid\(\)/g,
        /crypto\.randomUUID\(\)/g,
      ],
      
      // Conditional rendering that might differ
      conditionalRendering: [
        /typeof window !== ['"]undefined['"]/g,
        /process\.env\.NODE_ENV/g,
        /if \(.*window.*\)/g,
        /window && /g,
      ],
      
      // Hydration-unsafe hooks usage
      unsafeHooks: [
        /useLayoutEffect\(/g,
        /useEffect\(\(\) => \{[^}]*window/g,
        /useEffect\(\(\) => \{[^}]*document/g,
      ],
      
      // CSS-in-JS that might cause issues
      cssInJS: [
        /styled\./g,
        /css`/g,
        /styled\(/g,
        /emotion/g,
      ],
    };
  }

  scanDirectory(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other irrelevant directories
        if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(file)) {
          this.scanDirectory(filePath, extensions);
        }
      } else if (extensions.some(ext => file.endsWith(ext))) {
        this.scanFile(filePath);
      }
    }
  }

  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.scannedFiles++;
      
      // Skip files that are already hydration-safe
      if (content.includes('use client') && content.includes('useEffect')) {
        // This is likely already handled properly
        return;
      }
      
      const lines = content.split('\n');
      
      Object.entries(this.patterns).forEach(([category, patterns]) => {
        patterns.forEach(pattern => {
          lines.forEach((line, lineNumber) => {
            const matches = line.match(pattern);
            if (matches) {
              this.issues.push({
                file: filePath,
                line: lineNumber + 1,
                category,
                pattern: pattern.source,
                match: matches[0],
                context: line.trim(),
                severity: this.getSeverity(category, line),
                suggestion: this.getSuggestion(category, matches[0]),
              });
            }
          });
        });
      });
      
      // Check for specific React patterns
      this.checkReactPatterns(filePath, content, lines);
      
    } catch (error) {
      console.warn(`Warning: Could not scan ${filePath}: ${error.message}`);
    }
  }

  checkReactPatterns(filePath, content, lines) {
    // Check for server components using client-only code
    const isServerComponent = !content.includes('use client');
    
    if (isServerComponent) {
      lines.forEach((line, lineNumber) => {
        // Check for direct DOM access in server components
        if (line.includes('document.') || line.includes('window.')) {
          this.issues.push({
            file: filePath,
            line: lineNumber + 1,
            category: 'serverComponentClientCode',
            pattern: 'Client-only code in server component',
            match: line.trim(),
            context: line.trim(),
            severity: 'high',
            suggestion: 'Move to client component or use useEffect',
          });
        }
      });
    }
    
    // Check for hydration-unsafe rendering patterns
    lines.forEach((line, lineNumber) => {
      // Check for inline Date objects in JSX
      if (line.includes('new Date()') && line.includes('<')) {
        this.issues.push({
          file: filePath,
          line: lineNumber + 1,
          category: 'inlineTimeInJSX',
          pattern: 'Inline Date in JSX',
          match: line.trim(),
          context: line.trim(),
          severity: 'high',
          suggestion: 'Use consistent timestamp or format on both server and client',
        });
      }
      
      // Check for conditional rendering based on client-only APIs
      if (line.includes('typeof window') && line.includes('?')) {
        this.issues.push({
          file: filePath,
          line: lineNumber + 1,
          category: 'conditionalClientRendering',
          pattern: 'Conditional rendering based on window',
          match: line.trim(),
          context: line.trim(),
          severity: 'medium',
          suggestion: 'Use useEffect or HydrationSafeWrapper',
        });
      }
    });
  }

  getSeverity(category, line) {
    const highSeverityPatterns = [
      'clientOnlyAPIs',
      'timeSensitive',
      'serverComponentClientCode',
      'inlineTimeInJSX'
    ];
    
    const mediumSeverityPatterns = [
      'conditionalRendering',
      'unsafeHooks',
      'conditionalClientRendering'
    ];
    
    if (highSeverityPatterns.includes(category)) {
      return 'high';
    } else if (mediumSeverityPatterns.includes(category)) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  getSuggestion(category, match) {
    const suggestions = {
      clientOnlyAPIs: 'Use useEffect hook or check if window is defined',
      timeSensitive: 'Use consistent timestamps between server and client',
      dynamicContent: 'Generate stable IDs or use useId hook',
      conditionalRendering: 'Use HydrationSafeWrapper or useEffect',
      unsafeHooks: 'Move to useEffect or add proper guards',
      cssInJS: 'Ensure consistent styling between server and client',
      serverComponentClientCode: 'Move to client component with "use client"',
      inlineTimeInJSX: 'Format dates consistently or use suppressHydrationWarning',
      conditionalClientRendering: 'Use HydrationSafeWrapper component',
    };
    
    return suggestions[category] || 'Review for hydration safety';
  }

  generateReport() {
    const report = {
      summary: {
        totalFiles: this.scannedFiles,
        totalIssues: this.issues.length,
        highSeverity: this.issues.filter(i => i.severity === 'high').length,
        mediumSeverity: this.issues.filter(i => i.severity === 'medium').length,
        lowSeverity: this.issues.filter(i => i.severity === 'low').length,
      },
      issuesByCategory: {},
      issuesByFile: {},
      recommendations: [],
    };

    // Group issues by category
    this.issues.forEach(issue => {
      if (!report.issuesByCategory[issue.category]) {
        report.issuesByCategory[issue.category] = [];
      }
      report.issuesByCategory[issue.category].push(issue);
    });

    // Group issues by file
    this.issues.forEach(issue => {
      if (!report.issuesByFile[issue.file]) {
        report.issuesByFile[issue.file] = [];
      }
      report.issuesByFile[issue.file].push(issue);
    });

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);

    return report;
  }

  generateRecommendations(report) {
    const recommendations = [];
    
    if (report.summary.highSeverity > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Fix High Severity Hydration Issues',
        description: `Found ${report.summary.highSeverity} high severity issues that are likely causing React error #130`,
        action: 'Review and fix client-only API usage and time-sensitive rendering',
      });
    }
    
    if (report.issuesByCategory.clientOnlyAPIs?.length > 5) {
      recommendations.push({
        priority: 'high',
        title: 'Widespread Client-Only API Usage',
        description: 'Multiple files are using client-only APIs without proper guards',
        action: 'Implement HydrationSafeWrapper or move code to useEffect',
      });
    }
    
    if (report.issuesByCategory.timeSensitive?.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Time-Sensitive Rendering',
        description: 'Components are using time-sensitive data that differs between server and client',
        action: 'Use consistent timestamps or format dates properly',
      });
    }
    
    recommendations.push({
      priority: 'low',
      title: 'Implement Hydration Error Boundary',
      description: 'Wrap components with HydrationErrorBoundary for better error handling',
      action: 'Add HydrationProvider to your app root',
    });
    
    return recommendations;
  }

  saveReport(outputPath) {
    const report = this.generateReport();
    
    // Save JSON report
    fs.writeFileSync(
      path.join(outputPath, 'hydration-audit-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    // Save human-readable report
    const readableReport = this.generateReadableReport(report);
    fs.writeFileSync(
      path.join(outputPath, 'hydration-audit-report.md'),
      readableReport
    );
    
    return report;
  }

  generateReadableReport(report) {
    let markdown = `# Hydration Audit Report

Generated on: ${new Date().toISOString()}

## Summary

- **Total Files Scanned**: ${report.summary.totalFiles}
- **Total Issues Found**: ${report.summary.totalIssues}
- **High Severity**: ${report.summary.highSeverity}
- **Medium Severity**: ${report.summary.mediumSeverity}
- **Low Severity**: ${report.summary.lowSeverity}

## Recommendations

`;

    report.recommendations.forEach(rec => {
      markdown += `### ${rec.title} (${rec.priority.toUpperCase()} Priority)

${rec.description}

**Action**: ${rec.action}

`;
    });

    markdown += `## Issues by Category

`;

    Object.entries(report.issuesByCategory).forEach(([category, issues]) => {
      markdown += `### ${category} (${issues.length} issues)

`;
      
      issues.slice(0, 10).forEach(issue => {
        markdown += `- **${issue.file}:${issue.line}** - ${issue.match}
  - Severity: ${issue.severity}
  - Suggestion: ${issue.suggestion}

`;
      });
      
      if (issues.length > 10) {
        markdown += `... and ${issues.length - 10} more issues

`;
      }
    });

    markdown += `## Most Problematic Files

`;

    const filesByIssueCount = Object.entries(report.issuesByFile)
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 10);

    filesByIssueCount.forEach(([file, issues]) => {
      markdown += `### ${file} (${issues.length} issues)

`;
      issues.forEach(issue => {
        markdown += `- Line ${issue.line}: ${issue.match} (${issue.severity})
`;
      });
      markdown += `
`;
    });

    return markdown;
  }
}

// Main execution
function main() {
  const auditor = new HydrationAuditor();
  
  console.log('🔍 Starting hydration audit...');
  
  // Scan main directories
  const dirsToScan = ['app', 'components', 'lib', 'hooks'];
  
  dirsToScan.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`Scanning ${dir}/...`);
      auditor.scanDirectory(dir);
    }
  });
  
  console.log(`✅ Scanned ${auditor.scannedFiles} files`);
  console.log(`🚨 Found ${auditor.issues.length} potential hydration issues`);
  
  // Create output directory
  const outputDir = 'hydration-audit';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  // Save report
  const report = auditor.saveReport(outputDir);
  
  console.log(`📊 Report saved to ${outputDir}/`);
  console.log(`📋 Summary:`);
  console.log(`   - High severity: ${report.summary.highSeverity}`);
  console.log(`   - Medium severity: ${report.summary.mediumSeverity}`);
  console.log(`   - Low severity: ${report.summary.lowSeverity}`);
  
  if (report.summary.highSeverity > 0) {
    console.log(`⚠️  High severity issues found! These are likely causing React error #130`);
    process.exit(1);
  } else {
    console.log(`✅ No high severity hydration issues detected`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { HydrationAuditor };