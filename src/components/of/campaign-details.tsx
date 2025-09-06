'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Users, BarChart3, AlertCircle, Clock, Play, Pause, X } from 'lucide-react';
import type { OfMassMessageCampaign, CampaignMetrics } from '@/lib/types/onlyfans';
import { formatDistanceToNow, format } from 'date-fns';

interface CampaignDetailsProps {
  campaignId: string;
  onBack: () => void;
}

export default function CampaignDetails({ campaignId, onBack }: CampaignDetailsProps) {
  const [campaign, setCampaign] = useState<OfMassMessageCampaign | null>(null);
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaignDetails();
  }, [campaignId]);

  const fetchCampaignDetails = async () => {
    try {
      const response = await fetch(`/api/of/campaigns/${campaignId}`);
      const data = await response.json();
      setCampaign(data.campaign);
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Error fetching campaign details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    try {
      const response = await fetch(`/api/of/campaigns/${campaignId}/${action}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        fetchCampaignDetails(); // Refresh
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Campaign action error:', error);
    }
  };

  if (loading || !campaign || !metrics) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
        <div className="animate-pulse">Loading campaign details...</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
      case 'scheduled': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'sending': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'paused': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'completed': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {campaign.name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Created {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {campaign.status === 'draft' && (
              <button
                onClick={() => handleAction('launch')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                Launch Campaign
              </button>
            )}
            {campaign.status === 'sending' && (
              <button
                onClick={() => handleAction('pause')}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause Campaign
              </button>
            )}
            {campaign.status === 'paused' && (
              <button
                onClick={() => handleAction('resume')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                Resume Campaign
              </button>
            )}
            {['draft', 'scheduled', 'paused'].includes(campaign.status) && (
              <button
                onClick={() => handleAction('cancel')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {['sending', 'paused', 'completed'].includes(campaign.status) && (
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {metrics.performance.deliveryRate.toFixed(1)}% delivered
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${metrics.performance.deliveryRate}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">Total Recipients</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {campaign.stats.totalRecipients.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 text-green-600 mb-2">
            <BarChart3 className="w-5 h-5" />
            <span className="text-sm font-medium">Sent</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {campaign.stats.sentCount.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 text-yellow-600 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Queued</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {campaign.stats.queuedCount.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Failed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {campaign.stats.failedCount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Message Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Message Content
        </h3>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
            {campaign.content.text}
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance Metrics
        </h3>
        
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Delivery Rate</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {metrics.performance.deliveryRate.toFixed(1)}%
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Delivery Time</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {metrics.performance.avgDeliveryTime.toFixed(1)}s
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Error Rate</p>
            <p className={`text-2xl font-semibold ${
              metrics.performance.errorRate > 10 ? 'text-red-600' : 'text-green-600'
            }`}>
              {metrics.performance.errorRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Error Details */}
        {metrics.topErrors && metrics.topErrors.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Top Errors
            </h4>
            <div className="space-y-2">
              {metrics.topErrors.map((error, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{error.error}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {error.count} occurrences
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      {campaign.startedAt && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Timeline
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {format(new Date(campaign.createdAt), 'PPp')}
              </span>
            </div>
            
            {campaign.startedAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Started</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {format(new Date(campaign.startedAt), 'PPp')}
                </span>
              </div>
            )}
            
            {campaign.completedAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {format(new Date(campaign.completedAt), 'PPp')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}