#!/usr/bin/env node

/**
 * Smart Onboarding Type Consistency Validator
 * Validates naming conventions, property consistency, and type relationships
 */

const fs = require('fs');
const path = require('path');

const results = {
  namingConventions: {
    interfaces: [],
    properties: [],
    violations: []
  },
  propertyConsistency: {
    commonProperties: new Map(),
    inconsistencies: []
  },
  optionalProperties: {
    total: 0,
    documented: 0,
    undocumented: []
  },
  inheritance: {
    opportunities: [],
    existing: []
  }
};

function analyzeTypeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let currentInterface = null;
  let currentComment = '';
  let inInterface = false;
  let braceCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Track JSDoc comments
    if (trimmed.startsWith('/**') || (trimmed.startsWith('*') && !trimmed.startsWith('*/'))) {
      currentComment += trimmed + '\n';
      continue;
    }
    
    if (trimmed.startsWith('*/')) {
      currentComment += trimmed + '\n';
      continue;
    }
    
    // Check interface naming (PascalCase)
    const interfaceMatch = trimmed.match(/^export interface (\w+)/);
    if (interfaceMatch) {
      const name = interfaceMatch[1];
      currentInterface = { name, properties: [], hasComment: currentComment.length > 0 };
      inInterface = true;
      braceCount = 0;
      currentComment = '';
      
      // Validate PascalCase
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
        results.namingConventions.violations.push({
          type: 'interface',
          name,
          issue: 'Not PascalCase',
          line: i + 1
        });
      }
      
      results.namingConventions.interfaces.push(name);
      continue;
    }
    
    // Check type alias naming
    const typeMatch = trimmed.match(/^export type (\w+)/);
    if (typeMatch) {
      const name = typeMatch[1];
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
        results.namingConventions.violations.push({
          type: 'type',
          name,
          issue: 'Not PascalCase',
          line: i + 1
        });
      }
      continue;
    }
    
    // Track braces to know when we exit interface
    if (inInterface) {
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;
      
      if (braceCount < 0) {
        inInterface = false;
        currentInterface = null;
      }
    }
    
    // Check property naming (camelCase) - improved regex
    const propertyMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(\?)?:\s*/);
    if (propertyMatch && currentInterface && inInterface) {
      const propName = propertyMatch[1];
      const isOptional = !!propertyMatch[2];
      
      currentInterface.properties.push({ name: propName, isOptional });
      
      // Validate camelCase (allow snake_case for specific cases)
      if (!/^[a-z][a-zA-Z0-9]*$/.test(propName) && !/^[a-z][a-z0-9_]*$/.test(propName)) {
        results.namingConventions.violations.push({
          type: 'property',
          interface: currentInterface.name,
          name: propName,
          issue: 'Not camelCase or snake_case',
          line: i + 1
        });
      }
      
      // Track common property names
      if (!results.propertyConsistency.commonProperties.has(propName)) {
        results.propertyConsistency.commonProperties.set(propName, []);
      }
      results.propertyConsistency.commonProperties.get(propName).push({
        interface: currentInterface.name,
        isOptional
      });
      
      // Track optional properties
      if (isOptional) {
        results.optionalProperties.total++;
        
        // Check if documented (look back for comment)
        const hasDoc = i > 0 && (lines[i - 1].trim().startsWith('//') || lines[i - 1].trim().includes('*'));
        if (hasDoc) {
          results.optionalProperties.documented++;
        } else {
          results.optionalProperties.undocumented.push({
            interface: currentInterface.name,
            property: propName,
            line: i + 1
          });
        }
      }
    }
    
    // Check for extends keyword
    const extendsMatch = trimmed.match(/^export interface (\w+) extends (\w+)/);
    if (extendsMatch) {
      results.inheritance.existing.push({
        child: extendsMatch[1],
        parent: extendsMatch[2]
      });
    }
  }
}

function analyzePropertyConsistency() {
  // Find properties that appear in multiple interfaces with different optionality
  for (const [propName, usages] of results.propertyConsistency.commonProperties) {
    if (usages.length > 1) {
      const optionalCount = usages.filter(u => u.isOptional).length;
      const requiredCount = usages.length - optionalCount;
      
      if (optionalCount > 0 && requiredCount > 0) {
        results.propertyConsistency.inconsistencies.push({
          property: propName,
          usages,
          issue: `Used as optional in ${optionalCount} interfaces and required in ${requiredCount} interfaces`
        });
      }
    }
  }
}

function findInheritanceOpportunities() {
  // Find interfaces with common property sets
  const interfaceProps = new Map();
  
  for (const [propName, usages] of results.propertyConsistency.commonProperties) {
    for (const usage of usages) {
      if (!interfaceProps.has(usage.interface)) {
        interfaceProps.set(usage.interface, new Set());
      }
      interfaceProps.get(usage.interface).add(propName);
    }
  }
  
  // Find pairs with significant overlap
  const interfaces = Array.from(interfaceProps.keys());
  for (let i = 0; i < interfaces.length; i++) {
    for (let j = i + 1; j < interfaces.length; j++) {
      const props1 = interfaceProps.get(interfaces[i]);
      const props2 = interfaceProps.get(interfaces[j]);
      
      const common = new Set([...props1].filter(p => props2.has(p)));
      
      if (common.size >= 3) {
        results.inheritance.opportunities.push({
          interface1: interfaces[i],
          interface2: interfaces[j],
          commonProperties: Array.from(common),
          suggestion: `Consider creating a base interface with: ${Array.from(common).join(', ')}`
        });
      }
    }
  }
}

