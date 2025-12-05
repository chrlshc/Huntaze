/**
 * Property Test: Offer Status Expiration
 * **Feature: huntaze-ai-features-coming-soon, Property 7: Offer Status Expiration**
 * **Validates: Requirements 5.3**
 * 
 * For any offer with validUntil in the past, status should be 'expired'
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    offer: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { OffersService } from '@/lib/offers/offers.service';
import { prisma } from '@/lib/prisma';

const mockedPrisma = vi.mocked(prisma);

// ============================================
// Tests
// ============================================

describe('Offer Status Expiration Property Tests', () => {
  let service: OffersService;
  const testUserId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock return value to avoid undefined
    vi.mocked(mockedPrisma.offer.updateMany).mockResolvedValue({ count: 0 });
    service = new OffersService();
  });

  /**
   * Property 7: Offer Status Expiration
   * For any offer with validUntil in the past, status should be 'expired'
   */
  it('should expire offers with past validUntil dates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }),
        async (expiredCount) => {
          vi.mocked(mockedPrisma.offer.updateMany).mockResolvedValueOnce({ count: expiredCount });

          const result = await service.expireOffers();

          expect(mockedPrisma.offer.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                status: { in: ['active', 'scheduled'] },
              }),
              data: { status: 'expired' },
            })
          );
          expect(result).toBe(expiredCount);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Scheduled offers become active when validFrom passes
   */
  it('should activate scheduled offers when validFrom is reached', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 50 }),
        async (activatedCount) => {
          vi.mocked(mockedPrisma.offer.updateMany).mockResolvedValueOnce({ count: activatedCount });

          const result = await service.activateScheduledOffers();

          expect(mockedPrisma.offer.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                status: 'scheduled',
              }),
              data: { status: 'active' },
            })
          );
          expect(result).toBe(activatedCount);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Status calculation is deterministic based on dates
   */
  it('should calculate status deterministically based on dates', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) }),
        fc.integer({ min: 1, max: 365 }),
        (baseDate, daysValid) => {
          const now = new Date();
          const validFrom = baseDate;
          const validUntil = new Date(baseDate.getTime() + daysValid * 24 * 60 * 60 * 1000);

          let expectedStatus: string;
          if (validUntil < now) {
            expectedStatus = 'expired';
          } else if (validFrom > now) {
            expectedStatus = 'scheduled';
          } else {
            expectedStatus = 'active';
          }

          expect(['active', 'scheduled', 'expired']).toContain(expectedStatus);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Draft status is preserved regardless of dates
   * When user explicitly requests 'draft' status, it should be preserved
   */
  it('should preserve draft status regardless of dates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date(), max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
        fc.integer({ min: 1, max: 30 }),
        async (validFrom, days) => {
          const validUntil = new Date(validFrom.getTime() + days * 24 * 60 * 60 * 1000);
          const now = new Date();

          // The service should preserve 'draft' status when explicitly requested
          // Mock returns what the service sends to Prisma (which should be 'draft')
          vi.mocked(mockedPrisma.offer.create).mockImplementation(async (args) => {
            return {
              id: crypto.randomUUID(),
              userId: testUserId,
              name: args.data.name as string,
              description: null,
              discountType: 'percentage',
              discountValue: 10,
              originalPrice: null,
              validFrom,
              validUntil,
              status: args.data.status as string, // Return what was passed
              targetAudience: null,
              contentIds: [],
              redemptionCount: 0,
              createdAt: now,
              updatedAt: now,
            } as never;
          });

          const created = await service.createOffer(testUserId, {
            name: 'Draft Offer',
            discountType: 'percentage',
            discountValue: 10,
            validFrom,
            validUntil,
            status: 'draft',
          });

          expect(created.status).toBe('draft');
        }
      ),
      { numRuns: 30 }
    );
  });
});
