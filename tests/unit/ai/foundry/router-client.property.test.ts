/**
 * Property Test: Router Request Validation
 * 
 * **Feature: azure-foundry-agents-integration, Property 1: Router request contains required fields**
 * 
 * *For any* agent request, the RouterClient SHALL always send a request containing 
 * both `prompt` (non-empty string) and `client_tier` (either "standard" or "vip") fields.
 * 
 * **Validates: Requirements 1.1, 1.4**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  RouterClient,
  RouterError,
  RouterErrorCode,
  type RouterRequest,
} from '../../../../lib/ai/foundry/router-client';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Property 1: Router request contains required fields', () => {
  let client: RouterClient;
  let capturedRequests: RouterRequest[];

  beforeEach(() => {
    vi.clearAllMocks();
    capturedRequests = [];
    client = new RouterClient('http://test-router.local');

    // Setup mock to capture requests and return valid response
    mockFetch.mockImplementation(async (url: string, options: RequestInit) => {
      if (options.body) {
        capturedRequests.push(JSON.parse(options.body as string));
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          model: 'Llama-3.3-70B',
          deployment: 'llama33-70b-us',
          region: 'eastus2',
          routing: {
            type: 'chat',
            complexity: 'medium',
            language: 'en',
            client_tier: 'standard',
          },
          output: 'Test response',
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      };
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should always include non-empty prompt in request', async () => {
    // Generator that produces non-whitespace-only strings
    const nonWhitespaceString = fc.string({ minLength: 1, maxLength: 500 })
      .filter(s => s.trim().length > 0);
    
    await fc.assert(
      fc.asyncProperty(
        nonWhitespaceString,
        fc.constantFrom<'standard' | 'vip'>('standard', 'vip'),
        async (prompt, tier) => {
          capturedRequests = [];
          
          await client.route({
            prompt,
            client_tier: tier,
          });

          expect(capturedRequests.length).toBe(1);
          expect(capturedRequests[0].prompt).toBe(prompt);
          expect(capturedRequests[0].prompt.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should always include valid client_tier in request', async () => {
    // Generator that produces non-whitespace-only strings
    const nonWhitespaceString = fc.string({ minLength: 1, maxLength: 200 })
      .filter(s => s.trim().length > 0);
    
    await fc.assert(
      fc.asyncProperty(
        nonWhitespaceString,
        fc.constantFrom<'standard' | 'vip'>('standard', 'vip'),
        async (prompt, tier) => {
          capturedRequests = [];
          
          await client.route({
            prompt,
            client_tier: tier,
          });

          expect(capturedRequests.length).toBe(1);
          expect(['standard', 'vip']).toContain(capturedRequests[0].client_tier);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should reject empty prompt strings', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('', '   ', '\t', '\n', '  \n  '),
        fc.constantFrom<'standard' | 'vip'>('standard', 'vip'),
        async (emptyPrompt, tier) => {
          await expect(
            client.route({
              prompt: emptyPrompt,
              client_tier: tier,
            })
          ).rejects.toThrow(RouterError);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should reject invalid client_tier values', async () => {
    const invalidTiers = ['premium', 'basic', 'free', '', 'VIP', 'STANDARD'];
    
    for (const invalidTier of invalidTiers) {
      await expect(
        client.route({
          prompt: 'Test prompt',
          client_tier: invalidTier as any,
        })
      ).rejects.toThrow(RouterError);
    }
  });

  it('should include optional type_hint when provided', async () => {
    // Generator that produces non-whitespace-only strings
    const nonWhitespaceString = fc.string({ minLength: 1, maxLength: 200 })
      .filter(s => s.trim().length > 0);
    
    await fc.assert(
      fc.asyncProperty(
        nonWhitespaceString,
        fc.constantFrom<'standard' | 'vip'>('standard', 'vip'),
        fc.constantFrom<'math' | 'coding' | 'creative' | 'chat'>('math', 'coding', 'creative', 'chat'),
        async (prompt, tier, typeHint) => {
          capturedRequests = [];
          
          await client.route({
            prompt,
            client_tier: tier,
            type_hint: typeHint,
          });

          expect(capturedRequests.length).toBe(1);
          expect(capturedRequests[0].type_hint).toBe(typeHint);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should include optional language_hint when provided', async () => {
    // Generator that produces non-whitespace-only strings
    const nonWhitespaceString = fc.string({ minLength: 1, maxLength: 200 })
      .filter(s => s.trim().length > 0);
    
    await fc.assert(
      fc.asyncProperty(
        nonWhitespaceString,
        fc.constantFrom<'standard' | 'vip'>('standard', 'vip'),
        fc.constantFrom<'fr' | 'en' | 'other'>('fr', 'en', 'other'),
        async (prompt, tier, langHint) => {
          capturedRequests = [];
          
          await client.route({
            prompt,
            client_tier: tier,
            language_hint: langHint,
          });

          expect(capturedRequests.length).toBe(1);
          expect(capturedRequests[0].language_hint).toBe(langHint);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should reject invalid type_hint values', async () => {
    const invalidTypeHints = ['reasoning', 'analysis', 'general', ''];
    
    for (const invalidHint of invalidTypeHints) {
      await expect(
        client.route({
          prompt: 'Test prompt',
          client_tier: 'standard',
          type_hint: invalidHint as any,
        })
      ).rejects.toThrow(RouterError);
    }
  });

  it('should reject invalid language_hint values', async () => {
    const invalidLangHints = ['french', 'english', 'es', 'de', ''];
    
    for (const invalidHint of invalidLangHints) {
      await expect(
        client.route({
          prompt: 'Test prompt',
          client_tier: 'standard',
          language_hint: invalidHint as any,
        })
      ).rejects.toThrow(RouterError);
    }
  });
});

describe('Router request validation edge cases', () => {
  let client: RouterClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new RouterClient('http://test-router.local');

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        model: 'Llama-3.3-70B',
        deployment: 'llama33-70b-us',
        region: 'eastus2',
        routing: { type: 'chat', complexity: 'medium', language: 'en', client_tier: 'standard' },
        output: 'Test response',
      }),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should handle prompts with special characters', async () => {
    const specialPrompts = [
      'Hello! How are you?',
      'Test with émojis 🎉🚀',
      'JSON: {"key": "value"}',
      'Code: const x = 1;',
      'Français: Bonjour, ça va?',
      'Unicode: 你好世界',
      'Newlines:\nLine 1\nLine 2',
    ];

    for (const prompt of specialPrompts) {
      const response = await client.route({
        prompt,
        client_tier: 'standard',
      });
      expect(response.model).toBeDefined();
    }
  });

  it('should handle very long prompts', async () => {
    const longPrompt = 'A'.repeat(10000);
    
    const response = await client.route({
      prompt: longPrompt,
      client_tier: 'vip',
    });
    
    expect(response.model).toBeDefined();
  });
});
