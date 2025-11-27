'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUpsellOpportunities } from '@/hooks/revenue/useUpsellOpportunities';
import { UpsellOpportunity } from '@/components/revenue/upsell/UpsellOpportunity';
import { UpsellAutomationSettings } from '@/components/revenue/upsell/UpsellAutomationSettings';
import { LoadingState } from '@/components/revenue/shared/LoadingState';
import { ErrorBoundary } from '@/components/revenue/shared/ErrorBoundary';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function UpsellsPage() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showSettings, setShowSettings] = useState(false);

  const creatorId = 'creator_123';

  const {
    opportunities,
    isLoading,
    error,
    sendUpsell,
    dismissUpsell,
    isSending,
  } = useUpsellOpportunities({ creatorId });

  const handleSend = async (opportunityId: string) => {
    try {
      await sendUpsell(opportunityId);
      setToastMessage('Upsell sent successfully!');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Failed to send upsell.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleDismiss = async (opportunityId: string) => {
    try {
      await dismissUpsell(opportunityId);
      setToastMessage('Upsell dismissed.');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Failed to dismiss upsell.');
      setToastType('error');
      setShowToast(true);
    }
  };

  if (isLoading) return <div className="py-12"><LoadingState variant="card" count={3} /></div>;
  if (error) return <div className="p-6"><div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"><h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error Loading Upsells</h3><p className="text-red-600 dark:text-red-300 text-sm">{error.message || 'Failed to load upsell opportunities.'}</p></div></div>;

  const stats = opportunities?.stats;
  const items = opportunities?.opportunities || [];

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <Link href="/analytics" className="hover:text-gray-900 dark:hover:text-white">Analytics</Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">Upsells</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Upsell Opportunities</h1>
              <p className="text-gray-600 dark:text-gray-400">AI-powered upsell suggestions to increase revenue</p>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900"
            >
              {showSettings ? 'Hide' : 'Show'} Settings
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Opportunities</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalOpportunities}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expected Revenue</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">${stats.expectedRevenue.toFixed(0)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Buy Rate</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{(stats.averageBuyRate * 100).toFixed(0)}%</p>
            </div>
          </div>
        )}

        {showSettings && (
          <div className="mb-8">
            <UpsellAutomationSettings creatorId={creatorId} />
          </div>
        )}

        <div className="space-y-4">
          {items.map((opportunity) => (
            <UpsellOpportunity
              key={opportunity.id}
              opportunity={opportunity}
              onSend={() => handleSend(opportunity.id)}
              onDismiss={() => handleDismiss(opportunity.id)}
              isSending={isSending}
            />
          ))}
        </div>

        {showToast && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className={`rounded-lg p-4 shadow-lg ${toastType === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
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
