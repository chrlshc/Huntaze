#!/usr/bin/env node
/**
 * Script to fix color palette violations
 * Replaces unapproved colors with design tokens
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Color mapping: unapproved color -> design token
const COLOR_MAPPINGS: Record<string, string> = {
  // Common grays/blacks
  '#0F0F10': 'var(--bg-primary)',
  '#0a0a0a': 'var(--bg-primary)',
  '#131316': 'var(--bg-secondary)',
  '#1F1F1F': 'var(--bg-secondary)',
  '#1A1A1A': 'var(--bg-secondary)',
  '#1a1a1a': 'var(--bg-secondary)',
  '#1a1a1c': 'var(--bg-hover)',
  '#2A2A2A': 'var(--bg-tertiary)',
  '#2a2a2a': 'var(--bg-tertiary)',
  '#0f0f0f': 'var(--bg-primary)',
  '#141414': 'var(--bg-input)',
  
  // Text colors
  '#EDEDEF': 'var(--text-primary)',
  '#a3a3a3': 'var(--text-secondary)',
  '#737373': 'var(--text-tertiary)',
  '#9CA3AF': 'var(--text-secondary)',
  '#9ca3af': 'var(--text-secondary)',
  '#6B7280': 'var(--text-tertiary)',
  '#6b7280': 'var(--text-tertiary)',
  '#4B5563': 'var(--text-tertiary)',
  '#4b5563': 'var(--text-tertiary)',
  '#1F2937': 'var(--text-primary)',
  '#1f2937': 'var(--text-primary)',
  '#111827': 'var(--text-primary)',
  
  // Accent colors - violet/purple
  '#8B5CF6': 'var(--accent-primary)',
  '#A855F7': 'var(--accent-primary)',
  '#7D57C1': 'var(--accent-primary)',
  '#6D28D9': 'var(--accent-primary-active)',
  '#6B47AF': 'var(--accent-primary-active)',
  '#5B21B6': 'var(--accent-primary-active)',
  '#7C3AED': 'var(--accent-primary-hover)',
  '#9333EA': 'var(--accent-primary)',
  '#9333ea': 'var(--accent-primary)',
  '#A78BFA': 'var(--accent-primary)',
  '#C724B1': 'var(--accent-primary)',
  '#8A2BE2': 'var(--accent-primary)',
  '#a855f7': 'var(--accent-primary)',
  
  // Success/green
  '#10B981': 'var(--accent-success)',
  '#10b981': 'var(--accent-success)',
  '#16A34A': 'var(--accent-success)',
  '#22c55e': 'var(--accent-success)',
  '#059669': 'var(--accent-success)',
  '#388e3c': 'var(--accent-success)',
  
  // Warning/amber
  '#F59E0B': 'var(--accent-warning)',
  '#f59e0b': 'var(--accent-warning)',
  '#EAB308': 'var(--accent-warning)',
  '#eab308': 'var(--accent-warning)',
  '#fbbf24': 'var(--accent-warning)',
  '#f57c00': 'var(--accent-warning)',
  
  // Error/red
  '#EF4444': 'var(--accent-error)',
  '#ef4444': 'var(--accent-error)',
  '#DC2626': 'var(--accent-error)',
  '#dc2626': 'var(--accent-error)',
  '#d62728': 'var(--accent-error)',
  '#dc3545': 'var(--accent-error)',
  '#d32f2f': 'var(--accent-error)',
  
  // Info/blue
  '#3B82F6': 'var(--accent-info)',
  '#3b82f6': 'var(--accent-info)',
  '#2563EB': 'var(--accent-info)',
  '#6366f1': 'var(--accent-info)',
  '#6366F1': 'var(--accent-info)',
  '#4F46E5': 'var(--accent-info)',
  '#2196f3': 'var(--accent-info)',
  
  // Pink/magenta
  '#EC4899': 'var(--accent-primary)',
  '#ec4899': 'var(--accent-primary)',
  
  // Borders/subtle
  '#E5E7EB': 'var(--border-subtle)',
  '#e5e7eb': 'var(--border-subtle)',
  '#D1D5DB': 'var(--border-subtle)',
  '#d1d5db': 'var(--border-subtle)',
  '#ddd': 'var(--border-subtle)',
  
  // Backgrounds
  '#F9FAFB': 'var(--bg-glass)',
  '#f9fafb': 'var(--bg-glass)',
  '#F3F4F6': 'var(--bg-glass)',
  '#f3f4f6': 'var(--bg-glass)',
  '#F5F5F5': 'var(--bg-glass)',
  '#f5f5f5': 'var(--bg-glass)',
  '#f9f9f9': 'var(--bg-glass)',
  '#F8F9FB': 'var(--bg-glass)',
  '#f2f2f2': 'var(--bg-glass)',
  '#f0f0f0': 'var(--bg-glass)',
  '#999': 'var(--text-tertiary)',
  '#666': 'var(--text-tertiary)',
  '#333': 'var(--text-primary)',
  
  // Special warning backgrounds
  '#FEF3C7': 'rgba(245, 158, 11, 0.1)',
  '#fef3c7': 'rgba(245, 158, 11, 0.1)',
  '#FFFBEB': 'rgba(245, 158, 11, 0.1)',
  '#fffbeb': 'rgba(245, 158, 11, 0.1)',
  '#92400E': 'var(--accent-warning)',
  '#92400e': 'var(--accent-warning)',
  '#78350F': 'var(--accent-warning)',
  '#78350f': 'var(--accent-warning)',
  
  // Error backgrounds
  '#FEE2E2': 'rgba(239, 68, 68, 0.1)',
  '#fee2e2': 'rgba(239, 68, 68, 0.1)',
  '#FEF2F2': 'rgba(239, 68, 68, 0.1)',
  '#fef2f2': 'rgba(239, 68, 68, 0.1)',
  
  // Success backgrounds
  '#F0FDF4': 'rgba(16, 185, 129, 0.1)',
  '#f0fdf4': 'rgba(16, 185, 129, 0.1)',
};

// RGBA color mappings
const RGBA_MAPPINGS: Array<{ pattern: RegExp; replacement: string }> = [
  // Violet/purple with opacity
  { pattern: /rgba?\(139,\s*92,\s*246,\s*0\.([0-9.]+)\)/gi, replacement: 'rgba(139, 92, 246, 0.$1)' },
  { pattern: /rgba?\(147,\s*51,\s*234,\s*0\.([0-9.]+)\)/gi, replacement: 'rgba(139, 92, 246, 0.$1)' },
  { pattern: /rgba?\(168,\s*85,\s*247,\s*0\.([0-9.]+)\)/gi, replacement: 'rgba(139, 92, 246, 0.$1)' },
  { pattern: /rgba?\(167,\s*139,\s*250,\s*0\.([0-9.]+)\)/gi, replacement: 'rgba(139, 92, 246, 0.$1)' },
  { pattern: /rgba?\(244,\s*114,\s*182,\s*0\.([0-9.]+)\)/gi, replacement: 'rgba(139, 92, 246, 0.$1)' },
  { pattern: /rgba?\(236,\s*72,\s*153,\s*0\.([0-9.]+)\)/gi, replacement: 'rgba(139, 92, 246, 0.$1)' },
  
  // Blue with opacity
  { pattern: /rgba?\(59,\s*130,\s*246,\s*0\.([0-9.]+)\)/gi, replacement: 'rgba(59, 130, 246, 0.$1)' },
  { pattern: /rgba?\(99,\s*102,\s*241,\s*0\.([0-9.]+)\)/gi, replacement: 'rgba(59, 130, 246, 0.$1)' },
  
  // Red/error with opacity
  { pattern: /rgba?\(239,\s*68,\s*68,\s*0\.([0-9.]+)\)/gi, replacement: 'rgba(239, 68, 68, 0.$1)' },
  
  // Green/success with opacity
  { pattern: /rgba?\(16,\s*185,\s*129,\s*0\.([0-9.]+)\)/gi, replacement: 'rgba(16, 185, 129, 0.$1)' },
  
  // White with opacity (borders/glass)
  { pattern: /rgba?\(255,\s*255,\s*255,\s*0\.([0-9.]+)\)/gi, replacement: 'rgba(255, 255, 255, 0.$1)' },
  
  // Black with opacity (shadows)
  { pattern: /rgba?\(0,\s*0,\s*0,\s*0\.([0-9.]+)\)/gi, replacement: 'rgba(0, 0, 0, 0.$1)' },
  { pattern: /rgba?\(0,\s*0,\s*0,\s*0\.8\)/gi, replacement: 'rgba(0, 0, 0, 0.7)' },
  { pattern: /rgba?\(0,\s*0,\s*0,\s*0\.9\)/gi, replacement: 'rgba(0, 0, 0, 0.7)' },
  { pattern: /rgba?\(0,\s*0,\s*0,\s*0\.45\)/gi, replacement: 'rgba(0, 0, 0, 0.5)' },
  { pattern: /rgba?\(0,\s*0,\s*0,\s*0\.35\)/gi, replacement: 'rgba(0, 0, 0, 0.3)' },
  { pattern: /rgba?\(0,\s*0,\s*0,\s*0\.2\)/gi, replacement: 'rgba(0, 0, 0, 0.3)' },
  { pattern: /rgba?\(0,\s*0,\s*0,\s*0\.1\)/gi, replacement: 'rgba(0, 0, 0, 0.3)' },
];

interface Fix {
  file: string;
  changes: number;
}

const fixes: Fix[] = [];

function replaceColors(content: string, filePath: string): string {
  let modified = content;
  let changeCount = 0;
  
  // Replace hex colors
  for (const [oldColor, newToken] of Object.entries(COLOR_MAPPINGS)) {
    const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = (modified.match(regex) || []).length;
    if (matches > 0) {
      modified = modified.replace(regex, newToken);
      changeCount += matches;
    }
  }
  
  // Replace RGBA colors
  for (const { pattern, replacement } of RGBA_MAPPINGS) {
    const matches = (modified.match(pattern) || []).length;
    if (matches > 0) {
      modified = modified.replace(pattern, replacement);
      changeCount += matches;
    }
  }
  
  if (changeCount > 0) {
    fixes.push({ file: filePath, changes: changeCount });
  }
  
  return modified;
}

async function fixColorViolations() {
  console.log('🎨 Fixing color palette violations...\n');
  
  // Get all files to process
  const cssFiles = await glob('**/*.css', {
    cwd: process.cwd(),
    ignore: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'styles/design-tokens.css',
    ],
  });
  
  const tsxFiles = await glob('**/*.{tsx,ts}', {
    cwd: process.cwd(),
    ignore: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'tests/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      'scripts/check-*.ts',
      'scripts/fix-*.ts',
    ],
  });
  
  const allFiles = [...cssFiles, ...tsxFiles];
  
  console.log(`📁 Processing ${allFiles.length} files...\n`);
  
  for (const file of allFiles) {
    const filePath = path.join(process.cwd(), file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const modified = replaceColors(content, file);
    
    if (modified !== content) {
      fs.writeFileSync(filePath, modified, 'utf-8');
    }
  }
  
  // Report
  console.log('\n✅ Color palette violations fixed!\n');
  console.log(`📊 Summary:`);
  console.log(`   Files modified: ${fixes.length}`);
  console.log(`   Total replacements: ${fixes.reduce((sum, f) => sum + f.changes, 0)}\n`);
  
  if (fixes.length > 0) {
    console.log('📝 Modified files:');
    fixes.slice(0, 20).forEach(fix => {
      console.log(`   ${fix.file} (${fix.changes} changes)`);
    });
    if (fixes.length > 20) {
      console.log(`   ... and ${fixes.length - 20} more files`);
    }
  }
}

fixColorViolations().catch(console.error);
