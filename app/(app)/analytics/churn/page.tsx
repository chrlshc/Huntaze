'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useChurnRisks } from '@/hooks/revenue/useChurnRisks';
import { ChurnRiskList } from '@/components/revenue/churn/ChurnRiskList';
import { LoadingState } from '@/components/revenue/shared/LoadingState';
import { ErrorBoundary } from '@/components/revenue/shared/ErrorBoundary';

export default function ChurnPage() {
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [selectedFans, setSelectedFans] = useState<string[]>([]);

  const creatorId = 'creator_123';

  const {
    churnRisks,
    isLoading,
    error,
    reEngageFan,
    bulkReEngage,
    isReEngaging,
  } = useChurnRisks({
    creatorId,
    riskLevel: selectedRiskLevel === 'all' ? undefined : selectedRiskLevel,
  });

  const handleReEngage = async (fanId: string) => {
    try {
      await reEngageFan({ creatorId, fanId });
      setToastMessage('Re-engagement message sent successfully!');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Failed to send re-engagement message.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleBulkReEngage = async () => {
    if (selectedFans.length === 0) return;
    try {
      await bulkReEngage(selectedFans);
      setToastMessage(`Re-engagement messages sent to ${selectedFans.length} fans!`);
      setToastType('success');
      setShowToast(true);
      setSelectedFans([]);
    } catch (err) {
      setToastMessage('Failed to send bulk re-engagement messages.');
      setToastType('error');
      setShowToast(true);
    }
  };

  if (isLoading) return <div className="py-12"><LoadingState variant="card" count={3} /></div>;
  if (error) return <div className="p-6"><div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"><h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error Loading Churn Data</h3><p className="text-red-600 dark:text-red-300 text-sm">{error.message || 'Failed to load churn risk data.'}</p></div></div>;

  const summary = churnRisks?.summary;
  const fans = churnRisks?.fans || [];

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <Link href="/analytics" className="hover:text-gray-900 dark:hover:text-white">Analytics</Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">Churn Risk</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Churn Risk Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Identify and re-engage fans at risk of churning</p>
        </div>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total At Risk</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{summary.totalAtRisk}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">High Risk</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{summary.highRisk}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Medium Risk</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{summary.mediumRisk}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Low Risk</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{summary.lowRisk}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {(['all', 'high', 'medium', 'low'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setSelectedRiskLevel(level)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedRiskLevel === level
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)} {level !== 'all' && 'Risk'}
              </button>
            ))}
          </div>
          {selectedFans.length > 0 && (
            <button
              onClick={handleBulkReEngage}
              disabled={isReEngaging}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isReEngaging ? 'Sending...' : `Re-engage ${selectedFans.length} Selected`}
            </button>
          )}
        </div>

        <ChurnRiskList
          fans={fans}
          onReEngage={handleReEngage}
          onViewDetails={(fanId: string) => console.log('View details:', fanId)}
        />

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
