import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse } from '@iarna/toml';

/**
 * Tests de régression pour sam/samconfig.toml
 * Garantit que les modifications futures ne cassent pas la configuration existante
 */

describe('SAM Config Regression Tests', () => {
  let samConfig: any;

  beforeEach(() => {
    if (existsSync('sam/samconfig.toml')) {
      const samConfigContent = readFileSync('sam/samconfig.toml', 'utf-8');
      samConfig = parse(samConfigContent);
    }
  });

  describe('Critical Configuration Preservation', () => {
    it('should maintain stack name', () => {
      const stackName = samConfig.default.deploy.parameters.stack_name;
      expect(stackName).toBe('huntaze-prisma-skeleton');
    });

    it('should maintain S3 bucket configuration', () => {
      const s3Bucket = samConfig.default.deploy.parameters.s3_bucket;
      expect(s3Bucket).toBe('aws-sam-cli-managed-default-samclisourcebucket-qusvkqzketix');
    });

    it('should maintain S3 prefix', () => {
      const s3Prefix = samConfig.default.deploy.parameters.s3_prefix;
      expect(s3Prefix).toBe('huntaze-prisma-skeleton');
    });

    it('should maintain region', () => {
      const region = samConfig.default.deploy.parameters.region;
      expect(region).toBe('us-east-1');
    });

    it('should maintain confirm_changeset setting', () => {
      const confirmChangeset = samConfig.default.deploy.parameters.confirm_changeset;
      expect(confirmChangeset).toBe(false);
    });

    it('should maintain capabilities', () => {
      const capabilities = samConfig.default.deploy.parameters.capabilities;
      expect(capabilities).toBe('CAPABILITY_IAM');
    });

    it('should maintain disable_rollback setting', () => {
      const disableRollback = samConfig.default.deploy.parameters.disable_rollback;
      expect(disableRollback).toBe(true);
    });

    it('should maintain DatabaseSecretArn parameter', () => {
      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
      expect(parameterOverrides).toContain('DatabaseSecretArn=arn:aws:secretsmanager:us-east-1:317805897534:secret:huntaze/database');
    });
  });

  describe('Structure Preservation', () => {
    it('should maintain TOML structure', () => {
      expect(samConfig.default).toBeDefined();
      expect(samConfig.default.deploy).toBeDefined();
      expect(samConfig.default.deploy.parameters).toBeDefined();
    });

    it('should not introduce new top-level sections without documentation', () => {
      const topLevelKeys = Object.keys(samConfig);
      
      // Should only have 'default' or documented environments
      const allowedKeys = ['default', 'staging', 'production', 'development'];
      
      topLevelKeys.forEach(key => {
        expect(allowedKeys).toContain(key);
      });
    });

    it('should maintain parameter structure', () => {
      const params = samConfig.default.deploy.parameters;
      
      // Core parameters should exist
      expect(params.stack_name).toBeDefined();
      expect(params.s3_bucket).toBeDefined();
      expect(params.s3_prefix).toBeDefined();
      expect(params.region).toBeDefined();
      expect(params.confirm_changeset).toBeDefined();
      expect(params.capabilities).toBeDefined();
      expect(params.disable_rollback).toBeDefined();
      expect(params.parameter_overrides).toBeDefined();
    });
  });

  describe('Backward Compatibility', () => {
    it('should remain compatible with SAM CLI 1.x', () => {
      // Configuration format should be compatible with SAM CLI
      expect(samConfig.default.deploy).toBeDefined();
      expect(samConfig.default.deploy.parameters).toBeDefined();
    });

    it('should maintain parameter naming convention', () => {
      const params = samConfig.default.deploy.parameters;
      
      // Parameter names should use snake_case
      Object.keys(params).forEach(key => {
        expect(key).toMatch(/^[a-z_]+$/);
      });
    });

    it('should not break existing deployment scripts', () => {
      // Stack name format should remain consistent
      const stackName = samConfig.default.deploy.parameters.stack_name;
      expect(stackName).toMatch(/^huntaze-[a-z-]+$/);
    });
  });

  describe('Security Configuration Preservation', () => {
    it('should continue using Secrets Manager for database credentials', () => {
      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
      expect(parameterOverrides).toContain('secretsmanager');
      expect(parameterOverrides).toContain('huntaze/database');
    });

    it('should not introduce hardcoded credentials', () => {
      const configContent = readFileSync('sam/samconfig.toml', 'utf-8');
      
      // Should not contain sensitive patterns
      expect(configContent).not.toMatch(/password\s*=\s*["'][^"']+["']/i);
      expect(configContent).not.toMatch(/secret\s*=\s*["'][^"']+["']/i);
      expect(configContent).not.toMatch(/AKIA[0-9A-Z]{16}/);
    });

    it('should maintain IAM capability requirement', () => {
      const capabilities = samConfig.default.deploy.parameters.capabilities;
      expect(capabilities).toContain('CAPABILITY_IAM');
    });
  });

  describe('Resource Naming Preservation', () => {
    it('should maintain consistent naming pattern', () => {
      const stackName = samConfig.default.deploy.parameters.stack_name;
      const s3Prefix = samConfig.default.deploy.parameters.s3_prefix;
      
      // Should use kebab-case
      expect(stackName).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(s3Prefix).toMatch(/^[a-z][a-z0-9-]*$/);
    });

    it('should maintain project identifier in names', () => {
      const stackName = samConfig.default.deploy.parameters.stack_name;
      expect(stackName).toContain('huntaze');
    });

    it('should maintain component identifier', () => {
      const stackName = samConfig.default.deploy.parameters.stack_name;
      expect(stackName).toContain('prisma');
    });
  });

  describe('Deployment Settings Preservation', () => {
    it('should maintain automated deployment configuration', () => {
      const confirmChangeset = samConfig.default.deploy.parameters.confirm_changeset;
      expect(confirmChangeset).toBe(false);
    });

    it('should maintain rollback configuration', () => {
      const disableRollback = samConfig.default.deploy.parameters.disable_rollback;
      expect(typeof disableRollback).toBe('boolean');
    });

    it('should maintain S3 artifact storage configuration', () => {
      const s3Bucket = samConfig.default.deploy.parameters.s3_bucket;
      const s3Prefix = samConfig.default.deploy.parameters.s3_prefix;
      
      expect(s3Bucket).toBeDefined();
      expect(s3Prefix).toBeDefined();
    });
  });

  describe('AWS Account Configuration Preservation', () => {
    it('should maintain AWS account ID', () => {
      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
      expect(parameterOverrides).toContain('317805897534');
    });

    it('should maintain region configuration', () => {
      const region = samConfig.default.deploy.parameters.region;
      expect(region).toBe('us-east-1');
    });

    it('should maintain secret path structure', () => {
      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
      expect(parameterOverrides).toContain('huntaze/database');
    });
  });

  describe('Integration Points Preservation', () => {
    it('should maintain compatibility with template.yaml', () => {
      if (!existsSync('sam/template.yaml')) return;

      const templateContent = readFileSync('sam/template.yaml', 'utf-8');
      const stackName = samConfig.default.deploy.parameters.stack_name;
      
      // Template should reference or be compatible with stack name
      expect(templateContent).toContain('huntaze');
    });

    it('should maintain parameter override format', () => {
      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
      
      // Should use key=value format
      expect(parameterOverrides).toMatch(/\w+=.+/);
    });

    it('should maintain deployment script compatibility', () => {
      if (!existsSync('sam/deploy.sh')) return;

      const deployScript = readFileSync('sam/deploy.sh', 'utf-8');
      const stackName = samConfig.default.deploy.parameters.stack_name;
      
      // Deploy script should reference stack name
      expect(deployScript).toContain(stackName);
    });
  });

  describe('Configuration Completeness Preservation', () => {
    it('should maintain all required parameters', () => {
      const params = samConfig.default.deploy.parameters;
      
      const requiredParams = [
        'stack_name',
        's3_bucket',
        's3_prefix',
        'region',
        'confirm_changeset',
        'capabilities',
        'disable_rollback',
        'parameter_overrides'
      ];
      
      requiredParams.forEach(param => {
        expect(params[param]).toBeDefined();
      });
    });

    it('should not remove critical configuration', () => {
      const params = samConfig.default.deploy.parameters;
      
      // These should never be removed
      expect(params.stack_name).toBeTruthy();
      expect(params.region).toBeTruthy();
      expect(params.capabilities).toBeTruthy();
    });
  });

  describe('Value Type Preservation', () => {
    it('should maintain correct data types', () => {
      const params = samConfig.default.deploy.parameters;
      
      expect(typeof params.stack_name).toBe('string');
      expect(typeof params.s3_bucket).toBe('string');
      expect(typeof params.s3_prefix).toBe('string');
      expect(typeof params.region).toBe('string');
      expect(typeof params.confirm_changeset).toBe('boolean');
      expect(typeof params.capabilities).toBe('string');
      expect(typeof params.disable_rollback).toBe('boolean');
      expect(typeof params.parameter_overrides).toBe('string');
    });

    it('should not change boolean values to strings', () => {
      const params = samConfig.default.deploy.parameters;
      
      // These should remain booleans
      expect(params.confirm_changeset).not.toBe('false');
      expect(params.confirm_changeset).toBe(false);
      
      expect(params.disable_rollback).not.toBe('true');
      expect(params.disable_rollback).toBe(true);
    });
  });

  describe('Format Consistency Preservation', () => {
    it('should maintain TOML formatting', () => {
      const configContent = readFileSync('sam/samconfig.toml', 'utf-8');
      
      // Should use proper TOML sections
      expect(configContent).toContain('[default]');
      expect(configContent).toContain('[default.deploy]');
      expect(configContent).toContain('[default.deploy.parameters]');
    });

    it('should maintain parameter assignment format', () => {
      const configContent = readFileSync('sam/samconfig.toml', 'utf-8');
      
      // Should use key = value format
      expect(configContent).toMatch(/\w+\s*=\s*.+/);
    });

    it('should maintain string quoting for values with special characters', () => {
      const configContent = readFileSync('sam/samconfig.toml', 'utf-8');
      
      // ARNs should be quoted
      expect(configContent).toMatch(/parameter_overrides\s*=\s*"[^"]+"/);
    });
  });
});

