/**
 * Smoke tests for content-factory endpoints in real mode.
 */

import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

function createJsonPost(url: string, body: Record<string, unknown>) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Content factory API (real mode)', () => {
  it('returns empty ideas list', async () => {
    const { POST } = await import('@/app/api/content-factory/ideas/route');
    const req = createJsonPost('http://localhost:3000/api/content-factory/ideas', {
      niche: 'fitness',
      goal: 'sell',
      count: 3,
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.ideas)).toBe(true);
  });

  it('returns empty script variants list', async () => {
    const { POST } = await import('@/app/api/content-factory/script/route');
    const req = createJsonPost('http://localhost:3000/api/content-factory/script', {
      idea: 'Sample idea',
      targets: 'all',
      variants: 3,
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.variants)).toBe(true);
  });

  it('returns planned drafts response with empty IDs', async () => {
    const { POST } = await import('@/app/api/content-factory/planned-drafts/route');
    const req = createJsonPost('http://localhost:3000/api/content-factory/planned-drafts', {
      ideaId: 'idea_123',
      ideaTitle: 'Sample idea',
      variants: 3,
      targets: ['tt'],
      sendToMarketing: true,
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.createdContentIds)).toBe(true);
  });
});
