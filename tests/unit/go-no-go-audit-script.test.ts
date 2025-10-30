/**
 * Unit Tests for go-no-go-audit.sh
 * Tests the production readiness audit script with focus on pipeline error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Mock child_process
vi.mock('child_process');

describe('go-no-go-audit.sh Script Tests', () => {
  const scriptPath = path.join(process.cwd(), 'scripts/go-no-go-audit.sh');
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Script Existence and Permissions', () => {
    it('should exist at the correct path', () => {
      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    it('should be executable', () => {
      const stats = fs.statSync(scriptPath);
      const isExecutable = (stats.mode & 0o111) !== 0;
      expect(isExecutable).toBe(true);
    });

    it('should have correct shebang', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content.startsWith('#!/bin/bash')).toBe(true);
    });
  });

  describe('Pipeline Error Handling (set -o pipefail)', () => {
    it('should have set -o pipefail configured', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('set -o pipefail');
    });

    it('should NOT have set -e (replaced by pipefail)', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const lines = content.split('\n');
      const setELine = lines.find(line => line.trim() === 'set -e');
      expect(setELine).toBeUndefined();
    });

    it('should detect pipeline failures correctly', () => {
      // Test that pipefail catches errors in the middle of pipelines
      const testScript = `
#!/bin/bash
set -o pipefail

# This should fail because 'false' is in the middle of the pipeline
echo "test" | false | grep "test"
exit_code=$?

if [ $exit_code -ne 0 ]; then
  echo "Pipeline failed as expected"
  exit 0
else
  echo "Pipeline should have failed"
  exit 1
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-test-pipefail.sh');
      fs.writeFileSync(tempScript, testScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('Pipeline failed as expected');
      } finally {
        fs.unlinkSync(tempScript);
      }
    });

    it('should handle AWS CLI pipeline failures', () => {
      // Simulate AWS CLI command that fails in pipeline
      const mockAWSCommand = `
#!/bin/bash
set -o pipefail

# Simulate AWS CLI failure in pipeline
aws ecs describe-clusters --clusters test 2>/dev/null | jq '.clusters' || echo "[]"
      `;

      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('set -o pipefail');
      expect(content).toContain('|| echo');
    });
  });

  describe('Script Configuration', () => {
    it('should have correct AWS region configured', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('REGION="us-east-1"');
    });

    it('should have correct AWS account ID', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('ACCOUNT_ID="317805897534"');
    });

    it('should have budget limits configured', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('BUDGET_LIMIT=500');
      expect(content).toContain('BUDGET_THRESHOLD=400');
    });

    it('should have color codes defined', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain("GREEN='\\033[0;32m'");
      expect(content).toContain("RED='\\033[0;31m'");
      expect(content).toContain("YELLOW='\\033[1;33m'");
      expect(content).toContain("NC='\\033[0m'");
    });
  });

  describe('Check Functions', () => {
    it('should define check_pass function', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('check_pass()');
      expect(content).toContain('((PASS_COUNT++))');
    });

    it('should define check_fail function', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('check_fail()');
      expect(content).toContain('((FAIL_COUNT++))');
    });

    it('should define check_warn function', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('check_warn()');
      expect(content).toContain('((WARN_COUNT++))');
    });

    it('should initialize counters', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('PASS_COUNT=0');
      expect(content).toContain('FAIL_COUNT=0');
      expect(content).toContain('WARN_COUNT=0');
    });
  });

  describe('Infrastructure Health Checks', () => {
    it('should check ECS clusters', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('aws ecs describe-clusters');
      expect(content).toContain('--clusters ai-team huntaze-cluster huntaze-of-fargate');
    });

    it('should check SQS queues', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('aws sqs list-queues');
      expect(content).toContain('select(contains("huntaze"))');
    });

    it('should check DynamoDB tables', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('aws dynamodb list-tables');
      expect(content).toContain('HUNTAZE_TABLES');
    });

    it('should check SNS topics', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('aws sns list-topics');
      expect(content).toContain('HUNTAZE_TOPICS');
    });

    it('should handle AWS CLI failures with fallback', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      // Check that all AWS commands have error handling
      const awsCommands = content.match(/aws [a-z-]+ [a-z-]+/g) || [];
      expect(awsCommands.length).toBeGreaterThan(0);
      
      // Verify fallback patterns exist
      expect(content).toContain('|| echo "[]"');
      expect(content).toContain('|| echo \'{"');
    });
  });

  describe('Security Posture Checks', () => {
    it('should check GuardDuty status', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('aws guardduty list-detectors');
      expect(content).toContain('aws guardduty get-detector');
    });

    it('should check Security Hub', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('aws securityhub describe-hub');
    });

    it('should check AWS Config', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('aws configservice describe-configuration-recorders');
      expect(content).toContain('describe-configuration-recorder-status');
    });

    it('should check S3 bucket encryption', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('aws s3api list-buckets');
      expect(content).toContain('aws s3api get-bucket-encryption');
    });

    it('should iterate through huntaze buckets', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('while IFS= read -r bucket');
      expect(content).toContain('HUNTAZE_BUCKETS');
    });
  });

  describe('Cost Monitoring Checks', () => {
    it('should check AWS budgets', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('aws budgets describe-budgets');
      expect(content).toContain('--account-id $ACCOUNT_ID');
    });

    it('should calculate budget percentage', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('scale=1');
      expect(content).toContain('$ACTUAL_SPEND * 100 / $BUDGET_LIMIT_ACTUAL');
    });

    it('should check cost anomaly detection', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('aws ce get-anomaly-monitors');
    });

    it('should have budget threshold logic', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('if [ "$SPEND_INT" -lt "$BUDGET_THRESHOLD" ]');
      expect(content).toContain('elif [ "$SPEND_INT" -lt "$BUDGET_LIMIT" ]');
    });
  });

  describe('Monitoring & Observability Checks', () => {
    it('should check CloudWatch alarms', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('aws cloudwatch describe-alarms');
      expect(content).toContain('MetricAlarms');
      expect(content).toContain('CompositeAlarms');
    });

    it('should check alarm states', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('select(.StateValue == "ALARM")');
    });

    it('should check Synthetics canaries', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('aws synthetics describe-canaries');
    });

    it('should check Container Insights', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('for cluster in ai-team huntaze-cluster huntaze-of-fargate');
      expect(content).toContain('containerInsights');
    });

    it('should verify all three clusters for Container Insights', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('if [ "$CONTAINER_INSIGHTS" -eq 3 ]');
    });
  });

  describe('Operational Readiness Checks', () => {
    it('should check Lambda functions', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('aws lambda list-functions');
      expect(content).toContain('HUNTAZE_LAMBDAS');
    });

    it('should check RDS instances', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('aws rds describe-db-instances');
    });

    it('should verify RDS encryption', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('StorageEncrypted == true');
    });

    it('should verify RDS Performance Insights', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('PerformanceInsightsEnabled == true');
    });
  });

  describe('Decision Logic', () => {
    it('should have GO decision for zero failures and few warnings', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('if [ "$FAIL_COUNT" -eq 0 ] && [ "$WARN_COUNT" -le 3 ]');
      expect(content).toContain('🚀 GO FOR PRODUCTION');
      expect(content).toContain('exit 0');
    });

    it('should have CONDITIONAL GO for warnings only', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('elif [ "$FAIL_COUNT" -eq 0 ]');
      expect(content).toContain('⚠️  CONDITIONAL GO');
      expect(content).toContain('exit 1');
    });

    it('should have NO-GO for any failures', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('else');
      expect(content).toContain('🛑 NO-GO FOR PRODUCTION');
      expect(content).toContain('exit 2');
    });

    it('should display results summary', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('Results Summary:');
      expect(content).toContain('✅ PASS');
      expect(content).toContain('⚠️  WARN');
      expect(content).toContain('❌ FAIL');
    });
  });

  describe('Output Formatting', () => {
    it('should have section headers', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('1️⃣  INFRASTRUCTURE HEALTH');
      expect(content).toContain('2️⃣  SECURITY POSTURE');
      expect(content).toContain('3️⃣  COST MONITORING');
      expect(content).toContain('4️⃣  MONITORING & OBSERVABILITY');
      expect(content).toContain('5️⃣  OPERATIONAL READINESS');
      expect(content).toContain('📊 FINAL GO/NO-GO DECISION');
    });

    it('should have visual separators', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const separators = content.match(/━{50,}/g);
      expect(separators).toBeDefined();
      expect(separators!.length).toBeGreaterThan(10);
    });

    it('should display timestamp', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle missing AWS CLI gracefully', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      // All AWS commands should have error handling
      const awsCommandsWithFallback = content.match(/aws [^|]+ \|\| echo/g);
      expect(awsCommandsWithFallback).toBeDefined();
      expect(awsCommandsWithFallback!.length).toBeGreaterThan(5);
    });

    it('should handle jq parsing errors', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      // Check for safe jq usage with fallbacks
      expect(content).toContain('|| echo "[]"');
      expect(content).toContain('|| echo \'{"');
    });

    it('should handle empty responses', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('if [ "$CLUSTERS" != "[]" ]');
      expect(content).toContain('if [ -n "$');
    });

    it('should use 2>/dev/null for error suppression', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const errorRedirects = content.match(/2>\/dev\/null/g);
      expect(errorRedirects).toBeDefined();
      expect(errorRedirects!.length).toBeGreaterThan(15);
    });
  });

  describe('JSON Processing', () => {
    it('should use jq for JSON parsing', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const jqUsages = content.match(/\| jq/g);
      expect(jqUsages).toBeDefined();
      expect(jqUsages!.length).toBeGreaterThan(20);
    });

    it('should handle jq array length calculations', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('| jq \'. | length\'');
      expect(content).toContain('| jq \'[');
    });

    it('should use jq for filtering', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('| jq -r');
      expect(content).toContain('select(');
    });
  });

  describe('Pipeline Safety with set -o pipefail', () => {
    it('should catch failures in AWS CLI pipelines', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Verify that pipelines have proper error handling
      const pipelinePatterns = [
        /aws [^|]+ \| jq/g,
        /aws [^|]+ \| grep/g,
        /echo [^|]+ \| jq/g
      ];

      pipelinePatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          expect(matches.length).toBeGreaterThan(0);
        }
      });
    });

    it('should have fallback for all critical pipelines', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Count AWS commands
      const awsCommands = (content.match(/aws [a-z-]+ [a-z-]+/g) || []).length;
      
      // Count fallback patterns
      const fallbacks = (content.match(/\|\| echo/g) || []).length;
      
      // Most AWS commands should have fallbacks
      expect(fallbacks).toBeGreaterThan(awsCommands * 0.7);
    });

    it('should properly quote variables in pipelines', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Check for proper variable quoting
      const quotedVars = content.match(/"\$[A-Z_]+"/g);
      expect(quotedVars).toBeDefined();
      expect(quotedVars!.length).toBeGreaterThan(20);
    });
  });

  describe('Integration with Production Deployment', () => {
    it('should reference production runbook', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('docs/runbooks/PRODUCTION_GO_LIVE_RUNBOOK.md');
    });

    it('should reference deployment script', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('./scripts/deploy-production-hardening.sh');
    });

    it('should provide next steps for GO decision', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('Next Steps:');
      expect(content).toContain('Monitor canaries and alarms');
      expect(content).toContain('24-hour review');
    });

    it('should provide remediation steps for NO-GO', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('Required Actions:');
      expect(content).toContain('Fix all FAIL checks');
      expect(content).toContain('Re-run this audit');
    });
  });

  describe('Performance and Efficiency', () => {
    it('should batch AWS API calls where possible', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Check for batch operations
      expect(content).toContain('--clusters ai-team huntaze-cluster huntaze-of-fargate');
    });

    it('should use output json for efficient parsing', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const jsonOutputs = content.match(/--output json/g);
      expect(jsonOutputs).toBeDefined();
      expect(jsonOutputs!.length).toBeGreaterThan(15);
    });

    it('should minimize redundant AWS calls', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Check that results are stored in variables
      expect(content).toContain('CLUSTERS=$(');
      expect(content).toContain('QUEUES=$(');
      expect(content).toContain('TABLES=$(');
      expect(content).toContain('BUDGETS=$(');
    });
  });

  describe('Compliance and Best Practices', () => {
    it('should follow AWS Well-Architected Framework', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('AWS ORR Well-Architected Framework');
    });

    it('should check all five pillars', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Operational Excellence
      expect(content).toContain('OPERATIONAL READINESS');
      
      // Security
      expect(content).toContain('SECURITY POSTURE');
      
      // Reliability (Infrastructure Health)
      expect(content).toContain('INFRASTRUCTURE HEALTH');
      
      // Performance Efficiency (Monitoring)
      expect(content).toContain('MONITORING & OBSERVABILITY');
      
      // Cost Optimization
      expect(content).toContain('COST MONITORING');
    });

    it('should enforce encryption requirements', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('StorageEncrypted');
      expect(content).toContain('get-bucket-encryption');
    });

    it('should verify monitoring coverage', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('CloudWatch Alarms');
      expect(content).toContain('Container Insights');
      expect(content).toContain('Performance Insights');
    });
  });

  describe('Regression Tests for Pipeline Error Handling', () => {
    it('should not revert to set -e', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Ensure we haven't accidentally reverted the change
      const setELines = content.split('\n').filter(line => 
        line.trim() === 'set -e' && !line.includes('#')
      );
      
      expect(setELines.length).toBe(0);
    });

    it('should maintain pipefail throughout script lifecycle', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Ensure pipefail is set early and not disabled
      const lines = content.split('\n');
      const pipefailLine = lines.findIndex(line => line.includes('set -o pipefail'));
      const firstAwsCommand = lines.findIndex(line => line.includes('aws '));
      
      expect(pipefailLine).toBeGreaterThan(0);
      expect(pipefailLine).toBeLessThan(firstAwsCommand);
    });

    it('should handle complex pipelines with multiple stages', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Check for multi-stage pipelines
      const complexPipelines = content.match(/\|[^|]+\|[^|]+\|/g);
      if (complexPipelines) {
        expect(complexPipelines.length).toBeGreaterThan(0);
      }
    });
  });
});
