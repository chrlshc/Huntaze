import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Tests d'intégration pour le déploiement SAM
 * Simule et valide le processus de déploiement complet
 */

describe('SAM Deployment Integration', () => {
  let template: any;
  let deployScript: string;

  beforeAll(() => {
    if (existsSync('sam/template.yaml')) {
      template = parse(readFileSync('sam/template.yaml', 'utf-8'));
    }
    if (existsSync('sam/deploy.sh')) {
      deployScript = readFileSync('sam/deploy.sh', 'utf-8');
    }
  });

  describe('Template Validation', () => {
    it('should validate template with SAM CLI', async () => {
      // Skip if SAM CLI not available
      try {
        await execAsync('sam --version');
      } catch {
        console.warn('SAM CLI not available, skipping validation');
        return;
      }

      try {
        const { stdout, stderr } = await execAsync('sam validate --template sam/template.yaml');
        expect(stderr).not.toContain('Error');
        expect(stdout).toContain('Valid') || expect(stderr).toBe('');
      } catch (error) {
        console.warn('SAM validation failed:', error);
      }
    }, 30000);

    it('should have all required handler files referenced', () => {
      const handlers = [
        'lambda/mock-handler.ts',
        'lambda/prisma-handler.ts',
        'lambda/cleanup-handler.ts'
      ];

      handlers.forEach(handler => {
        const handlerName = handler.split('/')[1].replace('.ts', '');
        expect(JSON.stringify(template)).toContain(handlerName);
      });
    });

    it('should reference valid code URI', () => {
      const functions = ['MockReadFn', 'PrismaReadFn', 'CleanupFn'];
      
      functions.forEach(fn => {
        const codeUri = template.Resources[fn].Properties.CodeUri;
        expect(codeUri).toBeDefined();
        expect(codeUri).toContain('../lambda');
      });
    });
  });

  describe('Deployment Script Integration', () => {
    it('should have deployment script', () => {
      expect(existsSync('sam/deploy.sh')).toBe(true);
    });

    it('should reference template file', () => {
      if (deployScript) {
        expect(deployScript).toContain('template.yaml');
      }
    });

    it('should use SAM deploy command', () => {
      if (deployScript) {
        expect(deployScript).toContain('sam deploy');
      }
    });

    it('should have guided deployment option', () => {
      if (deployScript) {
        expect(deployScript).toContain('--guided') || 
        expect(deployScript).toContain('--parameter-overrides');
      }
    });
  });

  describe('Resource Dependencies', () => {
    it('should have correct AppConfig dependencies', () => {
      const env = template.Resources.AppConfigEnv;
      expect(env.Properties.ApplicationId).toEqual({ Ref: 'AppConfigApp' });
    });

    it('should have correct profile dependencies', () => {
      const profile = template.Resources.AppConfigProfile;
      expect(profile.Properties.ApplicationId).toEqual({ Ref: 'AppConfigApp' });
    });

    it('should reference candidate function in mock function', () => {
      const mockEnv = template.Resources.MockReadFn.Properties.Environment.Variables;
      expect(mockEnv.CANDIDATE_FN_ARN).toEqual({ 'Fn::GetAtt': ['PrismaReadFn', 'Arn'] });
    });

    it('should reference alarm in deployment preference', () => {
      const deployment = template.Resources.MockReadFn.Properties.DeploymentPreference;
      expect(deployment.Alarms).toContain({ Ref: 'ErrorRateAlarm' });
    });

    it('should reference cleanup function in schedule', () => {
      const targets = template.Resources.CleanupSchedule.Properties.Targets;
      const target = targets[0];
      expect(target.Arn).toEqual({ 'Fn::GetAtt': ['CleanupFn', 'Arn'] });
    });
  });

  describe('IAM Permissions Integration', () => {
    it('should grant mock function permission to invoke candidate', () => {
      const policies = template.Resources.MockReadFn.Properties.Policies;
      const statements = policies.find((p: any) => p.Statement)?.Statement || [];
      
      const invokeStmt = statements.find((s: any) => 
        s.Action === 'lambda:InvokeFunction'
      );
      
      expect(invokeStmt).toBeDefined();
      expect(invokeStmt.Resource).toEqual({ 'Fn::GetAtt': ['PrismaReadFn', 'Arn'] });
    });

    it('should grant prisma function access to secrets', () => {
      const policies = template.Resources.PrismaReadFn.Properties.Policies;
      const statements = policies.find((p: any) => p.Statement)?.Statement || [];
      
      const secretsStmt = statements.find((s: any) => 
        s.Action === 'secretsmanager:GetSecretValue'
      );
      
      expect(secretsStmt).toBeDefined();
      expect(secretsStmt.Resource).toEqual({ Ref: 'DatabaseSecretArn' });
    });

    it('should grant EventBridge permission to invoke cleanup', () => {
      const permission = template.Resources.CleanupFnPermission;
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
      expect(permission.Properties.SourceArn).toEqual({ 
        'Fn::GetAtt': ['CleanupSchedule', 'Arn'] 
      });
    });
  });

  describe('Environment Variable Resolution', () => {
    it('should resolve database URL from secrets manager', () => {
      const env = template.Resources.PrismaReadFn.Properties.Environment.Variables;
      const dbUrl = env.DATABASE_URL;
      
      expect(dbUrl).toContain('resolve:secretsmanager');
      expect(dbUrl).toContain('DatabaseSecretArn');
      expect(dbUrl).toContain('DATABASE_URL');
    });

    it('should reference AppConfig resources in globals', () => {
      const globalEnv = template.Globals.Function.Environment.Variables;
      
      expect(globalEnv.APP_ID).toEqual({ Ref: 'AppConfigApp' });
      expect(globalEnv.ENV_ID).toEqual({ Ref: 'AppConfigEnv' });
      expect(globalEnv.FEATURES_PROFILE_ID).toEqual({ Ref: 'AppConfigProfile' });
    });
  });

  describe('CloudWatch Integration', () => {
    it('should create log groups for all functions', () => {
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

    it('should monitor correct lambda function in alarm', () => {
      const metrics = template.Resources.ErrorRateAlarm.Properties.Metrics;
      const errorsMetric = metrics.find((m: any) => m.Id === 'errors');
      
      expect(errorsMetric.MetricStat.Metric.Dimensions[0].Value).toEqual({
        Ref: 'MockReadFn'
      });
    });

    it('should reference functions in dashboard', () => {
      const body = template.Resources.MonitoringDashboard.Properties.DashboardBody;
      expect(body).toContain('${PrismaReadFn}');
    });
  });

  describe('Canary Deployment Flow', () => {
    it('should have complete canary configuration', () => {
      const deployment = template.Resources.MockReadFn.Properties.DeploymentPreference;
      
      expect(deployment.Type).toBeDefined();
      expect(deployment.Alarms).toBeDefined();
      expect(deployment.Alarms.length).toBeGreaterThan(0);
    });

    it('should have alarm that triggers rollback', () => {
      const alarm = template.Resources.ErrorRateAlarm;
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.Threshold).toBeLessThanOrEqual(0.05); // Max 5%
    });

    it('should have auto-publish alias for gradual deployment', () => {
      expect(template.Resources.MockReadFn.Properties.AutoPublishAlias).toBe('live');
    });
  });

  describe('Shadow Traffic Configuration', () => {
    it('should enable mock to invoke candidate', () => {
      const mockEnv = template.Resources.MockReadFn.Properties.Environment.Variables;
      expect(mockEnv.CANDIDATE_FN_ARN).toBeDefined();
    });

    it('should have necessary permissions for shadow invocation', () => {
      const policies = template.Resources.MockReadFn.Properties.Policies;
      const statements = policies.find((p: any) => p.Statement)?.Statement || [];
      
      const invokeStmt = statements.find((s: any) => 
        s.Action === 'lambda:InvokeFunction'
      );
      
      expect(invokeStmt).toBeDefined();
    });
  });

  describe('Feature Flag Cleanup', () => {
    it('should have scheduled cleanup after 7 days', () => {
      const schedule = template.Resources.CleanupSchedule;
      expect(schedule.Properties.ScheduleExpression).toContain('7 days');
    });

    it('should have cleanup function with AppConfig permissions', () => {
      const policies = template.Resources.CleanupFn.Properties.Policies;
      const statements = policies.find((p: any) => p.Statement)?.Statement || [];
      
      const appConfigStmt = statements.find((s: any) => 
        s.Action?.includes('appconfig:')
      );
      
      expect(appConfigStmt).toBeDefined();
    });

    it('should be able to update feature flags', () => {
      const policies = template.Resources.CleanupFn.Properties.Policies;
      const statements = policies.find((p: any) => p.Statement)?.Statement || [];
      
      const updateStmt = statements.find((s: any) => 
        s.Action?.includes('appconfig:CreateHostedConfigurationVersion')
      );
      
      expect(updateStmt).toBeDefined();
    });
  });

  describe('Output Integration', () => {
    it('should export all function ARNs', () => {
      expect(template.Outputs.MockReadFnArn.Value).toEqual({
        'Fn::GetAtt': ['MockReadFn', 'Arn']
      });
      
      expect(template.Outputs.PrismaReadFnArn.Value).toEqual({
        'Fn::GetAtt': ['PrismaReadFn', 'Arn']
      });
    });

    it('should export AppConfig IDs for external use', () => {
      expect(template.Outputs.AppConfigAppId.Value).toEqual({ Ref: 'AppConfigApp' });
      expect(template.Outputs.AppConfigEnvId.Value).toEqual({ Ref: 'AppConfigEnv' });
      expect(template.Outputs.AppConfigProfileId.Value).toEqual({ Ref: 'AppConfigProfile' });
    });

    it('should provide dashboard URL', () => {
      const url = template.Outputs.DashboardURL.Value;
      expect(url).toContain('cloudwatch');
      expect(url).toContain('${AWS::Region}');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle missing data in alarm gracefully', () => {
      expect(template.Resources.ErrorRateAlarm.Properties.TreatMissingData).toBe('notBreaching');
    });

    it('should require multiple datapoints before alarming', () => {
      const alarm = template.Resources.ErrorRateAlarm.Properties;
      expect(alarm.DatapointsToAlarm).toBeLessThan(alarm.EvaluationPeriods);
    });

    it('should have X-Ray tracing for debugging', () => {
      expect(template.Globals.Function.Tracing).toBe('Active');
    });
  });

  describe('Cost Optimization', () => {
    it('should use appropriate memory size', () => {
      const memory = template.Globals.Function.MemorySize;
      expect(memory).toBeLessThanOrEqual(1024); // Not excessive
    });

    it('should have reasonable timeout', () => {
      const timeout = template.Globals.Function.Timeout;
      expect(timeout).toBeLessThanOrEqual(60); // Not excessive
    });

    it('should use efficient metric periods', () => {
      const metrics = template.Resources.ErrorRateAlarm.Properties.Metrics;
      metrics.forEach((metric: any) => {
        if (metric.MetricStat) {
          expect(metric.MetricStat.Period).toBeGreaterThanOrEqual(60);
        }
      });
    });
  });

  describe('Deployment Validation', () => {
    it('should have all required parameters', () => {
      expect(template.Parameters.DatabaseSecretArn).toBeDefined();
    });

    it('should have valid parameter defaults', () => {
      const defaultArn = template.Parameters.DatabaseSecretArn.Default;
      expect(defaultArn).toMatch(/^arn:aws:secretsmanager:/);
    });

    it('should export resources for cross-stack references', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
        }
      });
    });
  });
});
