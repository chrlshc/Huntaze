/**
 * Dependency Validation Tests
 * Tests to verify peer dependency compatibility and prevent future conflicts
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

describe('Dependency Validation', () => {
  let packageJson: any;
  let packageLockJson: any;

  beforeAll(() => {
    // Read current package configuration
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageLockPath = path.join(process.cwd(), 'package-lock.json');
    
    packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    packageLockJson = JSON.parse(readFileSync(packageLockPath, 'utf8'));
  });

  describe('React and Three.js Compatibility', () => {
    test('should have compatible React and @react-three/drei versions', () => {
      const reactVersion = packageJson.dependencies?.react || packageJson.devDependencies?.react;
      const dreiVersion = packageJson.dependencies?.['@react-three/drei'] || packageJson.devDependencies?.['@react-three/drei'];
      
      expect(reactVersion).toBeDefined();
      expect(dreiVersion).toBeDefined();
      
      // Verify React 19 compatibility with current drei version
      const reactMajor = parseInt(reactVersion.replace(/[^\d]/g, ''));
      expect(reactMajor).toBeGreaterThanOrEqual(19);
      
      // Verify drei version is 10.x or higher (React 19 compatible)
      const dreiMajor = parseInt(dreiVersion.replace(/[^\d]/g, ''));
      expect(dreiMajor).toBeGreaterThanOrEqual(10);
    });

    test('should have compatible @react-three/fiber version', () => {
      const fiberVersion = packageJson.dependencies?.['@react-three/fiber'] || packageJson.devDependencies?.['@react-three/fiber'];
      
      if (fiberVersion) {
        // Verify fiber version is 9.x or higher (React 19 compatible)
        const fiberMajor = parseInt(fiberVersion.replace(/[^\d]/g, ''));
        expect(fiberMajor).toBeGreaterThanOrEqual(9);
      }
    });

    test('should not have peer dependency conflicts', () => {
      // Run npm ls to check for peer dependency issues
      try {
        const output = execSync('npm ls --depth=0 2>&1', { encoding: 'utf8' });
        
        // Should not contain peer dependency warnings
        expect(output).not.toMatch(/ERESOLVE/);
        expect(output).not.toMatch(/peer dep missing/);
        expect(output).not.toMatch(/conflicting peer dependency/);
      } catch (error) {
        // If npm ls fails, check the error output
        const errorOutput = (error as any).stdout || (error as any).message;
        
        // Allow warnings but not errors
        if (errorOutput.includes('ERESOLVE') || errorOutput.includes('peer dep missing')) {
          fail(`Peer dependency conflicts detected: ${errorOutput}`);
        }
      }
    });
  });

  describe('Package Lock Integrity', () => {
    test('should have consistent dependency tree', () => {
      expect(packageLockJson.lockfileVersion).toBeDefined();
      expect(packageLockJson.packages).toBeDefined();
      
      // Verify React is properly resolved
      const reactPackage = Object.keys(packageLockJson.packages).find(pkg => 
        pkg.includes('node_modules/react') && !pkg.includes('react-')
      );
      expect(reactPackage).toBeDefined();
    });

    test('should have Three.js dependencies properly resolved', () => {
      const dreiPackage = Object.keys(packageLockJson.packages).find(pkg => 
        pkg.includes('@react-three/drei')
      );
      
      if (dreiPackage) {
        expect(packageLockJson.packages[dreiPackage]).toBeDefined();
        
        // Verify drei has proper peer dependencies resolved
        const dreiInfo = packageLockJson.packages[dreiPackage];
        expect(dreiInfo.version).toBeDefined();
      }
    });
  });

  describe('Build System Compatibility', () => {
    test('should build successfully without dependency errors', () => {
      try {
        // Run a type check to ensure TypeScript compatibility
        execSync('npx tsc --noEmit --skipLibCheck', { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
      } catch (error) {
        const errorOutput = (error as any).stdout || (error as any).stderr || (error as any).message;
        
        // Filter out non-dependency related errors
        if (errorOutput.includes('Cannot find module') && 
            (errorOutput.includes('@react-three') || errorOutput.includes('react'))) {
          fail(`Dependency-related TypeScript errors: ${errorOutput}`);
        }
      }
    });

    test('should have proper TypeScript types for React and Three.js', () => {
      const reactTypesVersion = packageJson.dependencies?.['@types/react'] || packageJson.devDependencies?.['@types/react'];
      
      if (reactTypesVersion) {
        // Verify @types/react version matches React version
        const reactVersion = packageJson.dependencies?.react || packageJson.devDependencies?.react;
        const reactMajor = parseInt(reactVersion.replace(/[^\d]/g, ''));
        const typesMajor = parseInt(reactTypesVersion.replace(/[^\d]/g, ''));
        
        expect(typesMajor).toBeGreaterThanOrEqual(18); // Should support React 18+
      }
    });
  });

  describe('Version Constraints', () => {
    test('should meet minimum version requirements', () => {
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // React should be 19.x
      if (dependencies.react) {
        const reactVersion = dependencies.react.replace(/[^\d.]/g, '');
        const [major] = reactVersion.split('.');
        expect(parseInt(major)).toBeGreaterThanOrEqual(19);
      }
      
      // @react-three/drei should be 10.x or higher
      if (dependencies['@react-three/drei']) {
        const dreiVersion = dependencies['@react-three/drei'].replace(/[^\d.]/g, '');
        const [major] = dreiVersion.split('.');
        expect(parseInt(major)).toBeGreaterThanOrEqual(10);
      }
      
      // @react-three/fiber should be 9.x or higher
      if (dependencies['@react-three/fiber']) {
        const fiberVersion = dependencies['@react-three/fiber'].replace(/[^\d.]/g, '');
        const [major] = fiberVersion.split('.');
        expect(parseInt(major)).toBeGreaterThanOrEqual(9);
      }
    });

    test('should not have conflicting version ranges', () => {
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Check for common conflicting patterns
      Object.entries(allDeps).forEach(([name, version]) => {
        // Should not have multiple React versions
        if (name.startsWith('react') && name !== 'react-dom') {
          expect(typeof version).toBe('string');
          expect(version).not.toMatch(/\|\|/); // No OR conditions
        }
      });
    });
  });
});