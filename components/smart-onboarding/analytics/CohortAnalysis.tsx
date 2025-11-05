'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  FunnelIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface CohortMetrics {
  cohortId: string;
  cohortName: string;
  description: string;
  userCount: number;
  createdAt: string;
  metrics: {
    completionRate: number;
    averageTime: number;
    engagementScore: number;
    interventionRate: number;
    successRate: number;
    retentionRate: number;
    dropoffPoints: DropoffPoint[];
  };
  trends: {
    completionRateTrend: number;
    engagementTrend: number;
    retentionTrend: number;
  };
  comparison: {
    vsAverage: {
      completionRate: number;
      engagementScore: number;
      interventionRate: number;
    };
  };
}

interface DropoffPoint {
  stepId: string;
  stepName: string;
  dropoffRate: number;
  userCount: number;
}

interface CohortAnalysisProps {
  timeRange?: '7d' | '30d' | '90d';
  onCohortSelect?: (cohort: CohortMetrics) => void;
}

export const CohortAnalysis: React.FC<CohortAnalysisProps> = ({
  timeRange = '30d',
  onCohortSelect
}) => {
  const [cohorts, setCohorts] = useState<CohortMetrics[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<CohortMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'userCount' | 'completionRate' | 'engagementScore'>('userCount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchCohorts();
  }, [timeRange]);

  const fetchCohorts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/smart-onboarding/analytics/cohorts?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setCohorts(data.cohorts);
        if (data.cohorts.length > 0) {
          setSelectedCohort(data.cohorts[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch cohort data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCohortSelect = (cohort: CohortMetrics) => {
    setSelectedCohort(cohort);
    if (onCohortSelect) {
      onCohortSelect(cohort);
    }
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedCohorts = [...cohorts].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (sortBy) {
      case 'userCount':
        aValue = a.userCount;
        bValue = b.userCount;
        break;
      case 'completionRate':
        aValue = a.metrics.completionRate;
        bValue = b.metrics.completionRate;
        break;
      case 'engagementScore':
        aValue = a.metrics.engagementScore;
        bValue = b.metrics.engagementScore;
        break;
      default:
        aValue = a.userCount;
        bValue = b.userCount;
    }

    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const getTrendIcon = (trend: number) => {
    if (Math.abs(trend) < 1) {
      return <MinusIcon className="w-4 h-4 text-gray-500" />;
    }
    return trend > 0 
      ? <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
      : <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
  };

  const getTrendColor = (trend: number) => {
    if (Math.abs(trend) < 1) return 'text-gray-500';
    return trend > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getComparisonColor = (comparison: number) => {
    if (Math.abs(comparison) < 1) return 'text-gray-600';
    return comparison > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getComparisonText = (comparison: number) => {
    if (Math.abs(comparison) < 1) return 'Average';
    const prefix = comparison > 0 ? '+' : '';
    return `${prefix}${comparison.toFixed(1)}% vs avg`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Cohort Analysis</h3>
          <p className="text-gray-600">Performance breakdown by user segments</p>
        </div>
        
        {/* Sort Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value as typeof sortBy)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="userCount">User Count</option>
            <option value="completionRate">Completion Rate</option>
            <option value="engagementScore">Engagement Score</option>
          </select>
        </div>
      </div>

      {/* Cohorts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedCohorts.map((cohort, index) => (
          <motion.div
            key={cohort.cohortId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-2 ${
              selectedCohort?.cohortId === cohort.cohortId
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleCohortSelect(cohort)}
          >
            <div className="p-6">
              {/* Cohort Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <UserGroupIcon className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">{cohort.cohortName}</h4>
                </div>
                <span className="text-sm text-gray-500">
                  {cohort.userCount.toLocaleString()} users
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">{cohort.description}</p>

              {/* Key Metrics */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(cohort.trends.completionRateTrend)}
                    <span className="text-sm font-medium">
                      {cohort.metrics.comple