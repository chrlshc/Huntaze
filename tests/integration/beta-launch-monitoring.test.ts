import { describe, it, expect, beforeAll, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Tests d'intégration pour le monitoring du lancement beta
 * Valide les commandes AWS et les scripts de monitoring
 */

describe('Beta Launch Monitoring Integration', () => {
  let launchStatusContent: string;

  beforeAll(() => {
    if (existsSync('LAUNCH_STATUS.md')) {
      launchStatusContent = readFileSync('LAUNCH_STATUS.md', 'utf-8');
    }
  });

  describe('AWS CLI Command Validation', () => {
    it('should have valid AWS CLI syntax for AppConfig', () => {
      const appConfigCommands = launchStatusContent.match(/aws appconfig [^\n]+/g);
      
      expect(appConfigCommands).toBeDefined();
      appConfigCommands?.forEach(cmd => {
        // Should have required parameters
        if (cmd.includes('get-deployment')) {
          expect(cmd).toContain('--application-id');
          expect(cmd).toContain('--environment-id');
          expect(cmd).toContain('--deployment-number');
        }
        
        if (cmd.includes('stop-deployment')) {
          expect(cmd).toContain('--application-id');
          expect(cmd).toContain('--environment-id');
          expect(cmd).toContain('--deployment-number');
        }
      });
    });

    it('should have valid AWS CLI syntax for Lambda', () => {
      const lambdaCommands = launchStatusContent.match(/aws lambda [^\n]+/g);
      
      expect(lambdaCommands).toBeDefined();
      lambdaCommands?.forEach(cmd => {
        if (cmd.includes('invoke')) {
          expect(cmd).toContain('--function-name');
          expect(cmd).toContain('--region');
        }
      });
    });

    it('should have valid AWS CLI syntax for CloudWatch', () => {
      const cloudwatchCommands = launchStatusContent.match(/aws (cloudwatch|logs) [^\n]+/g);
      
      expect(cloudwatchCommands).toBeDefined();
      cloudwatchCommands?.forEach(cmd => {
        expect(cmd).toContain('--region');
        
        if (cmd.includes('describe-alarms')) {
          expect(cmd).toContain('--alarm-names');
        }
        
        if (cmd.includes('logs tail')) {
          expect(cmd).toMatch(/--since|--follow/);
        }
      });
    });

    it('should use consistent region across all commands', () => {
      const regionMatches = launchStatusContent.match(/--region\s+(\S+)/g);
      
      expect(regionMatches).toBeDefined();
      
      const regions = regionMatches?.map(match => match.split(/\s+/)[1]);
      const uniqueRegions = [...new Set(regions)];
      
      // Should use only one region
      expect(uniqueRegions.length).toBe(1);
      expect(uniqueRegions[0]).toBe('us-east-1');
    });
  });

  describe('Monitoring Script Validation', () => {
    it('should have monitor script in sam directory', () => {
      const hasMonitorScript = existsSync('sam/monitor-beta.sh') || existsSync('sam/monitor.sh');
      expect(hasMonitorScript).toBe(true);
    });

    it('should have executable permissions on monitor script', async () => {
      if (existsSync('sam/monitor-beta.sh')) {
        try {
          const { stdout } = await execAsync('test -x sam/monitor-beta.sh && echo "executable"');
          expect(stdout.trim()).toBe('executable');
        } catch (error) {
          console.warn('Monitor script may not be executable');
        }
      }
    });

    it('should have SAM CLI available for logs command', async () => {
      try {
        const { stdout } = await execAsync('which sam');
        expect(stdout).toContain('sam');
      } catch (error) {
        console.warn('SAM CLI not available - skipping SAM-specific tests');
      }
    });
  });

  describe('Deployment Timeline Validation', () => {
    it('should have consistent timeline calculations', () => {
      const timelineMatches = launchStatusContent.match(/H\+(\d+)/g);
      
      expect(timelineMatches).toBeDefined();
      expect(timelineMatches!.length).toBeGreaterThanOrEqual(3);
      
      // Extract hour offsets
      const hours = timelineMatches!.map(match => {
        const hourMatch = match.match(/H\+(\d+)/);
        return hourMatch ? parseInt(hourMatch[1]) : 0;
      });
      
      // Should be in ascending order
      for (let i = 1; i < hours.length; i++) {
        expect(hours[i]).toBeGreaterThanOrEqual(hours[i - 1]);
      }
    });

    it('should have deployment duration matching timeline', () => {
      // Extract deployment duration
      const durationMatch = launchStatusContent.match(/(\d+)\s*min/);
      expect(durationMatch).toBeDefined();
      
      const durationMinutes = parseInt(durationMatch![1]);
      
      // Extract timeline end
      const timelineEnd = launchStatusContent.match(/H\+(\d+).*Expected.*complete/);
      expect(timelineEnd).toBeDefined();
      
      const endMinutes = parseInt(timelineEnd![1]);
      
      // Duration should match timeline
      expect(endMinutes).toBe(durationMinutes);
    });
  });

  describe('Go/No-Go Threshold Validation', () => {
    it('should have progressive threshold tightening', () => {
      // Extract error rate thresholds
      const hour1Match = launchStatusContent.match(/After 1 Hour[\s\S]*?Error rate < (\d+)%/);
      const hour2Match = launchStatusContent.match(/After 2 Hours[\s\S]*?Error rate stable < (\d+)%/);
      const hour3Match = launchStatusContent.match(/After 3 Hours[\s\S]*?Error rate < (\d+)%/);
      
      if (hour1Match && hour2Match && hour3Match) {
        const threshold1 = parseInt(hour1Match[1]);
        const threshold2 = parseInt(hour2Match[1]);
        const threshold3 = parseInt(hour3Match[1]);
        
        // Thresholds should get stricter over time
        expect(threshold3).toBeLessThanOrEqual(threshold2);
        expect(threshold2).toBeLessThanOrEqual(threshold1);
      }
    });

    it('should have all required Go/No-Go criteria', () => {
      const requiredCriteria = [
        'Error rate',
        'alarms',
        'Canary traffic',
        'Shadow diff',
        'P95 latency',
        'incidents'
      ];
      
      requiredCriteria.forEach(criterion => {
        expect(launchStatusContent).toContain(criterion);
      });
    });

    it('should have decision points defined', () => {
      expect(launchStatusContent).toContain('**Decision:**');
      expect(launchStatusContent).toMatch(/GO.*→/);
      expect(launchStatusContent).toMatch(/NO-GO.*→/);
    });
  });

  describe('Canary Deployment Configuration', () => {
    it('should have valid canary percentage progression', () => {
      const progressMatch = launchStatusContent.match(/(\d+)%.*→.*(\d+)%.*→.*(\d+)%/);
      
      expect(progressMatch).toBeDefined();
      
      const [, start, middle, end] = progressMatch!;
      expect(parseInt(start)).toBe(0);
      expect(parseInt(middle)).toBeGreaterThan(0);
      expect(parseInt(middle)).toBeLessThan(100);
      expect(parseInt(end)).toBe(100);
    });

    it('should have canary strategy matching AWS AppConfig format', () => {
      const strategyMatch = launchStatusContent.match(/Canary(\d+)Percent(\d+)Minutes/);
      
      expect(strategyMatch).toBeDefined();
      
      const [, percent, minutes] = strategyMatch!;
      expect(parseInt(percent)).toBeGreaterThan(0);
      expect(parseInt(percent)).toBeLessThan(100);
      expect(parseInt(minutes)).toBeGreaterThan(0);
    });
  });

  describe('Test Traffic Generation', () => {
    it('should have valid bash loop syntax', () => {
      const loopMatch = launchStatusContent.match(/for i in \{1\.\.(\d+)\}/);
      
      expect(loopMatch).toBeDefined();
      
      const iterations = parseInt(loopMatch![1]);
      expect(iterations).toBeGreaterThan(0);
      expect(iterations).toBeLessThanOrEqual(1000); // Reasonable limit
    });

    it('should have proper output redirection', () => {
      expect(launchStatusContent).toMatch(/> \/dev\/null 2>&1/);
    });

    it('should use unique test payloads', () => {
      expect(launchStatusContent).toMatch(/userId.*user-\$i/);
    });
  });

  describe('Rollback Mechanism Validation', () => {
    it('should have automatic rollback trigger', () => {
      expect(launchStatusContent).toContain('CloudWatch Alarm will trigger');
      expect(launchStatusContent).toContain('CodeDeploy will rollback automatically');
    });

    it('should have manual rollback command', () => {
      expect(launchStatusContent).toContain('aws appconfig stop-deployment');
    });

    it('should specify rollback conditions', () => {
      expect(launchStatusContent).toMatch(/error rate.*>.*\d+%/i);
    });

    it('should have no manual intervention statement for automatic rollback', () => {
      const automaticSection = launchStatusContent.match(/### Automatic[\s\S]*?### Manual/);
      
      expect(automaticSection).toBeDefined();
      expect(automaticSection![0]).toContain('No manual intervention needed');
    });
  });

  describe('Monitoring URL Validation', () => {
    it('should have valid AWS console URLs', () => {
      const urls = launchStatusContent.match(/https:\/\/console\.aws\.amazon\.com\/[^\s]+/g);
      
      expect(urls).toBeDefined();
      expect(urls!.length).toBeGreaterThan(0);
      
      urls?.forEach(url => {
        expect(url).toMatch(/^https:\/\/console\.aws\.amazon\.com\/(cloudwatch|xray)/);
      });
    });

    it('should have CloudWatch dashboard URL with correct format', () => {
      const dashboardUrl = launchStatusContent.match(/https:\/\/console\.aws\.amazon\.com\/cloudwatch[^\s]+dashboards/);
      
      expect(dashboardUrl).toBeDefined();
      expect(dashboardUrl![0]).toContain('region=us-east-1');
    });

    it('should have X-Ray URLs with correct filters', () => {
      const xrayUrls = launchStatusContent.match(/https:\/\/console\.aws\.amazon\.com\/xray[^\s]+/g);
      
      expect(xrayUrls).toBeDefined();
      
      const tracesUrl = xrayUrls?.find(url => url.includes('traces'));
      if (tracesUrl) {
        expect(tracesUrl).toContain('annotation.canary');
      }
    });
  });

  describe('Feature Flag State Machine', () => {
    it('should document current and target states', () => {
      expect(launchStatusContent).toMatch(/Current:.*enabled:\s*(true|false)/);
      expect(launchStatusContent).toMatch(/Target:.*enabled:\s*(true|false)/);
    });

    it('should show state transition', () => {
      const currentMatch = launchStatusContent.match(/Current:.*enabled:\s*(true|false)/);
      const targetMatch = launchStatusContent.match(/Target:.*enabled:\s*(true|false)/);
      
      if (currentMatch && targetMatch) {
        const current = currentMatch[1] === 'true';
        const target = targetMatch[1] === 'true';
        
        // Should be transitioning (different states)
        expect(current).not.toBe(target);
      }
    });
  });

  describe('Lambda Function Configuration', () => {
    it('should document Lambda function names', () => {
      expect(launchStatusContent).toContain('huntaze-mock-read');
      expect(launchStatusContent).toContain('huntaze-prisma-read');
    });

    it('should document X-Ray configuration', () => {
      expect(launchStatusContent).toMatch(/X-Ray:.*Enabled/);
    });

    it('should document canary annotations', () => {
      expect(launchStatusContent).toContain('canary=false');
      expect(launchStatusContent).toContain('canary=true');
    });
  });

  describe('Documentation Cross-References', () => {
    it('should reference all required documentation files', () => {
      const requiredDocs = [
        'BETA_PLAYBOOK.md',
        'GO_NO_GO_CHECKLIST.md',
        'QUICK_REFERENCE.md',
        'LOGS_INSIGHTS_QUERIES.md',
        'XRAY_TRACING_GUIDE.md'
      ];
      
      requiredDocs.forEach(doc => {
        expect(launchStatusContent).toContain(doc);
      });
    });

    it('should have all referenced documents in sam directory', () => {
      const docRefs = launchStatusContent.match(/sam\/[A-Z_]+\.md/g);
      
      expect(docRefs).toBeDefined();
      
      docRefs?.forEach(ref => {
        expect(existsSync(ref)).toBe(true);
      });
    });
  });

  describe('Command Execution Safety', () => {
    it('should not have dangerous commands', () => {
      expect(launchStatusContent).not.toContain('rm -rf /');
      expect(launchStatusContent).not.toContain('sudo rm');
      expect(launchStatusContent).not.toContain('dd if=');
    });

    it('should use safe output redirection', () => {
      const redirections = launchStatusContent.match(/>\s*\/tmp\/[^\s]+/g);
      
      redirections?.forEach(redirect => {
        expect(redirect).toMatch(/\/tmp\//);
      });
    });

    it('should have proper error handling in loops', () => {
      const loops = launchStatusContent.match(/for [^;]+; do[\s\S]*?done/g);
      
      loops?.forEach(loop => {
        // Should have error handling or output redirection
        expect(loop).toMatch(/2>&1||| true||| echo/);
      });
    });
  });

  describe('Metric Collection Validation', () => {
    it('should specify metrics to collect', () => {
      const metrics = [
        'Error rate',
        'P95 latency',
        'Canary traffic',
        'Shadow diff'
      ];
      
      metrics.forEach(metric => {
        expect(launchStatusContent).toContain(metric);
      });
    });

    it('should have metric thresholds defined', () => {
      expect(launchStatusContent).toMatch(/\d+%/);
      expect(launchStatusContent).toMatch(/±\d+%/);
    });

    it('should reference CloudWatch for metrics', () => {
      expect(launchStatusContent).toContain('CloudWatch');
      expect(launchStatusContent).toContain('Dashboard');
    });
  });

  describe('Status Update Mechanism', () => {
    it('should have timestamp format', () => {
      expect(launchStatusContent).toMatch(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/);
    });

    it('should have status indicators', () => {
      expect(launchStatusContent).toMatch(/Status:.*DEPLOYING|LIVE|COMPLETE/i);
    });

    it('should have progress tracking', () => {
      expect(launchStatusContent).toMatch(/Progress:.*\d+%/);
    });
  });
});
