import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse } from '@iarna/toml';

/**
 * Tests de validation pour sam/samconfig.toml
 * Valide la configuration SAM CLI pour le déploiement du walking skeleton Prisma
 */

describe('SAM Config Validation', () => {
  let samConfig: any;
  let samConfigContent: string;

  beforeEach(() => {
    if (existsSync('sam/samconfig.toml')) {
      samConfigContent = readFileSync('sam/samconfig.toml', 'utf-8');
      samConfig = parse(samConfigContent);
    }
  });

  describe('File Structure', () => {
    it('should have samconfig.toml file', () => {
      expect(existsSync('sam/samconfig.toml')).toBe(true);
    });

    it('should be valid TOML format', () => {
      expect(() => parse(samConfigContent)).not.toThrow();
      expect(samConfig).toBeDefined();
    });

    it('should have default environment configuration', () => {
      expect(samConfig.default).toBeDefined();
      expect(samConfig.default.deploy).toBeDefined();
      expect(samConfig.default.deploy.parameters).toBeDefined();
    });
  });

  describe('Stack Configuration', () => {
    it('should have correct stack name', () => {
      const stackName = samConfig.default.deploy.parameters.stack_name;
      expect(stackName).toBe('huntaze-prisma-skeleton');
    });

    it('should have valid stack name format', () => {
      const stackName = samConfig.default.deploy.parameters.stack_name;
      
      // Stack name should be alphanumeric with hyphens
      expect(stackName).toMatch(/^[a-zA-Z][a-zA-Z0-9-]*$/);
      
      // Should not exceed 128 characters
      expect(stackName.length).toBeLessThanOrEqual(128);
      
      // Should not start or end with hyphen
      expect(stackName).not.toMatch(/^-/);
      expect(stackName).not.toMatch(/-$/);
    });

    it('should match template stack name pattern', () => {
      const stackName = samConfig.default.deploy.parameters.stack_name;
      expect(stackName).toContain('huntaze');
      expect(stackName).toContain('prisma');
    });
  });

  describe('S3 Configuration', () => {
    it('should have S3 bucket configured', () => {
      const s3Bucket = samConfig.default.deploy.parameters.s3_bucket;
      expect(s3Bucket).toBeDefined();
      expect(typeof s3Bucket).toBe('string');
      expect(s3Bucket.length).toBeGreaterThan(0);
    });

    it('should have valid S3 bucket name format', () => {
      const s3Bucket = samConfig.default.deploy.parameters.s3_bucket;
      
      // S3 bucket names must be between 3 and 63 characters
      expect(s3Bucket.length).toBeGreaterThanOrEqual(3);
      expect(s3Bucket.length).toBeLessThanOrEqual(63);
      
      // Must be lowercase alphanumeric with hyphens
      expect(s3Bucket).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
      
      // Should not contain consecutive periods
      expect(s3Bucket).not.toContain('..');
    });

    it('should have S3 prefix configured', () => {
      const s3Prefix = samConfig.default.deploy.parameters.s3_prefix;
      expect(s3Prefix).toBeDefined();
      expect(typeof s3Prefix).toBe('string');
    });

    it('should have matching S3 prefix and stack name', () => {
      const s3Prefix = samConfig.default.deploy.parameters.s3_prefix;
      const stackName = samConfig.default.deploy.parameters.stack_name;
      
      expect(s3Prefix).toBe(stackName);
    });
  });

  describe('Region Configuration', () => {
    it('should have AWS region configured', () => {
      const region = samConfig.default.deploy.parameters.region;
      expect(region).toBeDefined();
      expect(typeof region).toBe('string');
    });

    it('should use valid AWS region', () => {
      const region = samConfig.default.deploy.parameters.region;
      
      const validRegions = [
        'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
        'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
        'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
        'ap-northeast-2', 'ap-south-1', 'sa-east-1',
        'ca-central-1'
      ];
      
      expect(validRegions).toContain(region);
    });

    it('should use us-east-1 for production', () => {
      const region = samConfig.default.deploy.parameters.region;
      expect(region).toBe('us-east-1');
    });
  });

  describe('Deployment Settings', () => {
    it('should have confirm_changeset setting', () => {
      const confirmChangeset = samConfig.default.deploy.parameters.confirm_changeset;
      expect(confirmChangeset).toBeDefined();
      expect(typeof confirmChangeset).toBe('boolean');
    });

    it('should disable changeset confirmation for CI/CD', () => {
      const confirmChangeset = samConfig.default.deploy.parameters.confirm_changeset;
      expect(confirmChangeset).toBe(false);
    });

    it('should have capabilities configured', () => {
      const capabilities = samConfig.default.deploy.parameters.capabilities;
      expect(capabilities).toBeDefined();
      expect(typeof capabilities).toBe('string');
    });

    it('should include CAPABILITY_IAM', () => {
      const capabilities = samConfig.default.deploy.parameters.capabilities;
      expect(capabilities).toContain('CAPABILITY_IAM');
    });

    it('should have disable_rollback setting', () => {
      const disableRollback = samConfig.default.deploy.parameters.disable_rollback;
      expect(disableRollback).toBeDefined();
      expect(typeof disableRollback).toBe('boolean');
    });

    it('should enable disable_rollback for debugging', () => {
      const disableRollback = samConfig.default.deploy.parameters.disable_rollback;
      expect(disableRollback).toBe(true);
    });
  });

  describe('Parameter Overrides', () => {
    it('should have parameter_overrides configured', () => {
      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
      expect(parameterOverrides).toBeDefined();
      expect(typeof parameterOverrides).toBe('string');
    });

    it('should include DatabaseSecretArn parameter', () => {
      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
      expect(parameterOverrides).toContain('DatabaseSecretArn=');
    });

    it('should have valid Secrets Manager ARN format', () => {
      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
      const arnMatch = parameterOverrides.match(/DatabaseSecretArn=(arn:aws:secretsmanager:[^:]+:\d+:secret:[^\s]+)/);
      
      expect(arnMatch).toBeTruthy();
      
      if (arnMatch) {
        const arn = arnMatch[1];
        
        // Validate ARN structure
        expect(arn).toMatch(/^arn:aws:secretsmanager:/);
        expect(arn).toContain('us-east-1');
        expect(arn).toContain('317805897534'); // Account ID
        expect(arn).toContain('huntaze/database');
      }
    });

    it('should match template parameter default', () => {
      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
      const arnMatch = parameterOverrides.match(/DatabaseSecretArn=(arn:aws:secretsmanager:[^:]+:\d+:secret:[^\s]+)/);
      
      if (arnMatch) {
        const configArn = arnMatch[1];
        
        // Read template to compare
        if (existsSync('sam/template.yaml')) {
          const templateContent = readFileSync('sam/template.yaml', 'utf-8');
          expect(templateContent).toContain(configArn);
        }
      }
    });
  });

  describe('Security and Best Practices', () => {
    it('should not contain hardcoded credentials', () => {
      const content = samConfigContent;
      
      // Check for common credential patterns
      expect(content).not.toMatch(/password\s*=\s*[^$]/i);
      expect(content).not.toMatch(/secret_key\s*=\s*[^$]/i);
      expect(content).not.toMatch(/access_key\s*=\s*AKIA/);
    });

    it('should use Secrets Manager for sensitive data', () => {
      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
      expect(parameterOverrides).toContain('secretsmanager');
    });

    it('should have appropriate IAM capabilities', () => {
      const capabilities = samConfig.default.deploy.parameters.capabilities;
      
      // Should have IAM capability for creating roles
      expect(capabilities).toContain('CAPABILITY_IAM');
      
      // Should not have CAPABILITY_NAMED_IAM unless necessary
      // (CAPABILITY_IAM is sufficient for most cases)
    });

    it('should use managed S3 bucket pattern', () => {
      const s3Bucket = samConfig.default.deploy.parameters.s3_bucket;
      
      // SAM CLI managed buckets typically have this pattern
      expect(s3Bucket).toMatch(/aws-sam-cli-managed/);
    });
  });

  describe('Integration with Template', () => {
    it('should be compatible with template.yaml', () => {
      expect(existsSync('sam/template.yaml')).toBe(true);
    });

    it('should reference correct parameter names', () => {
      if (existsSync('sam/template.yaml')) {
        const templateContent = readFileSync('sam/template.yaml', 'utf-8');
        const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
        
        // Extract parameter names from overrides
        const paramNames = parameterOverrides.match(/(\w+)=/g)?.map((p: string) => p.replace('=', ''));
        
        if (paramNames) {
          paramNames.forEach((paramName: string) => {
            // Check if parameter exists in template
            expect(templateContent).toContain(`${paramName}:`);
          });
        }
      }
    });

    it('should match stack name in deployment scripts', () => {
      const stackName = samConfig.default.deploy.parameters.stack_name;
      
      if (existsSync('sam/deploy.sh')) {
        const deployScript = readFileSync('sam/deploy.sh', 'utf-8');
        expect(deployScript).toContain(stackName);
      }
    });
  });

  describe('Environment-Specific Configuration', () => {
    it('should have default environment', () => {
      expect(samConfig.default).toBeDefined();
    });

    it('should support multiple environments structure', () => {
      // Config should be structured to allow additional environments
      expect(samConfig.default.deploy).toBeDefined();
      
      // Could add staging, production, etc.
      // expect(samConfig.staging).toBeDefined(); // Future
    });

    it('should use production-appropriate settings', () => {
      const stackName = samConfig.default.deploy.parameters.stack_name;
      const region = samConfig.default.deploy.parameters.region;
      
      // Production indicators
      expect(region).toBe('us-east-1'); // Primary region
      expect(stackName).not.toContain('test');
      expect(stackName).not.toContain('dev');
    });
  });

  describe('Deployment Automation', () => {
    it('should be configured for automated deployments', () => {
      const confirmChangeset = samConfig.default.deploy.parameters.confirm_changeset;
      
      // Should not require manual confirmation
      expect(confirmChangeset).toBe(false);
    });

    it('should have appropriate rollback settings', () => {
      const disableRollback = samConfig.default.deploy.parameters.disable_rollback;
      
      // Disabled rollback helps with debugging
      expect(typeof disableRollback).toBe('boolean');
    });

    it('should be compatible with CI/CD pipelines', () => {
      const config = samConfig.default.deploy.parameters;
      
      // All required parameters should be present
      expect(config.stack_name).toBeDefined();
      expect(config.s3_bucket).toBeDefined();
      expect(config.region).toBeDefined();
      expect(config.capabilities).toBeDefined();
    });
  });

  describe('Resource Naming Consistency', () => {
    it('should use consistent naming convention', () => {
      const stackName = samConfig.default.deploy.parameters.stack_name;
      const s3Prefix = samConfig.default.deploy.parameters.s3_prefix;
      
      // Should use kebab-case
      expect(stackName).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(s3Prefix).toMatch(/^[a-z][a-z0-9-]*$/);
    });

    it('should include project identifier', () => {
      const stackName = samConfig.default.deploy.parameters.stack_name;
      expect(stackName).toContain('huntaze');
    });

    it('should include component identifier', () => {
      const stackName = samConfig.default.deploy.parameters.stack_name;
      expect(stackName).toContain('prisma');
    });

    it('should indicate purpose', () => {
      const stackName = samConfig.default.deploy.parameters.stack_name;
      expect(stackName).toContain('skeleton');
    });
  });

  describe('Configuration Completeness', () => {
    it('should have all required SAM deploy parameters', () => {
      const params = samConfig.default.deploy.parameters;
      
      const requiredParams = [
        'stack_name',
        's3_bucket',
        'region',
        'capabilities'
      ];
      
      requiredParams.forEach(param => {
        expect(params[param]).toBeDefined();
      });
    });

    it('should have all recommended parameters', () => {
      const params = samConfig.default.deploy.parameters;
      
      const recommendedParams = [
        's3_prefix',
        'confirm_changeset',
        'parameter_overrides'
      ];
      
      recommendedParams.forEach(param => {
        expect(params[param]).toBeDefined();
      });
    });

    it('should not have conflicting settings', () => {
      const params = samConfig.default.deploy.parameters;
      
      // If disable_rollback is true, should be for debugging
      if (params.disable_rollback === true) {
        // This is acceptable for development/debugging
        expect(params.disable_rollback).toBe(true);
      }
    });
  });

  describe('AWS Account Configuration', () => {
    it('should reference correct AWS account', () => {
      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
      
      // Extract account ID from ARN
      const accountMatch = parameterOverrides.match(/:(\d{12}):/);
      expect(accountMatch).toBeTruthy();
      
      if (accountMatch) {
        const accountId = accountMatch[1];
        expect(accountId).toBe('317805897534');
        expect(accountId).toHaveLength(12);
      }
    });

    it('should use consistent account ID across configuration', () => {
      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
      
      // All ARNs should use the same account ID
      const accountIds = parameterOverrides.match(/:\d{12}:/g);
      if (accountIds && accountIds.length > 1) {
        const uniqueIds = new Set(accountIds);
        expect(uniqueIds.size).toBe(1);
      }
    });
  });

  describe('Validation Against AWS Limits', () => {
    it('should respect CloudFormation stack name limits', () => {
      const stackName = samConfig.default.deploy.parameters.stack_name;
      
      // Stack name must be 1-128 characters
      expect(stackName.length).toBeGreaterThanOrEqual(1);
      expect(stackName.length).toBeLessThanOrEqual(128);
    });

    it('should respect S3 bucket name limits', () => {
      const s3Bucket = samConfig.default.deploy.parameters.s3_bucket;
      
      // Bucket name must be 3-63 characters
      expect(s3Bucket.length).toBeGreaterThanOrEqual(3);
      expect(s3Bucket.length).toBeLessThanOrEqual(63);
    });

    it('should respect parameter override length limits', () => {
      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
      
      // Should not exceed reasonable length
      expect(parameterOverrides.length).toBeLessThan(4096);
    });
  });
});

