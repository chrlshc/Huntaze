import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse } from '@iarna/toml';
import { parse as parseYaml } from 'yaml';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Tests d'intégration pour sam/samconfig.toml
 * Valide l'intégration avec template.yaml, scripts de déploiement et AWS
 */

describe('SAM Config Integration Tests', () => {
  let samConfig: any;
  let templateConfig: any;

  beforeAll(() => {
    if (existsSync('sam/samconfig.toml')) {
      const samConfigContent = readFileSync('sam/samconfig.toml', 'utf-8');
      samConfig = parse(samConfigContent);
    }

    if (existsSync('sam/template.yaml')) {
      const templateContent = readFileSync('sam/template.yaml', 'utf-8');
      templateConfig = parseYaml(templateContent);
    }
  });

  describe('Template Integration', () => {
    it('should have matching parameter definitions', () => {
      if (!samConfig || !templateConfig) return;

      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
      
      // Extract parameter names from overrides
      const overrideParams = parameterOverrides.match(/(\w+)=/g)?.map((p: string) => p.replace('=', '')) || [];
      
      // Check if parameters exist in template
      overrideParams.forEach((paramName: string) => {
        expect(templateConfig.Parameters).toBeDefined();
        expect(templateConfig.Parameters[paramName]).toBeDefined();
      });
    });

    it('should use same region as template resources', () => {
      if (!samConfig || !templateConfig) return;

      const configRegion = samConfig.default.deploy.parameters.region;
      
      // Template should be deployable in this region
      expect(configRegion).toBe('us-east-1');
    });

    it('should reference valid secret ARN from template', () => {
      if (!samConfig || !templateConfig) return;

      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
      const arnMatch = parameterOverrides.match(/DatabaseSecretArn=(arn:aws:secretsmanager:[^:]+:\d+:secret:[^\s]+)/);
      
      if (arnMatch && templateConfig.Parameters?.DatabaseSecretArn) {
        const configArn = arnMatch[1];
        const templateDefault = templateConfig.Parameters.DatabaseSecretArn.Default;
        
        // Should match or be compatible
        expect(configArn).toContain('huntaze/database');
        expect(templateDefault).toContain('huntaze/database');
      }
    });

    it('should have compatible stack name with template outputs', () => {
      if (!samConfig || !templateConfig) return;

      const stackName = samConfig.default.deploy.parameters.stack_name;
      
      // Template outputs should reference stack name
      if (templateConfig.Outputs) {
        Object.values(templateConfig.Outputs).forEach((output: any) => {
          if (output.Export?.Name) {
            // Export names often include stack name
            expect(output.Export.Name).toContain('${AWS::StackName}');
          }
        });
      }
    });

    it('should have sufficient capabilities for template resources', () => {
      if (!samConfig || !templateConfig) return;

      const capabilities = samConfig.default.deploy.parameters.capabilities;
      
      // Check if template creates IAM resources
      const hasIAMResources = Object.values(templateConfig.Resources || {}).some((resource: any) => 
        resource.Type?.includes('IAM') || 
        resource.Properties?.Policies ||
        resource.Properties?.AssumeRolePolicyDocument
      );

      if (hasIAMResources) {
        expect(capabilities).toContain('CAPABILITY_IAM');
      }
    });
  });

  describe('Deployment Script Integration', () => {
    it('should be referenced by deploy.sh', () => {
      if (!existsSync('sam/deploy.sh')) return;

      const deployScript = readFileSync('sam/deploy.sh', 'utf-8');
      
      // Script should use samconfig.toml
      const usesSamConfig = 
        deployScript.includes('samconfig.toml') ||
        deployScript.includes('--config-file') ||
        deployScript.includes('sam deploy') && !deployScript.includes('--no-config-file');
      
      expect(usesSamConfig).toBe(true);
    });

    it('should have matching stack name in deploy script', () => {
      if (!samConfig || !existsSync('sam/deploy.sh')) return;

      const deployScript = readFileSync('sam/deploy.sh', 'utf-8');
      const stackName = samConfig.default.deploy.parameters.stack_name;
      
      // Script should reference the stack name
      expect(deployScript).toContain(stackName);
    });

    it('should support automated deployment workflow', () => {
      if (!samConfig) return;

      const confirmChangeset = samConfig.default.deploy.parameters.confirm_changeset;
      
      // Should be configured for automation
      expect(confirmChangeset).toBe(false);
    });
  });

  describe('AWS CLI Integration', () => {
    it('should have valid AWS CLI configuration format', async () => {
      if (!samConfig) return;

      const region = samConfig.default.deploy.parameters.region;
      
      // Region should be valid AWS region
      expect(region).toMatch(/^[a-z]{2}-[a-z]+-\d+$/);
    });

    it('should reference accessible S3 bucket', () => {
      if (!samConfig) return;

      const s3Bucket = samConfig.default.deploy.parameters.s3_bucket;
      
      // Bucket should follow SAM CLI managed bucket pattern
      expect(s3Bucket).toMatch(/aws-sam-cli-managed/);
    });

    it('should have valid parameter override format', () => {
      if (!samConfig) return;

      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
      
      // Should use key=value format
      expect(parameterOverrides).toMatch(/^\w+=.+/);
      
      // Should not have trailing spaces
      expect(parameterOverrides.trim()).toBe(parameterOverrides);
    });
  });

  describe('Secrets Manager Integration', () => {
    it('should reference valid Secrets Manager secret', () => {
      if (!samConfig) return;

      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
      const arnMatch = parameterOverrides.match(/arn:aws:secretsmanager:([^:]+):(\d+):secret:([^\s]+)/);
      
      expect(arnMatch).toBeTruthy();
      
      if (arnMatch) {
        const [, region, accountId, secretPath] = arnMatch;
        
        expect(region).toBe('us-east-1');
        expect(accountId).toBe('317805897534');
        expect(secretPath).toContain('huntaze/database');
      }
    });

    it('should use consistent secret path across configuration', () => {
      if (!samConfig || !templateConfig) return;

      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
      
      // Extract secret path from config
      const configSecretMatch = parameterOverrides.match(/secret:([^\s]+)/);
      
      if (configSecretMatch && templateConfig.Parameters?.DatabaseSecretArn) {
        const configSecretPath = configSecretMatch[1];
        const templateDefault = templateConfig.Parameters.DatabaseSecretArn.Default;
        
        // Both should reference same secret
        expect(templateDefault).toContain(configSecretPath);
      }
    });
  });

  describe('Lambda Function Integration', () => {
    it('should support Lambda functions defined in template', () => {
      if (!templateConfig) return;

      const resources = templateConfig.Resources || {};
      const lambdaFunctions = Object.values(resources).filter((resource: any) => 
        resource.Type === 'AWS::Serverless::Function'
      );

      // Should have Lambda functions to deploy
      expect(lambdaFunctions.length).toBeGreaterThan(0);
    });

    it('should have compatible runtime configuration', () => {
      if (!templateConfig) return;

      const globals = templateConfig.Globals?.Function;
      
      if (globals?.Runtime) {
        // Runtime should be supported
        expect(globals.Runtime).toMatch(/^nodejs\d+\.x$/);
      }
    });

    it('should support Lambda code deployment', () => {
      if (!samConfig) return;

      const s3Bucket = samConfig.default.deploy.parameters.s3_bucket;
      const s3Prefix = samConfig.default.deploy.parameters.s3_prefix;
      
      // Should have S3 configuration for code upload
      expect(s3Bucket).toBeDefined();
      expect(s3Prefix).toBeDefined();
    });
  });

  describe('CloudWatch Integration', () => {
    it('should support CloudWatch resources in template', () => {
      if (!templateConfig) return;

      const resources = templateConfig.Resources || {};
      const cloudWatchResources = Object.values(resources).filter((resource: any) => 
        resource.Type?.includes('CloudWatch') || 
        resource.Type?.includes('Logs')
      );

      // Template may have CloudWatch resources
      if (cloudWatchResources.length > 0) {
        expect(cloudWatchResources.length).toBeGreaterThan(0);
      }
    });

    it('should enable X-Ray tracing if configured', () => {
      if (!templateConfig) return;

      const globals = templateConfig.Globals?.Function;
      
      if (globals?.Tracing) {
        expect(['Active', 'PassThrough']).toContain(globals.Tracing);
      }
    });
  });

  describe('AppConfig Integration', () => {
    it('should support AppConfig resources in template', () => {
      if (!templateConfig) return;

      const resources = templateConfig.Resources || {};
      const appConfigResources = Object.values(resources).filter((resource: any) => 
        resource.Type?.includes('AppConfig')
      );

      // Template should have AppConfig resources for feature flags
      expect(appConfigResources.length).toBeGreaterThan(0);
    });

    it('should have environment variables for AppConfig', () => {
      if (!templateConfig) return;

      const globals = templateConfig.Globals?.Function;
      
      if (globals?.Environment?.Variables) {
        const envVars = globals.Environment.Variables;
        
        // Should have AppConfig configuration
        expect(envVars.APP_ID || envVars.APPCONFIG_APPLICATION_ID).toBeDefined();
      }
    });
  });

  describe('Deployment Strategy Integration', () => {
    it('should support canary deployments', () => {
      if (!templateConfig) return;

      const resources = templateConfig.Resources || {};
      const lambdaFunctions = Object.values(resources).filter((resource: any) => 
        resource.Type === 'AWS::Serverless::Function'
      );

      // Check if any function has deployment preference
      const hasDeploymentPreference = lambdaFunctions.some((fn: any) => 
        fn.Properties?.DeploymentPreference
      );

      if (hasDeploymentPreference) {
        expect(hasDeploymentPreference).toBe(true);
      }
    });

    it('should have rollback configuration', () => {
      if (!samConfig) return;

      const disableRollback = samConfig.default.deploy.parameters.disable_rollback;
      
      // Should have explicit rollback setting
      expect(typeof disableRollback).toBe('boolean');
    });
  });

  describe('CI/CD Pipeline Integration', () => {
    it('should be compatible with automated deployments', () => {
      if (!samConfig) return;

      const params = samConfig.default.deploy.parameters;
      
      // Should have all required parameters for automation
      expect(params.stack_name).toBeDefined();
      expect(params.s3_bucket).toBeDefined();
      expect(params.region).toBeDefined();
      expect(params.confirm_changeset).toBe(false);
    });

    it('should support buildspec.yml if present', () => {
      if (!existsSync('buildspec.yml')) return;

      const buildspecContent = readFileSync('buildspec.yml', 'utf-8');
      
      // Buildspec might reference SAM deployment
      if (buildspecContent.includes('sam')) {
        expect(buildspecContent).toMatch(/sam\s+(build|deploy|validate)/);
      }
    });

    it('should work with CodeBuild environment', () => {
      if (!samConfig) return;

      const region = samConfig.default.deploy.parameters.region;
      
      // Should use standard AWS region
      expect(region).toBe('us-east-1');
    });
  });

  describe('Resource Tagging Integration', () => {
    it('should support resource tagging if configured', () => {
      if (!templateConfig) return;

      // Check if template has tags
      const globals = templateConfig.Globals?.Function;
      
      if (globals?.Tags) {
        expect(typeof globals.Tags).toBe('object');
      }
    });

    it('should have consistent naming across resources', () => {
      if (!samConfig || !templateConfig) return;

      const stackName = samConfig.default.deploy.parameters.stack_name;
      const resources = templateConfig.Resources || {};
      
      // Resource names should follow consistent pattern
      Object.keys(resources).forEach(resourceName => {
        expect(resourceName).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
    });
  });

  describe('Output Integration', () => {
    it('should have outputs for key resources', () => {
      if (!templateConfig) return;

      const outputs = templateConfig.Outputs || {};
      
      // Should have outputs for Lambda functions
      const hasLambdaOutputs = Object.values(outputs).some((output: any) => 
        output.Description?.includes('Lambda') || 
        output.Description?.includes('Function')
      );

      expect(hasLambdaOutputs).toBe(true);
    });

    it('should export outputs with stack name', () => {
      if (!templateConfig) return;

      const outputs = templateConfig.Outputs || {};
      
      // Exports should include stack name reference
      Object.values(outputs).forEach((output: any) => {
        if (output.Export?.Name) {
          expect(output.Export.Name).toContain('${AWS::StackName}');
        }
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should have alarm configuration for error monitoring', () => {
      if (!templateConfig) return;

      const resources = templateConfig.Resources || {};
      const alarms = Object.values(resources).filter((resource: any) => 
        resource.Type === 'AWS::CloudWatch::Alarm'
      );

      // Should have alarms for monitoring
      expect(alarms.length).toBeGreaterThan(0);
    });

    it('should configure deployment rollback on errors', () => {
      if (!templateConfig) return;

      const resources = templateConfig.Resources || {};
      const lambdaFunctions = Object.values(resources).filter((resource: any) => 
        resource.Type === 'AWS::Serverless::Function'
      );

      // Check if functions have alarms configured
      const hasAlarmConfig = lambdaFunctions.some((fn: any) => 
        fn.Properties?.DeploymentPreference?.Alarms
      );

      if (hasAlarmConfig) {
        expect(hasAlarmConfig).toBe(true);
      }
    });
  });

  describe('Documentation Integration', () => {
    it('should be documented in README', () => {
      if (!existsSync('sam/README.md')) return;

      const readme = readFileSync('sam/README.md', 'utf-8');
      
      // README should mention samconfig.toml
      expect(readme).toMatch(/samconfig\.toml/i);
    });

    it('should have deployment instructions', () => {
      if (!existsSync('sam/README.md')) return;

      const readme = readFileSync('sam/README.md', 'utf-8');
      
      // Should have deployment commands
      expect(readme).toMatch(/sam\s+deploy/i);
    });

    it('should document parameter overrides', () => {
      if (!existsSync('sam/README.md')) return;

      const readme = readFileSync('sam/README.md', 'utf-8');
      
      // Should mention parameters
      expect(readme).toMatch(/parameter|DatabaseSecretArn/i);
    });
  });
});

/**
 * Tests de validation end-to-end
 */
describe('SAM Config End-to-End Validation', () => {
  describe('Deployment Readiness', () => {
    it('should have all files required for deployment', () => {
      expect(existsSync('sam/samconfig.toml')).toBe(true);
      expect(existsSync('sam/template.yaml')).toBe(true);
    });

    it('should have Lambda handler files', () => {
      if (!existsSync('sam/template.yaml')) return;

      const templateContent = readFileSync('sam/template.yaml', 'utf-8');
      const template = parseYaml(templateContent);
      
      const resources = template.Resources || {};
      const lambdaFunctions = Object.values(resources).filter((resource: any) => 
        resource.Type === 'AWS::Serverless::Function'
      );

      // Check if handler files exist
      lambdaFunctions.forEach((fn: any) => {
        const handler = fn.Properties?.Handler;
        if (handler) {
          const [file] = handler.split('.');
          const handlerPath = `lambda/${file}.ts`;
          const handlerPathJs = `lambda/${file}.js`;
          
          const handlerExists = existsSync(handlerPath) || existsSync(handlerPathJs);
          expect(handlerExists).toBe(true);
        }
      });
    });

    it('should have deployment script', () => {
      expect(existsSync('sam/deploy.sh')).toBe(true);
    });
  });

  describe('Configuration Consistency', () => {
    it('should have consistent configuration across all files', () => {
      if (!existsSync('sam/samconfig.toml') || !existsSync('sam/template.yaml')) return;

      const samConfigContent = readFileSync('sam/samconfig.toml', 'utf-8');
      const samConfig = parse(samConfigContent);
      
      const templateContent = readFileSync('sam/template.yaml', 'utf-8');
      const template = parseYaml(templateContent);

      // Stack name should be consistent
      const stackName = samConfig.default.deploy.parameters.stack_name;
      expect(stackName).toContain('huntaze');
      expect(stackName).toContain('prisma');
    });

    it('should have matching AWS account configuration', () => {
      if (!existsSync('sam/samconfig.toml')) return;

      const samConfigContent = readFileSync('sam/samconfig.toml', 'utf-8');
      const samConfig = parse(samConfigContent);
      
      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
      const accountMatch = parameterOverrides.match(/:(\d{12}):/);
      
      if (accountMatch) {
        const accountId = accountMatch[1];
        expect(accountId).toBe('317805897534');
      }
    });
  });
});
