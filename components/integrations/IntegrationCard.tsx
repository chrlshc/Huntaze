'use client';

import { useState } from 'react';
import { Loader2, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IntegrationIcon } from './IntegrationIcon';
import { IntegrationStatus, type ConnectionStatus } from './IntegrationStatus';
import { useToast } from '@/components/ui/toast';

export interface IntegrationCardProps {
  provider: 'instagram' | 'tiktok' | 'reddit' | 'onlyfans';
  isConnected: boolean;
  account?: {
    providerAccountId: string;
    metadata?: Record<string, any>;
    expiresAt?: Date;
    createdAt: Date;
  };
  onConnect: () => void;
  onDisconnect: () => void;
  onReconnect: () => void;
  className?: string;
  showAddAnother?: boolean;
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
  provider,
  isConnected,
  account,
  onConnect,
  onDisconnect,
  onReconnect,
  className,
  showAddAnother = false,
}: IntegrationCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { showToast } = useToast();
  
  const info = providerInfo[provider];
  const status = getConnectionStatus(isConnected, account?.expiresAt);

  const handleConnect = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      await onConnect();
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
      await onDisconnect();
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
      await onReconnect();
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
        'group relative flex h-full flex-col rounded-2xl border border-border-subtle bg-surface-raised p-6 shadow-sm transition hover:border-border-strong hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <IntegrationIcon provider={provider} size="md" />

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-content-primary">{info.name}</h3>
            <IntegrationStatus status={status} />
          </div>
          
          {account?.metadata?.username && (
            <p className="text-xs text-content-subtle">
              @{account.metadata.username}
            </p>
          )}
          
          {account?.createdAt && status === 'connected' && (
            <p className="text-xs text-content-subtle">
              Connected {new Date(account.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm text-content-secondary">{info.description}</p>

      {actionError && (
        <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
          <p className="text-xs text-red-600 dark:text-red-400">{actionError}</p>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        {status === 'disconnected' && (
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Add app'
            )}
          </button>
        )}

        {status === 'connected' && (
          <>
            {showAddAnother && (
              <button
                onClick={handleConnect}
                disabled={isLoading}
                className={cn(
                  'flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add another'
                )}
              </button>
            )}
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className={cn(
                showAddAnother ? '' : 'flex-1',
                'inline-flex items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface-muted px-4 py-2 text-sm font-medium text-content-primary transition hover:bg-surface-raised hover:border-border-strong disabled:opacity-50 disabled:cursor-not-allowed'
              )}
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
            </button>
          </>
        )}

        {status === 'expired' && (
          <button
            onClick={handleReconnect}
            disabled={isLoading}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed'
            )}
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
          </button>
        )}

        {status === 'error' && (
          <button
            onClick={handleReconnect}
            disabled={isLoading}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
            )}
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
          </button>
        )}
      </div>
    </article>
  );
}
