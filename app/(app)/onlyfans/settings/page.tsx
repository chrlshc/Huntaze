'use client';

/**
 * OnlyFans Settings Page - Shopify Design Unification
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 * Feature: onlyfans-shopify-unification
 * 
 * Unified with Shopify design system:
 * - ShopifyPageLayout for consistent structure (Requirement 7.1)
 * - ShopifyCard for organized sections (Requirement 7.1)
 * - ShopifyBanner for connection status (Requirement 7.3)
 * - ShopifyToggle for preferences (Requirement 7.4)
 * - ShopifyButton for actions (Requirement 7.5)
 * - ShopifyTextarea for form fields (Requirement 7.2)
 */

export const dynamic = 'force-dynamic';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { ShopifyPageLayout } from '@/components/layout/ShopifyPageLayout';
import { ShopifyBanner } from '@/components/ui/shopify/ShopifyBanner';
import { ShopifyButton } from '@/components/ui/shopify/ShopifyButton';
import { ShopifyCard } from '@/components/ui/shopify/ShopifyCard';
import { ShopifyEmptyState } from '@/components/ui/shopify/ShopifyEmptyState';
import { ShopifyToggle } from '@/components/ui/shopify/ShopifyToggle';
import { ShopifyTextarea } from '@/components/ui/shopify/ShopifyTextarea';
import { TemplateCard } from '@/components/onlyfans/TemplateCard';
import { RecommendationCard } from '@/components/onlyfans/RecommendationCard';
import {
  Loader2,
  Save,
} from 'lucide-react';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { SearchInput } from '@/components/ui/SearchInput';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import { getCsrfToken } from '@/lib/utils/csrf-client';

interface ConnectionStatus {
  isConnected: boolean;
  username: string | null;
  lastSync: Date | null;
  status: 'connected' | 'disconnected' | 'error';
  accountId?: string | null;
}

interface AIQuotaSettings {
  plan: 'starter' | 'pro' | 'business';
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  resetDate: Date;
}

interface NotificationSettings {
  newMessages: boolean;
  newFans: boolean;
  ppvPurchases: boolean;
  quotaWarnings: boolean;
  weeklyReports: boolean;
}

interface AutomationSettings {
  autoReply: boolean;
  autoReplyMessage: string;
  welcomeMessage: boolean;
  welcomeMessageText: string;
  aiAssistance: boolean;
}

interface IntegrationStatusItem {
  provider: string;
  accountId: string;
  accountName?: string;
  status?: 'connected' | 'expired';
  updatedAt?: string;
}

interface IntegrationsStatusResponse {
  success: boolean;
  data?: {
    integrations?: IntegrationStatusItem[];
  };
}

interface UserProfile {
  metadata?: unknown;
}

interface TemplateItem {
  id: string;
  category: string;
  title: string;
  preview: string;
}

interface RecommendationItem {
  id: string;
  insight: string;
  impact: string;
  metric: string;
  metricColor?: 'success' | 'warning' | 'info';
}

const getDefaultConnection = (): ConnectionStatus => ({
  isConnected: false,
  username: null,
  lastSync: null,
  status: 'disconnected',
  accountId: null,
});

const getDefaultQuota = (): AIQuotaSettings => ({
  plan: 'starter',
  limit: 10,
  spent: 0,
  remaining: 10,
  percentUsed: 0,
  resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
});

const normalizeMetadata = (value: unknown): Record<string, any> => {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, any>;
    } catch {
      return {};
    }
  }
  if (typeof value === 'object') {
    return value as Record<string, any>;
  }
  return {};
};

const normalizeQuotaSettings = (raw: unknown): AIQuotaSettings => {
  const defaults = getDefaultQuota();

  if (!raw || typeof raw !== 'object') return defaults;

  const maybe = raw as {
    plan?: string;
    limit?: number;
    spent?: number;
    remaining?: number;
    percentUsed?: number;
    resetDate?: string | number | Date;
  };

  const plan =
    typeof maybe.plan === 'string' && maybe.plan.length > 0 ? maybe.plan : defaults.plan;
  const toNumber = (value: unknown, fallback: number) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

  const resetDateValue = maybe.resetDate;
  const resetDate =
    resetDateValue instanceof Date
      ? resetDateValue
      : typeof resetDateValue === 'string' || typeof resetDateValue === 'number'
        ? new Date(resetDateValue)
        : defaults.resetDate;

  return {
    plan,
    limit: toNumber(maybe.limit, defaults.limit),
    spent: toNumber(maybe.spent, defaults.spent),
    remaining: toNumber(maybe.remaining, defaults.remaining),
    percentUsed: toNumber(maybe.percentUsed, defaults.percentUsed),
    resetDate,
  };
};

