import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';

/**
 * Tests de régression pour le script de test de connexion Azure
 * Garantit que les modifications futures ne cassent pas les fonctionnalités existantes
 */

describe('Azure Connection Script Regression Tests', () => {
  const scriptPath = 'scripts/test-azure-connection.mjs';
  let scriptContent: string;

  beforeEach(() => {
    if (existsSync(scriptPath)) {
      scriptContent = readFileSync(scriptPath, 'utf-8');
    }
  });

  describe('Critical Functionality Preservation', () => {
    it('should maintain shebang for direct execution', () => {
      expect(scriptContent.startsWith('#!/usr/bin/env node')).toBe(true);
    });

    it('should maintain all required environment variable checks', () => {
      const requiredVars = [
        'AZURE_OPENAI_API_KEY',
        'AZURE_OPENAI_ENDPOINT',
        'AZURE_OPENAI_API_VERSION',
        'AZURE_OPENAI_DEPLOYMENT'
      ];

      requiredVars.forEach(varName => {
        expect(scriptContent).toContain(varName);
      });
    });

    it('should maintain dotenv configuration loading', () => {
      expect(scriptContent).toContain("import { config } from 'dotenv'");
      expect(scriptContent).toContain('config({');
      expect(scriptContent).toContain('.env');
    });

    it('should maintain API key masking in output', () => {
      expect(scriptContent).toContain('***');
      expect(scriptContent).toContain('.slice(-4)');
    });

    it('should maintain --test-connection flag support', () => {
      expect(scriptContent).toContain('--test-connection');
      expect(scriptContent).toContain('process.argv.includes');
    });

    it('should maintain exit code 1 on configuration errors', () => {
      expect(scriptContent).toContain('process.exit(1)');
    });
  });

  describe('API Integration Preservation', () => {
    it('should maintain correct Azure OpenAI endpoint construction', () => {
      expect(scriptContent).toContain('/openai/deployments/');
      expect(scriptContent).toContain('/chat/completions');
      expect(scriptContent).toContain('api-version=');
    });

    it('should maintain correct request headers', () => {
      expect(scriptContent).toContain("'api-key'");
      expect(scriptContent).toContain("'Content-Type': 'application/json'");
    });

    it('should maintain correct request body structure', () => {
      expect(scriptContent).toContain('messages');
      expect(scriptContent).toContain('role');
      expect(scriptContent).toContain('content');
      expect(scriptContent).toContain('max_tokens');
    });

    it('should maintain system and user message roles', () => {
      expect(scriptContent).toContain("role: 'system'");
      expect(scriptContent).toContain("role: 'user'");
    });

    it('should maintain test message content', () => {
      expect(scriptContent).toContain('Hello from Huntaze');
    });
  });

  describe('Error Handling Preservation', () => {
    it('should maintain response.ok check', () => {
      expect(scriptContent).toContain('if (response.ok)');
    });

    it('should maintain error response handling', () => {
      expect(scriptContent).toContain('else {');
      expect(scriptContent).toContain('await response.json()');
    });

    it('should maintain network error handling', () => {
      expect(scriptContent).toContain('catch (error)');
      expect(scriptContent).toContain('error.message');
    });

    it('should maintain error exit codes', () => {
      const exitCalls = scriptContent.match(/process\.exit\(1\)/g);
      expect(exitCalls).toBeDefined();
      expect(exitCalls!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Output Format Preservation', () => {
    it('should maintain emoji indicators', () => {
      expect(scriptContent).toContain('🔍');
      expect(scriptContent).toContain('✅');
      expect(scriptContent).toContain('❌');
      expect(scriptContent).toContain('📊');
      expect(scriptContent).toContain('🚀');
    });

    it('should maintain configuration summary section', () => {
      expect(scriptContent).toContain('Configuration détectée');
      expect(scriptContent).toContain('Provider:');
      expect(scriptContent).toContain('Model:');
      expect(scriptContent).toContain('Mode:');
    });

    it('should maintain next steps section', () => {
      expect(scriptContent).toContain('Prochaines étapes');
      expect(scriptContent).toContain('npm test');
      expect(scriptContent).toContain('npm run dev');
      expect(scriptContent).toContain('/api/ai/azure/smoke');
    });

    it('should maintain success messages', () => {
      expect(scriptContent).toContain('Configuration complète');
      expect(scriptContent).toContain('Connexion réussie');
    });

    it('should maintain error messages', () => {
      expect(scriptContent).toContain('Configuration incomplète');
      expect(scriptContent).toContain('Erreur de connexion');
      expect(scriptContent).toContain('Erreur réseau');
    });
  });

  describe('Default Values Preservation', () => {
    it('should maintain default provider fallback', () => {
      expect(scriptContent).toContain('DEFAULT_AI_PROVIDER');
      expect(scriptContent).toContain("|| 'openai'");
    });

    it('should maintain default model fallback', () => {
      expect(scriptContent).toContain('DEFAULT_AI_MODEL');
      expect(scriptContent).toContain('AZURE_OPENAI_DEPLOYMENT');
    });

    it('should maintain default environment fallback', () => {
      expect(scriptContent).toContain('NODE_ENV');
      expect(scriptContent).toContain("|| 'development'");
    });
  });

  describe('Response Parsing Preservation', () => {
    it('should maintain choices array access', () => {
      expect(scriptContent).toContain('data.choices[0]');
      expect(scriptContent).toContain('.message.content');
    });

    it('should maintain usage statistics access', () => {
      expect(scriptContent).toContain('data.usage');
      expect(scriptContent).toContain('.total_tokens');
    });

    it('should maintain JSON parsing', () => {
      expect(scriptContent).toContain('await response.json()');
    });
  });

  describe('Import Statements Preservation', () => {
    it('should maintain dotenv import', () => {
      expect(scriptContent).toContain("import { config } from 'dotenv'");
    });

    it('should maintain URL utilities import', () => {
      expect(scriptContent).toContain("import { fileURLToPath } from 'url'");
    });

    it('should maintain path utilities import', () => {
      expect(scriptContent).toContain("import { dirname, join } from 'path'");
    });
  });

  describe('Variable Declarations Preservation', () => {
    it('should maintain __filename and __dirname setup', () => {
      expect(scriptContent).toContain('const __filename = fileURLToPath(import.meta.url)');
      expect(scriptContent).toContain('const __dirname = dirname(__filename)');
    });

    it('should maintain requiredVars array', () => {
      expect(scriptContent).toContain('const requiredVars');
      expect(scriptContent).toContain('[');
      expect(scriptContent).toContain(']');
    });

    it('should maintain allPresent flag', () => {
      expect(scriptContent).toContain('let allPresent');
    });
  });

  describe('Loop and Iteration Preservation', () => {
    it('should maintain for...of loop for variable checking', () => {
      expect(scriptContent).toContain('for (const varName of requiredVars)');
    });

    it('should maintain variable value checking', () => {
      expect(scriptContent).toContain('const value = process.env[varName]');
      expect(scriptContent).toContain('if (value)');
    });
  });

  describe('Fetch API Usage Preservation', () => {
    it('should maintain fetch call', () => {
      expect(scriptContent).toContain('await fetch(');
    });

    it('should maintain POST method', () => {
      expect(scriptContent).toContain("method: 'POST'");
    });

    it('should maintain headers object', () => {
      expect(scriptContent).toContain('headers: {');
    });

    it('should maintain body stringification', () => {
      expect(scriptContent).toContain('body: JSON.stringify(');
    });
  });

  describe('Console Output Preservation', () => {
    it('should maintain console.log calls', () => {
      const logCalls = scriptContent.match(/console\.log\(/g);
      expect(logCalls).toBeDefined();
      expect(logCalls!.length).toBeGreaterThan(5);
    });

    it('should maintain variable interpolation in logs', () => {
      expect(scriptContent).toContain('${');
      expect(scriptContent).toContain('}');
    });
  });

  describe('Backward Compatibility', () => {
    it('should not introduce breaking changes to command-line interface', () => {
      // Le script doit toujours accepter --test-connection
      expect(scriptContent).toContain('--test-connection');
      
      // Ne doit pas introduire de nouveaux flags obligatoires
      expect(scriptContent).not.toContain('--required');
      expect(scriptContent).not.toContain('--mandatory');
    });

    it('should maintain compatibility with existing .env format', () => {
      // Les noms de variables ne doivent pas changer
      expect(scriptContent).toContain('AZURE_OPENAI_API_KEY');
      expect(scriptContent).toContain('AZURE_OPENAI_ENDPOINT');
      expect(scriptContent).toContain('AZURE_OPENAI_API_VERSION');
      expect(scriptContent).toContain('AZURE_OPENAI_DEPLOYMENT');
    });

    it('should not introduce new required dependencies', () => {
      // Vérifier qu'on n'a pas ajouté de nouvelles dépendances obligatoires
      const imports = scriptContent.match(/import .* from ['"].*['"]/g) || [];
      
      // Seules les dépendances existantes sont autorisées
      const allowedDeps = ['dotenv', 'url', 'path'];
      
      imports.forEach(importStatement => {
        const match = importStatement.match(/from ['"](.*)['"]/)!;
        const dep = match[1];
        
        // Ignorer les imports relatifs
        if (dep.startsWith('.')) return;
        
        // Vérifier que c'est une dépendance autorisée
        expect(allowedDeps.some(allowed => dep.includes(allowed))).toBe(true);
      });
    });
  });

  describe('Security Preservation', () => {
    it('should maintain API key masking', () => {
      // La clé ne doit jamais être affichée en clair
      expect(scriptContent).toContain("varName === 'AZURE_OPENAI_API_KEY'");
      expect(scriptContent).toContain('***');
    });

    it('should not introduce hardcoded credentials', () => {
      // Vérifier qu'il n'y a pas de clés hardcodées
      expect(scriptContent).not.toMatch(/AZURE_OPENAI_API_KEY.*=.*['"][a-zA-Z0-9]{20,}['"]/);
      expect(scriptContent).not.toMatch(/api-key.*:.*['"][a-zA-Z0-9]{20,}['"]/);
    });

    it('should maintain environment variable usage for secrets', () => {
      expect(scriptContent).toContain('process.env.AZURE_OPENAI_API_KEY');
      expect(scriptContent).toContain('process.env.AZURE_OPENAI_ENDPOINT');
    });
  });

  describe('Code Quality Preservation', () => {
    it('should maintain proper error handling structure', () => {
      expect(scriptContent).toContain('try {');
      expect(scriptContent).toContain('} catch (error)');
    });

    it('should maintain async/await usage', () => {
      expect(scriptContent).toContain('async');
      expect(scriptContent).toContain('await');
    });

    it('should maintain proper variable scoping', () => {
      expect(scriptContent).toContain('const ');
      expect(scriptContent).toContain('let ');
    });

    it('should not introduce var declarations', () => {
      // var est déprécié, ne doit pas être utilisé
      expect(scriptContent).not.toMatch(/\bvar\s+\w+/);
    });
  });

  describe('Documentation Preservation', () => {
    it('should maintain script description comment', () => {
      expect(scriptContent).toContain('/**');
      expect(scriptContent).toContain('Script de test');
      expect(scriptContent).toContain('Azure OpenAI');
    });

    it('should maintain helpful output messages', () => {
      expect(scriptContent).toContain('Vérification');
      expect(scriptContent).toContain('Configuration');
      expect(scriptContent).toContain('Test de connexion');
    });
  });

  describe('File Structure Preservation', () => {
    it('should maintain ES module format', () => {
      expect(scriptContent).toContain('import ');
      expect(scriptContent).not.toContain('require(');
    });

    it('should maintain .mjs extension compatibility', () => {
      expect(scriptPath).toEndWith('.mjs');
    });

    it('should maintain proper line endings', () => {
      // Le fichier doit avoir des sauts de ligne cohérents
      const lines = scriptContent.split('\n');
      expect(lines.length).toBeGreaterThan(50);
    });
  });
});
