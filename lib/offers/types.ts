/**
 * Offers Types
 * TypeScript interfaces for the Offers & Discounts feature
 */

// ============================================
// Discount Types
// ============================================

export type DiscountType = 'percentage' | 'fixed' | 'bogo';

export type OfferStatus = 'active' | 'expired' | 'scheduled' | 'draft';

// ============================================
// Offer Types
// ============================================

export interface Offer {
  id: string;
  userId: number;
  name: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  originalPrice: number | null;
  validFrom: Date;
  validUntil: Date;
  status: OfferStatus;
  targetAudience: string | null;
  contentIds: string[];
  redemptionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bundle extends Offer {
  bundlePrice: number;
}

export interface CreateOfferInput {
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  originalPrice?: number;
  validFrom: Date;
  validUntil: Date;
  status?: OfferStatus;
  targetAudience?: string;
  contentIds?: string[];
}

export interface UpdateOfferInput {
  name?: string;
  description?: string;
  discountType?: DiscountType;
  discountValue?: number;
  originalPrice?: number;
  validFrom?: Date;
  validUntil?: Date;
  status?: OfferStatus;
  targetAudience?: string;
  contentIds?: string[];
}


// ============================================
// Redemption Types
// ============================================

export interface OfferRedemption {
  id: string;
  offerId: string;
  fanId: string;
  amount: number;
  redeemedAt: Date;
}

export interface RedemptionMetrics {
  totalRedemptions: number;
  totalRevenue: number;
  averageAmount: number;
  conversionRate: number;
}

// ============================================
// AI Pricing Types
// ============================================

export interface SalesData {
  contentId: string;
  price: number;
  salesCount: number;
  revenue: number;
  period: string;
}

export interface PricingSuggestion {
  recommendedPrice: number;
  expectedImpact: string;
  confidence: number;
  reasoning: string;
}

// ============================================
// AI Bundle Types
// ============================================

export interface ContentItem {
  id: string;
  title: string;
  type: string;
  price: number;
  salesCount: number;
}

export interface FanPreference {
  fanId: string;
  preferredTypes: string[];
  purchaseHistory: string[];
  averageSpend: number;
}

export interface BundleSuggestion {
  name: string;
  contentIds: string[];
  suggestedPrice: number;
  expectedValue: string;
  reasoning: string;
}

// ============================================
// AI Discount Types
// ============================================

export interface FanSegment {
  id: string;
  name: string;
  size: number;
  averageSpend: number;
  engagementScore: number;
}

export interface PurchaseData {
  fanId: string;
  offerId: string;
  amount: number;
  purchasedAt: Date;
}

export interface DiscountRecommendation {
  discountType: DiscountType;
  discountValue: number;
  targetAudience: string;
  timing: string;
  reasoning: string;
}

// ============================================
// Analytics Types
// ============================================

export interface OfferAnalytics {
  offerId: string;
  redemptionCount: number;
  totalRevenue: number;
  conversionRate: number;
  averageOrderValue: number;
}

export interface OfferComparison {
  offers: OfferAnalytics[];
  bestPerformer: string;
  insights: string[];
}

export interface AnalyticsExport {
  format: 'csv' | 'json' | 'pdf';
  data: OfferAnalytics[];
  generatedAt: Date;
}
