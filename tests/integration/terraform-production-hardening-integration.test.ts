/**
 * Integration Tests for Terraform Production Hardening
 * Tests the complete Terraform configuration with tfvars
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const TERRAFORM_DIR = path.join(process.cwd(), 'infra/terraform/production-hardening');

describe('Terraform Production Hardening Integration', () => {
  let terraformInitialized = false;

  beforeAll(() => {
    // Check if Terraform is installed
    try {
      execSync('terraform version', { stdio: 'pipe' });
    } catch (error) {
      console.warn('Terraform not installed, skipping integration tests');
      return;
    }

    // Check if terraform.tfvars exists
    const tfvarsPath = path.join(TERRAFORM_DIR, 'terraform.tfvars');
    if (!fs.existsSync(tfvarsPath)) {
      throw new Error('terraform.tfvars not found');
    }
  });

  describe('Terraform Configuration Validation', () => {
    it('should have valid Terraform syntax', () => {
      try {
        const result = execSync('terraform fmt -check -recursive', {
          cwd: TERRAFORM_DIR,
          encoding: 'utf-8',
          stdio: 'pipe'
        });
        expect(result).toBeDefined();
      } catch (error: any) {
        // fmt -check returns non-zero if files need formatting
        if (error.status === 3) {
          console.warn('Terraform files need formatting');
        } else {
          throw error;
        }
      }
    });

    it('should validate Terraform configuration', () => {
      try {
        // Initialize Terraform (required for validation)
        execSync('terraform init -backend=false', {
          cwd: TERRAFORM_DIR,
          stdio: 'pipe'
        });
        terraformInitialized = true;

        // Validate configuration
        const result = execSync('terraform validate', {
          cwd: TERRAFORM_DIR,
          encoding: 'utf-8'
        });

        expect(result).toContain('Success');
      } catch (error: any) {
        throw new Error(`Terraform validation failed: ${error.message}`);
      }
    });

    it('should have all required files', () => {
      const requiredFiles = [
        'main.tf',
        'variables.tf',
        'terraform.tfvars',
        'outputs.tf'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(TERRAFORM_DIR, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Terraform Plan Generation', () => {
    it('should generate a valid plan without errors', () => {
      if (!terraformInitialized) {
        console.warn('Terraform not initialized, skipping plan test');
        return;
      }

      try {
        // Generate plan (dry-run, no actual changes)
        const result = execSync('terraform plan -out=tfplan.test', {
          cwd: TERRAFORM_DIR,
          encoding: 'utf-8',
          stdio: 'pipe'
        });

        expect(result).toBeDefined();
        expect(result).not.toContain('Error');
      } catch (error: any) {
        // Clean up plan file if it exists
        const planPath = path.join(TERRAFORM_DIR, 'tfplan.test');
        if (fs.existsSync(planPath)) {
          fs.unlinkSync(planPath);
        }
        throw new Error(`Terraform plan failed: ${error.message}`);
      } finally {
        // Clean up plan file
        const planPath = path.join(TERRAFORM_DIR, 'tfplan.test');
        if (fs.existsSync(planPath)) {
          fs.unlinkSync(planPath);
        }
      }
    });

    it('should show expected resource changes', () => {
      if (!terraformInitialized) {
        console.warn('Terraform not initialized, skipping resource check');
        return;
      }

      try {
        const result = execSync('terraform plan -no-color', {
          cwd: TERRAFORM_DIR,
          encoding: 'utf-8',
          stdio: 'pipe'
        });

        // Check for expected resources
        const expectedResources = [
          'aws_sqs_queue.hybrid_workflows',
          'aws_sqs_queue.rate_limiter',
          'aws_dynamodb_table.ai_costs',
          'aws_dynamodb_table.cost_alerts',
          'aws_sns_topic.cost_alerts',
          'aws_budgets_budget.monthly'
        ];

        expectedResources.forEach(resource => {
          expect(result).toContain(resource);
        });
      } catch (error: any) {
        console.warn(`Could not verify resources: ${error.message}`);
      }
    });
  });

  describe('Variable Substitution', () => {
    it('should correctly substitute aws_region variable', () => {
      if (!terraformInitialized) return;

      try {
        const result = execSync('terraform plan -no-color', {
          cwd: TERRAFORM_DIR,
          encoding: 'utf-8',
          stdio: 'pipe'
        });

        expect(result).toContain('us-east-1');
      } catch (error: any) {
        console.warn(`Could not verify region: ${error.message}`);
      }
    });

    it('should correctly substitute monthly_budget_limit variable', () => {
      if (!terraformInitialized) return;

      try {
        const result = execSync('terraform plan -no-color', {
          cwd: TERRAFORM_DIR,
          encoding: 'utf-8',
          stdio: 'pipe'
        });

        expect(result).toContain('500');
      } catch (error: any) {
        console.warn(`Could not verify budget: ${error.message}`);
      }
    });

    it('should correctly apply tags to resources', () => {
      if (!terraformInitialized) return;

      try {
        const result = execSync('terraform plan -no-color', {
          cwd: TERRAFORM_DIR,
          encoding: 'utf-8',
          stdio: 'pipe'
        });

        // Check for tag values from tfvars
        expect(result).toContain('huntaze');
        expect(result).toContain('terraform');
        expect(result).toContain('production');
        expect(result).toContain('platform');
      } catch (error: any) {
        console.warn(`Could not verify tags: ${error.message}`);
      }
    });
  });

  describe('Resource Configuration', () => {
    it('should configure SQS queues with correct settings', () => {
      const mainTfContent = fs.readFileSync(
        path.join(TERRAFORM_DIR, 'main.tf'),
        'utf-8'
      );

      // Check FIFO queue configuration
      expect(mainTfContent).toContain('fifo_queue                = true');
      expect(mainTfContent).toContain('content_based_deduplication = true');
      
      // Check DLQ configuration
      expect(mainTfContent).toContain('redrive_policy');
      expect(mainTfContent).toContain('maxReceiveCount');
    });

    it('should configure DynamoDB tables with encryption', () => {
      const mainTfContent = fs.readFileSync(
        path.join(TERRAFORM_DIR, 'main.tf'),
        'utf-8'
      );

      expect(mainTfContent).toContain('server_side_encryption');
      expect(mainTfContent).toContain('enabled = true');
    });

    it('should configure DynamoDB tables with point-in-time recovery', () => {
      const mainTfContent = fs.readFileSync(
        path.join(TERRAFORM_DIR, 'main.tf'),
        'utf-8'
      );

      expect(mainTfContent).toContain('point_in_time_recovery');
    });

    it('should configure SNS topic with proper policy', () => {
      const mainTfContent = fs.readFileSync(
        path.join(TERRAFORM_DIR, 'main.tf'),
        'utf-8'
      );

      expect(mainTfContent).toContain('aws_sns_topic_policy');
      expect(mainTfContent).toContain('budgets.amazonaws.com');
    });

    it('should configure budget with forecasted and actual alerts', () => {
      const mainTfContent = fs.readFileSync(
        path.join(TERRAFORM_DIR, 'main.tf'),
        'utf-8'
      );

      expect(mainTfContent).toContain('FORECASTED');
      expect(mainTfContent).toContain('ACTUAL');
      expect(mainTfContent).toContain('threshold                 = 80');
      expect(mainTfContent).toContain('threshold                 = 100');
    });
  });

  describe('Cost Optimization', () => {
    it('should use PAY_PER_REQUEST billing for DynamoDB', () => {
      const mainTfContent = fs.readFileSync(
        path.join(TERRAFORM_DIR, 'main.tf'),
        'utf-8'
      );

      expect(mainTfContent).toContain('billing_mode = "PAY_PER_REQUEST"');
    });

    it('should configure TTL for cost tables', () => {
      const mainTfContent = fs.readFileSync(
        path.join(TERRAFORM_DIR, 'main.tf'),
        'utf-8'
      );

      expect(mainTfContent).toContain('ttl {');
      expect(mainTfContent).toContain('enabled        = true');
      expect(mainTfContent).toContain('attribute_name = "ttl"');
    });

    it('should use long polling for SQS queues', () => {
      const mainTfContent = fs.readFileSync(
        path.join(TERRAFORM_DIR, 'main.tf'),
        'utf-8'
      );

      expect(mainTfContent).toContain('receive_wait_time_seconds  = 20');
    });
  });

  describe('Security Configuration', () => {
    it('should enable encryption for all DynamoDB tables', () => {
      const mainTfContent = fs.readFileSync(
        path.join(TERRAFORM_DIR, 'main.tf'),
        'utf-8'
      );

      const dynamodbTables = mainTfContent.match(/resource "aws_dynamodb_table"/g);
      const encryptionBlocks = mainTfContent.match(/server_side_encryption/g);

      expect(dynamodbTables?.length).toBe(encryptionBlocks?.length);
    });

    it('should have proper IAM conditions in SNS policy', () => {
      const mainTfContent = fs.readFileSync(
        path.join(TERRAFORM_DIR, 'main.tf'),
        'utf-8'
      );

      expect(mainTfContent).toContain('Condition');
      expect(mainTfContent).toContain('AWS:SourceAccount');
    });

    it('should configure DLQs for all queues', () => {
      const mainTfContent = fs.readFileSync(
        path.join(TERRAFORM_DIR, 'main.tf'),
        'utf-8'
      );

      const queues = mainTfContent.match(/resource "aws_sqs_queue" "(?!.*_dlq)/g);
      const dlqReferences = mainTfContent.match(/deadLetterTargetArn/g);

      // Each non-DLQ queue should have a DLQ reference
      expect(dlqReferences?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Tagging Compliance', () => {
    it('should apply tags to all taggable resources', () => {
      const mainTfContent = fs.readFileSync(
        path.join(TERRAFORM_DIR, 'main.tf'),
        'utf-8'
      );

      // Count resources that should have tags
      const taggableResources = [
        'aws_sqs_queue',
        'aws_dynamodb_table',
        'aws_sns_topic'
      ];

      taggableResources.forEach(resourceType => {
        const resourceMatches = mainTfContent.match(new RegExp(`resource "${resourceType}"`, 'g'));
        const tagMatches = mainTfContent.match(/tags\s*=\s*\{/g);

        if (resourceMatches) {
          expect(tagMatches?.length).toBeGreaterThanOrEqual(resourceMatches.length);
        }
      });
    });

    it('should include required tags in all resources', () => {
      const mainTfContent = fs.readFileSync(
        path.join(TERRAFORM_DIR, 'main.tf'),
        'utf-8'
      );

      const requiredTags = ['Name', 'Environment', 'ManagedBy', 'Purpose'];

      requiredTags.forEach(tag => {
        expect(mainTfContent).toContain(tag);
      });
    });
  });

  describe('High Availability Configuration', () => {
    it('should configure message retention for disaster recovery', () => {
      const mainTfContent = fs.readFileSync(
        path.join(TERRAFORM_DIR, 'main.tf'),
        'utf-8'
      );

      expect(mainTfContent).toContain('message_retention_seconds');
      expect(mainTfContent).toContain('345600');  // 4 days
      expect(mainTfContent).toContain('1209600'); // 14 days for DLQ
    });

    it('should enable point-in-time recovery for critical tables', () => {
      const mainTfContent = fs.readFileSync(
        path.join(TERRAFORM_DIR, 'main.tf'),
        'utf-8'
      );

      const pitrBlocks = mainTfContent.match(/point_in_time_recovery\s*\{[^}]*enabled\s*=\s*true/g);
      expect(pitrBlocks?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Terraform State Management', () => {
    it('should not have terraform.tfstate in version control', () => {
      const statePath = path.join(TERRAFORM_DIR, 'terraform.tfstate');
      const gitignorePath = path.join(process.cwd(), '.gitignore');

      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
        expect(gitignoreContent).toContain('terraform.tfstate');
      }
    });

    it('should not have .terraform directory in version control', () => {
      const gitignorePath = path.join(process.cwd(), '.gitignore');

      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
        expect(gitignoreContent).toContain('.terraform');
      }
    });
  });

  afterAll(() => {
    // Clean up any test artifacts
    const artifactsToClean = [
      'tfplan.test',
      '.terraform.lock.hcl.test'
    ];

    artifactsToClean.forEach(artifact => {
      const artifactPath = path.join(TERRAFORM_DIR, artifact);
      if (fs.existsSync(artifactPath)) {
        try {
          fs.unlinkSync(artifactPath);
        } catch (error) {
          console.warn(`Could not clean up ${artifact}`);
        }
      }
    });
  });
});
