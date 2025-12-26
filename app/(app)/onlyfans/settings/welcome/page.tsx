'use client';

import useSWR from 'swr';
import { AlertCircle, MessageCircle } from 'lucide-react';
import { ShopifyPageLayout } from '@/components/layout/ShopifyPageLayout';
import { ShopifyEmptyState } from '@/components/ui/shopify';
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

export default function OnlyFansWelcomeMessagesPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/integrations/status', fetcher);

  const integrations = data?.data?.integrations ?? data?.integrations ?? [];
  const onlyFansIntegration = integrations.find((integration) => integration.provider === 'onlyfans');
  const isConnected = Boolean(
    onlyFansIntegration && (onlyFansIntegration.status === 'connected' || onlyFansIntegration.isConnected)
  );

  if (isLoading) {
    return (
      <ShopifyPageLayout
        title="Welcome Messages"
        subtitle="Automate your new subscriber onboarding"
      >
        <ShopifyEmptyState
          title="Loading welcome messages..."
          description="Checking your OnlyFans connection."
          icon={MessageCircle}
        />
      </ShopifyPageLayout>
    );
  }

  if (error) {
    return (
      <ShopifyPageLayout
        title="Welcome Messages"
        subtitle="Automate your new subscriber onboarding"
      >
        <ShopifyEmptyState
          title="Failed to load welcome messages"
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
        title="Welcome Messages"
        subtitle="Automate your new subscriber onboarding"
      >
        <ShopifyEmptyState
          title="Connect OnlyFans to enable welcome messages"
          description="Link your account to start automating new subscriber onboarding."
          icon={MessageCircle}
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
      title="Welcome Messages"
      subtitle="Automate your new subscriber onboarding"
    >
      <ShopifyEmptyState
        title="Welcome messages are not available yet"
        description="We are wiring this screen to your live onboarding data."
        icon={MessageCircle}
      />
    </ShopifyPageLayout>
  );
}
