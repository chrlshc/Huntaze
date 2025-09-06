'use client';

import { useState, useEffect } from 'react';
import { Plus, Play, Pause, BarChart3, Users, Clock, AlertCircle } from 'lucide-react';
import type { OfMassMessageCampaign } from '@/lib/types/onlyfans';
import CreateCampaignModal from './create-campaign-modal';
import CampaignDetails from './campaign-details';
import { formatDistanceToNow } from 'date-fns';

export default function OfCampaigns() {
  const [campaigns, setCampaigns] = useState<OfMassMessageCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  // Fetch campaigns
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/of/campaigns');
      const data = await response.json();
      setCampaigns(data.campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignAction = async (campaignId: string, action: string) => {
    try {
      const response = await fetch(`/api/of/campaigns/${campaignId}/${action}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        fetchCampaigns(); // Refresh
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Campaign action error:', error);
    }
  };

  if (selectedCampaign) {
    return (
      <CampaignDetails
        campaignId={selectedCampaign}
        onBack={() => setSelectedCampaign(null)}
      />
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
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Mass Message Campaigns
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Send targeted messages to groups of fans
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Campaign
          </button>
        </div>

        {/* Campaigns Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No campaigns yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first mass message campaign to reach multiple fans at once
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Campaign
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedCampaign(campaign.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {campaign.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Created {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {campaign.status === 'draft' && (
                      <button
                        onClick={() => handleCampaignAction(campaign.id, 'launch')}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Launch campaign"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    )}
                    {campaign.status === 'sending' && (
                      <button
                        onClick={() => handleCampaignAction(campaign.id, 'pause')}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                        title="Pause campaign"
                      >
                        <Pause className="w-5 h-5" />
                      </button>
                    )}
                    {campaign.status === 'paused' && (
                      <button
                        onClick={() => handleCampaignAction(campaign.id, 'resume')}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Resume campaign"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Recipients</span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {campaign.stats.totalRecipients}
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-sm">Sent</span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {campaign.stats.sentCount}
                      <span className="text-sm text-gray-500 ml-1">
                        ({campaign.stats.totalRecipients > 0 
                          ? Math.round((campaign.stats.sentCount / campaign.stats.totalRecipients) * 100)
                          : 0}%)
                      </span>
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Failed</span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {campaign.stats.failedCount}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                {campaign.status === 'sending' && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${campaign.stats.totalRecipients > 0 
                            ? (campaign.stats.sentCount / campaign.stats.totalRecipients) * 100 
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <CreateCampaignModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchCampaigns();
          }}
        />
      )}
    </>
  );
}