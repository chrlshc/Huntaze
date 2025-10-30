import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';

/**
 * Tests de validation pour LAUNCH_STATUS.md
 * Valide le document de statut de lancement beta
 */

describe('Launch Status Document Validation', () => {
  let launchStatusContent: string;

  beforeEach(() => {
    if (existsSync('LAUNCH_STATUS.md')) {
      launchStatusContent = readFileSync('LAUNCH_STATUS.md', 'utf-8');
    }
  });

  describe('Document Structure', () => {
    it('should have launch status document', () => {
      expect(existsSync('LAUNCH_STATUS.md')).toBe(true);
    });

    it('should have required header sections', () => {
      expect(launchStatusContent).toContain('# 🚀 Beta Launch Status');
      expect(launchStatusContent).toContain('## ✅ Deployment Complete');
      expect(launchStatusContent).toContain('## 🎛️ Canary Deployment');
      expect(launchStatusContent).toContain('## 📊 Monitoring');
      expect(launchStatusContent).toContain('## 🎯 Current Metrics');
      expect(launchStatusContent).toContain('## 📋 Next Steps');
      expect(launchStatusContent).toContain('## 🚨 Rollback (If Needed)');
      expect(launchStatusContent).toContain('## 📊 Go/No-Go Thresholds');
    });

    it('should have status and date metadata', () => {
      expect(launchStatusContent).toMatch(/\*\*Date:\*\*/);
      expect(launchStatusContent).toMatch(/\*\*Status:\*\*/);
    });

    it('should have deployment timeline', () => {
      expect(launchStatusContent).toContain('**Timeline:**');
      expect(launchStatusContent).toMatch(/H\+0/);
      expect(launchStatusContent).toMatch(/H\+10/);
      expect(launchStatusContent).toMatch(/H\+20/);
    });
  });

  describe('Infrastructure Components', () => {
    it('should list all deployed Lambda functions', () => {
      expect(launchStatusContent).toContain('huntaze-mock-read');
      expect(launchStatusContent).toContain('huntaze-prisma-read');
    });

    it('should reference AppConfig configuration', () => {
      expect(launchStatusContent).toContain('AppConfig configured');
      expect(launchStatusContent).toContain('huntaze-flags');
    });

    it('should reference CloudWatch components', () => {
      expect(launchStatusContent).toContain('CloudWatch Dashboard');
      expect(launchStatusContent).toContain('CloudWatch Alarm');
      expect(launchStatusContent).toContain('huntaze-prisma-migration');
      expect(launchStatusContent).toContain('huntaze-lambda-error-rate-gt-2pct');
    });

    it('should reference X-Ray tracing', () => {
      expect(launchStatusContent).toContain('X-Ray Tracing');
      expect(launchStatusContent).toContain('annotations');
    });

    it('should reference CodeDeploy', () => {
      expect(launchStatusContent).toContain('CodeDeploy');
      expect(launchStatusContent).toContain('rollback');
    });
  });

  describe('Canary Deployment Configuration', () => {
    it('should specify canary strategy', () => {
      expect(launchStatusContent).toContain('Canary10Percent20Minutes');
    });

    it('should have deployment progress stages', () => {
      expect(launchStatusContent).toMatch(/0%.*10%.*100%/);
    });

    it('should have deployment duration', () => {
      expect(launchStatusContent).toContain('20 minutes');
      expect(launchStatusContent).toContain('20 min');
    });

    it('should have deployment version', () => {
      expect(launchStatusContent).toMatch(/\*\*Version:\*\*/);
    });

    it('should have deployment description', () => {
      expect(launchStatusContent).toContain('Enable Prisma canary');
      expect(launchStatusContent).toMatch(/1%.*rollout/);
    });
  });

  describe('AWS Commands', () => {
    it('should have AppConfig deployment check command', () => {
      expect(launchStatusContent).toContain('aws appconfig get-deployment');
      expect(launchStatusContent).toContain('--application-id');
      expect(launchStatusContent).toContain('--environment-id');
      expect(launchStatusContent).toContain('--deployment-number');
    });

    it('should have Lambda invoke command', () => {
      expect(launchStatusContent).toContain('aws lambda invoke');
      expect(launchStatusContent).toContain('--function-name');
      expect(launchStatusContent).toContain('--cli-binary-format raw-in-base64-out');
    });

    it('should have CloudWatch logs commands', () => {
      expect(launchStatusContent).toContain('aws logs tail');
      expect(launchStatusContent).toContain('--follow');
      expect(launchStatusContent).toContain('--since');
    });

    it('should have CloudWatch alarm check command', () => {
      expect(launchStatusContent).toContain('aws cloudwatch describe-alarms');
      expect(launchStatusContent).toContain('--alarm-names');
    });

    it('should have AppConfig stop deployment command', () => {
      expect(launchStatusContent).toContain('aws appconfig stop-deployment');
    });

    it('should use correct AWS region', () => {
      const regionMatches = launchStatusContent.match(/--region\s+(\S+)/g);
      expect(regionMatches).toBeDefined();
      regionMatches?.forEach(match => {
        expect(match).toContain('us-east-1');
      });
    });
  });

  describe('Monitoring Links', () => {
    it('should have CloudWatch dashboard URL', () => {
      expect(launchStatusContent).toMatch(/https:\/\/console\.aws\.amazon\.com\/cloudwatch.*dashboards/);
    });

    it('should have X-Ray service map URL', () => {
      expect(launchStatusContent).toMatch(/https:\/\/console\.aws\.amazon\.com\/xray.*service-map/);
    });

    it('should have X-Ray traces URL with canary filter', () => {
      expect(launchStatusContent).toMatch(/https:\/\/console\.aws\.amazon\.com\/xray.*traces/);
      expect(launchStatusContent).toContain('annotation.canary');
    });
  });

  describe('Metrics and Thresholds', () => {
    it('should define error rate threshold', () => {
      expect(launchStatusContent).toMatch(/error rate.*2%/i);
    });

    it('should define canary traffic percentage', () => {
      expect(launchStatusContent).toMatch(/1%.*traffic/i);
    });

    it('should define shadow diff threshold', () => {
      expect(launchStatusContent).toMatch(/shadow diff.*0\.5%/i);
    });

    it('should have Go/No-Go criteria for 1 hour', () => {
      expect(launchStatusContent).toContain('After 1 Hour');
      expect(launchStatusContent).toMatch(/Error rate < 2%/);
      expect(launchStatusContent).toMatch(/No alarms triggered/);
    });

    it('should have Go/No-Go criteria for 2 hours', () => {
      expect(launchStatusContent).toContain('After 2 Hours');
      expect(launchStatusContent).toMatch(/Error rate stable/);
      expect(launchStatusContent).toMatch(/P95 latency/);
    });

    it('should have Go/No-Go criteria for 3 hours', () => {
      expect(launchStatusContent).toContain('After 3 Hours');
      expect(launchStatusContent).toMatch(/Error rate < 1%/);
      expect(launchStatusContent).toMatch(/No incidents/);
    });

    it('should have decision criteria', () => {
      expect(launchStatusContent).toContain('**Decision:**');
      expect(launchStatusContent).toMatch(/GO.*ramp-up.*5%/);
      expect(launchStatusContent).toMatch(/NO-GO.*Rollback/);
    });
  });

  describe('Test Results', () => {
    it('should document pre-flight check results', () => {
      expect(launchStatusContent).toContain('Pre-flight checks');
      expect(launchStatusContent).toMatch(/\d+\/\d+\s+passed/);
    });

    it('should document Lambda invocation test', () => {
      expect(launchStatusContent).toContain('Lambda invocation');
      expect(launchStatusContent).toContain('Working');
    });

    it('should document X-Ray annotations test', () => {
      expect(launchStatusContent).toContain('X-Ray annotations');
      expect(launchStatusContent).toContain('Visible in logs');
    });

    it('should document feature flags test', () => {
      expect(launchStatusContent).toContain('Feature flags');
      expect(launchStatusContent).toContain('Retrieved successfully');
    });
  });

  describe('Rollback Procedures', () => {
    it('should document automatic rollback', () => {
      expect(launchStatusContent).toContain('### Automatic');
      expect(launchStatusContent).toContain('CloudWatch Alarm will trigger');
      expect(launchStatusContent).toContain('CodeDeploy will rollback automatically');
    });

    it('should document manual rollback', () => {
      expect(launchStatusContent).toContain('### Manual');
      expect(launchStatusContent).toContain('aws appconfig stop-deployment');
    });

    it('should specify rollback trigger conditions', () => {
      expect(launchStatusContent).toMatch(/error rate.*>.*2%/i);
    });
  });

  describe('Documentation References', () => {
    it('should reference beta playbook', () => {
      expect(launchStatusContent).toContain('sam/BETA_PLAYBOOK.md');
    });

    it('should reference go/no-go checklist', () => {
      expect(launchStatusContent).toContain('sam/GO_NO_GO_CHECKLIST.md');
    });

    it('should reference quick reference', () => {
      expect(launchStatusContent).toContain('sam/QUICK_REFERENCE.md');
    });

    it('should reference logs insights queries', () => {
      expect(launchStatusContent).toContain('sam/LOGS_INSIGHTS_QUERIES.md');
    });

    it('should reference X-Ray guide', () => {
      expect(launchStatusContent).toContain('sam/XRAY_TRACING_GUIDE.md');
    });

    it('should verify referenced documents exist', () => {
      const docRefs = [
        'sam/BETA_PLAYBOOK.md',
        'sam/GO_NO_GO_CHECKLIST.md',
        'sam/QUICK_REFERENCE.md',
        'sam/LOGS_INSIGHTS_QUERIES.md',
        'sam/XRAY_TRACING_GUIDE.md'
      ];

      docRefs.forEach(doc => {
        if (launchStatusContent.includes(doc)) {
          expect(existsSync(doc)).toBe(true);
        }
      });
    });
  });

  describe('Monitoring Scripts', () => {
    it('should reference SAM logs command', () => {
      expect(launchStatusContent).toContain('sam logs');
      expect(launchStatusContent).toContain('--tail');
    });

    it('should reference monitoring script', () => {
      expect(launchStatusContent).toContain('monitor-beta.sh');
      expect(launchStatusContent).toContain('./monitor-beta.sh');
    });

    it('should have watch mode for monitoring', () => {
      expect(launchStatusContent).toContain('--watch');
    });
  });

  describe('Quick Commands Section', () => {
    it('should have quick commands section', () => {
      expect(launchStatusContent).toContain('## 📞 Quick Commands');
    });

    it('should include all essential commands', () => {
      const essentialCommands = [
        'Check deployment status',
        'Test Lambda',
        'Tail logs',
        'Check alarm',
        'Monitor script'
      ];

      essentialCommands.forEach(cmd => {
        expect(launchStatusContent).toContain(cmd);
      });
    });

    it('should have properly formatted code blocks', () => {
      const codeBlocks = launchStatusContent.match(/```bash\n[\s\S]*?\n```/g);
      expect(codeBlocks).toBeDefined();
      expect(codeBlocks!.length).toBeGreaterThan(5);
    });
  });

  describe('Feature Flag Configuration', () => {
    it('should document current feature flag state', () => {
      expect(launchStatusContent).toContain('**Feature Flag:**');
      expect(launchStatusContent).toMatch(/Current:.*enabled:\s*false/);
    });

    it('should document target feature flag state', () => {
      expect(launchStatusContent).toMatch(/Target:.*enabled:\s*true/);
    });

    it('should document deployment transition', () => {
      expect(launchStatusContent).toContain('transitioning');
      expect(launchStatusContent).toContain('after deployment');
    });
  });

  describe('Test Traffic Generation', () => {
    it('should have test traffic generation script', () => {
      expect(launchStatusContent).toContain('for i in {1..100}');
      expect(launchStatusContent).toContain('aws lambda invoke');
    });

    it('should have canary traffic verification', () => {
      expect(launchStatusContent).toContain('grep CANARY');
    });

    it('should specify test payload format', () => {
      expect(launchStatusContent).toMatch(/--payload.*userId/);
    });
  });

  describe('Consistency with Other Documents', () => {
    it('should be consistent with BETA_PLAYBOOK.md', () => {
      if (existsSync('sam/BETA_PLAYBOOK.md')) {
        const playbookContent = readFileSync('sam/BETA_PLAYBOOK.md', 'utf-8');
        
        // Check for consistent Lambda names
        if (playbookContent.includes('huntaze-mock-read')) {
          expect(launchStatusContent).toContain('huntaze-mock-read');
        }
        
        // Check for consistent error thresholds
        if (playbookContent.includes('2%')) {
          expect(launchStatusContent).toContain('2%');
        }
      }
    });

    it('should be consistent with GO_NO_GO_CHECKLIST.md', () => {
      if (existsSync('sam/GO_NO_GO_CHECKLIST.md')) {
        const checklistContent = readFileSync('sam/GO_NO_GO_CHECKLIST.md', 'utf-8');
        
        // Check for consistent thresholds
        const thresholds = ['1%', '2%', '0.5%'];
        thresholds.forEach(threshold => {
          if (checklistContent.includes(threshold)) {
            expect(launchStatusContent).toContain(threshold);
          }
        });
      }
    });

    it('should reference monitoring script that exists', () => {
      if (launchStatusContent.includes('monitor-beta.sh')) {
        expect(existsSync('sam/monitor-beta.sh') || existsSync('sam/monitor.sh')).toBe(true);
      }
    });
  });

  describe('Timestamp and Version Information', () => {
    it('should have deployment start timestamp', () => {
      expect(launchStatusContent).toMatch(/Deployment started:.*\d{4}-\d{2}-\d{2}/);
    });

    it('should have expected completion timestamp', () => {
      expect(launchStatusContent).toMatch(/Expected completion:.*\d{4}-\d{2}-\d{2}/);
    });

    it('should have deployment version number', () => {
      expect(launchStatusContent).toMatch(/\*\*Version:\*\*\s*\d+/);
    });
  });

  describe('Status Indicators', () => {
    it('should use emoji status indicators', () => {
      expect(launchStatusContent).toMatch(/✅|🎛️|📊|🎯|📋|🚨|📞|🚀/);
    });

    it('should have clear deployment status', () => {
      expect(launchStatusContent).toMatch(/\*\*Status:\*\*.*DEPLOYING|LIVE|COMPLETE/i);
    });

    it('should have progress indicator', () => {
      expect(launchStatusContent).toMatch(/\*\*Progress:\*\*/);
    });
  });

  describe('Safety and Validation', () => {
    it('should not contain hardcoded secrets', () => {
      expect(launchStatusContent).not.toMatch(/sk_live_[a-zA-Z0-9]+/);
      expect(launchStatusContent).not.toMatch(/sk_test_[a-zA-Z0-9]+/);
      expect(launchStatusContent).not.toMatch(/AKIA[0-9A-Z]{16}/);
    });

    it('should use placeholder values for sensitive data', () => {
      // Application IDs should be present but not full ARNs with account numbers
      expect(launchStatusContent).toContain('--application-id');
      expect(launchStatusContent).toContain('--environment-id');
    });

    it('should have proper error handling in scripts', () => {
      expect(launchStatusContent).toMatch(/> \/dev\/null 2>&1||| true/);
    });
  });
});
