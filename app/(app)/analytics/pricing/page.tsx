'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePricingRecommendations } from '@/hooks/revenue/usePricingRecommendations';
import { PricingCard } from '@/components/revenue/pricing/PricingCard';
import { PPVPricing } from '@/components/revenue/pricing/PPVPricing';
import { LoadingState } from '@/components/revenue/shared/LoadingState';
import { ErrorBoundary } from '@/components/revenue/shared/ErrorBoundary';
import { SubNavigation } from '@/components/dashboard/SubNavigation';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { useNavigationContext } from '@/hooks/useNavigationContext';
import { getAnalyticsSubNav } from '../analytics-nav';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function PricingPage() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  // Navigation context
  const { breadcrumbs, subNavItems } = useNavigationContext();

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

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState variant="card" count={2} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error Loading Pricing</h3>
          <p className="text-red-600 dark:text-red-300 text-sm">
            {error.message || 'Failed to load pricing recommendations. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--color-text-main)] mb-2">
            Dynamic Pricing
          </h1>
          <p className="text-[var(--color-text-sub)]">
            AI-powered pricing recommendations to maximize your revenue
          </p>
        </div>

        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbs} />

        {/* Sub-Navigation */}
        {subNavItems && <SubNavigation items={subNavItems} />}

        {/* Stats Overview */}
        {recommendations && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Current Subscription
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    ${recommendations.subscription.current.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Recommended Price
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    ${recommendations.subscription.recommended.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Potential Revenue Increase
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    +{recommendations.subscription.revenueImpact.toFixed(0)}%
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Subscription Pricing */}
          {recommendations?.subscription && (
            <PricingCard
              currentPrice={recommendations.subscription.current}
              recommendedPrice={recommendations.subscription.recommended}
              revenueImpact={recommendations.subscription.revenueImpact}
              confidence={recommendations.subscription.confidence}
              reasoning={recommendations.subscription.reasoning}
              onApply={() => handleApplyPricing('subscription', recommendations.subscription.recommended)}
            />
          )}

          {/* PPV Pricing */}
          {recommendations?.ppv && (
            <PPVPricing
              recommendations={recommendations.ppv}
              onApply={(newPrice) => handleApplyPricing('ppv', parseFloat(newPrice))}
            />
          )}
        </div>

        {/* Price History */}
        <Card className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Price Change History
          </h2>
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              No price changes yet
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Your price change history will appear here once you apply recommendations.
            </p>
          </div>
        </Card>

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className={`rounded-lg p-4 shadow-lg ${toastType === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
              <div className="flex items-center gap-3">
                <span>{toastMessage}</span>
                <Button 
                  variant="primary" 
                  onClick={() => setShowToast(false)}
                  className="text-white hover:text-gray-200"
                >
                  ×
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
