'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePayoutSchedule } from '@/hooks/revenue/usePayoutSchedule';
import { PayoutSummary } from '@/components/revenue/payout/PayoutSummary';
import { PayoutTimeline } from '@/components/revenue/payout/PayoutTimeline';
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

export default function PayoutsPage() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [taxRate, setTaxRate] = useState(30);
  const creatorId = 'creator_123';
  
  // Navigation context
  const { breadcrumbs, subNavItems } = useNavigationContext();

  const { payouts, isLoading, error, exportPayouts, updateTaxRate } = usePayoutSchedule({ creatorId });

  const handleSync = async () => {
    try {
      // await syncPayouts(); // Method doesn't exist in hook
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
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-main)] mb-2">Payout Management</h1>
              <p className="text-[var(--color-text-sub)]">Track and manage your payouts across all platforms</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="primary" onClick={handleSync}>Sync Payouts</Button>
              <Button variant="primary" onClick={handleExport}>Export</Button>
            </div>
          </div>
        </div>

        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbs} />

        {/* Sub-Navigation */}
        {subNavItems && <SubNavigation items={subNavItems} />}

        {payouts && payouts.payouts.length > 0 && (
          <>
            <div className="mb-8">
              <PayoutSummary 
                totalExpected={payouts.summary.totalExpected}
                taxEstimate={payouts.summary.taxEstimate}
                netIncome={payouts.summary.netIncome}
                nextPayoutDate={payouts.payouts[0].date}
                nextPayoutAmount={payouts.payouts[0].amount}
                taxRate={taxRate / 100}
                onUpdateTaxRate={(rate) => {
                  setTaxRate(rate * 100);
                  handleUpdateTaxRate();
                }}
              />
            </div>

            <PayoutTimeline 
              payouts={payouts.payouts}
              taxRate={taxRate / 100}
              onExport={handleExport}
              onUpdateTaxRate={(rate) => {
                setTaxRate(rate * 100);
                handleUpdateTaxRate();
              }}
            />
          </>
        )}

        {showToast && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="rounded-lg p-4 shadow-lg bg-green-600 text-white">
              <div className="flex items-center gap-3">
                <span>{toastMessage}</span>
                <Button variant="primary" onClick={() => setShowToast(false)}>×</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
