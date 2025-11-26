'use client';

import { useState, lazy, Suspense } from 'react';
import Link from 'next/link';
import { useRevenueForecast } from '@/hooks/revenue/useRevenueForecast';
import { MonthProgress } from '@/components/revenue/forecast/MonthProgress';
import { GoalAchievement } from '@/components/revenue/forecast/GoalAchievement';
import { LoadingState } from '@/components/revenue/shared/LoadingState';
import { ErrorBoundary } from '@/components/revenue/shared/ErrorBoundary';
import { LazyLoadErrorBoundary } from '@/components/dashboard/LazyLoadErrorBoundary';

// Lazy load heavy chart component (uses Recharts library) to reduce initial bundle size
const RevenueForecastChart = lazy(() => import('@/components/revenue/forecast/RevenueForecastChart').then(mod => ({ default: mod.RevenueForecastChart })));

export default function ForecastPage() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const creatorId = 'creator_123';

  const { forecast, isLoading, error, setGoal, runScenario } = useRevenueForecast({ creatorId });

  const handleSetGoal = async (amount: number) => {
    try {
      await setGoal(amount);
      setToastMessage('Goal updated successfully!');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Failed to update goal.');
      setShowToast(true);
    }
  };

  if (isLoading) return <div className="py-12"><LoadingState variant="card" count={3} /></div>;
  if (error) return <div className="p-6"><div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"><h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error Loading Forecast</h3><p className="text-red-600 dark:text-red-300 text-sm">{error.message || 'Failed to load forecast data.'}</p></div></div>;

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <Link href="/analytics" className="hover:text-gray-900 dark:hover:text-white">Analytics</Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">Forecast</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Revenue Forecast</h1>
          <p className="text-gray-600 dark:text-gray-400">Predict and plan your future revenue</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <MonthProgress forecast={forecast} />
          <GoalAchievement forecast={forecast} onSetGoal={handleSetGoal} />
        </div>

        <div className="mb-8">
          <LazyLoadErrorBoundary>
            <Suspense fallback={
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-[400px] bg-gray-200 rounded"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 bg-gray-200 rounded"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            }>
              <RevenueForecastChart forecast={forecast} />
            </Suspense>
          </LazyLoadErrorBoundary>
        </div>

        {showToast && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="rounded-lg p-4 shadow-lg bg-green-600 text-white">
              <div className="flex items-center gap-3">
                <span>{toastMessage}</span>
                <button onClick={() => setShowToast(false)} className="text-white hover:text-gray-200">×</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
