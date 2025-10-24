// Test fixtures for Content Creation & AI Assistant system

export const mockMediaAssets = {
  photo: {
    id: 'photo-001',
    title: 'Summer Beach Collection',
    type: 'photo',
    status: 'published',
    tags: ['beach', 'summer', 'bikini', 'outdoor'],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:35:00Z',
    thumbnail: '/thumbnails/beach-collection.jpg',
    fullSize: '/images/beach-collection-full.jpg',
    metadata: {
      width: 1920,
      height: 1080,
      fileSize: 2048576, // 2MB
      format: 'JPEG',
      camera: 'Canon EOS R5',
      location: 'Malibu Beach, CA'
    },
    metrics: {
      views: 2450,
      likes: 189,
      comments: 23,
      shares: 12,
      revenue: 125.50,
      conversionRate: 0.08
    },
    compliance: {
      status: 'approved',
      scanDate: '2024-01-15T10:32:00Z',
      violations: []
    }
  },

  video: {
    id: 'video-002',
    title: 'Behind the Scenes - Photoshoot',
    type: 'video',
    status: 'draft',
    tags: ['bts', 'exclusive', 'photoshoot'],
    createdAt: '2024-01-14T15:45:00Z',
    updatedAt: '2024-01-14T16:20:00Z',
    thumbnail: '/thumbnails/bts-video.jpg',
    fullSize: '/videos/bts-photoshoot.mp4',
    metadata: {
      duration: 180, // 3 minutes
      width: 1920,
      height: 1080,
      fileSize: 52428800, // 50MB
      format: 'MP4',
      bitrate: 5000,
      fps: 30
    },
    metrics: {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      revenue: 0,
      conversionRate: 0
    },
    compliance: {
      status: 'pending',
      scanDate: '2024-01-14T15:47:00Z',
      violations: []
    }
  },

  story: {
    id: 'story-003',
    title: 'Daily Life Update',
    type: 'story',
    status: 'scheduled',
    tags: ['daily', 'personal', 'lifestyle'],
    createdAt: '2024-01-13T09:15:00Z',
    scheduledAt: '2024-01-16T18:00:00Z',
    thumbnail: '/thumbnails/daily-story.jpg',
    fullSize: '/stories/daily-update.jpg',
    metadata: {
      width: 1080,
      height: 1920, // Vertical format
      fileSize: 1048576, // 1MB
      format: 'JPEG'
    },
    metrics: {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      revenue: 0,
      conversionRate: 0
    },
    compliance: {
      status: 'approved',
      scanDate: '2024-01-13T09:17:00Z',
      violations: []
    }
  }
};

export const mockPPVCampaigns = {
  active: {
    id: 'ppv-001',
    title: 'Exclusive Beach Photoshoot - VIP Access',
    description: 'Get exclusive access to my latest beach photoshoot with never-before-seen content!',
    status: 'active',
    price: 24.99,
    originalPrice: 29.99,
    discount: 17, // percentage
    contentIds: ['photo-001', 'video-002'],
    targetAudience: 'vip_subscribers',
    createdAt: '2024-01-10T09:00:00Z',
    launchedAt: '2024-01-10T12:00:00Z',
    expiresAt: '2024-01-17T23:59:59Z',
    metrics: {
      sent: 1250,
      opened: 812, // 65% open rate
      clicked: 203, // 25% click rate
      purchased: 47, // 23% purchase rate
      revenue: 1174.53,
      roi: 2.4,
      avgTimeToOpen: 3600, // 1 hour
      avgTimeToPurchase: 7200 // 2 hours
    },
    aiOptimizations: {
      priceOptimized: true,
      audienceOptimized: true,
      timingOptimized: true,
      contentOptimized: false
    }
  },

  paused: {
    id: 'ppv-002',
    title: 'VIP Content Bundle - Limited Time',
    description: 'Special bundle of my most popular content at a discounted price.',
    status: 'paused',
    price: 19.99,
    originalPrice: 39.99,
    discount: 50,
    contentIds: ['photo-001', 'story-003'],
    targetAudience: 'high_spenders',
    createdAt: '2024-01-08T14:20:00Z',
    launchedAt: '2024-01-08T19:00:00Z',
    pausedAt: '2024-01-12T10:30:00Z',
    metrics: {
      sent: 890,
      opened: 374, // 42% open rate
      clicked: 112, // 30% click rate
      purchased: 17, // 15% purchase rate
      revenue: 339.83,
      roi: 1.8,
      avgTimeToOpen: 5400, // 1.5 hours
      avgTimeToPurchase: 14400 // 4 hours
    },
    aiOptimizations: {
      priceOptimized: false,
      audienceOptimized: true,
      timingOptimized: false,
      contentOptimized: true
    }
  },

  completed: {
    id: 'ppv-003',
    title: 'New Year Special Collection',
    description: 'Celebrate the new year with exclusive content and special pricing!',
    status: 'completed',
    price: 15.99,
    originalPrice: 15.99,
    discount: 0,
    contentIds: ['photo-001'],
    targetAudience: 'all_subscribers',
    createdAt: '2023-12-28T10:00:00Z',
    launchedAt: '2023-12-31T20:00:00Z',
    completedAt: '2024-01-07T23:59:59Z',
    metrics: {
      sent: 2100,
      opened: 1470, // 70% open rate
      clicked: 441, // 30% click rate
      purchased: 132, // 30% purchase rate
      revenue: 2110.68,
      roi: 3.2,
      avgTimeToOpen: 1800, // 30 minutes
      avgTimeToPurchase: 3600 // 1 hour
    },
    aiOptimizations: {
      priceOptimized: true,
      audienceOptimized: true,
      timingOptimized: true,
      contentOptimized: true
    }
  }
};

