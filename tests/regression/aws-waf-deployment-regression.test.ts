import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';

/**
 * Tests de régression pour le déploiement WAF
 * Garantit que les modifications futures ne cassent pas la configuration WAF existante
 * Basé sur la tâche 3 de aws-security-cost-optimization
 */

describe('WAF Deployment Regression Tests', () => {
  let wafConfig: any;
  let wafContent: string;

  beforeEach(() => {
    if (existsSync('sam/waf-protection.yaml')) {
      wafContent = readFileSync('sam/waf-protection.yaml', 'utf-8');
      wafConfig = parse(wafContent);
    }
  });

  describe('Critical Configuration Preservation', () => {
    it('should maintain rate limit of 2000 requests per 5 minutes', () => {
      const rateLimitParam = wafConfig.Parameters?.RateLimitPerIP;
      expect(rateLimitParam).toBeDefined();
      expect(rateLimitParam.Default).toBe(2000);
    });

    it('should maintain regional scope for API Gateway', () => {
      const webACL = wafConfig.Resources?.HuntazeWebACL;
      expect(webACL).toBeDefined();
      expect(webACL.Properties.Scope).toBe('REGIONAL');
    });

    it('should maintain all 5 core WAF rules', () => {
      const webACL = wafConfig.Resources?.HuntazeWebACL;
      const rules = webACL?.Properties?.Rules || [];
      
      expect(rules.length).toBeGreaterThanOrEqual(5);
      
      // Verify core rules exist
      const ruleNames = rules.map((r: any) => r.Name);
      expect(ruleNames).toContain('RateLimitRule');
      expect(ruleNames).toContain('AWSManagedRulesCommonRuleSet');
      expect(ruleNames).toContain('AWSManagedRulesKnownBadInputsRuleSet');
      expect(ruleNames).toContain('AWSManagedRulesAmazonIpReputationList');
      expect(ruleNames).toContain('AWSManagedRulesSQLiRuleSet');
    });

    it('should maintain correct rule priorities', () => {
      const webACL = wafConfig.Resources?.HuntazeWebACL;
      const rules = webACL?.Properties?.Rules || [];
      
      const priorityMap: Record<string, number> = {};
      rules.forEach((rule: any) => {
        priorityMap[rule.Name] = rule.Priority;
      });
      
      expect(priorityMap['RateLimitRule']).toBe(10);
      expect(priorityMap['AWSManagedRulesCommonRuleSet']).toBe(20);
      expect(priorityMap['AWSManagedRulesKnownBadInputsRuleSet']).toBe(30);
      expect(priorityMap['AWSManagedRulesAmazonIpReputationList']).toBe(40);
      expect(priorityMap['AWSManagedRulesSQLiRuleSet']).toBe(50);
    });

    it('should maintain CloudWatch metrics enabled for all rules', () => {
      const webACL = wafConfig.Resources?.HuntazeWebACL;
      const rules = webACL?.Properties?.Rules || [];
      
      rules.forEach((rule: any) => {
        expect(rule.VisibilityConfig).toBeDefined();
        expect(rule.VisibilityConfig.CloudWatchMetricsEnabled).toBe(true);
        expect(rule.VisibilityConfig.SampledRequestsEnabled).toBe(true);
      });
    });
  });

  describe('Rate Limiting Configuration Preservation', () => {
    it('should maintain rate limit rule configuration', () => {
      const webACL = wafConfig.Resources?.HuntazeWebACL;
      const rateLimitRule = webACL?.Properties?.Rules?.find(
        (r: any) => r.Name === 'RateLimitRule'
      );
      
      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule.Statement.RateBasedStatement).toBeDefined();
      expect(rateLimitRule.Statement.RateBasedStatement.AggregateKeyType).toBe('IP');
    });

    it('should maintain custom 429 response for rate limiting', () => {
      const webACL = wafConfig.Resources?.HuntazeWebACL;
      const rateLimitRule = webACL?.Properties?.Rules?.find(
        (r: any) => r.Name === 'RateLimitRule'
      );
      
      expect(rateLimitRule.Action.Block).toBeDefined();
      expect(rateLimitRule.Action.Block.CustomResponse).toBeDefined();
      expect(rateLimitRule.Action.Block.CustomResponse.ResponseCode).toBe(429);
    });

    it('should maintain custom response body for rate limit', () => {
      const webACL = wafConfig.Resources?.HuntazeWebACL;
      const customBodies = webACL?.Properties?.CustomResponseBodies;
      
      expect(customBodies).toBeDefined();
      expect(customBodies.RateLimitExceeded).toBeDefined();
      expect(customBodies.RateLimitExceeded.ContentType).toBe('APPLICATION_JSON');
      expect(customBodies.RateLimitExceeded.Content).toContain('Rate limit exceeded');
    });
  });

  describe('AWS Managed Rules Preservation', () => {
    it('should maintain Core Rule Set configuration', () => {
      const webACL = wafConfig.Resources?.HuntazeWebACL;
      const coreRuleSet = webACL?.Properties?.Rules?.find(
        (r: any) => r.Name === 'AWSManagedRulesCommonRuleSet'
      );
      
      expect(coreRuleSet).toBeDefined();
      expect(coreRuleSet.Statement.ManagedRuleGroupStatement).toBeDefined();
      expect(coreRuleSet.Statement.ManagedRuleGroupStatement.VendorName).toBe('AWS');
      expect(coreRuleSet.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesCommonRuleSet');
    });

    it('should maintain Known Bad Inputs rule', () => {
      const webACL = wafConfig.Resources?.HuntazeWebACL;
      const knownBadInputs = webACL?.Properties?.Rules?.find(
        (r: any) => r.Name === 'AWSManagedRulesKnownBadInputsRuleSet'
      );
      
      expect(knownBadInputs).toBeDefined();
      expect(knownBadInputs.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesKnownBadInputsRuleSet');
    });

    it('should maintain IP Reputation List rule', () => {
      const webACL = wafConfig.Resources?.HuntazeWebACL;
      const ipReputation = webACL?.Properties?.Rules?.find(
        (r: any) => r.Name === 'AWSManagedRulesAmazonIpReputationList'
      );
      
      expect(ipReputation).toBeDefined();
      expect(ipReputation.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesAmazonIpReputationList');
    });

    it('should maintain SQL Injection protection rule', () => {
      const webACL = wafConfig.Resources?.HuntazeWebACL;
      const sqlInjection = webACL?.Properties?.Rules?.find(
        (r: any) => r.Name === 'AWSManagedRulesSQLiRuleSet'
      );
      
      expect(sqlInjection).toBeDefined();
      expect(sqlInjection.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesSQLiRuleSet');
    });
  });

  describe('Monitoring and Alarms Preservation', () => {
    it('should maintain high block rate alarm', () => {
      const alarm = wafConfig.Resources?.WAFHighBlockRateAlarm;
      
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.Threshold).toBe(10);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    it('should maintain rate limit trigger alarm', () => {
      const alarm = wafConfig.Resources?.WAFRateLimitAlarm;
      
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('BlockedRequests');
    });

    it('should maintain WAF log group configuration', () => {
      const logGroup = wafConfig.Resources?.WAFLogGroup;
      
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toBe('aws-waf-logs-huntaze-api');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    it('should maintain block rate calculation formula', () => {
      const alarm = wafConfig.Resources?.WAFHighBlockRateAlarm;
      const metrics = alarm?.Properties?.Metrics;
      
      expect(metrics).toBeDefined();
      const blockRateMetric = metrics?.find((m: any) => m.Id === 'blockRate');
      expect(blockRateMetric).toBeDefined();
      expect(blockRateMetric.Expression).toContain('blocked');
      expect(blockRateMetric.Expression).toContain('allowed');
    });
  });

  describe('Outputs Preservation', () => {
    it('should maintain WebACL ARN output', () => {
      const outputs = wafConfig.Outputs;
      
      expect(outputs.WebACLArn).toBeDefined();
      expect(outputs.WebACLArn.Description).toContain('ARN');
    });

    it('should maintain WebACL ID output', () => {
      const outputs = wafConfig.Outputs;
      
      expect(outputs.WebACLId).toBeDefined();
      expect(outputs.WebACLId.Description).toContain('ID');
    });

    it('should maintain log group name output', () => {
      const outputs = wafConfig.Outputs;
      
      expect(outputs.WAFLogGroupName).toBeDefined();
      expect(outputs.WAFLogGroupName.Description).toContain('Log Group');
    });

    it('should maintain dashboard URL output', () => {
      const outputs = wafConfig.Outputs;
      
      expect(outputs.WAFDashboardURL).toBeDefined();
      expect(outputs.WAFDashboardURL.Description).toContain('dashboard');
    });
  });

  describe('Deployment Script Preservation', () => {
    it('should maintain deployment script existence', () => {
      expect(existsSync('scripts/deploy-waf-protection.sh')).toBe(true);
    });

    it('should maintain deployment script executability', () => {
      if (existsSync('scripts/deploy-waf-protection.sh')) {
        const content = readFileSync('scripts/deploy-waf-protection.sh', 'utf-8');
        expect(content).toContain('#!/bin/bash');
        expect(content).toContain('aws cloudformation deploy');
      }
    });

    it('should maintain correct stack name in deployment script', () => {
      if (existsSync('scripts/deploy-waf-protection.sh')) {
        const content = readFileSync('scripts/deploy-waf-protection.sh', 'utf-8');
        expect(content).toContain('huntaze-waf-protection');
      }
    });

    it('should maintain WAF verification steps', () => {
      if (existsSync('scripts/deploy-waf-protection.sh')) {
        const content = readFileSync('scripts/deploy-waf-protection.sh', 'utf-8');
        expect(content).toContain('aws wafv2 get-web-acl');
        expect(content).toContain('huntaze-api-protection');
      }
    });
  });

  describe('Security Best Practices Preservation', () => {
    it('should not introduce hardcoded secrets', () => {
      const sensitivePatterns = [
        /password\s*[:=]\s*[^$\s]+/i,
        /secret\s*[:=]\s*[^$\s]+/i,
        /api[_-]?key\s*[:=]\s*[^$\s]+/i,
        /AKIA[0-9A-Z]{16}/
      ];
      
      sensitivePatterns.forEach(pattern => {
        expect(wafContent).not.toMatch(pattern);
      });
    });

    it('should maintain default ALLOW action for non-matching requests', () => {
      const webACL = wafConfig.Resources?.HuntazeWebACL;
      
      expect(webACL.Properties.DefaultAction).toBeDefined();
      expect(webACL.Properties.DefaultAction.Allow).toBeDefined();
    });

    it('should maintain sampled requests for forensics', () => {
      const webACL = wafConfig.Resources?.HuntazeWebACL;
      
      expect(webACL.Properties.VisibilityConfig.SampledRequestsEnabled).toBe(true);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with existing API Gateway', () => {
      const webACL = wafConfig.Resources?.HuntazeWebACL;
      
      // Regional scope is required for API Gateway
      expect(webACL.Properties.Scope).toBe('REGIONAL');
    });

    it('should maintain parameter structure for customization', () => {
      const params = wafConfig.Parameters;
      
      expect(params.Environment).toBeDefined();
      expect(params.RateLimitPerIP).toBeDefined();
      expect(params.Environment.AllowedValues).toContain('production');
    });

    it('should maintain CloudFormation template version', () => {
      expect(wafConfig.AWSTemplateFormatVersion).toBe('2010-09-09');
    });
  });

  describe('Cost Optimization Preservation', () => {
    it('should maintain 30-day log retention to control costs', () => {
      const logGroup = wafConfig.Resources?.WAFLogGroup;
      
      expect(logGroup.Properties.RetentionInDays).toBe(30);
      expect(logGroup.Properties.RetentionInDays).toBeLessThanOrEqual(30);
    });

    it('should not introduce unnecessary rules that increase costs', () => {
      const webACL = wafConfig.Resources?.HuntazeWebACL;
      const rules = webACL?.Properties?.Rules || [];
      
      // Should have exactly 5 rules (as per spec)
      expect(rules.length).toBe(5);
    });
  });
});

describe('WAF Management Script Regression Tests', () => {
  it('should maintain smoke test rate rule script', () => {
    expect(existsSync('scripts/waf-ensure-smoke-rate-rule.sh')).toBe(true);
  });

  it('should maintain script configuration variables', () => {
    if (existsSync('scripts/waf-ensure-smoke-rate-rule.sh')) {
      const content = readFileSync('scripts/waf-ensure-smoke-rate-rule.sh', 'utf-8');
      
      expect(content).toContain('WEBACL_NAME');
      expect(content).toContain('SCOPE');
      expect(content).toContain('LIMIT');
      expect(content).toContain('URI_PATH');
    }
  });

  it('should maintain jq dependency for JSON parsing', () => {
    if (existsSync('scripts/waf-ensure-smoke-rate-rule.sh')) {
      const content = readFileSync('scripts/waf-ensure-smoke-rate-rule.sh', 'utf-8');
      
      expect(content).toContain('command -v jq');
    }
  });
});
