'use client';

/**
 * OnlyFans Smart Messages Page - Shopify Design Unification
 * 
 * Smart Messages page with Shopify design patterns:
 * - ShopifyPageLayout for consistent structure
 * - AI features overview banner
 * - Auto-reply configuration section
 * - Message templates grid
 * - AI suggestions panel
 * - Automation rules table
 * 
 * Feature: onlyfans-shopify-unification
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  Clock,
  Users,
  TrendingUp,
  Settings,
  Plus,
  Trash2,
} from 'lucide-react';
import { ShopifyPageLayout } from '@/components/layout/ShopifyPageLayout';
import { ShopifyButton } from '@/components/ui/shopify/ShopifyButton';
import { ShopifyCard } from '@/components/ui/shopify/ShopifyCard';
import { ShopifyInput } from '@/components/ui/shopify/ShopifyInput';
import { ShopifyTextarea } from '@/components/ui/shopify/ShopifyTextarea';
import { ShopifyToggle } from '@/components/ui/shopify/ShopifyToggle';
import { ShopifyIndexTable } from '@/components/ui/shopify/ShopifyIndexTable';
import { TemplateCard } from '@/components/onlyfans/TemplateCard';
import { ShopifyEmptyState } from '@/components/ui/shopify/ShopifyEmptyState';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';

// Mock data for demonstration
const mockTemplates = [
  {
    id: '1',
    name: 'Welcome Message',
    content: 'Hey! Thanks for subscribing! 💕 I post daily content and love chatting with my fans.',
    category: 'Welcome',
    usageCount: 245,
  },
  {
    id: '2',
    name: 'Re-engagement',
    content: 'Hey! I noticed you haven\'t been active lately. I have some exclusive content you might like! 🔥',
    category: 'Re-engagement',
    usageCount: 89,
  },
  {
    id: '3',
    name: 'PPV Promotion',
    content: 'Just dropped some 🔥 new content! Check your DMs for an exclusive offer.',
    category: 'Promotion',
    usageCount: 156,
  },
  {
    id: '4',
    name: 'Thank You',
    content: 'Thank you so much for your support! 💖 You\'re amazing!',
    category: 'Appreciation',
    usageCount: 312,
  },
];

const mockAutomationRules = [
  {
    id: '1',
    name: 'Welcome New Subscribers',
    trigger: 'New subscription',
    action: 'Send welcome message',
    status: 'active',
    executions: 1234,
  },
  {
    id: '2',
    name: 'Re-engage Inactive Fans',
    trigger: 'No activity for 7 days',
    action: 'Send re-engagement message',
    status: 'active',
    executions: 456,
  },
  {
    id: '3',
    name: 'VIP Priority',
    trigger: 'High-value fan message',
    action: 'Flag for priority response',
    status: 'active',
    executions: 789,
  },
  {
    id: '4',
    name: 'Auto-reply Off Hours',
    trigger: 'Message received 11pm-8am',
    action: 'Send auto-reply',
    status: 'paused',
    executions: 234,
  },
];

export default function OnlyFansSmartMessagesPage() {
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [autoReplyDelayMinutes, setAutoReplyDelayMinutes] = useState<string>('');
  const [autoReplyMessage, setAutoReplyMessage] = useState<string>('');
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(true);
  const [dismissedRecommendations, setDismissedRecommendations] = useState<string[]>([]);

  if (!ENABLE_MOCK_DATA) {
    return (
      <ShopifyPageLayout
        title="Smart Messages"
        subtitle="Automate and optimize your messaging with AI"
      >
        <ShopifyEmptyState
          title="Smart Messages is not available yet"
          description="Connect OnlyFans and enable messaging to start using Smart Messages."
          action={{ label: 'Go to integrations', onClick: () => (window.location.href = '/integrations') }}
        />
      </ShopifyPageLayout>
    );
  }

  const recommendations = [
    {
      id: 'optimize-response-time',
      icon: Clock,
      title: 'Optimize response time',
      description: "Fans who get replies within 1 hour are 3× more likely to engage.",
      actionLabel: 'Set up auto-replies',
    },
    {
      id: 'reengage-inactive',
      icon: Users,
      title: 'Re-engage inactive fans',
      description: "You have 23 fans inactive for 14+ days—send a quick check-in.",
      actionLabel: 'Create campaign',
    },
    {
      id: 'boost-engagement',
      icon: TrendingUp,
      title: 'Boost engagement',
      description: 'Messages with emojis get ~45% more responses. Update your templates.',
      actionLabel: 'Update templates',
    },
  ].filter((item) => !dismissedRecommendations.includes(item.id));

  return (
    <ShopifyPageLayout
      title="Smart Messages"
      subtitle="Automate and optimize your messaging with AI"
      actions={
	        <ShopifyButton
	          variant="secondary"
	          size="sm"
	          className="whitespace-nowrap"
	          icon={<Plus className="h-4 w-4" />}
	          onClick={() => {}}
	        >
	          New Automation
	        </ShopifyButton>
      }
    >
      {/* AI Features Overview Banner - SaaS Refinements */}
      <div style={{ 
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--of-radius-card, 16px)',
        padding: 'var(--of-space-6, 24px)',
      }} className="bg-[var(--accent-primary-soft)]">
        <div style={{ gap: 'var(--of-space-6, 24px)' }} className="flex items-start justify-between">
          <div className="flex-1">
            <div style={{ fontSize: 'var(--of-text-xs, 11px)', marginBottom: 'var(--of-space-1, 4px)' }} className="uppercase tracking-wide text-[#6B7280] font-semibold">
              AI-POWERED MESSAGING
            </div>
            <h3 style={{ fontSize: 'var(--of-text-lg, 16px)', marginBottom: 'var(--of-space-2, 8px)' }} className="font-semibold text-[#1a1a1a]">
              Automate and optimize your messaging with AI
            </h3>
            <p style={{ fontSize: 'var(--of-text-base, 14px)' }} className="text-[#475569] leading-relaxed">
              Smart Messages uses AI to help you respond faster, engage better, and never miss important conversations. Configure your automation rules below to get started.
            </p>
          </div>
	          <button
	            onClick={() => {}}
	            style={{ fontSize: 'var(--of-text-base, 14px)' }}
	            className="font-medium text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] whitespace-nowrap"
	          >
	            Learn more →
          </button>
        </div>
      </div>

      {/* Auto-Reply Configuration Section - Pixel Perfect Polish */}
      <ShopifyCard padding="none" className="overflow-hidden">
        <div
          style={{ padding: 'var(--of-space-6, 24px)' }}
          className="border-b border-[var(--border-default)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 style={{ fontSize: 'var(--of-text-lg, 16px)' }} className="font-semibold text-[#1a1a1a]">Auto-reply</h3>
              <p style={{ fontSize: 'var(--of-text-base, 14px)', marginTop: 'var(--of-space-1, 4px)' }} className="text-[#6b7177]">
                Automatically respond when you're unavailable
              </p>
            </div>
            <ShopifyToggle
              id="auto-reply-toggle"
              checked={autoReplyEnabled}
              onChange={setAutoReplyEnabled}
              label="Auto-reply"
              hideLabel
            />
          </div>
        </div>

        {autoReplyEnabled && (
          <div
            style={{
              padding: 'var(--of-space-6, 24px)',
              paddingTop: 'var(--of-space-8, 32px)',
              gap: 'var(--of-space-6, 24px)',
            }}
            className="flex flex-col"
          >
            <div>
              <ShopifyInput
                type="number"
                label="Auto-reply delay"
                helpText="Minutes to wait before sending auto-reply"
                placeholder=""
                value={autoReplyDelayMinutes}
                onChange={(e) => setAutoReplyDelayMinutes(e.target.value)}
                suffix={<span className="text-[13px]">min</span>}
              />
            </div>

            <div>
              <ShopifyTextarea
                label="Auto-reply message"
                helpText="Sent to a fan when you're unavailable."
                placeholder=""
                rows={3}
                value={autoReplyMessage}
                onChange={(e) => setAutoReplyMessage(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: 'var(--of-text-base, 14px)', marginBottom: 'var(--of-space-2, 8px)' }} className="block font-medium text-[#1a1a1a]">
                Active between
              </label>
              <div style={{ gap: 'var(--of-gap-sm, 8px)' }} className="grid grid-cols-2">
                <input
                  type="time"
                  style={{ 
                    fontSize: 'var(--of-text-base, 14px)',
                    padding: 'var(--of-input-padding, 8px 12px)',
                    borderRadius: 'var(--of-radius-input, 12px)',
                    height: '40px',
                    border: '1px solid var(--border-default)'
                  }}
                className="focus:outline-none focus-visible:outline-none focus:border-[var(--shopify-border-focus)] focus:ring-1 focus:ring-[var(--shopify-border-focus)]"
                />
                <input
                  type="time"
                  style={{ 
                    fontSize: 'var(--of-text-base, 14px)',
                    padding: 'var(--of-input-padding, 8px 12px)',
                    borderRadius: 'var(--of-radius-input, 12px)',
                    height: '40px',
                    border: '1px solid var(--border-default)'
                  }}
                  className="focus:outline-none focus-visible:outline-none focus:border-[var(--shopify-border-focus)] focus:ring-1 focus:ring-[var(--shopify-border-focus)]"
                />
              </div>
              <p style={{ fontSize: 'var(--of-text-sm, 12px)', marginTop: 'var(--of-space-2, 8px)' }} className="text-[#6b7177]">
                Outside these hours, auto-reply will be sent
              </p>
            </div>

            {/* Collapsible AI Analysis Details */}
            <details className="group" style={{ marginTop: 'var(--of-space-2, 8px)' }}>
              <summary style={{ fontSize: 'var(--of-text-base, 14px)', gap: 'var(--of-space-2, 8px)' }} className="cursor-pointer font-medium text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] list-none flex items-center">
                <span className="transform transition-transform group-open:rotate-90">▶</span>
                Learn what AI analyzes
              </summary>
              <div style={{ marginTop: 'var(--of-space-3, 12px)', padding: 'var(--of-space-5, 20px)', borderRadius: 'var(--of-radius-input, 12px)' }} className="bg-[#f6f6f7]">
                <div style={{ gap: 'var(--of-space-3, 12px)' }} className="flex items-start">
                  <Sparkles className="w-5 h-5 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
                  <ul style={{ fontSize: 'var(--of-text-base, 14px)', gap: 'var(--of-space-1, 4px)' }} className="text-[#6b7177] flex flex-col">
                    <li>• Fan conversation history and preferences</li>
                    <li>• Message sentiment and urgency</li>
                    <li>• Your previous response patterns</li>
                    <li>• Best practices for engagement</li>
                  </ul>
                </div>
              </div>
            </details>
          </div>
        )}
      </ShopifyCard>

      {/* Message Templates Grid - Pixel Perfect Polish */}
      <section>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--of-space-6, 24px)' }}>
          <h3 style={{ fontSize: 'var(--of-text-lg, 16px)' }} className="font-semibold text-[#1a1a1a]">
            Message Templates
          </h3>
	          <ShopifyButton
	            variant="secondary"
	            size="sm"
	            className="whitespace-nowrap"
	            icon={<Plus className="h-4 w-4" />}
	            onClick={() => {}}
	          >
	            New Template
	          </ShopifyButton>
        </div>

        <div style={{ gap: 'var(--of-space-6, 24px)' }} className="grid grid-cols-1 md:grid-cols-2">
          {mockTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              id={template.id}
              category={template.category}
	              title={template.name}
	              preview={template.content}
	              usageCount={template.usageCount}
	              onEdit={() => {}}
	              onDuplicate={() => {}}
	              onDelete={() => {}}
	            />
	          ))}
        </div>
      </section>

      {/* AI Recommendations - Pixel Perfect Polish */}
      <ShopifyCard padding="none" className="overflow-hidden">
        <div
          className="flex items-start justify-between"
          style={{ padding: 'var(--of-space-6, 24px)' }}
        >
          <div style={{ gap: 'var(--of-space-4, 16px)' }} className="flex items-start">
            <div style={{ padding: 'var(--of-space-2, 8px)', borderRadius: 'var(--of-radius-input, 12px)' }} className="bg-[#eef6ff]">
              <Sparkles className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--of-text-lg, 16px)' }} className="font-semibold text-[#1a1a1a]">
                AI Recommendations
              </h3>
              <p style={{ fontSize: 'var(--of-text-base, 14px)', marginTop: 'var(--of-space-1, 4px)' }} className="text-[#6b7177]">
                Based on your messaging patterns and fan engagement
              </p>
            </div>
          </div>
          <ShopifyToggle
            id="ai-suggestions-toggle"
            checked={aiSuggestionsEnabled}
            onChange={setAiSuggestionsEnabled}
            label="AI suggestions"
          />
        </div>

        {!aiSuggestionsEnabled ? (
          <div
            className="text-sm text-[#6b7177]"
            style={{ padding: 'var(--of-space-5, 20px) var(--of-space-6, 24px)' }}
          >
            AI suggestions are turned off.
          </div>
        ) : recommendations.length === 0 ? (
          <div
            className="text-sm text-[#6b7177]"
            style={{ padding: 'var(--of-space-5, 20px) var(--of-space-6, 24px)' }}
          >
            No recommendations right now.
          </div>
        ) : (
          <div style={{ padding: 'var(--of-space-2, 8px)' }}>
            <div className="flex flex-col" style={{ gap: 'var(--of-gap-sm, 8px)' }}>
              {recommendations.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-[var(--input-radius)] hover:bg-[#f6f6f7] transition-colors"
                    style={{
                      padding: 'var(--of-space-4, 16px) var(--of-space-5, 20px)',
                    }}
                  >
                    <div
                      className="w-9 h-9 bg-[#EFF6FF] flex items-center justify-center flex-shrink-0"
                      style={{ borderRadius: 'var(--of-radius-input, 12px)' }}
                    >
                      <Icon className="w-5 h-5 text-[var(--accent-primary)]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-medium text-[#1a1a1a] leading-snug">
                        {item.title}
                      </div>
                      <div className="text-[13px] text-[#6b7177] line-clamp-1">
                        {item.description}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
	                      <ShopifyButton
	                        variant="secondary"
	                        size="sm"
	                        onClick={() => {}}
	                      >
	                        {item.actionLabel}
	                      </ShopifyButton>
                      <ShopifyButton
                        variant="plain"
                        size="sm"
                        className="text-slate-500 hover:text-slate-900"
                        onClick={() => setDismissedRecommendations((prev) => [...prev, item.id])}
                      >
                        Dismiss
                      </ShopifyButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ShopifyCard>

      {/* Automation Rules Table - Pixel Perfect Polish */}
      <ShopifyCard padding="none" className="overflow-hidden">
        <div
          className="flex items-center justify-between border-b border-[var(--border-default)]"
          style={{ padding: 'var(--of-space-6, 24px)' }}
        >
          <h3 style={{ fontSize: 'var(--of-text-lg, 16px)' }} className="font-semibold text-[#1a1a1a]">
            Automation Rules <span className="text-[#6b7177]">({mockAutomationRules.length})</span>
          </h3>
	          <ShopifyButton
	            variant="secondary"
	            size="sm"
	            className="whitespace-nowrap"
	            icon={<Plus className="h-4 w-4" />}
	            onClick={() => {}}
	          >
	            New Rule
	          </ShopifyButton>
        </div>

        <ShopifyIndexTable
	          columns={[
	            { header: 'Rule Name', accessor: 'name', align: 'left' },
	            { header: 'Trigger', accessor: 'trigger', align: 'left' },
	            { header: 'Action', accessor: 'action', align: 'left' },
	            { header: 'Status', accessor: 'status', align: 'center' },
	            { header: 'Executions', accessor: 'executions', align: 'right', numeric: true },
	            { header: 'Actions', accessor: 'actions', align: 'center' },
	          ]}
		          data={mockAutomationRules.map((rule) => ({
		            ...rule,
		            name: <span className="font-medium">{rule.name}</span>,
		            status: rule.status === 'active' ? (
		              <span className="font-medium text-[#008060]">Active</span>
		            ) : (
		              <span className="font-medium text-[#475569]">Paused</span>
		            ),
		            actions: (
		              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
	                  className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-[var(--border-default)] bg-white transition-colors hover:bg-[var(--shopify-bg-surface-hover)] hover:border-[var(--border-emphasis)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--shopify-border-focus)]"
	                  onClick={() => {}}
	                  aria-label="Edit rule"
	                >
                  <Settings className="w-4 h-4 text-[#6b7177]" />
                </button>
                <button
                  type="button"
	                  className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-[var(--border-default)] bg-white transition-colors hover:bg-[var(--shopify-bg-surface-hover)] hover:border-[var(--border-emphasis)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--shopify-border-focus)]"
	                  onClick={() => {}}
	                  aria-label="Delete rule"
	                >
                  <Trash2 className="w-4 h-4 text-[#6b7177]" />
                </button>
              </div>
            ),
          }))}
          embedded
        />
      </ShopifyCard>
    </ShopifyPageLayout>
  );
}
