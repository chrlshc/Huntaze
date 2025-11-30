#!/usr/bin/env tsx

/**
 * Automated Card Component Migration Script
 * 
 * This script automatically fixes Card component violations by:
 * 1. Adding Card import if missing
 * 2. Replacing card-like divs with <Card> component
 * 3. Replacing glass-effect divs with <Card variant="glass">
 * 4. Preserving all attributes and functionality
 * 
 * Usage: npx tsx scripts/fix-card-component-violations.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Replacement {
  file: string;
  line: number;
  original: string;
  replacement: string;
  type: string;
}

const replacements: Replacement[] = [];
let filesModified = 0;

// Patterns to detect card-like divs
const CARD_PATTERNS = [
  // Glass effect patterns
  /className="([^"]*\b(?:glass-card|backdrop-blur)[^"]*)"/g,
  
  // Card class patterns - including huntaze-card and more
  /className="([^"]*\b(?:huntaze-card|elevated-card|metric-card|platform-card|tool-card|error-card|auth-card|hz-card|beta-stat-card|hz-node-card|onboarding-card|platform-status-card|integration-card|stat-card)[^"]*)"/g,
  
  // Card styling patterns (rounded + border + padding/shadow)
  /className="([^"]*\brounded-(?:lg|xl|2xl|3xl)[^"]*\bborder[^"]*\b(?:p-\d+|shadow)[^"]*)"/g,
  /className="([^"]*\bbg-(?:white|gray-\d+)[^"]*\brounded-(?:lg|xl|2xl|3xl)[^"]*\b(?:shadow|border)[^"]*)"/g,
  
  // Design system card patterns
  /className="([^"]*\bbg-\[var\(--bg-surface\)\][^"]*\brounded-\[var\(--radius-card\)\][^"]*)"/g,
];

function hasCardImport(content: string): boolean {
  return /import\s+{[^}]*\bCard\b[^}]*}\s+from\s+['"]@\/components\/ui\/card['"]/.test(content) ||
         /import\s+{[^}]*\bCard\b[^}]*}\s+from\s+['"]@\/components\/ui\/export-all['"]/.test(content);
}

function addCardImport(content: string): string {
  // Check if there are already imports from @/components/ui
  const uiImportMatch = content.match(/import\s+{([^}]+)}\s+from\s+['"]@\/components\/ui\/([^'"]+)['"]/);
  
  if (uiImportMatch) {
    const imports = uiImportMatch[1];
    const module = uiImportMatch[2];
    
    // If importing from export-all or card, add Card to existing import
    if (module === 'export-all' || module === 'card') {
      if (!imports.includes('Card')) {
        const newImports = imports.trim() + ', Card';
        return content.replace(uiImportMatch[0], `import { ${newImports} } from '@/components/ui/${module}'`);
      }
      return content;
    }
  }
  
  // Add new import at the top after other imports
  const lines = content.split('\n');
  let insertIndex = 0;
  
  // Find the last import statement
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      insertIndex = i + 1;
    } else if (lines[i].trim() && !lines[i].trim().startsWith('//') && insertIndex > 0) {
      break;
    }
  }
  
  lines.splice(insertIndex, 0, "import { Card } from '@/components/ui/card';");
  return lines.join('\n');
}

function isGlassEffect(className: string): boolean {
  return /\b(?:glass-card|backdrop-blur|bg-\w+\/\d+\s+backdrop-blur)/.test(className);
}

function shouldSkipDiv(line: string): boolean {
  // Skip if it's already a Card component
  if (line.includes('<Card')) return true;
  
  // Skip loading spinners - they're not cards
  if (line.includes('animate-spin')) return true;
  
  // Skip very small decorative elements (circles, dots, etc.)
  if (/className="[^"]*\b(?:w-\d+\s+h-\d+\s+rounded-full|rounded-full\s+w-\d+\s+h-\d+)[^"]*"/.test(line) && 
      /\b(?:w-\d{1,2}\s+h-\d{1,2}|h-\d{1,2}\s+w-\d{1,2})/.test(line)) {
    return true;
  }
  
  // Skip toggle switches - they're form controls, not cards
  if (line.includes('peer-focus:ring') && /\bw-11\s+h-6/.test(line)) return true;
  
  // Skip if it's a background wrapper without semantic card meaning
  if (line.includes('fixed inset-0') || line.includes('absolute inset-')) return true;
  
  // Skip status indicators and badges
  if (/\b(?:w-\d+\s+h-\d+|h-\d+\s+w-\d+)\s+rounded-full\s+border-\d+/.test(line) && 
      /\b(?:w-\d{1,2}|h-\d{1,2})/.test(line)) {
    return true;
  }
  
  return false;
}

function replaceCardDiv(content: string, filePath: string): string {
  const lines = content.split('\n');
  let modified = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip if not a div or should be skipped
    if (!line.includes('<div') || shouldSkipDiv(line)) continue;
    
    // Check for card patterns
    for (const pattern of CARD_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const className = match[1];
        const isGlass = isGlassEffect(className);
        
        // Extract the full div opening tag
        const divMatch = line.match(/<div\s+([^>]*)>/);
        if (!divMatch) continue;
        
        const fullAttributes = divMatch[1];
        
        // Remove card-specific classes that are now handled by Card component
        let cleanedAttributes = fullAttributes
          .replace(/className="([^"]*)"/g, (_, classes) => {
            const cleaned = classes
              .replace(/\b(?:huntaze-card|glass-card|elevated-card|metric-card|platform-card|tool-card|error-card|auth-card|hz-card|beta-stat-card|hz-node-card|onboarding-card|platform-status-card|integration-card|stat-card|metric-card-header|tool-card-header|stat-card-header|platform-card-content)\b/g, '')
              .replace(/\s+/g, ' ')
              .trim();
            return cleaned ? `className="${cleaned}"` : '';
          })
          .replace(/\s+/g, ' ')
          .trim();
        
        // Build Card component
        const variant = isGlass ? ' variant="glass"' : '';
        const attrs = cleanedAttributes ? ` ${cleanedAttributes}` : '';
        const replacement = `<Card${variant}${attrs}>`;
        
        // Replace the div with Card
        const newLine = line.replace(/<div\s+[^>]*>/, replacement);
        
        if (newLine !== line) {
          replacements.push({
            file: filePath,
            line: i + 1,
            original: line.trim(),
            replacement: newLine.trim(),
            type: isGlass ? 'glass-effect' : 'card-styling'
          });
          
          lines[i] = newLine;
          modified = true;
        }
        
        break; // Only apply one pattern per line
      }
    }
  }
  
  if (modified) {
    filesModified++;
  }
  
  return lines.join('\n');
}

async function processFile(filePath: string): Promise<void> {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Replace card divs
    content = replaceCardDiv(content, filePath);
    
    // Add Card import if we made changes and it's missing
    if (content !== originalContent && !hasCardImport(content)) {
      content = addCardImport(content);
    }
    
    // Write back if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function main() {
  console.log('🔍 Finding files with Card component violations...\n');
  
  // Find all TypeScript and TSX files
  const files = await glob('**/*.{ts,tsx}', {
    ignore: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'build/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      'scripts/check-*.ts',
      'scripts/fix-*.ts',
    ],
  });
  
  console.log(`📄 Processing ${files.length} files...\n`);
  
  for (const file of files) {
    await processFile(file);
  }
  
  console.log('\n✅ Migration Complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   Files modified: ${filesModified}`);
  console.log(`   Total replacements: ${replacements.length}`);
  
  if (replacements.length > 0) {
    console.log(`\n📝 Sample replacements:`);
    replacements.slice(0, 10).forEach(r => {
      console.log(`\n   ${r.file}:${r.line} [${r.type}]`);
      console.log(`   - ${r.original.substring(0, 80)}${r.original.length > 80 ? '...' : ''}`);
      console.log(`   + ${r.replacement.substring(0, 80)}${r.replacement.length > 80 ? '...' : ''}`);
    });
    
    if (replacements.length > 10) {
      console.log(`\n   ... and ${replacements.length - 10} more replacements`);
    }
  }
  
  console.log(`\n🧪 Run tests to verify:`);
  console.log(`   npm run test -- tests/unit/properties/card-component-usage.property.test.ts --run`);
}

main().catch(console.error);
