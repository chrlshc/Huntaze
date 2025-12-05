"use client";

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OfferAnalytics } from '@/components/offers/OfferAnalytics';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OfferAnalyticsPage() {
  return (
    <main className="hz-main" role="main">
      <div className="hz-page">
        <div className="mb-6">
          <Link href="/offers" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Offers
          </Link>
        </div>

        <OfferAnalytics />
      </div>
    </main>
  );
}
