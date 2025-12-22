export type DiscountType = 'percentage' | 'fixed' | 'bogo';
export type OfferStatus = 'draft' | 'scheduled' | 'active' | 'expired';

export interface MockOffer {
  id: string;
  userId: number;
  name: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  originalPrice: number | null;
  validFrom: string;
  validUntil: string;
  status: OfferStatus;
  targetAudience: string | null;
  contentIds: string[];
  redemptionCount: number;
  createdAt: string;
  updatedAt: string;
}

export const mockOffers: MockOffer[] = [
  {
    id: 'offer_1',
    userId: 1,
    name: 'Summer Sale 20% Off',
    description: 'Limited time summer discount on all content',
    discountType: 'percentage',
    discountValue: 20,
    originalPrice: 50,
    validFrom: '2024-06-01T00:00:00.000Z',
    validUntil: '2024-08-31T00:00:00.000Z',
    status: 'active',
    targetAudience: 'All fans',
    contentIds: ['c1', 'c2', 'c3'],
    redemptionCount: 145,
    createdAt: '2024-05-15T00:00:00.000Z',
    updatedAt: '2024-05-15T00:00:00.000Z',
  },
  {
    id: 'offer_2',
    userId: 1,
    name: 'New Subscriber Welcome',
    description: '$10 off first purchase',
    discountType: 'fixed',
    discountValue: 10,
    originalPrice: null,
    validFrom: '2024-01-01T00:00:00.000Z',
    validUntil: '2024-12-31T00:00:00.000Z',
    status: 'active',
    targetAudience: 'New subscribers',
    contentIds: [],
    redemptionCount: 89,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'offer_3',
    userId: 1,
    name: 'Black Friday Bundle',
    description: 'Buy 2 get 1 free on selected content',
    discountType: 'bogo',
    discountValue: 33,
    originalPrice: 75,
    validFrom: '2024-11-25T00:00:00.000Z',
    validUntil: '2024-11-30T00:00:00.000Z',
    status: 'scheduled',
    targetAudience: 'VIP fans',
    contentIds: ['c4', 'c5', 'c6'],
    redemptionCount: 0,
    createdAt: '2024-10-01T00:00:00.000Z',
    updatedAt: '2024-10-01T00:00:00.000Z',
  },
  {
    id: 'offer_4',
    userId: 1,
    name: 'Flash Sale Draft',
    description: 'Quick 24h sale - draft',
    discountType: 'percentage',
    discountValue: 30,
    originalPrice: 40,
    validFrom: '2024-07-01T00:00:00.000Z',
    validUntil: '2024-07-02T00:00:00.000Z',
    status: 'draft',
    targetAudience: null,
    contentIds: [],
    redemptionCount: 0,
    createdAt: '2024-06-20T00:00:00.000Z',
    updatedAt: '2024-06-20T00:00:00.000Z',
  },
  {
    id: 'offer_5',
    userId: 1,
    name: 'Spring Promo',
    description: '15% off spring collection',
    discountType: 'percentage',
    discountValue: 15,
    originalPrice: 60,
    validFrom: '2024-03-01T00:00:00.000Z',
    validUntil: '2024-05-31T00:00:00.000Z',
    status: 'expired',
    targetAudience: 'All fans',
    contentIds: ['c7', 'c8'],
    redemptionCount: 234,
    createdAt: '2024-02-15T00:00:00.000Z',
    updatedAt: '2024-02-15T00:00:00.000Z',
  },
];

