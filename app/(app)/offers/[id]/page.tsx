"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OfferForm } from '@/components/offers/OfferForm';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Offer, UpdateOfferInput } from '@/lib/offers/types';

// Mock offer for development
const mockOffer: Offer = {
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
};

export default function EditOfferPage() {
  const router = useRouter();
  const params = useParams();
  const offerId = params.id as string;
  
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Simulate API fetch
    const fetchOffer = async () => {
      setIsLoading(true);
      try {
        // In production: const response = await fetch(`/api/offers/${offerId}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        setOffer({ ...mockOffer, id: offerId });
      } catch (error) {
        console.error('Failed to fetch offer:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOffer();
  }, [offerId]);

  const handleSubmit = async (data: UpdateOfferInput) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        router.push('/offers');
      }
    } catch (error) {
      console.error('Failed to update offer:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="hz-main" role="main">
        <div className="hz-page max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </main>
    );
  }

  if (!offer) {
    return (
      <main className="hz-main" role="main">
        <div className="hz-page max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Offer not found</h2>
            <p className="text-muted-foreground mb-4">
              The offer you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/offers">
              <Button>Back to Offers</Button>
            </Link>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="hz-main" role="main">
      <div className="hz-page max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/offers" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Offers
          </Link>
          <h1 className="text-2xl font-bold">Edit Offer</h1>
          <p className="text-muted-foreground mt-1">
            Update your offer settings
          </p>
        </div>

        <OfferForm
          offer={offer}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/offers')}
          isLoading={isSaving}
        />
      </div>
    </main>
  );
}
