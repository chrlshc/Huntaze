'use client';

/**
 * OnlyFans Settings Page - Design System Refactored
 * Requirements: 3.5, 11.1, 11.2, 11.3
 * 
 * Features:
 * - Uses Toggle component from design system (Requirement 11.1)
 * - Uses SettingsLayout components with proper proximity rules
 * - Visual separators between items (Requirement 11.2)
 * - Compact callout cards for account connection (Requirement 11.3)
 * - Design tokens applied throughout
 */

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Banner } from '@/components/ui/Banner';
import { StatCard } from '@/components/ui/StatCard';
import { 
  SettingsSection, 
  SettingsList, 
  SettingsToggleItem,
  SettingsCalloutCard 
} from '@/components/ui/SettingsLayout';
import {
  Settings,
  Link as LinkIcon,
  Unlink,
  Bell,
  Zap,
  MessageSquare,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save
} from 'lucide-react';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { Button } from "@/components/ui/button";

interface ConnectionStatus {
  isConnected: boolean;
  username: string | null;
  lastSync: Date | null;
  status: 'connected' | 'disconnected' | 'error';
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

  const { trackAPIRequest } = usePerformanceMonitoring({
    pageName: 'OnlyFans Settings',
    trackInteractions: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      await trackAPIRequest('/api/onlyfans/connection', 'GET', async () => {
        const response = await fetch('/api/onlyfans/connection');
        if (response.ok) {
          const data = await response.json();
          setConnectionStatus(data.connection || getDefaultConnection());
        } else {
          setConnectionStatus(getDefaultConnection());
        }
      });

      await trackAPIRequest('/api/ai/quota', 'GET', async () => {
        const quotaResponse = await fetch('/api/ai/quota');
        if (quotaResponse.ok) {
          const quotaData = await quotaResponse.json();
          setQuotaSettings(quotaData.quota || getDefaultQuota());
        } else {
          setQuotaSettings(getDefaultQuota());
        }
      });

      await trackAPIRequest('/api/user/preferences', 'GET', async () => {
        const prefsResponse = await fetch('/api/user/preferences');
        if (prefsResponse.ok) {
          const prefsData = await prefsResponse.json();
          if (prefsData.notifications) setNotifications(prefsData.notifications);
          if (prefsData.automation) setAutomation(prefsData.automation);
        }
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      setConnectionStatus(getDefaultConnection());
      setQuotaSettings(getDefaultQuota());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultConnection = (): ConnectionStatus => ({
    isConnected: false,
    username: null,
    lastSync: null,
    status: 'disconnected',
  });

  const getDefaultQuota = (): AIQuotaSettings => ({
    plan: 'starter',
    limit: 10,
    spent: 0,
    remaining: 10,
    percentUsed: 0,
    resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });


  const connectOnlyFans = async () => {
    setConnecting(true);
    try {
      await trackAPIRequest('/api/onlyfans/connect', 'POST', async () => {
        const response = await fetch('/api/onlyfans/connect', { method: 'POST' });
        if (response.ok) {
          const data = await response.json();
          if (data.authUrl) {
            window.location.href = data.authUrl;
          }
        }
      });
    } catch (error) {
      console.error('Failed to connect OnlyFans:', error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectOnlyFans = async () => {
    if (!confirm('Are you sure you want to disconnect your OnlyFans account?')) return;
    try {
      await trackAPIRequest('/api/onlyfans/disconnect', 'POST', async () => {
        const response = await fetch('/api/onlyfans/disconnect', { method: 'POST' });
        if (response.ok) {
          setConnectionStatus(getDefaultConnection());
        }
      });
    } catch (error) {
      console.error('Failed to disconnect OnlyFans:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await trackAPIRequest('/api/user/preferences', 'PUT', async () => {
        const response = await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notifications, automation }),
        });
        if (response.ok) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const getQuotaStatus = (percentUsed: number): 'success' | 'warning' | 'critical' => {
    if (percentUsed >= 95) return 'critical';
    if (percentUsed >= 80) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <ContentPageErrorBoundary pageName="OnlyFans Settings">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
              style={{ borderColor: 'var(--accent-primary)' }}
            />
            <p style={{ color: 'var(--text-secondary)' }}>Loading settings...</p>
          </div>
        </div>
      </ContentPageErrorBoundary>
    );
  }


  return (
    <ContentPageErrorBoundary pageName="OnlyFans Settings">
      <div className="max-w-4xl mx-auto" style={{ padding: 'var(--space-6)' }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1 
            className="text-3xl font-bold"
            style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}
          >
            OnlyFans Settings
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage your OnlyFans connection and preferences
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Connection Settings - Using SettingsCalloutCard */}
          <SettingsSection
            title="Account Connection"
            description="Connect your OnlyFans account to enable AI-powered features"
          >
            {connectionStatus?.isConnected ? (
              <Card style={{ padding: 'var(--space-4)' }}>
                <Banner
                  status="success"
                  title="Connected"
                  description={connectionStatus.username ? `@${connectionStatus.username}` : 'Your account is connected'}
                  icon={<CheckCircle className="w-5 h-5" />}
                  action={{
                    label: 'Disconnect',
                    onClick: disconnectOnlyFans
                  }}
                />
                {connectionStatus.lastSync && (
                  <p 
                    className="text-sm mt-3"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Last synced: {new Date(connectionStatus.lastSync).toLocaleString()}
                  </p>
                )}
              </Card>
            ) : (
              <SettingsCalloutCard
                title="Connect OnlyFans"
                description="Connect your OnlyFans account to enable AI-powered features"
                actionLabel={connecting ? 'Connecting...' : 'Connect Account'}
                onAction={connectOnlyFans}
                icon={<LinkIcon className="w-6 h-6" />}
                variant="warning"
              />
            )}
          </SettingsSection>

          {/* AI Quota Settings - Using StatCard */}
          {quotaSettings && (
            <SettingsSection
              title="AI Quota & Billing"
              description="Monitor your AI usage and manage your plan"
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <StatCard
                  label="Current Plan"
                  value={quotaSettings.plan ? quotaSettings.plan.charAt(0).toUpperCase() + quotaSettings.plan.slice(1) : 'Starter'}
                />
                <StatCard
                  label="Usage"
                  value={`${quotaSettings.percentUsed.toFixed(0)}%`}
                  trend={{
                    value: `${quotaSettings.percentUsed.toFixed(0)}%`,
                    direction: quotaSettings.percentUsed > 80 ? 'up' : 'neutral'
                  }}
                />
                <StatCard
                  label="Remaining"
                  value={`$${quotaSettings.remaining.toFixed(2)}`}
                />
              </div>
              
              {/* Progress bar */}
              <Card style={{ padding: 'var(--space-4)' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    ${quotaSettings.spent.toFixed(2)} used of ${quotaSettings.limit.toFixed(2)}
                  </span>
                  <Badge status={getQuotaStatus(quotaSettings.percentUsed)}>
                    {quotaSettings.percentUsed.toFixed(0)}%
                  </Badge>
                </div>
                <div 
                  className="w-full rounded-full h-3"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(quotaSettings.percentUsed, 100)}%`,
                      backgroundColor: quotaSettings.percentUsed >= 95 
                        ? 'var(--status-critical)' 
                        : quotaSettings.percentUsed >= 80 
                        ? 'var(--status-warning)' 
                        : 'var(--status-success)'
                    }}
                  />
                </div>
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Resets on {new Date(quotaSettings.resetDate).toLocaleDateString()}
                </p>
              </Card>
            </SettingsSection>
          )}


          {/* Notification Settings - Using SettingsList with Toggle */}
          <SettingsSection
            title="Notifications"
            description="Choose what notifications you want to receive"
          >
            <SettingsList separatorStyle="border" spacing="default">
              <SettingsToggleItem
                id="newMessages"
                label="New Messages"
                description="Get notified when you receive new messages"
                checked={notifications.newMessages}
                onChange={(checked) => setNotifications({ ...notifications, newMessages: checked })}
              />
              <SettingsToggleItem
                id="newFans"
                label="New Fans"
                description="Get notified when you get new subscribers"
                checked={notifications.newFans}
                onChange={(checked) => setNotifications({ ...notifications, newFans: checked })}
              />
              <SettingsToggleItem
                id="ppvPurchases"
                label="PPV Purchases"
                description="Get notified when someone purchases PPV content"
                checked={notifications.ppvPurchases}
                onChange={(checked) => setNotifications({ ...notifications, ppvPurchases: checked })}
              />
              <SettingsToggleItem
                id="quotaWarnings"
                label="Quota Warnings"
                description="Get notified when approaching AI quota limits"
                checked={notifications.quotaWarnings}
                onChange={(checked) => setNotifications({ ...notifications, quotaWarnings: checked })}
              />
              <SettingsToggleItem
                id="weeklyReports"
                label="Weekly Reports"
                description="Receive weekly performance reports"
                checked={notifications.weeklyReports}
                onChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
              />
            </SettingsList>
          </SettingsSection>

          {/* Automation Settings - Using SettingsList with Toggle */}
          <SettingsSection
            title="Automation"
            description="Configure automated responses and AI assistance"
          >
            <SettingsList separatorStyle="border" spacing="default">
              <SettingsToggleItem
                id="aiAssistance"
                label="AI Assistance"
                description="Enable AI-powered message suggestions"
                checked={automation.aiAssistance}
                onChange={(checked) => setAutomation({ ...automation, aiAssistance: checked })}
              />
              <SettingsToggleItem
                id="welcomeMessage"
                label="Welcome Message"
                description="Automatically send a welcome message to new subscribers"
                checked={automation.welcomeMessage}
                onChange={(checked) => setAutomation({ ...automation, welcomeMessage: checked })}
              />
              <SettingsToggleItem
                id="autoReply"
                label="Auto Reply"
                description="Automatically reply when you're away"
                checked={automation.autoReply}
                onChange={(checked) => setAutomation({ ...automation, autoReply: checked })}
              />
            </SettingsList>

            {/* Welcome Message Text Area */}
            {automation.welcomeMessage && (
              <Card style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)' }}>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Welcome Message Text
                </label>
                <textarea
                  value={automation.welcomeMessageText}
                  onChange={(e) => setAutomation({ ...automation, welcomeMessageText: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)'
                  }}
                  placeholder="Enter your welcome message..."
                />
              </Card>
            )}

            {/* Auto Reply Text Area */}
            {automation.autoReply && (
              <Card style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)' }}>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Auto Reply Message
                </label>
                <textarea
                  value={automation.autoReplyMessage}
                  onChange={(e) => setAutomation({ ...automation, autoReplyMessage: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)'
                  }}
                  placeholder="Enter your auto-reply message..."
                />
              </Card>
            )}
          </SettingsSection>


          {/* Save Button */}
          <div 
            className="flex items-center justify-end"
            style={{ gap: 'var(--space-4)', paddingTop: 'var(--space-4)' }}
          >
            {saveSuccess && (
              <Banner
                status="success"
                title="Settings saved successfully!"
                icon={<CheckCircle className="w-5 h-5" />}
              />
            )}
            <Button 
              variant="primary" 
              onClick={saveSettings} 
              disabled={saving}
              style={{ minHeight: '44px' }}
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </ContentPageErrorBoundary>
  );
}
