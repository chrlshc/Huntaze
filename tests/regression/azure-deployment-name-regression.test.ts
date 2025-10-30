import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';

/**
 * Tests de régression pour la documentation FIND_AZURE_DEPLOYMENT_NAME.md
 * Garantit que les modifications futures maintiennent la cohérence
 */

describe('Azure Deployment Name Documentation Regression', () => {
  const docPath = 'docs/FIND_AZURE_DEPLOYMENT_NAME.md';
  let docContent: string;

  beforeEach(() => {
    if (existsSync(docPath)) {
      docContent = readFileSync(docPath, 'utf-8');
    }
  });

  describe('Critical Information Preservation', () => {
    it('should maintain the error description', () => {
      expect(docContent).toContain('DeploymentNotFound');
      expect(docContent).toContain("n'existe pas dans cette ressource");
    });

    it('should preserve Azure resource information', () => {
      const criticalInfo = [
        'huntaze-ai-eus2-29796',
        'huntaze-ai',
        'https://huntaze-ai-eus2-29796.openai.azure.com',
        '2024-05-01-preview'
      ];

      criticalInfo.forEach(info => {
        expect(docContent).toContain(info);
      });
    });

    it('should maintain environment variable naming', () => {
      expect(docContent).toContain('AZURE_OPENAI_DEPLOYMENT');
    });

    it('should preserve test script reference', () => {
      expect(docContent).toContain('test-azure-connection.mjs');
      expect(docContent).toContain('node scripts/test-azure-connection.mjs');
    });
  });

  describe('Solution Steps Integrity', () => {
    it('should maintain all four main steps', () => {
      expect(docContent).toContain('Étape 1');
      expect(docContent).toContain('Étape 2');
      expect(docContent).toContain('Étape 3');
      expect(docContent).toContain('Étape 4');
    });

    it('should preserve Azure Portal instructions', () => {
      expect(docContent).toContain('Azure Portal');
      expect(docContent).toContain('https://portal.azure.com');
      expect(docContent).toContain('Deployments');
    });

    it('should maintain CLI alternative', () => {
      expect(docContent).toContain('Azure CLI');
      expect(docContent).toContain('az cognitiveservices');
      expect(docContent).toContain('deployment list');
    });
  });

  describe('Example Deployment Names', () => {
    it('should preserve common deployment name examples', () => {
      const requiredExamples = [
        'gpt-4',
        'gpt4',
        'gpt-35-turbo'
      ];

      requiredExamples.forEach(example => {
        expect(docContent).toContain(example);
      });
    });

    it('should maintain visual indicators', () => {
      expect(docContent).toContain('✅');
      expect(docContent).toContain('❌');
    });
  });

  describe('Consistency with Codebase', () => {
    it('should align with test-azure-connection.mjs script', () => {
      if (existsSync('scripts/test-azure-connection.mjs')) {
        const scriptContent = readFileSync('scripts/test-azure-connection.mjs', 'utf-8');
        
        // Should use the same environment variable
        if (scriptContent.includes('AZURE_OPENAI_DEPLOYMENT')) {
          expect(docContent).toContain('AZURE_OPENAI_DEPLOYMENT');
        }

        // Should reference the same endpoint pattern
        if (scriptContent.includes('openai.azure.com')) {
          expect(docContent).toContain('openai.azure.com');
        }
      }
    });

    it('should match environment variable structure', () => {
      if (existsSync('.env.example')) {
        const envExample = readFileSync('.env.example', 'utf-8');
        
        // Check Azure OpenAI variables consistency
        const azureVars = envExample.match(/AZURE_OPENAI_\w+/g);
        
        if (azureVars && azureVars.includes('AZURE_OPENAI_DEPLOYMENT')) {
          expect(docContent).toContain('AZURE_OPENAI_DEPLOYMENT');
        }
      }
    });

    it('should reference existing Azure documentation', () => {
      const relatedDocs = [
        'AZURE_OPENAI_SETUP.md',
        'AZURE_COMPLETE_SETUP.md',
        'AZURE_MULTI_AGENTS_SETUP.md'
      ];

      // At least one related doc should exist
      const existingDocs = relatedDocs.filter(doc => 
        existsSync(`docs/${doc}`) || existsSync(doc)
      );

      expect(existingDocs.length).toBeGreaterThan(0);
    });
  });

  describe('Documentation Quality Standards', () => {
    it('should maintain proper markdown structure', () => {
      // Should have main title
      expect(docContent).toMatch(/^#\s+Comment trouver/m);
      
      // Should have section headers
      const headers = docContent.match(/^##\s+/gm);
      expect(headers).toBeDefined();
      expect(headers!.length).toBeGreaterThan(5);
    });

    it('should preserve code blocks', () => {
      const codeBlocks = docContent.match(/```[\s\S]*?```/g);
      expect(codeBlocks).toBeDefined();
      expect(codeBlocks!.length).toBeGreaterThan(2);
    });

    it('should maintain French language', () => {
      const frenchKeywords = [
        'Comment',
        'Étape',
        'déploiement',
        'Connectez-vous',
        'Cliquez'
      ];

      frenchKeywords.forEach(keyword => {
        expect(docContent).toContain(keyword);
      });
    });

    it('should preserve actionable instructions', () => {
      const actionVerbs = [
        'Connectez-vous',
        'Recherchez',
        'Cliquez',
        'Notez',
        'Mettez à jour',
        'Redémarrez',
        'Testez'
      ];

      const foundVerbs = actionVerbs.filter(verb => 
        docContent.includes(verb)
      );

      expect(foundVerbs.length).toBeGreaterThan(4);
    });
  });

  describe('Error Resolution Guidance', () => {
    it('should maintain troubleshooting section', () => {
      expect(docContent).toContain("Besoin d'aide");
      expect(docContent).toContain("Si vous ne trouvez aucun déploiement");
    });

    it('should preserve deployment creation instructions', () => {
      expect(docContent).toContain('Create new deployment');
      expect(docContent).toContain('Sélectionnez le modèle');
      expect(docContent).toContain('Donnez-lui un nom');
    });

    it('should maintain verification steps', () => {
      expect(docContent).toContain('Après la mise à jour');
      expect(docContent).toContain('Testez la connexion');
    });
  });

  describe('Link and Reference Integrity', () => {
    it('should preserve Azure Portal link', () => {
      expect(docContent).toContain('https://portal.azure.com');
    });

    it('should maintain script references', () => {
      expect(docContent).toContain('scripts/test-azure-connection.mjs');
    });

    it('should keep resource information section', () => {
      expect(docContent).toContain('Informations de votre ressource');
      expect(docContent).toContain('Endpoint');
      expect(docContent).toContain('Resource Group');
      expect(docContent).toContain('Resource Name');
      expect(docContent).toContain('API Version');
    });
  });

  describe('Backward Compatibility', () => {
    it('should not remove critical sections', () => {
      const criticalSections = [
        'Erreur actuelle',
        'Solution',
        'Alternative : Utiliser Azure CLI',
        'Noms de déploiement courants',
        'Après la mise à jour',
        'Informations de votre ressource',
        "Besoin d'aide"
      ];

      criticalSections.forEach(section => {
        expect(docContent).toContain(section);
      });
    });

    it('should maintain example format consistency', () => {
      // Should have both positive and negative examples
      expect(docContent).toContain('✅ Nom du modèle');
      expect(docContent).toContain('❌ Nom du déploiement');
      expect(docContent).toContain('✅ Nom du déploiement possible');
    });

    it('should preserve command examples', () => {
      expect(docContent).toContain('az cognitiveservices account deployment list');
      expect(docContent).toContain('node scripts/test-azure-connection.mjs');
    });
  });

  describe('Integration with Test Scripts', () => {
    it('should reference testable commands', () => {
      const commands = docContent.match(/```bash[\s\S]*?```/g);
      
      expect(commands).toBeDefined();
      expect(commands!.length).toBeGreaterThan(0);
      
      // Should include test command
      const hasTestCommand = commands!.some(cmd => 
        cmd.includes('test-azure-connection')
      );
      expect(hasTestCommand).toBe(true);
    });

    it('should align with existing test infrastructure', () => {
      if (existsSync('scripts/test-azure-connection.mjs')) {
        // Documentation should reference the script
        expect(docContent).toContain('test-azure-connection.mjs');
      }
    });
  });

  describe('Version Consistency', () => {
    it('should maintain API version consistency', () => {
      const apiVersion = '2024-05-01-preview';
      expect(docContent).toContain(apiVersion);
      
      // Check consistency with other Azure docs
      const azureDocs = [
        'docs/AZURE_OPENAI_SETUP.md',
        'AZURE_COMPLETE_SETUP.md'
      ];

      azureDocs.forEach(docFile => {
        if (existsSync(docFile)) {
          const content = readFileSync(docFile, 'utf-8');
          if (content.includes(apiVersion)) {
            expect(docContent).toContain(apiVersion);
          }
        }
      });
    });

    it('should use consistent resource naming', () => {
      const resourceName = 'huntaze-ai-eus2-29796';
      const occurrences = (docContent.match(new RegExp(resourceName, 'g')) || []).length;
      
      // Should appear multiple times (endpoint, resource name, CLI command)
      expect(occurrences).toBeGreaterThan(2);
    });
  });

  describe('User Experience Preservation', () => {
    it('should maintain clear step-by-step format', () => {
      // Should have numbered steps
      const numberedSteps = docContent.match(/^\d+\.\s+/gm);
      expect(numberedSteps).toBeDefined();
      expect(numberedSteps!.length).toBeGreaterThan(5);
    });

    it('should preserve visual hierarchy', () => {
      // Should have proper heading levels
      expect(docContent).toMatch(/^#\s+/m);   // H1
      expect(docContent).toMatch(/^##\s+/m);  // H2
      expect(docContent).toMatch(/^###\s+/m); // H3
    });

    it('should maintain helpful examples', () => {
      // Should have inline code examples
      const inlineCode = docContent.match(/`[^`]+`/g);
      expect(inlineCode).toBeDefined();
      expect(inlineCode!.length).toBeGreaterThan(10);
    });
  });
});

/**
 * Tests de validation croisée avec d'autres composants
 */
describe('Azure Deployment Name Cross-Component Validation', () => {
  const docPath = 'docs/FIND_AZURE_DEPLOYMENT_NAME.md';

  it('should be referenced in related documentation', () => {
    const relatedDocs = [
      'docs/AZURE_OPENAI_SETUP.md',
      'AZURE_COMPLETE_SETUP.md',
      'docs/AZURE_OPENAI_TROUBLESHOOTING.md'
    ];

    // At least one doc should exist and potentially reference this
    const existingDocs = relatedDocs.filter(doc => existsSync(doc));
    expect(existingDocs.length).toBeGreaterThan(0);
  });

  it('should complement test-azure-connection.mjs', () => {
    if (existsSync('scripts/test-azure-connection.mjs')) {
      const docContent = readFileSync(docPath, 'utf-8');
      const scriptContent = readFileSync('scripts/test-azure-connection.mjs', 'utf-8');
      
      // Should reference the same script
      expect(docContent).toContain('test-azure-connection.mjs');
      
      // Should use compatible environment variables
      if (scriptContent.includes('AZURE_OPENAI_DEPLOYMENT')) {
        expect(docContent).toContain('AZURE_OPENAI_DEPLOYMENT');
      }
    }
  });

  it('should align with environment configuration', () => {
    const envFiles = ['.env.example', '.env.azure.example'];
    
    envFiles.forEach(envFile => {
      if (existsSync(envFile)) {
        const envContent = readFileSync(envFile, 'utf-8');
        const docContent = readFileSync(docPath, 'utf-8');
        
        // Should reference the same Azure variables
        if (envContent.includes('AZURE_OPENAI_DEPLOYMENT')) {
          expect(docContent).toContain('AZURE_OPENAI_DEPLOYMENT');
        }
      }
    });
  });
});
