/**
 * PlatformStatus Component
 * 
 * Displays connection status for all platform integrations with pulsing indicators
 * for connected platforms and static indicators for disconnected platforms.
 * 
 * Requirements: 8.2, 8.3, 8.4
 * @see .kiro/specs/beta-launch-ui-system/requirements.md
 * @see .kiro/specs/beta-launch-ui-system/design.md
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlatformStatusSkeleton } from './PlatformStatusSkeleton';
import './platform-status.css';
import { Card } from '@/components/ui/card';

interface Integration {
  id: number;
  provider: string;
  accountId: string;
  accountName: string;
  status: 'connected' | 'expired';
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PlatformStatusData {
  integrations: Integration[];
}

/**
 * Format last sync time in a human-readable format
 */
function formatLastSync(updatedAt: string): string {
  const date = new Date(updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
}

/**
 * Get display name for provider
 */
function getProviderDisplayName(provider: string): string {
  const names: Record<string, string> = {
    onlyfans: 'OnlyFans',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    reddit: 'Reddit'
  };
  return names[provider.toLowerCase()] || provider;
}

export function PlatformStatus() {
  const [data, setData] = useState<PlatformStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIntegrations() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/integrations/status', {
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch integrations');
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          setData(result.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching integrations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load integrations');
      } finally {
        setIsLoading(false);
      }
    }

    fetchIntegrations();
  }, []);

  if (isLoading) {
    return <PlatformStatusSkeleton />;
  }

  if (error) {
    return (
      <div className="platform-status-section">
        <div className="section-header">
          <h2 className="section-title">Platform Connections</h2>
        </div>
        <div className="platform-status-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const integrations = data?.integrations || [];
  const hasIntegrations = integrations.length > 0;

  return (
    <div className="platform-status-section">
      <div className="section-header">
        <h2 className="section-title">Platform Connections</h2>
        <Link href="/integrations" className="manage-link">
          Manage
        </Link>
      </div>

      {!hasIntegrations ? (
        <div className="platform-status-empty">
          <p className="empty-message">No platforms connected yet</p>
          <Link href="/integrations" className="btn-secondary">
            Connect Platform
          </Link>
        </div>
      ) : (
        <div className="platform-status-grid">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <div className="platform-status-header">
                <div className="platform-info">
                  <div className="platform-name">
                    {getProviderDisplayName(integration.provider)}
                  </div>
                  <div className="platform-account">
                    {integration.accountName}
                  </div>
                </div>
                <div className="platform-status-indicator">
                  <span
                    className={`status-dot ${
                      integration.status === 'connected' ? 'status-connected' : 'status-disconnected'
                    }`}
                    aria-label={integration.status === 'connected' ? 'Connected' : 'Not Connected'}
                  />
                  <span className="status-text">
                    {integration.status === 'connected' ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
              </div>

              {integration.status === 'connected' && (
                <div className="platform-status-footer">
                  <span className="last-sync">
                    Last sync: {formatLastSync(integration.updatedAt)}
                  </span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
