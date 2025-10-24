import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('Architecture Detailed Documentation Validation', () => {
  let architectureContent: string;

  beforeAll(() => {
    architectureContent = readFileSync('ARCHITECTURE_DETAILED.md', 'utf-8');
  });

  describe('Documentation Structure', () => {
    it('should have complete table of contents', () => {
      const expectedSections = [
        'Vue d\'Ensemble',
        'Stack Technique Détaillée',
        'Architecture Frontend',
        'Architecture Backend',
        'Services de Résilience',
        'Monitoring & Observabilité',
        'Sécurité & Multi-tenancy',
        'Base de Données',
        'Testing Strategy',
        'Déploiement & Infrastructure'
      ];

      expectedSections.forEach(section => {
        expect(architectureContent).toContain(section);
      });
    });

    it('should have proper markdown structure', () => {
      // Vérifier les headers principaux
      expect(architectureContent).toMatch(/^# 🏗️ Architecture Huntaze/m);
      expect(architectureContent).toMatch(/^## 📋 Table des Matières/m);
      expect(architectureContent).toMatch(/^## 🎯 Vue d'Ensemble/m);
      
      // Vérifier la présence d'emojis dans les headers
      expect(architectureContent).toMatch(/^## [🎯💻🎨⚙️🛡️📊🔒💾🧪🚀]/m);
    });

    it('should have architecture diagrams', () => {
      // Vérifier la présence de diagrammes ASCII
      expect(architectureContent).toContain('┌─────────────────┐');
      expect(architectureContent).toContain('│   Frontend      │');
      expect(architectureContent).toContain('│   Next.js 14    │');
      expect(architectureContent).toContain('◄──►');
    });
  });

  describe('Stack Technique Validation', () => {
    it('should document correct Next.js version', () => {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      
      // Vérifier que la version documentée correspond à la version installée
      expect(architectureContent).toContain('Next.js 14');
      expect(packageJson.dependencies.next).toMatch(/^14\./);
    });

    it('should document correct React version', () => {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      
      expect(architectureContent).toContain('React 18');
      expect(packageJson.dependencies.react).toMatch(/^18\./);
    });

    it('should document correct TypeScript version', () => {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      
      expect(architectureContent).toContain('TypeScript 5.3.0');
      expect(
        packageJson.devDependencies?.typescript || packageJson.dependencies?.typescript
      ).toMatch(/^5\./);
    });

    it('should document styling frameworks', () => {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      
      expect(architectureContent).toContain('Tailwind CSS');
      expect(architectureContent).toContain('Headless UI');
      expect(architectureContent).toContain('Framer Motion');
      
      // Vérifier que Tailwind est installé
      expect(
        packageJson.devDependencies?.tailwindcss || packageJson.dependencies?.tailwindcss
      ).toBeDefined();
    });

    it('should document state management', () => {
      expect(architectureContent).toContain('Zustand');
      expect(architectureContent).toContain('React Query');
      expect(architectureContent).toContain('React Hook Form');
    });

    it('should document backend technologies', () => {
      expect(architectureContent).toContain('Next.js API Routes');
      expect(architectureContent).toContain('tRPC');
      expect(architectureContent).toContain('Zod');
      expect(architectureContent).toContain('PostgreSQL');
      expect(architectureContent).toContain('Redis');
    });

    it('should document external services', () => {
      expect(architectureContent).toContain('OpenAI GPT-4');
      expect(architectureContent).toContain('Stripe');
      expect(architectureContent).toContain('AWS SDK');
    });
  });

  describe('Architecture Principles Validation', () => {
    it('should document microservices architecture', () => {
      expect(architectureContent).toContain('Microservices');
      expect(architectureContent).toContain('Services découplés et indépendants');
    });

    it('should document event-driven architecture', () => {
      expect(architectureContent).toContain('Event-Driven');
      expect(architectureContent).toContain('Communication asynchrone par événements');
    });

    it('should document resilience patterns', () => {
      expect(architectureContent).toContain('Resilience First');
      expect(architectureContent).toContain('Patterns de résilience intégrés');
    });

    it('should document observability', () => {
      expect(architectureContent).toContain('Observability');
      expect(architectureContent).toContain('Monitoring et logging complets');
    });

    it('should document security by design', () => {
      expect(architectureContent).toContain('Security by Design');
      expect(architectureContent).toContain('Sécurité intégrée dès la conception');
    });
  });

  describe('Frontend Architecture Validation', () => {
    it('should document folder structure', () => {
      expect(architectureContent).toContain('app/');
      expect(architectureContent).toContain('components/');
      expect(architectureContent).toContain('lib/');
      expect(architectureContent).toContain('pages/');
      
      // Vérifier que ces dossiers existent
      expect(existsSync('app')).toBe(true);
      expect(existsSync('components')).toBe(true);
      expect(existsSync('lib')).toBe(true);
    });

    it('should document component structure', () => {
      expect(architectureContent).toContain('ui/');
      expect(architectureContent).toContain('forms/');
      expect(architectureContent).toContain('admin/');
      
      // Vérifier que les dossiers de composants existent
      expect(existsSync('components/ui')).toBe(true);
      expect(existsSync('components/admin')).toBe(true);
    });

    it('should document lib structure', () => {
      expect(architectureContent).toContain('services/');
      expect(architectureContent).toContain('hooks/');
      expect(architectureContent).toContain('utils/');
      expect(architectureContent).toContain('types/');
      
      // Vérifier que ces dossiers existent
      expect(existsSync('lib/services')).toBe(true);
      expect(existsSync('lib/hooks')).toBe(true);
      expect(existsSync('lib/types')).toBe(true);
    });

    it('should document layout component', () => {
      expect(architectureContent).toContain('AdminLayoutProps');
      expect(architectureContent).toContain('components/admin/Layout.tsx');
      
      // Vérifier que le composant Layout existe
      expect(existsSync('components/admin/Layout.tsx')).toBe(true);
    });

    it('should document state management patterns', () => {
      expect(architectureContent).toContain('lib/stores/user-store.ts');
      expect(architectureContent).toContain('useUserStore');
      expect(architectureContent).toContain('create<UserState>');
    });

    it('should document custom hooks', () => {
      expect(architectureContent).toContain('lib/hooks/use-api-integration.ts');
      expect(architectureContent).toContain('useAPIIntegration');
      expect(architectureContent).toContain('useCircuitBreaker');
      expect(architectureContent).toContain('useRequestCoalescer');
    });
  });

  describe('Backend Architecture Validation', () => {
    it('should document API routes structure', () => {
      expect(architectureContent).toContain('app/api/');
      expect(architectureContent).toContain('auth/');
      expect(architectureContent).toContain('content-ideas/');
      expect(architectureContent).toContain('health/route.ts');
      expect(architectureContent).toContain('metrics/route.ts');
      
      // Vérifier que les routes principales existent
      expect(existsSync('app/api/health/route.ts')).toBe(true);
      expect(existsSync('app/api/metrics/route.ts')).toBe(true);
      expect(existsSync('app/api/content-ideas/generate/route.ts')).toBe(true);
    });

    it('should document middleware stack', () => {
      expect(architectureContent).toContain('lib/middleware/api-auth.ts');
      expect(architectureContent).toContain('withAuth');
      expect(architectureContent).toContain('validateAPIKey');
      expect(architectureContent).toContain('checkRateLimit');
      
      // Vérifier que le middleware existe
      expect(existsSync('lib/middleware/api-auth.ts')).toBe(true);
    });

    it('should document services architecture', () => {
      expect(architectureContent).toContain('ContentGenerationService');
      expect(architectureContent).toContain('lib/services/content-generation-service.ts');
      expect(architectureContent).toContain('generateContentIdeas');
      expect(architectureContent).toContain('personalizeMessage');
      
      // Vérifier que les services existent
      expect(existsSync('lib/services/content-generation-service.ts')).toBe(true);
      expect(existsSync('lib/services/content-idea-generator.ts')).toBe(true);
      expect(existsSync('lib/services/message-personalization.ts')).toBe(true);
    });
  });

  describe('Resilience Services Validation', () => {
    it('should document circuit breaker pattern', () => {
      expect(architectureContent).toContain('Circuit Breaker Pattern');
      expect(architectureContent).toContain('AdvancedCircuitBreaker');
      expect(architectureContent).toContain('lib/services/advanced-circuit-breaker.ts');
      expect(architectureContent).toContain('CircuitBreakerOpenError');
      
      // Vérifier que les services de résilience existent
      expect(existsSync('lib/services/circuit-breaker.ts')).toBe(true);
      expect(existsSync('lib/services/advanced-circuit-breaker.ts')).toBe(true);
    });

    it('should document circuit breaker states', () => {
      expect(architectureContent).toContain('CLOSED');
      expect(architectureContent).toContain('OPEN');
      expect(architectureContent).toContain('HALF_OPEN');
    });

    it('should document circuit breaker methods', () => {
      expect(architectureContent).toContain('execute');
      expect(architectureContent).toContain('onSuccess');
      expect(architectureContent).toContain('onFailure');
      expect(architectureContent).toContain('shouldAttemptReset');
    });

    it('should validate circuit breaker implementation exists', () => {
      const circuitBreakerFile = 'lib/services/advanced-circuit-breaker.ts';
      
      if (existsSync(circuitBreakerFile)) {
        const content = readFileSync(circuitBreakerFile, 'utf-8');
        
        expect(content).toContain('AdvancedCircuitBreaker');
        expect(content).toContain('execute');
        expect(content).toContain('CLOSED');
        expect(content).toContain('OPEN');
        expect(content).toContain('HALF_OPEN');
      }
    });
  });

  describe('Code Examples Validation', () => {
    it('should have valid TypeScript syntax in examples', () => {
      // Extraire les blocs de code TypeScript
      const codeBlocks = architectureContent.match(/```typescript\n([\s\S]*?)\n```/g);
      
      expect(codeBlocks).toBeDefined();
      expect(codeBlocks!.length).toBeGreaterThan(0);
      
      codeBlocks!.forEach((block, index) => {
        const code = block.replace(/```typescript\n/, '').replace(/\n```/, '');
        
        // Vérifications basiques de syntaxe TypeScript
        expect(code).not.toContain('undefined variable');
        expect(code).not.toMatch(/\s+$/m); // Pas d'espaces en fin de ligne
        
        // Vérifier que les interfaces sont bien définies
        if (code.includes('interface ')) {
          expect(code).toMatch(/interface\s+\w+\s*{/);
        }
        
        // Vérifier que les classes sont bien définies
        if (code.includes('class ')) {
          expect(code).toMatch(/class\s+\w+\s*{/);
        }
      });
    });

    it('should have consistent code formatting', () => {
      const codeBlocks = architectureContent.match(/```typescript\n([\s\S]*?)\n```/g);
      
      codeBlocks!.forEach(block => {
        const code = block.replace(/```typescript\n/, '').replace(/\n```/, '');
        
        // Vérifier l'indentation (2 espaces)
        const lines = code.split('\n');
        lines.forEach(line => {
          if (line.trim() && line.startsWith(' ')) {
            const leadingSpaces = line.match(/^ */)?.[0].length || 0;
            expect(leadingSpaces % 2).toBe(0); // Indentation par multiples de 2
          }
        });
      });
    });

    it('should reference existing files in examples', () => {
      // Extraire les références de fichiers dans les exemples
      const fileReferences = architectureContent.match(/['"](lib|components|app)\/[^'"]+\.tsx?['"]/g);
      
      if (fileReferences) {
        fileReferences.forEach(ref => {
          const filePath = ref.replace(/['"]/g, '');
          
          // Certains fichiers sont des exemples, on vérifie seulement les principaux
          const criticalFiles = [
            'lib/services/content-generation-service.ts',
            'lib/services/advanced-circuit-breaker.ts',
            'lib/middleware/api-auth.ts',
            'components/admin/Layout.tsx'
          ];
          
          if (criticalFiles.includes(filePath)) {
            expect(existsSync(filePath), `Referenced file ${filePath} should exist`).toBe(true);
          }
        });
      }
    });
  });

  describe('Documentation Completeness', () => {
    it('should have sufficient detail for each section', () => {
      const sections = architectureContent.split(/^## /m);
      
      // Chaque section devrait avoir au moins 100 caractères de contenu
      sections.forEach((section, index) => {
        if (index > 0) { // Skip the title
          expect(section.length).toBeGreaterThan(100);
        }
      });
    });

    it('should have proper French language', () => {
      // Vérifier quelques patterns de français correct
      expect(architectureContent).toContain('Vue d\'ensemble');
      expect(architectureContent).toContain('Sécurité');
      expect(architectureContent).toContain('Déploiement');
      
      // Vérifier qu'il n'y a pas de mélange anglais/français évident
      expect(architectureContent).not.toMatch(/\bthe\b.*\ble\b/);
      expect(architectureContent).not.toMatch(/\band\b.*\bet\b/);
    });

    it('should have consistent emoji usage', () => {
      // Vérifier que chaque section principale a un emoji
      const mainHeaders = architectureContent.match(/^## [🎯💻🎨⚙️🛡️📊🔒💾🧪🚀]/gm);
      
      expect(mainHeaders).toBeDefined();
      expect(mainHeaders!.length).toBeGreaterThan(5);
    });
  });

  describe('Cross-Reference Validation', () => {
    it('should reference existing architecture files', () => {
      // Vérifier que les autres fichiers d'architecture existent
      const relatedFiles = [
        'ARCHITECTURE_EXPLAINED.md',
        'ARCHITECTURE_COMPLETE.md'
      ];
      
      relatedFiles.forEach(file => {
        expect(existsSync(file), `Related architecture file ${file} should exist`).toBe(true);
      });
    });

    it('should be consistent with other architecture docs', () => {
      if (existsSync('ARCHITECTURE_EXPLAINED.md')) {
        const explainedContent = readFileSync('ARCHITECTURE_EXPLAINED.md', 'utf-8');
        
        // Vérifier que les concepts clés sont cohérents
        const keyConcepts = ['Circuit Breaker', 'Monitoring', 'Next.js', 'TypeScript'];
        
        keyConcepts.forEach(concept => {
          const inDetailed = architectureContent.includes(concept);
          const inExplained = explainedContent.includes(concept);
          
          if (inDetailed || inExplained) {
            expect(inDetailed && inExplained, 
              `Concept "${concept}" should be consistent across architecture docs`
            ).toBe(true);
          }
        });
      }
    });
  });
});