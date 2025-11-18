'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useIntegrations } from '@/hooks/useIntegrations';
import { IntegrationCard } from '@/components/integrations/IntegrationCard';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { Loader2, AlertCircle } from 'lucide-react';

const AVAILABLE_PROVIDERS = ['instagram', 'tiktok', 'reddit', 'onlyfans'] as const;

function IntegrationsContent() {
  const { integrations, loading, error, connect, disconnect, reconnect } = useIntegrations();
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  // Handle OAuth callback messages
  useEffect(() => {
    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');
    const provider = searchParams.get('provider');
    const account = searchParams.get('account');

    if (success === 'true' && provider) {
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
      showToast({
        title: `${providerName} connected successfully`,
        description: account ? `Account ${account} is now connected` : undefined,
        variant: 'success',
      });
      
      // Clean up URL
      window.history.replaceState({}, '', '/integrations');
    } else if (errorParam && provider) {
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
      const errorMessages: Record<string, string> = {
        cancelled: 'Connection cancelled. You can try again anytime.',
        invalid_provider: 'Invalid provider selected.',
        missing_parameters: 'Missing required parameters from OAuth provider.',
        invalid_state: 'Security validation failed. Please try again.',
        invalid_code: 'Invalid authorization code. Please try again.',
        oauth_error: 'OAuth authentication failed. Please try again.',
        unknown: 'An unexpected error occurred. Please try again.',
      };
      
      showToast({
        title: `Failed to connect ${providerName}`,
        description: errorMessages[errorParam] || errorMessages.unknown,
        variant: 'error',
      });
      
      // Clean up URL
      window.history.replaceState({}, '', '/integrations');
    }
  }, [searchParams, showToast]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-content-secondary">Loading integrations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold text-content-primary">Failed to load integrations</h2>
          <p className="text-sm text-content-secondary">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-content-primary mb-2">Integrations</h1>
        <p className="text-content-secondary">
          Connect your social media and content platform accounts to manage everything in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AVAILABLE_PROVIDERS.map((provider) => {
          // Find all accounts for this provider
          const connectedAccounts = integrations.filter(
            (integration) => integration.provider === provider
          );

          // If no accounts connected, show a single card to add one
          if (connectedAccounts.length === 0) {
            return (
              <IntegrationCard
                key={provider}
                provider={provider}
                isConnected={false}
                onConnect={() => connect(provider)}
                onDisconnect={() => {}}
                onReconnect={() => {}}
              />
            );
          }

          // Show a card for each connected account
          return connectedAccounts.map((account) => (
            <IntegrationCard
              key={`${provider}-${account.providerAccountId}`}
              provider={provider}
              isConnected={true}
              account={{
                providerAccountId: account.providerAccountId,
                metadata: account.metadata,
                expiresAt: account.expiresAt,
                createdAt: account.createdAt,
              }}
              onConnect={() => connect(provider)}
              onDisconnect={() => disconnect(provider, account.providerAccountId)}
              onReconnect={() => reconnect(provider, account.providerAccountId)}
              showAddAnother={true}
            />
          ));
        })}
      </div>

      {integrations.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-content-secondary">
            No integrations connected yet. Click "Add app" on any card above to get started.
          </p>
        </div>
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <ToastProvider>
      <IntegrationsContent />
    </ToastProvider>
  );
}
