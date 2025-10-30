import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Tests d'intégration pour le script de test de connexion Azure
 * Valide l'interaction avec l'API Azure OpenAI (mockée)
 */

describe('Azure Connection Integration Tests', () => {
  const scriptPath = 'scripts/test-azure-connection.mjs';
  const testEnvPath = '.env.test.azure.integration';
  
  let mockServer: any;
  let mockServerPort = 3456;

  beforeEach(() => {
    // Créer un mock server pour simuler Azure OpenAI
    mockServer = createMockAzureServer(mockServerPort);
  });

  afterEach(() => {
    // Arrêter le mock server
    if (mockServer) {
      mockServer.close();
    }
    
    // Nettoyer les fichiers de test
    if (existsSync(testEnvPath)) {
      unlinkSync(testEnvPath);
    }
  });

  describe('Successful Connection Flow', () => {
    it('should successfully connect to Azure OpenAI API', (done) => {
      const envContent = `
AZURE_OPENAI_API_KEY=test-key-1234567890
AZURE_OPENAI_ENDPOINT=http://localhost:${mockServerPort}
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      const child = spawn('node', [scriptPath, '--test-connection'], {
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        try {
          expect(code).toBe(0);
          expect(stdout).toContain('Connexion réussie');
          expect(stdout).toContain('Hello from Huntaze');
          expect(stdout).toContain('Tokens utilisés');
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 10000);

    it('should handle streaming responses correctly', (done) => {
      const envContent = `
AZURE_OPENAI_API_KEY=test-key-streaming
AZURE_OPENAI_ENDPOINT=http://localhost:${mockServerPort}
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      const child = spawn('node', [scriptPath, '--test-connection'], {
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      let stdout = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.on('close', (code) => {
        try {
          expect(code).toBe(0);
          expect(stdout).toContain('✅');
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 10000);
  });

  describe('Error Handling Flow', () => {
    it('should handle 401 Unauthorized errors', (done) => {
      const envContent = `
AZURE_OPENAI_API_KEY=invalid-key
AZURE_OPENAI_ENDPOINT=http://localhost:${mockServerPort}
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      const child = spawn('node', [scriptPath, '--test-connection'], {
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        try {
          expect(code).toBe(1);
          expect(stdout || stderr).toContain('Erreur de connexion');
          expect(stdout || stderr).toContain('401');
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 10000);

    it('should handle 429 Rate Limit errors', (done) => {
      const envContent = `
AZURE_OPENAI_API_KEY=rate-limited-key
AZURE_OPENAI_ENDPOINT=http://localhost:${mockServerPort}
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      const child = spawn('node', [scriptPath, '--test-connection'], {
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      let stdout = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.on('close', (code) => {
        try {
          expect(code).toBe(1);
          expect(stdout).toContain('Erreur de connexion');
          expect(stdout).toContain('429');
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 10000);

    it('should handle network timeout errors', (done) => {
      const envContent = `
AZURE_OPENAI_API_KEY=timeout-key
AZURE_OPENAI_ENDPOINT=http://localhost:${mockServerPort}
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      const child = spawn('node', [scriptPath, '--test-connection'], {
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      let stdout = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.on('close', (code) => {
        try {
          expect(code).toBe(1);
          expect(stdout).toContain('Erreur');
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 15000);

    it('should handle invalid endpoint URLs', (done) => {
      const envContent = `
AZURE_OPENAI_API_KEY=test-key
AZURE_OPENAI_ENDPOINT=http://invalid-endpoint-that-does-not-exist.local
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      const child = spawn('node', [scriptPath, '--test-connection'], {
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      let stdout = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.on('close', (code) => {
        try {
          expect(code).toBe(1);
          expect(stdout).toContain('Erreur réseau');
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 15000);
  });

  describe('API Request Validation', () => {
    it('should send correct request format to Azure', (done) => {
      const envContent = `
AZURE_OPENAI_API_KEY=test-key-validate
AZURE_OPENAI_ENDPOINT=http://localhost:${mockServerPort}
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      // Capturer la requête dans le mock server
      let capturedRequest: any = null;
      mockServer.on('request', (req: any) => {
        capturedRequest = req;
      });
      
      const child = spawn('node', [scriptPath, '--test-connection'], {
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      child.on('close', () => {
        try {
          expect(capturedRequest).toBeDefined();
          expect(capturedRequest.headers['api-key']).toBe('test-key-validate');
          expect(capturedRequest.headers['content-type']).toContain('application/json');
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 10000);

    it('should include correct message format', (done) => {
      const envContent = `
AZURE_OPENAI_API_KEY=test-key-message
AZURE_OPENAI_ENDPOINT=http://localhost:${mockServerPort}
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      let capturedBody: any = null;
      mockServer.on('request-body', (body: any) => {
        capturedBody = body;
      });
      
      const child = spawn('node', [scriptPath, '--test-connection'], {
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      child.on('close', () => {
        try {
          expect(capturedBody).toBeDefined();
          expect(capturedBody.messages).toBeDefined();
          expect(capturedBody.messages).toHaveLength(2);
          expect(capturedBody.messages[0].role).toBe('system');
          expect(capturedBody.messages[1].role).toBe('user');
          expect(capturedBody.max_tokens).toBe(50);
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 10000);
  });

  describe('Response Parsing', () => {
    it('should correctly parse successful response', (done) => {
      const envContent = `
AZURE_OPENAI_API_KEY=test-key-parse
AZURE_OPENAI_ENDPOINT=http://localhost:${mockServerPort}
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      const child = spawn('node', [scriptPath, '--test-connection'], {
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      let stdout = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.on('close', (code) => {
        try {
          expect(code).toBe(0);
          expect(stdout).toContain('Réponse:');
          expect(stdout).toContain('Tokens utilisés:');
          
          // Vérifier que les valeurs sont des nombres
          const tokensMatch = stdout.match(/Tokens utilisés: (\d+)/);
          expect(tokensMatch).toBeDefined();
          expect(parseInt(tokensMatch![1])).toBeGreaterThan(0);
          
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 10000);

    it('should handle malformed JSON responses', (done) => {
      const envContent = `
AZURE_OPENAI_API_KEY=malformed-json-key
AZURE_OPENAI_ENDPOINT=http://localhost:${mockServerPort}
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4
      `.trim();
      
      writeFileSync(testEnvPath, envContent);
      
      const child = spawn('node', [scriptPath, '--test-connection'], {
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      let stdout = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.on('close', (code) => {
        try {
          expect(code).toBe(1);
          expect(stdout).toContain('Erreur');
          done();
        } catch (error) {
          done(error);
        }
      });
    }, 10000);
  });
});

/**
 * Crée un mock server pour simuler Azure OpenAI API
 */
function createMockAzureServer(port: number) {
  const http = require('http');
  
  const server = http.createServer((req: any, res: any) => {
    const apiKey = req.headers['api-key'];
    
    // Simuler différents scénarios basés sur la clé API
    if (apiKey === 'invalid-key') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: {
          code: 'Unauthorized',
          message: 'Invalid API key'
        }
      }));
      return;
    }
    
    if (apiKey === 'rate-limited-key') {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: {
          code: 'RateLimitExceeded',
          message: 'Rate limit exceeded'
        }
      }));
      return;
    }
    
    if (apiKey === 'timeout-key') {
      // Ne jamais répondre pour simuler un timeout
      return;
    }
    
    if (apiKey === 'malformed-json-key') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{ invalid json }');
      return;
    }
    
    // Réponse réussie par défaut
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id: 'chatcmpl-test123',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'Hello from Huntaze!'
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 20,
        completion_tokens: 5,
        total_tokens: 25
      }
    }));
  });
  
  server.listen(port);
  return server;
}
