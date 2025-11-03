#!/usr/bin/env node

/**
 * Build Error Diagnostic Tool
 * Scans the codebase for common build errors
 */

const fs = require('fs');
const path = require('path');

const errors = [];
const warnings = [];

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function scanDirectory(dir, callback) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath, callback);
      }
    } else if (stat.isFile()) {
      callback(filePath);
    }
  }
}

// Check 1: Top-level service instantiation
function checkTopLevelInstantiation(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
  if (filePath.includes('node_modules')) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Check for top-level new OpenAI(), new Instagram(), etc.
    if (line.match(/^export\s+(const|let)\s+\w+\s*=\s*new\s+(OpenAI|Instagram|Reddit|TikTok)/)) {
      errors.push({
        type: 'TOP_LEVEL_INSTANTIATION',
        file: filePath,
        line: index + 1,
        message: `Top-level service instantiation: ${line.trim()}`,
        suggestion: 'Use lazy instantiation pattern instead'
      });
    }
  });
}

// Check 2: Browser code without guards
function checkBrowserCodeWithoutGuards(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  if (filePath.includes('node_modules')) return;
  if (filePath.includes('/components/')) return; // Components are usually client-side
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const hasUseClient = content.includes("'use client'") || content.includes('"use client"');
  const hasDynamic = content.includes('export const dynamic');
  
  if (hasUseClient) return; // Client components are safe
  
  lines.forEach((line, index) => {
    // Check for browser APIs without guards
    if (line.match(/\b(window|document|localStorage|sessionStorage|navigator)\./)) {
      // Check if it's in a useEffect or has a guard
      const contextStart = Math.max(0, index - 3);
      const contextEnd = Math.min(lines.length, index + 3);
      const context = lines.slice(contextStart, contextEnd).join('\n');
      
      const hasGuard = context.includes('typeof window') || 
                      context.includes('typeof document') ||
                      context.includes('useEffect');
      
      if (!hasGuard && !hasDynamic) {
        warnings.push({
          type: 'BROWSER_CODE_WITHOUT_GUARD',
          file: filePath,
          line: index + 1,
          message: `Browser API without guard: ${line.trim()}`,
          suggestion: 'Add typeof window !== "undefined" guard or use useEffect'
        });
      }
    }
  });
}

// Check 3: Misplaced 'use client' directive
function checkUseClientPlacement(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  if (filePath.includes('node_modules')) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let useClientLine = -1;
  let firstNonCommentLine = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === "'use client'" || line === '"use client"' || line === "'use client';") {
      useClientLine = i;
    }
    
    if (line && !line.startsWith('//') && !line.startsWith('/*') && firstNonCommentLine === -1) {
      if (!line.includes('use client')) {
        firstNonCommentLine = i;
      }
    }
  }
  
  if (useClientLine > 0 && firstNonCommentLine >= 0 && firstNonCommentLine < useClientLine) {
    errors.push({
      type: 'MISPLACED_USE_CLIENT',
      file: filePath,
      line: useClientLine + 1,
      message: `'use client' directive is not on the first line`,
      suggestion: 'Move "use client" to the very first line of the file'
    });
  }
}

// Check 4: Conflicting directives
function checkConflictingDirectives(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  if (filePath.includes('node_modules')) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  const hasUseClient = content.includes("'use client'") || content.includes('"use client"');
  const hasDynamic = content.includes('export const dynamic');
  
  if (hasUseClient && hasDynamic) {
    errors.push({
      type: 'CONFLICTING_DIRECTIVES',
      file: filePath,
      line: 1,
      message: `File has both 'use client' and 'export const dynamic'`,
      suggestion: 'Split into Server Component (with dynamic) and Client Component (with use client)'
    });
  }
}

// Run all checks
log('\n🔍 Scanning codebase for build errors...\n', 'cyan');

const startTime = Date.now();

scanDirectory('./lib/services', checkTopLevelInstantiation);
scanDirectory('./app', checkBrowserCodeWithoutGuards);
scanDirectory('./app', checkUseClientPlacement);
scanDirectory('./app', checkConflictingDirectives);

const duration = Date.now() - startTime;

// Print results
log(`\n📊 Diagnostic Results (${duration}ms)\n`, 'cyan');

if (errors.length === 0 && warnings.length === 0) {
  log('✅ No issues found!', 'green');
} else {
  if (errors.length > 0) {
    log(`\n❌ ${errors.length} Error(s) Found:\n`, 'red');
    errors.forEach((error, index) => {
      log(`${index + 1}. [${error.type}] ${error.file}:${error.line}`, 'red');
      log(`   ${error.message}`, 'reset');
      log(`   💡 ${error.suggestion}\n`, 'yellow');
    });
  }
  
  if (warnings.length > 0) {
    log(`\n⚠️  ${warnings.length} Warning(s) Found:\n`, 'yellow');
    warnings.forEach((warning, index) => {
      log(`${index + 1}. [${warning.type}] ${warning.file}:${warning.line}`, 'yellow');
      log(`   ${warning.message}`, 'reset');
      log(`   💡 ${warning.suggestion}\n`, 'cyan');
    });
  }
}

log(`\n📈 Summary:`, 'cyan');
log(`   Errors: ${errors.length}`, errors.length > 0 ? 'red' : 'green');
log(`   Warnings: ${warnings.length}`, warnings.length > 0 ? 'yellow' : 'green');
log('');

process.exit(errors.length > 0 ? 1 : 0);
