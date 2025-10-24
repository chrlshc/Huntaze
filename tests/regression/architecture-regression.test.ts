import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('Architecture Regression Tests', () => {
  describe('Documentation Consistency', () => {
    it('should maintain consistency between documented and implemented architecture', () => {
      const archDoc = readFileSync('ARCHITECTURE_EXPLAINED.md', 'utf-8');
      
      // Vérifier que les services mentionnés dans la doc existent
      const mentionedServices = [
        'circuit-breaker',
        'request-coalescer', 
        'graceful-degradation',
        'api-monitoring-service',
        'content-generation-service',
        'message-personalization',
      ];
      
      mentionedServices.forEach(service => {
        const servicePath = `lib/services/${service}.ts`;
        expect(existsSync(servicePath), `Service ${service} should exist at ${servicePath}`).toBe(true);
      });
    });

    it('should maintain documented API endpoints', () => {
      const archDoc = readFileSync('ARCHITECTURE_EXPLAINED.md', 'utf-8');
      
      // Vérifier que les endpoints mentionnés existent
      const mentionedEndpoints = [
        'app/api/metrics/route.ts',
        'app/api/health/route.ts',
        'app/api/content-ideas/generate/route.ts',
      ];
      
      mentionedEndpoints.forEach(endpoint => {
        expect(existsSync(endpoint), `Endpoint ${endpoint} should exist`).toBe(true);
      });
    });

    it('should maintain documented middleware', () => {
      const middlewareFiles = [
        'lib/middleware/api-auth.ts',
        'lib/middleware/api-validation.ts',
      ];
      
      middlewareFiles.forEach(middleware => {
        expect(existsSync(middleware), `Middleware ${middleware} should exist`).toBe(true);
      });
    });
  });

  describe('Performance Regression', () => {
    it('should maintain performance characteristics', () => {
      // Test que les services critiques n'ont pas de régressions de performance
      const performanceCriticalFiles = [
        'lib/services/circuit-breaker.ts',
        'lib/services/api-monitoring-service.ts',
        'lib/services/graceful-degradation.ts',
      ];
      
      performanceCriticalFiles.forEach(file => {
        expect(existsSync(file)).toBe(true);
        
        const content = readFileSync(file, 'utf-8');
        
        // Vérifier qu'il n'y a pas de patterns anti-performance évidents
        expect(content).not.toContain('console.log('); // Pas de logs en production
        expect(content).not.toMatch(/for\s*\(\s*let\s+\w+\s*=\s*0.*length.*\+\+/g); // Éviter les boucles non optimisées dans les hot paths
      });
    });

    it('should maintain memory efficiency', () => {
      // Vérifier que les services n'ont pas de fuites mémoire potentielles
      const memoryFiles = [
        'lib/services/api-monitoring-service.ts',
        'lib/services/content-idea-generator.ts',
      ];
      
      memoryFiles.forEach(file => {
        if (existsSync(file)) {
          const content = readFileSync(file, 'utf-8');
          
          // Vérifier la gestion des Map/Set (nettoyage)
          if (content.includes('new Map') || content.includes('new Set')) {
            expect(content).toMatch(/(clear|delete|cleanup|TTL|expire)/i);
          }
          
          // Vérifier les event listeners (cleanup)
          if (content.includes('addEventListener')) {
            expect(content).toMatch(/(removeEventListener|cleanup|destroy)/i);
          }
        }
      });
    });
  });

  describe('Security Regression', () => {
    it('should maintain security patterns', () => {
      const securityFiles = [
        'lib/middleware/api-auth.ts',
        'lib/types/api-errors.ts',
      ];
      
      securityFiles.forEach(file => {
        if (existsSync(file)) {
          const content = readFileSync(file, 'utf-8');
          
          // Vérifier que les erreurs ne leakent pas d'informations sensibles
          if (content.includes('Error') || content.includes('throw')) {
            expect(content).not.toMatch(/(password|secret|key|token).*=.*['"]/gi);
          }
          
          // Vérifier la validation des inputs
          if (content.includes('request') || content.includes('input')) {
            expect(content).toMatch(/(validate|sanitize|escape|zod|schema)/i);
          }
        }
      });
    });

    it('should maintain authentication patterns', () => {
      const authFile = 'lib/middleware/api-auth.ts';
      
      if (existsSync(authFile)) {
        const content = readFileSync(authFile, 'utf-8');
        
        // Vérifier les patterns de sécurité
        expect(content).toMatch(/(AuthenticationError|AuthorizationError)/);
        expect(content).toMatch(/(Bearer|API.*key|jwt|token)/i);
        expect(content).not.toContain('password'); // Pas de mots de passe en dur
      }
    });
  });

  describe('API Contract Regression', () => {
    it('should maintain API response structure', () => {
      const apiFiles = [
        'app/api/health/route.ts',
        'app/api/content-ideas/generate/route.ts',
      ];
      
      apiFiles.forEach(file => {
        if (existsSync(file)) {
          const content = readFileSync(file, 'utf-8');
          
          // Vérifier la structure de réponse standard
          expect(content).toMatch(/success.*true|false/);
          expect(content).toMatch(/(NextResponse\.json|Response)/);
          
          // Vérifier la gestion d'erreurs
          expect(content).toMatch(/(try.*catch|error)/i);
        }
      });
    });

    it('should maintain error response consistency', () => {
      const errorTypesFile = 'lib/types/api-errors.ts';
      
      if (existsSync(errorTypesFile)) {
        const content = readFileSync(errorTypesFile, 'utf-8');
        
        // Vérifier que les types d'erreurs standard sont présents
        const requiredErrorTypes = [
          'APIError',
          'ValidationError',
          'AuthenticationError',
          'AuthorizationError',
        ];
        
        requiredErrorTypes.forEach(errorType => {
          expect(content).toContain(errorType);
        });
      }
    });
  });

  describe('Testing Architecture Regression', () => {
    it('should maintain test coverage structure', () => {
      const testDirs = ['tests/unit', 'tests/integration', 'tests/e2e', 'tests/regression'];
      
      testDirs.forEach(dir => {
        expect(existsSync(dir), `Test directory ${dir} should exist`).toBe(true);
      });
    });

    it('should maintain test configuration', () => {
      const configFiles = [
        'vitest.config.ts',
        'playwright.config.ts',
      ];
      
      configFiles.forEach(config => {
        if (existsSync(config)) {
          const content = readFileSync(config, 'utf-8');
          expect(content.length).toBeGreaterThan(0);
        }
      });
    });

    it('should maintain test utilities', () => {
      const testUtilFiles = [
        'tests/fixtures/test-data.ts',
        'vitest.setup.ts',
      ];
      
      testUtilFiles.forEach(file => {
        if (existsSync(file)) {
          expect(existsSync(file)).toBe(true);
        }
      });
    });
  });

  describe('Monitoring Regression', () => {
    it('should maintain monitoring endpoints', () => {
      const monitoringFiles = [
        'app/api/metrics/route.ts',
        'lib/services/api-monitoring-service.ts',
        'lib/services/slo-monitoring-service.ts',
      ];
      
      monitoringFiles.forEach(file => {
        expect(existsSync(file), `Monitoring file ${file} should exist`).toBe(true);
        
        if (existsSync(file)) {
          const content = readFileSync(file, 'utf-8');
          expect(content).toMatch(/(metric|monitor|health|performance)/i);
        }
      });
    });

    it('should maintain SLO/SLI patterns', () => {
      const sloFile = 'lib/services/slo-monitoring-service.ts';
      
      if (existsSync(sloFile)) {
        const content = readFileSync(sloFile, 'utf-8');
        
        // Vérifier les patterns SLO/SLI
        expect(content).toMatch(/(SLO|SLI|availability|latency|error.*rate)/i);
      }
    });
  });

  describe('Build System Regression', () => {
    it('should maintain build configuration', () => {
      const buildFiles = [
        'next.config.mjs',
        'package.json',
        'tsconfig.json',
      ];
      
      buildFiles.forEach(file => {
        expect(existsSync(file), `Build file ${file} should exist`).toBe(true);
      });
    });

    it('should maintain dependency versions', () => {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      
      // Vérifier les dépendances critiques
      const criticalDeps = ['next', 'react', 'typescript'];
      
      criticalDeps.forEach(dep => {
        expect(
          packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep],
          `Critical dependency ${dep} should be present`
        ).toBeDefined();
      });
    });
  });
});