/**
 * Azure Prompt Optimizer Service - Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AzurePromptOptimizerService,
  type PromptTemplate,
  type FewShotExample,
} from '../../../lib/ai/azure/azure-prompt-optimizer.service';

describe('AzurePromptOptimizerService', () => {
  let service: AzurePromptOptimizerService;

  beforeEach(() => {
    service = new AzurePromptOptimizerService();
  });

  describe('formatForAzure', () => {
    it('should normalize line endings', () => {
      const input = 'Line 1\r\nLine 2\r\nLine 3';
      const result = service.formatForAzure(input);
      expect(result).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should remove excessive whitespace', () => {
      const input = 'Line 1\n\n\n\nLine 2';
      const result = service.formatForAzure(input);
      expect(result).toBe('Line 1\n\nLine 2');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = service.formatForAzure(input);
      expect(result).toBe('Hello World');
    });

    it('should add instruction markers when requested', () => {
      const input = 'Do something';
      const result = service.formatForAzure(input, { addInstructionMarkers: true });
      expect(result).toContain('[INSTRUCTIONS]');
      expect(result).toContain('[/INSTRUCTIONS]');
    });

    it('should not duplicate instruction markers', () => {
      const input = '[INSTRUCTIONS]\nDo something\n[/INSTRUCTIONS]';
      const result = service.formatForAzure(input, { addInstructionMarkers: true });
      expect(result.match(/\[INSTRUCTIONS\]/g)?.length).toBe(1);
    });
  });

  describe('configureJsonMode', () => {
    it('should return options with json_object response format', () => {
      const options = service.configureJsonMode();
      expect(options.responseFormat).toEqual({ type: 'json_object' });
    });
  });

  describe('buildJsonModeSystemPrompt', () => {
    it('should add JSON instruction to base prompt', () => {
      const basePrompt = 'You are an assistant.';
      const result = service.buildJsonModeSystemPrompt(basePrompt);
      expect(result).toContain('You are an assistant.');
      expect(result).toContain('You must respond with valid JSON only.');
    });

    it('should include schema when provided', () => {
      const basePrompt = 'You are an assistant.';
      const schema = { type: 'object', properties: { name: { type: 'string' } } };
      const result = service.buildJsonModeSystemPrompt(basePrompt, schema);
      expect(result).toContain('JSON schema');
      expect(result).toContain('"type": "object"');
    });
  });

  describe('truncatePrompt', () => {
    it('should not truncate if within limits', () => {
      const prompt = 'Short prompt';
      const result = service.truncatePrompt(prompt, 1000);
      expect(result.text).toBe(prompt);
      expect(result.details.originalTokens).toBe(result.details.truncatedTokens);
    });

    it('should truncate long prompts', () => {
      const prompt = 'A'.repeat(10000); // Very long prompt
      const result = service.truncatePrompt(prompt, 100);
      // Allow small tolerance for rounding in token estimation
      expect(result.details.truncatedTokens).toBeLessThanOrEqual(105);
    });

    it('should preserve key sections', () => {
      const prompt = `
Important: This must be preserved.
Regular content here.
Critical: Also preserve this.
More regular content.
      `.trim();
      const result = service.truncatePrompt(prompt, 50, ['Important', 'Critical']);
      expect(result.text).toContain('Important');
    });

    it('should track truncation details', () => {
      const prompt = 'A'.repeat(10000);
      const result = service.truncatePrompt(prompt, 100);
      expect(result.details.originalTokens).toBeGreaterThan(result.details.truncatedTokens);
    });
  });

  describe('addFewShotExamples', () => {
    it('should add examples after system message', () => {
      const messages = [
        { role: 'system' as const, content: 'You are helpful.' },
        { role: 'user' as const, content: 'Hello' },
      ];
      const examples: FewShotExample[] = [
        { input: 'Hi', output: 'Hello!' },
      ];

      const result = service.addFewShotExamples(messages, examples);

      expect(result.length).toBe(4); // system + 2 example messages + user
      expect(result[0].role).toBe('system');
      expect(result[1].role).toBe('user');
      expect(result[1].content).toBe('Hi');
      expect(result[2].role).toBe('assistant');
      expect(result[2].content).toBe('Hello!');
      expect(result[3].role).toBe('user');
      expect(result[3].content).toBe('Hello');
    });

    it('should limit examples to maxExamples', () => {
      const messages = [
        { role: 'system' as const, content: 'You are helpful.' },
        { role: 'user' as const, content: 'Hello' },
      ];
      const examples: FewShotExample[] = [
        { input: 'Ex1', output: 'Out1' },
        { input: 'Ex2', output: 'Out2' },
        { input: 'Ex3', output: 'Out3' },
        { input: 'Ex4', output: 'Out4' },
      ];

      const result = service.addFewShotExamples(messages, examples, 2);

      // system + 4 example messages (2 examples * 2) + user = 7
      expect(result.length).toBe(6);
    });

    it('should return original messages if no examples', () => {
      const messages = [
        { role: 'system' as const, content: 'You are helpful.' },
        { role: 'user' as const, content: 'Hello' },
      ];

      const result = service.addFewShotExamples(messages, []);
      expect(result).toEqual(messages);
    });
  });

  describe('registerTemplate', () => {
    it('should register and retrieve templates', () => {
      const template: PromptTemplate = {
        id: 'test-template',
        name: 'Test Template',
        systemPrompt: 'You are a test assistant.',
      };

      service.registerTemplate(template);
      const retrieved = service.getTemplate('test-template');

      expect(retrieved).toEqual(template);
    });

    it('should return undefined for unknown templates', () => {
      const result = service.getTemplate('unknown');
      expect(result).toBeUndefined();
    });
  });

  describe('optimizePrompt', () => {
    it('should optimize prompt with registered template', () => {
      const template: PromptTemplate = {
        id: 'custom-template',
        name: 'Custom',
        systemPrompt: 'You are {{role}}.',
      };
      service.registerTemplate(template);

      const result = service.optimizePrompt(
        'Hello',
        'custom-template',
        { role: 'a helpful assistant' }
      );

      expect(result.messages.length).toBeGreaterThan(0);
      expect(result.messages[0].content).toContain('a helpful assistant');
      expect(result.cacheKey).toBeDefined();
    });

    it('should throw for unknown template', () => {
      expect(() => {
        service.optimizePrompt('Hello', 'unknown-template');
      }).toThrow('Template not found');
    });

    it('should use JSON mode for json output format', () => {
      const template: PromptTemplate = {
        id: 'json-template',
        name: 'JSON Template',
        systemPrompt: 'Return JSON.',
        outputFormat: 'json',
      };
      service.registerTemplate(template);

      const result = service.optimizePrompt('Get data', 'json-template');

      expect(result.options.responseFormat).toEqual({ type: 'json_object' });
      expect(result.messages[0].content).toContain('valid JSON');
    });

    it('should include few-shot examples from template', () => {
      const template: PromptTemplate = {
        id: 'fewshot-template',
        name: 'Few-shot Template',
        systemPrompt: 'You are helpful.',
        fewShotExamples: [
          { input: 'Example input', output: 'Example output' },
        ],
      };
      service.registerTemplate(template);

      const result = service.optimizePrompt('My question', 'fewshot-template');

      // Should have: system + 2 example messages + user
      expect(result.messages.length).toBe(4);
    });

    it('should cache optimized prompts', () => {
      const template: PromptTemplate = {
        id: 'cache-template',
        name: 'Cache Template',
        systemPrompt: 'You are helpful.',
      };
      service.registerTemplate(template);

      const result1 = service.optimizePrompt('Hello', 'cache-template');
      const result2 = service.optimizePrompt('Hello', 'cache-template');

      expect(result1.cacheKey).toBe(result2.cacheKey);
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens based on character count', () => {
      const text = 'Hello world'; // 11 characters
      const tokens = service.estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(text.length); // Should be less than char count
    });

    it('should handle empty string', () => {
      const tokens = service.estimateTokens('');
      expect(tokens).toBe(0);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = service.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
    });

    it('should track cache size', () => {
      const template: PromptTemplate = {
        id: 'stats-template',
        name: 'Stats Template',
        systemPrompt: 'You are helpful.',
      };
      service.registerTemplate(template);

      service.optimizePrompt('Query 1', 'stats-template');
      service.optimizePrompt('Query 2', 'stats-template');

      const stats = service.getCacheStats();
      expect(stats.size).toBe(2);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached entries', () => {
      const template: PromptTemplate = {
        id: 'clear-template',
        name: 'Clear Template',
        systemPrompt: 'You are helpful.',
      };
      service.registerTemplate(template);

      service.optimizePrompt('Query', 'clear-template');
      expect(service.getCacheStats().size).toBe(1);

      service.clearCache();
      expect(service.getCacheStats().size).toBe(0);
    });
  });

  describe('default templates', () => {
    it('should have messaging-ai template', () => {
      const template = service.getTemplate('messaging-ai');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Messaging AI');
    });

    it('should have analytics-ai template with JSON output', () => {
      const template = service.getTemplate('analytics-ai');
      expect(template).toBeDefined();
      expect(template?.outputFormat).toBe('json');
    });

    it('should have sales-ai template with few-shot examples', () => {
      const template = service.getTemplate('sales-ai');
      expect(template).toBeDefined();
      expect(template?.fewShotExamples?.length).toBeGreaterThan(0);
    });

    it('should have compliance-ai template', () => {
      const template = service.getTemplate('compliance-ai');
      expect(template).toBeDefined();
      expect(template?.outputFormat).toBe('json');
    });

    it('should have content-generation template', () => {
      const template = service.getTemplate('content-generation');
      expect(template).toBeDefined();
    });
  });
});
