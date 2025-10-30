/**
 * Tests for Terraform tfvars Configuration
 * Validates terraform.tfvars file for production hardening infrastructure
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Types for Terraform variables
interface TerraformVariables {
  aws_region: string;
  monthly_budget_limit: string;
  environment: string;
  tags: {
    Project: string;
    ManagedBy: string;
    Environment: string;
    Team?: string;
    [key: string]: string | undefined;
  };
}

// Valid AWS regions
const VALID_AWS_REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1'
];

// Valid environments
const VALID_ENVIRONMENTS = ['development', 'staging', 'production'];

describe('Terraform tfvars Configuration Validation', () => {
  let tfvarsContent: string;
  let parsedVariables: TerraformVariables;

  beforeEach(() => {
    // Read the actual terraform.tfvars file
    const tfvarsPath = path.join(
      process.cwd(),
      'infra/terraform/production-hardening/terraform.tfvars'
    );

    try {
      tfvarsContent = fs.readFileSync(tfvarsPath, 'utf-8');
      parsedVariables = parseTerraformVars(tfvarsContent);
    } catch (error) {
      throw new Error(`Failed to read terraform.tfvars: ${error}`);
    }
  });

  describe('File Structure and Format', () => {
    it('should exist and be readable', () => {
      expect(tfvarsContent).toBeDefined();
      expect(tfvarsContent.length).toBeGreaterThan(0);
    });

    it('should contain all required variables', () => {
      expect(parsedVariables).toHaveProperty('aws_region');
      expect(parsedVariables).toHaveProperty('monthly_budget_limit');
      expect(parsedVariables).toHaveProperty('environment');
      expect(parsedVariables).toHaveProperty('tags');
    });

    it('should have valid HCL syntax', () => {
      // Check for basic HCL syntax patterns
      expect(tfvarsContent).toMatch(/aws_region\s*=\s*"[^"]+"/);
      expect(tfvarsContent).toMatch(/monthly_budget_limit\s*=\s*"[^"]+"/);
      expect(tfvarsContent).toMatch(/environment\s*=\s*"[^"]+"/);
      expect(tfvarsContent).toMatch(/tags\s*=\s*\{/);
    });

    it('should not contain sensitive information in plain text', () => {
      const sensitivePatterns = [
        /password\s*=\s*"[^"]+"/i,
        /secret\s*=\s*"[^"]+"/i,
        /api[_-]?key\s*=\s*"[^"]+"/i,
        /access[_-]?key\s*=\s*"[^"]+"/i,
        /private[_-]?key\s*=\s*"[^"]+"/i
      ];

      sensitivePatterns.forEach(pattern => {
        expect(tfvarsContent).not.toMatch(pattern);
      });
    });
  });

  describe('AWS Region Configuration', () => {
    it('should have a valid AWS region', () => {
      expect(parsedVariables.aws_region).toBeDefined();
      expect(VALID_AWS_REGIONS).toContain(parsedVariables.aws_region);
    });

    it('should use us-east-1 for production', () => {
      expect(parsedVariables.aws_region).toBe('us-east-1');
    });

    it('should be a string value', () => {
      expect(typeof parsedVariables.aws_region).toBe('string');
    });

    it('should not be empty', () => {
      expect(parsedVariables.aws_region.trim()).not.toBe('');
    });

    it('should follow AWS region naming convention', () => {
      expect(parsedVariables.aws_region).toMatch(/^[a-z]{2}-[a-z]+-\d+$/);
    });
  });

  describe('Monthly Budget Limit Configuration', () => {
    it('should have a monthly budget limit defined', () => {
      expect(parsedVariables.monthly_budget_limit).toBeDefined();
    });

    it('should be a numeric string', () => {
      expect(parsedVariables.monthly_budget_limit).toMatch(/^\d+(\.\d+)?$/);
    });

    it('should be parseable as a number', () => {
      const budgetValue = parseFloat(parsedVariables.monthly_budget_limit);
      expect(budgetValue).not.toBeNaN();
      expect(budgetValue).toBeGreaterThan(0);
    });

    it('should be set to 500 USD for production', () => {
      expect(parsedVariables.monthly_budget_limit).toBe('500');
    });

    it('should be within reasonable limits', () => {
      const budgetValue = parseFloat(parsedVariables.monthly_budget_limit);
      expect(budgetValue).toBeGreaterThanOrEqual(100); // Minimum $100
      expect(budgetValue).toBeLessThanOrEqual(10000); // Maximum $10,000
    });

    it('should not have decimal places for simplicity', () => {
      expect(parsedVariables.monthly_budget_limit).not.toContain('.');
    });
  });

  describe('Environment Configuration', () => {
    it('should have an environment defined', () => {
      expect(parsedVariables.environment).toBeDefined();
    });

    it('should be a valid environment value', () => {
      expect(VALID_ENVIRONMENTS).toContain(parsedVariables.environment);
    });

    it('should be set to production', () => {
      expect(parsedVariables.environment).toBe('production');
    });

    it('should be lowercase', () => {
      expect(parsedVariables.environment).toBe(parsedVariables.environment.toLowerCase());
    });

    it('should not contain spaces or special characters', () => {
      expect(parsedVariables.environment).toMatch(/^[a-z]+$/);
    });
  });

  describe('Tags Configuration', () => {
    it('should have tags defined', () => {
      expect(parsedVariables.tags).toBeDefined();
      expect(typeof parsedVariables.tags).toBe('object');
    });

    it('should have required tag keys', () => {
      expect(parsedVariables.tags).toHaveProperty('Project');
      expect(parsedVariables.tags).toHaveProperty('ManagedBy');
      expect(parsedVariables.tags).toHaveProperty('Environment');
    });

    it('should have Project tag set to huntaze', () => {
      expect(parsedVariables.tags.Project).toBe('huntaze');
    });

    it('should have ManagedBy tag set to terraform', () => {
      expect(parsedVariables.tags.ManagedBy).toBe('terraform');
    });

    it('should have Environment tag matching environment variable', () => {
      expect(parsedVariables.tags.Environment).toBe(parsedVariables.environment);
    });

    it('should have Team tag defined', () => {
      expect(parsedVariables.tags).toHaveProperty('Team');
      expect(parsedVariables.tags.Team).toBe('platform');
    });

    it('should have all tag values as strings', () => {
      Object.values(parsedVariables.tags).forEach(value => {
        expect(typeof value).toBe('string');
      });
    });

    it('should not have empty tag values', () => {
      Object.entries(parsedVariables.tags).forEach(([key, value]) => {
        expect(value?.trim()).not.toBe('');
      });
    });

    it('should follow AWS tag naming conventions', () => {
      Object.keys(parsedVariables.tags).forEach(key => {
        // AWS allows alphanumeric, spaces, and +-=._:/@
        expect(key).toMatch(/^[a-zA-Z0-9\s\+\-=._:/@]+$/);
        expect(key.length).toBeLessThanOrEqual(128);
      });
    });

    it('should have tag values within AWS limits', () => {
      Object.values(parsedVariables.tags).forEach(value => {
        if (value) {
          expect(value.length).toBeLessThanOrEqual(256);
        }
      });
    });
  });

  describe('Configuration Consistency', () => {
    it('should have consistent environment values', () => {
      expect(parsedVariables.environment).toBe(parsedVariables.tags.Environment);
    });

    it('should have production-appropriate budget', () => {
      if (parsedVariables.environment === 'production') {
        const budget = parseFloat(parsedVariables.monthly_budget_limit);
        expect(budget).toBeGreaterThanOrEqual(500);
      }
    });

    it('should use production region for production environment', () => {
      if (parsedVariables.environment === 'production') {
        expect(['us-east-1', 'us-west-2', 'eu-west-1']).toContain(parsedVariables.aws_region);
      }
    });
  });

  describe('Security and Best Practices', () => {
    it('should not contain hardcoded credentials', () => {
      const credentialPatterns = [
        /AKIA[0-9A-Z]{16}/,  // AWS Access Key
        /[0-9a-zA-Z/+=]{40}/, // AWS Secret Key pattern
        /ghp_[a-zA-Z0-9]{36}/, // GitHub token
        /sk-[a-zA-Z0-9]{48}/   // OpenAI API key
      ];

      credentialPatterns.forEach(pattern => {
        expect(tfvarsContent).not.toMatch(pattern);
      });
    });

    it('should not contain IP addresses', () => {
      const ipPattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
      expect(tfvarsContent).not.toMatch(ipPattern);
    });

    it('should not contain email addresses', () => {
      const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      expect(tfvarsContent).not.toMatch(emailPattern);
    });

    it('should use proper quoting for string values', () => {
      const lines = tfvarsContent.split('\n');
      lines.forEach(line => {
        if (line.includes('=') && !line.trim().startsWith('#')) {
          const value = line.split('=')[1]?.trim();
          if (value && !value.startsWith('{') && !value.startsWith('[')) {
            expect(value).toMatch(/^".*"$/);
          }
        }
      });
    });
  });

  describe('Terraform Compatibility', () => {
    it('should be compatible with Terraform >= 1.0', () => {
      // Check that variable syntax is compatible
      expect(tfvarsContent).not.toMatch(/\$\{/); // Old interpolation syntax
    });

    it('should use proper map syntax for tags', () => {
      expect(tfvarsContent).toMatch(/tags\s*=\s*\{[\s\S]*\}/);
    });

    it('should have proper line endings', () => {
      // Should not have Windows line endings in production
      expect(tfvarsContent).not.toContain('\r\n');
    });

    it('should have consistent indentation', () => {
      const lines = tfvarsContent.split('\n');
      const indentedLines = lines.filter(line => line.startsWith(' '));
      
      indentedLines.forEach(line => {
        const spaces = line.match(/^ +/)?.[0].length || 0;
        expect(spaces % 2).toBe(0); // Should use 2-space indentation
      });
    });
  });

  describe('Documentation and Comments', () => {
    it('should not have TODO comments in production config', () => {
      expect(tfvarsContent.toLowerCase()).not.toContain('todo');
      expect(tfvarsContent.toLowerCase()).not.toContain('fixme');
    });

    it('should not have debug or test values', () => {
      expect(tfvarsContent.toLowerCase()).not.toContain('test');
      expect(tfvarsContent.toLowerCase()).not.toContain('debug');
      expect(tfvarsContent.toLowerCase()).not.toContain('dummy');
    });
  });

  describe('Integration with main.tf', () => {
    it('should provide all variables required by main.tf', () => {
      const mainTfPath = path.join(
        process.cwd(),
        'infra/terraform/production-hardening/main.tf'
      );

      if (fs.existsSync(mainTfPath)) {
        const mainTfContent = fs.readFileSync(mainTfPath, 'utf-8');
        
        // Check that all var. references in main.tf have corresponding tfvars
        const varReferences = mainTfContent.match(/var\.[a-z_]+/g) || [];
        const uniqueVars = [...new Set(varReferences.map(v => v.replace('var.', '')))];

        uniqueVars.forEach(varName => {
          expect(parsedVariables).toHaveProperty(varName);
        });
      }
    });

    it('should have budget limit compatible with AWS Budgets resource', () => {
      const budget = parseFloat(parsedVariables.monthly_budget_limit);
      expect(budget).toBeGreaterThan(0);
      expect(budget).toBeLessThan(1000000); // AWS Budgets limit
    });

    it('should have tags compatible with all AWS resources', () => {
      // AWS has a limit of 50 tags per resource
      const tagCount = Object.keys(parsedVariables.tags).length;
      expect(tagCount).toBeLessThanOrEqual(50);
    });
  });

  describe('Cost Optimization', () => {
    it('should have reasonable budget for production workload', () => {
      const budget = parseFloat(parsedVariables.monthly_budget_limit);
      
      // For Huntaze production with hybrid orchestrator
      expect(budget).toBeGreaterThanOrEqual(500);
      expect(budget).toBeLessThanOrEqual(2000);
    });

    it('should enable cost tracking through tags', () => {
      expect(parsedVariables.tags.Project).toBeDefined();
      expect(parsedVariables.tags.Environment).toBeDefined();
      expect(parsedVariables.tags.Team).toBeDefined();
    });
  });

  describe('Regression Tests', () => {
    it('should maintain backward compatibility with existing infrastructure', () => {
      // Ensure critical variables haven't changed
      expect(parsedVariables.aws_region).toBe('us-east-1');
      expect(parsedVariables.environment).toBe('production');
      expect(parsedVariables.tags.Project).toBe('huntaze');
    });

    it('should not introduce breaking changes to variable types', () => {
      expect(typeof parsedVariables.aws_region).toBe('string');
      expect(typeof parsedVariables.monthly_budget_limit).toBe('string');
      expect(typeof parsedVariables.environment).toBe('string');
      expect(typeof parsedVariables.tags).toBe('object');
    });
  });
});

// Helper function to parse Terraform variables from tfvars content
function parseTerraformVars(content: string): TerraformVariables {
  const variables: any = {};

  // Parse simple string variables
  const stringVarPattern = /(\w+)\s*=\s*"([^"]*)"/g;
  let match;
  while ((match = stringVarPattern.exec(content)) !== null) {
    variables[match[1]] = match[2];
  }

  // Parse tags map
  const tagsMatch = content.match(/tags\s*=\s*\{([^}]+)\}/s);
  if (tagsMatch) {
    variables.tags = {};
    const tagContent = tagsMatch[1];
    const tagPattern = /(\w+)\s*=\s*"([^"]*)"/g;
    let tagMatch;
    while ((tagMatch = tagPattern.exec(tagContent)) !== null) {
      variables.tags[tagMatch[1]] = tagMatch[2];
    }
  }

  return variables as TerraformVariables;
}
