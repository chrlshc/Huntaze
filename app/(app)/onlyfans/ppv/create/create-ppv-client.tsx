'use client';

import useSWR from 'swr';
import { EmptyState } from '@/components/ui/EmptyState';
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

export default function CreatePPVClient() {
  const { data, error, isLoading, mutate } = useSWR('/api/integrations/status', fetcher);

  const integrations = data?.data?.integrations ?? data?.integrations ?? [];
  const onlyFansIntegration = integrations.find((integration) => integration.provider === 'onlyfans');
  const isConnected = Boolean(
    onlyFansIntegration && (onlyFansIntegration.status === 'connected' || onlyFansIntegration.isConnected)
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <EmptyState
          variant="custom"
          title="Loading PPV setup..."
          description="Checking your OnlyFans connection."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          variant="error"
          title="Failed to load PPV setup"
          description={error instanceof Error ? error.message : 'Please try again.'}
          action={{ label: 'Retry', onClick: () => void mutate() }}
        />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="p-6">
        <EmptyState
          variant="no-data"
          title="Connect OnlyFans to create PPVs"
          description="Link your account to start building PPV campaigns."
          action={{ label: 'Go to integrations', onClick: () => (window.location.href = '/integrations') }}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <EmptyState
        variant="no-data"
        title="PPV creation isn’t available yet"
        description="We are wiring this screen to your PPV campaign pipeline."
        action={{ label: 'Back to PPV', onClick: () => (window.location.href = '/onlyfans/ppv') }}
      />
    </div>
  );
}
