"use client";

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OfferForm } from '@/components/offers/OfferForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Offer, UpdateOfferInput } from '@/lib/offers/types';
import useSWR from 'swr';
import { standardFetcher } from '@/lib/swr';
import { DashboardErrorState, DashboardLoadingState } from '@/components/ui/DashboardLoadingState';

type OfferDto = Omit<Offer, 'validFrom' | 'validUntil' | 'createdAt' | 'updatedAt'> & {
  validFrom: string;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
};

function normalizeOffer(dto: OfferDto): Offer {
  return {
    ...dto,
    validFrom: new Date(dto.validFrom),
    validUntil: new Date(dto.validUntil),
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}

export default function EditOfferPage() {
  const router = useRouter();
  const params = useParams();
  const offerId = params.id as string;
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR<OfferDto>(
    offerId ? `/api/offers/${offerId}` : null,
    standardFetcher
  );

  const offer = data ? normalizeOffer(data) : null;

  const handleSubmit = async (data: UpdateOfferInput) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        void mutate();
        router.push('/offers');
        return;
      }
      const message = await response.json().catch(() => null);
      if (message && typeof message === 'object' && 'error' in message) {
        setSaveError(String((message as any).error));
      } else {
        setSaveError('Failed to update offer');
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to update offer');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="hz-main" role="main">
        <div className="hz-page max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <DashboardLoadingState message="Loading offer..." />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="hz-main" role="main">
        <div className="hz-page max-w-4xl mx-auto">
          <div className="py-10 flex items-center justify-center">
            <DashboardErrorState
              message={error instanceof Error ? error.message : 'Failed to load offer'}
              onRetry={() => void mutate()}
            />
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
            <div className="flex items-center justify-center gap-2">
              <Link href="/offers">
                <Button>Back to Offers</Button>
              </Link>
              <Button variant="outline" onClick={() => void mutate()}>
                Retry
              </Button>
            </div>
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

        {saveError && (
          <div className="mb-4">
            <DashboardErrorState message={saveError} />
          </div>
        )}

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
