// OnlyFans DM and Mass Messages Types

export interface OfSession {
  id: string;
  userId: string;
  encryptedCookies: string; // AES-GCM encrypted
  isActive: boolean;
  requiresAction: boolean; // 2FA/CAPTCHA needed
  lastSyncAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfMassMessageCampaign {
  id: string;
  userId: string;
  name: string;
  content: {
    text: string;
    media?: string[]; // Media URLs
  };
  audienceFilter: AudienceFilter;
  status: 'draft' | 'scheduled' | 'sending' | 'paused' | 'completed' | 'failed';
  stats: {
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    queuedCount: number;
  };
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfMassMessageRecipient {
  id: string;
  campaignId: string;
  platformUserId: string; // OF user ID
  username: string;
  status: 'queued' | 'sending' | 'sent' | 'failed';
  error?: string;
  sentAt?: Date;
  createdAt: Date;
}

export interface AudienceFilter {
  type: 'all' | 'custom' | 'segment';
  segments?: AudienceSegment[];
  customFilters?: CustomFilter[];
  combinationLogic?: 'AND' | 'OR';
}

export type AudienceSegment = 
  | 'active_subscribers'      // Currently subscribed
  | 'new_subscribers_7d'      // Subscribed in last 7 days
  | 'new_subscribers_24h'     // Subscribed in last 24 hours
  | 'expired_30d'            // Expired in last 30 days
  | 'expired_7d'             // Expired in last 7 days
  | 'top_spenders'           // Top 20% by revenue
  | 'big_spenders'           // $100+ lifetime
  | 'whales'                 // $500+ lifetime
  | 'silent_7d'              // No interaction in 7 days
  | 'silent_30d'             // No interaction in 30 days
  | 'vip_fans'               // Marked as VIP
  | 'free_subscribers'       // Free subs only
  | 'paid_subscribers'       // Paid subs only
  | 'never_purchased'        // Never bought PPV/tips
  | 'ppv_buyers'             // Bought PPV before
  | 'recent_tippers';        // Tipped in last 7 days

export interface CustomFilter {
  field: 'spent_total' | 'spent_30d' | 'messages_sent' | 'subscription_price' | 'days_subscribed';
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  value: number;
}

export interface OfMessage {
  id: string;
  conversationId: string;
  platformMessageId: string;
  senderId: string;
  content: {
    text?: string;
    media?: Array<{
      type: 'photo' | 'video' | 'audio';
      url: string;
      thumbnail?: string;
    }>;
    tip?: number;
  };
  isFromCreator: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface OfConversation {
  id: string;
  userId: string;
  platformUserId: string; // OF user ID
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isSubscribed: boolean;
  subscriptionPrice?: number;
  subscriptionExpiry?: Date;
  totalSpent: number;
  totalTips: number;
  totalPPVPurchases: number;
  lastPurchaseAt?: Date;
  lastMessageAt: Date;
  lastSeenAt?: Date;
  unreadCount: number;
  tags: string[]; // VIP, whale, active, etc.
  customLabels?: string[]; // User-defined labels
  welcomeMessageSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Rate limiting configuration
export interface RateLimitConfig {
  dm: {
    messagesPerMinute: number;  // 1-2
    messagesPerDay: number;     // 30-60
    delayBetweenMessages: {     // 1.5-3.5s randomized
      min: number;
      max: number;
    };
  };
  campaign: {
    batchSize: number;          // 10-20
    pauseBetweenBatches: {      // 30-90s
      min: number;
      max: number;
    };
    errorThreshold: number;     // Stop if > X%
  };
}

// Default rate limits
export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  dm: {
    messagesPerMinute: 1,
    messagesPerDay: 30,
    delayBetweenMessages: {
      min: 1500,
      max: 3500
    }
  },
  campaign: {
    batchSize: 10,
    pauseBetweenBatches: {
      min: 30000,
      max: 90000
    },
    errorThreshold: 0.1 // 10% error rate
  }
};

// Welcome message configuration
export interface WelcomeMessage {
  id: string;
  userId: string;
  name: string;
  enabled: boolean;
  trigger: 'new_subscriber' | 'new_follower' | 'resubscribe';
  delay: number; // Minutes after trigger
  content: {
    text: string;
    media?: string[];
  };
  audienceFilter?: AudienceFilter;
  sentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// PPV (Pay-Per-View) content
export interface PPVContent {
  id: string;
  userId: string;
  name: string;
  price: number;
  content: {
    text: string;
    media: string[]; // Required for PPV
  };
  previewMedia?: string; // Blurred/preview image
  soldCount: number;
  revenue: number;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics
export interface FanAnalytics {
  userId: string;
  period: '24h' | '7d' | '30d' | 'all';
  metrics: {
    totalFans: number;
    newFans: number;
    expiredFans: number;
    activeConversations: number;
    revenue: {
      subscriptions: number;
      tips: number;
      ppv: number;
      total: number;
    };
    averageSpendPerFan: number;
    topSpenders: Array<{
      username: string;
      totalSpent: number;
      lastPurchase: Date;
    }>;
    conversionRates: {
      freeToSaid: number;
      subscriberToPurchaser: number;
      ppvOpenRate: number;
    };
  };
}

// API Request/Response types
export interface SendMessageRequest {
  conversationId: string;
  content: {
    text: string;
    media?: string[];
  };
  ppv?: {
    price: number;
    previewText?: string;
  };
}

export interface CreateCampaignRequest {
  name: string;
  content: {
    text: string;
    media?: string[];
  };
  ppv?: {
    price: number;
    previewText?: string;
  };
  audienceFilter: AudienceFilter;
  excludeRecentMessages?: number; // Exclude fans messaged in last X hours
  scheduledAt?: string;
  testMode?: boolean; // Send to small test group first
}

export interface CampaignMetrics {
  campaignId: string;
  status: OfMassMessageCampaign['status'];
  stats: OfMassMessageCampaign['stats'];
  performance: {
    deliveryRate: number;
    avgDeliveryTime: number;
    errorRate: number;
  };
  topErrors?: Array<{
    error: string;
    count: number;
  }>;
}