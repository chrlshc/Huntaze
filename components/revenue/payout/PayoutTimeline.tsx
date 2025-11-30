'use client';

import { useState } from 'react';
import { Payout } from '@/lib/services/revenue/types';
import { Button } from "@/components/ui/button";

interface PayoutTimelineProps {
  payouts: Payout[];
  taxRate: number;
  onExport: () => Promise<void>;
  onUpdateTaxRate: (rate: number) => void;
}

export function PayoutTimeline({
  payouts,
  taxRate,
  onExport,
  onUpdateTaxRate,
}: PayoutTimelineProps) {
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const getPlatformIcon = (platform: 'onlyfans' | 'fansly' | 'patreon') => {
    switch (platform) {
      case 'onlyfans':
        return '💙';
      case 'fansly':
        return '🖤';
      case 'patreon':
        return '❤️';
    }
  };

  const getPlatformColor = (platform: 'onlyfans' | 'fansly' | 'patreon') => {
    switch (platform) {
      case 'onlyfans':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'fansly':
        return 'bg-gray-50 border-gray-300 text-gray-700';
      case 'patreon':
        return 'bg-red-50 border-red-200 text-red-700';
    }
  };

  const getStatusColor = (status: 'pending' | 'processing' | 'completed') => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
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
    return `${days} days`;
  };

  const filteredPayouts = payouts.filter((payout) => {
    if (filterPlatform === 'all') return true;
    return payout.platform === filterPlatform;
  });

  const sortedPayouts = [...filteredPayouts].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport();
    } finally {
      setIsExporting(false);
    }
  };

  const platforms = Array.from(new Set(payouts.map((p) => p.platform)));

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Payout Timeline</h2>
          <p className="text-sm text-gray-600">Upcoming payouts from all platforms</p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isExporting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Exporting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </span>
          )}
        </button>
      </div>

      {/* Platform Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Button 
          variant="secondary" 
          onClick={() => setFilterPlatform('all')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            filterPlatform === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Platforms ({payouts.length})
        </Button>
        {platforms.map((platform) => (
          <Button 
            key={platform}
            variant="secondary" 
            onClick={() => setFilterPlatform(platform)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
              filterPlatform === platform
                ? getPlatformColor(platform).replace('50', '200')
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getPlatformIcon(platform)}
            {platform.charAt(0).toUpperCase() + platform.slice(1)} (
            {payouts.filter((p) => p.platform === platform).length})
          </Button>
        ))}
      </div>

      {/* Timeline */}
      {sortedPayouts.length > 0 ? (
        <div className="space-y-4">
          {sortedPayouts.map((payout) => (
            <div
              key={payout.id}
              className={`border rounded-lg p-4 ${getPlatformColor(payout.platform)}`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Platform & Date */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-3xl">{getPlatformIcon(payout.platform)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {payout.platform}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(payout.status)}`}>
                        {payout.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(payout.date)} • {getDaysUntil(payout.date)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Period: {formatDate(payout.period.start)} - {formatDate(payout.period.end)}
                    </div>
                  </div>
                </div>

                {/* Right: Amount */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    ${payout.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Tax ({Math.round(taxRate * 100)}%): $
                    {(payout.amount * taxRate).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-sm font-semibold text-gray-700 mt-1">
                    Net: $
                    {(payout.amount * (1 - taxRate)).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">No payouts scheduled</p>
        </div>
      )}
    </div>
  );
}
