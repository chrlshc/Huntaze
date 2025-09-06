'use client';

import { useState } from 'react';
import { X, Users, Filter, Send } from 'lucide-react';
import type { AudienceFilter, AudienceSegment } from '@/lib/types/onlyfans';

interface CreateCampaignModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateCampaignModal({ onClose, onCreated }: CreateCampaignModalProps) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [audienceType, setAudienceType] = useState<'all' | 'segment'>('all');
  const [selectedSegments, setSelectedSegments] = useState<AudienceSegment[]>([]);
  const [creating, setCreating] = useState(false);

  const segments: { id: AudienceSegment; label: string; description: string }[] = [
    { id: 'active_subscribers', label: 'Active Subscribers', description: 'Currently subscribed fans' },
    { id: 'new_subscribers_7d', label: 'New Subscribers', description: 'Joined in last 7 days' },
    { id: 'expired_30d', label: 'Recently Expired', description: 'Expired in last 30 days' },
    { id: 'top_spenders', label: 'Top Spenders', description: 'Top 20% by revenue' },
    { id: 'silent_7d', label: 'Silent Fans', description: 'No interaction in 7 days' },
    { id: 'vip_fans', label: 'VIP Fans', description: 'Marked as VIP' },
  ];

  const handleCreate = async () => {
    if (!name.trim() || !content.trim() || creating) return;

    setCreating(true);
    try {
      const audienceFilter: AudienceFilter = {
        type: audienceType === 'all' ? 'all' : 'segment',
        segments: audienceType === 'segment' ? selectedSegments : undefined
      };

      const response = await fetch('/api/of/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          content: { text: content },
          audienceFilter
        })
      });

      if (response.ok) {
        onCreated();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Create campaign error:', error);
      alert('Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const toggleSegment = (segmentId: AudienceSegment) => {
    setSelectedSegments(prev =>
      prev.includes(segmentId)
        ? prev.filter(s => s !== segmentId)
        : [...prev, segmentId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Create Mass Message Campaign
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Weekend Special Offer"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {content.length}/1000 characters
            </p>
          </div>

          {/* Audience Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Target Audience
            </label>
            
            {/* Audience Type */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setAudienceType('all')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  audienceType === 'all'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <Users className="w-5 h-5 mx-auto mb-1" />
                <span className="block font-medium">All Subscribers</span>
                <span className="block text-sm text-gray-600 dark:text-gray-400">
                  Send to everyone
                </span>
              </button>
              
              <button
                onClick={() => setAudienceType('segment')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  audienceType === 'segment'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <Filter className="w-5 h-5 mx-auto mb-1" />
                <span className="block font-medium">Segments</span>
                <span className="block text-sm text-gray-600 dark:text-gray-400">
                  Target specific groups
                </span>
              </button>
            </div>

            {/* Segment Selection */}
            {audienceType === 'segment' && (
              <div className="space-y-2">
                {segments.map((segment) => (
                  <label
                    key={segment.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSegments.includes(segment.id)}
                      onChange={() => toggleSegment(segment.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {segment.label}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {segment.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Estimated Recipients */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Estimated Recipients
              </span>
              <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {audienceType === 'all' ? '1,250' : 
                 selectedSegments.length === 0 ? '0' :
                 selectedSegments.includes('top_spenders') ? '250' :
                 selectedSegments.includes('new_subscribers_7d') ? '85' :
                 '100'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Messages will be sent with natural delays
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || !content.trim() || creating || (audienceType === 'segment' && selectedSegments.length === 0)}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all ${
                !name.trim() || !content.trim() || creating || (audienceType === 'segment' && selectedSegments.length === 0)
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              <Send className="w-4 h-4" />
              {creating ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}