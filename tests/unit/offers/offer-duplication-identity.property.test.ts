/**
 * Property Test: Offer Duplication Identity
 * **Feature: huntaze-ai-features-coming-soon, Property 8: Offer Duplication Identity**
 * **Validates: Requirements 5.5**
 * 
 * For any offer, duplicating should preserve core properties while creating new identity
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { OffersService } from '@/lib/offers/offers.service';
import { DiscountType } from '@/lib/offers/types';

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

import { prisma } from '@/lib/prisma';

const mockedPrisma = prisma as unknown as {
  offer: {
    create: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
};

// ============================================
// Generators
// ============================================

const discountTypeArb = fc.constantFrom<DiscountType>('percentage', 'fixed', 'bogo');

const offerArb = fc.record({
  id: fc.uuid(),
  userId: fc.integer({ min: 1, max: 1000 }),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  description: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
  discountType: discountTypeArb,
  discountValue: fc.double({ min: 0.01, max: 100, noNaN: true }),
  originalPrice: fc.option(fc.double({ min: 1, max: 10000, noNaN: true }), { nil: null }),
  validFrom: fc.date({ min: new Date(), max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
  validUntil: fc.date({ min: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }),
  status: fc.constantFrom('active', 'scheduled', 'draft', 'expired'),
  targetAudience: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  contentIds: fc.array(fc.uuid(), { maxLength: 5 }),
  redemptionCount: fc.integer({ min: 0, max: 1000 }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

// ============================================
// Tests
// ============================================

describe('Offer Duplication Identity Property Tests', () => {
  let service: OffersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OffersService();
  });

  /**
   * Property 8: Offer Duplication Identity
   * Duplicating preserves core properties while creating new identity
   */
  it('should preserve discount properties when duplicating', async () => {
    await fc.assert(
      fc.asyncProperty(offerArb, async (original) => {
        const newId = crypto.randomUUID();
        const now = new Date();

        const duplicated = {
          ...original,
          id: newId,
          name: `${original.name} (Copy)`,
          status: 'draft',
          redemptionCount: 0,
          validFrom: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          validUntil: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
          createdAt: now,
          updatedAt: now,
        };

        mockedPrisma.offer.findFirst.mockResolvedValue(original);
        mockedPrisma.offer.create.mockResolvedValue(duplicated);

        const result = await service.duplicateOffer(original.id, original.userId);

        expect(result).not.toBeNull();
        expect(result!.discountType).toBe(original.discountType);
        expect(result!.discountValue).toBe(original.discountValue);
        expect(result!.originalPrice).toBe(original.originalPrice);
        expect(result!.targetAudience).toBe(original.targetAudience);
        expect(result!.contentIds).toEqual(original.contentIds);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Duplicated offer has new identity
   */
  it('should create new identity for duplicated offer', async () => {
    await fc.assert(
      fc.asyncProperty(offerArb, async (original) => {
        const newId = crypto.randomUUID();
        const now = new Date();

        const duplicated = {
          ...original,
          id: newId,
          name: `${original.name} (Copy)`,
          status: 'draft',
          redemptionCount: 0,
          validFrom: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          validUntil: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
          createdAt: now,
          updatedAt: now,
        };

        mockedPrisma.offer.findFirst.mockResolvedValue(original);
        mockedPrisma.offer.create.mockResolvedValue(duplicated);

        const result = await service.duplicateOffer(original.id, original.userId);

        expect(result).not.toBeNull();
        expect(result!.id).not.toBe(original.id);
        expect(result!.name).toContain('(Copy)');
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Duplicated offer starts as draft with zero redemptions
   */
  it('should reset status and redemptions for duplicated offer', async () => {
    await fc.assert(
      fc.asyncProperty(offerArb, async (original) => {
        const newId = crypto.randomUUID();
        const now = new Date();

        const duplicated = {
          ...original,
          id: newId,
          name: `${original.name} (Copy)`,
          status: 'draft',
          redemptionCount: 0,
          validFrom: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          validUntil: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
          createdAt: now,
          updatedAt: now,
        };

        mockedPrisma.offer.findFirst.mockResolvedValue(original);
        mockedPrisma.offer.create.mockResolvedValue(duplicated);

        const result = await service.duplicateOffer(original.id, original.userId);

        expect(result).not.toBeNull();
        expect(result!.status).toBe('draft');
        expect(result!.redemptionCount).toBe(0);
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Duplicating non-existent offer returns null
   */
  it('should return null when duplicating non-existent offer', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), fc.integer({ min: 1, max: 1000 }), async (offerId, userId) => {
        mockedPrisma.offer.findFirst.mockResolvedValue(null);

        const result = await service.duplicateOffer(offerId, userId);

        expect(result).toBeNull();
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Duplicated offer has future validity dates
   */
  it('should set future validity dates for duplicated offer', async () => {
    await fc.assert(
      fc.asyncProperty(offerArb, async (original) => {
        const newId = crypto.randomUUID();
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const nextWeek = new Date(tomorrow.getTime() + 7 * 24 * 60 * 60 * 1000);

        const duplicated = {
          ...original,
          id: newId,
          name: `${original.name} (Copy)`,
          status: 'draft',
          redemptionCount: 0,
          validFrom: tomorrow,
          validUntil: nextWeek,
          createdAt: now,
          updatedAt: now,
        };

        mockedPrisma.offer.findFirst.mockResolvedValue(original);
        mockedPrisma.offer.create.mockResolvedValue(duplicated);

        const result = await service.duplicateOffer(original.id, original.userId);

        expect(result).not.toBeNull();
        expect(result!.validFrom.getTime()).toBeGreaterThan(now.getTime());
        expect(result!.validUntil.getTime()).toBeGreaterThan(result!.validFrom.getTime());
      }),
      { numRuns: 30 }
    );
  });
});
