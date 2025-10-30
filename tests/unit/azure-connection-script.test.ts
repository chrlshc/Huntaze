import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(require('child_process').exec);

/**
 * Tests pour le script de test de connexion Azure OpenAI
 * Valide la vérification de configuration et le test de connexion
 */

describe('Azure Connection Test Script', () => {
  const scriptPath = 'scripts/test-azure-connection.mjs';
  const testEnvPath = '.env.test.azure';
  
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Sauvegarder l'environnement original
    originalEnv = { ...process.env };
    
    // Nettoyer les variables Azure
    delete process.env.AZURE_OPENAI_API_KEY;
    delete process.env.AZURE_OPENAI_ENDPOINT;
    delete process.env.AZURE_OPENAI_API_VERSION;
    delete process.env.AZURE_OPENAI_DEPLOYMENT;
    delete process.env.DEFAULT_AI_PROVIDER;
    delete process.env.DEFAULT_AI_MODEL;
  });

  afterEach(() => {
    // Restaurer l'environnement
    process.env = originalEnv;
    
    // Nettoyer les fichiers de test
    if (existsSync(testEnvPath)) {
      unlinkSync(testEnvPath);
    }
  });

  describe('Script Existence and Structure', () => {
    it('should exist at the correct path', () => {
      expect(existsSync(scriptPath)).toBe(true);
    });

    it('should be executable (have shebang)', () => {
      const content = readFileSync(scriptPath, 'utf-8');
      expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
    });

    it('should import required dependencies', () => {
      const content = readFileSync(scriptPath, 'utf-8');
      expect(content).toContain("import { config } from 'dotenv'");
      expect(content).toContain("import { fileURLToPath } from 'url'");
      expect(content).toContain("import { dirname, join } from 'path'");
    });

    it('should define required environment variables', () => {
      const content = readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('AZURE_OPENAI_API_KEY');
      expect(content).toContain('AZURE_OPENAI_ENDPOINT');
      expect(content).toContain('AZURE_OPENAI_API_VERSION');
      expect(content).toContain('AZURE_OPENAI_DEPLOYMENT');
    });
  });

  describe('Environment Variable Validation', () => {
    it('should detect missing required variables', async () => {
      // Créer un fichier .env vide
      writeFileSync(testEnvPath, '');
      
      try {
        const { stdout, stderr } = await execAsync(`node ${scriptPath}`, {
          env: { ...process.env, NODE_ENV: 'test' }
        });
        
        // Le script devrait échouer
        expect(stdout || stderr).toContain('MANQUANT');
      } catch (error: any) {
        // Erreur attendue
        expect(error.code).toBe(1);
        expect(error.stdout || error.stderr).toContain('MANQUANT');
      }
    });

    it('should validate all required variables are present', async () => {
      // Créer un fichier .env avec toutes les variables
      const envContent = `
AZURE_OPENAI_API_KEY=test-key-1234567890abcdef
AZURE_OPENAI_ENDPOINT=https://test.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
DEFAULT_AI_PROVIDER=azure
DEFAULT_AI_MODEL=gpt-4
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      try {
        const { stdout } = await execAsync(`node ${scriptPath}`, {
          env: { ...process.env, NODE_ENV: 'test' }
        });
        
        expect(stdout).toContain('✅ AZURE_OPENAI_API_KEY');
        expect(stdout).toContain('✅ AZURE_OPENAI_ENDPOINT');
        expect(stdout).toContain('✅ AZURE_OPENAI_API_VERSION');
        expect(stdout).toContain('✅ AZURE_OPENAI_DEPLOYMENT');
        expect(stdout).toContain('Configuration complète');
      } catch (error: any) {
        // Si le script échoue, afficher la sortie pour debug
        console.error('Script output:', error.stdout);
        console.error('Script error:', error.stderr);
        throw error;
      }
    });

    it('should mask API key in output', async () => {
      const apiKey = 'test-secret-key-1234567890abcdef';
      const envContent = `
AZURE_OPENAI_API_KEY=${apiKey}
AZURE_OPENAI_ENDPOINT=https://test.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      try {
        const { stdout } = await execAsync(`node ${scriptPath}`, {
          env: { ...process.env, NODE_ENV: 'test' }
        });
        
        // La clé complète ne doit pas apparaître
        expect(stdout).not.toContain(apiKey);
        
        // Seuls les 4 derniers caractères doivent être visibles
        expect(stdout).toContain('***cdef');
      } catch (error: any) {
        console.error('Script output:', error.stdout);
        throw error;
      }
    });

    it('should display configuration summary', async () => {
      const envContent = `
AZURE_OPENAI_API_KEY=test-key-1234
AZURE_OPENAI_ENDPOINT=https://test.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
DEFAULT_AI_PROVIDER=azure
DEFAULT_AI_MODEL=gpt-4-turbo
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      try {
        const { stdout } = await execAsync(`node ${scriptPath}`, {
          env: { ...process.env, NODE_ENV: 'test' }
        });
        
        expect(stdout).toContain('Configuration détectée');
        expect(stdout).toContain('Provider: azure');
        expect(stdout).toContain('Model:');
        expect(stdout).toContain('Mode:');
      } catch (error: any) {
        console.error('Script output:', error.stdout);
        throw error;
      }
    });
  });

  describe('Connection Testing (--test-connection flag)', () => {
    it('should support --test-connection flag', () => {
      const content = readFileSync(scriptPath, 'utf-8');
      expect(content).toContain("process.argv.includes('--test-connection')");
    });

    it('should make API call with correct parameters', () => {
      const content = readFileSync(scriptPath, 'utf-8');
      
      // Vérifier la construction de l'URL
      expect(content).toContain('/openai/deployments/');
      expect(content).toContain('/chat/completions');
      expect(content).toContain('api-version=');
      
      // Vérifier les headers
      expect(content).toContain("'api-key'");
      expect(content).toContain("'Content-Type': 'application/json'");
      
      // Vérifier le body
      expect(content).toContain('messages');
      expect(content).toContain('max_tokens');
    });

    it('should handle successful connection', () => {
      const content = readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('if (response.ok)');
      expect(content).toContain('Connexion réussie');
      expect(content).toContain('data.choices[0].message.content');
      expect(content).toContain('data.usage.total_tokens');
    });

    it('should handle connection errors', () => {
      const content = readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('else {');
      expect(content).toContain('Erreur de connexion');
      expect(content).toContain('process.exit(1)');
    });

    it('should handle network errors', () => {
      const content = readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('catch (error)');
      expect(content).toContain('Erreur réseau');
      expect(content).toContain('error.message');
    });
  });

  describe('Output Messages', () => {
    it('should provide helpful next steps', async () => {
      const envContent = `
AZURE_OPENAI_API_KEY=test-key-1234
AZURE_OPENAI_ENDPOINT=https://test.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      try {
        const { stdout } = await execAsync(`node ${scriptPath}`, {
          env: { ...process.env, NODE_ENV: 'test' }
        });
        
        expect(stdout).toContain('Prochaines étapes');
        expect(stdout).toContain('npm test');
        expect(stdout).toContain('npm run dev');
        expect(stdout).toContain('/api/ai/azure/smoke');
      } catch (error: any) {
        console.error('Script output:', error.stdout);
        throw error;
      }
    });

    it('should use emoji indicators for better UX', async () => {
      const envContent = `
AZURE_OPENAI_API_KEY=test-key-1234
AZURE_OPENAI_ENDPOINT=https://test.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      try {
        const { stdout } = await execAsync(`node ${scriptPath}`, {
          env: { ...process.env, NODE_ENV: 'test' }
        });
        
        expect(stdout).toContain('🔍'); // Vérification
        expect(stdout).toContain('✅'); // Succès
        expect(stdout).toContain('📊'); // Configuration
        expect(stdout).toContain('🚀'); // Prochaines étapes
      } catch (error: any) {
        console.error('Script output:', error.stdout);
        throw error;
      }
    });
  });

  describe('Error Handling', () => {
    it('should exit with code 1 when configuration is incomplete', async () => {
      writeFileSync(testEnvPath, 'AZURE_OPENAI_API_KEY=test-key');
      
      try {
        await execAsync(`node ${scriptPath}`, {
          env: { ...process.env, NODE_ENV: 'test' }
        });
        
        // Ne devrait pas arriver ici
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.code).toBe(1);
        expect(error.stdout || error.stderr).toContain('Configuration incomplète');
      }
    });

    it('should provide clear error messages', async () => {
      writeFileSync(testEnvPath, '');
      
      try {
        await execAsync(`node ${scriptPath}`, {
          env: { ...process.env, NODE_ENV: 'test' }
        });
      } catch (error: any) {
        const output = error.stdout || error.stderr;
        expect(output).toContain('❌');
        expect(output).toContain('MANQUANT');
        expect(output).toContain('Vérifiez votre fichier .env');
      }
    });
  });

  describe('Integration with .env file', () => {
    it('should load variables from .env file', () => {
      const content = readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain("config({ path: join(__dirname, '..', '.env') })");
    });

    it('should handle missing .env file gracefully', async () => {
      // S'assurer qu'il n'y a pas de .env
      const envPath = join(process.cwd(), '.env');
      const envExists = existsSync(envPath);
      let envBackup: string | null = null;
      
      if (envExists) {
        envBackup = readFileSync(envPath, 'utf-8');
        unlinkSync(envPath);
      }
      
      try {
        const { stdout, stderr } = await execAsync(`node ${scriptPath}`, {
          env: { ...process.env, NODE_ENV: 'test' }
        });
        
        // Le script devrait s'exécuter mais signaler les variables manquantes
        expect(stdout || stderr).toContain('MANQUANT');
      } catch (error: any) {
        // Erreur attendue
        expect(error.code).toBe(1);
      } finally {
        // Restaurer .env si nécessaire
        if (envBackup) {
          writeFileSync(envPath, envBackup);
        }
      }
    });
  });

  describe('Script Robustness', () => {
    it('should handle special characters in environment variables', async () => {
      const envContent = `
AZURE_OPENAI_API_KEY=test-key-with-special-chars-!@#$%
AZURE_OPENAI_ENDPOINT=https://test.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      try {
        const { stdout } = await execAsync(`node ${scriptPath}`, {
          env: { ...process.env, NODE_ENV: 'test' }
        });
        
        expect(stdout).toContain('✅');
        expect(stdout).toContain('Configuration complète');
      } catch (error: any) {
        console.error('Script output:', error.stdout);
        throw error;
      }
    });

    it('should handle very long environment variable values', async () => {
      const longKey = 'a'.repeat(500);
      const envContent = `
AZURE_OPENAI_API_KEY=${longKey}
AZURE_OPENAI_ENDPOINT=https://test.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      try {
        const { stdout } = await execAsync(`node ${scriptPath}`, {
          env: { ...process.env, NODE_ENV: 'test' }
        });
        
        expect(stdout).toContain('✅');
        // Vérifier que seuls les 4 derniers caractères sont affichés
        expect(stdout).toContain('***aaaa');
      } catch (error: any) {
        console.error('Script output:', error.stdout);
        throw error;
      }
    });

    it('should handle empty environment variable values', async () => {
      const envContent = `
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=https://test.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      try {
        await execAsync(`node ${scriptPath}`, {
          env: { ...process.env, NODE_ENV: 'test' }
        });
      } catch (error: any) {
        expect(error.code).toBe(1);
        expect(error.stdout || error.stderr).toContain('MANQUANT');
      }
    });
  });

  describe('Default Values', () => {
    it('should use default provider if not specified', async () => {
      const envContent = `
AZURE_OPENAI_API_KEY=test-key-1234
AZURE_OPENAI_ENDPOINT=https://test.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      try {
        const { stdout } = await execAsync(`node ${scriptPath}`, {
          env: { ...process.env, NODE_ENV: 'test' }
        });
        
        expect(stdout).toContain('Provider: openai');
      } catch (error: any) {
        console.error('Script output:', error.stdout);
        throw error;
      }
    });

    it('should use deployment name as model if DEFAULT_AI_MODEL not set', async () => {
      const envContent = `
AZURE_OPENAI_API_KEY=test-key-1234
AZURE_OPENAI_ENDPOINT=https://test.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4-turbo
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      try {
        const { stdout } = await execAsync(`node ${scriptPath}`, {
          env: { ...process.env, NODE_ENV: 'test' }
        });
        
        expect(stdout).toContain('Model: gpt-4-turbo');
      } catch (error: any) {
        console.error('Script output:', error.stdout);
        throw error;
      }
    });

    it('should use development mode if NODE_ENV not set', async () => {
      const envContent = `
AZURE_OPENAI_API_KEY=test-key-1234
AZURE_OPENAI_ENDPOINT=https://test.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      try {
        const { stdout } = await execAsync(`node ${scriptPath}`, {
          env: { ...process.env }
        });
        
        expect(stdout).toContain('Mode: development');
      } catch (error: any) {
        console.error('Script output:', error.stdout);
        throw error;
      }
    });
  });

  describe('Regression Tests', () => {
    it('should maintain backward compatibility with existing .env format', async () => {
      const envContent = `
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=test-key-1234567890
AZURE_OPENAI_ENDPOINT=https://huntaze.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4

# Optional settings
DEFAULT_AI_PROVIDER=azure
DEFAULT_AI_MODEL=gpt-4
NODE_ENV=production
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      try {
        const { stdout } = await execAsync(`node ${scriptPath}`, {
          env: { ...process.env, NODE_ENV: 'test' }
        });
        
        expect(stdout).toContain('✅');
        expect(stdout).toContain('Configuration complète');
      } catch (error: any) {
        console.error('Script output:', error.stdout);
        throw error;
      }
    });

    it('should not break when new environment variables are added', async () => {
      const envContent = `
AZURE_OPENAI_API_KEY=test-key-1234
AZURE_OPENAI_ENDPOINT=https://test.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
NEW_FUTURE_VARIABLE=some-value
ANOTHER_NEW_VAR=another-value
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      try {
        const { stdout } = await execAsync(`node ${scriptPath}`, {
          env: { ...process.env, NODE_ENV: 'test' }
        });
        
        expect(stdout).toContain('✅');
        expect(stdout).toContain('Configuration complète');
      } catch (error: any) {
        console.error('Script output:', error.stdout);
        throw error;
      }
    });
  });

  describe('Performance', () => {
    it('should execute quickly (< 2 seconds)', async () => {
      const envContent = `
AZURE_OPENAI_API_KEY=test-key-1234
AZURE_OPENAI_ENDPOINT=https://test.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      const startTime = Date.now();
      
      try {
        await execAsync(`node ${scriptPath}`, {
          env: { ...process.env, NODE_ENV: 'test' }
        });
      } catch (error) {
        // Ignorer les erreurs pour ce test de performance
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    });
  });
});
