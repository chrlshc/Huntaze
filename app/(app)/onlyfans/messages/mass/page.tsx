'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
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
import { ShopifyBanner, ShopifyButton, ShopifyCard, ShopifyMetricCard, ShopifyMetricGrid } from '@/components/ui/shopify';
import { ShopifyInput } from '@/components/ui/shopify/ShopifyInput';
import { ShopifyTextarea } from '@/components/ui/shopify/ShopifyTextarea';
import { ShopifyToggle } from '@/components/ui/shopify/ShopifyToggle';
import { ShopifyEmptyState } from '@/components/ui/shopify/ShopifyEmptyState';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import { getCsrfToken } from '@/lib/utils/csrf-client';

type MassMessagingTab = 'compose' | 'scheduled' | 'sent';
type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

interface CrmFan {
  id: number;
  name?: string;
  valueCents?: number;
  lastSeenAt?: string;
  createdAt?: string;
  tags?: string[];
}

interface CrmFansResponse {
  fans: CrmFan[];
}

interface AudienceOption {
  id: string;
  name: string;
  count: number;
  description: string;
  color: string;
  recipientIds: number[];
}

interface MessageTemplate {
  id: string;
  name: string;
  text: string;
  category: string;
}

interface ScheduledMessage {
  id: string;
  status: 'scheduled' | 'sent' | 'failed';
  scheduledFor: string;
  message: string;
  audience: string;
  audienceCount: number;
  recurring?: string;
}

interface SentMessage {
  id: string;
  status: 'sent' | 'failed';
  sentAt: string;
  message: string;
  audience: string;
  audienceCount: number;
  delivered: number;
  opened: number;
  replied: number;
}

const fetcher = (url: string) => internalApiFetch<CrmFansResponse>(url);

