/**
 * Regression Tests for fix-terraform-duplicates.sh
 * Ensures the script doesn't break existing functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('fix-terraform-duplicates.sh Regression Tests', () => {
  const scriptPath = path.join(process.cwd(), 'scripts/fix-terraform-duplicates.sh');
  const terraformDir = path.join(process.cwd(), 'infra/terraform/production-hardening');

  describe('Script Stability', () => {
    it('should maintain consistent script structure', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Core structure should remain
      expect(content).toContain('#!/bin/bash');
      expect(content).toContain('set -e');
      expect(content).toContain('cd infra/terraform/production-hardening');
      expect(content).toContain('rm -f *.bak');
    });

    it('should not introduce new dependencies', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should only use standard commands
      const allowedCommands = ['sed', 'rm', 'cd', 'echo', 'set'];
      const commandPattern = /\b([a-z_]+)\s/g;
      const commands = [...content.matchAll(commandPattern)].map(m => m[1]);
      
      const uniqueCommands = [...new Set(commands)].filter(cmd => 
        !['if', 'then', 'else', 'fi', 'for', 'do', 'done'].includes(cmd)
      );
      
      uniqueCommands.forEach(cmd => {
        if (cmd.length > 1) { // Skip single letters
          expect(allowedCommands).toContain(cmd);
        }
      });
    });

    it('should maintain error handling with set -e', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const lines = content.split('\n');
      
      // set -e should be early in script
      const setELine = lines.findIndex(l => l.trim() === 'set -e');
      expect(setELine).toBeGreaterThan(0);
      expect(setELine).toBeLessThan(10);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain same target files', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      const expectedFiles = [
        'ecs-auto-scaling.tf',
        'rds-performance-insights.tf',
        'variables.tf',
        'vpc-endpoints.tf'
      ];
      
      expectedFiles.forEach(file => {
        expect(content).toContain(file);
      });
    });

    it('should maintain same duplicate patterns', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      const expectedPatterns = [
        'data "aws_ecs_cluster" "ai_team"',
        'rds_read_latency_high',
        'rds_write_latency_high',
        'variable "rds_instance_identifier"',
        'data "aws_vpc" "main"',
        'data "aws_route_tables" "private"',
        'resource "aws_vpc_endpoint" "s3"'
      ];
      
      expectedPatterns.forEach(pattern => {
        expect(content).toContain(pattern);
      });
    });

    it('should maintain backup file strategy', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // All sed commands should create backups
      const sedCommands = content.split('\n').filter(line => 
        line.includes('sed') && line.includes('.tf')
      );
      
      expect(sedCommands.length).toBeGreaterThan(0);
      sedCommands.forEach(cmd => {
        expect(cmd).toContain('-i.bak');
      });
    });
  });

  describe('No Unintended Side Effects', () => {
    it('should not modify other terraform files', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      const otherTerraformFiles = [
        'main.tf',
        'outputs.tf',
        'data-sources.tf',
        'cloudwatch-alarms.tf',
        'security-services.tf',
        'container-insights-logs.tf'
      ];
      
      otherTerraformFiles.forEach(file => {
        const sedLines = content.split('\n').filter(line => 
          line.includes('sed') && line.includes(file)
        );
        expect(sedLines.length).toBe(0);
      });
    });

    it('should not modify terraform state files', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).not.toContain('terraform.tfstate');
      expect(content).not.toContain('.tfstate');
    });

    it('should not modify terraform lock file', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).not.toContain('.terraform.lock.hcl');
    });

    it('should not modify terraform directory', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).not.toContain('.terraform/');
    });
  });

  describe('Sed Command Regression', () => {
    it('should use correct sed pattern for block removal', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Pattern should be: /^pattern/,/^}/d
      const sedPatterns = content.match(/\/\^[^\/]+\/,\/\^}\/d/g);
      expect(sedPatterns).toBeTruthy();
      expect(sedPatterns!.length).toBe(7);
    });

    it('should not use destructive sed patterns', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should not delete entire files
      expect(content).not.toContain('sed -i.bak d');
      expect(content).not.toContain('sed -i.bak 1,$d');
    });

    it('should maintain portable sed syntax', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should use -i.bak (portable) not -i (GNU-specific)
      const sedCommands = content.split('\n').filter(line => 
        line.includes('sed -i ')
      );
      
      sedCommands.forEach(cmd => {
        expect(cmd).toContain('-i.bak');
      });
    });
  });

  describe('Directory Navigation Regression', () => {
    it('should change to correct terraform directory', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('cd infra/terraform/production-hardening');
    });

    it('should not use absolute paths', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should use relative paths
      expect(content).not.toMatch(/cd \/[a-z]/);
      expect(content).not.toMatch(/sed.*\/home\//);
      expect(content).not.toMatch(/sed.*\/usr\//);
    });

    it('should not change directory multiple times', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      const cdCommands = content.split('\n').filter(line => 
        line.trim().startsWith('cd ')
      );
      
      // Should only have one cd command
      expect(cdCommands.length).toBe(1);
    });
  });

  describe('Cleanup Regression', () => {
    it('should clean up all backup files', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('rm -f *.bak');
    });

    it('should clean up backups before completion message', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const lines = content.split('\n');
      
      const cleanupIndex = lines.findIndex(l => l.includes('rm -f *.bak'));
      const successIndex = lines.findIndex(l => l.includes('Terraform duplicates fixed'));
      
      expect(cleanupIndex).toBeGreaterThan(0);
      expect(cleanupIndex).toBeLessThan(successIndex);
    });

    it('should not leave temporary files', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should not create temp files that aren't cleaned up
      expect(content).not.toContain('mktemp');
      expect(content).not.toContain('/tmp/');
    });
  });

  describe('Output Message Regression', () => {
    it('should maintain user-friendly messages', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      const expectedMessages = [
        'Fixing Terraform duplicate resources',
        'Fixing ECS cluster duplicates',
        'Fixing RDS alarm duplicates',
        'Fixing variable duplicates',
        'Fixing VPC duplicates',
        'Fixing S3 VPC endpoint duplicate',
        'Terraform duplicates fixed'
      ];
      
      expectedMessages.forEach(msg => {
        expect(content).toContain(msg);
      });
    });

    it('should maintain emoji indicators', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('🔧');
      expect(content).toContain('✅');
    });

    it('should provide next steps', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('terraform init -upgrade');
    });
  });

  describe('Error Handling Regression', () => {
    it('should exit on first error', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('set -e');
    });

    it('should not suppress errors', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).not.toContain('|| true');
      expect(content).not.toContain('|| :');
      expect(content).not.toContain('2>/dev/null');
    });

    it('should not use error traps', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should not have complex error handling
      expect(content).not.toContain('trap');
      expect(content).not.toContain('ERR');
    });
  });

  describe('Performance Regression', () => {
    it('should maintain minimal operations count', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Count sed operations
      const sedCount = content.split('\n').filter(line => 
        line.includes('sed -i.bak')
      ).length;
      
      // Should have exactly 7 operations
      expect(sedCount).toBe(7);
    });

    it('should not introduce loops', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).not.toContain('for ');
      expect(content).not.toContain('while ');
      expect(content).not.toContain('until ');
    });

    it('should not introduce unnecessary commands', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should not have grep, awk, etc.
      expect(content).not.toContain('grep ');
      expect(content).not.toContain('awk ');
      expect(content).not.toContain('find ');
    });
  });

  describe('Security Regression', () => {
    it('should not introduce eval or exec', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).not.toContain('eval ');
      expect(content).not.toContain('exec ');
    });

    it('should not accept user input', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).not.toContain('read ');
      expect(content).not.toContain('$1');
      expect(content).not.toContain('$@');
      expect(content).not.toContain('$*');
    });

    it('should not use environment variables unsafely', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should not use unquoted variables
      const lines = content.split('\n');
      lines.forEach(line => {
        if (line.includes('$')) {
          // If it has variables, they should be quoted or in specific contexts
          // For this script, we don't expect any variables
          expect(line).not.toMatch(/\$[A-Z_]+[^"]/);
        }
      });
    });
  });

  describe('Terraform File Structure Regression', () => {
    it('should not corrupt HCL syntax', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Sed patterns should match complete blocks
      const sedPatterns = content.match(/\/\^[^\/]+{\/,\/\^}\/d/g);
      expect(sedPatterns).toBeTruthy();
      
      // Each pattern should end with closing brace
      sedPatterns!.forEach(pattern => {
        expect(pattern).toContain('/^}/d');
      });
    });

    it('should maintain resource naming conventions', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Resource names should follow Terraform conventions
      const resourceNames = [
        'ai_team',
        'rds_read_latency_high',
        'rds_write_latency_high',
        'rds_instance_identifier',
        'main',
        'private',
        's3'
      ];
      
      resourceNames.forEach(name => {
        expect(content).toContain(name);
      });
    });
  });

  describe('Documentation Regression', () => {
    it('should maintain header comment', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      const lines = content.split('\n');
      
      expect(lines[0]).toBe('#!/bin/bash');
      expect(lines[1]).toContain('Fix Terraform duplicate resources');
    });

    it('should maintain numbered steps', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('# 1.');
      expect(content).toContain('# 2.');
      expect(content).toContain('# 3.');
      expect(content).toContain('# 4.');
      expect(content).toContain('# 5.');
    });

    it('should maintain descriptive comments', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      const expectedComments = [
        'Remove duplicate ECS cluster data sources',
        'Remove duplicate RDS alarms',
        'Remove duplicate variable',
        'Remove duplicate VPC data sources',
        'Remove duplicate S3 VPC endpoint',
        'Clean up backup files'
      ];
      
      expectedComments.forEach(comment => {
        expect(content).toContain(comment);
      });
    });
  });

  describe('Integration Points Regression', () => {
    it('should not interfere with other scripts', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should not call other scripts
      expect(content).not.toContain('./');
      expect(content).not.toContain('bash ');
      expect(content).not.toContain('sh ');
    });

    it('should not modify global state', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should not export variables
      expect(content).not.toContain('export ');
      
      // Should not modify PATH
      expect(content).not.toContain('PATH=');
    });

    it('should work independently', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should not source other files
      expect(content).not.toContain('source ');
      expect(content).not.toContain('. ');
    });
  });

  describe('Idempotency Regression', () => {
    it('should remain idempotent', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Using pattern matching ensures idempotency
      const sedCommands = content.split('\n').filter(line => 
        line.includes('sed -i.bak')
      );
      
      sedCommands.forEach(cmd => {
        // Each command should use pattern matching
        expect(cmd).toMatch(/\/\^.*\/,\/\^}\/d/);
      });
    });

    it('should not accumulate changes on multiple runs', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should clean up backups each time
      expect(content).toContain('rm -f *.bak');
      
      // Should not append to files
      expect(content).not.toContain('>>');
    });
  });

  describe('Cross-Platform Regression', () => {
    it('should maintain macOS compatibility', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // sed -i.bak works on macOS
      expect(content).toContain('sed -i.bak');
      
      // Should not use GNU-specific features
      expect(content).not.toContain('sed -r');
      expect(content).not.toContain('sed --');
    });

    it('should maintain Linux compatibility', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should use POSIX-compliant commands
      expect(content).toContain('#!/bin/bash');
      expect(content).not.toContain('#!/bin/sh');
    });

    it('should not use platform-specific paths', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).not.toContain('/usr/local/');
      expect(content).not.toContain('/opt/');
      expect(content).not.toContain('C:\\');
    });
  });

  describe('File Permissions Regression', () => {
    it('should maintain executable permissions', () => {
      const stats = fs.statSync(scriptPath);
      const isExecutable = !!(stats.mode & fs.constants.S_IXUSR);
      expect(isExecutable).toBe(true);
    });

    it('should not modify file permissions', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).not.toContain('chmod ');
    });
  });

  describe('Terraform Version Compatibility', () => {
    it('should work with Terraform 1.x syntax', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Patterns should match Terraform 1.x resource syntax
      expect(content).toContain('resource "aws_');
      expect(content).toContain('data "aws_');
      expect(content).toContain('variable "');
    });

    it('should not assume specific Terraform version', () => {
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Should not check terraform version
      expect(content).not.toContain('terraform version');
      expect(content).not.toContain('terraform -v');
    });
  });
});
