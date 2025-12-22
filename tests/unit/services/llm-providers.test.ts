import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/services/external/http', () => ({
  externalFetchJson: vi.fn(),
}));

import { externalFetchJson } from '@/lib/services/external/http';
import { ClaudeProvider, type LLMDraftParams } from '@/services/llm-providers';

const baseParams: LLMDraftParams = {
  fanMessage: 'Hey there',
  fanData: {
    name: 'Sam',
    rfmSegment: 'CASUAL',
    lastActive: '2025-01-01T00:00:00.000Z',
    totalSpent: 0,
    messageCount: 1,
  },
  persona: {
    name: 'Ava',
    style_guide: 'Warm and friendly',
    tone_keywords: ['warm', 'casual'],
    templates: {
      welcome: 'Hey ${name}! Thanks for reaching out.',
    },
  },
};

describe('ClaudeProvider', () => {
  it('parses a successful Claude response', async () => {
    const mockExternalFetchJson = vi.mocked(externalFetchJson);
    mockExternalFetchJson.mockResolvedValueOnce({
      content: [{ text: 'Hello Sam!' }],
    });

    const provider = new ClaudeProvider('test-key');
    const result = await provider.generateDraft(baseParams);

    expect(result.draft).toBe('Hello Sam!');
    expect(result.confidence).toBe(0.85);
  });

  it('falls back when Claude API fails', async () => {
    const mockExternalFetchJson = vi.mocked(externalFetchJson);
    mockExternalFetchJson.mockRejectedValueOnce(new Error('upstream down'));

    const provider = new ClaudeProvider('test-key');
    const result = await provider.generateDraft(baseParams);

    expect(result.confidence).toBe(0.5);
    expect(result.draft).toBe('Hey Sam! Thanks for reaching out.');
  });
});
