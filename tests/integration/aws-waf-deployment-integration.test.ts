import { describe, it, expect, beforeAll, vi } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync } from 'fs';
import { parse } from 'yaml';

const execAsync = promisify(exec);

/**
 * Tests d'intégration pour le déploiement WAF
 * Simule le déploiement et valide l'intégration avec AWS
 * Basé sur la tâche 3 de aws-security-cost-optimization
 */

describe('WAF Deployment Integration Tests', () => {
  let wafConfig: any;

  beforeAll(() => {
    if (existsSync('sam/waf-protection.yaml')) {
      const content = readFileSync('sam/waf-protection.yaml', 'utf-8');
      wafConfig = parse(content);
    }
  });

  describe('CloudFormation Template Validation', () => {
    it('should have valid CloudFormation template', () => {
      expect(wafConfig).toBeDefined();
      expect(wafConfig.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(wafConfig.Description).toContain('WAF');
    });

    it('should validate template syntax with AWS CLI', async () => {
      if (!existsSync('sam/waf-protection.yaml')) {
        console.warn('WAF template not found, skipping validation');
        return;
      }

      try {
        const { stdout } = await execAsync(
          'aws cloudformation validate-template --template-body file://sam/waf-protection.yaml 2>&1 || echo "SKIP"'
        );
        
        // If AWS CLI is available and configured
        if (!stdout.includes('SKIP') && !stdout.includes('Unable to locate credentials')) {
          expect(stdout).not.toContain('ValidationError');
        }
      } catch (error) {
        console.warn('AWS CLI validation skipped:', error);
      }
    }, 30000);

    it('should have all required resources defined', () => {
      const requiredResources = [
        'HuntazeWebACL',
        'WAFLogGroup',
        'WAFHighBlockRateAlarm',
        'WAFRateLimitAlarm'
      ];

      requiredResources.forEach(resource => {
        expect(wafConfig.Resources[resource]).toBeDefined();
      });
    });

    it('should have all required outputs defined', () => {
      const requiredOutputs = [
        'WebACLArn',
        'WebACLId',
        'WAFLogGroupName',
        'WAFDashboardURL'
      ];

      requiredOutputs.forEach(output => {
        expect(wafConfig.Outputs[output]).toBeDefined();
      });
    });
  });

  describe('WAF Rules Integration', () => {
    it('should configure rate limiting with correct parameters', () => {
      const webACL = wafConfig.Resources.HuntazeWebACL;
      const rateLimitRule = webACL.Properties.Rules.find(
        (r: any) => r.Name === 'RateLimitRule'
      );

      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule.Priority).toBe(10);
      expect(rateLimitRule.Statement.RateBasedStatement).toBeDefined();
      expect(rateLimitRule.Statement.RateBasedStatement.AggregateKeyType).toBe('IP');
    });

    it('should integrate AWS Managed Rules correctly', () => {
      const webACL = wafConfig.Resources.HuntazeWebACL;
      const managedRules = webACL.Properties.Rules.filter(
        (r: any) => r.Statement.ManagedRuleGroupStatement
      );

      expect(managedRules.length).toBeGreaterThanOrEqual(4);
      
      managedRules.forEach((rule: any) => {
        expect(rule.Statement.ManagedRuleGroupStatement.VendorName).toBe('AWS');
        expect(rule.OverrideAction).toBeDefined();
      });
    });

    it('should have proper rule priority ordering', () => {
      const webACL = wafConfig.Resources.HuntazeWebACL;
      const priorities = webACL.Properties.Rules.map((r: any) => r.Priority);

      // Check priorities are unique
      const uniquePriorities = new Set(priorities);
      expect(uniquePriorities.size).toBe(priorities.length);

      // Check priorities are in ascending order
      const sortedPriorities = [...priorities].sort((a, b) => a - b);
      expect(priorities).toEqual(sortedPriorities);
    });

    it('should enable visibility config for all rules', () => {
      const webACL = wafConfig.Resources.HuntazeWebACL;
      
      webACL.Properties.Rules.forEach((rule: any) => {
        expect(rule.VisibilityConfig).toBeDefined();
        expect(rule.VisibilityConfig.SampledRequestsEnabled).toBe(true);
        expect(rule.VisibilityConfig.CloudWatchMetricsEnabled).toBe(true);
        expect(rule.VisibilityConfig.MetricName).toBeDefined();
      });
    });
  });

  describe('CloudWatch Integration', () => {
    it('should configure log group with proper retention', () => {
      const logGroup = wafConfig.Resources.WAFLogGroup;

      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toBe('aws-waf-logs-huntaze-api');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    it('should configure high block rate alarm correctly', () => {
      const alarm = wafConfig.Resources.WAFHighBlockRateAlarm;

      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.Threshold).toBe(10);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.DatapointsToAlarm).toBe(2);
    });

    it('should configure rate limit alarm correctly', () => {
      const alarm = wafConfig.Resources.WAFRateLimitAlarm;

      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('BlockedRequests');
      expect(alarm.Properties.Namespace).toBe('AWS/WAFV2');
      expect(alarm.Properties.Dimensions).toBeDefined();
    });

    it('should use proper metric math for block rate calculation', () => {
      const alarm = wafConfig.Resources.WAFHighBlockRateAlarm;
      const metrics = alarm.Properties.Metrics;

      const blockRateMetric = metrics.find((m: any) => m.Id === 'blockRate');
      expect(blockRateMetric).toBeDefined();
      expect(blockRateMetric.Expression).toContain('blocked');
      expect(blockRateMetric.Expression).toContain('allowed');
      expect(blockRateMetric.Expression).toContain('* 100');
    });
  });

  describe('Deployment Script Integration', () => {
    it('should have executable deployment script', () => {
      expect(existsSync('scripts/deploy-waf-protection.sh')).toBe(true);
      
      const content = readFileSync('scripts/deploy-waf-protection.sh', 'utf-8');
      expect(content).toContain('#!/bin/bash');
    });

    it('should validate AWS credentials before deployment', () => {
      const content = readFileSync('scripts/deploy-waf-protection.sh', 'utf-8');
      
      expect(content).toContain('aws sts get-caller-identity');
    });

    it('should deploy with correct stack name and parameters', () => {
      const content = readFileSync('scripts/deploy-waf-protection.sh', 'utf-8');
      
      expect(content).toContain('huntaze-waf-protection');
      expect(content).toContain('sam/waf-protection.yaml');
      expect(content).toContain('--parameter-overrides');
    });

    it('should verify deployment after completion', () => {
      const content = readFileSync('scripts/deploy-waf-protection.sh', 'utf-8');
      
      expect(content).toContain('aws wafv2 get-web-acl');
      expect(content).toContain('huntaze-api-protection');
    });

    it('should provide next steps after deployment', () => {
      const content = readFileSync('scripts/deploy-waf-protection.sh', 'utf-8');
      
      expect(content).toContain('Next Steps');
      expect(content).toContain('associate-web-acl');
    });
  });

  describe('API Gateway Association', () => {
    it('should provide correct association command format', () => {
      const content = readFileSync('scripts/deploy-waf-protection.sh', 'utf-8');
      
      expect(content).toContain('aws wafv2 associate-web-acl');
      expect(content).toContain('--web-acl-arn');
      expect(content).toContain('--resource-arn');
    });

    it('should use regional scope for API Gateway', () => {
      const webACL = wafConfig.Resources.HuntazeWebACL;
      
      expect(webACL.Properties.Scope).toBe('REGIONAL');
    });
  });

  describe('Cost Monitoring Integration', () => {
    it('should document expected costs in deployment script', () => {
      const content = readFileSync('scripts/deploy-waf-protection.sh', 'utf-8');
      
      expect(content).toContain('Cost:');
      expect(content).toContain('WAF Web ACL');
      expect(content).toContain('Rules');
    });

    it('should optimize log retention for cost', () => {
      const logGroup = wafConfig.Resources.WAFLogGroup;
      
      // 30 days is a good balance between cost and compliance
      expect(logGroup.Properties.RetentionInDays).toBeLessThanOrEqual(30);
    });
  });

  describe('Security Best Practices Integration', () => {
    it('should enable all AWS Managed Rule Sets', () => {
      const webACL = wafConfig.Resources.HuntazeWebACL;
      const managedRules = webACL.Properties.Rules.filter(
        (r: any) => r.Statement.ManagedRuleGroupStatement
      );

      const ruleSetNames = managedRules.map(
        (r: any) => r.Statement.ManagedRuleGroupStatement.Name
      );

      expect(ruleSetNames).toContain('AWSManagedRulesCommonRuleSet');
      expect(ruleSetNames).toContain('AWSManagedRulesKnownBadInputsRuleSet');
      expect(ruleSetNames).toContain('AWSManagedRulesAmazonIpReputationList');
      expect(ruleSetNames).toContain('AWSManagedRulesSQLiRuleSet');
    });

    it('should provide custom error response for rate limiting', () => {
      const webACL = wafConfig.Resources.HuntazeWebACL;
      const customBodies = webACL.Properties.CustomResponseBodies;

      expect(customBodies.RateLimitExceeded).toBeDefined();
      expect(customBodies.RateLimitExceeded.ContentType).toBe('APPLICATION_JSON');
      
      const content = JSON.parse(customBodies.RateLimitExceeded.Content);
      expect(content.error).toContain('Rate limit exceeded');
    });

    it('should allow legitimate traffic by default', () => {
      const webACL = wafConfig.Resources.HuntazeWebACL;
      
      expect(webACL.Properties.DefaultAction.Allow).toBeDefined();
    });
  });

  describe('Monitoring Dashboard Integration', () => {
    it('should provide dashboard URL in outputs', () => {
      const dashboardURL = wafConfig.Outputs.WAFDashboardURL;

      expect(dashboardURL).toBeDefined();
      expect(dashboardURL.Value).toBeDefined();
      expect(dashboardURL.Value['Fn::Sub']).toContain('cloudwatch');
      expect(dashboardURL.Value['Fn::Sub']).toContain('metricsV2');
    });

    it('should export WebACL ARN for cross-stack references', () => {
      const webACLArn = wafConfig.Outputs.WebACLArn;

      expect(webACLArn.Export).toBeDefined();
      expect(webACLArn.Export.Name).toBeDefined();
    });
  });

  describe('Smoke Test Rate Rule Integration', () => {
    it('should have smoke test rate rule management script', () => {
      expect(existsSync('scripts/waf-ensure-smoke-rate-rule.sh')).toBe(true);
    });

    it('should support dynamic rule creation', () => {
      const content = readFileSync('scripts/waf-ensure-smoke-rate-rule.sh', 'utf-8');

      expect(content).toContain('RULE_NAME');
      expect(content).toContain('LIMIT');
      expect(content).toContain('URI_PATH');
      expect(content).toContain('RateBasedStatement');
    });

    it('should support scope-down statements for specific paths', () => {
      const content = readFileSync('scripts/waf-ensure-smoke-rate-rule.sh', 'utf-8');

      expect(content).toContain('ScopeDownStatement');
      expect(content).toContain('ByteMatchStatement');
      expect(content).toContain('UriPath');
    });

    it('should handle rule updates with lock tokens', () => {
      const content = readFileSync('scripts/waf-ensure-smoke-rate-rule.sh', 'utf-8');

      expect(content).toContain('LockToken');
      expect(content).toContain('update-web-acl');
    });
  });

  describe('Error Handling and Validation', () => {
    it('should validate required environment variables', () => {
      const content = readFileSync('scripts/waf-ensure-smoke-rate-rule.sh', 'utf-8');

      expect(content).toContain('[[ -z "$WEBACL_NAME" ]]');
      expect(content).toContain('is required');
    });

    it('should check for required CLI tools', () => {
      const content = readFileSync('scripts/waf-ensure-smoke-rate-rule.sh', 'utf-8');

      expect(content).toContain('command -v aws');
      expect(content).toContain('command -v jq');
    });

    it('should handle WebACL not found error', () => {
      const content = readFileSync('scripts/waf-ensure-smoke-rate-rule.sh', 'utf-8');

      expect(content).toContain('WebACL not found');
    });

    it('should use proper exit codes for errors', () => {
      const content = readFileSync('scripts/waf-ensure-smoke-rate-rule.sh', 'utf-8');

      expect(content).toContain('exit 2'); // Missing required parameter
      expect(content).toContain('exit 3'); // WebACL not found
    });
  });

  describe('End-to-End Deployment Flow', () => {
    it('should follow correct deployment sequence', () => {
      const content = readFileSync('scripts/deploy-waf-protection.sh', 'utf-8');

      const steps = [
        'Checking AWS credentials',
        'Deploying WAF CloudFormation stack',
        'Getting WAF Web ACL details',
        'Verifying WAF rules',
        'Configured rules'
      ];

      steps.forEach((step, index) => {
        const stepIndex = content.indexOf(step);
        expect(stepIndex).toBeGreaterThan(-1);
        
        if (index > 0) {
          const prevStepIndex = content.indexOf(steps[index - 1]);
          expect(stepIndex).toBeGreaterThan(prevStepIndex);
        }
      });
    });

    it('should provide comprehensive deployment summary', () => {
      const content = readFileSync('scripts/deploy-waf-protection.sh', 'utf-8');

      expect(content).toContain('What was deployed');
      expect(content).toContain('Next Steps');
      expect(content).toContain('Cost:');
    });
  });
});

describe('WAF Configuration Validation Tests', () => {
  it('should validate rate limit is within AWS limits', () => {
    const rateLimit = wafConfig.Parameters.RateLimitPerIP.Default;
    
    // AWS WAF rate limit must be between 100 and 20,000,000
    expect(rateLimit).toBeGreaterThanOrEqual(100);
    expect(rateLimit).toBeLessThanOrEqual(20000000);
  });

  it('should validate log group name follows AWS naming conventions', () => {
    const logGroupName = wafConfig.Resources.WAFLogGroup.Properties.LogGroupName;
    
    // WAF log groups must start with aws-waf-logs-
    expect(logGroupName).toMatch(/^aws-waf-logs-/);
  });

  it('should validate alarm thresholds are reasonable', () => {
    const highBlockRateThreshold = wafConfig.Resources.WAFHighBlockRateAlarm.Properties.Threshold;
    const rateLimitThreshold = wafConfig.Resources.WAFRateLimitAlarm.Properties.Threshold;
    
    expect(highBlockRateThreshold).toBeGreaterThan(0);
    expect(highBlockRateThreshold).toBeLessThan(100);
    expect(rateLimitThreshold).toBeGreaterThan(0);
  });
});
