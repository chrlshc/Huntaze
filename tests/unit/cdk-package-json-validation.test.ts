/**
 * CDK Package.json Validation Tests
 * 
 * Validates the CDK project configuration:
 * - Package metadata
 * - Scripts configuration
 * - Dependencies versions
 * - Build configuration
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('📦 CDK Package.json Validation', () => {
  const packageJsonPath = join(process.cwd(), 'infra/cdk/package.json');
  let packageJson: any;

  beforeAll(() => {
    expect(existsSync(packageJsonPath)).toBe(true);
    const content = readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(content);
  });

  describe('Package Metadata', () => {
    it('should have correct package name', () => {
      expect(packageJson.name).toBe('huntaze-onlyfans-cdk');
    });

    it('should have version defined', () => {
      expect(packageJson.version).toBeDefined();
      expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have description', () => {
      expect(packageJson.description).toBeDefined();
      expect(packageJson.description).toContain('AWS CDK');
      expect(packageJson.description).toContain('Huntaze');
    });

    it('should have bin entry point', () => {
      expect(packageJson.bin).toBeDefined();
      expect(packageJson.bin['huntaze-of-cdk']).toBe('bin/app.js');
    });
  });

  describe('Scripts Configuration', () => {
    it('should have build script', () => {
      expect(packageJson.scripts.build).toBe('tsc');
    });

    it('should have watch script', () => {
      expect(packageJson.scripts.watch).toBe('tsc -w');
    });

    it('should have test script', () => {
      expect(packageJson.scripts.test).toBe('jest');
    });

    it('should have cdk script', () => {
      expect(packageJson.scripts.cdk).toBe('cdk');
    });

    it('should have deploy script', () => {
      expect(packageJson.scripts.deploy).toBe('cdk deploy --require-approval never');
    });

    it('should have synth script', () => {
      expect(packageJson.scripts.synth).toBe('cdk synth');
    });

    it('should have diff script', () => {
      expect(packageJson.scripts.diff).toBe('cdk diff');
    });

    it('should have destroy script', () => {
      expect(packageJson.scripts.destroy).toBe('cdk destroy');
    });

    it('should have all required CDK scripts', () => {
      const requiredScripts = ['build', 'watch', 'test', 'cdk', 'deploy', 'synth', 'diff', 'destroy'];
      requiredScripts.forEach(script => {
        expect(packageJson.scripts[script]).toBeDefined();
      });
    });
  });

  describe('Dependencies', () => {
    it('should have aws-cdk-lib dependency', () => {
      expect(packageJson.dependencies['aws-cdk-lib']).toBeDefined();
    });

    it('should have constructs dependency', () => {
      expect(packageJson.dependencies.constructs).toBeDefined();
    });

    it('should use compatible CDK version', () => {
      const cdkVersion = packageJson.dependencies['aws-cdk-lib'];
      expect(cdkVersion).toMatch(/^\^2\.\d+\.\d+$/);
      
      // Extract version number
      const versionMatch = cdkVersion.match(/\^2\.(\d+)\.\d+/);
      expect(versionMatch).toBeTruthy();
      
      const minorVersion = parseInt(versionMatch![1], 10);
      expect(minorVersion).toBeGreaterThanOrEqual(100); // CDK 2.100+
    });

    it('should use constructs v10', () => {
      const constructsVersion = packageJson.dependencies.constructs;
      expect(constructsVersion).toMatch(/^\^10\.\d+\.\d+$/);
    });

    it('should have matching aws-cdk and aws-cdk-lib versions', () => {
      const cdkLibVersion = packageJson.dependencies['aws-cdk-lib'];
      const cdkCliVersion = packageJson.devDependencies['aws-cdk'];
      
      // Both should be ^2.x.x
      expect(cdkLibVersion).toMatch(/^\^2\.\d+\.\d+$/);
      expect(cdkCliVersion).toMatch(/^\^2\.\d+\.\d+$/);
      
      // Extract major.minor versions
      const libMatch = cdkLibVersion.match(/\^2\.(\d+)/);
      const cliMatch = cdkCliVersion.match(/\^2\.(\d+)/);
      
      expect(libMatch![1]).toBe(cliMatch![1]); // Same minor version
    });
  });

  describe('Dev Dependencies', () => {
    it('should have TypeScript', () => {
      expect(packageJson.devDependencies.typescript).toBeDefined();
      expect(packageJson.devDependencies.typescript).toMatch(/^\^5\.\d+\.\d+$/);
    });

    it('should have ts-node', () => {
      expect(packageJson.devDependencies['ts-node']).toBeDefined();
    });

    it('should have Jest', () => {
      expect(packageJson.devDependencies.jest).toBeDefined();
      expect(packageJson.devDependencies.jest).toMatch(/^\^29\.\d+\.\d+$/);
    });

    it('should have ts-jest', () => {
      expect(packageJson.devDependencies['ts-jest']).toBeDefined();
    });

    it('should have Jest types', () => {
      expect(packageJson.devDependencies['@types/jest']).toBeDefined();
    });

    it('should have Node types', () => {
      expect(packageJson.devDependencies['@types/node']).toBeDefined();
      expect(packageJson.devDependencies['@types/node']).toMatch(/^\^20\.\d+\.\d+$/);
    });

    it('should have aws-cdk CLI', () => {
      expect(packageJson.devDependencies['aws-cdk']).toBeDefined();
    });

    it('should have all required dev dependencies', () => {
      const requiredDevDeps = [
        '@types/jest',
        '@types/node',
        'aws-cdk',
        'jest',
        'ts-jest',
        'ts-node',
        'typescript'
      ];

      requiredDevDeps.forEach(dep => {
        expect(packageJson.devDependencies[dep]).toBeDefined();
      });
    });
  });

  describe('Version Compatibility', () => {
    it('should use Node 20 compatible versions', () => {
      const nodeTypesVersion = packageJson.devDependencies['@types/node'];
      expect(nodeTypesVersion).toMatch(/^\^20\.\d+\.\d+$/);
    });

    it('should use TypeScript 5.x', () => {
      const tsVersion = packageJson.devDependencies.typescript;
      expect(tsVersion).toMatch(/^\^5\.\d+\.\d+$/);
    });

    it('should use Jest 29.x', () => {
      const jestVersion = packageJson.devDependencies.jest;
      expect(jestVersion).toMatch(/^\^29\.\d+\.\d+$/);
    });

    it('should have compatible ts-jest version', () => {
      const tsJestVersion = packageJson.devDependencies['ts-jest'];
      expect(tsJestVersion).toMatch(/^\^29\.\d+\.\d+$/);
    });
  });

  describe('Package Structure', () => {
    it('should have all required top-level fields', () => {
      expect(packageJson.name).toBeDefined();
      expect(packageJson.version).toBeDefined();
      expect(packageJson.description).toBeDefined();
      expect(packageJson.bin).toBeDefined();
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.devDependencies).toBeDefined();
    });

    it('should not have unnecessary fields', () => {
      // Should not have these fields for a CDK project
      expect(packageJson.main).toBeUndefined();
      expect(packageJson.module).toBeUndefined();
      expect(packageJson.browser).toBeUndefined();
    });

    it('should have valid JSON structure', () => {
      // If we got here, JSON.parse succeeded
      expect(typeof packageJson).toBe('object');
      expect(packageJson).not.toBeNull();
    });
  });

  describe('Deployment Configuration', () => {
    it('should have no-approval deploy for CI/CD', () => {
      expect(packageJson.scripts.deploy).toContain('--require-approval never');
    });

    it('should have synth command for CloudFormation generation', () => {
      expect(packageJson.scripts.synth).toBe('cdk synth');
    });

    it('should have diff command for change preview', () => {
      expect(packageJson.scripts.diff).toBe('cdk diff');
    });

    it('should have destroy command for cleanup', () => {
      expect(packageJson.scripts.destroy).toBe('cdk destroy');
    });
  });

  describe('Development Workflow', () => {
    it('should support TypeScript compilation', () => {
      expect(packageJson.scripts.build).toBe('tsc');
      expect(packageJson.devDependencies.typescript).toBeDefined();
    });

    it('should support watch mode for development', () => {
      expect(packageJson.scripts.watch).toBe('tsc -w');
    });

    it('should support testing', () => {
      expect(packageJson.scripts.test).toBe('jest');
      expect(packageJson.devDependencies.jest).toBeDefined();
    });

    it('should have TypeScript tooling', () => {
      expect(packageJson.devDependencies.typescript).toBeDefined();
      expect(packageJson.devDependencies['ts-node']).toBeDefined();
      expect(packageJson.devDependencies['ts-jest']).toBeDefined();
    });
  });

  describe('Security & Best Practices', () => {
    it('should use caret ranges for dependencies', () => {
      Object.values(packageJson.dependencies).forEach((version: any) => {
        expect(version).toMatch(/^\^/);
      });
    });

    it('should use caret ranges for dev dependencies', () => {
      Object.values(packageJson.devDependencies).forEach((version: any) => {
        expect(version).toMatch(/^\^/);
      });
    });

    it('should not have wildcard versions', () => {
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      Object.values(allDeps).forEach((version: any) => {
        expect(version).not.toBe('*');
        expect(version).not.toBe('latest');
      });
    });

    it('should use modern package versions', () => {
      // TypeScript 5.x
      expect(packageJson.devDependencies.typescript).toMatch(/^\^5\./);
      
      // Jest 29.x
      expect(packageJson.devDependencies.jest).toMatch(/^\^29\./);
      
      // Node types 20.x
      expect(packageJson.devDependencies['@types/node']).toMatch(/^\^20\./);
    });
  });

  describe('CDK Specific Configuration', () => {
    it('should have CDK CLI in dev dependencies', () => {
      expect(packageJson.devDependencies['aws-cdk']).toBeDefined();
    });

    it('should have CDK library in dependencies', () => {
      expect(packageJson.dependencies['aws-cdk-lib']).toBeDefined();
    });

    it('should have constructs library', () => {
      expect(packageJson.dependencies.constructs).toBeDefined();
    });

    it('should have bin entry for CDK app', () => {
      expect(packageJson.bin).toBeDefined();
      expect(Object.keys(packageJson.bin).length).toBeGreaterThan(0);
    });

    it('should use CDK v2 (not v1)', () => {
      const cdkVersion = packageJson.dependencies['aws-cdk-lib'];
      expect(cdkVersion).toMatch(/^\^2\./);
      expect(cdkVersion).not.toMatch(/^\^1\./);
    });
  });

  describe('Integration with Project', () => {
    it('should have package name matching project structure', () => {
      expect(packageJson.name).toContain('huntaze');
      expect(packageJson.name).toContain('onlyfans');
      expect(packageJson.name).toContain('cdk');
    });

    it('should have description matching project purpose', () => {
      const desc = packageJson.description.toLowerCase();
      expect(desc).toContain('huntaze');
      expect(desc).toContain('onlyfans');
    });

    it('should have bin name matching package name', () => {
      const binName = Object.keys(packageJson.bin)[0];
      expect(binName).toContain('huntaze');
      expect(binName).toContain('cdk');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing optional fields gracefully', () => {
      // These fields are optional
      expect(() => packageJson.author).not.toThrow();
      expect(() => packageJson.license).not.toThrow();
      expect(() => packageJson.repository).not.toThrow();
    });

    it('should have valid semver versions', () => {
      const semverRegex = /^\^?\d+\.\d+\.\d+$/;
      
      Object.values(packageJson.dependencies).forEach((version: any) => {
        expect(version).toMatch(semverRegex);
      });
      
      Object.values(packageJson.devDependencies).forEach((version: any) => {
        expect(version).toMatch(semverRegex);
      });
    });

    it('should not have duplicate dependencies', () => {
      const deps = Object.keys(packageJson.dependencies);
      const devDeps = Object.keys(packageJson.devDependencies);
      
      const duplicates = deps.filter(dep => devDeps.includes(dep));
      expect(duplicates).toEqual([]);
    });
  });

  describe('Regression Prevention', () => {
    it('should maintain CDK v2 compatibility', () => {
      const cdkLibVersion = packageJson.dependencies['aws-cdk-lib'];
      expect(cdkLibVersion).toMatch(/^\^2\.\d+\.\d+$/);
    });

    it('should maintain TypeScript 5.x', () => {
      const tsVersion = packageJson.devDependencies.typescript;
      expect(tsVersion).toMatch(/^\^5\.\d+\.\d+$/);
    });

    it('should maintain Jest 29.x', () => {
      const jestVersion = packageJson.devDependencies.jest;
      expect(jestVersion).toMatch(/^\^29\.\d+\.\d+$/);
    });

    it('should keep deploy script with no-approval flag', () => {
      expect(packageJson.scripts.deploy).toContain('--require-approval never');
    });

    it('should keep all essential scripts', () => {
      const essentialScripts = ['build', 'deploy', 'synth', 'diff', 'destroy'];
      essentialScripts.forEach(script => {
        expect(packageJson.scripts[script]).toBeDefined();
      });
    });
  });
});
