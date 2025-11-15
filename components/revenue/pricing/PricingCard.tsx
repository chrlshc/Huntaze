/**
 * PricingCard Component
 * 
 * Displays current vs recommended pricing with apply action
 */

'use client';

import React, { useState } from 'react';
import { Spinner } from '../shared/LoadingState';

interface PricingCardProps {
  currentPrice: number;
  recommendedPrice: number;
  revenueImpact: number;
  reasoning: string;
  confidence: number;
  onApply: (newPrice: number) => Promise<void>;
  loading?: boolean;
}

export function PricingCard({
  currentPrice,
  recommendedPrice,
  revenueImpact,
  reasoning,
  confidence,
  onApply,
  loading = false,
}: PricingCardProps) {
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply(recommendedPrice);
    } finally {
      setIsApplying(false);
    }
  };

  const impactColor = revenueImpact > 0 ? 'text-green-600' : 'text-red-600';
  const impactBg = revenueImpact > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Subscription Pricing
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Confidence:</span>
          <div className="flex items-center gap-1">
            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {Math.round(confidence * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Current Price */}
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Price</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            ${currentPrice.toFixed(2)}
          </p>
        </div>

        {/* Recommended Price */}
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">Recommended Price</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            ${recommendedPrice.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Revenue Impact */}
      <div className={`${impactBg} rounded-lg p-4 mb-6`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Expected Revenue Impact
          </span>
          <span className={`text-2xl font-bold ${impactColor}`}>
            {revenueImpact > 0 ? '+' : ''}{revenueImpact}%
          </span>
        </div>
      </div>

      {/* Reasoning */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          <span className="font-medium text-gray-900 dark:text-gray-100">Why this price? </span>
          {reasoning}
        </p>
      </div>

      {/* Apply Button */}
      <button
        onClick={handleApply}
        disabled={isApplying || loading}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isApplying ? (
          <>
            <Spinner size="sm" />
            <span>Applying...</span>
          </>
        ) : (
          <span>Apply Recommended Price</span>
        )}
      </button>

      {/* Mobile Sticky Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10">
        <button
          onClick={handleApply}
          disabled={isApplying || loading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
        >
          {isApplying ? 'Applying...' : `Apply $${recommendedPrice.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
