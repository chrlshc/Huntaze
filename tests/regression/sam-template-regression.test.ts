import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';

/**
 * Tests de régression pour sam/template.yaml
 * Garantit que les modifications futures ne cassent pas la configuration existante
 */

describe('SAM Template Regression Tests', () => {
  let template: any;
  let templateContent: string;

  beforeEach(() => {
    if (existsSync('sam/template.yaml')) {
      templateContent = readFileSync('sam/template.yaml', 'utf-8');
      template = parse(templateContent);
    }
  });

  describe('Critical Configuration Preservation', () => {
    it('should maintain Node.js 20 runtime', () => {
      expect(template.Globals.Function.Runtime).toBe('nodejs20.x');
    });

    it('should maintain production environment', () => {
      expect(template.Globals.Function.Environment.Variables.NODE_ENV).toBe('production');
    });

    it('should maintain X-Ray tracing', () => {
      expect(template.Globals.Function.Tracing).toBe('Active');
    });

    it('should maintain canary deployment type', () => {
      const deployment = template.Resources.MockReadFn.Properties.DeploymentPreference;
      expect(deployment.Type).toContain('Canary');
    });

    it('should maintain error rate threshold at 2%', () => {
      expect(template.Resources.ErrorRateAlarm.Properties.Threshold).toBe(0.02);
    });

    it('should maintain 7-day cleanup schedule', () => {
      expect(template.Resources.CleanupSchedule.Properties.ScheduleExpression).toContain('7 days');
    });
  });

  describe('Function Configuration Preservation', () => {
    it('should maintain mock function name', () => {
      expect(template.Resources.MockReadFn.Properties.FunctionName).toBe('huntaze-mock-read');
    });

    it('should maintain prisma function name', () => {
      expect(template.Resources.PrismaReadFn.Properties.FunctionName).toBe('huntaze-prisma-read');
    });

    it('should maintain cleanup function name', () => {
      expect(template.Resources.CleanupFn.Properties.FunctionName).toBe('huntaze-flag-cleanup');
    });

    it('should maintain handler references', () => {
      expect(template.Resources.MockReadFn.Properties.Handler).toBe('mock-handler.handler');
      expect(template.Resources.PrismaReadFn.Properties.Handler).toBe('prisma-handler.handler');
      expect(template.Resources.CleanupFn.Properties.Handler).toBe('cleanup-handler.handler');
    });

    it('should maintain auto-publish alias', () => {
      expect(template.Resources.MockReadFn.Properties.AutoPublishAlias).toBe('live');
    });
  });

  describe('AppConfig Configuration Preservation', () => {
    it('should maintain AppConfig application name', () => {
      expect(template.Resources.AppConfigApp.Properties.Name).toBe('huntaze-flags');
    });

    it('should maintain production environment', () => {
      expect(template.Resources.AppConfigEnv.Properties.Name).toBe('production');
    });

    it('should maintain feature flags profile type', () => {
      expect(template.Resources.AppConfigProfile.Properties.Type).toBe('AWS.AppConfig.FeatureFlags');
    });

    it('should maintain canary deployment strategy', () => {
      const strategy = template.Resources.AppConfigDeploymentStrategy;
      expect(strategy.Properties.Name).toContain('Canary');
      expect(strategy.Properties.DeploymentDurationInMinutes).toBe(5);
      expect(strategy.Properties.GrowthFactor).toBe(1);
    });
  });

  describe('IAM Permissions Preservation', () => {
    it('should maintain X-Ray permissions', () => {
      const functions = ['MockReadFn', 'PrismaReadFn', 'CleanupFn'];
      
      functions.forEach(fn => {
        const policies = template.Resources[fn].Properties.Policies;
        expect(policies).toContain('AWSXRayDaemonWriteAccess');
      });
    });

    it('should maintain AppConfig permissions for mock function', () => {
      const policies = template.Resources.MockReadFn.Properties.Policies;
      const statements = policies.find((p: any) => p.Statement)?.Statement || [];
      
      const appConfigStmt = statements.find((s: any) => 
        s.Action?.includes('appconfig:StartConfigurationSession')
      );
      
      expect(appConfigStmt).toBeDefined();
    });

    it('should maintain lambda invoke permissions', () => {
      const policies = template.Resources.MockReadFn.Properties.Policies;
      const statements = policies.find((p: any) => p.Statement)?.Statement || [];
      
      const invokeStmt = statements.find((s: any) => 
        s.Action === 'lambda:InvokeFunction'
      );
      
      expect(invokeStmt).toBeDefined();
    });

    it('should maintain secrets manager permissions', () => {
      const policies = template.Resources.PrismaReadFn.Properties.Policies;
      const statements = policies.find((p: any) => p.Statement)?.Statement || [];
      
      const secretsStmt = statements.find((s: any) => 
        s.Action === 'secretsmanager:GetSecretValue'
      );
      
      expect(secretsStmt).toBeDefined();
    });
  });

  describe('Monitoring Configuration Preservation', () => {
    it('should maintain error rate calculation', () => {
      const metrics = template.Resources.ErrorRateAlarm.Properties.Metrics;
      const errorRateMetric = metrics.find((m: any) => m.Id === 'errorRate');
      
      expect(errorRateMetric.Expression).toContain('errors');
      expect(errorRateMetric.Expression).toContain('invocations');
    });

    it('should maintain evaluation periods', () => {
      expect(template.Resources.ErrorRateAlarm.Properties.EvaluationPeriods).toBe(5);
    });

    it('should maintain datapoints to alarm', () => {
      expect(template.Resources.ErrorRateAlarm.Properties.DatapointsToAlarm).toBe(3);
    });

    it('should maintain dashboard structure', () => {
      const body = template.Resources.MonitoringDashboard.Properties.DashboardBody;
      expect(body).toContain('widgets');
      expect(body).toContain('Mock Lambda Metrics');
      expect(body).toContain('Prisma Lambda Metrics');
    });
  });

  describe('Security Configuration Preservation', () => {
    it('should not introduce hardcoded secrets', () => {
      const sensitivePatterns = [
        /password\s*[:=]\s*[^$\s{]+/i,
        /secret\s*[:=]\s*[^$\s{]+/i,
        /postgres:\/\/[^@]+:[^@]+@/,
        /AKIA[0-9A-Z]{16}/
      ];
      
      sensitivePatterns.forEach(pattern => {
        expect(templateContent).not.toMatch(pattern);
      });
    });

    it('should maintain secrets manager integration', () => {
      const env = template.Resources.PrismaReadFn.Properties.Environment.Variables;
      expect(env.DATABASE_URL).toContain('secretsmanager');
    });

    it('should maintain least privilege policies', () => {
      const functions = ['MockReadFn', 'PrismaReadFn', 'CleanupFn'];
      
      functions.forEach(fn => {
        const policies = template.Resources[fn].Properties.Policies;
        const statements = policies.find((p: any) => p.Statement)?.Statement || [];
        
        statements.forEach((stmt: any) => {
          expect(stmt.Effect).toBe('Allow');
          expect(stmt.Resource).toBeDefined();
        });
      });
    });
  });

  describe('Output Configuration Preservation', () => {
    it('should maintain all critical outputs', () => {
      const requiredOutputs = [
        'MockReadFnArn',
        'PrismaReadFnArn',
        'ErrorRateAlarmArn',
        'AppConfigAppId',
        'AppConfigEnvId',
        'AppConfigProfileId',
        'DashboardURL'
      ];
      
      requiredOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    it('should maintain export names', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        if (output.Export) {
          expect(output.Export.Name).toContain('${AWS::StackName}');
        }
      });
    });
  });

  describe('Resource Dependency Preservation', () => {
    it('should maintain AppConfig dependencies', () => {
      expect(template.Resources.AppConfigEnv.Properties.ApplicationId).toEqual({
        Ref: 'AppConfigApp'
      });
      
      expect(template.Resources.AppConfigProfile.Properties.ApplicationId).toEqual({
        Ref: 'AppConfigApp'
      });
    });

    it('should maintain candidate function reference', () => {
      const mockEnv = template.Resources.MockReadFn.Properties.Environment.Variables;
      expect(mockEnv.CANDIDATE_FN_ARN).toEqual({
        'Fn::GetAtt': ['PrismaReadFn', 'Arn']
      });
    });

    it('should maintain alarm reference in deployment', () => {
      const deployment = template.Resources.MockReadFn.Properties.DeploymentPreference;
      expect(deployment.Alarms).toContain({ Ref: 'ErrorRateAlarm' });
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain SAM transform version', () => {
      expect(template.Transform).toBe('AWS::Serverless-2016-10-31');
    });

    it('should maintain CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    it('should maintain parameter structure', () => {
      expect(template.Parameters.DatabaseSecretArn).toBeDefined();
      expect(template.Parameters.DatabaseSecretArn.Type).toBe('String');
    });

    it('should maintain global configuration structure', () => {
      expect(template.Globals.Function).toBeDefined();
      expect(template.Globals.Function.Runtime).toBeDefined();
      expect(template.Globals.Function.Environment).toBeDefined();
    });
  });

  describe('Performance Configuration Preservation', () => {
    it('should maintain memory size', () => {
      expect(template.Globals.Function.MemorySize).toBe(512);
    });

    it('should maintain timeout', () => {
      expect(template.Globals.Function.Timeout).toBe(30);
    });

    it('should maintain metric periods', () => {
      const metrics = template.Resources.ErrorRateAlarm.Properties.Metrics;
      metrics.forEach((metric: any) => {
        if (metric.MetricStat) {
          expect(metric.MetricStat.Period).toBe(60);
        }
      });
    });
  });

  describe('Naming Convention Preservation', () => {
    it('should maintain huntaze prefix for functions', () => {
      expect(template.Resources.MockReadFn.Properties.FunctionName).toMatch(/^huntaze-/);
      expect(template.Resources.PrismaReadFn.Properties.FunctionName).toMatch(/^huntaze-/);
      expect(template.Resources.CleanupFn.Properties.FunctionName).toMatch(/^huntaze-/);
    });

    it('should maintain dashboard naming', () => {
      expect(template.Resources.MonitoringDashboard.Properties.DashboardName).toContain('huntaze');
      expect(template.Resources.MonitoringDashboard.Properties.DashboardName).toContain('prisma');
    });

    it('should maintain alarm naming', () => {
      expect(template.Resources.ErrorRateAlarm.Properties.AlarmName).toContain('huntaze');
      expect(template.Resources.ErrorRateAlarm.Properties.AlarmName).toContain('error-rate');
    });
  });

  describe('Feature Flag Cleanup Preservation', () => {
    it('should maintain cleanup schedule configuration', () => {
      const schedule = template.Resources.CleanupSchedule;
      expect(schedule.Properties.Name).toContain('cleanup');
      expect(schedule.Properties.State).toBe('ENABLED');
    });

    it('should maintain cleanup function permissions', () => {
      const permission = template.Resources.CleanupFnPermission;
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });

    it('should maintain cleanup AppConfig permissions', () => {
      const policies = template.Resources.CleanupFn.Properties.Policies;
      const statements = policies.find((p: any) => p.Statement)?.Statement || [];
      
      const actions = statements.flatMap((s: any) => s.Action || []);
      expect(actions).toContain('appconfig:GetConfigurationProfile');
      expect(actions).toContain('appconfig:CreateHostedConfigurationVersion');
      expect(actions).toContain('appconfig:StartDeployment');
    });
  });

  describe('Canary Deployment Preservation', () => {
    it('should maintain deployment preference type', () => {
      const deployment = template.Resources.MockReadFn.Properties.DeploymentPreference;
      expect(deployment.Type).toBe('Canary10Percent5Minutes');
    });

    it('should maintain deployment strategy parameters', () => {
      const strategy = template.Resources.AppConfigDeploymentStrategy.Properties;
      expect(strategy.DeploymentDurationInMinutes).toBe(5);
      expect(strategy.GrowthFactor).toBe(1);
      expect(strategy.GrowthType).toBe('LINEAR');
      expect(strategy.FinalBakeTimeInMinutes).toBe(5);
    });
  });

  describe('CloudWatch Logs Preservation', () => {
    it('should maintain log group creation permissions', () => {
      const functions = ['MockReadFn', 'PrismaReadFn', 'CleanupFn'];
      
      functions.forEach(fn => {
        const policies = template.Resources[fn].Properties.Policies;
        const statements = policies.find((p: any) => p.Statement)?.Statement || [];
        
        const logsStmt = statements.find((s: any) => 
          s.Action === 'logs:CreateLogGroup'
        );
        
        expect(logsStmt).toBeDefined();
      });
    });

    it('should maintain log stream permissions', () => {
      const functions = ['MockReadFn', 'PrismaReadFn', 'CleanupFn'];
      
      functions.forEach(fn => {
        const policies = template.Resources[fn].Properties.Policies;
        const statements = policies.find((p: any) => p.Statement)?.Statement || [];
        
        const streamStmt = statements.find((s: any) => 
          s.Action?.includes('logs:CreateLogStream')
        );
        
        expect(streamStmt).toBeDefined();
      });
    });
  });

  describe('Template Structure Preservation', () => {
    it('should maintain all required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Transform).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Globals).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    it('should maintain resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(10); // Minimum expected resources
    });

    it('should maintain output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(7); // All critical outputs
    });
  });
});

  describe('Parameter Regression Tests', () => {
    it('should not break existing database secret parameter', () => {
      expect(template.Parameters.DatabaseSecretArn).toBeDefined();
      expect(template.Parameters.DatabaseSecretArn.Type).toBe('String');
      expect(template.Parameters.DatabaseSecretArn.Default).toMatch(/^arn:aws:secretsmanager:/);
    });

    it('should maintain parameter count within CloudFormation limits', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBeLessThanOrEqual(60); // CloudFormation limit
      expect(paramCount).toBeGreaterThan(0);
    });

    it('should have cost anomaly monitor parameter without breaking existing params', () => {
      // Verify new parameter exists
      expect(template.Parameters.CostAnomalyMonitorArn).toBeDefined();
      
      // Verify existing parameters still work
      expect(template.Parameters.DatabaseSecretArn).toBeDefined();
      expect(template.Parameters.Environment).toBeDefined();
    });

    it('should maintain all parameter types as String', () => {
      Object.values(template.Parameters).forEach((param: any) => {
        expect(param.Type).toBe('String');
      });
    });

    it('should have descriptions for all parameters', () => {
      Object.values(template.Parameters).forEach((param: any) => {
        expect(param.Description).toBeDefined();
        expect(param.Description.length).toBeGreaterThan(5);
      });
    });

    it('should maintain default values for optional parameters', () => {
      expect(template.Parameters.DatabaseSecretArn.Default).toBeDefined();
      expect(template.Parameters.CostAnomalyMonitorArn.Default).toBeDefined();
    });
  });

  describe('Cost Monitoring Integration Regression', () => {
    it('should have valid cost anomaly monitor ARN format', () => {
      const arn = template.Parameters.CostAnomalyMonitorArn.Default;
      expect(arn).toMatch(/^arn:aws:ce::[0-9]{12}:anomalymonitor\/[a-f0-9-]+$/);
    });

    it('should reference correct AWS account', () => {
      const arn = template.Parameters.CostAnomalyMonitorArn.Default;
      expect(arn).toContain('317805897534');
    });

    it('should not introduce hardcoded sensitive data', () => {
      const sensitivePatterns = [
        /password\s*[:=]\s*[^$\s{]+/i,
        /secret\s*[:=]\s*[^$\s{]+/i,
        /AKIA[0-9A-Z]{16}/
      ];
      
      sensitivePatterns.forEach(pattern => {
        expect(templateContent).not.toMatch(pattern);
      });
    });

    it('should maintain template size within limits', () => {
      // CloudFormation template size limit is 51,200 bytes
      const templateSize = Buffer.byteLength(templateContent, 'utf8');
      expect(templateSize).toBeLessThan(51200);
    });
  });

  describe('Resource Reference Integrity', () => {
    it('should not break existing resource references', () => {
      // Verify that functions still reference correct resources
      const mockEnv = template.Resources.MockReadFn.Properties.Environment.Variables;
      expect(mockEnv.APP_ID).toBeDefined();
      expect(mockEnv.ENV_ID).toBeDefined();
      expect(mockEnv.FEATURES_PROFILE_ID).toBeDefined();
    });

    it('should maintain alarm references in deployment preference', () => {
      const deployment = template.Resources.MockReadFn.Properties.DeploymentPreference;
      expect(deployment.Alarms).toContain('!Ref ErrorRateAlarm');
    });

    it('should maintain secrets manager references', () => {
      const prismaEnv = template.Resources.PrismaReadFn.Properties.Environment.Variables;
      expect(prismaEnv.DATABASE_URL).toContain('secretsmanager');
      expect(prismaEnv.DATABASE_URL).toContain('!Ref DatabaseSecretArn');
    });
  });

  describe('Template Structure Integrity', () => {
    it('should maintain valid YAML structure', () => {
      expect(() => parse(templateContent)).not.toThrow();
    });

    it('should maintain required top-level keys', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Transform).toBe('AWS::Serverless-2016-10-31');
      expect(template.Description).toBeDefined();
      expect(template.Globals).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    it('should not introduce syntax errors', () => {
      // Verify no common YAML syntax errors
      expect(templateContent).not.toContain('<<:'); // Merge keys not supported in CloudFormation
      expect(templateContent).not.toMatch(/\t/); // No tabs
    });
  });