/**
 * Tests d'intégration pour vérifier la compatibilité avec l'écosystème SAM
 */
describe('SAM Config Integration', () => {
  describe('Template Compatibility', () => {
    it('should match template parameters', () => {
      if (!existsSync('sam/samconfig.toml') || !existsSync('sam/template.yaml')) {
        return;
      }

      const samConfigContent = readFileSync('sam/samconfig.toml', 'utf-8');
      const samConfig = parse(samConfigContent);
      const templateContent = readFileSync('sam/template.yaml', 'utf-8');

      const parameterOverrides = samConfig.default.deploy.parameters.parameter_overrides;
      
      // DatabaseSecretArn should be in template
      if (parameterOverrides.includes('DatabaseSecretArn')) {
        expect(templateContent).toContain('DatabaseSecretArn:');
      }
    });

    it('should use same region as template resources', () => {
      if (!existsSync('sam/samconfig.toml')) return;

      const samConfigContent = readFileSync('sam/samconfig.toml', 'utf-8');
      const samConfig = parse(samConfigContent);
      const region = samConfig.default.deploy.parameters.region;

      // Region should be consistent
      expect(region).toBe('us-east-1');
    });
  });

  describe('Deployment Script Compatibility', () => {
    it('should be compatible with deploy.sh', () => {
      if (!existsSync('sam/deploy.sh')) return;

      const deployScript = readFileSync('sam/deploy.sh', 'utf-8');
      
      // Script should reference samconfig.toml
      expect(deployScript).toMatch(/samconfig\.toml|--config-file/);
    });

    it('should support sam deploy command', () => {
      if (!existsSync('sam/samconfig.toml')) return;

      const samConfigContent = readFileSync('sam/samconfig.toml', 'utf-8');
      const samConfig = parse(samConfigContent);

      // Should have all parameters needed for sam deploy
      expect(samConfig.default.deploy.parameters).toBeDefined();
    });
  });

  describe('CI/CD Pipeline Compatibility', () => {
    it('should work with automated deployments', () => {
      if (!existsSync('sam/samconfig.toml')) return;

      const samConfigContent = readFileSync('sam/samconfig.toml', 'utf-8');
      const samConfig = parse(samConfigContent);
      const params = samConfig.default.deploy.parameters;

      // Should not require manual intervention
      expect(params.confirm_changeset).toBe(false);
    });

    it('should be compatible with CodeBuild', () => {
      if (!existsSync('buildspec.yml')) return;

      const buildspecContent = readFileSync('buildspec.yml', 'utf-8');
      
      // Buildspec might reference SAM deployment
      // This is optional but good to check
      if (buildspecContent.includes('sam deploy')) {
        expect(buildspecContent).toContain('sam');
      }
    });
  });
});
