import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';

/**
 * Tests de validation pour sam/template.yaml
 * Valide la configuration AWS SAM pour le déploiement canary Prisma
 */

describe('SAM Template Validation', () => {
  let templateContent: string;
  let template: any;

  beforeEach(() => {
    if (existsSync('sam/template.yaml')) {
      templateContent = readFileSync('sam/template.yaml', 'utf-8');
      template = parse(templateContent);
    }
  });

  describe('Template Structure', () => {
    it('should have valid SAM template', () => {
      expect(existsSync('sam/template.yaml')).toBe(true);
      expect(template).toBeDefined();
    });

    it('should have correct template format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    it('should have SAM transform', () => {
      expect(template.Transform).toBe('AWS::Serverless-2016-10-31');
    });

    it('should have descriptive description', () => {
      expect(template.Description).toContain('Huntaze');
      expect(template.Description).toContain('Prisma');
      expect(template.Description).toContain('Canary');
    });
  });

  describe('Global Configuration', () => {
    it('should define global function settings', () => {
      expect(template.Globals).toBeDefined();
      expect(template.Globals.Function).toBeDefined();
    });

    it('should use Node.js 20 runtime', () => {
      expect(template.Globals.Function.Runtime).toBe('nodejs20.x');
    });

    it('should have reasonable timeout', () => {
      const timeout = template.Globals.Function.Timeout;
      expect(timeout).toBeGreaterThanOrEqual(10);
      expect(timeout).toBeLessThanOrEqual(60);
    });

    it('should enable X-Ray tracing', () => {
      expect(template.Globals.Function.Tracing).toBe('Active');
    });

    it('should have appropriate memory size', () => {
      const memory = template.Globals.Function.MemorySize;
      expect(memory).toBeGreaterThanOrEqual(256);
      expect(memory).toBeLessThanOrEqual(1024);
    });

    it('should set production environment', () => {
      expect(template.Globals.Function.Environment.Variables.NODE_ENV).toBe('production');
    });

    it('should reference AppConfig resources', () => {
      const env = template.Globals.Function.Environment.Variables;
      expect(env.APP_ID).toBeDefined();
      expect(env.ENV_ID).toBeDefined();
      expect(env.FEATURES_PROFILE_ID).toBeDefined();
    });
  });

  describe('Parameters', () => {
    it('should define database secret parameter', () => {
      expect(template.Parameters.DatabaseSecretArn).toBeDefined();
      expect(template.Parameters.DatabaseSecretArn.Type).toBe('String');
    });

    it('should have valid default secret ARN format', () => {
      const defaultArn = template.Parameters.DatabaseSecretArn.Default;
      expect(defaultArn).toMatch(/^arn:aws:secretsmanager:/);
      expect(defaultArn).toContain('huntaze/database');
    });

    it('should define cost anomaly monitor parameter', () => {
      expect(template.Parameters.CostAnomalyMonitorArn).toBeDefined();
      expect(template.Parameters.CostAnomalyMonitorArn.Type).toBe('String');
      expect(template.Parameters.CostAnomalyMonitorArn.Description).toBeDefined();
    });

    it('should have valid cost anomaly monitor ARN format', () => {
      const arnPattern = /^arn:aws:ce::[0-9]{12}:anomalymonitor\/[a-f0-9-]+$/;
      const defaultArn = template.Parameters.CostAnomalyMonitorArn.Default;
      expect(defaultArn).toMatch(arnPattern);
    });

    it('should reference correct AWS account in cost anomaly monitor ARN', () => {
      const arn = template.Parameters.CostAnomalyMonitorArn.Default;
      expect(arn).toContain('317805897534');
    });

    it('should have valid UUID in cost anomaly monitor ARN', () => {
      const arn = template.Parameters.CostAnomalyMonitorArn.Default;
      const uuidPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/;
      expect(arn).toMatch(uuidPattern);
    });

    it('should have description for cost anomaly monitor parameter', () => {
      const description = template.Parameters.CostAnomalyMonitorArn.Description;
      expect(description).toContain('Cost Anomaly Monitor');
      expect(description.length).toBeGreaterThan(10);
    });
  });

  describe('AppConfig Resources', () => {
    it('should define AppConfig application', () => {
      expect(template.Resources.AppConfigApp).toBeDefined();
      expect(template.Resources.AppConfigApp.Type).toBe('AWS::AppConfig::Application');
    });

    it('should define AppConfig environment', () => {
      expect(template.Resources.AppConfigEnv).toBeDefined();
      expect(template.Resources.AppConfigEnv.Type).toBe('AWS::AppConfig::Environment');
      expect(template.Resources.AppConfigEnv.Properties.Name).toBe('production');
    });

    it('should define feature flags configuration profile', () => {
      expect(template.Resources.AppConfigProfile).toBeDefined();
      expect(template.Resources.AppConfigProfile.Type).toBe('AWS::AppConfig::ConfigurationProfile');
      expect(template.Resources.AppConfigProfile.Properties.Type).toBe('AWS.AppConfig.FeatureFlags');
    });

    it('should define canary deployment strategy', () => {
      const strategy = template.Resources.AppConfigDeploymentStrategy;
      expect(strategy).toBeDefined();
      expect(strategy.Type).toBe('AWS::AppConfig::DeploymentStrategy');
      expect(strategy.Properties.Name).toContain('Canary');
    });

    it('should have appropriate deployment duration', () => {
      const strategy = template.Resources.AppConfigDeploymentStrategy;
      const duration = strategy.Properties.DeploymentDurationInMinutes;
      expect(duration).toBeGreaterThanOrEqual(5);
      expect(duration).toBeLessThanOrEqual(30);
    });

    it('should have bake time configured', () => {
      const strategy = template.Resources.AppConfigDeploymentStrategy;
      expect(strategy.Properties.FinalBakeTimeInMinutes).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Lambda Functions', () => {
    describe('Mock Read Function', () => {
      it('should define mock read lambda', () => {
        expect(template.Resources.MockReadFn).toBeDefined();
        expect(template.Resources.MockReadFn.Type).toBe('AWS::Serverless::Function');
      });

      it('should have correct function name', () => {
        expect(template.Resources.MockReadFn.Properties.FunctionName).toBe('huntaze-mock-read');
      });

      it('should reference correct handler', () => {
        expect(template.Resources.MockReadFn.Properties.Handler).toBe('mock-handler.handler');
      });

      it('should have auto-publish alias', () => {
        expect(template.Resources.MockReadFn.Properties.AutoPublishAlias).toBe('live');
      });

      it('should have canary deployment preference', () => {
        const deployment = template.Resources.MockReadFn.Properties.DeploymentPreference;
        expect(deployment).toBeDefined();
        expect(deployment.Type).toContain('Canary');
      });

      it('should reference error rate alarm', () => {
        const deployment = template.Resources.MockReadFn.Properties.DeploymentPreference;
        expect(deployment.Alarms).toContain('!Ref ErrorRateAlarm');
      });

      it('should have candidate function ARN in environment', () => {
        const env = template.Resources.MockReadFn.Properties.Environment.Variables;
        expect(env.CANDIDATE_FN_ARN).toBeDefined();
      });

      it('should have necessary IAM policies', () => {
        const policies = template.Resources.MockReadFn.Properties.Policies;
        expect(policies).toBeDefined();
        expect(Array.isArray(policies)).toBe(true);
      });

      it('should have X-Ray write access', () => {
        const policies = template.Resources.MockReadFn.Properties.Policies;
        expect(policies).toContain('AWSXRayDaemonWriteAccess');
      });

      it('should have AppConfig permissions', () => {
        const statements = template.Resources.MockReadFn.Properties.Policies
          .find((p: any) => p.Statement)?.Statement || [];
        
        const appConfigStmt = statements.find((s: any) => 
          s.Action?.includes('appconfig:StartConfigurationSession')
        );
        expect(appConfigStmt).toBeDefined();
      });

      it('should have lambda invoke permissions', () => {
        const statements = template.Resources.MockReadFn.Properties.Policies
          .find((p: any) => p.Statement)?.Statement || [];
        
        const invokeStmt = statements.find((s: any) => 
          s.Action?.includes('lambda:InvokeFunction')
        );
        expect(invokeStmt).toBeDefined();
      });

      it('should have CloudWatch Logs permissions', () => {
        const statements = template.Resources.MockReadFn.Properties.Policies
          .find((p: any) => p.Statement)?.Statement || [];
        
        const logsStmt = statements.find((s: any) => 
          s.Action?.includes('logs:CreateLogGroup')
        );
        expect(logsStmt).toBeDefined();
      });
    });

    describe('Prisma Read Function', () => {
      it('should define prisma read lambda', () => {
        expect(template.Resources.PrismaReadFn).toBeDefined();
        expect(template.Resources.PrismaReadFn.Type).toBe('AWS::Serverless::Function');
      });

      it('should have correct function name', () => {
        expect(template.Resources.PrismaReadFn.Properties.FunctionName).toBe('huntaze-prisma-read');
      });

      it('should reference correct handler', () => {
        expect(template.Resources.PrismaReadFn.Properties.Handler).toBe('prisma-handler.handler');
      });

      it('should have database URL from secrets manager', () => {
        const env = template.Resources.PrismaReadFn.Properties.Environment.Variables;
        expect(env.DATABASE_URL).toBeDefined();
        expect(env.DATABASE_URL).toContain('secretsmanager');
      });

      it('should have secrets manager permissions', () => {
        const statements = template.Resources.PrismaReadFn.Properties.Policies
          .find((p: any) => p.Statement)?.Statement || [];
        
        const secretsStmt = statements.find((s: any) => 
          s.Action?.includes('secretsmanager:GetSecretValue')
        );
        expect(secretsStmt).toBeDefined();
      });

      it('should have X-Ray write access', () => {
        const policies = template.Resources.PrismaReadFn.Properties.Policies;
        expect(policies).toContain('AWSXRayDaemonWriteAccess');
      });
    });

    describe('Cleanup Function', () => {
      it('should define cleanup lambda', () => {
        expect(template.Resources.CleanupFn).toBeDefined();
        expect(template.Resources.CleanupFn.Type).toBe('AWS::Serverless::Function');
      });

      it('should have correct function name', () => {
        expect(template.Resources.CleanupFn.Properties.FunctionName).toBe('huntaze-flag-cleanup');
      });

      it('should reference correct handler', () => {
        expect(template.Resources.CleanupFn.Properties.Handler).toBe('cleanup-handler.handler');
      });

      it('should have AppConfig permissions', () => {
        const statements = template.Resources.CleanupFn.Properties.Policies
          .find((p: any) => p.Statement)?.Statement || [];
        
        const appConfigStmt = statements.find((s: any) => 
          s.Action?.includes('appconfig:GetConfigurationProfile')
        );
        expect(appConfigStmt).toBeDefined();
      });
    });
  });

  describe('CloudWatch Alarm', () => {
    it('should define error rate alarm', () => {
      expect(template.Resources.ErrorRateAlarm).toBeDefined();
      expect(template.Resources.ErrorRateAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    it('should have descriptive alarm name', () => {
      const name = template.Resources.ErrorRateAlarm.Properties.AlarmName;
      expect(name).toContain('error-rate');
      expect(name).toContain('huntaze');
    });

    it('should have appropriate threshold', () => {
      const threshold = template.Resources.ErrorRateAlarm.Properties.Threshold;
      expect(threshold).toBe(0.02); // 2%
    });

    it('should have reasonable evaluation periods', () => {
      const periods = template.Resources.ErrorRateAlarm.Properties.EvaluationPeriods;
      expect(periods).toBeGreaterThanOrEqual(3);
      expect(periods).toBeLessThanOrEqual(10);
    });

    it('should require multiple datapoints to alarm', () => {
      const datapoints = template.Resources.ErrorRateAlarm.Properties.DatapointsToAlarm;
      expect(datapoints).toBeGreaterThanOrEqual(2);
    });

    it('should treat missing data appropriately', () => {
      expect(template.Resources.ErrorRateAlarm.Properties.TreatMissingData).toBe('notBreaching');
    });

    it('should calculate error rate correctly', () => {
      const metrics = template.Resources.ErrorRateAlarm.Properties.Metrics;
      expect(metrics).toBeDefined();
      expect(Array.isArray(metrics)).toBe(true);
      
      const errorRateMetric = metrics.find((m: any) => m.Id === 'errorRate');
      expect(errorRateMetric).toBeDefined();
      expect(errorRateMetric.Expression).toContain('errors');
      expect(errorRateMetric.Expression).toContain('invocations');
    });

    it('should monitor errors metric', () => {
      const metrics = template.Resources.ErrorRateAlarm.Properties.Metrics;
      const errorsMetric = metrics.find((m: any) => m.Id === 'errors');
      
      expect(errorsMetric).toBeDefined();
      expect(errorsMetric.MetricStat.Metric.MetricName).toBe('Errors');
      expect(errorsMetric.MetricStat.Metric.Namespace).toBe('AWS/Lambda');
    });

    it('should monitor invocations metric', () => {
      const metrics = template.Resources.ErrorRateAlarm.Properties.Metrics;
      const invocationsMetric = metrics.find((m: any) => m.Id === 'invocations');
      
      expect(invocationsMetric).toBeDefined();
      expect(invocationsMetric.MetricStat.Metric.MetricName).toBe('Invocations');
    });
  });

  describe('EventBridge Schedule', () => {
    it('should define cleanup schedule', () => {
      expect(template.Resources.CleanupSchedule).toBeDefined();
      expect(template.Resources.CleanupSchedule.Type).toBe('AWS::Events::Rule');
    });

    it('should have descriptive schedule name', () => {
      const name = template.Resources.CleanupSchedule.Properties.Name;
      expect(name).toContain('cleanup');
      expect(name).toContain('7days');
    });

    it('should run every 7 days', () => {
      const expression = template.Resources.CleanupSchedule.Properties.ScheduleExpression;
      expect(expression).toContain('rate(7 days)');
    });

    it('should be enabled by default', () => {
      expect(template.Resources.CleanupSchedule.Properties.State).toBe('ENABLED');
    });

    it('should target cleanup function', () => {
      const targets = template.Resources.CleanupSchedule.Properties.Targets;
      expect(targets).toBeDefined();
      expect(Array.isArray(targets)).toBe(true);
      expect(targets.length).toBeGreaterThan(0);
    });

    it('should have lambda permission', () => {
      expect(template.Resources.CleanupFnPermission).toBeDefined();
      expect(template.Resources.CleanupFnPermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should define monitoring dashboard', () => {
      expect(template.Resources.MonitoringDashboard).toBeDefined();
      expect(template.Resources.MonitoringDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    it('should have descriptive dashboard name', () => {
      const name = template.Resources.MonitoringDashboard.Properties.DashboardName;
      expect(name).toContain('huntaze');
      expect(name).toContain('prisma');
    });

    it('should have valid dashboard body', () => {
      const body = template.Resources.MonitoringDashboard.Properties.DashboardBody;
      expect(body).toBeDefined();
      
      // Should be valid JSON when substituted
      expect(body).toContain('widgets');
    });

    it('should monitor mock lambda metrics', () => {
      const body = template.Resources.MonitoringDashboard.Properties.DashboardBody;
      expect(body).toContain('Mock Lambda Metrics');
      expect(body).toContain('Mock Invocations');
      expect(body).toContain('Mock Errors');
      expect(body).toContain('Mock Latency');
    });

    it('should monitor prisma lambda metrics', () => {
      const body = template.Resources.MonitoringDashboard.Properties.DashboardBody;
      expect(body).toContain('Prisma Lambda Metrics');
      expect(body).toContain('Prisma Invocations');
      expect(body).toContain('Prisma Errors');
      expect(body).toContain('Prisma Latency');
    });

    it('should include p95 latency metrics', () => {
      const body = template.Resources.MonitoringDashboard.Properties.DashboardBody;
      expect(body).toContain('p95');
    });
  });

  describe('Outputs', () => {
    it('should export mock function ARN', () => {
      expect(template.Outputs.MockReadFnArn).toBeDefined();
      expect(template.Outputs.MockReadFnArn.Export).toBeDefined();
    });

    it('should export prisma function ARN', () => {
      expect(template.Outputs.PrismaReadFnArn).toBeDefined();
      expect(template.Outputs.PrismaReadFnArn.Export).toBeDefined();
    });

    it('should export error rate alarm ARN', () => {
      expect(template.Outputs.ErrorRateAlarmArn).toBeDefined();
      expect(template.Outputs.ErrorRateAlarmArn.Export).toBeDefined();
    });

    it('should export AppConfig IDs', () => {
      expect(template.Outputs.AppConfigAppId).toBeDefined();
      expect(template.Outputs.AppConfigEnvId).toBeDefined();
      expect(template.Outputs.AppConfigProfileId).toBeDefined();
    });

    it('should export dashboard URL', () => {
      expect(template.Outputs.DashboardURL).toBeDefined();
      expect(template.Outputs.DashboardURL.Value).toContain('cloudwatch');
      expect(template.Outputs.DashboardURL.Value).toContain('dashboards');
    });

    it('should have descriptions for all outputs', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Security Best Practices', () => {
    it('should use secrets manager for sensitive data', () => {
      const prismaEnv = template.Resources.PrismaReadFn.Properties.Environment.Variables;
      expect(prismaEnv.DATABASE_URL).toContain('secretsmanager');
    });

    it('should not contain hardcoded credentials', () => {
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

    it('should use least privilege IAM policies', () => {
      const mockPolicies = template.Resources.MockReadFn.Properties.Policies;
      const statements = mockPolicies.find((p: any) => p.Statement)?.Statement || [];
      
      statements.forEach((stmt: any) => {
        expect(stmt.Effect).toBe('Allow');
        expect(stmt.Action).toBeDefined();
        expect(stmt.Resource).toBeDefined();
      });
    });

    it('should enable X-Ray tracing for observability', () => {
      expect(template.Globals.Function.Tracing).toBe('Active');
    });
  });

  describe('Canary Deployment Configuration', () => {
    it('should use gradual deployment', () => {
      const deployment = template.Resources.MockReadFn.Properties.DeploymentPreference;
      expect(deployment.Type).toMatch(/Canary/);
    });

    it('should have rollback alarm configured', () => {
      const deployment = template.Resources.MockReadFn.Properties.DeploymentPreference;
      expect(deployment.Alarms).toBeDefined();
      expect(deployment.Alarms.length).toBeGreaterThan(0);
    });

    it('should have appropriate canary percentage', () => {
      const strategy = template.Resources.AppConfigDeploymentStrategy;
      const growthFactor = strategy.Properties.GrowthFactor;
      expect(growthFactor).toBeGreaterThanOrEqual(1);
      expect(growthFactor).toBeLessThanOrEqual(10);
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should use consistent naming for functions', () => {
      expect(template.Resources.MockReadFn.Properties.FunctionName).toMatch(/^huntaze-/);
      expect(template.Resources.PrismaReadFn.Properties.FunctionName).toMatch(/^huntaze-/);
      expect(template.Resources.CleanupFn.Properties.FunctionName).toMatch(/^huntaze-/);
    });

    it('should use descriptive resource names', () => {
      Object.entries(template.Resources).forEach(([key, resource]: [string, any]) => {
        expect(key.length).toBeGreaterThan(3);
        expect(key).toMatch(/^[A-Z]/);
      });
    });

    it('should have consistent export names', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        if (output.Export) {
          expect(output.Export.Name).toContain('${AWS::StackName}');
        }
      });
    });
  });

  describe('Performance Configuration', () => {
    it('should have appropriate memory allocation', () => {
      const memory = template.Globals.Function.MemorySize;
      expect(memory).toBeGreaterThanOrEqual(512);
    });

    it('should have reasonable timeout', () => {
      const timeout = template.Globals.Function.Timeout;
      expect(timeout).toBeLessThanOrEqual(60);
    });

    it('should use efficient metric periods', () => {
      const metrics = template.Resources.ErrorRateAlarm.Properties.Metrics;
      metrics.forEach((metric: any) => {
        if (metric.MetricStat) {
          expect(metric.MetricStat.Period).toBeLessThanOrEqual(300);
        }
      });
    });
  });

  describe('Monitoring and Observability', () => {
    it('should have comprehensive metrics', () => {
      const body = template.Resources.MonitoringDashboard.Properties.DashboardBody;
      expect(body).toContain('Invocations');
      expect(body).toContain('Errors');
      expect(body).toContain('Duration');
    });

    it('should monitor both control and candidate', () => {
      const body = template.Resources.MonitoringDashboard.Properties.DashboardBody;
      expect(body).toContain('Mock');
      expect(body).toContain('Prisma');
    });

    it('should have alarm for error detection', () => {
      expect(template.Resources.ErrorRateAlarm).toBeDefined();
    });
  });
});
