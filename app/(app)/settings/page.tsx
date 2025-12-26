'use client';

/**
 * Settings Page - Design System Refactored
 * Requirements: 11.1, 11.2, 11.3
 * 
 * Features:
 * - Uses SettingsLayout components with proper proximity rules
 * - Visual separators between items (Requirement 11.2)
 * - Design tokens applied throughout
 * - OnlyFans connection via bookmarklet
 */

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ButlerTip } from '@/components/ui/ButlerTip';
import { 
  SettingsSection, 
  SettingsList, 
  SettingsToggleItem,
  SettingsItem
} from '@/components/ui/SettingsLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { BookmarkletSetup } from '@/components/onlyfans/BookmarkletSetup';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import { getCsrfToken } from '@/lib/utils/csrf-client';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface UserProfile {
  metadata?: unknown;
}

interface SettingsPreferences {
  darkMode: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  twoFactorAuth: boolean;
}

const DEFAULT_PREFERENCES: SettingsPreferences = {
  darkMode: false,
  emailNotifications: true,
  pushNotifications: true,
  marketingEmails: false,
  twoFactorAuth: false,
};

interface OFStatus {
  connected: boolean;
  linkedAt: string | null;
  authId: string | null;
}

function normalizeMetadata(value: unknown): Record<string, any> {
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
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileMetadata, setProfileMetadata] = useState<Record<string, any>>({});
  
  // OnlyFans connection state
  const [ofStatus, setOfStatus] = useState<OFStatus>({ connected: false, linkedAt: null, authId: null });
  const [showBookmarklet, setShowBookmarklet] = useState(false);

  const applyPreferences = useCallback((prefs: Partial<SettingsPreferences>) => {
    setDarkMode(prefs.darkMode ?? DEFAULT_PREFERENCES.darkMode);
    setEmailNotifications(prefs.emailNotifications ?? DEFAULT_PREFERENCES.emailNotifications);
    setPushNotifications(prefs.pushNotifications ?? DEFAULT_PREFERENCES.pushNotifications);
    setMarketingEmails(prefs.marketingEmails ?? DEFAULT_PREFERENCES.marketingEmails);
    setTwoFactorAuth(prefs.twoFactorAuth ?? DEFAULT_PREFERENCES.twoFactorAuth);
  }, []);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const profile = await internalApiFetch<UserProfile>('/api/users/profile');
      const metadata = normalizeMetadata(profile?.metadata);
      setProfileMetadata(metadata);
      const saved = (metadata.settings || metadata.preferences || {}) as Partial<SettingsPreferences>;
      applyPreferences(saved);
      
      // Load OF status
      try {
        const status = await internalApiFetch<OFStatus>('/api/of/status');
        setOfStatus(status);
      } catch {
        // Silently fail - OF not connected
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load settings');
      applyPreferences(DEFAULT_PREFERENCES);
    } finally {
      setIsLoading(false);
    }
  }, [applyPreferences]);

  const saveSettings = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const csrfToken = await getCsrfToken();
      const nextSettings: SettingsPreferences = {
        darkMode,
        emailNotifications,
        pushNotifications,
        marketingEmails,
        twoFactorAuth,
      };
      const nextMetadata = { ...profileMetadata, settings: nextSettings };
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

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  if (isLoading) {
    return (
      <div style={{ padding: 'var(--space-6)', maxWidth: '800px', margin: '0 auto' }}>
        <EmptyState
          variant="custom"
          title="Loading settings..."
          description="Fetching your saved preferences."
        />
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ padding: 'var(--space-6)', maxWidth: '800px', margin: '0 auto' }}>
        <EmptyState
          variant="error"
          title="Failed to load settings"
          description={loadError}
          action={{
            label: 'Retry',
            onClick: () => void loadSettings(),
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 'var(--space-8)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}
          >
            Settings
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage your account and application preferences
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <button
            className="text-sm font-medium px-4 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-primary)',
              minHeight: '44px',
            }}
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          <div aria-live="polite" style={{ minHeight: 18 }}>
            {saveSuccess && (
              <span style={{ color: '#008060', fontSize: 12 }}>Saved.</span>
            )}
            {saveError && (
              <span style={{ color: '#d72c0d', fontSize: 12 }}>{saveError}</span>
            )}
          </div>
        </div>
      </div>

      {/* Butler Tip */}
      <ButlerTip page="Settings" className="mb-6" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        {/* Account Settings */}
        <SettingsSection
          title="Account"
          description="Manage your account information"
        >
          <SettingsList separatorStyle="border" spacing="default">
            <SettingsItem
              id="profile"
              label="Profile Information"
              description="Update your name, email, and profile picture"
            >
              <button 
                className="text-sm font-medium px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  minHeight: '44px'
                }}
              >
                Edit
              </button>
            </SettingsItem>
            <SettingsItem
              id="password"
              label="Password"
              description="Change your password"
            >
              <button 
                className="text-sm font-medium px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  minHeight: '44px'
                }}
              >
                Change
              </button>
            </SettingsItem>
          </SettingsList>
        </SettingsSection>

        {/* Appearance Settings */}
        <SettingsSection
          title="Appearance"
          description="Customize how the app looks"
        >
          <SettingsList separatorStyle="border" spacing="default">
            <SettingsToggleItem
              id="darkMode"
              label="Dark Mode"
              description="Use dark theme across the application"
              checked={darkMode}
              onChange={setDarkMode}
            />
          </SettingsList>
        </SettingsSection>

        {/* Notification Settings */}
        <SettingsSection
          title="Notifications"
          description="Choose what notifications you receive"
        >
          <SettingsList separatorStyle="border" spacing="default">
            <SettingsToggleItem
              id="emailNotifications"
              label="Email Notifications"
              description="Receive important updates via email"
              checked={emailNotifications}
              onChange={setEmailNotifications}
            />
            <SettingsToggleItem
              id="pushNotifications"
              label="Push Notifications"
              description="Receive push notifications in your browser"
              checked={pushNotifications}
              onChange={setPushNotifications}
            />
            <SettingsToggleItem
              id="marketingEmails"
              label="Marketing Emails"
              description="Receive news, tips, and product updates"
              checked={marketingEmails}
              onChange={setMarketingEmails}
            />
          </SettingsList>
        </SettingsSection>

        {/* Security Settings */}
        <SettingsSection
          title="Security"
          description="Protect your account"
        >
          <SettingsList separatorStyle="border" spacing="default">
            <SettingsToggleItem
              id="twoFactorAuth"
              label="Two-Factor Authentication"
              description="Add an extra layer of security to your account"
              checked={twoFactorAuth}
              onChange={setTwoFactorAuth}
            />
            <SettingsItem
              id="sessions"
              label="Active Sessions"
              description="Manage devices where you're logged in"
            >
              <button 
                className="text-sm font-medium px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  minHeight: '44px'
                }}
              >
                View
              </button>
            </SettingsItem>
          </SettingsList>
        </SettingsSection>

        {/* Platforms / Integrations */}
        <SettingsSection
          title="Plateformes"
          description="Connecte tes comptes pour synchroniser tes données"
        >
          {/* OnlyFans - Special bookmarklet connection */}
          <div className="mb-4">
            <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              OnlyFans (connexion mobile)
            </div>
            {ofStatus.connected ? (
              <div 
                className="rounded-lg p-4 border"
                style={{ 
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderColor: 'rgba(34, 197, 94, 0.3)'
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔥</span>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div className="flex-1">
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      OnlyFans connecté
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      ID: {ofStatus.authId} • {ofStatus.linkedAt ? new Date(ofStatus.linkedAt).toLocaleDateString('fr-FR') : '—'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBookmarklet(true)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{ 
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    Reconnecter
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className="rounded-lg p-4 border"
                style={{ 
                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                  borderColor: 'rgba(251, 191, 36, 0.3)'
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔥</span>
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <div className="flex-1">
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      OnlyFans non connecté
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Connexion via Safari mobile requise
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBookmarklet(true)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{ 
                      backgroundColor: '#00AFF0',
                      color: 'white'
                    }}
                  >
                    Connecter
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Other platforms - Link to integrations page */}
          <SettingsList separatorStyle="border" spacing="default">
            <SettingsItem
              id="integrations"
              label="Autres plateformes"
              description="Instagram, TikTok, Twitter/X, Reddit, Fansly"
            >
              <a 
                href="/integrations"
                className="text-sm font-medium px-4 py-2 rounded-lg inline-flex items-center gap-2"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  minHeight: '44px',
                  textDecoration: 'none'
                }}
              >
                Gérer
              </a>
            </SettingsItem>
          </SettingsList>

          {/* Bookmarklet Modal */}
          {showBookmarklet && session?.user?.id && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
              onClick={(e) => e.target === e.currentTarget && setShowBookmarklet(false)}
            >
              <div className="relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => setShowBookmarklet(false)}
                  className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700"
                >
                  ✕
                </button>
                <BookmarkletSetup userId={session.user.id} />
              </div>
            </div>
          )}
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection
          title="Zone dangereuse"
          description="Actions irréversibles"
        >
          <SettingsList separatorStyle="border" spacing="default">
            <SettingsItem
              id="export"
              label="Exporter mes données"
              description="Télécharge toutes tes données au format JSON"
            >
              <button 
                className="text-sm font-medium px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  minHeight: '44px'
                }}
              >
                Exporter
              </button>
            </SettingsItem>
            <SettingsItem
              id="delete"
              label="Supprimer mon compte"
              description="Supprime définitivement ton compte et toutes tes données"
            >
              <button 
                className="text-sm font-medium px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: '#dc2626',
                  color: 'white',
                  minHeight: '44px'
                }}
              >
                Supprimer
              </button>
            </SettingsItem>
          </SettingsList>
        </SettingsSection>
      </div>
    </div>
  );
}
