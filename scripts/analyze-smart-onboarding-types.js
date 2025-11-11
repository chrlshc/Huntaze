#!/usr/bin/env node

/**
 * Smart Onboarding Type Analyzer
 * 
 * Scans the smart-onboarding codebase to identify:
 * - Stub types (type X = any)
 * - Duplicate type definitions
 * - Missing type imports
 * - Type coverage metrics
 * 
 * Usage: node scripts/analyze-smart-onboarding-types.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SMART_ONBOARDING_DIR = path.join(process.cwd(), 'lib/smart-onboarding');
const OUTPUT_FILE = path.join(process.cwd(), 'smart-onboarding-type-analysis.json');

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  filesAnalyzed: [],
  stubTypes: [],
  duplicateTypes: [],
  missingImports: [],
  typeCoverage: {
    totalTypes: 0,
    properlyTyped: 0,
    stubTypes: 0,
    anyTypes: 0,
    coveragePercentage: 0
  },
  recommendations: []
};

/**
 * Recursively get all TypeScript files in a directory
 */
function getTypeScriptFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and test directories
      if (!file.includes('node_modules') && !file.includes('test')) {
        getTypeScriptFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.test.ts')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Analyze a file for stub types
 */
function findStubTypes(filePath, content) {
  const stubTypePattern = /type\s+(\w+)\s*=\s*any\s*;?/g;
  let match;
  const stubs = [];

  while ((match = stubTypePattern.exec(content)) !== null) {
    const typeName = match[1];
    const lineNumber = content.substring(0, match.index).split('\n').length;
    
    // Count usages of this type in the file
    const usagePattern = new RegExp(`\\b${typeName}\\b`, 'g');
    const usageCount = (content.match(usagePattern) || []).length - 1; // -1 for the definition itself

    stubs.push({
      name: typeName,
      location: `${filePath}:${lineNumber}`,
      usageCount: usageCount
    });

    results.typeCoverage.stubTypes++;
  }

  return stubs;
}

/**
 * Find duplicate type definitions across files
 */
function findDuplicateTypes(allTypes) {
  const typeMap = new Map();
  const duplicates = [];

  allTypes.forEach(({ name, location, definition }) => {
    if (!typeMap.has(name)) {
      typeMap.set(name, []);
    }
    typeMap.set(name, [...typeMap.get(name), { location, definition }]);
  });

  typeMap.forEach((locations, name) => {
    if (locations.length > 1) {
      duplicates.push({
        name,
        locations: locations.map(l => l.location),
        definitions: locations.map(l => l.definition),
        recommendation: 'consolidate'
      });
    }
  });

  return duplicates;
}

/**
 * Find missing imports
 */
function findMissingImports(filePath, content) {
  const missing = [];
  
  // Pattern: import { Type } from '../types'
  const importPattern = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importPattern.exec(content)) !== null) {
    const importedTypes = match[1].split(',').map(t => t.trim());
    const importPath = match[2];
    const lineNumber = content.substring(0, match.index).split('\n').length;

    // Check if importing from types file
    if (importPath.includes('types') || importPath.includes('../types')) {
      importedTypes.forEach(type => {
        // Check if this type is actually used in the file
        const typeUsagePattern = new RegExp(`\\b${type}\\b`, 'g');
        const usageCount = (content.match(typeUsagePattern) || []).length - 1;

        if (usageCount > 0) {
          // This is a potentially missing import if we see errors
          // We'll mark it for verification
          missing.push({
            type,
            importedFrom: importPath,
            location: `${filePath}:${lineNumber}`,
            usageCount
          });
        }
      });
    }
  }

  return missing;
}

/**
 * Extract type definitions from content
 */
function extractTypeDefinitions(filePath, content) {
  const types = [];
  
  // Match interface definitions
  const interfacePattern = /(?:export\s+)?interface\s+(\w+)/g;
  let match;

  while ((match = interfacePattern.exec(content)) !== null) {
    const typeName = match[1];
    const lineNumber = content.substring(0, match.index).split('\n').length;
    
    types.push({
      name: typeName,
      location: `${filePath}:${lineNumber}`,
      definition: match[0],
      kind: 'interface'
    });

    results.typeCoverage.totalTypes++;
  }

  // Match type alias definitions
  const typePattern = /(?:export\s+)?type\s+(\w+)\s*=/g;
  
  while ((match = typePattern.exec(content)) !== null) {
    const typeName = match[1];
    const lineNumber = content.substring(0, match.index).split('\n').length;
    
    types.push({
      name: typeName,
      location: `${filePath}:${lineNumber}`,
      definition: match[0],
      kind: 'type'
    });

    results.typeCoverage.totalTypes++;
  }

  return types;
}

/**
 * Count 'any' types in content
 */
