import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';

/**
 * Tests de compatibilité AWS CodeBuild
 * Valide que buildspec.yml respecte les spécifications AWS CodeBuild
 */

describe('AWS CodeBuild Compatibility', () => {
  let buildspecConfig: any;
  let buildspecContent: string;

  beforeEach(() => {
    if (existsSync('buildspec.yml')) {
      buildspecContent = readFileSync('buildspec.yml', 'utf-8');
      buildspecConfig = parse(buildspecContent);
    }
  });

  describe('BuildSpec Version Compatibility', () => {
    it('should use supported buildspec version', () => {
      const supportedVersions = [0.1, 0.2];
      expect(supportedVersions).toContain(buildspecConfig.version);
    });

    it('should use recommended version 0.2', () => {
      expect(buildspecConfig.version).toBe(0.2);
    });
  });

  describe('Runtime Versions Compatibility', () => {
    it('should specify supported Node.js runtime', () => {
      const installPhase = buildspecConfig.phases.install;
      expect(installPhase['runtime-versions']).toBeDefined();
      expect(installPhase['runtime-versions'].nodejs).toBeDefined();
      
      const nodeVersion = installPhase['runtime-versions'].nodejs;
      const supportedVersions = [14, 16, 18, 20];
      expect(supportedVersions).toContain(nodeVersion);
    });

    it('should use current LTS Node.js version', () => {
      const nodeVersion = buildspecConfig.phases.install['runtime-versions'].nodejs;
      expect(nodeVersion).toBeGreaterThanOrEqual(18); // Current LTS minimum
    });
  });

  describe('Environment Variables Compatibility', () => {
    it('should use valid environment variable syntax', () => {
      expect(buildspecConfig.env).toBeDefined();
      expect(buildspecConfig.env.variables).toBeDefined();
      
      const variables = buildspecConfig.env.variables;
      
      // All variable names should be valid
      Object.keys(variables).forEach(key => {
        expect(key).toMatch(/^[A-Z_][A-Z0-9_]*$/);
      });
    });

    it('should not exceed environment variable limits', () => {
      const variables = buildspecConfig.env.variables;
      const totalSize = JSON.stringify(variables).length;
      
      // AWS CodeBuild has limits on environment variables
      expect(totalSize).toBeLessThan(5120); // 5KB limit
      expect(Object.keys(variables).length).toBeLessThan(100); // Variable count limit
    });

    it('should use appropriate variable types', () => {
      const variables = buildspecConfig.env.variables;
      
      Object.values(variables).forEach(value => {
        expect(typeof value).toBe('string');
      });
    });
  });

  describe('Phases Structure Compatibility', () => {
    it('should have valid phase names', () => {
      const validPhases = ['install', 'pre_build', 'build', 'post_build'];
      const definedPhases = Object.keys(buildspecConfig.phases);
      
      definedPhases.forEach(phase => {
        expect(validPhases).toContain(phase);
      });
    });

    it('should have commands as arrays', () => {
      Object.values(buildspecConfig.phases).forEach((phase: any) => {
        if (phase.commands) {
          expect(Array.isArray(phase.commands)).toBe(true);
        }
      });
    });

    it('should not exceed command limits', () => {
      Object.values(buildspecConfig.phases).forEach((phase: any) => {
        if (phase.commands) {
          // Each command should be reasonable length
          phase.commands.forEach((command: string) => {
            if (typeof command === 'string') {
              expect(command.length).toBeLessThan(8192); // 8KB per command
            }
          });
          
          // Total commands per phase should be reasonable
          expect(phase.commands.length).toBeLessThan(100);
        }
      });
    });
  });

  describe('Artifacts Configuration Compatibility', () => {
    it('should have valid artifacts structure', () => {
      expect(buildspecConfig.artifacts).toBeDefined();
      expect(buildspecConfig.artifacts.files).toBeDefined();
      expect(Array.isArray(buildspecConfig.artifacts.files)).toBe(true);
    });

    it('should use valid artifact paths', () => {
      const files = buildspecConfig.artifacts.files;
      
      files.forEach((file: string) => {
        // Should not start with /
        expect(file).not.toMatch(/^\/+/);
        
        // Should use valid glob patterns
        expect(file).toMatch(/^[a-zA-Z0-9\-_\.\*\/]+$/);
      });
    });

    it('should have reasonable artifact name', () => {
      const name = buildspecConfig.artifacts.name;
      
      if (name) {
        expect(name.length).toBeLessThan(255);
        expect(name).toMatch(/^[a-zA-Z0-9\-_]+$/);
      }
    });

    it('should use valid discard-paths setting', () => {
      const discardPaths = buildspecConfig.artifacts['discard-paths'];
      
      if (discardPaths !== undefined) {
        expect(typeof discardPaths).toBe('boolean');
      }
    });
  });

  describe('Reports Configuration Compatibility', () => {
    it('should have valid reports structure', () => {
      if (buildspecConfig.reports) {
        expect(typeof buildspecConfig.reports).toBe('object');
        
        Object.values(buildspecConfig.reports).forEach((report: any) => {
          expect(report.files).toBeDefined();
          expect(Array.isArray(report.files)).toBe(true);
          expect(report['file-format']).toBeDefined();
        });
      }
    });

    it('should use supported report formats', () => {
      if (buildspecConfig.reports) {
        const supportedFormats = [
          'JUNITXML',
          'NUNITXML', 
          'NUNIT3XML',
          'TESTNGXML',
          'CUCUMBERJSON',
          'VISUALSTUDIOTRX',
          'CLOVERXML',
          'COBERTURAXML',
          'JACOCOXML',
          'SIMPLECOV'
        ];
        
        Object.values(buildspecConfig.reports).forEach((report: any) => {
          expect(supportedFormats).toContain(report['file-format']);
        });
      }
    });

    it('should have valid report names', () => {
      if (buildspecConfig.reports) {
        Object.keys(buildspecConfig.reports).forEach(name => {
          expect(name.length).toBeLessThan(128);
          expect(name).toMatch(/^[a-zA-Z0-9\-_]+$/);
        });
      }
    });
  });

  describe('Cache Configuration Compatibility', () => {
    it('should have valid cache structure', () => {
      if (buildspecConfig.cache) {
        expect(buildspecConfig.cache.paths).toBeDefined();
        expect(Array.isArray(buildspecConfig.cache.paths)).toBe(true);
      }
    });

    it('should use valid cache paths', () => {
      if (buildspecConfig.cache?.paths) {
        buildspecConfig.cache.paths.forEach((path: string) => {
          // Should not start with /
          expect(path).not.toMatch(/^\/+/);
          
          // Should be reasonable length
          expect(path.length).toBeLessThan(255);
        });
      }
    });

    it('should not exceed cache limits', () => {
      if (buildspecConfig.cache?.paths) {
        expect(buildspecConfig.cache.paths.length).toBeLessThan(50);
      }
    });
  });

  describe('Command Syntax Compatibility', () => {
    it('should use valid shell commands', () => {
      const allCommands: string[] = [];
      
      Object.values(buildspecConfig.phases).forEach((phase: any) => {
        if (phase.commands) {
          allCommands.push(...phase.commands.filter((cmd: any) => typeof cmd === 'string'));
        }
      });
      
      allCommands.forEach(command => {
        // Should not contain dangerous patterns
        expect(command).not.toContain('rm -rf /');
        expect(command).not.toContain('sudo rm');
        
        // Should use proper shell syntax
        if (command.includes('&&')) {
          expect(command).not.toMatch(/&&\s*$/); // No trailing &&
        }
      });
    });

    it('should handle multi-line commands properly', () => {
      const allCommands: any[] = [];
      
      Object.values(buildspecConfig.phases).forEach((phase: any) => {
        if (phase.commands) {
          allCommands.push(...phase.commands);
        }
      });
      
      allCommands.forEach(command => {
        if (typeof command === 'string' && command.includes('\n')) {
          // Multi-line commands should use proper YAML syntax
          expect(command).toMatch(/^\s*\|/m);
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    it('should not contain hardcoded credentials', () => {
      const sensitivePatterns = [
        /password\s*[:=]\s*[^$\s]+/i,
        /secret\s*[:=]\s*[^$\s]+/i,
        /key\s*[:=]\s*[^$\s]+/i,
        /token\s*[:=]\s*[^$\s]+/i,
        /sk_live_[a-zA-Z0-9]+/,
        /sk_test_[a-zA-Z0-9]+/,
        /AKIA[0-9A-Z]{16}/
      ];
      
      sensitivePatterns.forEach(pattern => {
        expect(buildspecContent).not.toMatch(pattern);
      });
    });

    it('should use environment variables for sensitive data', () => {
      const commands = JSON.stringify(buildspecConfig.phases);
      
      if (commands.includes('STRIPE_SECRET_KEY')) {
        expect(commands).toContain('$STRIPE_SECRET_KEY');
      }
    });

    it('should use AWS Secrets Manager for secrets', () => {
      const commands = JSON.stringify(buildspecConfig.phases);
      
      if (commands.includes('secretsmanager')) {
        expect(commands).toContain('aws secretsmanager get-secret-value');
      }
    });
  });

  describe('Performance Optimization', () => {
    it('should use caching when appropriate', () => {
      expect(buildspecConfig.cache).toBeDefined();
      expect(buildspecConfig.cache.paths).toContain('node_modules/**/*');
    });

    it('should minimize build time with parallel operations', () => {
      const commands = JSON.stringify(buildspecConfig.phases);
      
      // Should use background processes where appropriate
      if (commands.includes('docker run')) {
        expect(commands).toContain('docker run -d');
      }
    });

    it('should have reasonable timeout values', () => {
      const commands = JSON.stringify(buildspecConfig.phases);
      
      // Should not have excessive waits
      const sleepMatches = commands.match(/sleep\s+(\d+)/g);
      if (sleepMatches) {
        sleepMatches.forEach(match => {
          const seconds = parseInt(match.replace('sleep ', ''));
          expect(seconds).toBeLessThan(60); // No sleep longer than 1 minute
        });
      }
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should have proper error handling', () => {
      const commands = JSON.stringify(buildspecConfig.phases);
      
      // Should use || true for non-critical commands
      expect(commands).toContain('|| true');
    });

    it('should have retry mechanisms for flaky operations', () => {
      const commands = JSON.stringify(buildspecConfig.phases);
      
      // Should have loops for health checks
      expect(commands).toMatch(/for\s+i\s+in\s+\{1\.\.\d+\}/);
    });

    it('should handle missing optional dependencies', () => {
      const commands = JSON.stringify(buildspecConfig.phases);
      
      // Should check for file existence
      expect(commands).toContain('if [ -f');
      expect(commands).toContain('if ls');
    });
  });

  describe('AWS Service Integration', () => {
    it('should use proper AWS CLI syntax', () => {
      const commands = JSON.stringify(buildspecConfig.phases);
      
      if (commands.includes('aws ')) {
        // Should use proper AWS CLI format
        expect(commands).toMatch(/aws\s+\w+\s+\w+/);
      }
    });

    it('should handle AWS service limits', () => {
      const commands = JSON.stringify(buildspecConfig.phases);
      
      if (commands.includes('secretsmanager')) {
        // Should not make excessive API calls
        const secretCalls = (commands.match(/secretsmanager/g) || []).length;
        expect(secretCalls).toBeLessThan(10);
      }
    });
  });

  describe('Logging and Debugging', () => {
    it('should have proper logging statements', () => {
      const commands = JSON.stringify(buildspecConfig.phases);
      
      expect(commands).toContain('echo');
    });

    it('should provide clear phase identification', () => {
      Object.entries(buildspecConfig.phases).forEach(([phaseName, phase]: [string, any]) => {
        if (phase.commands) {
          const hasPhaseEcho = phase.commands.some((cmd: string) => 
            typeof cmd === 'string' && cmd.includes('echo') && cmd.includes(phaseName)
          );
          expect(hasPhaseEcho).toBe(true);
        }
      });
    });

    it('should not expose sensitive information in logs', () => {
      const commands = JSON.stringify(buildspecConfig.phases);
      
      // Should not echo sensitive variables
      expect(commands).not.toMatch(/echo.*\$.*SECRET/i);
      expect(commands).not.toMatch(/echo.*\$.*PASSWORD/i);
      expect(commands).not.toMatch(/echo.*\$.*KEY/i);
    });
  });
});