'use client';

import React, { useState } from 'react';
import { Loader2, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IntegrationIcon } from './IntegrationIcon';
import { IntegrationStatus, type ConnectionStatus } from './IntegrationStatus';
import { useToast } from '@/components/ui/toast';
import { Button } from "@/components/ui/button";

export interface IntegrationCardProps {
  provider?: 'instagram' | 'tiktok' | 'reddit' | 'onlyfans' | string;
  isConnected?: boolean;
  account?: {
    providerAccountId: string;
    metadata?: Record<string, any>;
    expiresAt?: Date;
    createdAt: Date;
  };
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnect?: () => void;
  className?: string;
  showAddAnother?: boolean;
  name?: string;
  description?: string;
  logo?: string;
  status?: string;
  badges?: Array<{ label: string; tone?: string }>;
  accentColor?: string;
  href?: string;
  id?: string;
}

const providerInfo = {
  instagram: {
    name: 'Instagram',
    description: 'Connect your Instagram Business account to manage posts and analytics.',
  },
  tiktok: {
    name: 'TikTok',
    description: 'Connect your TikTok account to schedule videos and track performance.',
  },
  reddit: {
    name: 'Reddit',
    description: 'Connect your Reddit account to manage posts and engage with communities.',
  },
  onlyfans: {
    name: 'OnlyFans',
    description: 'Connect your OnlyFans account to manage content and track earnings.',
  },
};

function getConnectionStatus(
  isConnected: boolean,
  expiresAt?: Date
): ConnectionStatus {
  if (!isConnected) return 'disconnected';
  if (expiresAt && new Date() > expiresAt) return 'expired';
  return 'connected';
}

export function IntegrationCard({
  provider = 'instagram',
  isConnected = false,
  account,
  onConnect,
  onDisconnect,
  onReconnect,
  className,
  showAddAnother = false,
  name,
  description,
}: IntegrationCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { showToast } = useToast();
  
  const providerKey = (provider as keyof typeof providerInfo) ?? 'instagram';
  const defaultInfo = providerInfo[providerKey];
  const info = {
    name: name ?? defaultInfo?.name ?? providerKey,
    description: description ?? defaultInfo?.description ?? '',
  };
  const iconProvider: 'instagram' | 'tiktok' | 'reddit' | 'onlyfans' =
    provider === 'instagram' || provider === 'tiktok' || provider === 'reddit' || provider === 'onlyfans'
      ? provider
      : 'instagram';
  const status = getConnectionStatus(isConnected, account?.expiresAt);

  const handleConnect = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      await (onConnect?.() ?? Promise.resolve());
      // Success toast will be shown after OAuth redirect
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      setActionError(errorMessage);
      showToast({
        title: `Failed to connect ${info.name}`,
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm(`Are you sure you want to disconnect ${info.name}?`)) {
      return;
    }
    
    setIsLoading(true);
    setActionError(null);
    try {
      await (onDisconnect?.() ?? Promise.resolve());
      showToast({
        title: `${info.name} disconnected`,
        description: 'Your account has been disconnected successfully.',
        variant: 'success',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect';
      setActionError(errorMessage);
      showToast({
        title: `Failed to disconnect ${info.name}`,
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReconnect = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      await (onReconnect?.() ?? Promise.resolve());
      // Success toast will be shown after OAuth redirect
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reconnect';
      setActionError(errorMessage);
      showToast({
        title: `Failed to reconnect ${info.name}`,
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <article
      className={cn(
        'integration-card group relative flex h-full flex-col',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <IntegrationIcon provider={iconProvider} size="md" />

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{info.name}</h3>
            <IntegrationStatus status={status} />
          </div>
          
          {account?.metadata?.username && (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              @{account.metadata.username}
            </p>
          )}
          
          {account?.createdAt && status === 'connected' && (
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Connected {new Date(account.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{info.description}</p>

      {actionError && (
        <div className="mt-4 rounded-lg p-3" style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.3)' 
        }}>
          <p className="text-xs" style={{ color: 'var(--accent-error)' }}>{actionError}</p>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        {status === 'disconnected' && (
          <Button 
            variant="primary" 
            onClick={handleConnect} 
            disabled={isLoading} 
            style={{
              background: 'var(--accent-primary)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--button-radius)',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => !isLoading && (e.currentTarget.style.background = 'var(--accent-primary-hover)')}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = 'var(--accent-primary)')}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Add app'
            )}
          </Button>
        )}

        {status === 'connected' && (
          <>
            {showAddAnother && (
              <Button 
                variant="primary" 
                onClick={handleConnect} 
                disabled={isLoading} 
                style={{
                  background: 'var(--accent-primary)',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--button-radius)',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => !isLoading && (e.currentTarget.style.background = 'var(--accent-primary-hover)')}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = 'var(--accent-primary)')}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add another'
                )}
          </Button>
            )}
            <Button 
              variant="primary" 
              onClick={handleDisconnect} 
              disabled={isLoading} 
              style={{
                border: '1px solid var(--border-default)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--button-radius)',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => !isLoading && (e.currentTarget.style.background = 'var(--bg-tertiary)')}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Disconnect
                </>
              )}
          </Button>
          </>
        )}

        {status === 'expired' && (
          <Button 
            variant="primary" 
            onClick={handleReconnect} 
            disabled={isLoading} 
            style={{
              background: 'var(--accent-warning)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--button-radius)',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Reconnecting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Reconnect
              </>
            )}
          </Button>
        )}

        {status === 'error' && (
          <Button 
            variant="primary" 
            onClick={handleReconnect} 
            disabled={isLoading} 
            style={{
              background: 'var(--accent-error)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--button-radius)',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Reconnecting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Reconnect
              </>
            )}
          </Button>
        )}
      </div>
    </article>
  );
}
