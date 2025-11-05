#!/usr/bin/env node

/**
 * Fix SES Syntax Errors
 * Corrects JSX syntax errors in email templates
 */

const fs = require('fs');
const path = require('path');

const sesFilePath = path.join(process.cwd(), 'lib/email/ses.ts');

console.log('🔧 Fixing SES syntax errors...');

try {
  // Read the file
  let content = fs.readFileSync(sesFilePath, 'utf8');
  
  // Replace all occurrences of the JSX syntax error
  const originalPattern = /\$\{<SafeCurrentYear fallback=\{<span>2024<\/span>\} \/>\}/g;
  const replacement = '${new Date().getFullYear()}';
  
  const updatedContent = content.replace(originalPattern, replacement);
  
  // Count replacements
  const matches = content.match(originalPattern);
  const replacementCount = matches ? matches.length : 0;
  
  if (replacementCount > 0) {
    // Write the corrected content back
    fs.writeFileSync(sesFilePath, updatedContent);
    console.log(`✅ Fixed ${replacementCount} JSX syntax errors in SES file`);
  } else {
    console.log('ℹ️ No JSX syntax errors found in SES file');
  }
  
} catch (error) {
  console.error('❌ Error fixing SES syntax errors:', error.message);
  process.exit(1);
}

console.log('🎉 SES syntax errors fixed successfully!');