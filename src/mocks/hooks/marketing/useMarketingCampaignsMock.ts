'use client';

/**
 * Mock Marketing Campaigns Hook
 * 
 * Provides mock data for marketing campaigns when database is not available
 */

import { useState, useEffect } from 'react';

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  channel: 'email' | 'dm' | 'sms' | 'push';
  goal: 'engagement' | 'conversion' | 'retention';
  audience: {
    segment: string;
    size: number;
  };
  stats?: {
    sent: number;
    openRate: number;
    converted: number;
  };
  createdAt: string;
}

interface UseMarketingCampaignsOptions {
  creatorId: string;
  status?: string;
  channel?: string;
}

// Mock data
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Summer Sale Announcement',
    status: 'active',
    channel: 'email',
    goal: 'conversion',
    audience: {
      segment: 'All Subscribers',
      size: 2450,
    },
    stats: {
      sent: 2450,
      openRate: 0.32,
      converted: 145,
    },
    createdAt: '2025-12-10T12:00:00Z',
  },
  {
    id: '2',
    name: 'New Product Launch',
    status: 'draft',
    channel: 'push',
    goal: 'engagement',
    audience: {
      segment: 'Active Users',
      size: 1850,
    },
    createdAt: '2025-12-14T14:30:00Z',
  },
  {
    id: '3',
    name: 'Holiday Special',
    status: 'scheduled',
    channel: 'sms',
    goal: 'retention',
    audience: {
      segment: 'VIP Customers',
      size: 750,
    },
    createdAt: '2025-12-13T09:15:00Z',
  },
  {
    id: '4',
    name: 'Customer Survey',
    status: 'completed',
    channel: 'email',
    goal: 'engagement',
    audience: {
      segment: 'All Subscribers',
      size: 2450,
    },
    stats: {
      sent: 2450,
      openRate: 0.28,
      converted: 412,
    },
    createdAt: '2025-12-01T10:00:00Z',
  },
];

export function useMarketingCampaignsMock(options: UseMarketingCampaignsOptions) {
  const { status, channel } = options;
  const [isLoading, setIsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Simulate API fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // Filter campaigns based on status and channel
        let filtered = [...mockCampaigns];
        
        if (status && status !== 'all') {
          filtered = filtered.filter(c => c.status === status);
        }
        
        if (channel && channel !== 'all') {
          filtered = filtered.filter(c => c.channel === channel);
        }
        
        setCampaigns(filtered);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
      }
    }, 800); // Simulate network delay

    return () => clearTimeout(timer);
  }, [status, channel]);

  // Mock mutations
  const createCampaign = async (input: any) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newCampaign: Campaign = {
      id: `${mockCampaigns.length + 1}`,
      name: input.name,
      status: input.status || 'draft',
      channel: input.channel,
      goal: input.goal,
      audience: {
        segment: input.audienceSegment,
        size: input.audienceSize || 0,
      },
      createdAt: new Date().toISOString(),
    };
    
    const updatedCampaigns = [...campaigns, newCampaign];
    setCampaigns(updatedCampaigns);
    setIsLoading(false);
    
    return newCampaign;
  };

  const updateCampaign = async (id: string, updates: any) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const campaignIndex = campaigns.findIndex(c => c.id === id);
    if (campaignIndex === -1) {
      setIsLoading(false);
      throw new Error('Campaign not found');
    }
    
    const updatedCampaign = {
      ...campaigns[campaignIndex],
      ...updates,
    };
    
    const updatedCampaigns = [...campaigns];
    updatedCampaigns[campaignIndex] = updatedCampaign as Campaign;
    setCampaigns(updatedCampaigns);
    setIsLoading(false);
    
    return updatedCampaign;
  };

  const deleteCampaign = async (id: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const updatedCampaigns = campaigns.filter(c => c.id !== id);
    setCampaigns(updatedCampaigns);
    setIsLoading(false);
  };

  const launchCampaign = async (id: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const campaignIndex = campaigns.findIndex(c => c.id === id);
    if (campaignIndex === -1) {
      setIsLoading(false);
      throw new Error('Campaign not found');
    }
    
    const updatedCampaign = {
      ...campaigns[campaignIndex],
      status: 'active',
      stats: {
        sent: campaigns[campaignIndex].audience.size,
        openRate: Math.random() * 0.4, // Random open rate between 0-40%
        converted: Math.floor(campaigns[campaignIndex].audience.size * Math.random() * 0.2), // Random conversions
      }
    };
    
    const updatedCampaigns = [...campaigns];
    updatedCampaigns[campaignIndex] = updatedCampaign as Campaign;
    setCampaigns(updatedCampaigns);
    setIsLoading(false);
    
    return updatedCampaign;
  };

  return {
    campaigns,
    isLoading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    launchCampaign,
    mutate: async () => {
      // No-op in mock
    },
  };
}
