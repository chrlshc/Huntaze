"use client";

/**
 * New Offer Page - Huntaze Monochrome Design
 * Create offers with manual or AI-assisted modes
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OfferForm } from '@/components/offers/OfferForm';
import { AIPricingOptimizer } from '@/components/offers/AIPricingOptimizer';
import { AIBundleCreator } from '@/components/offers/AIBundleCreator';
import { AIDiscountStrategy } from '@/components/offers/AIDiscountStrategy';
import { ArrowLeft, Sparkles, Tag, Wand2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { CreateOfferInput } from '@/lib/offers/types';
import { DashboardErrorState } from '@/components/ui/DashboardLoadingState';

type CreationMode = 'manual' | 'ai-pricing' | 'ai-bundle' | 'ai-discount';

// Huntaze Design Tokens
const hzStyles = `
  .hz-offers-page {
    --hz-radius-card: 14px;
    --hz-radius-icon: 8px;
    --hz-space-xs: 8px;
    --hz-space-sm: 12px;
    --hz-space-md: 16px;
    --hz-space-lg: 24px;
    --hz-shadow-card: 0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03);
    --hz-shadow-hover: 0 2px 4px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.06);
    max-width: 900px;
    margin: 0 auto;
    padding: var(--hz-space-lg);
  }
  .hz-offers-header {
    margin-bottom: var(--hz-space-lg);
  }
  .hz-offers-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #616161;
    text-decoration: none;
    margin-bottom: var(--hz-space-md);
    transition: color 140ms ease;
  }
  .hz-offers-back:hover { color: #303030; }
  .hz-offers-title {
    font-size: 22px;
    font-weight: 600;
    color: #303030;
    margin: 0 0 4px;
  }
  .hz-offers-subtitle {
    font-size: 13px;
    color: #616161;
    margin: 0;
  }
  .hz-offers-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--hz-space-sm);
  }
  @media (max-width: 640px) {
    .hz-offers-grid { grid-template-columns: 1fr; }
  }
  .hz-offer-card {
    display: flex;
    flex-direction: column;
    padding: var(--hz-space-md);
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: var(--hz-radius-card);
    box-shadow: var(--hz-shadow-card);
    cursor: pointer;
    transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
  }
  .hz-offer-card:hover {
    transform: translateY(-1px);
    border-color: #d1d5db;
    box-shadow: var(--hz-shadow-hover);
  }
  .hz-offer-card-primary {
    background: linear-gradient(180deg, #1f1f1f, #111);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1), 0 8px 24px rgba(0, 0, 0, 0.15);
  }
  .hz-offer-card-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 12px 32px rgba(0, 0, 0, 0.2);
  }
  .hz-offer-card-primary .hz-offer-icon { background: rgba(255, 255, 255, 0.1); color: #fff; }
  .hz-offer-card-primary .hz-offer-title { color: #fff; }
  .hz-offer-card-primary .hz-offer-desc { color: rgba(255, 255, 255, 0.7); }
  .hz-offer-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--hz-radius-icon);
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    margin-bottom: var(--hz-space-sm);
  }
  .hz-offer-title {
    font-size: 14px;
    font-weight: 600;
    color: #303030;
    margin-bottom: 4px;
  }
  .hz-offer-desc {
    font-size: 13px;
    color: #616161;
    line-height: 1.4;
  }
  .hz-offer-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 500;
    color: #6b7280;
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: 6px;
    margin-top: var(--hz-space-xs);
    width: fit-content;
  }
  .hz-offer-card-primary .hz-offer-badge {
    background: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.8);
  }
`;

export default function NewOfferPage() {
  const router = useRouter();
  const [mode, setMode] = useState<CreationMode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateOfferInput) => {
    setIsLoading(true);
    setSubmitError(null);
    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const message = await response.json().catch(() => null);
        if (message && typeof message === 'object' && 'error' in message) {
          throw new Error(String((message as any).error));
        }
        throw new Error('Failed to create offer');
      }
      
      router.push('/offers');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create offer');
    } finally {
      setIsLoading(false);
    }
  };

  // Mode selection screen
  if (!mode) {
    return (
      <main className="hz-offers-page" role="main">
        <style>{hzStyles}</style>
        
        <div className="hz-offers-header">
          <Link href="/offers" className="hz-offers-back">
            <ArrowLeft size={16} />
            Back to Offers
          </Link>
          <h1 className="hz-offers-title">Create New Offer</h1>
          <p className="hz-offers-subtitle">Choose how you want to create your offer</p>
        </div>

        <div className="hz-offers-grid">
          {/* Manual Creation - Primary */}
          <div className="hz-offer-card hz-offer-card-primary" onClick={() => setMode('manual')}>
            <div className="hz-offer-icon">
              <Tag size={20} />
            </div>
            <div className="hz-offer-title">Manual Creation</div>
            <div className="hz-offer-desc">
              Create an offer from scratch with full control over all settings
            </div>
          </div>

          {/* AI Pricing */}
          <div className="hz-offer-card" onClick={() => setMode('ai-pricing')}>
            <div className="hz-offer-icon">
              <Sparkles size={20} />
            </div>
            <div className="hz-offer-title">AI Pricing Optimizer</div>
            <div className="hz-offer-desc">
              Get AI-powered pricing suggestions based on your sales data
            </div>
            <div className="hz-offer-badge">
              <Sparkles size={10} /> AI-Powered
            </div>
          </div>

          {/* AI Bundle */}
          <div className="hz-offer-card" onClick={() => setMode('ai-bundle')}>
            <div className="hz-offer-icon">
              <Wand2 size={20} />
            </div>
            <div className="hz-offer-title">AI Bundle Creator</div>
            <div className="hz-offer-desc">
              Let AI suggest content bundles based on fan preferences
            </div>
            <div className="hz-offer-badge">
              <Sparkles size={10} /> AI-Powered
            </div>
          </div>

          {/* AI Discount */}
          <div className="hz-offer-card" onClick={() => setMode('ai-discount')}>
            <div className="hz-offer-icon">
              <Sparkles size={20} />
            </div>
            <div className="hz-offer-title">AI Discount Strategy</div>
            <div className="hz-offer-desc">
              Get strategic discount recommendations for different fan segments
            </div>
            <div className="hz-offer-badge">
              <Sparkles size={10} /> AI-Powered
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="hz-offers-page" role="main">
      <style>{hzStyles}</style>
      
      <div className="hz-offers-header">
        <button onClick={() => setMode(null)} className="hz-offers-back">
          <ArrowLeft size={16} />
          Back to Options
        </button>
        <h1 className="hz-offers-title">
          {mode === 'manual' && 'Create Offer'}
          {mode === 'ai-pricing' && 'AI Pricing Optimizer'}
          {mode === 'ai-bundle' && 'AI Bundle Creator'}
          {mode === 'ai-discount' && 'AI Discount Strategy'}
        </h1>
      </div>

      {submitError && (
        <div className="mb-4">
          <DashboardErrorState message={submitError} />
        </div>
      )}

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
            void suggestion;
          }}
        />
      )}

      {mode === 'ai-bundle' && (
        <AIBundleCreator 
          onCreateBundle={(bundle) => {
            void bundle;
          }}
        />
      )}

      {mode === 'ai-discount' && (
        <AIDiscountStrategy 
          onApplyDiscount={(discount) => {
            void discount;
          }}
        />
      )}
    </main>
  );
}