export const mockAIInsights = {
  highPriority: {
    id: 'insight-001',
    type: 'revenue_drop',
    severity: 'high',
    title: 'Revenue decreased by 18% this week',
    description: 'Your earnings are significantly down compared to last week. This could be due to reduced posting frequency or lower engagement rates.',
    impact: 'high',
    confidence: 0.92,
    actions: [
      'Create new PPV campaign targeting VIP subscribers',
      'Post more interactive content to boost engagement',
      'Send personalized messages to top spenders',
      'Review and optimize posting schedule'
    ],
    data: {
      currentWeekRevenue: 1250.75,
      previousWeekRevenue: 1525.50,
      percentageChange: -18.0,
      trend: 'declining'
    },
    timestamp: '2024-01-15T08:00:00Z',
    dismissed: false
  },

  mediumPriority: {
    id: 'insight-002',
    type: 'vip_opportunity',
    severity: 'medium',
    title: '15 VIP fans haven\'t been contacted in 2 weeks',
    description: 'You have high-value subscribers who haven\'t received personal messages recently. These fans typically spend 3x more than average.',
    impact: 'medium',
    confidence: 0.87,
    actions: [
      'Send personalized messages to VIP fans',
      'Offer exclusive content preview',
      'Create VIP-only PPV campaign',
      'Schedule regular VIP check-ins'
    ],
    data: {
      vipFansCount: 15,
      avgSpendingPerVip: 125.50,
      daysSinceLastContact: 14,
      potentialRevenue: 1882.50
    },
    timestamp: '2024-01-15T06:30:00Z',
    dismissed: false
  },

  lowPriority: {
    id: 'insight-003',
    type: 'content_optimization',
    severity: 'low',
    title: 'Photo content performs 25% better than videos',
    description: 'Your photo content consistently generates higher engagement and revenue compared to video content.',
    impact: 'low',
    confidence: 0.78,
    actions: [
      'Focus on photo content creation',
      'Optimize video thumbnails and previews',
      'A/B test video vs photo PPV campaigns',
      'Analyze top-performing photo characteristics'
    ],
    data: {
      photoEngagementRate: 0.085,
      videoEngagementRate: 0.068,
      photoRevenue: 2450.75,
      videoRevenue: 1960.50,
      performanceDifference: 25.0
    },
    timestamp: '2024-01-15T05:15:00Z',
    dismissed: false
  }
};

