import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Architecture Validation', () => {
  describe('Stack Technique Validation', () => {
    it('should validate Next.js 14 configuration', () => {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      
      // Vérifier Next.js version
      expect(packageJson.dependencies.next).toBeDefined();
      expect(packageJson.dependencies.next).toMatch(/^14\./);
      
      // Vérifier React 18
      expect(packageJson.dependencies.react).toBeDefined();
      expect(packageJson.dependencies.react).toMatch(/^18\./);
      
      // Vérifier TypeScript
      expect(packageJson.devDependencies.typescript || packageJson.dependencies.typescript).toBeDefined();
    });

    it('should validate Tailwind CSS configuration', () => {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      
      expect(packageJson.devDependencies.tailwindcss || packageJson.dependencies.tailwindcss).toBeDefined();
      expect(existsSync('tailwind.config.js') || existsSync('tailwind.config.ts')).toBe(true);
    });

    it('should validate testing framework configuration', () => {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      
      // Vérifier Vitest
      expect(packageJson.devDependencies.vitest).toBeDefined();
      
      // Vérifier Testing Library
      expect(packageJson.devDependencies['@testing-library/react']).toBeDefined();
      
      // Vérifier Playwright
      expect(packageJson.devDependencies.playwright || packageJson.devDependencies['@playwright/test']).toBeDefined();
    });

    it('should validate state management libraries', () => {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      
      // Vérifier Zustand (si utilisé)
      const hasZustand = packageJson.dependencies.zustand || packageJson.devDependencies.zustand;
      
      // Au moins un système de state management devrait être présent
      const hasStateManagement = hasZustand || 
        packageJson.dependencies.redux || 
        packageJson.dependencies['@reduxjs/toolkit'];
      
      expect(hasStateManagement).toBeTruthy();
    });
  });

  describe('Patterns Architecturaux', () => {
    it('should validate Circuit Breaker implementation exists', () => {
      expect(existsSync('lib/services/circuit-breaker.ts')).toBe(true);
      expect(existsSync('lib/services/advanced-circuit-breaker.ts')).toBe(true);
    });

    it('should validate Request Coalescing implementation exists', () => {
      expect(existsSync('lib/services/request-coalescer.ts')).toBe(true);
      expect(existsSync('lib/services/smart-request-coalescer.ts')).toBe(true);
    });

    it('should validate Graceful Degradation implementation exists', () => {
      expect(existsSync('lib/services/graceful-degradation.ts')).toBe(true);
    });

    it('should validate API error handling exists', () => {
      expect(existsSync('lib/types/api-errors.ts')).toBe(true);
      expect(existsSync('components/error-boundary/APIErrorBoundary.tsx')).toBe(true);
    });
  });

  describe('Monitoring & Observabilité', () => {
    it('should validate monitoring services exist', () => {
      expect(existsSync('lib/services/api-monitoring-service.ts')).toBe(true);
      expect(existsSync('lib/services/slo-monitoring-service.ts')).toBe(true);
    });

    it('should validate metrics endpoint exists', () => {
      expect(existsSync('app/api/metrics/route.ts')).toBe(true);
    });

    it('should validate health check endpoint exists', () => {
      expect(existsSync('app/api/health/route.ts')).toBe(true);
    });
  });

  describe('Sécurité & Multi-tenancy', () => {
    it('should validate authentication middleware exists', () => {
      expect(existsSync('lib/middleware/api-auth.ts')).toBe(true);
    });

    it('should validate API validation middleware exists', () => {
      expect(existsSync('lib/middleware/api-validation.ts')).toBe(true);
    });

    it('should validate error types for security', () => {
      const apiErrorsPath = 'lib/types/api-errors.ts';
      expect(existsSync(apiErrorsPath)).toBe(true);
      
      const content = readFileSync(apiErrorsPath, 'utf-8');
      expect(content).toContain('AuthenticationError');
      expect(content).toContain('AuthorizationError');
      expect(content).toContain('RateLimitError');
    });
  });

  describe('Testing Strategy Validation', () => {
    it('should validate test coverage configuration', () => {
      const vitestConfig = existsSync('vitest.config.ts');
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      
      expect(vitestConfig || packageJson.vitest).toBeTruthy();
    });

    it('should validate test structure exists', () => {
      expect(existsSync('tests/unit')).toBe(true);
      expect(existsSync('tests/integration')).toBe(true);
      expect(existsSync('tests/e2e')).toBe(true);
    });

    it('should validate performance testing setup', () => {
      expect(existsSync('tests/load')).toBe(true);
      expect(existsSync('tests/performance-testing-guide.md')).toBe(true);
    });

    it('should validate regression testing setup', () => {
      expect(existsSync('tests/regression')).toBe(true);
    });
  });

  describe('API Architecture', () => {
    it('should validate content creation API exists', () => {
      expect(existsSync('app/api/content-ideas/generate/route.ts')).toBe(true);
    });

    it('should validate service layer architecture', () => {
      expect(existsSync('lib/services')).toBe(true);
      expect(existsSync('lib/services/content-generation-service.ts')).toBe(true);
      expect(existsSync('lib/services/content-idea-generator.ts')).toBe(true);
      expect(existsSync('lib/services/message-personalization.ts')).toBe(true);
    });

    it('should validate hooks architecture', () => {
      expect(existsSync('lib/hooks')).toBe(true);
      expect(existsSync('lib/hooks/use-sse-client.ts')).toBe(true);
    });
  });

  describe('Documentation Architecture', () => {
    it('should validate API documentation exists', () => {
      expect(existsSync('docs/api')).toBe(true);
      expect(existsSync('docs/api/api-integration-guide.md')).toBe(true);
      expect(existsSync('docs/api/content-idea-generator-api.md')).toBe(true);
    });

    it('should validate performance documentation exists', () => {
      expect(existsSync('docs/PERFORMANCE_OPTIMIZATION.md')).toBe(true);
      expect(existsSync('API_OPTIMIZATION_SUMMARY.md')).toBe(true);
    });

    it('should validate architecture documentation structure', () => {
      const archDoc = readFileSync('ARCHITECTURE_EXPLAINED.md', 'utf-8');
      
      // Vérifier les sections principales
      expect(archDoc).toContain('EXPLICATION TECHNIQUE');
      expect(archDoc).toContain('EXPLICATION SIMPLE');
      expect(archDoc).toContain('Stack Technique');
      expect(archDoc).toContain('Patterns Architecturaux');
      expect(archDoc).toContain('Monitoring & Observabilité');
      expect(archDoc).toContain('Sécurité & Multi-tenancy');
      expect(archDoc).toContain('Testing Strategy');
    });
  });
});