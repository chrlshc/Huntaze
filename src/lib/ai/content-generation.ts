// AI Image Generation - Multi-Branch System
// Different AI models and capabilities per plan

// REAL Image Generation Capabilities by Plan
export const IMAGE_AI_BY_PLAN = {
  starter: {
    model: 'DALL-E 2',
    capabilities: [
      'basic_text_overlays', // "50% OFF" banners
      'simple_graphics',     // Basic promo images
      'standard_quality'     // 1024x1024
    ],
    limits: {
      perMonth: 30,
      resolution: '1024x1024',
      styles: ['basic', 'simple']
    },
    examples: [
      'Simple sale banner with text',
      'Basic tip menu design',
      'Standard social media post'
    ]
  },
  
  pro: {
    model: 'DALL-E 3',
    capabilities: [
      'advanced_graphics',
      'brand_consistency',
      'multiple_styles',
      'better_text_rendering'
    ],
    limits: {
      perMonth: 100,
      resolution: '1792x1024',
      styles: ['professional', 'artistic', 'photorealistic']
    },
    examples: [
      'Professional brand graphics',
      'Eye-catching PPV teasers',
      'Viral social media designs',
      'Custom tip menus with branding'
    ]
  },
  
  scale: {
    model: 'DALL-E 3 + Stable Diffusion XL',
    capabilities: [
      'ultra_high_quality',
      'complex_compositions',
      'perfect_branding',
      'a_b_test_variations'
    ],
    limits: {
      perMonth: 500,
      resolution: '2048x2048',
      styles: ['all', 'custom_trained']
    },
    examples: [
      'Magazine-quality promotional material',
      'Multiple variations for A/B testing',
      'Hyper-targeted campaign visuals',
      'Professional photography style'
    ]
  },
  
  enterprise: {
    model: 'Midjourney V6 + DALL-E 3 + Custom Models',
    capabilities: [
      'photorealistic_quality',
      'unlimited_creativity',
      'brand_perfect_consistency',
      'ai_art_director'
    ],
    limits: {
      perMonth: 'unlimited',
      resolution: 'up to 4K',
      styles: ['unlimited', 'custom_ai_trained_on_your_brand']
    },
    examples: [
      'Vogue-level promotional shoots',
      'Complete visual brand ecosystem',
      'AI that learns your exact style',
      'Competitor-crushing visuals'
    ]
  }
};

export interface AIContentGeneration {
  // Text Generation
  captions: {
    instagram: (topic: string, style: 'casual' | 'professional' | 'flirty') => Promise<string>;
    twitter: (topic: string, includeHashtags: boolean) => Promise<string>;
    tiktok: (topic: string, trending: boolean) => Promise<string>;
  };
  
  // Visual Content (NOT nude/adult content)
  visuals: {
    // Promotional Graphics
    promoGraphics: {
      saleAnnouncement: (discount: number, duration: string) => Promise<string>; // "50% OFF this weekend!"
      newContentAlert: (platform: string) => Promise<string>; // "New post on OF!"
      milestone: (achievement: string) => Promise<string>; // "10K followers!"
    };
    
    // Social Media Assets
    storyTemplates: {
      pollBackground: (question: string) => Promise<string>; // IG story polls
      countdownTimer: (event: string, date: Date) => Promise<string>; // "Live stream in..."
      quoteCard: (quote: string, author: string) => Promise<string>; // Motivational quotes
    };
    
    // Thumbnails & Covers
    thumbnails: {
      youtubeThumbnail: (title: string, style: string) => Promise<string>;
      podcastCover: (episode: string, guest?: string) => Promise<string>;
      streamStarting: (game?: string) => Promise<string>;
    };
    
    // Branding
    branding: {
      logo: (text: string, style: 'minimal' | 'bold' | 'elegant') => Promise<string>;
      banner: (platform: 'twitter' | 'youtube' | 'twitch', text: string) => Promise<string>;
      watermark: (text: string, transparent: boolean) => Promise<string>;
    };
  };
  