export default function OnlyFansSettingsPage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [quotaSettings, setQuotaSettings] = useState<AIQuotaSettings | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    newMessages: true,
    newFans: true,
    ppvPurchases: true,
    quotaWarnings: true,
    weeklyReports: false,
  });
  const [automation, setAutomation] = useState<AutomationSettings>({
    autoReply: false,
    autoReplyMessage: '',
    welcomeMessage: true,
    welcomeMessageText: 'Thanks for subscribing! 💕',
    aiAssistance: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileMetadata, setProfileMetadata] = useState<Record<string, any>>({});
  const quotaPlan = quotaSettings?.plan ?? 'starter';
  const quotaPlanLabel =
    typeof quotaPlan === 'string' && quotaPlan.length > 0
      ? quotaPlan.charAt(0).toUpperCase() + quotaPlan.slice(1)
      : 'Starter';

  usePerformanceMonitoring({ componentName: 'onlyfans-settings' });

  const templates = useMemo<TemplateItem[]>(() => [], []);
  const recommendations = useMemo<RecommendationItem[]>(() => [], []);

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return templates;

    return templates.filter((template) =>
      [template.category, template.title, template.preview].some((field) =>
        field.toLowerCase().includes(query),
      ),
    );
  }, [templates, searchQuery]);

  const filteredRecommendations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return recommendations;

    return recommendations.filter((recommendation) =>
      [recommendation.insight, recommendation.impact, recommendation.metric].some((field) =>
        field.toLowerCase().includes(query),
      ),
    );
  }, [recommendations, searchQuery]);

  // Template handlers
  const handleEditTemplate = (id: string) => {
    void id;
    // TODO: Implement edit functionality
  };

  const handleDuplicateTemplate = (id: string) => {
    void id;
    // TODO: Implement duplicate functionality
  };

  const handleDeleteTemplate = (id: string) => {
    void id;
    // TODO: Implement delete functionality
  };

  // Recommendation handlers
  const handleFixNow = (id: string) => {
    void id;
    // TODO: Implement fix functionality
  };

  const handleDismissRecommendation = (id: string) => {
    void id;
    // TODO: Implement dismiss functionality
  };

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [integrationResult, quotaResult, profileResult] = await Promise.allSettled([
        internalApiFetch<IntegrationsStatusResponse>('/api/integrations/status'),
        internalApiFetch<{ quota?: unknown }>('/api/ai/quota'),
        internalApiFetch<UserProfile>('/api/users/profile'),
      ]);

      if (integrationResult.status === 'fulfilled') {
        const integrations = integrationResult.value?.data?.integrations ?? [];
        const onlyfansIntegration = integrations.find((item) => item.provider === 'onlyfans');
        if (onlyfansIntegration) {
          const isConnected = onlyfansIntegration.status === 'connected';
          setConnectionStatus({
            isConnected,
            username: onlyfansIntegration.accountName || onlyfansIntegration.accountId || null,
            lastSync: onlyfansIntegration.updatedAt ? new Date(onlyfansIntegration.updatedAt) : null,
            status: isConnected ? 'connected' : 'error',
            accountId: onlyfansIntegration.accountId,
          });
        } else {
          setConnectionStatus(getDefaultConnection());
        }
      } else {
        setConnectionStatus(getDefaultConnection());
      }

      if (quotaResult.status === 'fulfilled') {
        setQuotaSettings(normalizeQuotaSettings(quotaResult.value?.quota));
      } else {
        setQuotaSettings(getDefaultQuota());
      }

      if (profileResult.status === 'fulfilled') {
        const metadata = normalizeMetadata(profileResult.value?.metadata);
        setProfileMetadata(metadata);
        const onlyfansPrefs = (metadata.onlyfans || {}) as {
          notifications?: Partial<NotificationSettings>;
          automation?: Partial<AutomationSettings>;
        };
        if (onlyfansPrefs.notifications) {
          setNotifications((current) => ({ ...current, ...onlyfansPrefs.notifications }));
        }
        if (onlyfansPrefs.automation) {
          setAutomation((current) => ({ ...current, ...onlyfansPrefs.automation }));
        }
      }

      const hadFailure =
        integrationResult.status === 'rejected' ||
        quotaResult.status === 'rejected' ||
        profileResult.status === 'rejected';
      if (hadFailure) {
        setLoadError('Some settings failed to load. Please try again.');
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load settings');
      setConnectionStatus(getDefaultConnection());
      setQuotaSettings(getDefaultQuota());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const connectOnlyFans = async () => {
    setConnecting(true);
    try {
      setSaveError(null);
      const csrfToken = await getCsrfToken();
      const response = await internalApiFetch<{ data?: { authUrl?: string } }>(
        '/api/integrations/connect/onlyfans',
        {
          method: 'POST',
          headers: {
            'x-csrf-token': csrfToken,
          },
          body: {
            redirectUrl: window.location.href,
          },
        }
      );
      const authUrl = response?.data?.authUrl;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        setSaveError('Unable to start OnlyFans connection.');
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to connect OnlyFans');
    } finally {
      setConnecting(false);
    }
  };

  const disconnectOnlyFans = async () => {
    if (!confirm('Are you sure you want to disconnect your OnlyFans account?')) return;
    try {
      setSaveError(null);
      const accountId = connectionStatus?.accountId;
      if (!accountId) {
        setSaveError('No connected account found to disconnect.');
        return;
      }
      const csrfToken = await getCsrfToken();
      await internalApiFetch(`/api/integrations/disconnect/onlyfans/${accountId}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': csrfToken,
        },
      });
      setConnectionStatus(getDefaultConnection());
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to disconnect OnlyFans');
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      setSaveError(null);
      const csrfToken = await getCsrfToken();
      const nextMetadata = {
        ...profileMetadata,
        onlyfans: {
          ...(profileMetadata.onlyfans || {}),
          notifications,
          automation,
        },
      };
      await internalApiFetch<UserProfile>('/api/users/profile', {
        method: 'PUT',
        headers: {
          'x-csrf-token': csrfToken,
        },
        body: {
          metadata: nextMetadata,
        },
      });
      setProfileMetadata(nextMetadata);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ShopifyPageLayout title="OnlyFans Settings" subtitle="Manage your OnlyFans connection and preferences">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#6b7177]" />
            <p className="text-sm text-[#6b7177]">Loading settings...</p>
          </div>
        </div>
      </ShopifyPageLayout>
    );
  }

  return (
    <ShopifyPageLayout 
      title="OnlyFans Settings" 
      subtitle="Manage your OnlyFans connection and preferences"
    >
      {/* Search Bar - positioned at top */}
      <div style={{ marginBottom: 'var(--of-card-gap)' }}>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search settings, templates, or recommendations..."
          ariaLabel="Search settings, templates, or recommendations"
          showClearButton
          className="max-w-[400px]"
        />
        {searchQuery && (
          <p style={{ 
            fontSize: '12px', 
            color: '#6B7280', 
            marginTop: '4px',
            marginLeft: '4px'
          }}>
            Searching for "{searchQuery}"...
          </p>
        )}
      </div>

      {loadError && (
        <div style={{ marginBottom: 'var(--of-card-gap)' }}>
          <ShopifyBanner
            status="critical"
            title="Unable to load settings"
            description={loadError}
            action={{
              label: 'Retry',
              onClick: () => {
                setLoading(true);
                void loadSettings();
              },
            }}
          />
        </div>
      )}
      {saveError && (
        <div style={{ marginBottom: 'var(--of-card-gap)' }}>
          <ShopifyBanner
            status="critical"
            title="Action failed"
            description={saveError}
          />
        </div>
      )}
      {/* Connection Settings - SaaS Premium: relief + shadow */}
      <div className="of-settings-card">
        <div className="of-card-header">
          <div>
            <span className="of-category-pill">Account</span>
            <h2 style={{ fontSize: 'var(--of-text-section)', fontWeight: 'var(--of-font-semibold)' }}>
              Account Connection
            </h2>
            <p style={{ fontSize: 'var(--of-text-body)', color: '#6B7280', marginTop: '4px' }}>
              Connect your OnlyFans account to enable AI-powered features
            </p>
          </div>
        </div>

          {connectionStatus?.isConnected ? (
            <>
              <ShopifyBanner
                status="success"
                title="Connected"
                description={connectionStatus.username ? `@${connectionStatus.username}` : 'Your account is connected'}
              />
              <div style={{ marginTop: 'var(--of-space-4)' }}>
                <ShopifyButton 
                  variant="secondary" 
                  onClick={disconnectOnlyFans}
                >
                  Disconnect
                </ShopifyButton>
              </div>
              {connectionStatus.lastSync && (
                <p className="of-text-sm of-text-secondary" style={{ marginTop: 'var(--of-space-4)' }}>
                  Last synced: {new Date(connectionStatus.lastSync).toLocaleString()}
                </p>
              )}
            </>
          ) : (
            <>
              <ShopifyBanner
                status="warning"
                title="Not Connected"
                description="Connect your OnlyFans account to enable AI-powered features"
              />
              <div style={{ marginTop: 'var(--of-space-4)' }}>
                <ShopifyButton 
                  variant="secondary" 
                  onClick={connectOnlyFans}
                  loading={connecting}
                >
                  {connecting ? 'Connecting...' : 'Connect Account'}
                </ShopifyButton>
              </div>
            </>
          )}
      </div>

      {/* AI Quota Settings - SaaS Premium: relief + shadow */}
      {quotaSettings && (
        <div className="of-settings-card">
          <div className="of-card-header">
            <div>
              <span className="of-category-pill">Billing</span>
              <h2 style={{ fontSize: 'var(--of-text-section)', fontWeight: 'var(--of-font-semibold)' }}>
                AI Quota & Billing
              </h2>
              <p style={{ fontSize: 'var(--of-text-body)', color: '#6B7280', marginTop: '4px' }}>
                Monitor your AI usage and manage your plan
              </p>
            </div>
          </div>

            {/* Quota Stats */}
	            <div className="grid grid-cols-3" style={{ gap: 'var(--of-space-4)', marginBottom: 'var(--of-space-4)' }}>
              <div>
                <p className="of-text-xs of-text-secondary" style={{ marginBottom: 'var(--of-space-1)' }}>Current Plan</p>
                <p className="of-text-lg of-text-primary font-semibold">
                  {quotaPlanLabel}
                </p>
              </div>
              <div>
                <p className="of-text-xs of-text-secondary" style={{ marginBottom: 'var(--of-space-1)' }}>Usage</p>
                <p className="of-text-lg of-text-primary font-semibold">
                  {quotaSettings.percentUsed.toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="of-text-xs of-text-secondary" style={{ marginBottom: 'var(--of-space-1)' }}>Remaining</p>
                <p className="of-text-lg of-text-primary font-semibold">
                  ${quotaSettings.remaining.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex flex-col" style={{ padding: 'var(--of-space-2) 0', gap: 'var(--of-space-2)' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--of-space-2)' }}>
                <span className="of-text-sm of-text-secondary">
                  ${quotaSettings.spent.toFixed(2)} used of ${quotaSettings.limit.toFixed(2)}
                </span>
                <span className={`of-text-sm font-medium ${
                  quotaSettings.percentUsed >= 95 ? 'text-[#d72c0d]' :
                  quotaSettings.percentUsed >= 80 ? 'text-[#b98900]' :
                  'text-[#008060]'
                }`}>
                  {quotaSettings.percentUsed.toFixed(0)}%
                </span>
              </div>
              <div className="w-full rounded-full h-2 bg-[#e1e3e5]">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(quotaSettings.percentUsed, 100)}%`,
                    backgroundColor: quotaSettings.percentUsed >= 95 
                      ? '#d72c0d' 
                      : quotaSettings.percentUsed >= 80 
                      ? '#b98900' 
                      : '#008060'
                  }}
                />
              </div>
              <p className="of-text-sm of-text-secondary">
                Resets on {new Date(quotaSettings.resetDate).toLocaleDateString()}
              </p>
            </div>
        </div>
      )}

      {/* Notification Settings - SaaS Premium: relief + shadow */}
      <div className="of-settings-card">
        <div className="of-card-header">
          <div>
            <span className="of-category-pill">Preferences</span>
            <h2 style={{ fontSize: 'var(--of-text-section)', fontWeight: 'var(--of-font-semibold)' }}>
              Notifications
            </h2>
            <p style={{ fontSize: 'var(--of-text-body)', color: '#6B7280', marginTop: '4px' }}>
              Choose what notifications you want to receive
            </p>
          </div>
        </div>

          <div style={{ gap: 'var(--of-gap-md)' }} className="flex flex-col">
            <div style={{ gap: 'var(--of-gap-md)' }} className="flex items-flex-start">
              <ShopifyToggle
                id="newMessages"
                label="New Messages"
                description="Get notified when you receive new messages"
                checked={notifications.newMessages}
                onChange={(checked) => setNotifications({ ...notifications, newMessages: checked })}
              />
            </div>
            <div style={{ gap: 'var(--of-gap-md)' }} className="flex items-flex-start">
              <ShopifyToggle
                id="newFans"
                label="New Fans"
                description="Get notified when you get new subscribers"
                checked={notifications.newFans}
                onChange={(checked) => setNotifications({ ...notifications, newFans: checked })}
              />
            </div>
            <div style={{ gap: 'var(--of-gap-md)' }} className="flex items-flex-start">
              <ShopifyToggle
                id="ppvPurchases"
                label="PPV Purchases"
                description="Get notified when someone purchases PPV content"
                checked={notifications.ppvPurchases}
                onChange={(checked) => setNotifications({ ...notifications, ppvPurchases: checked })}
              />
            </div>
            <div style={{ gap: 'var(--of-gap-md)' }} className="flex items-flex-start">
              <ShopifyToggle
                id="quotaWarnings"
                label="Quota Warnings"
                description="Get notified when approaching AI quota limits"
                checked={notifications.quotaWarnings}
                onChange={(checked) => setNotifications({ ...notifications, quotaWarnings: checked })}
              />
            </div>
            <div style={{ gap: 'var(--of-gap-md)' }} className="flex items-flex-start">
              <ShopifyToggle
                id="weeklyReports"
                label="Weekly Reports"
                description="Receive weekly performance reports"
                checked={notifications.weeklyReports}
                onChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
              />
            </div>
          </div>
      </div>

      {/* ========================================
          SECTION A: AUTOMATIONS
          ======================================== */}
      <div style={{ marginBottom: 'var(--of-section-gap)' }}>
        <h2 style={{ 
          fontSize: 'var(--of-text-section)', 
          fontWeight: 'var(--of-font-semibold)',
          marginBottom: 'var(--of-card-gap)'
        }}>
          Automations
        </h2>

        {/* Automation Settings - SaaS Premium: relief + shadow + accent */}
        <div className="of-settings-card of-settings-card--accent">
          <div className="of-card-header">
            <div>
              <span className="of-category-pill" data-tone="ai">AI</span>
              <h3 style={{ fontSize: 'var(--of-text-body)', fontWeight: 'var(--of-font-semibold)' }}>
                Auto-Reply Configuration
              </h3>
              <p style={{ fontSize: 'var(--of-text-body)', color: '#6B7280', marginTop: '4px' }}>
                Configure automated responses and AI assistance
              </p>
            </div>
          </div>

          <div style={{ gap: 'var(--of-gap-md)' }} className="flex flex-col">
            <div style={{ gap: 'var(--of-gap-md)' }} className="flex items-flex-start">
              <ShopifyToggle
                id="aiAssistance"
                label="AI Assistance"
                description="Enable AI-powered message suggestions"
                checked={automation.aiAssistance}
                onChange={(checked) => setAutomation({ ...automation, aiAssistance: checked })}
              />
            </div>
            <div style={{ gap: 'var(--of-gap-md)' }} className="flex items-flex-start">
              <ShopifyToggle
                id="welcomeMessage"
                label="Welcome Message"
                description="Automatically send a welcome message to new subscribers"
                checked={automation.welcomeMessage}
                onChange={(checked) => setAutomation({ ...automation, welcomeMessage: checked })}
              />
            </div>
            <div style={{ gap: 'var(--of-gap-md)' }} className="flex items-flex-start">
              <ShopifyToggle
                id="autoReply"
                label="Auto Reply"
                description="Automatically reply when you're away"
                checked={automation.autoReply}
                onChange={(checked) => setAutomation({ ...automation, autoReply: checked })}
              />
            </div>
          </div>

          {/* Welcome Message Text Area */}
          {automation.welcomeMessage && (
            <div
              style={{
                marginTop: 'var(--of-space-4)',
                paddingTop: 'var(--of-space-4)',
                borderTop: '1px solid var(--border-default)',
              }}
            >
              <ShopifyTextarea
                label="Welcome Message Text"
                value={automation.welcomeMessageText}
                onChange={(e) => setAutomation({ ...automation, welcomeMessageText: e.target.value })}
                rows={3}
                placeholder="Enter your welcome message..."
              />
            </div>
          )}

          {/* Auto Reply Text Area */}
          {automation.autoReply && (
            <div
              style={{
                marginTop: 'var(--of-space-4)',
                paddingTop: 'var(--of-space-4)',
                borderTop: '1px solid var(--border-default)',
              }}
            >
              <ShopifyTextarea
                label="Auto Reply Message"
                value={automation.autoReplyMessage}
                onChange={(e) => setAutomation({ ...automation, autoReplyMessage: e.target.value })}
                rows={3}
                placeholder="Enter your auto-reply message..."
              />
            </div>
          )}
        </div>

        {/* Automation Rules Table - Placeholder for now */}
        <div className="of-settings-card" style={{ marginTop: 'var(--of-card-gap)' }}>
          <div className="of-card-header">
            <div>
              <h3 style={{ fontSize: 'var(--of-text-body)', fontWeight: 'var(--of-font-semibold)' }}>
                Automation Rules
              </h3>
              <p style={{ fontSize: 'var(--of-text-body)', color: '#6B7280', marginTop: '4px' }}>
                Manage your automated messaging rules
              </p>
            </div>
          </div>
          <p style={{ fontSize: 'var(--of-text-body)', color: '#6B7280', padding: 'var(--of-space-4)' }}>
            Automation rules table will be implemented in Phase 2
          </p>
        </div>
      </div>

      {/* ========================================
          SECTION B: TEMPLATES
          ======================================== */}
      <div style={{ marginBottom: 'var(--of-section-gap)' }}>
        <h2 style={{ 
          fontSize: 'var(--of-text-section)', 
          fontWeight: 'var(--of-font-semibold)',
          marginBottom: 'var(--of-card-gap)'
        }}>
          Templates
        </h2>

        {/* Template Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--of-card-gap)',
          }}
        >
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                id={template.id}
                category={template.category}
                title={template.title}
                preview={template.preview}
                onEdit={handleEditTemplate}
                onDuplicate={handleDuplicateTemplate}
                onDelete={handleDeleteTemplate}
              />
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1' }}>
              {searchQuery ? (
                <div
                  style={{
                    padding: 'var(--of-space-4)',
                    color: '#6B7280',
                    fontSize: '14px',
                  }}
                >
                  No templates match "{searchQuery}".
                </div>
              ) : (
                <ShopifyEmptyState
                  title="No templates yet"
                  description="Templates will appear here once this feature is enabled for your account."
                  variant="compact"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================
          SECTION C: AI RECOMMENDATIONS
          ======================================== */}
      <div style={{ marginBottom: 'var(--of-section-gap)' }}>
        <h2 style={{ 
          fontSize: 'var(--of-text-section)', 
          fontWeight: 'var(--of-font-semibold)',
          marginBottom: 'var(--of-card-gap)'
        }}>
          AI Recommendations
        </h2>

        <ShopifyCard padding="none" className="overflow-hidden">
          <div className="divide-y divide-[var(--border-default)]">
            {filteredRecommendations.length > 0 ? (
              filteredRecommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  id={recommendation.id}
                  insight={recommendation.insight}
                  impact={recommendation.impact}
                  metric={recommendation.metric}
                  metricColor={recommendation.metricColor}
                  onFixNow={handleFixNow}
                  onDismiss={handleDismissRecommendation}
                />
              ))
            ) : (
              <div>
                {searchQuery ? (
                  <div style={{ padding: 'var(--of-space-4)', color: '#6B7280', fontSize: '14px' }}>
                    No recommendations match "{searchQuery}".
                  </div>
                ) : (
                  <div style={{ padding: 'var(--of-space-4)' }}>
                    <ShopifyEmptyState
                      title="No recommendations yet"
                      description="Recommendations will show up once Huntaze has enough data to analyze your performance."
                      variant="compact"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </ShopifyCard>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {saveSuccess && (
          <ShopifyBanner
            status="success"
            title="Settings saved successfully!"
          />
        )}
        <ShopifyButton 
          variant="primary" 
          onClick={saveSettings} 
          loading={saving}
          icon={<Save className="w-4 h-4" />}
        >
          Save Settings
        </ShopifyButton>
      </div>
    </ShopifyPageLayout>
  );
}
