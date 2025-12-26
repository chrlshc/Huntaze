'use client';

import useSWR from 'swr';
import { AlertCircle, Sparkles } from 'lucide-react';
import { ShopifyPageLayout } from '@/components/layout/ShopifyPageLayout';
import { ShopifyEmptyState } from '@/components/ui/shopify/ShopifyEmptyState';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';

interface IntegrationStatus {
  provider: string;
  status?: string;
  isConnected?: boolean;
}

interface IntegrationsStatusResponse {
  data?: {
    integrations?: IntegrationStatus[];
  };
  integrations?: IntegrationStatus[];
}

const fetcher = (url: string) => internalApiFetch<IntegrationsStatusResponse>(url);

export default function OnlyFansSmartMessagesPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/integrations/status', fetcher);

  const integrations = data?.data?.integrations ?? data?.integrations ?? [];
  const onlyFansIntegration = integrations.find((integration) => integration.provider === 'onlyfans');
  const isConnected = Boolean(
    onlyFansIntegration && (onlyFansIntegration.status === 'connected' || onlyFansIntegration.isConnected)
  );

  if (isLoading) {
    return (
      <ShopifyPageLayout
        title="Smart Messages"
        subtitle="Automate and optimize your messaging with AI"
      >
        <ShopifyEmptyState
          title="Loading Smart Messages..."
          description="Checking your OnlyFans connection."
          icon={Sparkles}
        />
      </ShopifyPageLayout>
    );
  }

  if (error) {
    return (
      <ShopifyPageLayout
        title="Smart Messages"
        subtitle="Automate and optimize your messaging with AI"
      >
        <ShopifyEmptyState
          title="Failed to load Smart Messages"
          description={error instanceof Error ? error.message : 'Please try again.'}
          icon={AlertCircle}
          action={{ label: 'Retry', onClick: () => void mutate() }}
        />
      </ShopifyPageLayout>
    );
  }

  if (!isConnected) {
    return (
      <ShopifyPageLayout
        title="Smart Messages"
        subtitle="Automate and optimize your messaging with AI"
      >
        <ShopifyEmptyState
          title="Connect OnlyFans to enable Smart Messages"
          description="Link your account to access AI-assisted messaging automations."
          icon={Sparkles}
          action={{
            label: 'Go to integrations',
            onClick: () => {
              window.location.href = '/integrations';
            },
          }}
        />
      </ShopifyPageLayout>
    );
  }

  return (
    <ShopifyPageLayout
      title="Smart Messages"
      subtitle="Automate and optimize your messaging with AI"
    >
      <ShopifyEmptyState
        title="Smart Messages is not available yet"
        description="We are wiring this page to your live messaging data."
        icon={Sparkles}
      />
    </ShopifyPageLayout>
  );
}
