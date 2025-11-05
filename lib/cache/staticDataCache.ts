/**
 * Static Data Cache for Landing Page and Common Data
 * Pre-computes and caches frequently accessed static data
 */

import { cacheManager, CacheKeys, CacheTags } from './cacheManager';

interface LandingPageData {
  features: any[];
  showcaseFeatures: any[];
  stats: any[];
  testimonials: any[];
  pricingPlans: any[];
  faqs: any[];
  metadata: {
    title: string;
    description: string;
    lastUpdated: string;
  };
}

interface PlatformStats {
  totalUsers: number;
  totalPosts: number;
  totalCountries: number;
  satisfactionRate: number;
  lastUpdated: string;
}

class StaticDataCache {
  private readonly CACHE_TTL = {
    LANDING_PAGE: 1800, // 30 minutes
    PLATFORM_STATS: 600, // 10 minutes
    TESTIMONIALS: 3600, // 1 hour
    PRICING: 1800, // 30 minutes
    FAQS: 3600, // 1 hour
  };

  /**
   * Get or generate landing page data
   */
  async getLandingPageData(): Promise<LandingPageData> {
    return cacheManager.getOrSet(
      CacheKeys.landingPageData(),
      async () => {
        return {
          features: this.getFeatures(),
          showcaseFeatures: this.getShowcaseFeatures(),
          stats: await this.getPlatformStats(),
          testimonials: this.getTestimonials(),
          pricingPlans: this.getPricingPlans(),
          faqs: this.getFAQs(),
          metadata: {
            title: 'Huntaze - Grow Your Creator Business',
            description: 'The all-in-one platform for content creators to manage, grow, and monetize their audience across all platforms.',
            lastUpdated: new Date().toISOString(),
          },
        };
      },
      {
        ttl: this.CACHE_TTL.LANDING_PAGE,
        tags: [CacheTags.LANDING],
      }
    );
  }

  /**
   * Get platform statistics with caching
   */
  async getPlatformStats(): Promise<any[]> {
    return cacheManager.getOrSet(
      'platform:stats',
      async () => {
        // In a real app, these would come from database queries
        // For now, return static data with some variation
        const baseStats = [
          { value: 10000, label: 'Active Creators', suffix: '+' },
          { value: 1000000, label: 'Posts Published', suffix: '+' },
          { value: 50, label: 'Countries', suffix: '+' },
          { value: 98, label: 'Satisfaction Rate', suffix: '%' },
        ];

        // Add some realistic variation (±5%)
        return baseStats.map(stat => ({
          ...stat,
          value: stat.suffix === '%' 
            ? stat.value 
            : Math.floor(stat.value * (0.95 + Math.random() * 0.1))
        }));
      },
      {
        ttl: this.CACHE_TTL.PLATFORM_STATS,
        tags: [CacheTags.ANALYTICS],
      }
    );
  }

  /**
   * Get features data
   */
  private getFeatures() {
    return [
      {
        icon: 'Zap',
        title: 'Lightning Fast',
        description: 'Get started in minutes with our intuitive platform designed for creators.',
      },
      {
        icon: 'Users',
        title: 'Grow Your Audience',
        description: 'Connect with your fans across multiple platforms and grow your reach.',
      },
      {
        icon: 'TrendingUp',
        title: 'Increase Revenue',
        description: 'Monetize your content effectively with powerful tools and analytics.',
      },
      {
        icon: 'Shield',
        title: 'Secure & Private',
        description: 'Your data is protected with enterprise-grade security and encryption.',
      },
      {
        icon: 'Sparkles',
        title: 'AI-Powered',
        description: 'Leverage AI to create engaging content and optimize your strategy.',
      },
      {
        icon: 'BarChart3',
        title: 'Advanced Analytics',
        description: 'Track your performance with detailed insights and actionable metrics.',
      },
    ];
  }

  /**
   * Get showcase features data
   */
  private getShowcaseFeatures() {
    return [
      {
        title: 'Multi-Platform Content Management',
        description: 'Manage all your social media accounts from one unified dashboard. Schedule posts, track engagement, and grow your presence across Instagram, TikTok, Twitter, and more.',
        benefits: [
          { text: 'Connect unlimited social accounts' },
          { text: 'Schedule posts across all platforms' },
          { text: 'Unified analytics and reporting' },
        ],
        image: '/images/features/dashboard.svg',
        imageAlt: 'Multi-platform dashboard interface',
      },
      {
        title: 'AI-Powered Content Creation',
        description: 'Let AI help you create engaging content that resonates with your audience. Get suggestions, optimize captions, and generate ideas in seconds.',
        benefits: [
          { text: 'AI-generated content suggestions' },
          { text: 'Smart caption optimization' },
          { text: 'Hashtag recommendations' },
        ],
        image: '/images/features/ai-content.svg',
        imageAlt: 'AI content creation interface',
      },
      {
        title: 'Advanced Analytics & Insights',
        description: 'Make data-driven decisions with comprehensive analytics. Track your growth, understand your audience, and optimize your content strategy.',
        benefits: [
          { text: 'Real-time performance metrics' },
          { text: 'Audience demographics and behavior' },
          { text: 'Competitor analysis tools' },
        ],
        image: '/images/features/analytics.svg',
        imageAlt: 'Analytics dashboard with charts',
      },
    ];
  }

