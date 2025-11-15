/**
 * Marketing Campaign Types
 */

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
export type CampaignChannel = 'email' | 'dm' | 'sms' | 'push';
export type CampaignGoal = 'engagement' | 'retention' | 'revenue' | 'acquisition';

export interface CampaignAudience {
  segment: string;
  size: number;
  criteria?: Record<string, any>;
}

export interface CampaignMessage {
  subject?: string;
  body: string;
  template?: string;
  variables?: Record<string, string>;
}

export interface CampaignStats {
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

export interface CampaignRecipient {
  id: string;
  name: string;
  status: 'pending' | 'sent' | 'opened' | 'clicked' | 'converted' | 'failed';
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  convertedAt?: string;
  error?: string;
}

export interface Campaign {
  id: string;
  creatorId: string;
  name: string;
  status: CampaignStatus;
  channel: CampaignChannel;
  goal: CampaignGoal;
  audience: CampaignAudience;
  message: CampaignMessage;
  stats: CampaignStats | null;
  recipients?: CampaignRecipient[];
  createdAt: string;
  updatedAt?: string;
  launchedAt?: string | null;
  scheduledFor?: string | null;
  completedAt?: string | null;
}

export interface CreateCampaignInput {
  creatorId: string;
  name: string;
  channel: CampaignChannel;
  goal: CampaignGoal;
  audience: CampaignAudience;
  message: CampaignMessage;
}

export interface UpdateCampaignInput {
  name?: string;
  channel?: CampaignChannel;
  goal?: CampaignGoal;
  audience?: CampaignAudience;
  message?: CampaignMessage;
  status?: CampaignStatus;
}

export interface LaunchCampaignInput {
  creatorId: string;
  scheduledFor?: string;
  notifyAudience?: boolean;
}

export interface LaunchCampaignResponse {
  id: string;
  status: 'active' | 'scheduled';
  launchedAt: string | null;
  scheduledFor: string | null;
  audienceSize: number;
  estimatedReach: number;
  notifyAudience: boolean;
  createdBy: string;
  updatedAt: string;
}

// API Response Types
export interface CampaignsListResponse {
  campaigns: Campaign[];
  metadata: {
    total: number;
    filtered: number;
    lastUpdated: string;
  };
}

export interface CampaignResponse {
  campaign: Campaign;
}

export interface LaunchCampaignApiResponse {
  campaign: LaunchCampaignResponse;
  message: string;
}

export interface CampaignErrorResponse {
  error: string;
  type: 'AUTHENTICATION_ERROR' | 'VALIDATION_ERROR' | 'PERMISSION_ERROR' | 'NOT_FOUND_ERROR' | 'CONFLICT_ERROR' | 'RATE_LIMIT_ERROR' | 'API_ERROR';
  correlationId: string;
  userMessage?: string;
  retryable?: boolean;
}
