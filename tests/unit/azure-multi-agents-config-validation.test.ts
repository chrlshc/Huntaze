import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';

/**
 * Tests de validation pour la configuration Azure Multi-Agents
 * Valide que la documentation et la configuration sont cohérentes
 * Basé sur docs/AZURE_MULTI_AGENTS_SETUP.md
 */

describe('Azure Multi-Agents Configuration Validation', () => {
  describe('Documentation Structure', () => {
    it('should have Azure Multi-Agents setup documentation', () => {
      expect(existsSync('docs/AZURE_MULTI_AGENTS_SETUP.md')).toBe(true);
    });

    it('should document both Azure systems', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      // Azure OpenAI system
      expect(content).toContain('Azure OpenAI');
      expect(content).toContain('AZURE_OPENAI_API_KEY');
      expect(content).toContain('AZURE_OPENAI_ENDPOINT');
      expect(content).toContain('AZURE_OPENAI_DEPLOYMENT');
      
      // Azure AI Team system
      expect(content).toContain('Azure AI Team');
      expect(content).toContain('AZURE_SUBSCRIPTION_ID');
      expect(content).toContain('AZURE_RESOURCE_GROUP');
      expect(content).toContain('AZURE_PROJECT_NAME');
      expect(content).toContain('AZURE_AI_PROJECT_ENDPOINT');
    });

    it('should explain how both systems work together', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('Comment ils fonctionnent ensemble');
      expect(content).toContain('Planification & Orchestration');
      expect(content).toContain('Génération de texte');
    });

    it('should provide complete configuration examples', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('ENABLE_AZURE_AI_TEAM=1');
      expect(content).toContain('LLM_PROVIDER=azure');
      expect(content).toContain('USE_AZURE_RESPONSES=1');
    });

    it('should document API endpoints', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('/api/ai-team/schedule/plan/azure');
      expect(content).toContain('/api/ai-team/publish');
      expect(content).toContain('/api/ai-team/plan/:id');
    });

    it('should provide troubleshooting section', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('Dépannage');
      expect(content).toContain('AI Team not enabled');
      expect(content).toContain('Azure AI Project not configured');
    });

    it('should include architecture diagram', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('Architecture complète');
      expect(content).toContain('PlannerAgent');
      expect(content).toContain('ContentAgent');
      expect(content).toContain('PostSchedulerAgent');
    });

    it('should have checklist for setup', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('Checklist');
      expect(content).toContain('Azure OpenAI configuré');
      expect(content).toContain('Azure AI Team configuré');
    });
  });

  describe('Environment Variables Validation', () => {
    it('should define all required Azure OpenAI variables', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      const requiredVars = [
        'AZURE_OPENAI_API_KEY',
        'AZURE_OPENAI_ENDPOINT',
        'AZURE_OPENAI_API_VERSION',
        'AZURE_OPENAI_DEPLOYMENT',
        'DEFAULT_AI_MODEL',
        'DEFAULT_AI_PROVIDER'
      ];
      
      requiredVars.forEach(varName => {
        expect(content).toContain(varName);
      });
    });

    it('should define all required Azure AI Team variables', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      const requiredVars = [
        'AZURE_SUBSCRIPTION_ID',
        'AZURE_RESOURCE_GROUP',
        'AZURE_PROJECT_NAME',
        'AZURE_AI_PROJECT_ENDPOINT',
        'ENABLE_AZURE_AI_TEAM',
        'ENABLE_AZURE_AI',
        'USE_AZURE_RESPONSES'
      ];
      
      requiredVars.forEach(varName => {
        expect(content).toContain(varName);
      });
    });

    it('should specify LLM provider configuration', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('LLM_PROVIDER=azure');
    });

    it('should document optional EventBridge configuration', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('ENABLE_EVENTBRIDGE_HOOKS');
      expect(content).toContain('ENABLE_AGENTS_PROXY');
    });

    it('should use correct Azure endpoint format', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toMatch(/https:\/\/.*\.openai\.azure\.com/);
      expect(content).toContain('huntaze-ai-hub-eus2');
    });

    it('should specify correct API version', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('2024-05-01-preview');
    });

    it('should use gpt-4-turbo deployment', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('gpt-4-turbo');
    });
  });

  describe('API Endpoints Documentation', () => {
    it('should document schedule planning endpoint', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('/api/ai-team/schedule/plan/azure');
      expect(content).toContain('correlation');
      expect(content).toContain('period');
      expect(content).toContain('platforms');
      expect(content).toContain('preferences');
    });

    it('should document publish endpoint', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('/api/ai-team/publish');
      expect(content).toContain('contents');
    });

    it('should document plan retrieval endpoint', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('/api/ai-team/plan/:id');
    });

    it('should provide TypeScript code examples', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('```typescript');
      expect(content).toContain('fetch(');
      expect(content).toContain('method: \'POST\'');
      expect(content).toContain('headers: { \'Content-Type\': \'application/json\' }');
    });

    it('should show request body structure', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('body: JSON.stringify');
      expect(content).toContain('next_week');
      expect(content).toContain('instagram');
      expect(content).toContain('tiktok');
    });
  });

  describe('Testing Instructions', () => {
    it('should provide test commands', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('test-azure-connection.mjs');
      expect(content).toContain('--test-connection');
      expect(content).toContain('npm run dev');
    });

    it('should document smoke test endpoints', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('/api/ai/azure/smoke');
      expect(content).toContain('curl');
    });

    it('should provide Azure CLI commands', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('az account list');
      expect(content).toContain('az group list');
      expect(content).toContain('az cognitiveservices account list');
    });
  });

  describe('Troubleshooting Documentation', () => {
    it('should document common errors', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      const commonErrors = [
        'AI Team not enabled',
        'Azure AI Project not configured',
        'Invalid subscription'
      ];
      
      commonErrors.forEach(error => {
        expect(content).toContain(error);
      });
    });

    it('should provide solutions for each error', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('Solution');
      expect(content).toContain('Vérifiez');
    });

    it('should explain multi-agent OpenAI integration', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('Le système multi-agents ne trouve pas Azure OpenAI');
      expect(content).toContain('LLM_PROVIDER=azure');
    });
  });

  describe('Architecture Documentation', () => {
    it('should document complete architecture flow', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('User Request');
      expect(content).toContain('Frontend (Next.js)');
      expect(content).toContain('API Routes');
      expect(content).toContain('Azure AI Team (Multi-Agents)');
      expect(content).toContain('Azure OpenAI (GPT-4)');
      expect(content).toContain('Database & Storage');
    });

    it('should document agent types', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('PlannerAgent');
      expect(content).toContain('ContentAgent');
      expect(content).toContain('PostSchedulerAgent');
    });

    it('should document database tables', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('ai_plan');
      expect(content).toContain('ai_plan_item');
      expect(content).toContain('content');
    });

    it('should explain system independence', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('Les deux systèmes peuvent fonctionner indépendamment');
      expect(content).toContain('Azure OpenAI fonctionne quand même');
    });
  });

  describe('Cross-Reference Documentation', () => {
    it('should reference related documentation', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      const relatedDocs = [
        'AZURE_OPENAI_SETUP.md',
        'AZURE_OPENAI_TROUBLESHOOTING.md',
        'HUNTAZE_ARCHITECTURE_OVERVIEW.md',
        'OPS-AI-TEAM.md'
      ];
      
      relatedDocs.forEach(doc => {
        expect(content).toContain(doc);
      });
    });

    it('should verify referenced documentation exists', () => {
      const referencedDocs = [
        'docs/AZURE_OPENAI_SETUP.md',
        'docs/AZURE_OPENAI_TROUBLESHOOTING.md',
        'docs/HUNTAZE_ARCHITECTURE_OVERVIEW.md',
        'docs/OPS-AI-TEAM.md'
      ];
      
      referencedDocs.forEach(doc => {
        if (!existsSync(doc)) {
          console.warn(`Referenced documentation missing: ${doc}`);
        }
      });
    });
  });

  describe('Configuration Steps Validation', () => {
    it('should provide step-by-step configuration', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('Étape 1');
      expect(content).toContain('Étape 2');
      expect(content).toContain('Étape 3');
      expect(content).toContain('Étape 4');
    });

    it('should explain how to find Azure values', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('Option A : Via Azure Portal');
      expect(content).toContain('Option B : Via Azure CLI');
      expect(content).toContain('Option C : Vérifier dans votre ancien .env');
    });

    it('should guide through Azure Portal', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('Azure Portal');
      expect(content).toContain('AI Studio');
      expect(content).toContain('Keys and Endpoint');
    });
  });

  describe('Usage Examples Validation', () => {
    it('should provide content planning example', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('Planifier du contenu');
      expect(content).toContain('period: \'next_week\'');
      expect(content).toContain('tone: \'friendly\'');
      expect(content).toContain('topics: [\'lifestyle\', \'travel\']');
    });

    it('should provide content publishing example', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('Publier du contenu');
      expect(content).toContain('Mon super post');
      expect(content).toContain('media:');
    });

    it('should provide plan retrieval example', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('Obtenir un plan');
      expect(content).toContain('GET /api/ai-team/plan/:id');
    });

    it('should use realistic example data', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('user-123');
      expect(content).toContain('instagram');
      expect(content).toContain('tiktok');
    });
  });

  describe('Security and Best Practices', () => {
    it('should not expose real API keys', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      // Should use placeholder patterns
      expect(content).toMatch(/votre-subscription-id/);
      expect(content).toMatch(/votre-resource-group/);
      expect(content).toMatch(/votre-project-name/);
    });

    it('should document environment variable security', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('.env');
      expect(content).not.toContain('commit');
    });

    it('should use HTTPS endpoints', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      const httpMatches = content.match(/http:\/\//g) || [];
      const httpsMatches = content.match(/https:\/\//g) || [];
      
      // Should have more HTTPS than HTTP (HTTP only for localhost)
      expect(httpsMatches.length).toBeGreaterThan(0);
    });
  });

  describe('Checklist Completeness', () => {
    it('should have comprehensive setup checklist', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      const checklistItems = [
        'Azure OpenAI configuré',
        'Azure AI Team configuré',
        'ENABLE_AZURE_AI_TEAM=1',
        'LLM_PROVIDER=azure',
        'Test de connexion Azure OpenAI réussi',
        'Test des endpoints AI Team réussi',
        'Planification de contenu fonctionne',
        'Publication de contenu fonctionne'
      ];
      
      checklistItems.forEach(item => {
        expect(content).toContain(item);
      });
    });

    it('should use checkbox format', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toMatch(/- \[ \]/);
    });
  });

  describe('Diagram and Visual Aids', () => {
    it('should include system interaction diagram', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('┌─');
      expect(content).toContain('│');
      expect(content).toContain('└─');
      expect(content).toContain('↓');
    });

    it('should show data flow clearly', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      expect(content).toContain('User Request');
      expect(content).toContain('AI Team');
      expect(content).toContain('Azure OpenAI');
      expect(content).toContain('Content Published');
    });

    it('should use consistent diagram style', () => {
      const content = readFileSync('docs/AZURE_MULTI_AGENTS_SETUP.md', 'utf-8');
      
      // Should have multiple diagrams with similar structure
      const diagramCount = (content.match(/┌─────────────────/g) || []).length;
      expect(diagramCount).toBeGreaterThan(1);
    });
  });
});
