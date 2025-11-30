#!/usr/bin/env node
/**
 * Script to automatically fix Input component violations
 * Replaces raw <input> elements with <Input> component from design system
 * 
 * Strategy:
 * 1. Skip component wrapper files (export-all.tsx) - these are low-level implementations
 * 2. Skip checkbox/radio inputs - these need specialized components
 * 3. Migrate standard text/email/password/number inputs
 * 4. Handle range inputs carefully (may need custom styling)
 */

import fs from 'fs';
import path from 'path';

interface Violation {
  file: string;
  line: number;
  content: string;
  type: 'text' | 'email' | 'password' | 'number' | 'range' | 'checkbox' | 'radio' | 'unknown';
}

// Files to skip (low-level component wrappers)
const SKIP_FILES = [
  'components/ui/export-all.tsx',
  'src/components/ui/export-all.tsx',
  'components/ui/container.example.tsx', // Example file
  'components/layout/SkeletonScreen.example.tsx', // Example file
];

// Detect input type from the input element
function detectInputType(content: string): Violation['type'] {
  if (content.includes('type="email"')) return 'email';
  if (content.includes('type="password"')) return 'password';
  if (content.includes('type="number"')) return 'number';
  if (content.includes('type="range"')) return 'range';
  if (content.includes('type="checkbox"')) return 'checkbox';
  if (content.includes('type="radio"')) return 'radio';
  if (content.includes('type="text"') || !content.includes('type=')) return 'text';
  return 'unknown';
}

// Extract attributes from input element
function extractAttributes(inputStr: string): {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: string;
  className?: string;
  disabled?: boolean;
  checked?: boolean;
  min?: string;
  max?: string;
  step?: string;
  id?: string;
  name?: string;
  required?: boolean;
  'aria-label'?: string;
  other: string[];
} {
  const attrs: any = { other: [] };
  
  // Extract type
  const typeMatch = inputStr.match(/type="([^"]*)"/);
  if (typeMatch) attrs.type = typeMatch[1];
  
  // Extract placeholder
  const placeholderMatch = inputStr.match(/placeholder="([^"]*)"/);
  if (placeholderMatch) attrs.placeholder = placeholderMatch[1];
  
  // Extract value (look for value={...})
  const valueMatch = inputStr.match(/value=\{([^}]+)\}/);
  if (valueMatch) attrs.value = valueMatch[1];
  
  // Extract onChange (look for onChange={...})
  const onChangeMatch = inputStr.match(/onChange=\{([^}]+)\}/);
  if (onChangeMatch) attrs.onChange = onChangeMatch[1];
  
  // Extract className
  const classMatch = inputStr.match(/className="([^"]*)"/);
  if (classMatch) attrs.className = classMatch[1];
  
  // Extract boolean attributes
  if (inputStr.includes('disabled')) attrs.disabled = true;
  if (inputStr.includes('checked')) attrs.checked = true;
  if (inputStr.includes('required')) attrs.required = true;
  
  // Extract range-specific attributes
  const minMatch = inputStr.match(/min[=\{]"?([^"\s}]+)"?/);
  if (minMatch) attrs.min = minMatch[1];
  
  const maxMatch = inputStr.match(/max[=\{]"?([^"\s}]+)"?/);
  if (maxMatch) attrs.max = maxMatch[1];
  
  const stepMatch = inputStr.match(/step[=\{]"?([^"\s}]+)"?/);
  if (stepMatch) attrs.step = stepMatch[1];
  
  // Extract id
  const idMatch = inputStr.match(/id="([^"]*)"/);
  if (idMatch) attrs.id = idMatch[1];
  
  // Extract name
  const nameMatch = inputStr.match(/name="([^"]*)"/);
  if (nameMatch) attrs.name = nameMatch[1];
  
  // Extract aria-label
  const ariaMatch = inputStr.match(/aria-label="([^"]*)"/);
  if (ariaMatch) attrs['aria-label'] = ariaMatch[1];
  
  return attrs;
}

// Build Input component replacement
function buildInputReplacement(attrs: ReturnType<typeof extractAttributes>, inputType: Violation['type']): string {
  const props: string[] = [];
  
  // Add type if not text (text is default)
  if (attrs.type && attrs.type !== 'text') {
    props.push(`type="${attrs.type}"`);
  }
  
  // Add placeholder
  if (attrs.placeholder) {
    props.push(`placeholder="${attrs.placeholder}"`);
  }
  
  // Add value
  if (attrs.value) {
    props.push(`value={${attrs.value}}`);
  }
  
  // Add onChange
  if (attrs.onChange) {
    props.push(`onChange={${attrs.onChange}}`);
  }
  
  // Add disabled
  if (attrs.disabled) {
    props.push('disabled');
  }
  
  // Add required
  if (attrs.required) {
    props.push('required');
  }
  
  // Add id
  if (attrs.id) {
    props.push(`id="${attrs.id}"`);
  }
  
  // Add name
  if (attrs.name) {
    props.push(`name="${attrs.name}"`);
  }
  
  // Add aria-label
  if (attrs['aria-label']) {
    props.push(`aria-label="${attrs['aria-label']}"`);
  }
  
  // Add range-specific props
  if (inputType === 'range') {
    if (attrs.min) props.push(`min={${attrs.min}}`);
    if (attrs.max) props.push(`max={${attrs.max}}`);
    if (attrs.step) props.push(`step={${attrs.step}}`);
    // Keep className for range inputs as they may need custom styling
    if (attrs.className) props.push(`className="${attrs.className}"`);
  }
  
  return `<Input ${props.join(' ')} />`;
}