export const mockComplianceResults = {
  approved: {
    scanId: 'scan-001',
    contentId: 'photo-001',
    status: 'approved',
    confidence: 0.95,
    scanDate: '2024-01-15T10:32:00Z',
    violations: [],
    suggestions: [],
    metadata: {
      scanDuration: 2.5, // seconds
      aiModel: 'content-moderator-v2.1',
      humanReviewRequired: false
    }
  },

  needsReview: {
    scanId: 'scan-002',
    contentId: 'video-002',
    status: 'needs_review',
    confidence: 0.72,
    scanDate: '2024-01-14T15:47:00Z',
    violations: [
      {
        type: 'content_policy',
        severity: 'medium',
        message: 'Potentially sensitive content detected',
        suggestion: 'Consider adding content warning or editing the video',
        timestamp: 5.2, // seconds into video
        confidence: 0.68
      }
    ],
    suggestions: [
      'Add content warning at the beginning',
      'Edit out potentially sensitive sections',
      'Submit for human review'
    ],
    metadata: {
      scanDuration: 15.8,
      aiModel: 'content-moderator-v2.1',
      humanReviewRequired: true
    }
  },

  rejected: {
    scanId: 'scan-003',
    contentId: 'photo-004',
    status: 'rejected',
    confidence: 0.89,
    scanDate: '2024-01-13T14:22:00Z',
    violations: [
      {
        type: 'nudity_policy',
        severity: 'high',
        message: 'Explicit nudity detected',
        suggestion: 'Crop or edit image to remove explicit content',
        region: { x: 450, y: 320, width: 200, height: 180 },
        confidence: 0.91
      },
      {
        type: 'copyright_concern',
        severity: 'medium',
        message: 'Potential copyrighted material in background',
        suggestion: 'Blur or remove background elements',
        region: { x: 100, y: 50, width: 300, height: 200 },
        confidence: 0.74
      }
    ],
    suggestions: [
      'Crop image to remove explicit content',
      'Blur background to avoid copyright issues',
      'Retake photo with different background',
      'Apply content-appropriate filters'
    ],
    metadata: {
      scanDuration: 3.2,
      aiModel: 'content-moderator-v2.1',
      humanReviewRequired: false
    }
  }
};

export const mockAIConversations = {
  contentOptimization: [
    {
      id: 'msg-001',
      sender: 'user',
      content: 'How can I improve my content engagement?',
      timestamp: '2024-01-15T14:30:00Z'
    },
    {
      id: 'msg-002',
      sender: 'ai',
      content: 'Based on your recent performance data, I recommend focusing on photo content as it generates 25% higher engagement than videos. Your best performing posts are published between 7-9 PM when your audience is most active. Consider adding more interactive elements like polls or questions to boost engagement.',
      timestamp: '2024-01-15T14:30:15Z',
      suggestions: [
        'Post more photo content',
        'Schedule posts for 7-9 PM',
        'Add interactive elements',
        'Use trending hashtags'
      ],
      confidence: 0.87
    }
  ],

  pricingOptimization: [
    {
      id: 'msg-003',
      sender: 'user',
      content: 'What should I price my next PPV campaign?',
      timestamp: '2024-01-15T15:45:00Z'
    },
    {
      id: 'msg-004',
      sender: 'ai',
      content: 'For your VIP audience, I recommend pricing between $22-27 based on your historical data. Your sweet spot appears to be $24.99, which maximizes both conversion rate (23%) and total revenue. Consider offering a limited-time discount of 15-20% to create urgency.',
      timestamp: '2024-01-15T15:45:12Z',
      suggestions: [
        'Price at $24.99',
        'Offer 15% early bird discount',
        'Target VIP subscribers first',
        'Create urgency with limited time'
      ],
      confidence: 0.91,
      data: {
        recommendedPrice: 24.99,
        expectedConversionRate: 0.23,
        estimatedRevenue: 1847.25
      }
    }
  ],

  fanMessaging: [
    {
      id: 'msg-005',
      sender: 'user',
      content: 'Generate a message for my VIP fans about new content',
      timestamp: '2024-01-15T16:20:00Z'
    },
    {
      id: 'msg-006',
      sender: 'ai',
      content: 'Here\'s a personalized message for your VIP fans:',
      timestamp: '2024-01-15T16:20:08Z',
      generatedContent: {
        message: 'Hey gorgeous! 💕 I just finished an amazing beach photoshoot and I can\'t wait to share these exclusive shots with my VIP family! These photos are absolutely stunning and I know you\'ll love them as much as I do. Check your DMs for a special preview! 🏖️✨ #VIPExclusive #BeachVibes',
        tone: 'friendly',
        length: 'medium',
        emojis: true,
        hashtags: ['#VIPExclusive', '#BeachVibes']
      },
      confidence: 0.84
    }
  ]
};

