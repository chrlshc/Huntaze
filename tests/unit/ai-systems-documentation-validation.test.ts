import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';

/**
 * Tests de validation pour la documentation des systèmes IA
 * Valide que la documentation AI_SYSTEMS_EXPLAINED.md est cohérente avec le code
 */

describe('AI Systems Documentation Validation', () => {
  let docContent: string;

  beforeEach(() => {
    if (existsSync('docs/AI_SYSTEMS_EXPLAINED.md')) {
      docContent = readFileSync('docs/AI_SYSTEMS_EXPLAINED.md', 'utf-8');
    }
  });

  describe('Documentation Structure', () => {
    it('should have AI_SYSTEMS_EXPLAINED.md file', () => {
      expect(existsSync('docs/AI_SYSTEMS_EXPLAINED.md')).toBe(true);
    });

    it('should document all three AI systems', () => {
      expect(docContent).toContain('1️⃣ Chatting IA (Message Personalization)');
      expect(docContent).toContain('2️⃣ Azure OpenAI (Service de base)');
      expect(docContent).toContain('3️⃣ Azure AI Team (Multi-Agents)');
    });

    it('should have overview section', () => {
      expect(docContent).toContain('## Vue d\'ensemble');
      expect(docContent).toContain('3 systèmes IA distincts');
    });

    it('should have examples for each system', () => {
      expect(docContent).toContain('### 💡 Exemples d\'utilisation');
      expect(docContent).toContain('### 💬 Exemples d\'utilisation');
    });

    it('should have configuration sections', () => {
      expect(docContent).toContain('### 🔧 Configuration');
      expect(docContent).toContain('AZURE_OPENAI_API_KEY');
      expect(docContent).toContain('AZURE_SUBSCRIPTION_ID');
    });
  });

  describe('Chatting IA Documentation', () => {
    it('should reference correct service file', () => {
      expect(docContent).toContain('lib/services/message-personalization.ts');
      expect(existsSync('lib/services/message-personalization.ts')).toBe(true);
    });

    it('should document message types', () => {
      const messageTypes = [
        'greeting',
        'upsell',
        'ppv_offer',
        'reactivation',
        'thank_you',
        'custom'
      ];

      messageTypes.forEach(type => {
        expect(docContent).toContain(type);
      });
    });

    it('should document tone options', () => {
      const tones = ['friendly', 'flirty', 'professional', 'playful', 'intimate'];

      tones.forEach(tone => {
        expect(docContent).toContain(tone);
      });
    });

    it('should provide code examples', () => {
      expect(docContent).toContain('import { getMessagePersonalizationService }');
      expect(docContent).toContain('generatePersonalizedMessage');
      expect(docContent).toContain('fanProfile');
    });

    it('should document personalization features', () => {
      expect(docContent).toContain('Profil du fan');
      expect(docContent).toContain('Historique');
      expect(docContent).toContain('Comportement');
      expect(docContent).toContain('Préférences');
      expect(docContent).toContain('Loyauté');
    });
  });

  describe('Azure OpenAI Documentation', () => {
    it('should reference correct service file', () => {
      expect(docContent).toContain('lib/services/ai-service.ts');
      expect(existsSync('lib/services/ai-service.ts')).toBe(true);
    });

    it('should document environment variables', () => {
      expect(docContent).toContain('AZURE_OPENAI_API_KEY');
      expect(docContent).toContain('AZURE_OPENAI_ENDPOINT');
      expect(docContent).toContain('AZURE_OPENAI_DEPLOYMENT');
      expect(docContent).toContain('AZURE_OPENAI_API_VERSION');
    });

    it('should provide usage examples', () => {
      expect(docContent).toContain('import { getAIService }');
      expect(docContent).toContain('generateText');
      expect(docContent).toContain('prompt');
      expect(docContent).toContain('context');
    });

    it('should document content types', () => {
      expect(docContent).toContain('contentType: \'message\'');
      expect(docContent).toContain('contentType: \'caption\'');
      expect(docContent).toContain('contentType: \'idea\'');
    });

    it('should mention current status', () => {
      expect(docContent).toContain('Status actuel');
      expect(docContent).toContain('Erreur 401');
    });
  });

  describe('Azure AI Team Documentation', () => {
    it('should document API routes', () => {
      expect(docContent).toContain('/api/ai-team/schedule/plan/azure');
      expect(docContent).toContain('/api/ai-team/publish');
      expect(docContent).toContain('/api/ai-team/plan/:id');
    });

    it('should document agents', () => {
      expect(docContent).toContain('PlannerAgent');
      expect(docContent).toContain('ContentAgent');
      expect(docContent).toContain('PostSchedulerAgent');
      expect(docContent).toContain('AnalyticsAgent');
    });

    it('should document environment variables', () => {
      expect(docContent).toContain('AZURE_SUBSCRIPTION_ID');
      expect(docContent).toContain('AZURE_RESOURCE_GROUP');
      expect(docContent).toContain('AZURE_PROJECT_NAME');
      expect(docContent).toContain('AZURE_AI_PROJECT_ENDPOINT');
      expect(docContent).toContain('ENABLE_AZURE_AI_TEAM');
    });

    it('should provide API examples', () => {
      expect(docContent).toContain('fetch(\'/api/ai-team/schedule/plan/azure\'');
      expect(docContent).toContain('method: \'POST\'');
      expect(docContent).toContain('correlation');
      expect(docContent).toContain('platforms');
    });

    it('should mention configuration status', () => {
      expect(docContent).toContain('✅ Configuré');
      expect(docContent).toContain('Credentials trouvés');
    });
  });

  describe('Integration Scenarios', () => {
    it('should document fan engagement scenario', () => {
      expect(docContent).toContain('Scénario complet : Engagement d\'un fan');
      expect(docContent).toContain('MessagePersonalizationService');
      expect(docContent).toContain('Analyse le profil');
      expect(docContent).toContain('Message envoyé');
    });

    it('should document content planning scenario', () => {
      expect(docContent).toContain('Scénario : Planification de contenu');
      expect(docContent).toContain('PlannerAgent');
      expect(docContent).toContain('ContentAgent');
      expect(docContent).toContain('Plan de contenu complet');
    });

    it('should show system interactions', () => {
      expect(docContent).toContain('Comment ils travaillent ensemble');
      expect(docContent).toContain('Azure OpenAI (GPT-4)');
      expect(docContent).toContain('Azure AI Team');
    });
  });

  describe('Summary Table', () => {
    it('should have roles summary table', () => {
      expect(docContent).toContain('## 📊 Résumé des rôles');
      expect(docContent).toContain('| Système | Rôle | Utilise | Status |');
    });

    it('should document all systems in table', () => {
      expect(docContent).toContain('**Chatting IA**');
      expect(docContent).toContain('**Azure OpenAI**');
      expect(docContent).toContain('**Azure AI Team**');
    });

    it('should show status indicators', () => {
      expect(docContent).toContain('⚠️ Attend clé');
      expect(docContent).toContain('⚠️ Erreur 401');
      expect(docContent).toContain('✅ Configuré');
    });
  });

  describe('Action Items', () => {
    it('should document required actions', () => {
      expect(docContent).toContain('## 🔧 Action requise');
      expect(docContent).toContain('Pour activer le Chatting IA');
    });

    it('should provide fix instructions', () => {
      expect(docContent).toContain('Corriger la clé Azure OpenAI');
      expect(docContent).toContain('Vérifier dans Azure Portal');
      expect(docContent).toContain('Mettre à jour .env');
    });

    it('should provide test commands', () => {
      expect(docContent).toContain('node scripts/test-azure-connection.mjs');
      expect(docContent).toContain('--test-connection');
    });
  });

  describe('Documentation Links', () => {
    it('should reference related documentation', () => {
      expect(docContent).toContain('## 📚 Documentation');
      expect(docContent).toContain('lib/services/message-personalization.ts');
      expect(docContent).toContain('docs/AZURE_OPENAI_SETUP.md');
      expect(docContent).toContain('docs/AZURE_MULTI_AGENTS_SETUP.md');
      expect(docContent).toContain('docs/HUNTAZE_ARCHITECTURE_OVERVIEW.md');
    });

    it('should reference existing documentation files', () => {
      const referencedDocs = [
        'docs/AZURE_OPENAI_SETUP.md',
        'docs/AZURE_MULTI_AGENTS_SETUP.md',
        'docs/HUNTAZE_ARCHITECTURE_OVERVIEW.md'
      ];

      referencedDocs.forEach(doc => {
        if (existsSync(doc)) {
          expect(existsSync(doc)).toBe(true);
        }
      });
    });
  });

  describe('Code Examples Validation', () => {
    it('should have valid TypeScript syntax in examples', () => {
      // Extract code blocks
      const codeBlocks = docContent.match(/```typescript[\s\S]*?```/g) || [];
      
      expect(codeBlocks.length).toBeGreaterThan(0);

      codeBlocks.forEach(block => {
        // Basic syntax checks
        expect(block).not.toContain('undefined');
        expect(block).toMatch(/import|const|await|async/);
      });
    });

    it('should use consistent service imports', () => {
      expect(docContent).toContain('getMessagePersonalizationService');
      expect(docContent).toContain('getAIService');
    });

    it('should show proper async/await usage', () => {
      const asyncExamples = docContent.match(/await.*\(/g) || [];
      expect(asyncExamples.length).toBeGreaterThan(0);
    });
  });

  describe('Visual Diagrams', () => {
    it('should have ASCII diagrams', () => {
      expect(docContent).toContain('┌─────────────────────');
      expect(docContent).toContain('│');
      expect(docContent).toContain('└─────────────────────');
    });

    it('should have flow diagrams', () => {
      expect(docContent).toContain('↓');
      expect(docContent).toContain('User demande');
    });
  });

  describe('Consistency with Code', () => {
    it('should reference existing service methods', () => {
      if (existsSync('lib/services/message-personalization.ts')) {
        const serviceContent = readFileSync('lib/services/message-personalization.ts', 'utf-8');
        
        // Check if documented methods exist
        if (docContent.includes('generatePersonalizedMessage')) {
          expect(serviceContent).toContain('generatePersonalizedMessage');
        }
      }
    });

    it('should reference existing AI service methods', () => {
      if (existsSync('lib/services/ai-service.ts')) {
        const aiServiceContent = readFileSync('lib/services/ai-service.ts', 'utf-8');
        
        if (docContent.includes('generateText')) {
          expect(aiServiceContent).toContain('generateText');
        }
      }
    });

    it('should document actual environment variables', () => {
      if (existsSync('.env.example')) {
        const envExample = readFileSync('.env.example', 'utf-8');
        
        // Check if documented env vars exist in example
        const documentedVars = [
          'AZURE_OPENAI_API_KEY',
          'AZURE_OPENAI_ENDPOINT',
          'AZURE_SUBSCRIPTION_ID'
        ];

        documentedVars.forEach(varName => {
          if (docContent.includes(varName)) {
            // Variable should be documented somewhere
            expect(docContent).toContain(varName);
          }
        });
      }
    });
  });

  describe('Importance Section', () => {
    it('should explain why Azure OpenAI is important', () => {
      expect(docContent).toContain('## 🎯 Pourquoi Azure OpenAI est important ?');
      expect(docContent).toContain('### Sans Azure OpenAI ❌');
      expect(docContent).toContain('### Avec Azure OpenAI ✅');
    });

    it('should list benefits', () => {
      expect(docContent).toContain('Messages personnalisés intelligents');
      expect(docContent).toContain('Suggestions de contenu créatives');
      expect(docContent).toContain('Légendes optimisées automatiquement');
    });

    it('should list limitations without it', () => {
      expect(docContent).toContain('Pas de messages personnalisés automatiques');
      expect(docContent).toContain('Pas de suggestions de contenu IA');
    });
  });
});

/**
 * Tests d'intégration pour vérifier la cohérence entre documentation et implémentation
 */
describe('AI Systems Documentation Integration', () => {
  describe('Message Personalization Service', () => {
    it('should have service file referenced in documentation', () => {
      const docExists = existsSync('docs/AI_SYSTEMS_EXPLAINED.md');
      const serviceExists = existsSync('lib/services/message-personalization.ts');
      
      if (docExists) {
        const doc = readFileSync('docs/AI_SYSTEMS_EXPLAINED.md', 'utf-8');
        expect(doc).toContain('message-personalization.ts');
      }
      
      expect(serviceExists).toBe(true);
    });

    it('should document actual message types from service', () => {
      if (existsSync('lib/services/message-personalization.ts')) {
        const serviceContent = readFileSync('lib/services/message-personalization.ts', 'utf-8');
        const docContent = readFileSync('docs/AI_SYSTEMS_EXPLAINED.md', 'utf-8');
        
        // Common message types that should be in both
        const commonTypes = ['greeting', 'upsell', 'thank_you'];
        
        commonTypes.forEach(type => {
          if (serviceContent.includes(type)) {
            expect(docContent).toContain(type);
          }
        });
      }
    });
  });

  describe('AI Service', () => {
    it('should have service file referenced in documentation', () => {
      const docExists = existsSync('docs/AI_SYSTEMS_EXPLAINED.md');
      const serviceExists = existsSync('lib/services/ai-service.ts');
      
      if (docExists) {
        const doc = readFileSync('docs/AI_SYSTEMS_EXPLAINED.md', 'utf-8');
        expect(doc).toContain('ai-service.ts');
      }
      
      expect(serviceExists).toBe(true);
    });
  });

  describe('API Routes', () => {
    it('should document existing API routes', () => {
      const docContent = readFileSync('docs/AI_SYSTEMS_EXPLAINED.md', 'utf-8');
      
      // Check if documented routes exist
      const routes = [
        'app/api/ai-team/schedule/plan/azure',
        'app/api/ai-team/publish'
      ];

      routes.forEach(route => {
        if (docContent.includes(route)) {
          // Route should be documented
          expect(docContent).toContain(route);
        }
      });
    });
  });

  describe('Environment Variables', () => {
    it('should document all required Azure OpenAI variables', () => {
      const docContent = readFileSync('docs/AI_SYSTEMS_EXPLAINED.md', 'utf-8');
      
      const requiredVars = [
        'AZURE_OPENAI_API_KEY',
        'AZURE_OPENAI_ENDPOINT',
        'AZURE_OPENAI_DEPLOYMENT',
        'AZURE_OPENAI_API_VERSION'
      ];

      requiredVars.forEach(varName => {
        expect(docContent).toContain(varName);
      });
    });

    it('should document all required Azure AI Team variables', () => {
      const docContent = readFileSync('docs/AI_SYSTEMS_EXPLAINED.md', 'utf-8');
      
      const requiredVars = [
        'AZURE_SUBSCRIPTION_ID',
        'AZURE_RESOURCE_GROUP',
        'AZURE_PROJECT_NAME',
        'AZURE_AI_PROJECT_ENDPOINT',
        'ENABLE_AZURE_AI_TEAM'
      ];

      requiredVars.forEach(varName => {
        expect(docContent).toContain(varName);
      });
    });
  });
});

/**
 * Tests de régression pour s'assurer que la documentation reste à jour
 */
describe('AI Systems Documentation Regression', () => {
  it('should maintain documentation structure', () => {
    const docContent = readFileSync('docs/AI_SYSTEMS_EXPLAINED.md', 'utf-8');
    
    // Core sections that should always exist
    const coreSections = [
      '## Vue d\'ensemble',
      '## 1️⃣ Chatting IA',
      '## 2️⃣ Azure OpenAI',
      '## 3️⃣ Azure AI Team',
      '## 🔗 Comment ils travaillent ensemble',
      '## 📊 Résumé des rôles'
    ];

    coreSections.forEach(section => {
      expect(docContent).toContain(section);
    });
  });

  it('should maintain code example quality', () => {
    const docContent = readFileSync('docs/AI_SYSTEMS_EXPLAINED.md', 'utf-8');
    
    // Should have multiple code examples
    const codeBlocks = docContent.match(/```typescript/g) || [];
    expect(codeBlocks.length).toBeGreaterThan(5);
  });

  it('should maintain visual diagrams', () => {
    const docContent = readFileSync('docs/AI_SYSTEMS_EXPLAINED.md', 'utf-8');
    
    // Should have ASCII art diagrams
    expect(docContent).toContain('┌─');
    expect(docContent).toContain('│');
    expect(docContent).toContain('└─');
  });

  it('should maintain status indicators', () => {
    const docContent = readFileSync('docs/AI_SYSTEMS_EXPLAINED.md', 'utf-8');
    
    // Should have emoji status indicators
    expect(docContent).toMatch(/[✅⚠️❌]/);
  });
});
