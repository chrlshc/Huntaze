'use client';

/**
 * Content - Schedule Page
 * Schedule and manage content publication
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
import { Calendar, Clock, Plus, RefreshCw } from 'lucide-react';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';

interface ScheduledContentItem {
  id: string;
  title?: string;
  text?: string;
  platform?: string;
  status?: string;
  scheduledAt?: string;
}

interface ScheduledContentResponse {
  success: boolean;
  data?: {
    items: ScheduledContentItem[];
  };
}

const fetcher = (url: string) => internalApiFetch<ScheduledContentResponse>(url);

function formatScheduledAt(value?: string): string {
  if (!value) return 'Unscheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function ContentSchedulePage() {
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR('/api/content?status=scheduled&limit=50&offset=0', fetcher);

  const scheduledContent = data?.data?.items ?? [];

  if (isLoading) {
    return (
      <ShopifyPageLayout
        title="Content Schedule"
        subtitle="Plan and schedule your content across platforms"
      >
        <ShopifyCard>
          <ShopifyEmptyState
            title="Loading scheduled content..."
            description="Fetching your upcoming posts."
            icon={Clock}
          />
        </ShopifyCard>
      </ShopifyPageLayout>
    );
  }

  if (error) {
    return (
      <ShopifyPageLayout
        title="Content Schedule"
        subtitle="Plan and schedule your content across platforms"
      >
        <ShopifyCard>
          <ShopifyEmptyState
            title="Failed to load schedule"
            description={error instanceof Error ? error.message : 'Please try again.'}
            icon={Clock}
            action={{ label: 'Retry', onClick: () => void mutate() }}
          />
        </ShopifyCard>
      </ShopifyPageLayout>
    );
  }

  return (
    <ShopifyPageLayout
      title="Content Schedule"
      subtitle="Plan and schedule your content across platforms"
    >
      <ShopifyCard>
        <div className="p-6">
          <ShopifySectionHeader
            title="Scheduled Content"
            actions={
              <>
                <ShopifyButton variant="secondary" size="sm" onClick={() => void mutate()}>
                  <RefreshCw className="w-4 h-4" />
                </ShopifyButton>
                <ShopifyButton
                  size="sm"
                  onClick={() => {
                    window.location.href = '/content/editor';
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Schedule Post
                </ShopifyButton>
              </>
            }
          />

          <div className="space-y-4">
            {scheduledContent.length === 0 ? (
              <ShopifyEmptyState
                title="No scheduled posts"
                description="Schedule content to see it appear on your calendar."
                icon={Calendar}
                action={{
                  label: 'Create content',
                  onClick: () => {
                    window.location.href = '/content/editor';
                  },
                }}
                variant="compact"
              />
            ) : (
              scheduledContent.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                    <div>
                      <h4 className="font-medium">{post.title || post.text || 'Untitled post'}</h4>
                      <p className="text-sm text-gray-500">
                        {formatScheduledAt(post.scheduledAt)} • {post.platform || 'Platform'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      {(post.status || 'scheduled').toString().toUpperCase()}
                    </span>
                    <button className="p-1 hover:bg-gray-100 rounded" type="button">
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </ShopifyCard>

      <ShopifyCard>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Calendar View</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Content calendar visualization</p>
          </div>
        </div>
      </ShopifyCard>
    </ShopifyPageLayout>
  );
}
