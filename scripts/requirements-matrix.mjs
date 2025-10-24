#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

// Parse test results and generate requirements traceability matrix
async function generateRequirementsMatrix() {
  console.log('📋 Generating Requirements Traceability Matrix...');

  const requirements = {
    'R1': 'Merchant Platform Setup',
    'R2': 'Product Catalog Management', 
    'R3': 'Storefront Customer Experience',
    'R4': 'Order Management',
    'R5': 'Customer Account Management',
    'R6': 'Accessibility & Performance',
    'R7': 'Payment Security & Compliance',
    'R8': 'Application Security'
  };

  // Parse test files for requirement tags
  const testFiles = await glob('tests/**/*.{test,spec}.{ts,js}');
  const matrix = {};

  // Initialize matrix
  Object.keys(requirements).forEach(req => {
    matrix[req] = {
      name: requirements[req],
      acceptanceCriteria: {},
      coverage: { unit: 0, integration: 0, e2e: 0 }
    };
  });

  // Parse test files
  for (const file of testFiles) {
    try {
      const content = readFileSync(file, 'utf8');
      const testType = file.includes('/unit/') ? 'unit' : 
                     file.includes('/integration/') ? 'integration' : 'e2e';

      // Look for requirement tags in test descriptions
      const reqMatches = content.match(/R\d+-AC\d+|R\d+/g) || [];
      
      reqMatches.forEach(match => {
        const [req, ac] = match.split('-');
        if (matrix[req]) {
          matrix[req].coverage[testType]++;
          if (ac) {
            if (!matrix[req].acceptanceCriteria[ac]) {
              matrix[req].acceptanceCriteria[ac] = { unit: 0, integration: 0, e2e: 0 };
            }
            matrix[req].acceptanceCriteria[ac][testType]++;
          }
        }
      });
    } catch (error) {
      console.warn(`Warning: Could not parse ${file}:`, error.message);
    }
  }

  // Generate HTML report
  const html = generateHTMLReport(matrix);
  writeFileSync('coverage/requirements-matrix.html', html);

  // Generate console summary
  console.log('\n📊 Requirements Coverage Summary:');
  console.log('==================================');

  Object.entries(matrix).forEach(([req, data]) => {
    const total = data.coverage.unit + data.coverage.integration + data.coverage.e2e;
    const status = total > 0 ? '✅' : '❌';
    console.log(`${status} ${req}: ${data.name} (${total} tests)`);
    
    if (total > 0) {
      console.log(`   📝 Unit: ${data.coverage.unit}, 🔗 Integration: ${data.coverage.integration}, 🎭 E2E: ${data.coverage.e2e}`);
    }
  });

  console.log('\n📄 Detailed matrix saved to: coverage/requirements-matrix.html');
}

function generateHTMLReport(matrix) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Requirements Traceability Matrix</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .covered { background-color: #d4edda; }
        .partial { background-color: #fff3cd; }
        .missing { background-color: #f8d7da; }
        .summary { margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Requirements Traceability Matrix</h1>
    <div class="summary">
        <h2>Coverage Summary</h2>
        ${Object.entries(matrix).map(([req, data]) => {
          const total = data.coverage.unit + data.coverage.integration + data.coverage.e2e;
          const status = total > 0 ? '✅' : '❌';
          return `<p>${status} <strong>${req}</strong>: ${data.name} (${total} tests)</p>`;
        }).join('')}
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Requirement</th>
                <th>Description</th>
                <th>Unit Tests</th>
                <th>Integration Tests</th>
                <th>E2E Tests</th>
                <th>Total Coverage</th>
            </tr>
        </thead>
        <tbody>
            ${Object.entries(matrix).map(([req, data]) => {
              const total = data.coverage.unit + data.coverage.integration + data.coverage.e2e;
              const cssClass = total > 0 ? 'covered' : 'missing';
              return `
                <tr class="${cssClass}">
                    <td><strong>${req}</strong></td>
                    <td>${data.name}</td>
                    <td>${data.coverage.unit}</td>
                    <td>${data.coverage.integration}</td>
                    <td>${data.coverage.e2e}</td>
                    <td><strong>${total}</strong></td>
                </tr>
              `;
            }).join('')}
        </tbody>
    </table>
    
    <p><em>Generated on ${new Date().toISOString()}</em></p>
</body>
</html>
  `;
}

generateRequirementsMatrix().catch(console.error);