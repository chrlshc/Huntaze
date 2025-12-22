'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  MessageSquare,
  Plus,
  Send,
  Users,
} from 'lucide-react';
import { ShopifyPageLayout } from '@/components/layout/ShopifyPageLayout';
import { ShopifyButton, ShopifyCard, ShopifyMetricCard, ShopifyMetricGrid } from '@/components/ui/shopify';
import { ShopifyInput } from '@/components/ui/shopify/ShopifyInput';
import { ShopifyTextarea } from '@/components/ui/shopify/ShopifyTextarea';
import { ShopifyToggle } from '@/components/ui/shopify/ShopifyToggle';
import { ShopifyEmptyState } from '@/components/ui/shopify/ShopifyEmptyState';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';

type MassMessagingTab = 'compose' | 'scheduled' | 'sent';
type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

export default function OnlyFansMassMessagingPage() {
  const [activeTab, setActiveTab] = useState<MassMessagingTab>('compose');
  const [selectedAudience, setSelectedAudience] = useState<string>('all');
  const [messageText, setMessageText] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('daily');

  if (!ENABLE_MOCK_DATA) {
    return (
      <ShopifyPageLayout
        title="Mass messaging"
        subtitle="Send OnlyFans messages to segments of your fanbase."
      >
        <ShopifyEmptyState
          title="Mass messaging is not available yet"
          description="Connect OnlyFans and enable messaging to start creating mass messaging campaigns."
          action={{ label: 'Go to integrations', onClick: () => (window.location.href = '/integrations') }}
        />
      </ShopifyPageLayout>
    );
  }

  // Mock data
  const audiences = [
    { id: 'all', name: 'All Fans', count: 1234, description: 'Send to all your subscribers', color: 'blue' },
    { id: 'vip', name: 'VIP Fans', count: 156, description: 'Your highest spending fans', color: 'purple' },
    { id: 'active', name: 'Active Fans', count: 567, description: 'Fans active in last 7 days', color: 'green' },
    { id: 'new', name: 'New Subscribers', count: 89, description: 'Subscribed in last 30 days', color: 'yellow' },
    { id: 'at-risk', name: 'At-Risk Fans', count: 45, description: "Haven't engaged recently", color: 'red' },
    { id: 'high-spenders', name: 'High Spenders', count: 78, description: 'Top 10% by spending', color: 'orange' },
  ] as const;

  const scheduledMessages = [
    {
      id: 1,
      message: 'Good morning beautiful! Hope you have an amazing day 💕',
      audience: 'All Fans',
      audienceCount: 1234,
      scheduledFor: '2025-11-15T09:00:00',
      recurring: 'daily',
      status: 'scheduled',
    },
    {
      id: 2,
      message: 'Special VIP content coming your way tonight! 🔥',
      audience: 'VIP Fans',
      audienceCount: 156,
      scheduledFor: '2025-11-15T20:00:00',
      recurring: null,
      status: 'scheduled',
    },
    {
      id: 3,
      message: 'Weekend vibes! Check out my latest content 🎉',
      audience: 'Active Fans',
      audienceCount: 567,
      scheduledFor: '2025-11-16T12:00:00',
      recurring: 'weekly',
      status: 'scheduled',
    },
  ] as const;

  const sentMessages = [
    {
      id: 4,
      message: 'Thank you for being such amazing fans! New content dropping soon 🎉',
      audience: 'All Fans',
      audienceCount: 1234,
      sentAt: '2025-11-12T14:30:00',
      delivered: 1198,
      opened: 856,
      replied: 67,
      status: 'sent',
    },
    {
      id: 5,
      message: 'Weekend special just for my VIP members! Check it out 💎',
      audience: 'VIP Fans',
      audienceCount: 156,
      sentAt: '2025-11-10T18:00:00',
      delivered: 154,
      opened: 142,
      replied: 23,
      status: 'sent',
    },
    {
      id: 6,
      message: "We miss you! Come back and see what's new 💕",
      audience: 'At-Risk Fans',
      audienceCount: 45,
      sentAt: '2025-11-08T10:00:00',
      delivered: 43,
      opened: 28,
      replied: 8,
      status: 'sent',
    },
  ] as const;

  const templates = [
    {
      id: 1,
      name: 'Good Morning',
      text: 'Good morning {{name}}! Hope you have an amazing day 💕',
      category: 'greeting',
    },
    {
      id: 2,
      name: 'New Content Alert',
      text: "Hey {{name}}! New exclusive content just dropped! Don't miss out 🔥",
      category: 'promotion',
    },
    {
      id: 3,
      name: 'Thank You',
      text: 'Thank you {{name}} for being such an amazing {{tier}} fan! You mean the world to me ❤️',
      category: 'appreciation',
    },
    {
      id: 4,
      name: 'Weekend Special',
      text: 'Weekend vibes {{name}}! Something special coming your way 🎉',
      category: 'promotion',
    },
    {
      id: 5,
      name: 'Re-engagement',
      text: "Hey {{name}}, we miss you! Come back and see what's new 💕",
      category: 'reengagement',
    },
    {
      id: 6,
      name: 'VIP Exclusive',
      text: "Exclusive content just for you {{name}}! You're one of my VIP fans 💎",
      category: 'vip',
    },
  ] as const;

  const selectedAudienceData = audiences.find((audience) => audience.id === selectedAudience);

  const getAudienceChipClassName = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-[#eff6ff] text-[#1f5199] border-[#bfdbfe]',
      purple: 'bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff]',
      green: 'bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]',
      yellow: 'bg-[#fffbeb] text-[#92400e] border-[#fde68a]',
      red: 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]',
      orange: 'bg-[#fff7ed] text-[#9a3412] border-[#fed7aa]',
    };
    return colors[color] || colors.blue;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4 text-[#b98900]" />;
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-[#008060]" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-[#d72c0d]" />;
      default:
        return <MessageSquare className="w-4 h-4 text-[#6b7177]" />;
    }
  };

  const previewMessage = messageText.replace(/\{\{name\}\}/g, 'Sarah').replace(/\{\{tier\}\}/g, 'VIP');

  const clearComposer = () => {
    setMessageText('');
    setScheduleDate('');
    setScheduleTime('');
    setIsRecurring(false);
    setRecurringFrequency('daily');
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    clearComposer();
  };

  return (
    <ShopifyPageLayout
      title="Mass messaging"
      subtitle="Send OnlyFans messages to segments of your fanbase."
      actions={
        <ShopifyButton
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setActiveTab('compose')}
        >
          New campaign
        </ShopifyButton>
      }
    >
      <ShopifyMetricGrid columns={4}>
        <ShopifyMetricCard label="Total Fans" value="1,234" icon={Users} />
        <ShopifyMetricCard label="Messages Sent" value="2,468" icon={Send} trend={15} trendLabel="this week" />
        <ShopifyMetricCard label="Open Rate" value="72%" icon={Eye} />
        <ShopifyMetricCard label="Scheduled" value={scheduledMessages.length} icon={Clock} />
      </ShopifyMetricGrid>

      <ShopifyCard padding="none" className="overflow-hidden">
        <nav className="flex gap-8 px-6 border-b border-[var(--border-default)]">
          {(['compose', 'scheduled', 'sent'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--shopify-border-focus)] ${
                activeTab === tab
                  ? 'border-[var(--shopify-border-focus)] text-[#1a1a1a]'
                  : 'border-transparent text-[#6b7177] hover:text-[#1a1a1a] hover:border-[var(--border-default)]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'scheduled' && scheduledMessages.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#fffbeb] text-[#92400e] border border-[#fde68a]">
                  {scheduledMessages.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: 'var(--of-space-6, 24px)' }}>
          {activeTab === 'compose' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-[16px] font-semibold text-[#1a1a1a] mb-4">Select audience</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {audiences.map((audience) => {
                    const isActive = selectedAudience === audience.id;
                    return (
                      <button
                        key={audience.id}
                        type="button"
                        onClick={() => setSelectedAudience(audience.id)}
                        className={`p-4 border rounded-2xl text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--shopify-border-focus)] ${
                          isActive
                            ? 'border-[var(--shopify-border-focus)] bg-[var(--shopify-bg-surface-hover)]'
                            : 'border-[var(--border-default)] hover:bg-[var(--shopify-bg-surface-hover)] hover:border-[var(--border-emphasis)]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-[#1a1a1a]">{audience.name}</h4>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold border ${getAudienceChipClassName(
                              audience.color
                            )}`}
                          >
                            {audience.count}
                          </span>
                        </div>
                        <p className="text-sm text-[#6b7177]">{audience.description}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-[16px] font-semibold text-[#1a1a1a] mb-4">Quick templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setMessageText(template.text)}
                      className="p-4 border border-[var(--border-default)] rounded-2xl text-left hover:bg-[var(--shopify-bg-surface-hover)] hover:border-[var(--border-emphasis)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--shopify-border-focus)]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-[#1a1a1a]">{template.name}</h4>
                        <span className="text-xs text-[#6b7177] capitalize">{template.category}</span>
                      </div>
                      <p className="text-sm text-[#6b7177] line-clamp-2">{template.text}</p>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-[#6b7177] mt-3">
                  Use variables:{' '}
                  <code className="px-2 py-1 bg-[#f6f6f7] rounded-xl border border-[var(--border-default)]">
                    {'{{name}}'}
                  </code>
                  ,{' '}
                  <code className="px-2 py-1 bg-[#f6f6f7] rounded-xl border border-[var(--border-default)]">
                    {'{{tier}}'}
                  </code>
                </p>
              </section>

              <section>
                <h3 className="text-[16px] font-semibold text-[#1a1a1a] mb-4">Compose message</h3>
                <div className="space-y-4">
                  <div>
                    <ShopifyTextarea
                      label="Message"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={4}
                      placeholder="Write your message here... Use {{name}} and {{tier}} for personalization"
                    />
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <p className="text-[#6b7177]">{messageText.length}/1000 characters</p>
                      {messageText.includes('{{') && <p className="text-[#2c6ecb]">Variables detected</p>}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--border-default)] bg-[#fafbfb] p-5">
                    <h4 className="font-medium text-[#1a1a1a] mb-4">Schedule options</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ShopifyInput
                        type="date"
                        label="Date (optional)"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                      />
                      <ShopifyInput
                        type="time"
                        label="Time (optional)"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </div>

                    {scheduleDate && scheduleTime && (
                      <div className="mt-5 space-y-4">
                        <ShopifyToggle
                          id="mass-messaging-recurring"
                          checked={isRecurring}
                          onChange={setIsRecurring}
                          label="Make this recurring"
                          description="Automatically resend on a schedule"
                        />

                        {isRecurring && (
                          <div>
                            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Frequency</label>
                            <select
                              value={recurringFrequency}
                              onChange={(e) => setRecurringFrequency(e.target.value as RecurringFrequency)}
                              className={[
                                'w-full h-10 px-4 rounded-xl',
                                'text-sm text-[#1a1a1a]',
                                'bg-white border border-[var(--border-default)] transition-colors duration-200',
                                'hover:border-[var(--border-emphasis)]',
                                'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#2c6ecb] focus:border-[#2c6ecb]',
                              ].join(' ')}
                            >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedAudienceData && messageText && (
                    <div className="rounded-2xl border border-[var(--border-default)] bg-[#fafbfb] p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-[#1a1a1a] flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Preview
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold border ${getAudienceChipClassName(
                            selectedAudienceData.color
                          )}`}
                        >
                          {selectedAudienceData.count} recipients
                        </span>
                      </div>
                      <p className="text-sm text-[#6b7177] mb-2">
                        Sending to: <span className="font-medium text-[#1a1a1a]">{selectedAudienceData.name}</span>
                      </p>
                      {scheduleDate && scheduleTime && (
                        <p className="text-sm text-[#6b7177] mb-3">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Scheduled for: {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}
                          {isRecurring && (
                            <span className="ml-2 text-[#92400e]">({recurringFrequency})</span>
                          )}
                        </p>
                      )}
                      <div className="bg-white rounded-xl p-4 border border-[var(--border-default)]">
                        <p className="text-[#1a1a1a] whitespace-pre-wrap">{previewMessage}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <ShopifyButton variant="ghost" onClick={clearComposer}>
                      Clear
                    </ShopifyButton>
                    <ShopifyButton
                      variant="primary"
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || !selectedAudience}
                      icon={<Send className="w-4 h-4" />}
                    >
                      {scheduleDate && scheduleTime ? 'Schedule message' : 'Send now'}
                    </ShopifyButton>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'scheduled' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-semibold text-[#1a1a1a]">Scheduled messages</h3>
                <p className="text-sm text-[#6b7177]">{scheduledMessages.length} messages</p>
              </div>

              {scheduledMessages.map((message) => (
                <div
                  key={message.id}
                  className="p-5 border border-[var(--border-default)] rounded-2xl hover:bg-[var(--shopify-bg-surface-hover)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(message.status)}
                        <span className="text-sm font-medium text-[#6b7177]">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {new Date(message.scheduledFor).toLocaleString()}
                        </span>
                        {message.recurring && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#fffbeb] text-[#92400e] border border-[#fde68a]">
                            {message.recurring}
                          </span>
                        )}
                      </div>
                      <p className="text-[#1a1a1a] mb-2">{message.message}</p>
                      <p className="text-sm text-[#6b7177]">
                        To: <span className="font-medium text-[#1a1a1a]">{message.audience}</span> (
                        {message.audienceCount} fans)
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <ShopifyButton variant="ghost" size="sm" onClick={() => console.log('Edit scheduled', message.id)}>
                        Edit
                      </ShopifyButton>
                      <ShopifyButton
                        variant="destructive"
                        size="sm"
                        onClick={() => console.log('Cancel scheduled', message.id)}
                      >
                        Cancel
                      </ShopifyButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'sent' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-semibold text-[#1a1a1a]">Sent messages</h3>
                <p className="text-sm text-[#6b7177]">{sentMessages.length} messages</p>
              </div>

              {sentMessages.map((message) => (
                <div
                  key={message.id}
                  className="p-5 border border-[var(--border-default)] rounded-2xl hover:bg-[var(--shopify-bg-surface-hover)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(message.status)}
                        <span className="text-sm font-medium text-[#6b7177]">
                          Sent {new Date(message.sentAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[#1a1a1a] mb-2">{message.message}</p>
                      <p className="text-sm text-[#6b7177] mb-3">
                        To: <span className="font-medium text-[#1a1a1a]">{message.audience}</span> (
                        {message.audienceCount} fans)
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-[#6b7177]">
                        <div>
                          <span className="font-semibold text-[#1a1a1a]">{message.delivered}</span> delivered
                        </div>
                        <div>
                          <span className="font-semibold text-[#1a1a1a]">{message.opened}</span> opened
                        </div>
                        <div>
                          <span className="font-semibold text-[#1a1a1a]">{message.replied}</span> replied
                        </div>
                        <div>
                          <span className="font-semibold text-[#008060]">
                            {((message.opened / message.delivered) * 100).toFixed(1)}%
                          </span>{' '}
                          open rate
                        </div>
                      </div>
                    </div>

                    <ShopifyButton variant="ghost" size="sm" onClick={() => console.log('View sent', message.id)}>
                      View details
                    </ShopifyButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ShopifyCard>
    </ShopifyPageLayout>
  );
}
