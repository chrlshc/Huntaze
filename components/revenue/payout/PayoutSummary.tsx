'use client';

import { useState } from 'react';

interface PayoutSummaryProps {
  totalExpected: number;
  taxEstimate: number;
  netIncome: number;
  nextPayoutDate: Date;
  nextPayoutAmount: number;
  taxRate: number;
  onUpdateTaxRate: (rate: number) => void;
}

export function PayoutSummary({
  totalExpected,
  taxEstimate,
  netIncome,
  nextPayoutDate,
  nextPayoutAmount,
  taxRate,
  onUpdateTaxRate,
}: PayoutSummaryProps) {
  const [isEditingTaxRate, setIsEditingTaxRate] = useState(false);
  const [tempTaxRate, setTempTaxRate] = useState(taxRate * 100);

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntil = (date: Date) => {
    const days = Math.ceil(
      (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `in ${days} days`;
  };

  const handleSaveTaxRate = () => {
    onUpdateTaxRate(tempTaxRate / 100);
    setIsEditingTaxRate(false);
  };

  const handleCancelTaxRate = () => {
    setTempTaxRate(taxRate * 100);
    setIsEditingTaxRate(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Payout Summary</h2>
        <p className="text-sm text-gray-600">Overview of expected payouts and taxes</p>
      </div>

      {/* Next Payout Highlight */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-sm font-medium text-blue-900">Next Payout</h3>
        </div>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-bold text-blue-900">
              {formatCurrency(nextPayoutAmount)}
            </div>
            <div className="text-sm text-blue-700 mt-1">
              {formatDate(nextPayoutDate)} • {getDaysUntil(nextPayoutDate)}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4 mb-6">
        {/* Total Expected */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-600 mb-1">Total Expected</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalExpected)}
            </div>
          </div>
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Tax Estimate */}
        <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-orange-600">Estimated Tax</div>
              {!isEditingTaxRate && (
                <button
                  onClick={() => setIsEditingTaxRate(true)}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  Adjust Rate
                </button>
              )}
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {formatCurrency(taxEstimate)}
            </div>
            {isEditingTaxRate ? (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={tempTaxRate}
                  onChange={(e) => setTempTaxRate(Number(e.target.value))}
                  className="flex-1 h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-semibold text-orange-900 w-12">
                  {tempTaxRate}%
                </span>
              </div>
            ) : (
              <div className="text-sm text-orange-700 mt-1">
                Tax rate: {Math.round(taxRate * 100)}%
              </div>
            )}
            {isEditingTaxRate && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveTaxRate}
                  className="px-3 py-1 text-xs font-medium text-white bg-orange-600 rounded hover:bg-orange-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelTaxRate}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <svg className="w-8 h-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Net Income */}
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
          <div>
            <div className="text-sm text-green-600 mb-1">Net Income (After Tax)</div>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(netIncome)}
            </div>
            <div className="text-sm text-green-700 mt-1">
              {Math.round((netIncome / totalExpected) * 100)}% of total
            </div>
          </div>
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex gap-2">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Tax estimates are for planning purposes only</p>
            <p className="text-blue-700">
              Consult with a tax professional for accurate tax calculations. Export your payout data for your accountant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