function countAnyTypes(content) {
  // Match : any, <any>, any[], etc.
  const anyPattern = /:\s*any\b|<any>|any\[\]/g;
  const matches = content.match(anyPattern) || [];
  return matches.length;
}

/**
 * Analyze a single file
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(process.cwd(), filePath);

  results.filesAnalyzed.push(relativePath);

  // Find stub types
  const stubs = findStubTypes(relativePath, content);
  results.stubTypes.push(...stubs);

  // Find missing imports
  const missing = findMissingImports(relativePath, content);
  results.missingImports.push(...missing);

  // Extract type definitions
  const types = extractTypeDefinitions(relativePath, content);

  // Count any types
  const anyCount = countAnyTypes(content);
  results.typeCoverage.anyTypes += anyCount;

  return types;
}

/**
 * Generate recommendations based on findings
 */
function generateRecommendations() {
  const recommendations = [];

  if (results.stubTypes.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'stub_types',
      message: `Found ${results.stubTypes.length} stub types that need proper definitions`,
      action: 'Define proper interfaces for all stub types in lib/smart-onboarding/types/index.ts'
    });
  }

  if (results.duplicateTypes.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'duplicates',
      message: `Found ${results.duplicateTypes.length} duplicate type definitions`,
      action: 'Consolidate duplicate types into single definitions in core types file'
    });
  }

  if (results.missingImports.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'imports',
      message: `Found ${results.missingImports.length} potentially missing imports`,
      action: 'Verify all imported types are exported from their source modules'
    });
  }

  if (results.typeCoverage.anyTypes > 10) {
    recommendations.push({
      priority: 'medium',
      category: 'any_types',
      message: `Found ${results.typeCoverage.anyTypes} uses of 'any' type`,
      action: 'Replace any types with proper type definitions where possible'
    });
  }

  results.recommendations = recommendations;
}

/**
 * Calculate type coverage percentage
 */
function calculateCoverage() {
  const { totalTypes, stubTypes, anyTypes } = results.typeCoverage;
  
  if (totalTypes === 0) {
    results.typeCoverage.coveragePercentage = 0;
    return;
  }

  const properlyTyped = totalTypes - stubTypes;
  results.typeCoverage.properlyTyped = properlyTyped;
  results.typeCoverage.coveragePercentage = Math.round((properlyTyped / totalTypes) * 100);
}

/**
 * Main analysis function
 */
function analyzeSmartOnboarding() {
  console.log('🔍 Analyzing Smart Onboarding TypeScript types...\n');

  // Get all TypeScript files
  const files = getTypeScriptFiles(SMART_ONBOARDING_DIR);
  console.log(`Found ${files.length} TypeScript files to analyze\n`);

  // Analyze each file and collect type definitions
  const allTypes = [];
  files.forEach(file => {
    const types = analyzeFile(file);
    allTypes.push(...types);
  });

  // Find duplicates
  results.duplicateTypes = findDuplicateTypes(allTypes);

  // Calculate coverage
  calculateCoverage();

  // Generate recommendations
  generateRecommendations();

  // Write results to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));

  // Print summary
  console.log('📊 Analysis Summary:');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Files Analyzed:        ${results.filesAnalyzed.length}`);
  console.log(`Total Types Found:     ${results.typeCoverage.totalTypes}`);
  console.log(`Stub Types:            ${results.stubTypes.length}`);
  console.log(`Duplicate Types:       ${results.duplicateTypes.length}`);
  console.log(`Missing Imports:       ${results.missingImports.length}`);
  console.log(`'any' Type Usage:      ${results.typeCoverage.anyTypes}`);
  console.log(`Type Coverage:         ${results.typeCoverage.coveragePercentage}%\n`);

  if (results.stubTypes.length > 0) {
    console.log('⚠️  Stub Types Found:');
    console.log('───────────────────────────────────────────────────────────');
    results.stubTypes.forEach(stub => {
      console.log(`  • ${stub.name} (${stub.location}) - used ${stub.usageCount} times`);
    });
    console.log('');
  }

  if (results.duplicateTypes.length > 0) {
    console.log('⚠️  Duplicate Types Found:');
    console.log('───────────────────────────────────────────────────────────');
    results.duplicateTypes.forEach(dup => {
      console.log(`  • ${dup.name} - found in ${dup.locations.length} locations:`);
      dup.locations.forEach(loc => console.log(`    - ${loc}`));
    });
    console.log('');
  }

  if (results.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    console.log('───────────────────────────────────────────────────────────');
    results.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
      console.log(`     → ${rec.action}\n`);
    });
  }

  console.log(`\n✅ Full report saved to: ${OUTPUT_FILE}\n`);
}

// Run the analysis
try {
  analyzeSmartOnboarding();
} catch (error) {
  console.error('❌ Error during analysis:', error.message);
  process.exit(1);
}
