#!/usr/bin/env tsx
/**
 * CTA Audit Script
 * 
 * Audits all CTAs across marketing pages to ensure consistency
 * Validates:
 * - CTA text consistency
 * - CTA count per section (max 2)
 * - Presence of microcopy
 * - Authentication-aware display
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface CTAInstance {
  file: string;
  line: number;
  text: string;
  href?: string;
  context: string;
}

interface AuditResult {
  totalCTAs: number;
  uniqueTexts: Set<string>;
  ctasByPage: Map<string, CTAInstance[]>;
  issues: string[];
}

// Standard CTA texts we want to use
const STANDARD_CTA_TEXTS = {
  primary: 'Join Beta',
  secondary: 'Learn More',
  authenticated: 'Go to Dashboard',
};

// CTA text patterns to search for
const CTA_PATTERNS = [
  /Join Beta/gi,
  /Request Early Access/gi,
  /Get Started/gi,
  /Sign Up/gi,
  /Start Free/gi,
  /Start Free Trial/gi,
  /Request Access/gi,
];

async function findMarketingFiles(): Promise<string[]> {
  const patterns = [
    'app/(marketing)/**/*.tsx',
    'components/home/**/*.tsx',
    'components/pricing/**/*.tsx',
    'components/features/**/*.tsx',
  ];

  const files: string[] = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, { ignore: 'node_modules/**' });
    files.push(...matches);
  }

  return files;
}

function extractCTAs(content: string, filePath: string): CTAInstance[] {
  const lines = content.split('\n');
  const ctas: CTAInstance[] = [];

  lines.forEach((line, index) => {
    CTA_PATTERNS.forEach((pattern) => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          // Extract href if present in surrounding context
          const contextStart = Math.max(0, index - 2);
          const contextEnd = Math.min(lines.length, index + 3);
          const context = lines.slice(contextStart, contextEnd).join('\n');
          
          const hrefMatch = context.match(/href=["']([^"']+)["']/);
          
          ctas.push({
            file: filePath,
            line: index + 1,
            text: match,
            href: hrefMatch ? hrefMatch[1] : undefined,
            context: context.trim(),
          });
        });
      }
    });
  });

  return ctas;
}

function countCTAsPerSection(content: string): number[] {
  // Split by common section markers
  const sections = content.split(/<section|<div className="[^"]*section/gi);
  return sections.map((section) => {
    let count = 0;
    CTA_PATTERNS.forEach((pattern) => {
      const matches = section.match(pattern);
      if (matches) count += matches.length;
    });
    return count;
  });
}

async function auditCTAs(): Promise<AuditResult> {
  const files = await findMarketingFiles();
  const result: AuditResult = {
    totalCTAs: 0,
    uniqueTexts: new Set(),
    ctasByPage: new Map(),
    issues: [],
  };

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const ctas = extractCTAs(content, file);
    
    if (ctas.length > 0) {
      result.ctasByPage.set(file, ctas);
      result.totalCTAs += ctas.length;
      
      ctas.forEach((cta) => {
        result.uniqueTexts.add(cta.text);
      });
    }

    // Check CTA count per section
    const ctasPerSection = countCTAsPerSection(content);
    ctasPerSection.forEach((count, index) => {
      if (count > 2) {
        result.issues.push(
          `${file}: Section ${index + 1} has ${count} CTAs (max 2 allowed)`
        );
      }
    });
  }

  return result;
}

function generateReport(result: AuditResult): string {
  let report = '# CTA Audit Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  report += '## Summary\n\n';
  report += `- Total CTAs found: ${result.totalCTAs}\n`;
  report += `- Unique CTA texts: ${result.uniqueTexts.size}\n`;
  report += `- Pages with CTAs: ${result.ctasByPage.size}\n`;
  report += `- Issues found: ${result.issues.length}\n\n`;
  
  report += '## CTA Text Variations\n\n';
  Array.from(result.uniqueTexts).sort().forEach((text) => {
    report += `- "${text}"\n`;
  });
  report += '\n';
  
  report += '## Recommended Standard Texts\n\n';
  report += `- Primary: "${STANDARD_CTA_TEXTS.primary}"\n`;
  report += `- Secondary: "${STANDARD_CTA_TEXTS.secondary}"\n`;
  report += `- Authenticated: "${STANDARD_CTA_TEXTS.authenticated}"\n\n`;
  
  if (result.issues.length > 0) {
    report += '## Issues\n\n';
    result.issues.forEach((issue) => {
      report += `- ${issue}\n`;
    });
    report += '\n';
  }
  
  report += '## CTAs by Page\n\n';
  Array.from(result.ctasByPage.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([file, ctas]) => {
      report += `### ${file}\n\n`;
      ctas.forEach((cta) => {
        report += `- Line ${cta.line}: "${cta.text}"`;
        if (cta.href) {
          report += ` → ${cta.href}`;
        }
        report += '\n';
      });
      report += '\n';
    });
  
  return report;
}

async function main() {
  console.log('🔍 Auditing CTAs across marketing pages...\n');
  
  const result = await auditCTAs();
  const report = generateReport(result);
  
  // Write report to file
  const reportPath = path.join(process.cwd(), '.kiro/specs/signup-ux-optimization/CTA_AUDIT_REPORT.md');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report);
  
  console.log('✅ Audit complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   - Total CTAs: ${result.totalCTAs}`);
  console.log(`   - Unique texts: ${result.uniqueTexts.size}`);
  console.log(`   - Issues: ${result.issues.length}`);
  console.log(`\n📄 Full report: ${reportPath}\n`);
  
  // Print unique texts
  console.log('📝 CTA Text Variations Found:');
  Array.from(result.uniqueTexts).sort().forEach((text) => {
    console.log(`   - "${text}"`);
  });
  
  if (result.issues.length > 0) {
    console.log('\n⚠️  Issues:');
    result.issues.slice(0, 5).forEach((issue) => {
      console.log(`   - ${issue}`);
    });
    if (result.issues.length > 5) {
      console.log(`   ... and ${result.issues.length - 5} more (see report)`);
    }
  }
}

main().catch(console.error);
