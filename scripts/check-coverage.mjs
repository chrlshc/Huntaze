#!/usr/bin/env node

import { readFileSync } from 'fs';
import { exit } from 'process';

const [, , stmtThreshold, branchThreshold, fnThreshold, lineThreshold] = process.argv;

if (!stmtThreshold || !branchThreshold || !fnThreshold || !lineThreshold) {
  console.error('Usage: node check-coverage.mjs <stmt> <branch> <fn> <line>');
  exit(1);
}

try {
  const coverage = JSON.parse(readFileSync('./coverage/coverage-final.json', 'utf8'));
  const summary = coverage.total;

  const checks = [
    { name: 'Statements', actual: summary.statements.pct, threshold: parseFloat(stmtThreshold) },
    { name: 'Branches', actual: summary.branches.pct, threshold: parseFloat(branchThreshold) },
    { name: 'Functions', actual: summary.functions.pct, threshold: parseFloat(fnThreshold) },
    { name: 'Lines', actual: summary.lines.pct, threshold: parseFloat(lineThreshold) }
  ];

  let failed = false;

  console.log('📊 Coverage Report:');
  console.log('==================');

  checks.forEach(({ name, actual, threshold }) => {
    const status = actual >= threshold ? '✅' : '❌';
    const color = actual >= threshold ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    console.log(`${status} ${name}: ${color}${actual.toFixed(2)}%${reset} (threshold: ${threshold}%)`);
    
    if (actual < threshold) {
      failed = true;
    }
  });

  if (failed) {
    console.log('\n❌ Coverage thresholds not met!');
    exit(1);
  } else {
    console.log('\n✅ All coverage thresholds met!');
  }

} catch (error) {
  console.error('Error reading coverage file:', error.message);
  exit(1);
}