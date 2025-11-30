'use client';

/**
 * OnlyFans Settings Page
 * Requirements: 3.5
 * 
 * Features:
 * - OnlyFans-specific settings and preferences
 * - AI quota settings and usage display
 * - Connection management (connect/disconnect OnlyFans)
 * - Notification preferences
 * - Automation settings (auto-reply, message templates)
 * - User preferences system integration
 * - Billing information and plan details
 */

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  Settings,
  Link as LinkIcon,
  Unlink,
  Bell,
  Zap,
  MessageSquare,
  CreditCard,
  Shield,
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

  // Performance monitoring
  const { trackAPIRequest } = usePerformanceMonitoring({
    pageName: 'OnlyFans Settings',
    trackInteractions: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Fetch connection status
      await trackAPIRequest('/api/onlyfans/connection', 'GET', async () => {
        const response = await fetch('/api/onlyfans/connection');
        if (response.ok) {
          const data = await response.json();
          setConnectionStatus(data.connection || getDefaultConnection());
        } else {
          setConnectionStatus(getDefaultConnection());
        }
      });

      // Fetch AI quota settings
      await trackAPIRequest('/api/ai/quota', 'GET', async () => {
        const quotaResponse = await fetch('/api/ai/quota');
        if (quotaResponse.ok) {
          const quotaData = await quotaResponse.json();
          setQuotaSettings(quotaData.quota || getDefaultQuota());
        } else {
          setQuotaSettings(getDefaultQuota());
        }
      });

      // Fetch user preferences
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
        const response = await fetch('/api/onlyfans/connect', {
          method: 'POST',
        });
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
        const response = await fetch('/api/onlyfans/disconnect', {
          method: 'POST',
        });
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
          body: JSON.stringify({
            notifications,
            automation,
          }),
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

  const getQuotaColor = (percentUsed: number) => {
    if (percentUsed >= 95) return 'text-red-600 dark:text-red-400';
    if (percentUsed >= 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'business': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'pro': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <ContentPageErrorBoundary pageName="OnlyFans Settings">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-indigo)] mx-auto mb-4"></div>
            <p className="text-[var(--color-text-sub)]">Loading settings...</p>
          </div>
        </div>
      </ContentPageErrorBoundary>
    );
  }

  return (
    <ContentPageErrorBoundary pageName="OnlyFans Settings">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-main)] mb-2">OnlyFans Settings</h1>
          <p className="text-[var(--color-text-sub)]">
            Manage your OnlyFans connection and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Connection Settings */}
          <Card className="bg-[var(--bg-surface)] rounded-lg border border-gray-200 shadow-[var(--shadow-soft)]">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-[var(--color-text-main)]" />
                <h2 className="text-lg font-medium text-[var(--color-text-main)]">Account Connection</h2>
              </div>
            </div>
            <div className="p-6">
              {connectionStatus?.isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="font-medium text-[var(--color-text-main)]">Connected</p>
                        <p className="text-sm text-[var(--color-text-sub)]">
                          {connectionStatus.username && `@${connectionStatus.username}`}
                        </p>
                      </div>
                    </div>
                    <Button variant="danger" onClick={disconnectOnlyFans}>
                      <Unlink className="w-4 h-4" />
                      Disconnect
                    </Button>
                  </div>
                  {connectionStatus.lastSync && (
                    <p className="text-sm text-[var(--color-text-sub)]">
                      Last synced: {new Date(connectionStatus.lastSync).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    <p className="text-sm text-[var(--color-text-main)]">
                      Connect your OnlyFans account to enable AI-powered features
                    </p>
                  </div>
                  <Button variant="primary" onClick={connectOnlyFans} disabled={connecting}>
                    {connecting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <LinkIcon className="w-5 h-5" />
                    )}
                    Connect OnlyFans Account
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* AI Quota Settings */}
          {quotaSettings && (
            <Card className="bg-[var(--bg-surface)] rounded-lg border border-gray-200 shadow-[var(--shadow-soft)]">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[var(--color-text-main)]" />
                  <h2 className="text-lg font-medium text-[var(--color-text-main)]">AI Quota & Billing</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--color-text-sub)] mb-1">Current Plan</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanBadgeColor(quotaSettings.plan)}`}>
                      {quotaSettings.plan.charAt(0).toUpperCase() + quotaSettings.plan.slice(1)}
                    </span>
                  </div>
                  <Button variant="ghost">
                    Upgrade Plan
                  </Button>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[var(--color-text-sub)]">Usage</span>
                    <span className={`text-lg font-bold ${getQuotaColor(quotaSettings.percentUsed)}`}>
                      {quotaSettings.percentUsed.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        quotaSettings.percentUsed >= 95
                          ? 'bg-red-600'
                          : quotaSettings.percentUsed >= 80
                          ? 'bg-yellow-600'
                          : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(quotaSettings.percentUsed, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2 text-sm text-[var(--color-text-sub)]">
                    <span>${quotaSettings.spent.toFixed(2)} used</span>
                    <span>${quotaSettings.remaining.toFixed(2)} remaining</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--color-text-sub)]">Quota resets on</span>
                    <span className="font-medium text-[var(--color-text-main)]">
                      {new Date(quotaSettings.resetDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Notification Settings */}
          <Card className="bg-[var(--bg-surface)] rounded-lg border border-gray-200 shadow-[var(--shadow-soft)]">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[var(--color-text-main)]" />
                <h2 className="text-lg font-medium text-[var(--color-text-main)]">Notifications</h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--color-text-main)]">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </p>
                    <p className="text-sm text-[var(--color-text-sub)]">
                      {key === 'newMessages' && 'Get notified when you receive new messages'}
                      {key === 'newFans' && 'Get notified when you get new subscribers'}
                      {key === 'ppvPurchases' && 'Get notified when someone purchases PPV content'}
                      {key === 'quotaWarnings' && 'Get notified when approaching AI quota limits'}
                      {key === 'weeklyReports' && 'Receive weekly performance reports'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </Card>

          {/* Automation Settings */}
          <Card className="bg-[var(--bg-surface)] rounded-lg border border-gray-200 shadow-[var(--shadow-soft)]">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[var(--color-text-main)]" />
                <h2 className="text-lg font-medium text-[var(--color-text-main)]">Automation</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* AI Assistance */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[var(--color-text-main)]">AI Assistance</p>
                  <p className="text-sm text-[var(--color-text-sub)]">
                    Enable AI-powered message suggestions
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={automation.aiAssistance}
                    onChange={(e) => setAutomation({ ...automation, aiAssistance: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Welcome Message */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-[var(--color-text-main)]">Welcome Message</p>
                    <p className="text-sm text-[var(--color-text-sub)]">
                      Automatically send a welcome message to new subscribers
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={automation.welcomeMessage}
                      onChange={(e) => setAutomation({ ...automation, welcomeMessage: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                {automation.welcomeMessage && (
                  <textarea
                    value={automation.welcomeMessageText}
                    onChange={(e) => setAutomation({ ...automation, welcomeMessageText: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[var(--color-text-main)]"
                    placeholder="Enter your welcome message..."
                  />
                )}
              </div>

              {/* Auto Reply */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-[var(--color-text-main)]">Auto Reply</p>
                    <p className="text-sm text-[var(--color-text-sub)]">
                      Automatically reply when you're away
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={automation.autoReply}
                      onChange={(e) => setAutomation({ ...automation, autoReply: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                {automation.autoReply && (
                  <textarea
                    value={automation.autoReplyMessage}
                    onChange={(e) => setAutomation({ ...automation, autoReplyMessage: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[var(--color-text-main)]"
                    placeholder="Enter your auto-reply message..."
                  />
                )}
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-4">
            {saveSuccess && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Settings saved successfully!</span>
              </div>
            )}
            <Button variant="primary" onClick={saveSettings} disabled={saving}>
  {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Settings
</Button>
          </div>
        </div>
      </div>
    </ContentPageErrorBoundary>
  );
}
