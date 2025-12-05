'use client';

/**
 * Analytics Pricing Page
 * 
 * Displays current vs recommended pricing with projected revenue impact.
 * Uses PageLayout for consistent structure.
 * 
 * Feature: dashboard-ux-overhaul
 * Requirements: 4.5, 3.6.1, 3.6.2
 */

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { usePricingRecommendations } from '@/hooks/revenue/usePricingRecommendations';
import { PricingCard } from '@/components/revenue/pricing/PricingCard';
import { PPVPricing } from '@/components/revenue/pricing/PPVPricing';
import { LoadingState } from '@/components/revenue/shared/LoadingState';
import { ErrorBoundary } from '@/components/revenue/shared/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3,
  Sparkles,
  History,
  ArrowRight
} from 'lucide-react';

export default function PricingPage() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // TODO: Get creatorId from session
  const creatorId = 'creator_123';

  const {
    recommendations,
    isLoading,
    error,
    applyPricing,
    isApplying,
  } = usePricingRecommendations({ creatorId });

  const handleApplyPricing = async (priceType: 'subscription' | 'ppv', newPrice: number) => {
    try {
      await applyPricing({
        creatorId,
        priceType,
        newPrice,
      });

      setToastMessage(`${priceType === 'subscription' ? 'Subscription' : 'PPV'} price updated successfully!`);
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Failed to update pricing. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (isLoading) {
    return (
      <PageLayout
        title="Dynamic Pricing"
        subtitle="Loading pricing recommendations..."
        breadcrumbs={[
          { label: 'Analytics', href: '/analytics' },
          { label: 'Pricing' }
        ]}
      >
        <div className="py-12">
          <LoadingState variant="card" count={2} />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout
        title="Dynamic Pricing"
        subtitle="AI-powered pricing recommendations to maximize your revenue"
        breadcrumbs={[
          { label: 'Analytics', href: '/analytics' },
          { label: 'Pricing' }
        ]}
      >
        <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error Loading Pricing</h3>
          <p className="text-red-600 dark:text-red-300 text-sm">
            {error.message || 'Failed to load pricing recommendations. Please try again.'}
          </p>
        </Card>
      </PageLayout>
    );
  }


  return (
    <ErrorBoundary>
      <PageLayout
        title="Dynamic Pricing"
        subtitle="AI-powered pricing recommendations to maximize your revenue"
        breadcrumbs={[
          { label: 'Analytics', href: '/analytics' },
          { label: 'Pricing' }
        ]}
      >
        {/* Stats Overview */}
        {recommendations && (
          <section className="mb-8" data-testid="pricing-overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Current Subscription */}
              <Card className="p-6" data-testid="pricing-current">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--color-text-sub)]">Current Subscription</span>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div 
                  className="text-2xl font-bold text-[var(--color-text-main)]" 
                  data-testid="pricing-current-value"
                >
                  {formatCurrency(recommendations.subscription.current)}
                </div>
                <p className="text-sm text-[var(--color-text-sub)] mt-1">per month</p>
              </Card>

              {/* Recommended Price */}
              <Card className="p-6" data-testid="pricing-recommended">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--color-text-sub)]">AI Recommended</span>
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div 
                  className="text-2xl font-bold text-[var(--color-text-main)]" 
                  data-testid="pricing-recommended-value"
                >
                  {formatCurrency(recommendations.subscription.recommended)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowRight className="h-3 w-3 text-green-600" />
                  <span className="text-sm text-green-600">
                    {recommendations.subscription.recommended > recommendations.subscription.current ? '+' : ''}
                    {formatCurrency(recommendations.subscription.recommended - recommendations.subscription.current)}
                  </span>
                </div>
              </Card>

              {/* Potential Revenue Increase */}
              <Card className="p-6" data-testid="pricing-impact">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--color-text-sub)]">Potential Revenue Increase</span>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div 
                  className="text-2xl font-bold text-green-600 dark:text-green-400" 
                  data-testid="pricing-impact-value"
                  data-impact-percent={recommendations.subscription.revenueImpact}
                >
                  +{recommendations.subscription.revenueImpact.toFixed(0)}%
                </div>
                <p className="text-sm text-[var(--color-text-sub)] mt-1">estimated monthly</p>
              </Card>
            </div>
          </section>
        )}

        {/* AI Recommendation Banner */}
        <section className="mb-6">
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-main)] mb-1">AI Pricing Analysis</h3>
                <p className="text-sm text-[var(--color-text-sub)]">
                  Our AI analyzes your audience demographics, engagement patterns, and market trends 
                  to suggest optimal pricing that maximizes revenue while maintaining subscriber retention.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Pricing Cards */}
        <section className="mb-8" data-testid="pricing-cards">
          <h2 className="text-lg font-semibold text-[var(--color-text-main)] mb-4">Pricing Recommendations</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subscription Pricing */}
            {recommendations?.subscription && (
              <div data-testid="subscription-pricing-card">
                <PricingCard
                  currentPrice={recommendations.subscription.current}
                  recommendedPrice={recommendations.subscription.recommended}
                  revenueImpact={recommendations.subscription.revenueImpact}
                  confidence={recommendations.subscription.confidence}
                  reasoning={recommendations.subscription.reasoning}
                  onApply={() => handleApplyPricing('subscription', recommendations.subscription.recommended)}
                />
              </div>
            )}

            {/* PPV Pricing */}
            {recommendations?.ppv && (
              <div data-testid="ppv-pricing-card">
                <PPVPricing
                  recommendations={recommendations.ppv}
                  onApply={(newPrice) => handleApplyPricing('ppv', parseFloat(newPrice))}
                />
              </div>
            )}
          </div>
        </section>

        {/* Price History */}
        <section data-testid="pricing-history">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-[var(--color-text-sub)]" />
              <h2 className="text-lg font-semibold text-[var(--color-text-main)]">Price Change History</h2>
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-12 w-12 text-[var(--color-text-muted)] mb-4" />
              <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-2">No price changes yet</h3>
              <p className="text-[var(--color-text-sub)] max-w-md">
                Your price change history will appear here once you apply recommendations.
              </p>
            </div>
          </Card>
        </section>

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className={`rounded-lg p-4 shadow-lg ${
              toastType === 'success' ? 'bg-green-600' : 'bg-red-600'
            } text-white`}>
              <div className="flex items-center gap-3">
                <span>{toastMessage}</span>
                <button 
                  onClick={() => setShowToast(false)}
                  className="text-white hover:text-gray-200 font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}
      </PageLayout>
    </ErrorBoundary>
  );
}
