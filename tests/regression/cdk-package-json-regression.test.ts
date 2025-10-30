/**
 * CDK Package.json Regression Tests
 * 
 * Ensures that critical package.json configurations remain stable
 * and prevents breaking changes to the CDK infrastructure setup.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('🔒 CDK Package.json Regression', () => {
  const packageJsonPath = join(process.cwd(), 'infra/cdk/package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  describe('Critical Dependencies Stability', () => {
    it('should maintain aws-cdk-lib at v2.100+', () => {
      const version = packageJson.dependencies['aws-cdk-lib'];
      expect(version).toMatch(/^\^2\.\d+\.\d+$/);
      
      const minorVersion = parseInt(version.match(/\^2\.(\d+)/)?.[1] || '0', 10);
      expect(minorVersion).toBeGreaterThanOrEqual(100);
    });

    it('should maintain constructs at v10', () => {
      const version = packageJson.dependencies.constructs;
      expect(version).toMatch(/^\^10\.\d+\.\d+$/);
    });

    it('should not downgrade to CDK v1', () => {
      const version = packageJson.dependencies['aws-cdk-lib'];
      expect(version).not.toMatch(/^\^1\./);
    });

    it('should keep aws-cdk CLI version in sync with lib', () => {
      const libVersion = packageJson.dependencies['aws-cdk-lib'];
      const cliVersion = packageJson.devDependencies['aws-cdk'];
      
      const libMinor = libVersion.match(/\^2\.(\d+)/)?.[1];
      const cliMinor = cliVersion.match(/\^2\.(\d+)/)?.[1];
      
      expect(libMinor).toBe(cliMinor);
    });
  });

  describe('TypeScript Configuration Stability', () => {
    it('should maintain TypeScript 5.x', () => {
      const version = packageJson.devDependencies.typescript;
      expect(version).toMatch(/^\^5\.\d+\.\d+$/);
    });

    it('should not downgrade to TypeScript 4.x', () => {
      const version = packageJson.devDependencies.typescript;
      expect(version).not.toMatch(/^\^4\./);
    });

    it('should maintain ts-node compatibility', () => {
      const version = packageJson.devDependencies['ts-node'];
      expect(version).toBeDefined();
      expect(version).toMatch(/^\^10\.\d+\.\d+$/);
    });
  });

  describe('Testing Framework Stability', () => {
    it('should maintain Jest 29.x', () => {
      const version = packageJson.devDependencies.jest;
      expect(version).toMatch(/^\^29\.\d+\.\d+$/);
    });

    it('should maintain ts-jest compatibility', () => {
      const version = packageJson.devDependencies['ts-jest'];
      expect(version).toMatch(/^\^29\.\d+\.\d+$/);
    });

    it('should keep Jest types in sync', () => {
      const jestVersion = packageJson.devDependencies.jest;
      const typesVersion = packageJson.devDependencies['@types/jest'];
      
      const jestMajor = jestVersion.match(/\^(\d+)/)?.[1];
      const typesMajor = typesVersion.match(/\^(\d+)/)?.[1];
      
      expect(jestMajor).toBe(typesMajor);
    });
  });

  describe('Essential Scripts Stability', () => {
    it('should maintain build script', () => {
      expect(packageJson.scripts.build).toBe('tsc');
    });

    it('should maintain deploy script with no-approval', () => {
      expect(packageJson.scripts.deploy).toBe('cdk deploy --require-approval never');
    });

    it('should maintain synth script', () => {
      expect(packageJson.scripts.synth).toBe('cdk synth');
    });

    it('should maintain diff script', () => {
      expect(packageJson.scripts.diff).toBe('cdk diff');
    });

    it('should maintain destroy script', () => {
      expect(packageJson.scripts.destroy).toBe('cdk destroy');
    });

    it('should maintain watch script', () => {
      expect(packageJson.scripts.watch).toBe('tsc -w');
    });

    it('should maintain test script', () => {
      expect(packageJson.scripts.test).toBe('jest');
    });

    it('should maintain cdk script', () => {
      expect(packageJson.scripts.cdk).toBe('cdk');
    });
  });

  describe('Package Metadata Stability', () => {
    it('should maintain package name', () => {
      expect(packageJson.name).toBe('huntaze-onlyfans-cdk');
    });

    it('should maintain bin entry point', () => {
      expect(packageJson.bin['huntaze-of-cdk']).toBe('bin/app.js');
    });

    it('should have description', () => {
      expect(packageJson.description).toBeDefined();
      expect(packageJson.description.length).toBeGreaterThan(0);
    });

    it('should have version', () => {
      expect(packageJson.version).toBeDefined();
      expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('Node.js Compatibility', () => {
    it('should maintain Node 20 types', () => {
      const version = packageJson.devDependencies['@types/node'];
      expect(version).toMatch(/^\^20\.\d+\.\d+$/);
    });

    it('should not downgrade to Node 18 types', () => {
      const version = packageJson.devDependencies['@types/node'];
      expect(version).not.toMatch(/^\^18\./);
    });
  });

  describe('Dependency Count Stability', () => {
    it('should have exactly 2 production dependencies', () => {
      const deps = Object.keys(packageJson.dependencies);
      expect(deps).toHaveLength(2);
      expect(deps).toContain('aws-cdk-lib');
      expect(deps).toContain('constructs');
    });

    it('should have exactly 7 dev dependencies', () => {
      const devDeps = Object.keys(packageJson.devDependencies);
      expect(devDeps).toHaveLength(7);
    });

    it('should not have unnecessary dependencies', () => {
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      // Should not have these
      expect(allDeps['lodash']).toBeUndefined();
      expect(allDeps['moment']).toBeUndefined();
      expect(allDeps['axios']).toBeUndefined();
      expect(allDeps['express']).toBeUndefined();
    });
  });

  describe('Version Range Stability', () => {
    it('should use caret ranges for all dependencies', () => {
      Object.values(packageJson.dependencies).forEach((version: any) => {
        expect(version).toMatch(/^\^/);
      });
    });

    it('should use caret ranges for all dev dependencies', () => {
      Object.values(packageJson.devDependencies).forEach((version: any) => {
        expect(version).toMatch(/^\^/);
      });
    });

    it('should not use exact versions', () => {
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      Object.values(allDeps).forEach((version: any) => {
        expect(version).not.toMatch(/^\d+\.\d+\.\d+$/); // No exact versions
      });
    });

    it('should not use wildcard versions', () => {
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      Object.values(allDeps).forEach((version: any) => {
        expect(version).not.toBe('*');
        expect(version).not.toBe('latest');
      });
    });
  });

  describe('CI/CD Configuration Stability', () => {
    it('should keep no-approval flag for automated deployments', () => {
      expect(packageJson.scripts.deploy).toContain('--require-approval never');
    });

    it('should not add interactive prompts to deploy', () => {
      // Should have --require-approval never (not interactive)
      expect(packageJson.scripts.deploy).toContain('--require-approval never');
      expect(packageJson.scripts.deploy).not.toContain('--require-approval broadening');
    });

    it('should maintain simple synth command', () => {
      expect(packageJson.scripts.synth).toBe('cdk synth');
      expect(packageJson.scripts.synth).not.toContain('--output');
    });
  });

  describe('Breaking Change Prevention', () => {
    it('should not remove aws-cdk-lib', () => {
      expect(packageJson.dependencies['aws-cdk-lib']).toBeDefined();
    });

    it('should not remove constructs', () => {
      expect(packageJson.dependencies.constructs).toBeDefined();
    });

    it('should not remove TypeScript', () => {
      expect(packageJson.devDependencies.typescript).toBeDefined();
    });

    it('should not remove aws-cdk CLI', () => {
      expect(packageJson.devDependencies['aws-cdk']).toBeDefined();
    });

    it('should not remove build script', () => {
      expect(packageJson.scripts.build).toBeDefined();
    });

    it('should not remove deploy script', () => {
      expect(packageJson.scripts.deploy).toBeDefined();
    });

    it('should not change bin entry point path', () => {
      expect(packageJson.bin['huntaze-of-cdk']).toBe('bin/app.js');
    });
  });

  describe('Security Best Practices', () => {
    it('should not have pre/post install scripts', () => {
      expect(packageJson.scripts.preinstall).toBeUndefined();
      expect(packageJson.scripts.postinstall).toBeUndefined();
    });

    it('should not have deprecated dependencies', () => {
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      // Known deprecated packages
      expect(allDeps['request']).toBeUndefined();
      expect(allDeps['node-uuid']).toBeUndefined();
    });

    it('should use modern package versions', () => {
      // All major versions should be recent
      const cdkVersion = packageJson.dependencies['aws-cdk-lib'];
      const tsVersion = packageJson.devDependencies.typescript;
      const jestVersion = packageJson.devDependencies.jest;

      expect(parseInt(cdkVersion.match(/\^(\d+)/)?.[1] || '0', 10)).toBeGreaterThanOrEqual(2);
      expect(parseInt(tsVersion.match(/\^(\d+)/)?.[1] || '0', 10)).toBeGreaterThanOrEqual(5);
      expect(parseInt(jestVersion.match(/\^(\d+)/)?.[1] || '0', 10)).toBeGreaterThanOrEqual(29);
    });
  });

  describe('Consistency Checks', () => {
    it('should have matching Jest and ts-jest versions', () => {
      const jestVersion = packageJson.devDependencies.jest;
      const tsJestVersion = packageJson.devDependencies['ts-jest'];

      const jestMajor = jestVersion.match(/\^(\d+)/)?.[1];
      const tsJestMajor = tsJestVersion.match(/\^(\d+)/)?.[1];

      expect(jestMajor).toBe(tsJestMajor);
    });

    it('should not have duplicate dependencies', () => {
      const deps = Object.keys(packageJson.dependencies);
      const devDeps = Object.keys(packageJson.devDependencies);

      const duplicates = deps.filter(dep => devDeps.includes(dep));
      expect(duplicates).toEqual([]);
    });

    it('should have valid semver for all dependencies', () => {
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      Object.values(allDeps).forEach((version: any) => {
        expect(version).toMatch(/^\^?\d+\.\d+\.\d+$/);
      });
    });
  });
});
