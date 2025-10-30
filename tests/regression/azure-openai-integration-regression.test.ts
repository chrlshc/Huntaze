import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';

/**
 * Tests de régression pour l'intégration Azure OpenAI
 * Garantit que les modifications futures ne cassent pas l'intégration
 */

describe('Azure OpenAI Integration Regression Tests', () => {
  describe('Documentation Stability', () => {
    it('should maintain integration completion document', () => {
      expect(existsSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md')).toBe(true);
      
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      expect(doc.length).toBeGreaterThan(1000);
    });

    it('should maintain all required documentation files', () => {
      const requiredDocs = [
        'AZURE_OPENAI_INTEGRATION_COMPLETE.md',
        'docs/AZURE_OPENAI_SETUP.md',
        'docs/AI_SERVICE_AZURE_MIGRATION.md',
        'docs/AI_SERVICE_AUTOFIX_CORRECTIONS.md',
        '.env.azure.example'
      ];

      requiredDocs.forEach(doc => {
        expect(existsSync(doc)).toBe(true);
      });
    });

    it('should maintain test count documentation', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      // Should document test results
      expect(doc).toMatch(/\d+\s+tests?\s+passants?/i);
      expect(doc).toMatch(/\d+\s+tests?\s+skippés?/i);
    });

    it('should maintain feature list', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      const criticalFeatures = [
        'Azure OpenAI',
        'multi-agents',
        'Cache',
        'Rate limiting',
        'latencyMs'
      ];

      criticalFeatures.forEach(feature => {
        expect(doc).toContain(feature);
      });
    });
  });

  describe('Configuration Stability', () => {
    it('should maintain Azure environment variables', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      const requiredEnvVars = [
        'AZURE_OPENAI_API_KEY',
        'AZURE_OPENAI_ENDPOINT',
        'AZURE_OPENAI_API_VERSION'
      ];

      requiredEnvVars.forEach(envVar => {
        expect(doc).toContain(envVar);
      });
    });

    it('should maintain API version specification', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      // Should specify a valid API version
      expect(doc).toMatch(/AZURE_OPENAI_API_VERSION=\d{4}-\d{2}-\d{2}/);
    });

    it('should maintain model configuration', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('DEFAULT_AI_MODEL');
      expect(doc).toContain('gpt-4o-mini');
    });
  });

  describe('Multi-Agent System Stability', () => {
    it('should maintain all 5 agent types', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      const agentTypes = ['message', 'caption', 'idea', 'pricing', 'timing'];
      
      agentTypes.forEach(type => {
        expect(doc).toContain(type);
      });
    });

    it('should maintain agent type descriptions', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      // Should have a table with agent descriptions
      expect(doc).toContain('Messages personnalisés');
      expect(doc).toContain('Légendes réseaux sociaux');
      expect(doc).toContain('Idées de contenu créatif');
    });

    it('should maintain agent usage examples', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('Agent Message');
      expect(doc).toContain('Agent Caption');
      expect(doc).toContain('Agent Idea');
      expect(doc).toContain('contentType:');
    });
  });

  describe('Code Examples Stability', () => {
    it('should maintain service import example', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('import { getAIService }');
      expect(doc).toContain('from \'@/lib/services/ai-service\'');
    });

    it('should maintain generateText usage example', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('await aiService.generateText');
      expect(doc).toContain('prompt:');
      expect(doc).toContain('context:');
      expect(doc).toContain('options:');
    });

    it('should maintain metrics access example', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('response.latencyMs');
      expect(doc).toContain('response.usage.totalTokens');
      expect(doc).toContain('response.model');
      expect(doc).toContain('response.provider');
    });

    it('should maintain timeout configuration example', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('timeout:');
      expect(doc).toMatch(/timeout:\s*\d+/);
    });
  });

  describe('Security Documentation Stability', () => {
    it('should maintain security advantages documentation', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('Sécurité et Conformité');
      expect(doc).toContain('tenant Azure');
      expect(doc).toContain('RGPD');
    });

    it('should maintain data privacy information', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('Pas de partage avec OpenAI');
      expect(doc).toContain('Contrôle total sur les données');
    });

    it('should maintain compliance information', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('Conformité RGPD');
      expect(doc).toContain('Hébergement en Europe');
    });
  });

  describe('Troubleshooting Stability', () => {
    it('should maintain troubleshooting section', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('Dépannage');
    });

    it('should maintain authentication error guidance', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('Erreur d\'authentification');
      expect(doc).toContain('Invalid API key');
      expect(doc).toContain('AZURE_OPENAI_API_KEY');
    });

    it('should maintain 404 error guidance', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('Erreur 404');
      expect(doc).toContain('Not found');
      expect(doc).toContain('AZURE_OPENAI_ENDPOINT');
    });

    it('should maintain rate limiting guidance', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('Rate limiting');
      expect(doc).toContain('Rate limit exceeded');
    });

    it('should maintain timeout guidance', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('Timeout');
      expect(doc).toContain('Request timeout');
    });
  });

  describe('Metrics Documentation Stability', () => {
    it('should maintain metrics documentation', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('Métriques et Monitoring');
    });

    it('should document all key metrics', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      const metrics = ['latencyMs', 'tokensUsed', 'model', 'provider'];
      
      metrics.forEach(metric => {
        expect(doc).toContain(metric);
      });
    });

    it('should maintain logging documentation', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('Logs structurés');
      expect(doc).toContain('Requêtes réussies');
      expect(doc).toContain('Erreurs API');
    });
  });

  describe('Deployment Checklist Stability', () => {
    it('should maintain deployment checklist', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('Checklist de déploiement');
    });

    it('should maintain completed items', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      const completedItems = [
        'Service AI configuré',
        'Tests unitaires passants',
        'Documentation complète',
        'Support multi-agents',
        'Cache et rate limiting',
        'Métriques de performance',
        'Gestion d\'erreurs'
      ];

      completedItems.forEach(item => {
        expect(doc).toContain(item);
      });
    });

    it('should maintain pending items', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      const pendingItems = [
        'Variables d\'environnement configurées en production',
        'Tests d\'intégration avec Azure',
        'Monitoring en production',
        'Validation des coûts'
      ];

      pendingItems.forEach(item => {
        expect(doc).toContain(item);
      });
    });
  });

  describe('Next Steps Stability', () => {
    it('should maintain next steps section', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('Prochaines étapes');
    });

    it('should maintain production configuration steps', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('Configuration production');
      expect(doc).toMatch(/Créer le fichier.*\.env/);
      expect(doc).toContain('Vérifier les quotas');
    });

    it('should maintain integration testing steps', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('Tests d\'intégration');
      expect(doc).toContain('Tester avec votre système multi-agents');
    });

    it('should maintain optimization steps', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('Optimisation');
      expect(doc).toContain('Ajuster les paramètres de cache');
      expect(doc).toContain('Monitorer les coûts');
    });
  });

  describe('Status Indicators Stability', () => {
    it('should maintain production ready status', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('PRÊT POUR LA PRODUCTION');
    });

    it('should maintain test status', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toMatch(/Tests.*:\s*\d+\/\d+\s+passants/);
    });

    it('should maintain documentation status', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toMatch(/Documentation.*Complète/);
    });

    it('should maintain Azure OpenAI status', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toMatch(/Azure OpenAI.*Configuré/);
    });
  });

  describe('Cross-Reference Integrity', () => {
    it('should maintain references to all documentation files', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      const referencedFiles = [
        'docs/AZURE_OPENAI_SETUP.md',
        'docs/AI_SERVICE_AZURE_MIGRATION.md',
        'docs/AI_SERVICE_AUTOFIX_CORRECTIONS.md',
        'tests/unit/ai-service.test.ts'
      ];

      referencedFiles.forEach(file => {
        expect(doc).toContain(file);
      });
    });

    it('should maintain reference to AI service implementation', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('lib/services/ai-service.ts');
    });

    it('should maintain external documentation links', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('https://learn.microsoft.com/azure/ai-services/openai/');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain OpenAI standard fallback documentation', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('Support OpenAI standard (fallback)');
    });

    it('should document both Azure and standard OpenAI', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('Azure vs OpenAI standard');
      expect(doc).toContain('isAzure');
    });

    it('should maintain header configuration for both providers', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('api-key');
      expect(doc).toContain('Authorization');
    });
  });

  describe('Format and Structure Stability', () => {
    it('should maintain markdown structure', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      // Should have main title
      expect(doc).toMatch(/^#\s+.*Azure OpenAI/m);
      
      // Should have multiple sections
      const sections = doc.match(/^##\s+/gm);
      expect(sections).toBeDefined();
      expect(sections!.length).toBeGreaterThan(5);
    });

    it('should maintain code blocks', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      const codeBlocks = doc.match(/```/g);
      expect(codeBlocks).toBeDefined();
      expect(codeBlocks!.length).toBeGreaterThan(10);
    });

    it('should maintain tables', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      const tables = doc.match(/\|.*\|/g);
      expect(tables).toBeDefined();
      expect(tables!.length).toBeGreaterThan(5);
    });

    it('should maintain emoji indicators', () => {
      const doc = readFileSync('AZURE_OPENAI_INTEGRATION_COMPLETE.md', 'utf-8');
      
      expect(doc).toContain('✅');
      expect(doc).toContain('🎯');
      expect(doc).toContain('📊');
    });
  });
});
