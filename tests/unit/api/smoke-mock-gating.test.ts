/**
 * Smoke tests to ensure mock-only endpoints are gated when ENABLE_MOCK_DATA is off.
 */

import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

async function expectMockDisabled(response: Response) {
  expect(response.status).toBe(501);
  expect(response.headers.get('cache-control')).toBe('no-store');
  const data = await response.json();
  expect(data?.error?.code).toBe('MOCK_DISABLED');
}

describe('Mock gating (ENABLE_MOCK_DATA=0)', () => {
  it('blocks marketing war room content', async () => {
    const { GET } = await import('@/app/api/marketing-war-room/content/[id]/route');
    const req = new NextRequest('http://localhost:3000/api/marketing-war-room/content/c_001');
    const response = await GET(req, { params: Promise.resolve({ id: 'c_001' }) });
    await expectMockDisabled(response);
  });

  it('blocks OnlyFans login start', async () => {
    const { POST } = await import('@/app/api/of/login/start/route');
    const req = new NextRequest('http://localhost:3000/api/of/login/start', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(req);
    await expectMockDisabled(response);
  });

  it('blocks OnlyFans inbox', async () => {
    const { GET } = await import('@/app/api/of/inbox/route');
    const req = new NextRequest('http://localhost:3000/api/of/inbox');
    const response = await GET(req);
    await expectMockDisabled(response);
  });

  it('blocks OnlyFans thread messages', async () => {
    const { GET, POST } = await import('@/app/api/of/threads/[id]/route');
    const getReq = new NextRequest('http://localhost:3000/api/of/threads/conv1');
    const getResponse = await GET(getReq, { params: Promise.resolve({ id: 'conv1' }) });
    await expectMockDisabled(getResponse);

    const postReq = new NextRequest('http://localhost:3000/api/of/threads/conv1', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hello' }),
    });
    const postResponse = await POST(postReq, { params: Promise.resolve({ id: 'conv1' }) });
    await expectMockDisabled(postResponse);
  });

  it('blocks smart onboarding real-time metrics', async () => {
    const { GET } = await import('@/app/api/smart-onboarding/analytics/real-time-metrics/route');
    const req = new NextRequest('http://localhost:3000/api/smart-onboarding/analytics/real-time-metrics');
    const response = await GET(req);
    await expectMockDisabled(response);
  });

  it('blocks smart onboarding ROI analysis', async () => {
    const { GET } = await import('@/app/api/smart-onboarding/analytics/roi-analysis/route');
    const req = new NextRequest('http://localhost:3000/api/smart-onboarding/analytics/roi-analysis');
    const response = await GET(req);
    await expectMockDisabled(response);
  });

  it('blocks AI warroom', async () => {
    const { POST } = await import('../../../app/api/ai/warroom/route');
    const req = new NextRequest('http://localhost:3000/api/ai/warroom', {
      method: 'POST',
      body: JSON.stringify({ mode: 'pack', platform: 'all', ids: ['1'] }),
    });
    const response = await POST(req);
    await expectMockDisabled(response);
  });

  it('blocks batch endpoint', async () => {
    const { POST } = await import('@/app/api/batch/route');
    const req = new NextRequest('http://localhost:3000/api/batch', {
      method: 'POST',
      body: JSON.stringify({ requests: [] }),
    });
    const response = await POST(req);
    await expectMockDisabled(response);
  });
});
