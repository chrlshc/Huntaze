import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';

/**
 * Tests de validation pour la documentation FIND_AZURE_DEPLOYMENT_NAME.md
 * Valide que la documentation fournit les bonnes informations pour résoudre
 * l'erreur DeploymentNotFound
 */

describe('Azure Deployment Name Documentation', () => {
  let docContent: string;
  const docPath = 'docs/FIND_AZURE_DEPLOYMENT_NAME.md';

  beforeEach(() => {
    if (existsSync(docPath)) {
      docContent = readFileSync(docPath, 'utf-8');
    }
  });

  describe('File Existence and Structure', () => {
    it('should have the documentation file', () => {
      expect(existsSync(docPath)).toBe(true);
    });

    it('should have proper markdown structure', () => {
      expect(docContent).toContain('# Comment trouver');
      expect(docContent).toContain('## Erreur actuelle');
      expect(docContent).toContain('## Solution');
    });

    it('should be in French as per project standards', () => {
      expect(docContent).toContain('Comment trouver');
      expect(docContent).toContain('Étape');
      expect(docContent).toContain('déploiement');
    });
  });

  describe('Error Description', () => {
    it('should document the DeploymentNotFound error', () => {
      expect(docContent).toContain('DeploymentNotFound');
      expect(docContent).toContain("n'existe pas dans cette ressource");
    });

    it('should reference the problematic deployment name', () => {
      expect(docContent).toContain('gpt-4-turbo');
    });

    it('should explain the error clearly', () => {
      expect(docContent).toMatch(/Le déploiement.*n'existe pas/i);
    });
  });

  describe('Solution Steps', () => {
    it('should provide step-by-step instructions', () => {
      expect(docContent).toContain('Étape 1');
      expect(docContent).toContain('Étape 2');
      expect(docContent).toContain('Étape 3');
      expect(docContent).toContain('Étape 4');
    });

    it('should include Azure Portal access instructions', () => {
      expect(docContent).toContain('Azure Portal');
      expect(docContent).toContain('https://portal.azure.com');
    });

    it('should reference the correct Azure OpenAI resource', () => {
      expect(docContent).toContain('huntaze-ai-eus2-29796');
    });

    it('should explain how to find deployments in Azure Portal', () => {
      expect(docContent).toContain('Deployments');
      expect(docContent).toContain('Déploiements');
    });

    it('should explain the difference between model name and deployment name', () => {
      expect(docContent).toContain('Nom du modèle');
      expect(docContent).toContain('Nom du déploiement');
      expect(docContent).toMatch(/différents du nom du modèle/i);
    });

    it('should provide .env configuration instructions', () => {
      expect(docContent).toContain('AZURE_OPENAI_DEPLOYMENT');
      expect(docContent).toContain('.env');
    });
  });

  describe('Azure CLI Alternative', () => {
    it('should provide Azure CLI commands', () => {
      expect(docContent).toContain('Azure CLI');
      expect(docContent).toContain('az cognitiveservices');
    });

    it('should include the correct resource group', () => {
      expect(docContent).toContain('huntaze-ai');
    });

    it('should show how to list deployments', () => {
      expect(docContent).toContain('deployment list');
      expect(docContent).toContain('--query');
    });

    it('should format output as table', () => {
      expect(docContent).toContain('--output table');
    });
  });

  describe('Common Deployment Names', () => {
    it('should list common deployment name patterns', () => {
      expect(docContent).toContain('gpt-4');
      expect(docContent).toContain('gpt4');
      expect(docContent).toContain('gpt-35-turbo');
    });

    it('should provide examples of possible variations', () => {
      const commonNames = [
        'gpt-4',
        'gpt4',
        'gpt-4-deployment',
        'gpt-4-32k',
        'gpt-35-turbo',
        'gpt-4o'
      ];

      commonNames.forEach(name => {
        expect(docContent).toContain(name);
      });
    });
  });

  describe('Resource Information', () => {
    it('should document the Azure OpenAI endpoint', () => {
      expect(docContent).toContain('https://huntaze-ai-eus2-29796.openai.azure.com');
    });

    it('should document the resource group', () => {
      expect(docContent).toContain('Resource Group');
      expect(docContent).toContain('huntaze-ai');
    });

    it('should document the resource name', () => {
      expect(docContent).toContain('Resource Name');
      expect(docContent).toContain('huntaze-ai-eus2-29796');
    });

    it('should document the API version', () => {
      expect(docContent).toContain('API Version');
      expect(docContent).toContain('2024-05-01-preview');
    });
  });

  describe('Testing Instructions', () => {
    it('should reference the test script', () => {
      expect(docContent).toContain('test-azure-connection.mjs');
    });

    it('should provide test command', () => {
      expect(docContent).toContain('node scripts/test-azure-connection.mjs');
    });

    it('should mention restarting the application', () => {
      expect(docContent).toMatch(/Redémarrez.*application/i);
    });
  });

  describe('Help Section', () => {
    it('should provide guidance if no deployments exist', () => {
      expect(docContent).toContain("Si vous ne trouvez aucun déploiement");
    });

    it('should explain how to create a new deployment', () => {
      expect(docContent).toContain('Create new deployment');
      expect(docContent).toContain('Sélectionnez le modèle');
    });

    it('should guide on naming the deployment', () => {
      expect(docContent).toContain('Donnez-lui un nom');
    });
  });

  describe('Visual Indicators', () => {
    it('should use checkmarks for correct examples', () => {
      expect(docContent).toContain('✅');
    });

    it('should use cross marks for incorrect examples', () => {
      expect(docContent).toContain('❌');
    });

    it('should clearly distinguish between correct and incorrect', () => {
      const checkmarkCount = (docContent.match(/✅/g) || []).length;
      const crossCount = (docContent.match(/❌/g) || []).length;
      
      expect(checkmarkCount).toBeGreaterThan(0);
      expect(crossCount).toBeGreaterThan(0);
    });
  });

  describe('Code Blocks', () => {
    it('should have properly formatted bash code blocks', () => {
      expect(docContent).toMatch(/```bash[\s\S]*?```/);
    });

    it('should include environment variable example', () => {
      expect(docContent).toMatch(/AZURE_OPENAI_DEPLOYMENT=.*NOM_EXACT/);
    });

    it('should have Azure CLI command examples', () => {
      expect(docContent).toMatch(/az cognitiveservices/);
    });
  });

  describe('Integration with Existing Documentation', () => {
    it('should complement AZURE_OPENAI_SETUP.md', () => {
      if (existsSync('docs/AZURE_OPENAI_SETUP.md')) {
        const setupDoc = readFileSync('docs/AZURE_OPENAI_SETUP.md', 'utf-8');
        
        // Should reference Azure OpenAI configuration
        expect(setupDoc).toContain('Azure OpenAI');
        
        // Both docs should reference deployment configuration
        expect(docContent).toContain('déploiement');
        expect(setupDoc).toContain('déploiement');
      }
    });

    it('should align with test-azure-connection.mjs script', () => {
      if (existsSync('scripts/test-azure-connection.mjs')) {
        const testScript = readFileSync('scripts/test-azure-connection.mjs', 'utf-8');
        
        // Should use the same environment variable
        expect(testScript).toContain('AZURE_OPENAI_DEPLOYMENT');
      }
    });

    it('should reference the correct endpoint format', () => {
      expect(docContent).toMatch(/https:\/\/.*\.openai\.azure\.com/);
    });
  });

  describe('Troubleshooting Guidance', () => {
    it('should address the specific error message', () => {
      expect(docContent).toContain("Le déploiement 'gpt-4-turbo' n'existe pas");
    });

    it('should explain why the error occurs', () => {
      expect(docContent).toMatch(/peuvent être différents/i);
    });

    it('should provide clear resolution steps', () => {
      expect(docContent).toContain('Mettre à jour la configuration');
      expect(docContent).toContain('Après la mise à jour');
    });
  });

  describe('Accessibility and Readability', () => {
    it('should have clear section headers', () => {
      const headers = docContent.match(/^##\s+.+$/gm);
      expect(headers).toBeDefined();
      expect(headers!.length).toBeGreaterThan(5);
    });

    it('should use numbered lists for sequential steps', () => {
      expect(docContent).toMatch(/^\d+\.\s+/m);
    });

    it('should use bullet points for options', () => {
      expect(docContent).toMatch(/^-\s+/m);
    });

    it('should have reasonable line length', () => {
      const lines = docContent.split('\n');
      const longLines = lines.filter(line => line.length > 120);
      
      // Most lines should be reasonably short
      expect(longLines.length).toBeLessThan(lines.length * 0.2);
    });
  });

  describe('Consistency with Environment Variables', () => {
    it('should match environment variable naming in .env.example', () => {
      if (existsSync('.env.example')) {
        const envExample = readFileSync('.env.example', 'utf-8');
        
        if (envExample.includes('AZURE_OPENAI_DEPLOYMENT')) {
          expect(docContent).toContain('AZURE_OPENAI_DEPLOYMENT');
        }
      }
    });

    it('should reference the same Azure resource across docs', () => {
      const azureDocs = [
        'docs/AZURE_OPENAI_SETUP.md',
        'docs/AZURE_MULTI_AGENTS_SETUP.md',
        'AZURE_COMPLETE_SETUP.md'
      ];

      azureDocs.forEach(docFile => {
        if (existsSync(docFile)) {
          const content = readFileSync(docFile, 'utf-8');
          
          if (content.includes('huntaze-ai-eus2-29796')) {
            expect(docContent).toContain('huntaze-ai-eus2-29796');
          }
        }
      });
    });
  });

  describe('Practical Examples', () => {
    it('should provide concrete deployment name examples', () => {
      const examples = docContent.match(/`gpt-[^`]+`/g);
      expect(examples).toBeDefined();
      expect(examples!.length).toBeGreaterThan(3);
    });

    it('should show both correct and incorrect patterns', () => {
      expect(docContent).toContain('✅ Nom du modèle');
      expect(docContent).toContain('❌ Nom du déploiement');
      expect(docContent).toContain('✅ Nom du déploiement possible');
    });
  });

  describe('Links and References', () => {
    it('should include Azure Portal link', () => {
      expect(docContent).toContain('https://portal.azure.com');
    });

    it('should reference related scripts', () => {
      expect(docContent).toContain('test-azure-connection.mjs');
    });

    it('should have valid markdown links', () => {
      const links = docContent.match(/\[([^\]]+)\]\(([^)]+)\)/g);
      
      if (links) {
        links.forEach(link => {
          expect(link).toMatch(/\[.+\]\(.+\)/);
        });
      }
    });
  });

  describe('Error Prevention', () => {
    it('should warn about common mistakes', () => {
      expect(docContent).toContain('❌');
      expect(docContent).toMatch(/n'existe pas/i);
    });

    it('should emphasize the importance of exact naming', () => {
      expect(docContent).toContain('nom exact');
      expect(docContent).toContain('NOM_EXACT');
    });

    it('should provide validation steps', () => {
      expect(docContent).toContain('Testez la connexion');
      expect(docContent).toContain('test-azure-connection');
    });
  });
});

/**
 * Tests d'intégration pour vérifier que la documentation
 * correspond aux scripts et configurations réels
 */
describe('Azure Deployment Name Documentation Integration', () => {
  const docPath = 'docs/FIND_AZURE_DEPLOYMENT_NAME.md';
  let docContent: string;

  beforeEach(() => {
    if (existsSync(docPath)) {
      docContent = readFileSync(docPath, 'utf-8');
    }
  });

  describe('Script Integration', () => {
    it('should align with test-azure-connection.mjs', () => {
      const scriptPath = 'scripts/test-azure-connection.mjs';
      
      if (existsSync(scriptPath)) {
        const scriptContent = readFileSync(scriptPath, 'utf-8');
        
        // Should reference the same environment variable
        expect(scriptContent).toContain('AZURE_OPENAI_DEPLOYMENT');
        expect(docContent).toContain('AZURE_OPENAI_DEPLOYMENT');
        
        // Should use the same endpoint
        if (scriptContent.includes('huntaze-ai-eus2-29796')) {
          expect(docContent).toContain('huntaze-ai-eus2-29796');
        }
      }
    });

    it('should provide commands that work with existing scripts', () => {
      expect(docContent).toContain('node scripts/test-azure-connection.mjs');
      expect(existsSync('scripts/test-azure-connection.mjs')).toBe(true);
    });
  });

  describe('Configuration Integration', () => {
    it('should match .env.example structure', () => {
      if (existsSync('.env.example')) {
        const envExample = readFileSync('.env.example', 'utf-8');
        
        // This doc focuses specifically on AZURE_OPENAI_DEPLOYMENT
        expect(docContent).toContain('AZURE_OPENAI_DEPLOYMENT');
        
        // Should provide .env configuration guidance
        expect(docContent).toContain('.env');
        expect(docContent).toContain('Mettre à jour la configuration');
      }
    });

    it('should reference correct API version', () => {
      const apiVersion = '2024-05-01-preview';
      expect(docContent).toContain(apiVersion);
      
      // Check if this version is used in other configs
      if (existsSync('docs/AZURE_OPENAI_SETUP.md')) {
        const setupDoc = readFileSync('docs/AZURE_OPENAI_SETUP.md', 'utf-8');
        if (setupDoc.includes(apiVersion)) {
          expect(docContent).toContain(apiVersion);
        }
      }
    });
  });

  describe('Documentation Consistency', () => {
    it('should use consistent resource naming', () => {
      const resourceName = 'huntaze-ai-eus2-29796';
      const resourceGroup = 'huntaze-ai';
      
      expect(docContent).toContain(resourceName);
      expect(docContent).toContain(resourceGroup);
    });

    it('should align with other Azure documentation', () => {
      const azureDocs = [
        'docs/AZURE_OPENAI_SETUP.md',
        'AZURE_COMPLETE_SETUP.md',
        'docs/AZURE_MULTI_AGENTS_SETUP.md'
      ];

      azureDocs.forEach(docFile => {
        if (existsSync(docFile)) {
          const content = readFileSync(docFile, 'utf-8');
          
          // Should reference the same endpoint
          if (content.includes('openai.azure.com')) {
            expect(docContent).toContain('openai.azure.com');
          }
        }
      });
    });
  });

  describe('Practical Validation', () => {
    it('should provide testable instructions', () => {
      // Instructions should be actionable
      expect(docContent).toContain('Connectez-vous');
      expect(docContent).toContain('Cliquez sur');
      expect(docContent).toContain('Notez le');
    });

    it('should include verification steps', () => {
      expect(docContent).toContain('Testez la connexion');
      expect(docContent).toContain('Redémarrez');
    });

    it('should provide fallback options', () => {
      expect(docContent).toContain('Alternative');
      expect(docContent).toContain('Azure CLI');
      expect(docContent).toContain("Si vous ne trouvez aucun déploiement");
    });
  });
});
