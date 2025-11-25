/**
 * Marketing Pages Loading State
 * 
 * Displays skeleton screens during page transitions in the marketing section.
 * Provides smooth loading experience with animated placeholders.
 * 
 * Validates: Requirements 6.3
 */

import React from 'react';

/**
 * Marketing page loading skeleton
 * Shows a simplified skeleton that matches the general marketing page structure
 */
export default function MarketingLoading() {
  return (
    <div className="min-h-screen" data-testid="marketing-loading">
      {/* Hero Section Skeleton */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Badge */}
          <div className="flex justify-center">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
          </div>
          
          {/* Title */}
          <div className="space-y-4">
            <div className="h-16 w-3/4 mx-auto bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-16 w-2/3 mx-auto bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
          
          {/* Subtitle */}
          <div className="space-y-3 max-w-3xl mx-auto">
            <div className="h-6 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-6 w-5/6 mx-auto bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          
          {/* CTA Buttons */}
          <div className="flex justify-center gap-4 pt-4">
            <div className="h-12 w-40 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-12 w-40 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </section>

      {/* Content Section Skeleton */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          {/* Section Title */}
          <div className="text-center space-y-4 mb-12">
            <div className="h-10 w-64 mx-auto bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-6 w-96 mx-auto bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          
          {/* Grid of Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4" data-testid={`skeleton-card-${i}`}>
                {/* Icon */}
                <div className="h-12 w-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                {/* Title */}
                <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                {/* Description */}
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                  <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section Skeleton */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="h-12 w-2/3 mx-auto bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-6 w-3/4 mx-auto bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-12 w-48 mx-auto bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
      </section>
    </div>
  );
}
