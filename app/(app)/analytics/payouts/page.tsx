'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePayoutSchedule } from '@/hooks/revenue/usePayoutSchedule';
import { PayoutSummary } from '@/components/revenue/payout/PayoutSummary';
import { PayoutTimeline } from '@/components/revenue/payout/PayoutTimeline';
import { LoadingState } from '@/components/revenue/shared/LoadingState';
import { ErrorBoundary } from '@/components/revenue/shared/ErrorBoundary';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function PayoutsPage() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [taxRate, setTaxRate] = useState(30);
  const creatorId = 'creator_123';

  const { payouts, isLoading, error, syncPayouts, exportPayouts, updateTaxRate } = usePayoutSchedule({ creatorId });

  const handleSync = async () => {
    try {
      await syncPayouts();
      setToastMessage('Payouts synced successfully!');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Failed to sync payouts.');
      setShowToast(true);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportPayouts();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payouts-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      setToastMessage('Payouts exported successfully!');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Failed to export payouts.');
      setShowToast(true);
    }
  };

  const handleUpdateTaxRate = async () => {
    try {
      await updateTaxRate(taxRate);
      setToastMessage('Tax rate updated successfully!');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Failed to update tax rate.');
      setShowToast(true);
    }
  };

  if (isLoading) return <div className="py-12"><LoadingState variant="card" count={3} /></div>;
  if (error) return <div className="p-6"><div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"><h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error Loading Payouts</h3><p className="text-red-600 dark:text-red-300 text-sm">{error.message || 'Failed to load payout data.'}</p></div></div>;

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <Link href="/analytics" className="hover:text-gray-900 dark:hover:text-white">Analytics</Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">Payouts</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Payout Management</h1>
              <p className="text-gray-600 dark:text-gray-400">Track and manage your payouts across all platforms</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSync} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Sync Payouts</button>
              <button onClick={handleExport} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900">Export</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <PayoutSummary payouts={payouts} />
          </div>
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tax Settings</h3>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tax Rate (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0"
                max="100"
              />
              <button onClick={handleUpdateTaxRate} className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Update Tax Rate</button>
            </div>
          </div>
        </div>

        <PayoutTimeline payouts={payouts} />

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