export default function OnlyFansMassMessagingPage() {
  const [activeTab, setActiveTab] = useState<MassMessagingTab>('compose');
  const [selectedAudience, setSelectedAudience] = useState<string>('all');
  const [messageText, setMessageText] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('daily');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  const { data: fansData, error: fansError, isLoading: fansLoading, mutate: refreshFans } = useSWR(
    '/api/crm/fans',
    fetcher,
  );

  const fans = useMemo(() => fansData?.fans ?? [], [fansData]);
  const totalFans = fans.length;
  const allRecipientIds = useMemo(() => fans.map((fan) => fan.id), [fans]);

  const audiences = useMemo<AudienceOption[]>(() => ([
    {
      id: 'all',
      name: 'All Fans',
      count: totalFans,
      description: 'Send to all your fans',
      color: 'blue',
      recipientIds: allRecipientIds,
    },
    {
      id: 'vip',
      name: 'VIP Fans',
      count: 0,
      description: 'Segment not configured yet',
      color: 'purple',
      recipientIds: [],
    },
    {
      id: 'active',
      name: 'Active Fans',
      count: 0,
      description: 'Segment not configured yet',
      color: 'green',
      recipientIds: [],
    },
    {
      id: 'new',
      name: 'New Subscribers',
      count: 0,
      description: 'Segment not configured yet',
      color: 'yellow',
      recipientIds: [],
    },
    {
      id: 'at-risk',
      name: 'At-Risk Fans',
      count: 0,
      description: 'Segment not configured yet',
      color: 'red',
      recipientIds: [],
    },
    {
      id: 'high-spenders',
      name: 'High Spenders',
      count: 0,
      description: 'Segment not configured yet',
      color: 'orange',
      recipientIds: [],
    },
  ]), [allRecipientIds, totalFans]);

  const scheduledMessages: ScheduledMessage[] = [];
  const sentMessages: SentMessage[] = [];
  const templates: MessageTemplate[] = [];

  const selectedAudienceData = audiences.find((audience) => audience.id === selectedAudience);
  const selectedRecipients = selectedAudienceData?.recipientIds ?? [];
  const totalDelivered = sentMessages.reduce((sum, message) => sum + (message.delivered || 0), 0);
  const totalOpened = sentMessages.reduce((sum, message) => sum + (message.opened || 0), 0);
  const openRate =
    totalDelivered > 0 ? `${Math.round((totalOpened / totalDelivered) * 100)}%` : '--';

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
    setSendError(null);
    setSendSuccess(false);
  };

  const handleSendMessage = async () => {
    if (sending) return;
    setSendError(null);
    setSendSuccess(false);

    if (!selectedAudienceData) {
      setSendError('Select an audience to send to.');
      return;
    }

    if (!messageText.trim()) {
      setSendError('Enter a message before sending.');
      return;
    }

    if (messageText.trim().length > 5000) {
      setSendError('Message is too long. Keep it under 5000 characters.');
      return;
    }

    if (selectedRecipients.length === 0) {
      setSendError('This audience has no recipients yet.');
      return;
    }

    if (selectedRecipients.length > 100) {
      setSendError('Audience size exceeds 100 recipients. Please narrow the segment.');
      return;
    }

    if (scheduleDate && scheduleTime) {
      setSendError('Scheduling is not supported yet. Send the message now instead.');
      return;
    }

    setSending(true);
    try {
      const csrfToken = await getCsrfToken();
      await internalApiFetch('/api/messages/bulk', {
        method: 'POST',
        headers: {
          'x-csrf-token': csrfToken,
        },
        body: {
          recipientIds: selectedRecipients,
          content: messageText.trim(),
          mediaUrls: [],
          campaignName: `Mass message - ${selectedAudienceData.name}`,
          priority: 5,
        },
      });
      clearComposer();
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (fansLoading) {
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
        <ShopifyCard>
          <ShopifyEmptyState
            title="Loading audiences..."
            description="Fetching your fan list for targeting."
            icon={Users}
          />
        </ShopifyCard>
      </ShopifyPageLayout>
    );
  }

  if (fansError) {
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
        <ShopifyCard>
          <ShopifyEmptyState
            title="Failed to load audiences"
            description={fansError instanceof Error ? fansError.message : 'Please try again.'}
            icon={AlertCircle}
            action={{ label: 'Retry', onClick: () => void refreshFans() }}
          />
        </ShopifyCard>
      </ShopifyPageLayout>
    );
  }

  if (totalFans === 0) {
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
        <ShopifyCard>
          <ShopifyEmptyState
            title="No fans yet"
            description="Connect OnlyFans to start building audiences for bulk messaging."
            icon={Users}
            action={{
              label: 'Go to integrations',
              onClick: () => {
                window.location.href = '/integrations';
              },
            }}
          />
        </ShopifyCard>
      </ShopifyPageLayout>
    );
  }

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
        <ShopifyMetricCard label="Total Fans" value={totalFans.toLocaleString()} icon={Users} />
        <ShopifyMetricCard label="Messages Sent" value={totalDelivered.toLocaleString()} icon={Send} />
        <ShopifyMetricCard label="Open Rate" value={openRate} icon={Eye} />
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
                  {templates.length === 0 ? (
                    <div className="col-span-full">
                      <ShopifyEmptyState
                        title="No templates yet"
                        description="Create a template from a successful message."
                        icon={MessageSquare}
                        variant="compact"
                      />
                    </div>
                  ) : (
                    templates.map((template) => (
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
                    ))
                  )}
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
                  {sendError && (
                    <ShopifyBanner
                      status="critical"
                      title="Message not sent"
                      description={sendError}
                      onDismiss={() => setSendError(null)}
                    />
                  )}
                  {sendSuccess && (
                    <ShopifyBanner
                      status="success"
                      title="Message queued"
                      description="Your campaign is queued for delivery."
                      onDismiss={() => setSendSuccess(false)}
                    />
                  )}
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
                      disabled={!messageText.trim() || !selectedAudience || selectedRecipients.length === 0}
                      loading={sending}
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

              {scheduledMessages.length === 0 ? (
                <ShopifyEmptyState
                  title="No scheduled messages"
                  description="Schedule a message to see it here."
                  icon={Calendar}
                  action={{ label: 'Compose message', onClick: () => setActiveTab('compose') }}
                  variant="compact"
                />
              ) : (
                scheduledMessages.map((message) => (
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
                ))
              )}
            </div>
          )}

          {activeTab === 'sent' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-semibold text-[#1a1a1a]">Sent messages</h3>
                <p className="text-sm text-[#6b7177]">{sentMessages.length} messages</p>
              </div>

              {sentMessages.length === 0 ? (
                <ShopifyEmptyState
                  title="No sent messages yet"
                  description="Send a campaign to track delivery performance."
                  icon={Send}
                  action={{ label: 'Compose message', onClick: () => setActiveTab('compose') }}
                  variant="compact"
                />
              ) : (
                sentMessages.map((message) => (
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
                              {message.delivered > 0
                                ? `${((message.opened / message.delivered) * 100).toFixed(1)}%`
                                : '--'}
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
                ))
              )}
            </div>
          )}
        </div>
      </ShopifyCard>
    </ShopifyPageLayout>
  );
}
