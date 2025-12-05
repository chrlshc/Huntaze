"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Plus, 
  Tag, 
  Percent, 
  Gift, 
  MoreVertical,
  Play,
  Pause,
  Copy,
  Trash2,
  Edit,
  TrendingUp,
  Calendar,
  Users,
  DollarSign
} from 'lucide-react';
import type { Offer, OfferStatus, DiscountType } from '@/lib/offers/types';

type FilterStatus = 'all' | OfferStatus;

// Mock data for development
const mockOffers: Offer[] = [
  {
    id: '1',
    userId: 1,
    name: 'Summer Sale 20% Off',
    description: 'Limited time summer discount on all content',
    discountType: 'percentage',
    discountValue: 20,
    originalPrice: 50,
    validFrom: new Date('2024-06-01'),
    validUntil: new Date('2024-08-31'),
    status: 'active',
    targetAudience: 'All fans',
    contentIds: ['c1', 'c2', 'c3'],
    redemptionCount: 145,
    createdAt: new Date('2024-05-15'),
    updatedAt: new Date('2024-05-15'),
  },
  {
    id: '2',
    userId: 1,
    name: 'New Subscriber Welcome',
    description: '$10 off first purchase',
    discountType: 'fixed',
    discountValue: 10,
    originalPrice: null,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-12-31'),
    status: 'active',
    targetAudience: 'New subscribers',
    contentIds: [],
    redemptionCount: 89,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    userId: 1,
    name: 'Black Friday Bundle',
    description: 'Buy 2 get 1 free on selected content',
    discountType: 'bogo',
    discountValue: 33,
    originalPrice: 75,
    validFrom: new Date('2024-11-25'),
    validUntil: new Date('2024-11-30'),
    status: 'scheduled',
    targetAudience: 'VIP fans',
    contentIds: ['c4', 'c5', 'c6'],
    redemptionCount: 0,
    createdAt: new Date('2024-10-01'),
    updatedAt: new Date('2024-10-01'),
  },
  {
    id: '4',
    userId: 1,
    name: 'Flash Sale Draft',
    description: 'Quick 24h sale - draft',
    discountType: 'percentage',
    discountValue: 30,
    originalPrice: 40,
    validFrom: new Date('2024-07-01'),
    validUntil: new Date('2024-07-02'),
    status: 'draft',
    targetAudience: null,
    contentIds: [],
    redemptionCount: 0,
    createdAt: new Date('2024-06-20'),
    updatedAt: new Date('2024-06-20'),
  },
  {
    id: '5',
    userId: 1,
    name: 'Spring Promo',
    description: '15% off spring collection',
    discountType: 'percentage',
    discountValue: 15,
    originalPrice: 60,
    validFrom: new Date('2024-03-01'),
    validUntil: new Date('2024-05-31'),
    status: 'expired',
    targetAudience: 'All fans',
    contentIds: ['c7', 'c8'],
    redemptionCount: 234,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
];

const statusColors: Record<OfferStatus, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const discountIcons: Record<DiscountType, typeof Percent> = {
  percentage: Percent,
  fixed: DollarSign,
  bogo: Gift,
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatDiscount(type: DiscountType, value: number): string {
  switch (type) {
    case 'percentage':
      return `${value}% off`;
    case 'fixed':
      return `$${value} off`;
    case 'bogo':
      return 'Buy 2 Get 1';
    default:
      return `${value}`;
  }
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>(mockOffers);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredOffers = filter === 'all' 
    ? offers 
    : offers.filter(o => o.status === filter);

  const stats = {
    total: offers.length,
    active: offers.filter(o => o.status === 'active').length,
    totalRedemptions: offers.reduce((sum, o) => sum + o.redemptionCount, 0),
  };

  const handleToggleStatus = async (offer: Offer) => {
    const newStatus: OfferStatus = offer.status === 'active' ? 'draft' : 'active';
    setOffers(prev => prev.map(o => 
      o.id === offer.id ? { ...o, status: newStatus } : o
    ));
    setOpenMenu(null);
  };

  const handleDuplicate = async (offer: Offer) => {
    const duplicated: Offer = {
      ...offer,
      id: `${offer.id}-copy-${Date.now()}`,
      name: `${offer.name} (Copy)`,
      status: 'draft',
      redemptionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setOffers(prev => [duplicated, ...prev]);
    setOpenMenu(null);
  };

  const handleDelete = async (offerId: string) => {
    if (confirm('Are you sure you want to delete this offer?')) {
      setOffers(prev => prev.filter(o => o.id !== offerId));
    }
    setOpenMenu(null);
  };

  // Empty state
  if (offers.length === 0) {
    return (
      <main className="hz-main" role="main">
        <div className="hz-page">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Offers & Discounts</h1>
          </div>
          
          <Card className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Tag className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No offers yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first offer to boost sales and engage your fans with special discounts and bundles.
            </p>
            <Link href="/offers/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Offer
              </Button>
            </Link>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="hz-main" role="main">
      <div className="hz-page">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Offers & Discounts</h1>
            <p className="text-muted-foreground mt-1">
              Manage your promotional offers and track performance
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/offers/analytics">
              <Button variant="outline">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </Link>
            <Link href="/offers/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Offer
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Offers</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Play className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Offers</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Redemptions</p>
                <p className="text-2xl font-bold">{stats.totalRedemptions}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'active', 'scheduled', 'draft', 'expired'] as FilterStatus[]).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize whitespace-nowrap"
            >
              {status}
              {status !== 'all' && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-background/20">
                  {offers.filter(o => status === 'all' || o.status === status).length}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Offers List */}
        <div className="space-y-3">
          {filteredOffers.map((offer) => {
            const DiscountIcon = discountIcons[offer.discountType];
            return (
              <Card key={offer.id} className="p-4 hover:bg-accent/5 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <DiscountIcon className="w-6 h-6 text-primary" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{offer.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full border ${statusColors[offer.status]}`}>
                          {offer.status}
                        </span>
                      </div>
                      
                      {offer.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                          {offer.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Percent className="w-3.5 h-3.5" />
                          {formatDiscount(offer.discountType, offer.discountValue)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(offer.validFrom)} - {formatDate(offer.validUntil)}
                        </span>
                        {offer.targetAudience && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {offer.targetAudience}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {offer.redemptionCount} redemptions
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="relative flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOpenMenu(openMenu === offer.id ? null : offer.id)}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                    
                    {openMenu === offer.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-popover border rounded-lg shadow-lg z-10 py-1">
                        <Link 
                          href={`/offers/${offer.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent w-full"
                          onClick={() => setOpenMenu(null)}
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(offer)}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent w-full text-left"
                        >
                          {offer.status === 'active' ? (
                            <>
                              <Pause className="w-4 h-4" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              Activate
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDuplicate(offer)}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent w-full text-left"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>
                        <hr className="my-1 border-border" />
                        <button
                          onClick={() => handleDelete(offer.id)}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent w-full text-left text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Empty filtered state */}
        {filteredOffers.length === 0 && offers.length > 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No {filter} offers found.
            </p>
            <Button 
              variant="link" 
              onClick={() => setFilter('all')}
              className="mt-2"
            >
              View all offers
            </Button>
          </Card>
        )}
      </div>
    </main>
  );
}
