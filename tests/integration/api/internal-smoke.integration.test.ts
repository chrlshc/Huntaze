import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

describe('Internal API Smoke Tests', () => {
  it('requires auth for /api/onlyfans/fans', async () => {
    const response = await fetch(`${BASE_URL}/api/onlyfans/fans`);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error?.code).toBeDefined();
  });

  it('returns war room state shape', async () => {
    const response = await fetch(`${BASE_URL}/api/marketing-war-room/state`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.queue)).toBe(true);
    expect(data.automations).toBeTypeOf('object');
    expect(data.health).toBeTypeOf('object');
    expect(Array.isArray(data.health?.checks)).toBe(true);
  });

  it('returns ai quota payload', async () => {
    const response = await fetch(`${BASE_URL}/api/ai/quota`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('quota');
  });
});
