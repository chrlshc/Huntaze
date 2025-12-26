'use client';

/**
 * Automations - Flows Page
 * Manage automation workflows and sequences
 */

export const dynamic = 'force-dynamic';

import useSWR from 'swr';
import { ShopifyPageLayout } from '@/components/layout/ShopifyPageLayout';
import {
  ShopifySectionHeader,
  ShopifyCard,
  ShopifyButton,
  ShopifyEmptyState,
} from '@/components/ui/shopify';
import { Plus, RefreshCw, Settings, Zap } from 'lucide-react';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import { automationsListResponseSchema } from '@/lib/schemas/api-responses';

interface AutomationStep {
  type: 'trigger' | 'condition' | 'action';
  name: string;
}

interface AutomationFlow {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft';
  steps?: AutomationStep[];
}

interface AutomationsResponse {
  success: boolean;
  data?: AutomationFlow[];
}

const fetcher = (url: string) =>
  internalApiFetch<AutomationsResponse>(url, { schema: automationsListResponseSchema });

function extractTrigger(steps?: AutomationStep[]): string {
  const trigger = steps?.find((step) => step.type === 'trigger');
  return trigger?.name || '—';
}

export default function AutomationFlowsPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/automations', fetcher);
  const flows = data?.data ?? [];

  if (isLoading) {
    return (
      <ShopifyPageLayout
        title="Automation Flows"
        subtitle="Create and manage automated workflows"
      >
        <ShopifyCard>
          <ShopifyEmptyState
            title="Loading automation flows..."
            description="Fetching your saved workflows."
            icon={Zap}
          />
        </ShopifyCard>
      </ShopifyPageLayout>
    );
  }

  if (error) {
    return (
      <ShopifyPageLayout
        title="Automation Flows"
        subtitle="Create and manage automated workflows"
      >
        <ShopifyCard>
          <ShopifyEmptyState
            title="Failed to load flows"
            description={error instanceof Error ? error.message : 'Please try again.'}
            icon={Zap}
            action={{ label: 'Retry', onClick: () => void mutate() }}
          />
        </ShopifyCard>
      </ShopifyPageLayout>
    );
  }

  return (
    <ShopifyPageLayout
      title="Automation Flows"
      subtitle="Create and manage automated workflows"
    >
      <ShopifyCard>
        <div className="p-6">
          <ShopifySectionHeader
            title="Active Flows"
            actions={
              <>
                <ShopifyButton variant="secondary" size="sm" onClick={() => void mutate()}>
                  <RefreshCw className="w-4 h-4" />
                </ShopifyButton>
                <ShopifyButton
                  size="sm"
                  onClick={() => {
                    window.location.href = '/automations/new';
                  }}
                >
                  <Plus className="w-4 h-4" />
                  New Flow
                </ShopifyButton>
              </>
            }
          />

          <div className="space-y-4">
            {flows.length === 0 ? (
              <ShopifyEmptyState
                title="No flows yet"
                description="Create your first automation to see it here."
                icon={Zap}
                action={{ label: 'Create automation', onClick: () => (window.location.href = '/automations/new') }}
                variant="compact"
              />
            ) : (
              flows.map((flow) => (
                <div key={flow.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium">{flow.name}</h4>
                    <p className="text-sm text-gray-500">Trigger: {extractTrigger(flow.steps)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      flow.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {flow.status === 'active' ? 'Active' : 'Paused'}
                    </span>
                    <ShopifyButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        window.location.href = `/automations/${flow.id}`;
                      }}
                    >
                      <Settings className="w-4 h-4" />
                    </ShopifyButton>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </ShopifyCard>
    </ShopifyPageLayout>
  );
}