export const mockTemplates = {
  onboarding: {
    id: 'template-001',
    name: 'New Fan Onboarding',
    category: 'onboarding',
    description: 'Welcome message for new subscribers',
    template: 'Welcome to my page, {{fanName}}! 🎉 I\'m so excited to have you here. Get ready for exclusive content, behind-the-scenes moments, and lots of fun! Don\'t forget to turn on notifications so you never miss anything special. 💕',
    variables: ['fanName'],
    tone: 'friendly',
    useCase: 'new_subscriber',
    effectiveness: 0.89,
    usage: 245
  },

  upselling: {
    id: 'template-002',
    name: 'PPV Upsell Message',
    category: 'upselling',
    description: 'Promote PPV content to engaged fans',
    template: 'Hey {{fanName}}! 😘 I noticed you loved my recent posts, so I have something special just for you! I just dropped some exclusive content that I think you\'ll absolutely adore. It\'s only available for a limited time at {{price}}. Want to see what all the excitement is about? 🔥',
    variables: ['fanName', 'price'],
    tone: 'seductive',
    useCase: 'ppv_promotion',
    effectiveness: 0.76,
    usage: 189
  },

  reactivation: {
    id: 'template-003',
    name: 'Fan Reactivation',
    category: 'reactivation',
    description: 'Re-engage inactive subscribers',
    template: 'I miss you, {{fanName}}! 💔 It\'s been a while since we last chatted, and I\'ve been creating some amazing content that I think you\'d love. How about we catch up? I have a special surprise waiting for you! 🎁',
    variables: ['fanName'],
    tone: 'caring',
    useCase: 'inactive_fan',
    effectiveness: 0.65,
    usage: 156
  }
};

export const mockPerformanceMetrics = {
  weekly: {
    period: 'week',
    startDate: '2024-01-08T00:00:00Z',
    endDate: '2024-01-14T23:59:59Z',
    metrics: {
      totalRevenue: 2847.50,
      totalViews: 15420,
      totalLikes: 1205,
      totalComments: 234,
      newSubscribers: 89,
      ppvSales: 47,
      messagesSent: 156,
      messageResponses: 98,
      avgResponseTime: 3600, // 1 hour
      topPerformingContent: 'photo-001',
      conversionRate: 0.078
    },
    comparison: {
      previousPeriod: {
        totalRevenue: 3125.75,
        percentageChange: -8.9
      },
      yearOverYear: {
        totalRevenue: 2156.25,
        percentageChange: 32.1
      }
    }
  },

  monthly: {
    period: 'month',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-01-31T23:59:59Z',
    metrics: {
      totalRevenue: 12450.75,
      totalViews: 68920,
      totalLikes: 5420,
      totalComments: 1089,
      newSubscribers: 342,
      ppvSales: 198,
      messagesSent: 678,
      messageResponses: 445,
      avgResponseTime: 2700, // 45 minutes
      topPerformingContent: 'photo-001',
      conversionRate: 0.082
    },
    comparison: {
      previousPeriod: {
        totalRevenue: 11250.50,
        percentageChange: 10.7
      },
      yearOverYear: {
        totalRevenue: 8920.25,
        percentageChange: 39.6
      }
    }
  }
};

export const mockCalendarEvents = {
  scheduled: [
    {
      id: 'event-001',
      type: 'content_post',
      contentId: 'photo-001',
      title: 'Beach Collection Post',
      scheduledAt: '2024-01-16T19:00:00Z',
      status: 'scheduled',
      platform: 'main_feed'
    },
    {
      id: 'event-002',
      type: 'ppv_campaign',
      campaignId: 'ppv-004',
      title: 'VIP Exclusive Launch',
      scheduledAt: '2024-01-17T20:00:00Z',
      status: 'scheduled',
      targetAudience: 'vip_subscribers'
    },
    {
      id: 'event-003',
      type: 'story_post',
      contentId: 'story-003',
      title: 'Daily Update Story',
      scheduledAt: '2024-01-16T18:00:00Z',
      status: 'scheduled',
      platform: 'stories'
    }
  ],

  published: [
    {
      id: 'event-004',
      type: 'content_post',
      contentId: 'photo-001',
      title: 'Summer Vibes',
      publishedAt: '2024-01-15T19:00:00Z',
      status: 'published',
      platform: 'main_feed',
      metrics: {
        views: 2450,
        likes: 189,
        comments: 23
      }
    }
  ]
};

// Export all fixtures as a single object for easy importing
export const contentCreationFixtures = {
  mediaAssets: mockMediaAssets,
  ppvCampaigns: mockPPVCampaigns,
  aiInsights: mockAIInsights,
  complianceResults: mockComplianceResults,
  aiConversations: mockAIConversations,
  templates: mockTemplates,
  performanceMetrics: mockPerformanceMetrics,
  calendarEvents: mockCalendarEvents
};