"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OfferForm } from '@/components/offers/OfferForm';
import { AIPricingOptimizer } from '@/components/offers/AIPricingOptimizer';
import { AIBundleCreator } from '@/components/offers/AIBundleCreator';
import { AIDiscountStrategy } from '@/components/offers/AIDiscountStrategy';
import { ArrowLeft, Sparkles, Tag, Wand2 } from 'lucide-react';
import Link from 'next/link';
import type { CreateOfferInput } from '@/lib/offers/types';

type CreationMode = 'manual' | 'ai-pricing' | 'ai-bundle' | 'ai-discount';

export default function NewOfferPage() {
  const router = useRouter();
  const [mode, setMode] = useState<CreationMode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateOfferInput) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        router.push('/offers');
      }
    } catch (error) {
      console.error('Failed to create offer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mode selection screen
  if (!mode) {
    return (
      <main className="hz-main" role="main">
        <div className="hz-page max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/offers" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Offers
            </Link>
            <h1 className="text-2xl font-bold">Create New Offer</h1>
            <p className="text-muted-foreground mt-1">
              Choose how you want to create your offer
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Manual Creation */}
            <Card 
              className="p-6 cursor-pointer hover:border-primary transition-colors"
              onClick={() => setMode('manual')}
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Tag className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Manual Creation</h3>
              <p className="text-sm text-muted-foreground">
                Create an offer from scratch with full control over all settings
              </p>
            </Card>

            {/* AI Pricing */}
            <Card 
              className="p-6 cursor-pointer hover:border-primary transition-colors"
              onClick={() => setMode('ai-pricing')}
            >
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Pricing Optimizer</h3>
              <p className="text-sm text-muted-foreground">
                Get AI-powered pricing suggestions based on your sales data
              </p>
            </Card>

            {/* AI Bundle */}
            <Card 
              className="p-6 cursor-pointer hover:border-primary transition-colors"
              onClick={() => setMode('ai-bundle')}
            >
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <Wand2 className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Bundle Creator</h3>
              <p className="text-sm text-muted-foreground">
                Let AI suggest content bundles based on fan preferences
              </p>
            </Card>

            {/* AI Discount */}
            <Card 
              className="p-6 cursor-pointer hover:border-primary transition-colors"
              onClick={() => setMode('ai-discount')}
            >
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Discount Strategy</h3>
              <p className="text-sm text-muted-foreground">
                Get strategic discount recommendations for different fan segments
              </p>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="hz-main" role="main">
      <div className="hz-page max-w-4xl mx-auto">
        <div className="mb-6">
          <button 
            onClick={() => setMode(null)}
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Options
          </button>
          <h1 className="text-2xl font-bold">
            {mode === 'manual' && 'Create Offer'}
            {mode === 'ai-pricing' && 'AI Pricing Optimizer'}
            {mode === 'ai-bundle' && 'AI Bundle Creator'}
            {mode === 'ai-discount' && 'AI Discount Strategy'}
          </h1>
        </div>

        {mode === 'manual' && (
          <OfferForm
            onSubmit={handleSubmit}
            onCancel={() => router.push('/offers')}
            isLoading={isLoading}
          />
        )}

        {mode === 'ai-pricing' && (
          <AIPricingOptimizer 
            onApply={(suggestion) => {
              // Pre-fill form with AI suggestion
              console.log('Apply pricing:', suggestion);
            }}
          />
        )}

        {mode === 'ai-bundle' && (
          <AIBundleCreator 
            onCreateBundle={(bundle) => {
              console.log('Create bundle:', bundle);
            }}
          />
        )}

        {mode === 'ai-discount' && (
          <AIDiscountStrategy 
            onApplyDiscount={(discount) => {
              console.log('Apply discount:', discount);
            }}
          />
        )}
      </div>
    </main>
  );
}
