'use client';

/**
 * Settings Page - Design System Refactored
 * Requirements: 11.1, 11.2, 11.3
 * 
 * Features:
 * - Uses SettingsLayout components with proper proximity rules
 * - Visual separators between items (Requirement 11.2)
 * - Design tokens applied throughout
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
  SettingsSection, 
  SettingsList, 
  SettingsToggleItem,
  SettingsItem
} from '@/components/ui/SettingsLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  Settings as SettingsIcon
} from 'lucide-react';

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
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
      </div>
    </div>
  );
}
