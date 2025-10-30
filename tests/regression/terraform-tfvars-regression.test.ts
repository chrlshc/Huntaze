/**
 * Regression Tests for Terraform tfvars Configuration
 * Ensures configuration changes don't break existing infrastructure
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Terraform tfvars Regression Tests', () => {
  let tfvarsContent: string;
  const tfvarsPath = path.join(
    process.cwd(),
    'infra/terraform/production-hardening/terraform.tfvars'
  );

  beforeEach(() => {
    tfvarsContent = fs.readFileSync(tfvarsPath, 'utf-8');
  });

  describe('Critical Configuration Stability', () => {
    it('should maintain aws_region as us-east-1', () => {
      expect(tfvarsContent).toContain('aws_region = "us-east-1"');
    });

    it('should maintain environment as production', () => {
      expect(tfvarsContent).toContain('environment = "production"');
    });

    it('should maintain Project tag as huntaze', () => {
      expect(tfvarsContent).toContain('Project     = "huntaze"');
    });

    it('should maintain ManagedBy tag as terraform', () => {
      expect(tfvarsContent).toContain('ManagedBy   = "terraform"');
    });

    it('should not change variable names', () => {
      const expectedVariables = [
        'aws_region',
        'monthly_budget_limit',
        'environment',
        'tags'
      ];

      expectedVariables.forEach(varName => {
        expect(tfvarsContent).toContain(varName);
      });
    });
  });

  describe('Budget Configuration Stability', () => {
    it('should maintain monthly budget at or above $500', () => {
      const budgetMatch = tfvarsContent.match(/monthly_budget_limit\s*=\s*"(\d+)"/);
      expect(budgetMatch).toBeTruthy();
      
      if (budgetMatch) {
        const budget = parseInt(budgetMatch[1]);
        expect(budget).toBeGreaterThanOrEqual(500);
      }
    });

    it('should not accidentally change budget to unrealistic values', () => {
      const budgetMatch = tfvarsContent.match(/monthly_budget_limit\s*=\s*"(\d+)"/);
      
      if (budgetMatch) {
        const budget = parseInt(budgetMatch[1]);
        expect(budget).toBeLessThan(100000); // Sanity check
        expect(budget).toBeGreaterThan(0);
      }
    });
  });

  describe('Tag Structure Stability', () => {
    it('should maintain tags as a map structure', () => {
      expect(tfvarsContent).toMatch(/tags\s*=\s*\{/);
      expect(tfvarsContent).toContain('}');
    });

    it('should maintain all required tag keys', () => {
      const requiredTags = ['Project', 'ManagedBy', 'Environment', 'Team'];
      
      requiredTags.forEach(tag => {
        expect(tfvarsContent).toContain(tag);
      });
    });

    it('should not remove existing tags', () => {
      const tagPattern = /(\w+)\s*=\s*"[^"]+"/g;
      const tagsSection = tfvarsContent.match(/tags\s*=\s*\{([^}]+)\}/s);
      
      if (tagsSection) {
        const tags = tagsSection[1].match(tagPattern);
        expect(tags?.length).toBeGreaterThanOrEqual(4);
      }
    });
  });

  describe('Format and Syntax Stability', () => {
    it('should maintain HCL format', () => {
      expect(tfvarsContent).toMatch(/\w+\s*=\s*"[^"]*"/);
    });

    it('should not introduce syntax errors', () => {
      // Check for common syntax errors
      const openBraces = (tfvarsContent.match(/\{/g) || []).length;
      const closeBraces = (tfvarsContent.match(/\}/g) || []).length;
      expect(openBraces).toBe(closeBraces);

      const openQuotes = (tfvarsContent.match(/"/g) || []).length;
      expect(openQuotes % 2).toBe(0);
    });

    it('should maintain consistent indentation', () => {
      const lines = tfvarsContent.split('\n');
      const indentedLines = lines.filter(line => line.startsWith(' '));
      
      indentedLines.forEach(line => {
        const spaces = line.match(/^ +/)?.[0].length || 0;
        expect(spaces % 2).toBe(0);
      });
    });

    it('should not introduce trailing whitespace', () => {
      const lines = tfvarsContent.split('\n');
      lines.forEach(line => {
        if (line.length > 0) {
          expect(line).not.toMatch(/\s+$/);
        }
      });
    });
  });

  describe('Security Regression', () => {
    it('should not introduce hardcoded credentials', () => {
      const sensitivePatterns = [
        /AKIA[0-9A-Z]{16}/,
        /[0-9a-zA-Z/+=]{40}/,
        /password\s*=\s*"[^"]+"/i,
        /secret\s*=\s*"[^"]+"/i,
        /api[_-]?key\s*=\s*"[^"]+"/i
      ];

      sensitivePatterns.forEach(pattern => {
        expect(tfvarsContent).not.toMatch(pattern);
      });
    });

    it('should not introduce email addresses', () => {
      expect(tfvarsContent).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    });

    it('should not introduce IP addresses', () => {
      expect(tfvarsContent).not.toMatch(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    });
  });

  describe('Compatibility Regression', () => {
    it('should remain compatible with variables.tf', () => {
      const variablesTfPath = path.join(
        process.cwd(),
        'infra/terraform/production-hardening/variables.tf'
      );

      if (fs.existsSync(variablesTfPath)) {
        const variablesTfContent = fs.readFileSync(variablesTfPath, 'utf-8');
        
        // Extract variable names from variables.tf
        const variableMatches = variablesTfContent.matchAll(/variable\s+"([^"]+)"/g);
        const definedVariables = Array.from(variableMatches).map(m => m[1]);

        // Check that tfvars provides values for all variables
        definedVariables.forEach(varName => {
          expect(tfvarsContent).toContain(varName);
        });
      }
    });

    it('should remain compatible with main.tf resource references', () => {
      const mainTfPath = path.join(
        process.cwd(),
        'infra/terraform/production-hardening/main.tf'
      );

      if (fs.existsSync(mainTfPath)) {
        const mainTfContent = fs.readFileSync(mainTfPath, 'utf-8');
        
        // Check that all var. references have corresponding tfvars
        const varReferences = mainTfContent.match(/var\.(\w+)/g) || [];
        const uniqueVars = [...new Set(varReferences.map(v => v.replace('var.', '')))];

        uniqueVars.forEach(varName => {
          expect(tfvarsContent).toContain(varName);
        });
      }
    });
  });

  describe('Value Range Regression', () => {
    it('should maintain budget within operational range', () => {
      const budgetMatch = tfvarsContent.match(/monthly_budget_limit\s*=\s*"(\d+)"/);
      
      if (budgetMatch) {
        const budget = parseInt(budgetMatch[1]);
        expect(budget).toBeGreaterThanOrEqual(100);
        expect(budget).toBeLessThanOrEqual(10000);
      }
    });

    it('should maintain valid AWS region', () => {
      const validRegions = [
        'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
        'eu-west-1', 'eu-west-2', 'eu-central-1',
        'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1'
      ];

      const regionMatch = tfvarsContent.match(/aws_region\s*=\s*"([^"]+)"/);
      expect(regionMatch).toBeTruthy();
      
      if (regionMatch) {
        expect(validRegions).toContain(regionMatch[1]);
      }
    });

    it('should maintain valid environment value', () => {
      const validEnvironments = ['development', 'staging', 'production'];
      const envMatch = tfvarsContent.match(/environment\s*=\s*"([^"]+)"/);
      
      expect(envMatch).toBeTruthy();
      if (envMatch) {
        expect(validEnvironments).toContain(envMatch[1]);
      }
    });
  });

  describe('Documentation Regression', () => {
    it('should not introduce TODO or FIXME comments', () => {
      expect(tfvarsContent.toLowerCase()).not.toContain('todo');
      expect(tfvarsContent.toLowerCase()).not.toContain('fixme');
      expect(tfvarsContent.toLowerCase()).not.toContain('hack');
    });

    it('should not introduce test or debug values', () => {
      expect(tfvarsContent.toLowerCase()).not.toContain('test');
      expect(tfvarsContent.toLowerCase()).not.toContain('debug');
      expect(tfvarsContent.toLowerCase()).not.toContain('dummy');
      expect(tfvarsContent.toLowerCase()).not.toContain('example');
    });
  });

  describe('File Size and Complexity Regression', () => {
    it('should maintain reasonable file size', () => {
      const fileSize = Buffer.byteLength(tfvarsContent, 'utf-8');
      expect(fileSize).toBeLessThan(10000); // 10KB max
      expect(fileSize).toBeGreaterThan(100); // At least 100 bytes
    });

    it('should maintain reasonable line count', () => {
      const lines = tfvarsContent.split('\n');
      expect(lines.length).toBeLessThan(100);
      expect(lines.length).toBeGreaterThan(5);
    });

    it('should not have excessively long lines', () => {
      const lines = tfvarsContent.split('\n');
      lines.forEach(line => {
        expect(line.length).toBeLessThan(200);
      });
    });
  });

  describe('Change Detection', () => {
    it('should detect if critical values have changed', () => {
      const criticalValues = {
        aws_region: 'us-east-1',
        environment: 'production',
        project: 'huntaze',
        managedBy: 'terraform'
      };

      expect(tfvarsContent).toContain(`aws_region = "${criticalValues.aws_region}"`);
      expect(tfvarsContent).toContain(`environment = "${criticalValues.environment}"`);
      expect(tfvarsContent).toContain(`Project     = "${criticalValues.project}"`);
      expect(tfvarsContent).toContain(`ManagedBy   = "${criticalValues.managedBy}"`);
    });

    it('should maintain tag structure consistency', () => {
      const tagLines = tfvarsContent.match(/tags\s*=\s*\{([^}]+)\}/s);
      expect(tagLines).toBeTruthy();
      
      if (tagLines) {
        const tagContent = tagLines[1];
        const tagCount = (tagContent.match(/=/g) || []).length;
        expect(tagCount).toBeGreaterThanOrEqual(4);
        expect(tagCount).toBeLessThanOrEqual(20);
      }
    });
  });

  describe('Backward Compatibility', () => {
    it('should not break existing Terraform state', () => {
      // Ensure variable names haven't changed
      const variableNames = [
        'aws_region',
        'monthly_budget_limit',
        'environment',
        'tags'
      ];

      variableNames.forEach(name => {
        const pattern = new RegExp(`${name}\\s*=`);
        expect(tfvarsContent).toMatch(pattern);
      });
    });

    it('should maintain tag key naming convention', () => {
      const tagPattern = /(\w+)\s*=\s*"[^"]+"/g;
      const tagsSection = tfvarsContent.match(/tags\s*=\s*\{([^}]+)\}/s);
      
      if (tagsSection) {
        const matches = tagsSection[1].matchAll(tagPattern);
        for (const match of matches) {
          const tagKey = match[1];
          // Tag keys should be PascalCase
          expect(tagKey).toMatch(/^[A-Z][a-zA-Z]*$/);
        }
      }
    });
  });

  describe('Production Safety Checks', () => {
    it('should not accidentally set environment to non-production', () => {
      expect(tfvarsContent).toContain('environment = "production"');
      expect(tfvarsContent).not.toContain('environment = "development"');
      expect(tfvarsContent).not.toContain('environment = "staging"');
    });

    it('should not accidentally reduce budget below minimum', () => {
      const budgetMatch = tfvarsContent.match(/monthly_budget_limit\s*=\s*"(\d+)"/);
      
      if (budgetMatch) {
        const budget = parseInt(budgetMatch[1]);
        expect(budget).toBeGreaterThanOrEqual(500);
      }
    });

    it('should maintain production region', () => {
      const productionRegions = ['us-east-1', 'us-west-2', 'eu-west-1'];
      const regionMatch = tfvarsContent.match(/aws_region\s*=\s*"([^"]+)"/);
      
      if (regionMatch) {
        expect(productionRegions).toContain(regionMatch[1]);
      }
    });
  });
});
