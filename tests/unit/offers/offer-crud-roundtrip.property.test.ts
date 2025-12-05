/**
 * Property Test: Offer CRUD Round Trip
 * **Feature: huntaze-ai-features-coming-soon, Property 6: Offer CRUD Round Trip**
 * **Validates: Requirements 5.1**
 * 
 * For any valid offer input, creating then retrieving should return equivalent data
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { OffersService } from '@/lib/offers/offers.service';
import { CreateOfferInput, DiscountType, OfferStatus } from '@/lib/offers/types';

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

const validDateRangeArb = fc.tuple(
  fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }),
  fc.integer({ min: 1, max: 30 })
).map(([start, days]) => ({
  validFrom: start,
  validUntil: new Date(start.getTime() + days * 24 * 60 * 60 * 1000),
}));

const createOfferInputArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  discountType: discountTypeArb,
  discountValue: fc.double({ min: 0.01, max: 100, noNaN: true }),
  originalPrice: fc.option(fc.double({ min: 1, max: 10000, noNaN: true }), { nil: undefined }),
  targetAudience: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  contentIds: fc.option(fc.array(fc.uuid(), { maxLength: 5 }), { nil: undefined }),
}).chain(base => validDateRangeArb.map(dates => ({
  ...base,
  ...dates,
}))) as fc.Arbitrary<CreateOfferInput>;

// ============================================
// Tests
// ============================================

describe('Offer CRUD Round Trip Property Tests', () => {
  let service: OffersService;
  const testUserId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OffersService();
  });

  /**
   * Property 6: Offer CRUD Round Trip
   * For any valid offer input, creating then retrieving should return equivalent data
   */
  it('should preserve offer data through create-read cycle', async () => {
    await fc.assert(
      fc.asyncProperty(createOfferInputArb, async (input) => {
        const mockId = crypto.randomUUID();
        const now = new Date();
        const expectedStatus = input.validFrom > now ? 'scheduled' : 'active';

        const mockCreated = {
          id: mockId,
          userId: testUserId,
          name: input.name,
          description: input.description ?? null,
          discountType: input.discountType,
          discountValue: input.discountValue,
          originalPrice: input.originalPrice ?? null,
          validFrom: input.validFrom,
          validUntil: input.validUntil,
          status: expectedStatus,
          targetAudience: input.targetAudience ?? null,
          contentIds: input.contentIds ?? [],
          redemptionCount: 0,
          createdAt: now,
          updatedAt: now,
        };

        mockedPrisma.offer.create.mockResolvedValue(mockCreated);
        mockedPrisma.offer.findFirst.mockResolvedValue(mockCreated);

        const created = await service.createOffer(testUserId, input);
        const retrieved = await service.getOffer(created.id, testUserId);

        expect(retrieved).not.toBeNull();
        expect(retrieved!.name).toBe(input.name);
        expect(retrieved!.description).toBe(input.description ?? null);
        expect(retrieved!.discountType).toBe(input.discountType);
        expect(retrieved!.discountValue).toBe(input.discountValue);
        expect(retrieved!.originalPrice).toBe(input.originalPrice ?? null);
        expect(retrieved!.contentIds).toEqual(input.contentIds ?? []);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Update preserves unmodified fields
   */
  it('should preserve unmodified fields during update', async () => {
    await fc.assert(
      fc.asyncProperty(
        createOfferInputArb,
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        async (input, newName) => {
          const mockId = crypto.randomUUID();
          const now = new Date();
          const expectedStatus = input.validFrom > now ? 'scheduled' : 'active';

          const mockOffer = {
            id: mockId,
            userId: testUserId,
            name: input.name,
            description: input.description ?? null,
            discountType: input.discountType,
            discountValue: input.discountValue,
            originalPrice: input.originalPrice ?? null,
            validFrom: input.validFrom,
            validUntil: input.validUntil,
            status: expectedStatus,
            targetAudience: input.targetAudience ?? null,
            contentIds: input.contentIds ?? [],
            redemptionCount: 0,
            createdAt: now,
            updatedAt: now,
          };

          const mockUpdated = { ...mockOffer, name: newName };

          mockedPrisma.offer.findFirst.mockResolvedValue(mockOffer);
          mockedPrisma.offer.update.mockResolvedValue(mockUpdated);

          const updated = await service.updateOffer(mockId, testUserId, { name: newName });

          expect(updated).not.toBeNull();
          expect(updated!.name).toBe(newName);
          expect(updated!.discountType).toBe(input.discountType);
          expect(updated!.discountValue).toBe(input.discountValue);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Delete removes offer
   */
  it('should successfully delete existing offers', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (offerId) => {
        const mockOffer = {
          id: offerId,
          userId: testUserId,
          name: 'Test Offer',
          description: null,
          discountType: 'percentage',
          discountValue: 10,
          originalPrice: null,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'active',
          targetAudience: null,
          contentIds: [],
          redemptionCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockedPrisma.offer.findFirst.mockResolvedValue(mockOffer);
        mockedPrisma.offer.delete.mockResolvedValue(mockOffer);

        const result = await service.deleteOffer(offerId, testUserId);
        expect(result).toBe(true);
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property: List returns correct count
   */
  it('should return correct total count in list', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 1, max: 50 }),
        async (total, limit) => {
          const mockOffers = Array.from({ length: Math.min(total, limit) }, (_, i) => ({
            id: crypto.randomUUID(),
            userId: testUserId,
            name: `Offer ${i}`,
            description: null,
            discountType: 'percentage',
            discountValue: 10,
            originalPrice: null,
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'active',
            targetAudience: null,
            contentIds: [],
            redemptionCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

          mockedPrisma.offer.findMany.mockResolvedValue(mockOffers);
          mockedPrisma.offer.count.mockResolvedValue(total);

          const result = await service.listOffers(testUserId, { limit });

          expect(result.total).toBe(total);
          expect(result.offers.length).toBeLessThanOrEqual(limit);
        }
      ),
      { numRuns: 30 }
    );
  });
});
