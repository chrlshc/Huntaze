'use client';

/**
 * Marketing Campaigns Hook
 * 
 * Manages campaign data fetching and mutations
 */

import useSWR from 'swr';
import { useState } from 'react';
import type { Campaign, CreateCampaignInput, UpdateCampaignInput } from '@/lib/types/marketing';

interface UseMarketingCampaignsOptions {
  creatorId: string;
  status?: string;
  channel?: string;
}

interface CampaignsResponse {
  campaigns: Campaign[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useMarketingCampaigns(options: UseMarketingCampaignsOptions) {
  const { creatorId, status, channel } = options;
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  // Build query params
  const params = new URLSearchParams({ creatorId });
  if (status) params.append('status', status);
  if (channel) params.append('channel', channel);

  const { data, error, mutate } = useSWR<CampaignsResponse>(
    `/api/marketing/campaigns?${params.toString()}`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30s
      revalidateOnFocus: true,
    }
  );

  const createCampaign = async (input: CreateCampaignInput) => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }

      const result = await response.json();
      await mutate(); // Refresh the list
      return result.campaign;
    } finally {
      setIsCreating(false);
    }
  };

  const updateCampaign = async (campaignId: string, updates: UpdateCampaignInput) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/marketing/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update campaign');
      }

      const result = await response.json();
      await mutate(); // Refresh the list
      return result.campaign;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/marketing/campaigns/${campaignId}?creatorId=${creatorId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete campaign');
      }

      await mutate(); // Refresh the list
    } finally {
      setIsDeleting(false);
    }
  };

  const launchCampaign = async (campaignId: string, scheduledFor?: string) => {
    setIsLaunching(true);
    try {
      const response = await fetch(`/api/marketing/campaigns/${campaignId}/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, scheduledFor }),
      });

      if (!response.ok) {
        throw new Error('Failed to launch campaign');
      }

      const result = await response.json();
      await mutate(); // Refresh the list
      return result.campaign;
    } finally {
      setIsLaunching(false);
    }
  };

  return {
    campaigns: data?.campaigns || [],
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