// Check if file should be skipped
function shouldSkipFile(filePath: string): boolean {
  return SKIP_FILES.some(skip => filePath.includes(skip));
}

// Check if input should be skipped (checkbox, radio, or in skip file)
function shouldSkipInput(filePath: string, inputType: Violation['type']): boolean {
  if (shouldSkipFile(filePath)) return true;
  if (inputType === 'checkbox' || inputType === 'radio') return true;
  return false;
}

// Add Input import if not present
function ensureInputImport(content: string): string {
  // Check if Input is already imported
  if (content.includes('from "@/components/ui/input"') || 
      content.includes("from '@/components/ui/input'")) {
    return content;
  }
  
  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }
  
  // Add import after last import
  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, 'import { Input } from "@/components/ui/input";');
    return lines.join('\n');
  }
  
  // If no imports found, add at the top (after 'use client' if present)
  const useClientIndex = lines.findIndex(line => line.includes("'use client'") || line.includes('"use client"'));
  if (useClientIndex >= 0) {
    lines.splice(useClientIndex + 1, 0, '', 'import { Input } from "@/components/ui/input";');
  } else {
    lines.unshift('import { Input } from "@/components/ui/input";', '');
  }
  
  return lines.join('\n');
}

// Main migration function
async function migrateFile(filePath: string): Promise<{ success: boolean; changes: number; skipped: number }> {
  const content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;
  let changes = 0;
  let skipped = 0;
  let needsImport = false;
  
  // Find all <input> elements (simple regex for now)
  const inputRegex = /<input[^>]*>/g;
  const matches = content.match(inputRegex);
  
  if (!matches) {
    return { success: true, changes: 0, skipped: 0 };
  }
  
  for (const match of matches) {
    const inputType = detectInputType(match);
    
    // Skip if needed
    if (shouldSkipInput(filePath, inputType)) {
      skipped++;
      continue;
    }
    
    // Extract attributes and build replacement
    const attrs = extractAttributes(match);
    const replacement = buildInputReplacement(attrs, inputType);
    
    // Replace in content
    newContent = newContent.replace(match, replacement);
    changes++;
    needsImport = true;
  }
  
  // Add import if we made changes
  if (needsImport && changes > 0) {
    newContent = ensureInputImport(newContent);
  }
  
  // Write back if changes were made
  if (changes > 0) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
  }
  
  return { success: true, changes, skipped };
}

// Main execution
async function main() {
  console.log('🔧 Starting Input Component Migration\n');
  
  const filesToMigrate = [
    'app/(app)/schedule/page.tsx',
    'app/(app)/onlyfans-assisted/page.tsx',
    'app/(app)/of-connect/DebugLogin.tsx',
    'app/(app)/design-system/page.tsx',
    'app/(marketing)/platforms/connect/onlyfans/page.tsx',
    'components/pricing/UpgradeModal.tsx',
    'components/content/VideoEditor.tsx',
    'components/content/TemplateSelector.tsx',
  ];
  
  let totalChanges = 0;
  let totalSkipped = 0;
  let filesModified = 0;
  
  for (const file of filesToMigrate) {
    const fullPath = path.join(process.cwd(), file);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${file}`);
      continue;
    }
    
    console.log(`📝 Processing: ${file}`);
    const result = await migrateFile(fullPath);
    
    if (result.changes > 0) {
      console.log(`   ✅ ${result.changes} input(s) migrated`);
      filesModified++;
      totalChanges += result.changes;
    }
    
    if (result.skipped > 0) {
      console.log(`   ⏭️  ${result.skipped} input(s) skipped (checkbox/radio/wrapper)`);
      totalSkipped += result.skipped;
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`   Files modified: ${filesModified}`);
  console.log(`   Total inputs migrated: ${totalChanges}`);
  console.log(`   Total inputs skipped: ${totalSkipped}`);
  console.log(`   Remaining violations: ${29 - totalChanges}`);
  
  if (totalChanges > 0) {
    console.log('\n✅ Migration complete! Run the violation checker to verify.');
  }
}

main().catch(console.error);
