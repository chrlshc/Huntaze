/**
 * Offers Service
 * CRUD operations for promotional offers
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { prisma } from '@/lib/prisma';
import {
  Offer,
  CreateOfferInput,
  UpdateOfferInput,
  OfferStatus,
} from './types';

// ============================================
// Service Class
// ============================================

export class OffersService {
  /**
   * Create a new offer
   * Requirements: 5.1
   */
  async createOffer(userId: number, input: CreateOfferInput): Promise<Offer> {
    const status = this.calculateStatus(input.validFrom, input.validUntil, input.status);
    
    const offer = await prisma.offer.create({
      data: {
        userId,
        name: input.name,
        description: input.description ?? null,
        discountType: input.discountType,
        discountValue: input.discountValue,
        originalPrice: input.originalPrice ?? null,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        status,
        targetAudience: input.targetAudience ?? null,
        contentIds: input.contentIds ?? [],
      },
    });

    return this.mapToOffer(offer);
  }

  /**
   * Get offer by ID
   * Requirements: 5.2
   */
  async getOffer(id: string, userId?: number): Promise<Offer | null> {
    const where: { id: string; userId?: number } = { id };
    if (userId !== undefined) {
      where.userId = userId;
    }

    const offer = await prisma.offer.findFirst({ where });
    return offer ? this.mapToOffer(offer) : null;
  }


  /**
   * Update an offer
   * Requirements: 5.4
   */
  async updateOffer(
    id: string,
    userId: number,
    input: UpdateOfferInput
  ): Promise<Offer | null> {
    const existing = await prisma.offer.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    const validFrom = input.validFrom ?? existing.validFrom;
    const validUntil = input.validUntil ?? existing.validUntil;
    const status = input.status ?? this.calculateStatus(validFrom, validUntil);

    const offer = await prisma.offer.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.discountType !== undefined && { discountType: input.discountType }),
        ...(input.discountValue !== undefined && { discountValue: input.discountValue }),
        ...(input.originalPrice !== undefined && { originalPrice: input.originalPrice }),
        ...(input.validFrom !== undefined && { validFrom: input.validFrom }),
        ...(input.validUntil !== undefined && { validUntil: input.validUntil }),
        status,
        ...(input.targetAudience !== undefined && { targetAudience: input.targetAudience }),
        ...(input.contentIds !== undefined && { contentIds: input.contentIds }),
      },
    });

    return this.mapToOffer(offer);
  }

  /**
   * Delete an offer
   * Requirements: 5.4
   */
  async deleteOffer(id: string, userId: number): Promise<boolean> {
    const existing = await prisma.offer.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return false;
    }

    await prisma.offer.delete({ where: { id } });
    return true;
  }

  /**
   * List offers for a user
   * Requirements: 5.2
   */
  async listOffers(
    userId: number,
    options?: {
      status?: OfferStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ offers: Offer[]; total: number }> {
    const where: { userId: number; status?: string } = { userId };
    if (options?.status) {
      where.status = options.status;
    }

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      prisma.offer.count({ where }),
    ]);

    return {
      offers: offers.map((o) => this.mapToOffer(o)),
      total,
    };
  }


  /**
   * Duplicate an offer
   * Requirements: 5.5
   */
  async duplicateOffer(id: string, userId: number): Promise<Offer | null> {
    const existing = await prisma.offer.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    // Create a copy with new dates and draft status
    const now = new Date();
    const validFrom = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const validUntil = new Date(validFrom.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

    const duplicated = await prisma.offer.create({
      data: {
        userId,
        name: `${existing.name} (Copy)`,
        description: existing.description,
        discountType: existing.discountType,
        discountValue: existing.discountValue,
        originalPrice: existing.originalPrice,
        validFrom,
        validUntil,
        status: 'draft',
        targetAudience: existing.targetAudience,
        contentIds: existing.contentIds,
      },
    });

    return this.mapToOffer(duplicated);
  }

  /**
   * Update expired offers status
   * Requirements: 5.3
   */
  async expireOffers(): Promise<number> {
    const now = new Date();
    
    const result = await prisma.offer.updateMany({
      where: {
        status: { in: ['active', 'scheduled'] },
        validUntil: { lt: now },
      },
      data: {
        status: 'expired',
      },
    });

    return result.count;
  }

  /**
   * Activate scheduled offers
   * Requirements: 5.3
   */
  async activateScheduledOffers(): Promise<number> {
    const now = new Date();
    
    const result = await prisma.offer.updateMany({
      where: {
        status: 'scheduled',
        validFrom: { lte: now },
        validUntil: { gt: now },
      },
      data: {
        status: 'active',
      },
    });

    return result.count;
  }

  /**
   * Calculate offer status based on dates
   */
  private calculateStatus(
    validFrom: Date,
    validUntil: Date,
    requestedStatus?: OfferStatus
  ): OfferStatus {
    if (requestedStatus === 'draft') {
      return 'draft';
    }

    const now = new Date();
    
    if (validUntil < now) {
      return 'expired';
    }
    
    if (validFrom > now) {
      return 'scheduled';
    }
    
    return 'active';
  }

  /**
   * Map Prisma model to Offer type
   */
  private mapToOffer(offer: {
    id: string;
    userId: number;
    name: string;
    description: string | null;
    discountType: string;
    discountValue: number;
    originalPrice: number | null;
    validFrom: Date;
    validUntil: Date;
    status: string;
    targetAudience: string | null;
    contentIds: string[];
    redemptionCount: number;
    createdAt: Date;
    updatedAt: Date;
  }): Offer {
    return {
      id: offer.id,
      userId: offer.userId,
      name: offer.name,
      description: offer.description,
      discountType: offer.discountType as Offer['discountType'],
      discountValue: offer.discountValue,
      originalPrice: offer.originalPrice,
      validFrom: offer.validFrom,
      validUntil: offer.validUntil,
      status: offer.status as Offer['status'],
      targetAudience: offer.targetAudience,
      contentIds: offer.contentIds,
      redemptionCount: offer.redemptionCount,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
    };
  }
}

// ============================================
// Singleton Export
// ============================================

export const offersService = new OffersService();
