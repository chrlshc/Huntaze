/**
 * API Optimization Checker
 * 
 * Vérifie que tous les services utilisent les bonnes pratiques
 */

import fs from 'fs';
import path from 'path';

interface CheckResult {
  service: string;
  hasBaseClient: boolean;
  hasErrorHandling: boolean;
  hasLogging: boolean;
  hasTypes: boolean;
  hasDocumentation: boolean;
  score: number;
}

const SERVICES_DIR = 'lib/services';
const REQUIRED_PATTERNS = {
  baseClient: /extends BaseAPIClient|import.*BaseAPIClient/,
  errorHandling: /try\s*{|catch\s*\(|APIErrorHandler/,
  logging: /logger\.|console\.(log|info|warn|error)/,
  types: /interface|type\s+\w+\s*=/,
  documentation: /\/\*\*[\s\S]*?\*\//,
};

async function checkService(servicePath: string): Promise<CheckResult> {
  const files = fs.readdirSync(servicePath);
  const result: CheckResult = {
    service: path.basename(servicePath),
    hasBaseClient: false,
    hasErrorHandling: false,
    hasLogging: false,
    hasTypes: false,
    hasDocumentation: false,
    score: 0,
  };

  for (const file of files) {
    if (!file.endsWith('.ts')) continue;

    const filePath = path.join(servicePath, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    if (REQUIRED_PATTERNS.baseClient.test(content)) {
      result.hasBaseClient = true;
    }
    if (REQUIRED_PATTERNS.errorHandling.test(content)) {
      result.hasErrorHandling = true;
    }
    if (REQUIRED_PATTERNS.logging.test(content)) {
      result.hasLogging = true;
    }
    if (REQUIRED_PATTERNS.types.test(content)) {
      result.hasTypes = true;
    }
    if (REQUIRED_PATTERNS.documentation.test(content)) {
      result.hasDocumentation = true;
    }
  }

  // Calculate score
  const checks = [
    result.hasBaseClient,
    result.hasErrorHandling,
    result.hasLogging,
    result.hasTypes,
    result.hasDocumentation,
  ];
  result.score = (checks.filter(Boolean).length / checks.length) * 100;

  return result;
}

async function main() {
  console.log('🔍 Checking API Optimization Status...\n');

  const servicesPath = path.join(process.cwd(), SERVICES_DIR);
  const services = fs.readdirSync(servicesPath).filter((dir) => {
    const fullPath = path.join(servicesPath, dir);
    return fs.statSync(fullPath).isDirectory();
  });

  const results: CheckResult[] = [];

  for (const service of services) {
    const servicePath = path.join(servicesPath, service);
    const result = await checkService(servicePath);
    results.push(result);
  }

  // Sort by score
  results.sort((a, b) => b.score - a.score);

  // Print results
  console.log('📊 Results:\n');
  console.log('Service'.padEnd(30) + 'Score'.padEnd(10) + 'Status');
  console.log('-'.repeat(60));

  for (const result of results) {
    const status = result.score === 100 ? '✅' : result.score >= 60 ? '⚠️' : '❌';
    console.log(
      result.service.padEnd(30) +
      `${result.score.toFixed(0)}%`.padEnd(10) +
      status
    );
  }

  console.log('\n📈 Summary:\n');

  const excellent = results.filter((r) => r.score === 100).length;
  const good = results.filter((r) => r.score >= 60 && r.score < 100).length;
  const needsWork = results.filter((r) => r.score < 60).length;

  console.log(`✅ Excellent (100%): ${excellent}`);
  console.log(`⚠️  Good (60-99%): ${good}`);
  console.log(`❌ Needs Work (<60%): ${needsWork}`);

  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  console.log(`\n📊 Average Score: ${avgScore.toFixed(1)}%`);

  // Detailed breakdown
  console.log('\n🔍 Detailed Breakdown:\n');

  for (const result of results) {
    if (result.score < 100) {
      console.log(`\n${result.service}:`);
      if (!result.hasBaseClient) console.log('  ❌ Missing BaseAPIClient');
      if (!result.hasErrorHandling) console.log('  ❌ Missing error handling');
      if (!result.hasLogging) console.log('  ❌ Missing logging');
      if (!result.hasTypes) console.log('  ❌ Missing TypeScript types');
      if (!result.hasDocumentation) console.log('  ❌ Missing documentation');
    }
  }

  // Recommendations
  console.log('\n💡 Recommendations:\n');

  if (needsWork > 0) {
    console.log(`1. Migrate ${needsWork} service(s) to BaseAPIClient`);
    console.log('2. Add error handling with try-catch blocks');
    console.log('3. Implement structured logging');
    console.log('4. Define TypeScript interfaces');
    console.log('5. Add JSDoc documentation');
  } else if (good > 0) {
    console.log(`1. Complete ${good} service(s) to 100%`);
    console.log('2. Review and improve existing implementations');
  } else {
    console.log('🎉 All services are optimized!');
  }

  console.log('\n📚 Resources:\n');
  console.log('- lib/api/README.md - Implementation guide');
  console.log('- API_INTEGRATION_OPTIMIZATION_REPORT.md - Full report');
  console.log('- lib/services/revenue/ - Gold standard example');

  process.exit(needsWork > 0 ? 1 : 0);
}

main().catch(console.error);
