'use client';

import { useState } from 'react';
import {
  CheckCircle,
  Copy,
  Edit,
  Eye,
  MessageCircle,
  Pause,
  Play,
  Plus,
  Send,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { ShopifyPageLayout } from '@/components/layout/ShopifyPageLayout';
import {
  ShopifyButton,
  ShopifyCard,
  ShopifyEmptyState,
  ShopifyMetricCard,
  ShopifyMetricGrid,
} from '@/components/ui/shopify';
import { ShopifyInput } from '@/components/ui/shopify/ShopifyInput';
import { ShopifyTextarea } from '@/components/ui/shopify/ShopifyTextarea';
import { ShopifyToggle } from '@/components/ui/shopify/ShopifyToggle';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';

interface WelcomeTemplate {
  id: number;
  name: string;
  message: string;
  isActive: boolean;
  delay: number;
  delayUnit: 'minutes' | 'hours' | 'days';
  sentCount: number;
  openRate: number;
  replyRate: number;
  createdAt: string;
  lastModified: string;
}

export default function OnlyFansWelcomeMessagesPage() {
  if (!ENABLE_MOCK_DATA) {
    return (
      <ShopifyPageLayout
        title="Welcome Messages"
        subtitle="Automate your new subscriber onboarding"
      >
        <ShopifyEmptyState
          title="Welcome messages aren’t configured yet"
          description="This screen currently uses demo data and is disabled outside demo mode."
        />
      </ShopifyPageLayout>
    );
  }

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WelcomeTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<WelcomeTemplate | null>(null);

  const [templates, setTemplates] = useState<WelcomeTemplate[]>([
    {
      id: 1,
      name: 'Immediate Welcome',
      message:
        "Hey {{name}}! 👋 Welcome to my page! I'm so excited to have you here. Feel free to message me anytime - I love chatting with my fans! 💕",
      isActive: true,
      delay: 0,
      delayUnit: 'minutes',
      sentCount: 1234,
      openRate: 89,
      replyRate: 34,
      createdAt: '2025-10-01',
      lastModified: '2025-11-10',
    },
    {
      id: 2,
      name: '24 Hour Follow-up',
      message:
        "Hi {{name}}! Just wanted to check in and see how you're enjoying the content so far 😊 Let me know if there's anything specific you'd like to see! 🔥",
      isActive: true,
      delay: 24,
      delayUnit: 'hours',
      sentCount: 1156,
      openRate: 76,
      replyRate: 28,
      createdAt: '2025-10-01',
      lastModified: '2025-11-08',
    },
    {
      id: 3,
      name: 'Week 1 Check-in',
      message:
        "Hey {{name}}! 💕 You've been here for a week now! Thank you so much for your support. I have some exclusive content coming soon just for loyal fans like you! 🎉",
      isActive: true,
      delay: 7,
      delayUnit: 'days',
      sentCount: 987,
      openRate: 82,
      replyRate: 31,
      createdAt: '2025-10-05',
      lastModified: '2025-11-05',
    },
    {
      id: 4,
      name: 'VIP Upgrade Offer',
      message:
        "Hi {{name}}! I noticed you've been really engaged with my content 😍 Would you be interested in joining my VIP tier? You'll get exclusive content and priority messaging! 💎",
      isActive: false,
      delay: 14,
      delayUnit: 'days',
      sentCount: 456,
      openRate: 68,
      replyRate: 22,
      createdAt: '2025-10-15',
      lastModified: '2025-10-20',
    },
  ]);

  const [automationEnabled, setAutomationEnabled] = useState(true);

  const handleToggleTemplate = (id: number) => {
    setTemplates((current) =>
      current.map((template) =>
        template.id === id ? { ...template, isActive: !template.isActive } : template
      )
    );
  };

  const handleDeleteTemplate = (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    setTemplates((current) => current.filter((template) => template.id !== id));
  };

  const handleDuplicateTemplate = (template: WelcomeTemplate) => {
    const nextId = Math.max(...templates.map((t) => t.id)) + 1;
    const today = new Date().toISOString().split('T')[0];

    const newTemplate: WelcomeTemplate = {
      ...template,
      id: nextId,
      name: `${template.name} (Copy)`,
      isActive: false,
      sentCount: 0,
      openRate: 0,
      replyRate: 0,
      createdAt: today,
      lastModified: today,
    };

    setTemplates((current) => [...current, newTemplate]);
  };

  const handleTestSend = (template: WelcomeTemplate) => {
    void template;
    alert('Test message sent to your account!');
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setEditingTemplate(null);
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setSelectedTemplate(null);
  };

  const totalSent = templates.reduce((sum, t) => sum + t.sentCount, 0);
  const avgOpenRate = templates.length > 0 ? templates.reduce((sum, t) => sum + t.openRate, 0) / templates.length : 0;
  const avgReplyRate = templates.length > 0 ? templates.reduce((sum, t) => sum + t.replyRate, 0) / templates.length : 0;
  const activeTemplates = templates.filter((t) => t.isActive).length;

  const getDelayText = (delay: number, unit: string) => {
    if (delay === 0) return 'Immediately';
    return `${delay} ${unit}`;
  };

  const iconButtonBase =
    [
      'p-2 rounded-xl',
      'border border-[var(--border-default)] bg-white text-[#202223]',
      'transition-colors hover:bg-[var(--shopify-bg-surface-hover)] hover:border-[var(--border-emphasis)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--shopify-border-focus)]',
    ].join(' ');
  const iconButtonDanger =
    [
      'p-2 rounded-xl',
      'border border-[#fbc3c0] bg-[#fef1f1] text-[#d72c0d]',
      'transition-colors hover:brightness-95',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-error)]',
    ].join(' ');

  return (
    <>
      <ShopifyPageLayout
        title="Welcome Messages"
        subtitle="Automate your new subscriber onboarding"
        actions={
          <ShopifyButton
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Template
          </ShopifyButton>
        }
      >
        <ShopifyMetricGrid columns={4}>
          <ShopifyMetricCard label="Total Sent" value={totalSent.toLocaleString()} icon={MessageCircle} />
          <ShopifyMetricCard
            label="Avg Open Rate"
            value={`${avgOpenRate.toFixed(1)}%`}
            icon={Eye}
            trend={5}
            trendLabel="vs last month"
          />
          <ShopifyMetricCard
            label="Avg Reply Rate"
            value={`${avgReplyRate.toFixed(1)}%`}
            icon={TrendingUp}
          />
          <ShopifyMetricCard
            label="Active Templates"
            value={`${activeTemplates}/${templates.length}`}
            icon={CheckCircle}
          />
        </ShopifyMetricGrid>

        <ShopifyCard padding="xl">
          <ShopifyToggle
            id="welcome-automation-toggle"
            checked={automationEnabled}
            onChange={setAutomationEnabled}
            label="Welcome Message Automation"
            description="Automatically send welcome messages to new subscribers"
          />

          {!automationEnabled && (
            <div className="mt-4 rounded-xl border border-[#fde68a] bg-[#fffbeb] p-4">
              <p className="text-[13px] text-[#92400e]">
                Automation is currently disabled. New subscribers will not receive welcome messages.
              </p>
            </div>
          )}
        </ShopifyCard>

        <ShopifyCard
          header={
            <div>
              <h2 className="text-[16px] font-semibold text-[#1a1a1a]">Message Templates</h2>
              <p className="text-[14px] text-[#6b7177] mt-1">
                Create a sequence of automated messages for new subscribers
              </p>
            </div>
          }
          padding="xl"
        >
          {templates.length > 0 ? (
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 rounded-2xl border transition-colors ${
                    template.isActive
                      ? 'border-[#00a47c] bg-[#f1f8f5]'
                      : 'border-[var(--border-default)] bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[16px] font-semibold text-[#202223]">{template.name}</h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[12px] font-medium border ${
                            template.isActive
                              ? 'bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]'
                              : 'bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]'
                          }`}
                        >
                          {template.isActive ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                          {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[12px] font-medium bg-[#eff6ff] text-[#1f5199] border border-[#bfdbfe]">
                          Sent after: {getDelayText(template.delay, template.delayUnit)}
                        </span>
                      </div>

                      <p className="text-[14px] text-[#202223] mt-2 whitespace-pre-wrap">{template.message}</p>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-[13px] text-[#6b7177]">
                        <div>
                          <span className="font-semibold text-[#202223]">{template.sentCount.toLocaleString()}</span>{' '}
                          sent
                        </div>
                        <div>
                          <span className="font-semibold text-[#008060]">{template.openRate}%</span> open rate
                        </div>
                        <div>
                          <span className="font-semibold text-[#6b21a8]">{template.replyRate}%</span> reply rate
                        </div>
                        <div>Last modified: {new Date(template.lastModified).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleTemplate(template.id)}
                        className={iconButtonBase}
                        title={template.isActive ? 'Pause' : 'Activate'}
                        aria-label={template.isActive ? 'Pause template' : 'Activate template'}
                      >
                        {template.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowPreviewModal(true);
                        }}
                        className={iconButtonBase}
                        title="Preview"
                        aria-label="Preview template"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTestSend(template)}
                        className={iconButtonBase}
                        title="Test Send"
                        aria-label="Send test message"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowCreateModal(true);
                        }}
                        className={iconButtonBase}
                        title="Edit"
                        aria-label="Edit template"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateTemplate(template)}
                        className={iconButtonBase}
                        title="Duplicate"
                        aria-label="Duplicate template"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className={iconButtonDanger}
                        title="Delete"
                        aria-label="Delete template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ShopifyEmptyState
              title="No welcome templates yet"
              description="Create your first welcome message template to start automating your onboarding."
              icon={MessageCircle}
              action={{ label: 'Create Template', onClick: () => setShowCreateModal(true) }}
              variant="compact"
            />
          )}
        </ShopifyCard>
      </ShopifyPageLayout>

	      {showCreateModal && (
	        <div
	          className="fixed inset-0 flex items-center justify-center p-4"
	          style={{
	            zIndex: 'var(--huntaze-z-index-overlay, 45)',
	            backgroundColor: 'var(--bg-modal-backdrop)',
	          }}
	          role="dialog"
	          aria-modal="true"
	        >
          <div className="w-full max-w-2xl">
            <ShopifyCard padding="xl" shadow>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-[20px] font-semibold text-[#202223]">
                    {editingTemplate ? 'Edit Template' : 'Create Template'}
                  </h3>
                  <p className="text-[14px] text-[#6b7177] mt-1">
                    Use <code className="px-1 py-0.5 bg-[#f6f6f7] rounded">{'{{name}}'}</code> to personalize the
                    message with the subscriber&apos;s name.
                  </p>
                </div>
                <ShopifyButton variant="plain" onClick={closeCreateModal}>
                  Close
                </ShopifyButton>
              </div>

              <div className="mt-6 space-y-4">
                <ShopifyInput
                  label="Template name"
                  placeholder="e.g. Immediate Welcome"
                  defaultValue={editingTemplate?.name || ''}
                />

                <ShopifyTextarea
                  label="Message"
                  placeholder="Write your welcome message... Use {{name}} for personalization"
                  defaultValue={editingTemplate?.message || ''}
                  rows={6}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ShopifyInput
                    type="number"
                    label="Send after"
                    min={0}
                    defaultValue={editingTemplate?.delay ?? 0}
                  />
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Time unit</label>
                    <select
                      defaultValue={editingTemplate?.delayUnit || 'minutes'}
                      className={[
                        'w-full h-10 px-4 rounded-xl',
                        'text-sm text-[#1a1a1a]',
                        'bg-white border border-[var(--border-default)] transition-colors duration-200',
                        'hover:border-[var(--border-emphasis)]',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#2c6ecb] focus:border-[#2c6ecb]',
                      ].join(' ')}
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-[#202223]">
                  <input
                    type="checkbox"
                    defaultChecked={editingTemplate?.isActive ?? true}
                    className="h-4 w-4 rounded-[6px] border border-[var(--border-default)] accent-[#2c6ecb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--shopify-border-focus)]"
                  />
                  Activate this template immediately
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-[var(--border-default)]">
                <ShopifyButton variant="secondary" onClick={closeCreateModal}>
                  Cancel
                </ShopifyButton>
                <ShopifyButton variant="primary" onClick={closeCreateModal}>
                  {editingTemplate ? 'Save Changes' : 'Create Template'}
                </ShopifyButton>
              </div>
            </ShopifyCard>
          </div>
        </div>
      )}

	      {showPreviewModal && selectedTemplate && (
	        <div
	          className="fixed inset-0 flex items-center justify-center p-4"
	          style={{
	            zIndex: 'var(--huntaze-z-index-overlay, 45)',
	            backgroundColor: 'var(--bg-modal-backdrop)',
	          }}
	          role="dialog"
	          aria-modal="true"
	        >
          <div className="w-full max-w-xl">
            <ShopifyCard padding="xl" shadow>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-[20px] font-semibold text-[#202223]">Message Preview</h3>
                  <p className="text-[14px] text-[#6b7177] mt-1">
                    This is how your message will appear to subscribers.
                  </p>
                </div>
                <ShopifyButton variant="plain" onClick={closePreviewModal}>
                  Close
                </ShopifyButton>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-[var(--border-default)] bg-[#f6f6f7] p-4">
                  <p className="text-[14px] text-[#202223] whitespace-pre-wrap">
                    {selectedTemplate.message.replace(/\{\{name\}\}/g, 'Sarah')}
                  </p>
                </div>
                <p className="text-[13px] text-[#6b7177]">
                  Sent: {getDelayText(selectedTemplate.delay, selectedTemplate.delayUnit)} after subscription
                </p>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-[var(--border-default)]">
                <ShopifyButton variant="secondary" onClick={closePreviewModal}>
                  Done
                </ShopifyButton>
                <ShopifyButton
                  variant="primary"
                  onClick={() => handleTestSend(selectedTemplate)}
                  icon={<Send className="w-4 h-4" />}
                >
                  Send Test
                </ShopifyButton>
              </div>
            </ShopifyCard>
          </div>
        </div>
      )}
    </>
  );
}