  // Content Ideas
  ideas: {
    weeklyContent: (niche: string, trends: string[]) => Promise<string[]>;
    hashtagSets: (topic: string, platform: string) => Promise<string[]>;
    captionVariations: (message: string, count: number) => Promise<string[]>;
  };
}

// Examples of ACTUAL AI image use cases for creators:

export const AI_IMAGE_USE_CASES = {
  // 1. Promotional Graphics (most common)
  promotional: [
    {
      type: 'sale_announcement',
      description: 'Eye-catching graphics for OF promotions',
      example: 'Neon text "FLASH SALE 30% OFF" on gradient background'
    },
    {
      type: 'tip_menu',
      description: 'Stylish tip menu graphics',
      example: 'Elegant price list design with creator branding'
    },
    {
      type: 'schedule_post',
      description: 'Weekly schedule announcements',
      example: 'Calendar graphic showing live stream times'
    }
  ],
  
  // 2. Social Media Graphics
  social: [
    {
      type: 'story_backgrounds',
      description: 'Backgrounds for IG/Snap stories',
      example: 'Aesthetic gradients, patterns, textures'
    },
    {
      type: 'quote_cards',
      description: 'Motivational or funny quote graphics',
      example: 'Typography design with inspiring quotes'
    },
    {
      type: 'poll_templates',
      description: 'Interactive story poll designs',
      example: '"This or That?" comparison graphics'
    }
  ],
  
  // 3. Branding Assets
  branding: [
    {
      type: 'channel_art',
      description: 'Banner designs for social platforms',
      example: 'YouTube banner, Twitter header, etc.'
    },
    {
      type: 'logo_variations',
      description: 'Logo designs for watermarking',
      example: 'Minimalist text logos, symbols'
    },
    {
      type: 'themed_overlays',
      description: 'Stream overlays and frames',
      example: 'Twitch streaming overlays, cam borders'
    }
  ],
  
  // 4. Content Teasers (SFW)
  teasers: [
    {
      type: 'censored_previews',
      description: 'Artistic censored previews',
      example: 'Blur effects, emoji covers, artistic crops'
    },
    {
      type: 'outfit_polls',
      description: 'Outfit choice graphics',
      example: '"Which outfit?" comparison cards'
    },
    {
      type: 'countdown_graphics',
      description: 'Content drop countdowns',
      example: '"New set dropping in 3 days!" graphics'
    }
  ]
};

// Why AI images matter for creators:
export const AI_IMAGE_BENEFITS = {
  timeeSaving: 'Create professional graphics in seconds vs hours in Photoshop',
  consistency: 'Maintain brand aesthetic across all platforms',
  engagement: 'Eye-catching visuals increase click-through rates',
  professionalism: 'Look like you have a design team',
  versatility: 'Quick graphics for trends, holidays, announcements',
  cost: 'No need to hire graphic designers for simple assets'
};

// Image generation prompts optimized for creator needs
export function generateImagePrompt(
  type: 'promo' | 'story' | 'banner' | 'teaser',
  details: {
    text?: string;
    style?: string;
    colors?: string[];
    platform?: string;
  }
): string {
  const basePrompts = {
    promo: `Promotional graphic for social media, ${details.style || 'modern and eye-catching'}, featuring text "${details.text}", professional design`,
    story: `Instagram story background, ${details.style || 'aesthetic'}, ${details.colors?.join(' and ') || 'pastel'} colors, mobile optimized 9:16`,
    banner: `${details.platform || 'social media'} banner design, ${details.text ? `with text "${details.text}"` : ''}, professional header image`,
    teaser: `Artistic preview graphic, ${details.style || 'mysterious and intriguing'}, safe for all platforms, professional photography style`
  };
  
  return basePrompts[type] + ', high quality, trending design 2024';
}