  /**
   * Get testimonials with caching
   */
  async getTestimonials() {
    return cacheManager.getOrSet(
      'testimonials:featured',
      async () => [
        {
          name: 'Sarah Johnson',
          role: 'Content Creator',
          content: 'This platform has completely transformed how I manage my content. The AI suggestions are spot-on and save me hours every week!',
          rating: 5,
          avatar: '/images/testimonials/sarah.jpg',
        },
        {
          name: 'Mike Chen',
          role: 'Influencer',
          content: 'The analytics are incredible. I finally understand what content works and why. My engagement has doubled in just 3 months.',
          rating: 5,
          avatar: '/images/testimonials/mike.jpg',
        },
        {
          name: 'Emma Davis',
          role: 'Digital Marketer',
          content: 'Best investment for my business. The multi-platform scheduling alone is worth it, but the AI features are game-changing.',
          rating: 5,
          avatar: '/images/testimonials/emma.jpg',
        },
      ],
      {
        ttl: this.CACHE_TTL.TESTIMONIALS,
        tags: [CacheTags.LANDING],
      }
    );
  }

  /**
   * Get pricing plans with caching
   */
  async getPricingPlans() {
    return cacheManager.getOrSet(
      'pricing:plans',
      async () => [
        {
          name: 'Starter',
          price: 19,
          period: 'month',
          description: 'Perfect for new creators',
          features: [
            { text: 'Up to 3 social accounts', included: true },
            { text: '50 scheduled posts/month', included: true },
            { text: 'Basic analytics', included: true },
            { text: 'AI content suggestions', included: true },
            { text: 'Priority support', included: false },
            { text: 'Advanced analytics', included: false },
          ],
          ctaText: 'Start Free Trial',
          ctaHref: '/auth/register?plan=starter',
        },
        {
          name: 'Pro',
          price: 49,
          period: 'month',
          description: 'For growing creators',
          popular: true,
          features: [
            { text: 'Up to 10 social accounts', included: true },
            { text: 'Unlimited scheduled posts', included: true },
            { text: 'Advanced analytics', included: true },
            { text: 'AI content suggestions', included: true },
            { text: 'Priority support', included: true },
            { text: 'Team collaboration', included: true },
          ],
          ctaText: 'Start Free Trial',
          ctaHref: '/auth/register?plan=pro',
        },
        {
          name: 'Enterprise',
          price: 149,
          period: 'month',
          description: 'For teams and agencies',
          features: [
            { text: 'Unlimited social accounts', included: true },
            { text: 'Unlimited scheduled posts', included: true },
            { text: 'Advanced analytics', included: true },
            { text: 'AI content suggestions', included: true },
            { text: 'Priority support', included: true },
            { text: 'Team collaboration', included: true },
            { text: 'Custom integrations', included: true },
            { text: 'Dedicated account manager', included: true },
          ],
          ctaText: 'Contact Sales',
          ctaHref: '/contact',
        },
      ],
      {
        ttl: this.CACHE_TTL.PRICING,
        tags: [CacheTags.LANDING],
      }
    );
  }

  /**
   * Get FAQs with caching
   */
  private getFAQs() {
    return [
      {
        question: 'How does the free trial work?',
        answer: 'You get full access to all features for 14 days, no credit card required. After the trial, you can choose a plan that fits your needs or continue with our free tier.',
      },
      {
        question: 'Can I change my plan later?',
        answer: 'Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any charges.',
      },
      {
        question: 'Which social platforms do you support?',
        answer: 'We support all major platforms including Instagram, TikTok, Twitter, Facebook, LinkedIn, YouTube, and more. We\'re constantly adding new integrations.',
      },
      {
        question: 'Is my data secure?',
        answer: 'Yes! We use enterprise-grade encryption and security measures. Your data is stored securely and we never share it with third parties.',
      },
      {
        question: 'Do you offer refunds?',
        answer: 'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied, contact us for a full refund, no questions asked.',
      },
      {
        question: 'Can I use this for my team?',
        answer: 'Yes! Our Pro and Enterprise plans include team collaboration features. You can invite team members and manage permissions easily.',
      },
    ];
  }

  /**
   * Invalidate all landing page caches
   */
  async invalidateLandingPageCache() {
    await Promise.all([
      cacheManager.delete(CacheKeys.landingPageData()),
      cacheManager.delete('platform:stats'),
      cacheManager.delete('testimonials:featured'),
      cacheManager.delete('pricing:plans'),
      cacheManager.invalidateByTag(CacheTags.LANDING),
    ]);
  }

  /**
   * Warm up caches (pre-populate with data)
   */
  async warmUpCaches() {
    console.log('🔥 Warming up static data caches...');
    
    await Promise.all([
      this.getLandingPageData(),
      this.getPlatformStats(),
      this.getTestimonials(),
      this.getPricingPlans(),
    ]);
    
    console.log('✅ Static data caches warmed up successfully');
  }
}

export const staticDataCache = new StaticDataCache();