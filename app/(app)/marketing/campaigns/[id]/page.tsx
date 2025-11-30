'use client';
/**
 * Fetches real-time data from API or database
 * Requires dynamic rendering
 * Requirements: 2.1, 2.2
 */
export const dynamic = 'force-dynamic';


import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Play, Copy, Trash2, TrendingUp, Send, Eye, MousePointer } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const creatorId = 'creator_123';

  const [campaign, setCampaign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLaunching, setIsLaunching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCampaign();
  }, [campaignId]);

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/marketing/campaigns/${campaignId}?creatorId=${creatorId}`);
      if (!response.ok) throw new Error('Failed to fetch campaign');
      const data = await response.json();
      setCampaign(data.campaign);
    } catch (err) {
      setError('Failed to load campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    try {
      const response = await fetch(`/api/marketing/campaigns/${campaignId}/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId }),
      });

      if (!response.ok) throw new Error('Failed to launch campaign');

      setToastMessage('Campaign launched successfully!');
      setShowToast(true);
      await fetchCampaign();
    } catch (err) {
      setToastMessage('Failed to launch campaign');
      setShowToast(true);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleDuplicate = async () => {
    setToastMessage('Duplicate feature coming soon!');
    setShowToast(true);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/marketing/campaigns/${campaignId}?creatorId=${creatorId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete campaign');

      setToastMessage('Campaign deleted successfully!');
      setShowToast(true);
      setTimeout(() => router.push('/marketing'), 1500);
    } catch (err) {
      setToastMessage('Failed to delete campaign');
      setShowToast(true);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error</h3>
          <p className="text-red-600 dark:text-red-300 text-sm">{error || 'Campaign not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <Link
          href="/marketing"
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{campaign.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                campaign.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                campaign.status === 'draft' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
              }`}>
                {campaign.status}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {campaign.channel} • {campaign.goal} • {campaign.audience.size} recipients
            </p>
          </div>

          <div className="flex items-center gap-2">
            {campaign.status === 'draft' && (
              <Button variant="primary" onClick={handleLaunch} disabled={isLaunching}>
  <Play className="w-4 h-4" />
                {isLaunching ? 'Launching...' : 'Launch'}
</Button>
            )}
            <Button variant="ghost" onClick={handleDuplicate}>
  <Copy className="w-4 h-4" />
              Duplicate
</Button>
            <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
  <Trash2 className="w-4 h-4" />
              Delete
</Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {campaign.stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sent</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.stats.sent}</p>
          </Card>

          <Card className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Opened</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.stats.opened}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {(campaign.stats.openRate * 100).toFixed(1)}% rate
            </p>
          </Card>

          <Card className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <MousePointer className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Clicked</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.stats.clicked}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {(campaign.stats.clickRate * 100).toFixed(1)}% rate
            </p>
          </Card>

          <Card className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Converted</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.stats.converted}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {(campaign.stats.conversionRate * 100).toFixed(1)}% rate
            </p>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Details */}
        <Card className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Channel</p>
              <p className="text-gray-900 dark:text-white font-medium">{campaign.channel}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Goal</p>
              <p className="text-gray-900 dark:text-white font-medium">{campaign.goal}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Audience</p>
              <p className="text-gray-900 dark:text-white font-medium">
                {campaign.audience.segment} ({campaign.audience.size} people)
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
              <p className="text-gray-900 dark:text-white font-medium">
                {new Date(campaign.createdAt).toLocaleDateString()}
              </p>
            </div>
            {campaign.launchedAt && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Launched</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {new Date(campaign.launchedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Message */}
        <Card className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Message</h2>
          {campaign.message.subject && (
            <div className="mb-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Subject</p>
              <p className="text-gray-900 dark:text-white font-medium">{campaign.message.subject}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Body</p>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {campaign.message.body}
              </p>
            </div>
          </div>
        </Card>

        {/* Recipients */}
      {campaign.recipients && campaign.recipients.length > 0 && (
        <Card className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recipients</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-700 dark:text-gray-300">Name</th>
                  <th className="text-left py-2 text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-2 text-gray-700 dark:text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody>
                {campaign.recipients.map((recipient: any) => (
                  <tr key={recipient.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 text-gray-900 dark:text-white">{recipient.name}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        recipient.status === 'converted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        recipient.status === 'clicked' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        recipient.status === 'opened' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {recipient.status}
                      </span>
                    </td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">
                      {recipient.openedAt && new Date(recipient.openedAt).toLocaleDateString()}
                      {recipient.clickedAt && new Date(recipient.clickedAt).toLocaleDateString()}
                      {recipient.convertedAt && new Date(recipient.convertedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
    </div>
  );
}
