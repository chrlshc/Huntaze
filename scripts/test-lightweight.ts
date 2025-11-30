#!/usr/bin/env tsx
/**
 * Lightweight Test Runner
 * Optimized for systems with limited RAM (5GB)
 * Runs tests sequentially to avoid memory issues
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  file: string;
  passed: boolean;
  duration: number;
  error?: string;
}

interface TestSuite {
  name: string;
  pattern: string;
  description: string;
}

const TEST_SUITES: TestSuite[] = [
  {
    name: 'Design Tokens',
    pattern: 'tests/unit/properties/*token*.test.ts',
    description: 'Color, typography, spacing, and effect tokens',
  },
  {
    name: 'Visual Consistency',
    pattern: 'tests/unit/properties/*color*.test.ts',
    description: 'Background, borders, inner glow, color palette',
  },
  {
    name: 'Components',
    pattern: 'tests/unit/properties/*component*.test.ts',
    description: 'Button, input, select, and card components',
  },
  {
    name: 'Animations',
    pattern: 'tests/unit/properties/*{fade,hover,loading,animation,timing}*.test.ts',
    description: 'Fade-in, hover transitions, loading states',
  },
  {
    name: 'Responsive',
    pattern: 'tests/unit/properties/*{breakpoint,touch,mobile}*.test.ts',
    description: 'Mobile breakpoints and touch targets',
  },
  {
    name: 'Code Quality',
    pattern: 'tests/unit/properties/*{css,backup,tailwind,duplicate}*.test.ts',
    description: 'CSS imports, backup files, Tailwind-first',
  },
];

function findTestFiles(pattern: string): string[] {
  try {
    const cmd = `find tests -type f -path "${pattern}" 2>/dev/null`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    return output.trim() ? output.trim().split('\n') : [];
  } catch {
    return [];
  }
}

function runTest(file: string): TestResult {
  const startTime = Date.now();
  
  try {
    console.log(`  ⏳ Running ${path.basename(file)}...`);
    
    // Run with limited memory and single worker
    execSync(
      `NODE_OPTIONS="--max-old-space-size=1024" npm test -- ${file} --run --reporter=dot`,
      {
        encoding: 'utf-8',
        stdio: 'pipe',
        env: {
          ...process.env,
          NODE_ENV: 'test',
        },
      }
    );
    
    const duration = Date.now() - startTime;
    console.log(`  ✅ Passed (${duration}ms)`);
    
    return {
      file,
      passed: true,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.log(`  ❌ Failed (${duration}ms)`);
    
    return {
      file,
      passed: false,
      duration,
      error: error.message,
    };
  }
}

async function runTestSuite(suite: TestSuite): Promise<TestResult[]> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 ${suite.name}`);
  console.log(`   ${suite.description}`);
  console.log('='.repeat(60));
  
  const files = findTestFiles(suite.pattern);
  
  if (files.length === 0) {
    console.log('  ⚠️  No test files found');
    return [];
  }
  
  console.log(`  Found ${files.length} test file(s)\n`);
  
  const results: TestResult[] = [];
  
  for (const file of files) {
    const result = runTest(file);
    results.push(result);
    
    // Small delay between tests to allow garbage collection
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

function printSummary(allResults: TestResult[]) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.filter(r => r.passed === false).length;
  const totalDuration = allResults.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total time: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`📁 Total tests: ${allResults.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    allResults
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  - ${r.file}`);
      });
  }
  
  console.log('\n' + '='.repeat(60));
}

async function main() {
  const args = process.argv.slice(2);
  
  // Check if specific suite requested
  const suiteArg = args.find(arg => arg.startsWith('--suite='));
  const suiteName = suiteArg?.split('=')[1];
  
  console.log('🧪 Lightweight Test Runner');
  console.log('💾 Optimized for 5GB RAM systems');
  console.log('⚡ Running tests sequentially...\n');
  
  let suitesToRun = TEST_SUITES;
  
  if (suiteName) {
    const suite = TEST_SUITES.find(s => 
      s.name.toLowerCase().includes(suiteName.toLowerCase())
    );
    
    if (!suite) {
      console.error(`❌ Suite "${suiteName}" not found`);
      console.log('\nAvailable suites:');
      TEST_SUITES.forEach(s => console.log(`  - ${s.name}`));
      process.exit(1);
    }
    
    suitesToRun = [suite];
  }
  
  const allResults: TestResult[] = [];
  
  for (const suite of suitesToRun) {
    const results = await runTestSuite(suite);
    allResults.push(...results);
  }
  
  printSummary(allResults);
  
  const hasFailed = allResults.some(r => !r.passed);
  process.exit(hasFailed ? 1 : 0);
}

// Show usage if --help
if (process.argv.includes('--help')) {
  console.log(`
🧪 Lightweight Test Runner

Usage:
  npm run test:light              # Run all test suites
  npm run test:light -- --suite=tokens    # Run specific suite

Available suites:
${TEST_SUITES.map(s => `  - ${s.name.toLowerCase()}: ${s.description}`).join('\n')}

Options:
  --suite=<name>    Run specific test suite
  --help            Show this help message
`);
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
