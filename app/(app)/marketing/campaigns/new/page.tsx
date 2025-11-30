'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMarketingCampaigns } from '@/hooks/marketing/useMarketingCampaigns';
import { ArrowLeft, Send, Save } from 'lucide-react';
import type { CampaignChannel, CampaignGoal } from '@/lib/types/marketing';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

export default function NewCampaignPage() {
  const router = useRouter();
  const creatorId = 'creator_123';
  const { createCampaign, isCreating } = useMarketingCampaigns({ creatorId });

  const [formData, setFormData] = useState({
    name: '',
    channel: 'dm' as CampaignChannel,
    goal: 'engagement' as CampaignGoal,
    segment: 'all',
    messageBody: '',
    messageSubject: '',
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const segments = [
    { value: 'all', label: 'All Fans', size: 1234 },
    { value: 'new_subscribers', label: 'New Subscribers (Last 7 days)', size: 150 },
    { value: 'vip', label: 'VIP Fans', size: 234 },
    { value: 'active', label: 'Active Fans', size: 567 },
    { value: 'at_risk', label: 'At-Risk Fans', size: 89 },
    { value: 'churned', label: 'Churned Fans', size: 45 },
  ];

  const templates = [
    { id: 'welcome', name: 'Welcome Message', body: 'Hey {{name}}! Thanks for subscribing. I post exclusive content daily...' },
    { id: 'ppv_promo', name: 'PPV Promotion', body: 'Hey {{name}}! I just posted something special for you. Check it out!' },
    { id: 'reengagement', name: 'Re-engagement', body: 'Hey {{name}}! I miss you! Come back and see what you\'ve been missing...' },
    { id: 'custom', name: 'Custom Message', body: '' },
  ];

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault();

    if (!formData.name || !formData.messageBody) {
      setToastMessage('Please fill in all required fields');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      const selectedSegment = segments.find(s => s.value === formData.segment);
      
      await createCampaign({
        creatorId,
        name: formData.name,
        channel: formData.channel,
        goal: formData.goal,
        audience: {
          segment: formData.segment,
          size: selectedSegment?.size || 0,
        },
        message: {
          subject: formData.messageSubject,
          body: formData.messageBody,
        },
      });

      setToastMessage(saveAsDraft ? 'Campaign saved as draft!' : 'Campaign created successfully!');
      setToastType('success');
      setShowToast(true);

      setTimeout(() => {
        router.push('/marketing');
      }, 1500);
    } catch (error) {
      setToastMessage('Failed to create campaign');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({ ...prev, messageBody: template.body }));
    }
  };

  const selectedSegment = segments.find(s => s.value === formData.segment);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/marketing"
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create New Campaign</h1>
        <p className="text-gray-600 dark:text-gray-400">Set up your marketing campaign</p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Campaign Details */}
        <Card className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Welcome New Subscribers"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Channel *
                </label>
                <select
                  value={formData.channel}
                  onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value as CampaignChannel }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="dm">Direct Message</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push Notification</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Goal *
                </label>
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value as CampaignGoal }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="engagement">Engagement</option>
                  <option value="retention">Retention</option>
                  <option value="revenue">Revenue</option>
                  <option value="acquisition">Acquisition</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Audience Selection */}
        <Card className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Audience</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Segment *
            </label>
            <select
              value={formData.segment}
              onChange={(e) => setFormData(prev => ({ ...prev, segment: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {segments.map(segment => (
                <option key={segment.value} value={segment.value}>
                  {segment.label} ({segment.size} people)
                </option>
              ))}
            </select>
            {selectedSegment && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                This campaign will reach {selectedSegment.size} people
              </p>
            )}
          </div>
        </Card>

        {/* Message */}
        <Card className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Message</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template (Optional)
              </label>
              <select
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select a template...</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {formData.channel === 'email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={formData.messageSubject}
                  onChange={(e) => setFormData(prev => ({ ...prev, messageSubject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter email subject..."
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message Body *
              </label>
              <textarea
                value={formData.messageBody}
                onChange={(e) => setFormData(prev => ({ ...prev, messageBody: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={6}
                placeholder="Write your message... Use {{name}} for personalization"
                required
              />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Available variables: {'{'}{'{'} name {'}'}{'}'}
              </p>
            </div>
          </div>
        </Card>

        {/* Preview */}
        {formData.messageBody && (
          <Card className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preview</h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              {formData.channel === 'email' && formData.messageSubject && (
                <p className="font-semibold text-gray-900 dark:text-white mb-2">
                  Subject: {formData.messageSubject}
                </p>
              )}
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {formData.messageBody.replace(/\{\{name\}\}/g, 'John')}
              </p>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/marketing"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </Link>
          <Button 
            variant="ghost" 
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleSubmit(e, true)} 
            disabled={isCreating} 
            type="button"
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save as Draft
          </Button>
          <Button variant="secondary" disabled={isCreating} type="submit" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            {isCreating ? 'Creating...' : 'Create Campaign'}
          </Button>
        </div>
      </form>

      {showToast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`rounded-lg p-4 shadow-lg ${toastType === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
            <div className="flex items-center gap-3">
              <span>{toastMessage}</span>
              <Button variant="primary" onClick={() => setShowToast(false)}>×</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
