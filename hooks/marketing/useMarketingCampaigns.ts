'use client';

/**
 * Marketing Campaigns Hook
 * 
 * Manages campaign data fetching and mutations
 */

import { useState } from 'react';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import { useInternalSWR } from '@/lib/swr';

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
export type CampaignChannel = 'email' | 'dm' | 'sms' | 'push';
export type CampaignGoal = 'engagement' | 'conversion' | 'retention';

export interface MarketingCampaign {
  id: string;
  name: string;
  status: CampaignStatus;
  channel: CampaignChannel;
  goal: CampaignGoal;
  audience: {
    segment: string;
    size: number;
  };
  stats?: {
    sent: number;
    opened?: number;
    clicked?: number;
    converted: number;
    openRate: number; // 0..1
    clickRate?: number; // 0..1
    conversionRate?: number; // 0..1
  };
  createdAt: string;
  scheduledAt?: string;
  aiGenerated?: boolean;
}

export interface CreateMarketingCampaignInput {
  name: string;
  status?: CampaignStatus;
  channel: CampaignChannel;
  goal: CampaignGoal;
  audienceSegment: string;
  audienceSize?: number;
  message: Record<string, unknown>;
  schedule?: Record<string, unknown>;
}

export interface UpdateMarketingCampaignInput {
  name?: string;
  status?: CampaignStatus;
  channel?: CampaignChannel;
  goal?: CampaignGoal;
  audienceSegment?: string;
  audienceSize?: number;
  message?: Record<string, unknown>;
  schedule?: Record<string, unknown>;
}

interface UseMarketingCampaignsOptions {
  status?: CampaignStatus | 'all';
  channel?: CampaignChannel | 'all';
  limit?: number;
  offset?: number;
}

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: unknown;
  meta?: unknown;
};

type CampaignListResponse = {
  items: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

const fetchCampaigns = (url: string) => internalApiFetch<ApiEnvelope<CampaignListResponse>>(url);

function normalizeRate(value: unknown): number {
  const n = typeof value === 'number' ? value : 0;
  // API routes return rates as percentages (0..100); legacy mocks use fractions (0..1).
  return n > 1 ? n / 100 : n;
}

function pickScheduleDate(raw: any): string | undefined {
  const schedule = raw?.schedule;
  if (!schedule || typeof schedule !== 'object') return undefined;

  const candidate =
    schedule.sendAt ??
    schedule.scheduledAt ??
    schedule.scheduled_for ??
    schedule.scheduledFor ??
    schedule.publishAt ??
    schedule.date;

  return typeof candidate === 'string' ? candidate : undefined;
}

function mapCampaign(raw: any): MarketingCampaign {
  return {
    id: String(raw?.id ?? ''),
    name: String(raw?.name ?? ''),
    status: (raw?.status ?? 'draft') as CampaignStatus,
    channel: (raw?.channel ?? 'dm') as CampaignChannel,
    goal: (raw?.goal ?? 'engagement') as CampaignGoal,
    audience: {
      segment: String(raw?.audienceSegment ?? raw?.audience_segment ?? raw?.audience?.segment ?? 'All'),
      size: Number(raw?.audienceSize ?? raw?.audience_size ?? raw?.audience?.size ?? 0),
    },
    stats: raw?.stats
      ? {
          sent: Number(raw.stats.sent ?? 0),
          opened: raw.stats.opened !== undefined ? Number(raw.stats.opened ?? 0) : undefined,
          clicked: raw.stats.clicked !== undefined ? Number(raw.stats.clicked ?? 0) : undefined,
          converted: Number(raw.stats.converted ?? 0),
          openRate: normalizeRate(raw.stats.openRate),
          clickRate: raw.stats.clickRate !== undefined ? normalizeRate(raw.stats.clickRate) : undefined,
          conversionRate:
            raw.stats.conversionRate !== undefined ? normalizeRate(raw.stats.conversionRate) : undefined,
        }
      : undefined,
    createdAt: String(raw?.createdAt ?? raw?.created_at ?? new Date().toISOString()),
    scheduledAt: pickScheduleDate(raw),
    aiGenerated: Boolean(raw?.aiGenerated ?? false),
  };
}

export function useMarketingCampaigns(options: UseMarketingCampaignsOptions) {
  const { status, channel, limit = 50, offset = 0 } = options;
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  // Build query params
  const params = new URLSearchParams();
  if (status && status !== 'all') params.append('status', status);
  if (channel && channel !== 'all') params.append('channel', channel);
  params.set('limit', String(limit));
  params.set('offset', String(offset));

  const { data, error, mutate } = useInternalSWR<ApiEnvelope<CampaignListResponse>>(
    `/api/marketing/campaigns?${params.toString()}`,
    fetchCampaigns,
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  const createCampaign = async (input: CreateMarketingCampaignInput) => {
    setIsCreating(true);
    try {
      const result = await internalApiFetch<ApiEnvelope<any>>('/api/marketing/campaigns', {
        method: 'POST',
        body: input,
      });
      await mutate();
      return result.data ? mapCampaign(result.data) : null;
    } finally {
      setIsCreating(false);
    }
  };

  const updateCampaign = async (campaignId: string, updates: UpdateMarketingCampaignInput) => {
    setIsUpdating(true);
    try {
      const result = await internalApiFetch<ApiEnvelope<any>>(`/api/marketing/campaigns/${campaignId}`, {
        method: 'PUT',
        body: updates,
      });
      await mutate();
      return result.data ? mapCampaign(result.data) : null;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    setIsDeleting(true);
    try {
      await internalApiFetch(`/api/marketing/campaigns/${campaignId}`, { method: 'DELETE' });
      await mutate();
    } finally {
      setIsDeleting(false);
    }
  };

  const launchCampaign = async (campaignId: string, creatorId: string, scheduledFor?: string) => {
    setIsLaunching(true);
    try {
      const result = await internalApiFetch<any>(`/api/marketing/campaigns/${campaignId}/launch`, {
        method: 'POST',
        body: { creatorId, scheduledFor },
      });
      await mutate();
      return result;
    } finally {
      setIsLaunching(false);
    }
  };

  return {
    campaigns: (data?.data?.items || []).map(mapCampaign),
    pagination: data?.data?.pagination,
    isLoading: !error && !data,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    launchCampaign,
    isCreating,
    isUpdating,
    isDeleting,
    isLaunching,
    mutate,
  };
}
