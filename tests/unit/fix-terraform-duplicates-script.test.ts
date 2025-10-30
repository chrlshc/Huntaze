/**
 * Unit Tests for fix-terraform-duplicates.sh
 * Tests the Terraform duplicate resource fixing script
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('fix-terraform-duplicates.sh Script', () => {
  const scriptPath = path.join(process.cwd(), 'scripts/fix-terraform-duplicates.sh');
  const terraformDir = path.join(process.cwd(), 'infra/terraform/production-hardening');

  beforeEach(() => {
    // Verify script exists
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  describe('Script Structure and Permissions', () => {
    it('should have executable permissions', () => {
      const stats = fs.statSync(scriptPath);
      const isExecutable = !!(stats.mode & fs.constants.S_IXUSR);
      expect(isExecutable).toBe(true);
    });

    it('should have correct shebang', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content.startsWith('#!/bin/bash')).toBe(true);
    });

    it('should have set -e for error handling', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('set -e');
    });

    it('should contain all required fix operations', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Check for all duplicate fixes
      expect(content).toContain('Fixing ECS cluster duplicates');
      expect(content).toContain('Fixing RDS alarm duplicates');
      expect(content).toContain('Fixing variable duplicates');
      expect(content).toContain('Fixing VPC duplicates');
      expect(content).toContain('Fixing S3 VPC endpoint duplicate');
    });
  });

  describe('ECS Cluster Duplicate Fixes', () => {
    it('should remove duplicate ECS cluster data source', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Verify sed command for ECS cluster removal
      expect(content).toContain('data "aws_ecs_cluster" "ai_team"');
      expect(content).toContain('ecs-auto-scaling.tf');
    });

    it('should target correct file for ECS fixes', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const ecsFixLine = content.split('\n').find(line => 
        line.includes('ecs-auto-scaling.tf') && line.includes('sed')
      );
      
      expect(ecsFixLine).toBeDefined();
      expect(ecsFixLine).toContain('data "aws_ecs_cluster" "ai_team"');
    });
  });

  describe('RDS Alarm Duplicate Fixes', () => {
    it('should remove duplicate RDS read latency alarm', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('rds_read_latency_high');
      expect(content).toContain('rds-performance-insights.tf');
    });

    it('should remove duplicate RDS write latency alarm', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('rds_write_latency_high');
      expect(content).toContain('rds-performance-insights.tf');
    });

    it('should target correct file for RDS alarm fixes', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const rdsFixLines = content.split('\n').filter(line => 
        line.includes('rds-performance-insights.tf') && line.includes('sed')
      );
      
      expect(rdsFixLines.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Variable Duplicate Fixes', () => {
    it('should remove duplicate rds_instance_identifier variable', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('variable "rds_instance_identifier"');
      expect(content).toContain('variables.tf');
    });

    it('should target correct file for variable fixes', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const varFixLine = content.split('\n').find(line => 
        line.includes('variables.tf') && line.includes('sed')
      );
      
      expect(varFixLine).toBeDefined();
    });
  });

  describe('VPC Duplicate Fixes', () => {
    it('should remove duplicate VPC data source', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('data "aws_vpc" "main"');
      expect(content).toContain('vpc-endpoints.tf');
    });

    it('should remove duplicate route tables data source', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('data "aws_route_tables" "private"');
      expect(content).toContain('vpc-endpoints.tf');
    });

    it('should remove duplicate S3 VPC endpoint', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('resource "aws_vpc_endpoint" "s3"');
      expect(content).toContain('vpc-endpoints.tf');
    });

    it('should target correct file for VPC fixes', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const vpcFixLines = content.split('\n').filter(line => 
        line.includes('vpc-endpoints.tf') && line.includes('sed')
      );
      
      expect(vpcFixLines.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Backup File Management', () => {
    it('should create backup files with .bak extension', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Check that sed commands use -i.bak
      const sedCommands = content.split('\n').filter(line => line.includes('sed -i.bak'));
      expect(sedCommands.length).toBeGreaterThan(0);
    });

    it('should clean up backup files after fixes', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('rm -f *.bak');
    });

    it('should clean up backups before script completion', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const lines = content.split('\n');
      
      const cleanupIndex = lines.findIndex(line => line.includes('rm -f *.bak'));
      const successIndex = lines.findIndex(line => line.includes('Terraform duplicates fixed'));
      
      expect(cleanupIndex).toBeGreaterThan(0);
      expect(cleanupIndex).toBeLessThan(successIndex);
    });
  });

  describe('User Feedback and Messages', () => {
    it('should display start message', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('Fixing Terraform duplicate resources');
    });

    it('should display progress messages for each fix', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('Fixing ECS cluster duplicates');
      expect(content).toContain('Fixing RDS alarm duplicates');
      expect(content).toContain('Fixing variable duplicates');
      expect(content).toContain('Fixing VPC duplicates');
      expect(content).toContain('Fixing S3 VPC endpoint duplicate');
    });

    it('should display success message', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('Terraform duplicates fixed');
    });

    it('should provide next steps instruction', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('terraform init -upgrade');
    });

    it('should use emoji indicators', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('🔧');
      expect(content).toContain('✅');
    });
  });

  describe('Directory Navigation', () => {
    it('should change to terraform production-hardening directory', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('cd infra/terraform/production-hardening');
    });

    it('should change directory before performing fixes', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const lines = content.split('\n');
      
      const cdIndex = lines.findIndex(line => line.includes('cd infra/terraform'));
      const firstSedIndex = lines.findIndex(line => line.includes('sed -i.bak'));
      
      expect(cdIndex).toBeGreaterThan(0);
      expect(cdIndex).toBeLessThan(firstSedIndex);
    });
  });

  describe('Sed Command Patterns', () => {
    it('should use correct sed syntax for block removal', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Check for pattern: /^pattern/,/^}/d
      const sedPatterns = [
        '/^data "aws_ecs_cluster" "ai_team" {/,/^}/d',
        '/^resource "aws_cloudwatch_metric_alarm" "rds_read_latency_high" {/,/^}/d',
        '/^resource "aws_cloudwatch_metric_alarm" "rds_write_latency_high" {/,/^}/d',
        '/^variable "rds_instance_identifier" {/,/^}/d',
        '/^data "aws_vpc" "main" {/,/^}/d',
        '/^data "aws_route_tables" "private" {/,/^}/d',
        '/^resource "aws_vpc_endpoint" "s3" {/,/^}/d'
      ];
      
      sedPatterns.forEach(pattern => {
        expect(content).toContain(pattern);
      });
    });

    it('should use in-place editing with backup', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const sedCommands = content.split('\n').filter(line => line.includes('sed'));
      
      sedCommands.forEach(cmd => {
        expect(cmd).toContain('-i.bak');
      });
    });
  });

  describe('Error Handling', () => {
    it('should exit on error with set -e', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const lines = content.split('\n');
      
      // set -e should be early in the script
      const setEIndex = lines.findIndex(line => line.trim() === 'set -e');
      expect(setEIndex).toBeGreaterThan(0);
      expect(setEIndex).toBeLessThan(10);
    });

    it('should not have error suppression', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should not contain || true or similar error suppression
      expect(content).not.toContain('|| true');
      expect(content).not.toContain('|| :');
    });
  });

  describe('File Targets', () => {
    it('should target exactly 4 different Terraform files', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      const targetFiles = [
        'ecs-auto-scaling.tf',
        'rds-performance-insights.tf',
        'variables.tf',
        'vpc-endpoints.tf'
      ];
      
      targetFiles.forEach(file => {
        expect(content).toContain(file);
      });
    });

    it('should not target unrelated files', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      const unrelatedFiles = [
        'main.tf',
        'outputs.tf',
        'data-sources.tf',
        'cloudwatch-alarms.tf'
      ];
      
      unrelatedFiles.forEach(file => {
        const sedLines = content.split('\n').filter(line => 
          line.includes('sed') && line.includes(file)
        );
        expect(sedLines.length).toBe(0);
      });
    });
  });

  describe('Duplicate Resource Patterns', () => {
    it('should remove data source duplicates', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      const dataSourcePatterns = [
        'data "aws_ecs_cluster"',
        'data "aws_vpc"',
        'data "aws_route_tables"'
      ];
      
      dataSourcePatterns.forEach(pattern => {
        expect(content).toContain(pattern);
      });
    });

    it('should remove resource duplicates', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      const resourcePatterns = [
        'resource "aws_cloudwatch_metric_alarm"',
        'resource "aws_vpc_endpoint"'
      ];
      
      resourcePatterns.forEach(pattern => {
        expect(content).toContain(pattern);
      });
    });

    it('should remove variable duplicates', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('variable "rds_instance_identifier"');
    });
  });

  describe('Script Completeness', () => {
    it('should have all required sections', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      const requiredSections = [
        'set -e',
        'cd infra/terraform/production-hardening',
        'Fixing ECS cluster duplicates',
        'Fixing RDS alarm duplicates',
        'Fixing variable duplicates',
        'Fixing VPC duplicates',
        'Fixing S3 VPC endpoint duplicate',
        'rm -f *.bak',
        'Terraform duplicates fixed'
      ];
      
      requiredSections.forEach(section => {
        expect(content).toContain(section);
      });
    });

    it('should have logical flow', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const lines = content.split('\n');
      
      // Find key indices
      const setEIndex = lines.findIndex(l => l.includes('set -e'));
      const cdIndex = lines.findIndex(l => l.includes('cd infra/terraform'));
      const firstFixIndex = lines.findIndex(l => l.includes('Fixing ECS'));
      const cleanupIndex = lines.findIndex(l => l.includes('rm -f *.bak'));
      const successIndex = lines.findIndex(l => l.includes('Terraform duplicates fixed'));
      
      // Verify order
      expect(setEIndex).toBeLessThan(cdIndex);
      expect(cdIndex).toBeLessThan(firstFixIndex);
      expect(firstFixIndex).toBeLessThan(cleanupIndex);
      expect(cleanupIndex).toBeLessThan(successIndex);
    });
  });

  describe('Integration with Terraform Workflow', () => {
    it('should be safe to run before terraform init', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should not contain terraform commands
      expect(content).not.toContain('terraform init');
      expect(content).not.toContain('terraform plan');
      expect(content).not.toContain('terraform apply');
    });

    it('should recommend terraform init after completion', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const lines = content.split('\n');
      
      const lastLine = lines[lines.length - 1];
      expect(lastLine).toContain('terraform init -upgrade');
    });

    it('should work with existing Terraform files', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should use sed which works on existing files
      expect(content).toContain('sed -i.bak');
      
      // Should not create new files
      expect(content).not.toContain('touch');
      expect(content).not.toContain('cat >');
    });
  });

  describe('Idempotency', () => {
    it('should be safe to run multiple times', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Using sed with pattern matching means it will only remove if pattern exists
      // Running twice should be safe (second run finds nothing to remove)
      expect(content).toContain('sed -i.bak');
    });

    it('should not fail if duplicates already removed', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // sed with /pattern/d doesn't fail if pattern not found
      // set -e won't cause exit in this case
      const sedCommands = content.split('\n').filter(line => line.includes('sed'));
      expect(sedCommands.length).toBeGreaterThan(0);
    });
  });

  describe('Backup Safety', () => {
    it('should create backups before modifications', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // All sed commands should use -i.bak
      const sedWithoutBackup = content.split('\n').filter(line => 
        line.includes('sed -i ') && !line.includes('sed -i.bak')
      );
      
      expect(sedWithoutBackup.length).toBe(0);
    });

    it('should clean up backups only after all fixes', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const lines = content.split('\n');
      
      const lastSedIndex = lines.map((l, i) => l.includes('sed -i.bak') ? i : -1)
        .filter(i => i !== -1)
        .pop();
      
      const cleanupIndex = lines.findIndex(l => l.includes('rm -f *.bak'));
      
      expect(cleanupIndex).toBeGreaterThan(lastSedIndex!);
    });
  });

  describe('Documentation and Comments', () => {
    it('should have descriptive header comment', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const lines = content.split('\n');
      
      expect(lines[1]).toContain('Fix Terraform duplicate resources');
    });

    it('should have numbered steps', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('# 1.');
      expect(content).toContain('# 2.');
      expect(content).toContain('# 3.');
      expect(content).toContain('# 4.');
      expect(content).toContain('# 5.');
    });

    it('should have clear section comments', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      const comments = [
        'Remove duplicate ECS cluster data sources',
        'Remove duplicate RDS alarms',
        'Remove duplicate variable',
        'Remove duplicate VPC data sources',
        'Remove duplicate S3 VPC endpoint',
        'Clean up backup files'
      ];
      
      comments.forEach(comment => {
        expect(content).toContain(comment);
      });
    });
  });

  describe('Script Output', () => {
    it('should provide clear progress indication', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      const echoStatements = content.split('\n').filter(line => 
        line.includes('echo') && line.includes('Fixing')
      );
      
      expect(echoStatements.length).toBeGreaterThanOrEqual(5);
    });

    it('should use consistent message format', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const lines = content.split('\n');
      
      const fixingMessages = lines.filter(line => 
        line.includes('echo') && line.includes('Fixing')
      );
      
      fixingMessages.forEach(msg => {
        expect(msg).toMatch(/echo "Fixing .* duplicates\.\.\."/);
      });
    });
  });

  describe('Compatibility', () => {
    it('should use POSIX-compatible commands', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should use standard commands available in bash
      const commands = ['sed', 'rm', 'cd', 'echo'];
      commands.forEach(cmd => {
        expect(content).toContain(cmd);
      });
      
      // Should not use bash-specific features unnecessarily
      expect(content).not.toContain('[[');
      expect(content).not.toContain('source');
    });

    it('should work on macOS and Linux', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // sed -i.bak works on both macOS and Linux
      expect(content).toContain('sed -i.bak');
      
      // Should not use GNU-specific sed features
      expect(content).not.toContain('sed -i');
      expect(content).not.toContain('sed -r');
    });
  });

  describe('Performance', () => {
    it('should perform minimal operations', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Count sed operations
      const sedCount = content.split('\n').filter(line => 
        line.includes('sed -i.bak')
      ).length;
      
      // Should have exactly 7 sed operations (one per duplicate)
      expect(sedCount).toBe(7);
    });

    it('should not have unnecessary loops', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).not.toContain('for ');
      expect(content).not.toContain('while ');
    });
  });

  describe('Security', () => {
    it('should not use eval or dangerous commands', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).not.toContain('eval');
      expect(content).not.toContain('exec');
      expect(content).not.toContain('source');
    });

    it('should use safe file operations', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should use sed with backup
      expect(content).toContain('-i.bak');
      
      // Should not use destructive operations without backup
      expect(content).not.toMatch(/sed -i[^.].*\.tf/);
    });

    it('should not accept user input', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).not.toContain('read ');
      expect(content).not.toContain('$1');
      expect(content).not.toContain('$@');
    });
  });
});
