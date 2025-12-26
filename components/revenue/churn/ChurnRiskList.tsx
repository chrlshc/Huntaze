'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChurnRiskFan } from '@/lib/services/revenue/types';
import { LoadingState } from '@/components/revenue/shared/LoadingState';
import { EmptyState } from '@/components/revenue/shared/EmptyState';
import { Button } from "@/components/ui/button";

interface ChurnRiskListProps {
  fans: ChurnRiskFan[];
  onReEngage: (fanId: string) => Promise<void>;
  onViewDetails: (fanId: string) => void;
  loading?: boolean;
}

type SortField = 'riskLevel' | 'lifetimeValue' | 'daysSinceLastActivity';
type SortOrder = 'asc' | 'desc';

export function ChurnRiskList({ fans, onReEngage, onViewDetails, loading }: ChurnRiskListProps) {
  const [sortField, setSortField] = useState<SortField>('riskLevel');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [engagingFans, setEngagingFans] = useState<Set<string>>(new Set());

  // Filter fans by risk level
  const filteredFans = fans.filter(fan => {
    if (filterRisk === 'all') return true;
    return fan.riskLevel === filterRisk;
  });

  // Sort fans
  const sortedFans = [...filteredFans].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'riskLevel') {
      const riskOrder = { high: 3, medium: 2, low: 1 };
      comparison = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    } else if (sortField === 'lifetimeValue') {
      comparison = a.lifetimeValue - b.lifetimeValue;
    } else if (sortField === 'daysSinceLastActivity') {
      comparison = a.daysSinceLastActivity - b.daysSinceLastActivity;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleReEngage = async (fanId: string) => {
    setEngagingFans(prev => new Set(prev).add(fanId));
    try {
      await onReEngage(fanId);
    } finally {
      setEngagingFans(prev => {
        const next = new Set(prev);
        next.delete(fanId);
        return next;
      });
    }
  };

  const getRiskColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getRiskBadgeColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
    }
  };

  if (loading) {
    return <LoadingState variant="card" count={3} />;
  }

  if (fans.length === 0) {
    return (
      <EmptyState
        icon="👥"
        title="No fans at risk"
        description="Great news! None of your fans are currently at risk of churning."
      />
    );
  }

  if (sortedFans.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title="No fans match filter"
        description="Try adjusting your filter to see more results."
        action={{
          label: 'Clear filter',
          onClick: () => setFilterRisk('all')
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Risk Level Filter */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="secondary" 
            onClick={() => setFilterRisk('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterRisk === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({fans.length})
          </Button>
          <Button 
            variant="danger" 
            onClick={() => setFilterRisk('high')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterRisk === 'high'
                ? 'bg-red-500 text-white'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            High ({fans.filter(f => f.riskLevel === 'high').length})
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setFilterRisk('medium')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterRisk === 'medium'
                ? 'bg-yellow-500 text-white'
                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            }`}
          >
            Medium ({fans.filter(f => f.riskLevel === 'medium').length})
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setFilterRisk('low')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterRisk === 'low'
                ? 'bg-green-500 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Low ({fans.filter(f => f.riskLevel === 'low').length})
          </Button>
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortField}
            onChange={(e) => handleSort(e.target.value as SortField)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="riskLevel">Risk Level</option>
            <option value="lifetimeValue">Lifetime Value</option>
            <option value="daysSinceLastActivity">Days Inactive</option>
          </select>
        </div>
      </div>

      {/* Fan List */}
      <div className="space-y-3">
        {sortedFans.map((fan) => (
          <div
            key={fan.id}
            className={`border rounded-lg p-4 transition-all hover:shadow-md ${getRiskColor(fan.riskLevel)}`}
          >
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Fan Info */}
              <div className="flex gap-3 items-start flex-1 min-w-0">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {fan.avatar ? (
                    <Image
                      src={fan.avatar}
                      alt={fan.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                      {fan.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{fan.name}</h3>
                    <span className={`inline-block w-2 h-2 rounded-full ${getRiskBadgeColor(fan.riskLevel)}`} />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Churn Risk:</span>
                      <span className="ml-1 font-semibold">
                        {Math.round(fan.churnProbability * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">LTV:</span>
                      <span className="ml-1 font-semibold">
                        ${fan.lifetimeValue.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Inactive:</span>
                      <span className="ml-1 font-semibold">
                        {fan.daysSinceLastActivity} days
                      </span>
                    </div>
                  </div>

                  {fan.lastMessage && (
                    <p className="text-xs text-gray-600 mt-2 truncate">
                      Last: "{fan.lastMessage}"
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                <Button 
                  variant="ghost" 
                  onClick={() => onViewDetails(fan.id)}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Details
                </Button>
                <button
                  onClick={() => handleReEngage(fan.id)}
                  disabled={engagingFans.has(fan.id)}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {engagingFans.has(fan.id) ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Re-engage'
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
