/**
 * PPVPricing Component
 */

'use client';

import React, { useState } from 'react';
import type { PPVPricingRecommendation } from '@/lib/services/revenue/types';

interface PPVPricingProps {
  recommendations: PPVPricingRecommendation[];
  onApply: (contentId: string, price: number) => Promise<void>;
}

export function PPVPricing({ recommendations, onApply }: PPVPricingProps) {
  const [selectedPrices, setSelectedPrices] = useState<Record<string, number>>({});
  const [applying, setApplying] = useState<string | null>(null);

  const handlePriceChange = (contentId: string, price: number) => {
    setSelectedPrices((prev) => ({ ...prev, [contentId]: price }));
  };

  const handleApply = async (contentId: string) => {
    const price = selectedPrices[contentId];
    if (!price) return;

    setApplying(contentId);
    try {
      await onApply(contentId, price);
    } finally {
      setApplying(null);
    }
  };

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
        No PPV pricing recommendations available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec) => {
        const midPrice = (rec.recommendedRange.min + rec.recommendedRange.max) / 2;
        const selectedPrice = selectedPrices[rec.contentId] || midPrice;

        return (
          <div
            key={rec.contentId}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {rec.contentType.charAt(0).toUpperCase() + rec.contentType.slice(1)} Content
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Expected: ${rec.expectedRevenue.min} - ${rec.expectedRevenue.max}
                </p>
              </div>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                {rec.contentType}
              </span>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price: ${selectedPrice.toFixed(2)}
              </label>
              <input
                type="range"
                min={rec.recommendedRange.min}
                max={rec.recommendedRange.max}
                step="0.50"
                value={selectedPrice}
                onChange={(e) => handlePriceChange(rec.contentId, parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                <span>${rec.recommendedRange.min}</span>
                <span>${rec.recommendedRange.max}</span>
              </div>
            </div>

            <button
              onClick={() => handleApply(rec.contentId)}
              disabled={applying === rec.contentId}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {applying === rec.contentId ? 'Applying...' : 'Apply Price'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
