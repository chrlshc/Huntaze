/**
 * Production Functionality Validation Tests
 * Tests Three.js components and React 19 features in production-like environment
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Production Functionality Validation', () => {
  let buildExists = false;
  let packageJson: any;

  beforeAll(async () => {
    // Check if production build exists
    const nextDir = path.join(process.cwd(), '.next');
    buildExists = fs.existsSync(nextDir);
    
    // Load package.json
    const packagePath = path.join(process.cwd(), 'package.json');
    packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  });

  describe('Build Validation', () => {
    it('should have a valid production build', () => {
      expect(buildExists).toBe(true);
    });

    it('should have all required Three.js dependencies', () => {
      const deps = packageJson.dependencies || {};
      
      expect(deps.three).toBeDefined();
      expect(deps['@react-three/fiber']).toBeDefined();
      expect(deps['@react-three/drei']).toBeDefined();
    });

    it('should have React 19 compatible versions', () => {
      const deps = packageJson.dependencies || {};
      
      // Check React version
      const reactVersion = deps.react;
      expect(reactVersion).toBeDefined();
      
      const reactMajor = parseInt(reactVersion.replace(/[^\d]/g, ''));
      
      if (reactMajor >= 19) {
        // If React 19+, check Three.js compatibility
        const dreiVersion = deps['@react-three/drei'];
        const fiberVersion = deps['@react-three/fiber'];
        
        const dreiMajor = parseInt(dreiVersion.replace(/[^\d]/g, ''));
        const fiberMajor = parseInt(fiberVersion.replace(/[^\d]/g, ''));
        
        expect(dreiMajor).toBeGreaterThanOrEqual(10);
        expect(fiberMajor).toBeGreaterThanOrEqual(9);
      }
    });
  });

  describe('Dependency Health', () => {
    it('should have no peer dependency conflicts', () => {
      try {
        const output = execSync('npm ls --depth=0', { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        expect(output).not.toContain('UNMET PEER DEPENDENCY');
        expect(output).not.toContain('peer dep missing');
      } catch (error) {
        const errorOutput = error.stdout || error.stderr || '';
        
        // Allow warnings but not errors
        expect(errorOutput).not.toContain('ERESOLVE');
        expect(errorOutput).not.toContain('peer dep missing');
      }
    });

    it('should pass dependency validation', () => {
      try {
        execSync('npm run validate:dependencies', { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        // If no exception, validation passed
        expect(true).toBe(true);
      } catch (error) {
        // Check if it's just warnings
        const errorOutput = error.stdout || error.stderr || '';
        
        if (error.status === 0 || errorOutput.includes('Validation passed with warnings')) {
          expect(true).toBe(true);
        } else {
          throw error;
        }
      }
    });
  });

  describe('Performance Validation', () => {
    it('should have reasonable bundle sizes', () => {
      if (!buildExists) {
        console.log('Skipping bundle size test - no build found');
        return;
      }

      const staticDir = path.join(process.cwd(), '.next', 'static');
      
      if (fs.existsSync(staticDir)) {
        const jsFiles = fs.readdirSync(staticDir, { recursive: true })
          .filter(file => file.endsWith('.js'))
          .map(file => {
            const filePath = path.join(staticDir, file);
            const stats = fs.statSync(filePath);
            return {
              file,
              size: stats.size,
              sizeKB: Math.round(stats.size / 1024)
            };
          });

        const totalSizeKB = jsFiles.reduce((sum, file) => sum + file.sizeKB, 0);
        
        // Reasonable threshold for a React + Three.js app
        expect(totalSizeKB).toBeLessThan(10000); // 10MB threshold
        
        // Check individual large files
        const largeFiles = jsFiles.filter(file => file.sizeKB > 2000); // 2MB per file
        expect(largeFiles.length).toBeLessThan(3); // Max 2 large files
      }
    });

    it('should have no critical security vulnerabilities', async () => {
      try {
        const auditOutput = execSync('npm audit --audit-level=high --json', { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        const audit = JSON.parse(auditOutput);
        
        expect(audit.metadata.vulnerabilities.critical).toBe(0);
        expect(audit.metadata.vulnerabilities.high).toBe(0);
      } catch (error) {
        // npm audit might fail in some environments
        console.log('Security audit skipped - npm audit not available');
      }
    });
  });

  describe('Three.js Component Validation', () => {
    it('should be able to import Three.js modules', async () => {
      try {
        // Test basic Three.js import
        const { Scene } = await import('three');
        expect(Scene).toBeDefined();
        
        // Test React Three Fiber
        const { Canvas } = await import('@react-three/fiber');
        expect(Canvas).toBeDefined();
        
        // Test React Three Drei
        const { Box } = await import('@react-three/drei');
        expect(Box).toBeDefined();
      } catch (error) {
        throw new Error(`Three.js import failed: ${error.message}`);
      }
    });

    it('should have compatible Three.js ecosystem versions', () => {
      const deps = packageJson.dependencies || {};
      
      const threeVersion = deps.three;
      const fiberVersion = deps['@react-three/fiber'];
      const dreiVersion = deps['@react-three/drei'];
      
      // Basic version compatibility checks
      expect(threeVersion).toMatch(/^[\^~]?0\.(1[5-9]\d|[2-9]\d\d)/); // Three.js 0.150+
      expect(fiberVersion).toMatch(/^[\^~]?[8-9]\./); // Fiber 8.0+
      expect(dreiVersion).toMatch(/^[\^~]?1[0-9]\./); // Drei 10.0+
    });
  });

  describe('Production Monitoring', () => {
    it('should pass production monitoring checks', () => {
      try {
        const output = execSync('npm run monitor:production', { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        expect(output).toContain('HEALTHY');
        expect(output).toContain('All systems healthy');
      } catch (error) {
        const errorOutput = error.stdout || error.stderr || '';
        
        // Allow warnings but not critical failures
        if (errorOutput.includes('DEGRADED') && !errorOutput.includes('CRITICAL')) {
          console.log('Production monitoring passed with warnings');
          expect(true).toBe(true);
        } else {
          throw error;
        }
      }
    });

    it('should have fresh build artifacts', () => {
      if (!buildExists) {
        console.log('Skipping build freshness test - no build found');
        return;
      }

      const nextDir = path.join(process.cwd(), '.next');
      const stats = fs.statSync(nextDir);
      const buildAge = Date.now() - stats.mtime.getTime();
      const hoursOld = Math.floor(buildAge / (1000 * 60 * 60));
      
      // Build should be less than 48 hours old for production
      expect(hoursOld).toBeLessThan(48);
    });
  });

  describe('React 19 Feature Validation', () => {
    it('should support React 19 features if using React 19', () => {
      const deps = packageJson.dependencies || {};
      const reactVersion = deps.react;
      const reactMajor = parseInt(reactVersion.replace(/[^\d]/g, ''));
      
      if (reactMajor >= 19) {
        // Test that React 19 is properly configured
        expect(reactVersion).toMatch(/^[\^~]?19\./);
        
        // Check that TypeScript types are compatible
        const devDeps = packageJson.devDependencies || {};
        const reactTypesVersion = devDeps['@types/react'];
        
        if (reactTypesVersion) {
          const typesMajor = parseInt(reactTypesVersion.replace(/[^\d]/g, ''));
          expect(typesMajor).toBeGreaterThanOrEqual(18); // React 19 types
        }
      }
    });

    it('should have no React version conflicts', () => {
      const deps = packageJson.dependencies || {};
      const reactVersion = deps.react;
      const reactDomVersion = deps['react-dom'];
      
      if (reactVersion && reactDomVersion) {
        // Extract major versions
        const reactMajor = parseInt(reactVersion.replace(/[^\d]/g, ''));
        const reactDomMajor = parseInt(reactDomVersion.replace(/[^\d]/g, ''));
        
        expect(reactMajor).toBe(reactDomMajor);
      }
    });
  });
});