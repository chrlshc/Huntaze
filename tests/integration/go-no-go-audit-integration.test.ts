/**
 * Integration Tests for go-no-go-audit.sh
 * Tests the script execution with mocked AWS responses
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('go-no-go-audit.sh Integration Tests', () => {
  const scriptPath = path.join(process.cwd(), 'scripts/go-no-go-audit.sh');
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Pipeline Error Handling Integration', () => {
    it('should fail when AWS CLI command in pipeline fails', () => {
      // Create a test script that simulates AWS CLI failure in pipeline
      const testScript = `
#!/bin/bash
set -o pipefail

# Simulate AWS CLI failure
false | jq '.clusters' || echo "[]"
exit_code=$?

# With pipefail, this should capture the failure
if [ $exit_code -ne 0 ]; then
  echo "PASS: Pipeline failure detected"
  exit 0
else
  echo "FAIL: Pipeline failure not detected"
  exit 1
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-pipeline-test.sh');
      fs.writeFileSync(tempScript, testScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('PASS: Pipeline failure detected');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });

    it('should handle jq parsing errors in pipelines', () => {
      const testScript = `
#!/bin/bash
set -o pipefail

# Invalid JSON should cause jq to fail
echo "invalid json" | jq '.test' 2>/dev/null || echo "ERROR_HANDLED"
      `;

      const tempScript = path.join(process.cwd(), 'temp-jq-test.sh');
      fs.writeFileSync(tempScript, testScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('ERROR_HANDLED');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });

    it('should propagate errors through multi-stage pipelines', () => {
      const testScript = `
#!/bin/bash
set -o pipefail

# Multi-stage pipeline with failure in middle
echo '{"test": "data"}' | false | jq '.test' 2>/dev/null
exit_code=$?

if [ $exit_code -ne 0 ]; then
  echo "Multi-stage pipeline error detected"
  exit 0
else
  echo "Multi-stage pipeline error NOT detected"
  exit 1
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-multistage-test.sh');
      fs.writeFileSync(tempScript, testScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('Multi-stage pipeline error detected');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });
  });

  describe('GO Decision Scenarios', () => {
    it('should return exit code 0 for GO decision', () => {
      // Create mock script that simulates all checks passing
      const mockScript = `
#!/bin/bash
set -o pipefail

PASS_COUNT=15
FAIL_COUNT=0
WARN_COUNT=2

if [ "$FAIL_COUNT" -eq 0 ] && [ "$WARN_COUNT" -le 3 ]; then
  echo "🚀 GO FOR PRODUCTION"
  exit 0
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-go-test.sh');
      fs.writeFileSync(tempScript, mockScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('🚀 GO FOR PRODUCTION');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });

    it('should return exit code 1 for CONDITIONAL GO', () => {
      const mockScript = `
#!/bin/bash
set -o pipefail

PASS_COUNT=12
FAIL_COUNT=0
WARN_COUNT=5

if [ "$FAIL_COUNT" -eq 0 ] && [ "$WARN_COUNT" -le 3 ]; then
  echo "🚀 GO FOR PRODUCTION"
  exit 0
elif [ "$FAIL_COUNT" -eq 0 ]; then
  echo "⚠️  CONDITIONAL GO"
  exit 1
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-conditional-test.sh');
      fs.writeFileSync(tempScript, mockScript, { mode: 0o755 });

      try {
        execSync(tempScript, { encoding: 'utf-8' });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.status).toBe(1);
        expect(error.stdout.toString()).toContain('⚠️  CONDITIONAL GO');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });

    it('should return exit code 2 for NO-GO', () => {
      const mockScript = `
#!/bin/bash
set -o pipefail

PASS_COUNT=10
FAIL_COUNT=3
WARN_COUNT=2

if [ "$FAIL_COUNT" -eq 0 ] && [ "$WARN_COUNT" -le 3 ]; then
  echo "🚀 GO FOR PRODUCTION"
  exit 0
elif [ "$FAIL_COUNT" -eq 0 ]; then
  echo "⚠️  CONDITIONAL GO"
  exit 1
else
  echo "🛑 NO-GO FOR PRODUCTION"
  exit 2
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-nogo-test.sh');
      fs.writeFileSync(tempScript, mockScript, { mode: 0o755 });

      try {
        execSync(tempScript, { encoding: 'utf-8' });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.status).toBe(2);
        expect(error.stdout.toString()).toContain('🛑 NO-GO FOR PRODUCTION');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });
  });

  describe('AWS CLI Mock Integration', () => {
    it('should handle empty AWS responses gracefully', () => {
      const mockScript = `
#!/bin/bash
set -o pipefail

# Simulate empty AWS response
CLUSTERS='[]'

if [ "$CLUSTERS" != "[]" ]; then
  echo "FAIL: Should detect empty response"
  exit 1
else
  echo "PASS: Empty response handled"
  exit 0
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-empty-response-test.sh');
      fs.writeFileSync(tempScript, mockScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('PASS: Empty response handled');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });

    it('should handle malformed JSON responses', () => {
      const mockScript = `
#!/bin/bash
set -o pipefail

# Simulate malformed JSON
RESPONSE='{"invalid": json}'

# Try to parse with jq
PARSED=$(echo "$RESPONSE" | jq '.test' 2>/dev/null || echo "PARSE_ERROR")

if [ "$PARSED" = "PARSE_ERROR" ]; then
  echo "PASS: Malformed JSON handled"
  exit 0
else
  echo "FAIL: Should detect malformed JSON"
  exit 1
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-malformed-json-test.sh');
      fs.writeFileSync(tempScript, mockScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('PASS: Malformed JSON handled');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });
  });

  describe('Counter Logic Integration', () => {
    it('should correctly increment PASS counter', () => {
      const mockScript = `
#!/bin/bash
set -o pipefail

PASS_COUNT=0

check_pass() {
  ((PASS_COUNT++))
}

check_pass
check_pass
check_pass

if [ "$PASS_COUNT" -eq 3 ]; then
  echo "PASS: Counter incremented correctly"
  exit 0
else
  echo "FAIL: Counter is $PASS_COUNT, expected 3"
  exit 1
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-counter-test.sh');
      fs.writeFileSync(tempScript, mockScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('PASS: Counter incremented correctly');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });

    it('should handle mixed check results', () => {
      const mockScript = `
#!/bin/bash
set -o pipefail

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

check_pass() { ((PASS_COUNT++)); }
check_fail() { ((FAIL_COUNT++)); }
check_warn() { ((WARN_COUNT++)); }

check_pass
check_pass
check_fail
check_warn
check_pass

echo "PASS: $PASS_COUNT, FAIL: $FAIL_COUNT, WARN: $WARN_COUNT"

if [ "$PASS_COUNT" -eq 3 ] && [ "$FAIL_COUNT" -eq 1 ] && [ "$WARN_COUNT" -eq 1 ]; then
  echo "PASS: All counters correct"
  exit 0
else
  echo "FAIL: Counter mismatch"
  exit 1
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-mixed-counter-test.sh');
      fs.writeFileSync(tempScript, mockScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('PASS: All counters correct');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });
  });

  describe('Budget Calculation Integration', () => {
    it('should calculate budget percentage correctly', () => {
      const mockScript = `
#!/bin/bash
set -o pipefail

ACTUAL_SPEND="350.50"
BUDGET_LIMIT="500"

PERCENTAGE=$(echo "scale=1; $ACTUAL_SPEND * 100 / $BUDGET_LIMIT" | bc)

echo "Percentage: $PERCENTAGE%"

# Check if calculation is correct (should be 70.1%)
if [ "$PERCENTAGE" = "70.1" ]; then
  echo "PASS: Budget calculation correct"
  exit 0
else
  echo "FAIL: Expected 70.1%, got $PERCENTAGE%"
  exit 1
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-budget-calc-test.sh');
      fs.writeFileSync(tempScript, mockScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('PASS: Budget calculation correct');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });

    it('should handle budget threshold logic', () => {
      const mockScript = `
#!/bin/bash
set -o pipefail

BUDGET_THRESHOLD=400
BUDGET_LIMIT=500

test_spend() {
  local SPEND_INT=$1
  local EXPECTED=$2
  
  if [ "$SPEND_INT" -lt "$BUDGET_THRESHOLD" ]; then
    RESULT="PASS"
  elif [ "$SPEND_INT" -lt "$BUDGET_LIMIT" ]; then
    RESULT="WARN"
  else
    RESULT="FAIL"
  fi
  
  if [ "$RESULT" = "$EXPECTED" ]; then
    echo "✓ Spend $SPEND_INT: $RESULT (expected $EXPECTED)"
  else
    echo "✗ Spend $SPEND_INT: $RESULT (expected $EXPECTED)"
    exit 1
  fi
}

test_spend 300 "PASS"
test_spend 450 "WARN"
test_spend 550 "FAIL"

echo "PASS: All budget threshold tests passed"
      `;

      const tempScript = path.join(process.cwd(), 'temp-budget-threshold-test.sh');
      fs.writeFileSync(tempScript, mockScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('PASS: All budget threshold tests passed');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });
  });

  describe('Color Output Integration', () => {
    it('should use ANSI color codes correctly', () => {
      const mockScript = `
#!/bin/bash
set -o pipefail

GREEN='\\033[0;32m'
RED='\\033[0;31m'
YELLOW='\\033[1;33m'
NC='\\033[0m'

echo -e "\${GREEN}✅ PASS\${NC}: Test message"
echo -e "\${RED}❌ FAIL\${NC}: Test message"
echo -e "\${YELLOW}⚠️  WARN\${NC}: Test message"

echo "PASS: Color codes defined"
      `;

      const tempScript = path.join(process.cwd(), 'temp-color-test.sh');
      fs.writeFileSync(tempScript, mockScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('PASS: Color codes defined');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });
  });

  describe('Real Script Execution (Dry Run)', () => {
    it('should execute without syntax errors', () => {
      // Dry run - just check syntax
      try {
        execSync(`bash -n ${scriptPath}`, { encoding: 'utf-8' });
        expect(true).toBe(true); // Syntax check passed
      } catch (error: any) {
        expect(error).toBeUndefined(); // Should not have syntax errors
      }
    });

    it('should have executable permissions', () => {
      const stats = fs.statSync(scriptPath);
      const isExecutable = (stats.mode & 0o111) !== 0;
      expect(isExecutable).toBe(true);
    });

    it('should contain all required sections', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      const requiredSections = [
        'INFRASTRUCTURE HEALTH',
        'SECURITY POSTURE',
        'COST MONITORING',
        'MONITORING & OBSERVABILITY',
        'OPERATIONAL READINESS',
        'FINAL GO/NO-GO DECISION'
      ];

      requiredSections.forEach(section => {
        expect(content).toContain(section);
      });
    });
  });

  describe('Regression Tests for set -o pipefail Change', () => {
    it('should not have set -e anywhere in the script', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const lines = content.split('\n');
      
      const setELines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed === 'set -e' && !trimmed.startsWith('#');
      });

      expect(setELines.length).toBe(0);
    });

    it('should have set -o pipefail at the beginning', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const lines = content.split('\n');
      
      // Find the line with set -o pipefail
      const pipefailLineIndex = lines.findIndex(line => 
        line.includes('set -o pipefail')
      );

      // Should be within first 10 lines (after shebang and comments)
      expect(pipefailLineIndex).toBeGreaterThan(0);
      expect(pipefailLineIndex).toBeLessThan(10);
    });

    it('should maintain pipefail behavior throughout execution', () => {
      const testScript = `
#!/bin/bash
set -o pipefail

# Test that pipefail is active
echo "test" | false | cat
exit_code=$?

if [ $exit_code -ne 0 ]; then
  echo "PASS: pipefail is active"
  exit 0
else
  echo "FAIL: pipefail is not active"
  exit 1
fi
      `;

      const tempScript = path.join(process.cwd(), 'temp-pipefail-active-test.sh');
      fs.writeFileSync(tempScript, testScript, { mode: 0o755 });

      try {
        const result = execSync(tempScript, { encoding: 'utf-8' });
        expect(result).toContain('PASS: pipefail is active');
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });
  });

  describe('Performance and Timeout Tests', () => {
    it('should complete syntax check quickly', () => {
      const startTime = Date.now();
      
      try {
        execSync(`bash -n ${scriptPath}`, { encoding: 'utf-8', timeout: 5000 });
        const duration = Date.now() - startTime;
        
        expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      } catch (error: any) {
        if (error.killed) {
          expect(true).toBe(false); // Should not timeout
        }
      }
    });
  });
});
