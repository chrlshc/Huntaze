/**
 * Smoke tests for revenue/dashboard API routes.
 * Covers auth handling and critical endpoints with minimal mocks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { FansRepository } from '@/lib/db/repositories';

vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    transactions: {
      findMany: vi.fn(),
    },
    subscriptions: {
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

vi.mock('@/lib/db/repositories', () => ({
  FansRepository: {
    listFans: vi.fn(),
  },
}));

describe('Revenue/Dashboard API smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: '1' } } as any);
    vi.mocked(prisma.transactions.findMany).mockResolvedValue([]);
    vi.mocked(prisma.subscriptions.count).mockResolvedValue(0);
    vi.mocked(prisma.subscriptions.findMany).mockResolvedValue([]);
    vi.mocked(prisma.subscriptions.groupBy).mockResolvedValue([]);
    vi.mocked(FansRepository.listFans).mockResolvedValue([] as any);
  });

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const { GET } = await import('@/app/api/dashboard/overview/route');
    const req = new NextRequest('http://localhost:3000/api/dashboard/overview?from=2024-01-01&to=2024-01-07');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  it('returns overview payload with required fields', async () => {
    const { GET } = await import('@/app/api/dashboard/overview/route');
    const req = new NextRequest('http://localhost:3000/api/dashboard/overview?from=2024-01-01&to=2024-01-07');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('kpis');
    expect(data).toHaveProperty('revenueDaily');
    expect(data).toHaveProperty('revenueDailyPrev');
  });

  it('returns churn summary and empty list when no fans', async () => {
    const { GET } = await import('@/app/api/revenue/churn/route');
    const req = new NextRequest('http://localhost:3000/api/revenue/churn?creatorId=1');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary.totalAtRisk).toBe(0);
    expect(Array.isArray(data.fans)).toBe(true);
  });

  it('returns forecast payload with currentMonth and forecast array', async () => {
    const { GET } = await import('@/app/api/revenue/forecast/route');
    const req = new NextRequest('http://localhost:3000/api/revenue/forecast?creatorId=1&months=3');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('currentMonth');
    expect(Array.isArray(data.forecast)).toBe(true);
  });
});
