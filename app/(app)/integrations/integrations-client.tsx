'use client';

import { useEffect, lazy, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useIntegrations } from '@/hooks/useIntegrations';
import { IntegrationsGridSkeleton } from './IntegrationsGridSkeleton';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import './integrations.css';
import { Button } from "@/components/ui/button";

// Lazy load IntegrationCard component to reduce initial bundle size
const IntegrationCard = lazy(() => import('@/components/integrations/IntegrationCard').then(mod => ({ default: mod.IntegrationCard })));

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
      <div className="integrations-container">
        <div className="integrations-header">
          <h1 className="integrations-title">Integrations</h1>
          <p className="integrations-subtitle">
            Connect your social media and content platform accounts to manage everything in one place.
          </p>
        </div>
        <IntegrationsGridSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="integrations-container">
        <div className="integrations-header">
          <h1 className="integrations-title">Integrations</h1>
          <p className="integrations-subtitle">
            Connect your social media and content platform accounts to manage everything in one place.
          </p>
        </div>
        <div className="integrations-error">
          <div className="integrations-error-content">
            <AlertCircle className="integrations-error-icon" />
            <h2 className="integrations-error-title">Failed to load integrations</h2>
            <p className="integrations-error-message">{error}</p>
            <Button 
              variant="primary" 
              onClick={() => window.location.reload()}
              className="integrations-error-retry"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="integrations-container">
      <div className="integrations-header">
        <h1 className="integrations-title">Integrations</h1>
        <p className="integrations-subtitle">
          Connect your social media and content platform accounts to manage everything in one place.
        </p>
      </div>

      <div className="integrations-grid">
        <Suspense fallback={<IntegrationsGridSkeleton />}>
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
        </Suspense>
      </div>

      {integrations.length === 0 && (
        <div className="integrations-empty">
          <p>
            No integrations connected yet. Click "Add app" on any card above to get started.
          </p>
        </div>
      )}
    </div>
  );
}

export default function IntegrationsClient() {
  return (
    <ToastProvider>
      <ContentPageErrorBoundary pageName="Integrations">
        <IntegrationsContent />
      </ContentPageErrorBoundary>
    </ToastProvider>
  );
}