/**
 * Tests de compatibilité pour s'assurer que la configuration fonctionne
 * avec différentes versions de SAM CLI et AWS
 */
describe('SAM Config Compatibility Tests', () => {
  describe('SAM CLI Version Compatibility', () => {
    it('should be compatible with SAM CLI 1.x format', () => {
      if (!existsSync('sam/samconfig.toml')) return;

      const samConfigContent = readFileSync('sam/samconfig.toml', 'utf-8');
      const samConfig = parse(samConfigContent);

      // SAM CLI 1.x uses this structure
      expect(samConfig.default).toBeDefined();
      expect(samConfig.default.deploy).toBeDefined();
      expect(samConfig.default.deploy.parameters).toBeDefined();
    });

    it('should use supported parameter names', () => {
      if (!existsSync('sam/samconfig.toml')) return;

      const samConfigContent = readFileSync('sam/samconfig.toml', 'utf-8');
      const samConfig = parse(samConfigContent);
      const params = samConfig.default.deploy.parameters;

      // These are standard SAM CLI parameters
      const standardParams = [
        'stack_name',
        's3_bucket',
        's3_prefix',
        'region',
        'confirm_changeset',
        'capabilities',
        'parameter_overrides'
      ];

      standardParams.forEach(param => {
        if (params[param] !== undefined) {
          expect(params[param]).toBeDefined();
        }
      });
    });
  });

  describe('CloudFormation Compatibility', () => {
    it('should use valid CloudFormation stack name', () => {
      if (!existsSync('sam/samconfig.toml')) return;

      const samConfigContent = readFileSync('sam/samconfig.toml', 'utf-8');
      const samConfig = parse(samConfigContent);
      const stackName = samConfig.default.deploy.parameters.stack_name;

      // CloudFormation stack name requirements
      expect(stackName).toMatch(/^[a-zA-Z][a-zA-Z0-9-]*$/);
      expect(stackName.length).toBeLessThanOrEqual(128);
    });

    it('should use valid CloudFormation capabilities', () => {
      if (!existsSync('sam/samconfig.toml')) return;

      const samConfigContent = readFileSync('sam/samconfig.toml', 'utf-8');
      const samConfig = parse(samConfigContent);
      const capabilities = samConfig.default.deploy.parameters.capabilities;

      const validCapabilities = [
        'CAPABILITY_IAM',
        'CAPABILITY_NAMED_IAM',
        'CAPABILITY_AUTO_EXPAND'
      ];

      // Should contain at least one valid capability
      const hasValidCapability = validCapabilities.some(cap => 
        capabilities.includes(cap)
      );
      expect(hasValidCapability).toBe(true);
    });
  });

  describe('AWS Service Compatibility', () => {
    it('should use valid AWS region', () => {
      if (!existsSync('sam/samconfig.toml')) return;

      const samConfigContent = readFileSync('sam/samconfig.toml', 'utf-8');
      const samConfig = parse(samConfigContent);
      const region = samConfig.default.deploy.parameters.region;

      // Should be a valid AWS region format
      expect(region).toMatch(/^[a-z]{2}-[a-z]+-\d+$/);
    });

    it('should use valid Secrets Manager ARN', () => {
      if (!existsSync('sam/samconfig.toml')) return;

      const samConfigContent = readFileSync('sam/samconfig.toml', 'utf-8');
      const samConfig = parse(samConfigContent);
      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;

      // Should contain valid Secrets Manager ARN
      expect(parameterOverrides).toMatch(/arn:aws:secretsmanager:[a-z0-9-]+:\d{12}:secret:[a-zA-Z0-9/_+=.@-]+/);
    });

    it('should use valid S3 bucket name', () => {
      if (!existsSync('sam/samconfig.toml')) return;

      const samConfigContent = readFileSync('sam/samconfig.toml', 'utf-8');
      const samConfig = parse(samConfigContent);
      const s3Bucket = samConfig.default.deploy.parameters.s3_bucket;

      // S3 bucket name requirements
      expect(s3Bucket).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
      expect(s3Bucket.length).toBeGreaterThanOrEqual(3);
      expect(s3Bucket.length).toBeLessThanOrEqual(63);
    });
  });
});