function generateReport() {
  console.log('🔍 Smart Onboarding Type Consistency Report\n');
  console.log('='.repeat(60));
  
  // Naming Conventions
  console.log('\n📝 Naming Conventions');
  console.log('-'.repeat(60));
  console.log(`Total Interfaces: ${results.namingConventions.interfaces.length}`);
  console.log(`Naming Violations: ${results.namingConventions.violations.length}`);
  
  if (results.namingConventions.violations.length > 0) {
    console.log('\n❌ Violations:');
    results.namingConventions.violations.forEach(v => {
      console.log(`  Line ${v.line}: ${v.type} "${v.name}" - ${v.issue}`);
      if (v.interface) console.log(`    in interface ${v.interface}`);
    });
  } else {
    console.log('✅ All names follow conventions!');
  }
  
  // Property Consistency
  console.log('\n\n🔄 Property Consistency');
  console.log('-'.repeat(60));
  console.log(`Total Unique Properties: ${results.propertyConsistency.commonProperties.size}`);
  console.log(`Inconsistencies Found: ${results.propertyConsistency.inconsistencies.length}`);
  
  if (results.propertyConsistency.inconsistencies.length > 0) {
    console.log('\n⚠️  Inconsistencies:');
    results.propertyConsistency.inconsistencies.slice(0, 10).forEach(inc => {
      console.log(`  Property "${inc.property}": ${inc.issue}`);
      inc.usages.forEach(u => {
        console.log(`    - ${u.interface}: ${u.isOptional ? 'optional' : 'required'}`);
      });
    });
    if (results.propertyConsistency.inconsistencies.length > 10) {
      console.log(`  ... and ${results.propertyConsistency.inconsistencies.length - 10} more`);
    }
  } else {
    console.log('✅ All properties are consistently used!');
  }
  
  // Optional Properties
  console.log('\n\n❓ Optional Properties');
  console.log('-'.repeat(60));
  console.log(`Total Optional Properties: ${results.optionalProperties.total}`);
  console.log(`Documented: ${results.optionalProperties.documented}`);
  console.log(`Undocumented: ${results.optionalProperties.undocumented.length}`);
  
  const docRate = results.optionalProperties.total > 0 
    ? ((results.optionalProperties.documented / results.optionalProperties.total) * 100).toFixed(1)
    : 0;
  console.log(`Documentation Rate: ${docRate}%`);
  
  if (results.optionalProperties.undocumented.length > 0 && results.optionalProperties.undocumented.length <= 20) {
    console.log('\n📋 Undocumented Optional Properties:');
    results.optionalProperties.undocumented.forEach(prop => {
      console.log(`  Line ${prop.line}: ${prop.interface}.${prop.property}`);
    });
  } else if (results.optionalProperties.undocumented.length > 20) {
    console.log(`\n⚠️  ${results.optionalProperties.undocumented.length} undocumented optional properties (too many to list)`);
  }
  
  // Inheritance
  console.log('\n\n🔗 Type Inheritance');
  console.log('-'.repeat(60));
  console.log(`Existing Inheritance: ${results.inheritance.existing.length}`);
  console.log(`Potential Opportunities: ${results.inheritance.opportunities.length}`);
  
  if (results.inheritance.existing.length > 0) {
    console.log('\n✅ Existing Inheritance:');
    results.inheritance.existing.forEach(inh => {
      console.log(`  ${inh.child} extends ${inh.parent}`);
    });
  }
  
  if (results.inheritance.opportunities.length > 0) {
    console.log('\n💡 Inheritance Opportunities:');
    results.inheritance.opportunities.slice(0, 5).forEach(opp => {
      console.log(`  ${opp.interface1} & ${opp.interface2}:`);
      console.log(`    Common: ${opp.commonProperties.join(', ')}`);
      console.log(`    ${opp.suggestion}`);
    });
    if (results.inheritance.opportunities.length > 5) {
      console.log(`  ... and ${results.inheritance.opportunities.length - 5} more opportunities`);
    }
  }
  
  // Summary
  console.log('\n\n📊 Summary');
  console.log('='.repeat(60));
  
  const issues = results.namingConventions.violations.length +
                 results.propertyConsistency.inconsistencies.length;
  
  if (issues === 0) {
    console.log('✅ Type system is highly consistent!');
  } else {
    console.log(`⚠️  Found ${issues} consistency issues to address`);
  }
  
  console.log(`\n📈 Quality Metrics:`);
  console.log(`  - Naming Convention Compliance: ${((1 - results.namingConventions.violations.length / results.namingConventions.interfaces.length) * 100).toFixed(1)}%`);
  console.log(`  - Optional Property Documentation: ${docRate}%`);
  console.log(`  - Type Reuse: ${results.inheritance.existing.length} inheritance relationships`);
}

// Main execution
const typesFile = path.join(__dirname, '../lib/smart-onboarding/types/index.ts');

if (!fs.existsSync(typesFile)) {
  console.error('❌ Types file not found:', typesFile);
  process.exit(1);
}

console.log('Analyzing type consistency...\n');

analyzeTypeFile(typesFile);
analyzePropertyConsistency();
findInheritanceOpportunities();
generateReport();

// Export results for testing
module.exports = { results };
