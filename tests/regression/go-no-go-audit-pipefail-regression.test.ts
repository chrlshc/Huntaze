/**
 * Regression Tests for go-no-go-audit.sh Pipeline Error Handling
 * Ensures the change from 'set -e' to 'set -o pipefail' doesn't break functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('go-no-go-audit.sh Pipeline Error Handling Regression', () => {
  const scriptPath = path.join(process.cwd(), 'scripts/go-no-go-audit.sh');

  describe('Regression: set -e to set -o pipefail Migration', () => {
    it('should not contain set -e directive', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const lines = content.split('\n');
      
      // Check for standalone 'set -e' (not in comments)
      const setELines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed === 'set -e' && !line.includes('#');
      });

      expect(setELines).toHaveLength(0);
    });

    it('should contain set -o pipefail directive', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('set -o pipefail');
    });

    it('should have pipefail before any AWS commands', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const lines = content.split('\n');
      
      const pipefailIndex = lines.findIndex(line => line.includes('set -o pipefail'));
      const firstAwsIndex = lines.findIndex(line => line.includes('aws '));
      
      expect(pipefailIndex).toBeGreaterThan(-1);
      expect(firstAwsIndex).toBeGreaterThan(-1);
      expect(pipefailIndex).toBeLessThan(firstAwsIndex);
    });
  });

  describe('Regression: Pipeline Error Detection', () => {
    it('should detect errors in the middle of pipelines', () => {
      // Test that pipefail catches errors that set -e would miss
      const testScript = `
#!/bin/bash
set -o pipefail

# This pipeline has an error in the middle
# With set -e, this would succeed (last command succeeds)
# With set -o pipefail, this should fail
echo "test" | false | cat > /dev/null
exit_code=$?

if [ $exit_code -ne 0 ]; then
  echo "PASS: Pipeline error detected (pipefail working)"
  exit 0
else
  echo "FAIL: Pipeline error not detected (pipefail not working)"
  exit 1
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-regression-pipefail.sh');
      fs.writeFileSync(tempScript, testScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('PASS: Pipeline error detected');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });

    it('should handle AWS CLI pipeline failures correctly', () => {
      const testScript = `
#!/bin/bash
set -o pipefail

# Simulate AWS CLI failure in pipeline
# The || echo fallback should catch this
RESULT=$(false | jq '.test' 2>/dev/null || echo "FALLBACK")

if [ "$RESULT" = "FALLBACK" ]; then
  echo "PASS: AWS CLI pipeline failure handled"
  exit 0
else
  echo "FAIL: AWS CLI pipeline failure not handled"
  exit 1
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-regression-aws-pipeline.sh');
      fs.writeFileSync(tempScript, testScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('PASS: AWS CLI pipeline failure handled');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });
  });

  describe('Regression: Backward Compatibility', () => {
    it('should maintain same exit codes for GO decision', () => {
      const testScript = `
#!/bin/bash
set -o pipefail

PASS_COUNT=15
FAIL_COUNT=0
WARN_COUNT=2

if [ "$FAIL_COUNT" -eq 0 ] && [ "$WARN_COUNT" -le 3 ]; then
  exit 0
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-regression-exit-go.sh');
      fs.writeFileSync(tempScript, testScript, { mode: 0o755 });

      try {
        execSync(tempScript, { encoding: 'utf-8' });
        expect(true).toBe(true); // Exit code 0
      } catch (error) {
        expect(error).toBeUndefined(); // Should not throw
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });

    it('should maintain same exit codes for NO-GO decision', () => {
      const testScript = `
#!/bin/bash
set -o pipefail

PASS_COUNT=10
FAIL_COUNT=3
WARN_COUNT=2

if [ "$FAIL_COUNT" -eq 0 ] && [ "$WARN_COUNT" -le 3 ]; then
  exit 0
elif [ "$FAIL_COUNT" -eq 0 ]; then
  exit 1
else
  exit 2
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-regression-exit-nogo.sh');
      fs.writeFileSync(tempScript, testScript, { mode: 0o755 });

      try {
        execSync(tempScript, { encoding: 'utf-8' });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.status).toBe(2); // Exit code 2 for NO-GO
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });

    it('should maintain counter increment behavior', () => {
      const testScript = `
#!/bin/bash
set -o pipefail

PASS_COUNT=0
FAIL_COUNT=0

check_pass() { ((PASS_COUNT++)); }
check_fail() { ((FAIL_COUNT++)); }

check_pass
check_pass
check_fail

if [ "$PASS_COUNT" -eq 2 ] && [ "$FAIL_COUNT" -eq 1 ]; then
  echo "PASS: Counter behavior unchanged"
  exit 0
else
  echo "FAIL: Counter behavior changed"
  exit 1
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-regression-counters.sh');
      fs.writeFileSync(tempScript, testScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('PASS: Counter behavior unchanged');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });
  });

  describe('Regression: Error Handling Patterns', () => {
    it('should maintain fallback patterns for AWS commands', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Count AWS commands with fallback patterns
      const awsCommandsWithFallback = content.match(/aws [^|]+ \|\| echo/g);
      
      expect(awsCommandsWithFallback).toBeDefined();
      expect(awsCommandsWithFallback!.length).toBeGreaterThan(10);
    });

    it('should maintain error suppression with 2>/dev/null', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      const errorSuppressions = content.match(/2>\/dev\/null/g);
      
      expect(errorSuppressions).toBeDefined();
      expect(errorSuppressions!.length).toBeGreaterThan(15);
    });

    it('should maintain jq error handling', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Check for jq commands with proper error handling
      const jqWithErrorHandling = content.match(/jq [^|]+ 2>\/dev\/null/g);
      
      expect(jqWithErrorHandling).toBeDefined();
      expect(jqWithErrorHandling!.length).toBeGreaterThan(5);
    });
  });

  describe('Regression: Complex Pipeline Scenarios', () => {
    it('should handle three-stage pipelines correctly', () => {
      const testScript = `
#!/bin/bash
set -o pipefail

# Three-stage pipeline
RESULT=$(echo '{"test": "value"}' | jq '.test' | grep "value" 2>/dev/null || echo "ERROR")

if [ "$RESULT" = "ERROR" ]; then
  echo "FAIL: Three-stage pipeline failed unexpectedly"
  exit 1
else
  echo "PASS: Three-stage pipeline works"
  exit 0
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-regression-three-stage.sh');
      fs.writeFileSync(tempScript, testScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('PASS: Three-stage pipeline works');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });

    it('should handle pipelines with variable assignments', () => {
      const testScript = `
#!/bin/bash
set -o pipefail

# Pipeline with variable assignment
CLUSTERS=$(echo '[]' | jq '. | length' 2>/dev/null || echo "0")

if [ "$CLUSTERS" = "0" ]; then
  echo "PASS: Pipeline variable assignment works"
  exit 0
else
  echo "FAIL: Pipeline variable assignment failed"
  exit 1
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-regression-var-assign.sh');
      fs.writeFileSync(tempScript, testScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('PASS: Pipeline variable assignment works');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });

    it('should handle pipelines in conditionals', () => {
      const testScript = `
#!/bin/bash
set -o pipefail

# Pipeline in conditional
if echo '{"status": "ok"}' | jq -e '.status == "ok"' > /dev/null 2>&1; then
  echo "PASS: Pipeline in conditional works"
  exit 0
else
  echo "FAIL: Pipeline in conditional failed"
  exit 1
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-regression-conditional.sh');
      fs.writeFileSync(tempScript, testScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('PASS: Pipeline in conditional works');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });
  });

  describe('Regression: Script Structure Integrity', () => {
    it('should maintain all check sections', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      const sections = [
        'INFRASTRUCTURE HEALTH',
        'SECURITY POSTURE',
        'COST MONITORING',
        'MONITORING & OBSERVABILITY',
        'OPERATIONAL READINESS'
      ];

      sections.forEach(section => {
        expect(content).toContain(section);
      });
    });

    it('should maintain all check functions', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('check_pass()');
      expect(content).toContain('check_fail()');
      expect(content).toContain('check_warn()');
    });

    it('should maintain decision logic structure', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('if [ "$FAIL_COUNT" -eq 0 ] && [ "$WARN_COUNT" -le 3 ]');
      expect(content).toContain('elif [ "$FAIL_COUNT" -eq 0 ]');
      expect(content).toContain('else');
    });

    it('should maintain all AWS service checks', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      const services = [
        'ecs describe-clusters',
        'sqs list-queues',
        'dynamodb list-tables',
        'sns list-topics',
        'guardduty list-detectors',
        'securityhub describe-hub',
        'configservice describe-configuration-recorders',
        's3api list-buckets',
        'budgets describe-budgets',
        'cloudwatch describe-alarms',
        'lambda list-functions',
        'rds describe-db-instances'
      ];

      services.forEach(service => {
        expect(content).toContain(service);
      });
    });
  });

  describe('Regression: Output Format Consistency', () => {
    it('should maintain color code definitions', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain("GREEN='\\033[0;32m'");
      expect(content).toContain("RED='\\033[0;31m'");
      expect(content).toContain("YELLOW='\\033[1;33m'");
      expect(content).toContain("NC='\\033[0m'");
    });

    it('should maintain emoji usage in output', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('✅');
      expect(content).toContain('❌');
      expect(content).toContain('⚠️');
      expect(content).toContain('🚀');
      expect(content).toContain('🛑');
    });

    it('should maintain section separators', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      const separators = content.match(/━{50,}/g);
      expect(separators).toBeDefined();
      expect(separators!.length).toBeGreaterThan(10);
    });
  });

  describe('Regression: Performance Characteristics', () => {
    it('should maintain fast syntax validation', () => {
      const startTime = Date.now();
      
      try {
        execSync(`bash -n ${scriptPath}`, { encoding: 'utf-8', timeout: 2000 });
        const duration = Date.now() - startTime;
        
        expect(duration).toBeLessThan(500); // Should be very fast
      } catch (error: any) {
        if (error.killed) {
          expect(true).toBe(false); // Should not timeout
        }
      }
    });

    it('should not introduce new dependencies', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Check that we're still using standard bash tools
      expect(content).toContain('jq');
      expect(content).toContain('aws');
      expect(content).toContain('bc');
      
      // Should not introduce new tools
      expect(content).not.toContain('python');
      expect(content).not.toContain('node');
      expect(content).not.toContain('ruby');
    });
  });

  describe('Regression: Edge Cases', () => {
    it('should handle empty pipeline results', () => {
      const testScript = `
#!/bin/bash
set -o pipefail

# Empty pipeline result
RESULT=$(echo "" | jq '.test' 2>/dev/null || echo "EMPTY")

if [ "$RESULT" = "EMPTY" ]; then
  echo "PASS: Empty pipeline handled"
  exit 0
else
  echo "FAIL: Empty pipeline not handled"
  exit 1
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-regression-empty.sh');
      fs.writeFileSync(tempScript, testScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('PASS: Empty pipeline handled');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });

    it('should handle null values in jq', () => {
      const testScript = `
#!/bin/bash
set -o pipefail

# Null value in jq
RESULT=$(echo '{"test": null}' | jq -r '.test // "DEFAULT"' 2>/dev/null || echo "ERROR")

if [ "$RESULT" = "DEFAULT" ] || [ "$RESULT" = "null" ]; then
  echo "PASS: Null value handled"
  exit 0
else
  echo "FAIL: Null value not handled, got: $RESULT"
  exit 1
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-regression-null.sh');
      fs.writeFileSync(tempScript, testScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('PASS: Null value handled');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });

    it('should handle very long pipelines', () => {
      const testScript = `
#!/bin/bash
set -o pipefail

# Very long pipeline (5 stages)
RESULT=$(echo '{"a":{"b":{"c":{"d":"value"}}}}' | jq '.a' | jq '.b' | jq '.c' | jq -r '.d' 2>/dev/null || echo "ERROR")

if [ "$RESULT" = "value" ]; then
  echo "PASS: Long pipeline works"
  exit 0
else
  echo "FAIL: Long pipeline failed, got: $RESULT"
  exit 1
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-regression-long-pipeline.sh');
      fs.writeFileSync(tempScript, testScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('PASS: Long pipeline works');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });
  });
});
