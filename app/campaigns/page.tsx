'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  ChevronLeft,
  Target,
  Rocket,
  Calendar,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  Zap,
  Bot,
  Gift,
  Heart,
  Star,
  ArrowRight,
  BarChart3,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Plus,
  Globe,
  Sparkles,
  Trophy,
  Dumbbell,
  Gamepad2,
  Camera,
  ShoppingBag,
  Package,
  Crown,
  Flame,
  Timer,
  Filter
} from 'lucide-react';

export default function CampaignsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [hasConnectedPlatforms, setHasConnectedPlatforms] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const [p, a] = await Promise.all([
          fetch('/api/users/profile', { cache: 'no-store' }),
          fetch('/api/ai/config', { cache: 'no-store' }),
        ]);
        if (p.ok) setProfile(await p.json());
        if (a.ok) {
          const config = await a.json();
          setAiConfig(config);
          setHasConnectedPlatforms(config.platforms?.length > 0);
        }
      } catch {}
    })();
  }, []);

  // Get personalized campaign templates based on niche and goals
  const getCampaignContent = () => {
    if (!hasConnectedPlatforms) {
      return {
        icon: Globe,
        title: "Connect Your Platform to Launch Campaigns",
        description: "Link your OnlyFans or Fansly account to start creating targeted campaigns",
        action: {
          label: "Connect Platform",
          href: "/onboarding/setup?step=3",
          icon: Plus
        },
        templates: []
      };
    }

    if (profile?.niche === 'fitness') {
      return {
        icon: Target,
        title: "Launch Fitness Campaigns That Convert",
        description: "Create targeted campaigns for workout programs, challenges, and nutrition plans",
        action: {
          label: "Create First Campaign",
          href: "/campaigns/new",
          icon: Rocket
        },
        templates: [
          {
            name: "30-Day Challenge Launch",
            description: "Promote your fitness challenge with automated follow-ups",
            icon: Trophy,
            metrics: { conversion: "32%", revenue: "$15K avg" },
            tags: ["high-converting", "fitness"],
            color: "purple"
          },
          {
            name: "Nutrition Plan Bundle",
            description: "Cross-sell meal plans with workout programs",
            icon: Dumbbell,
            metrics: { conversion: "28%", revenue: "$8K avg" },
            tags: ["bundle", "upsell"],
            color: "green"
          },
          {
            name: "VIP Coaching Tier",
            description: "Convert top clients to premium 1-on-1 coaching",
            icon: Star,
            metrics: { conversion: "18%", revenue: "$25K avg" },
            tags: ["premium", "exclusive"],
            color: "gold"
          },
          {
            name: "Workout Gear Promo",
            description: "Affiliate campaigns for fitness equipment",
            icon: ShoppingBag,
            metrics: { conversion: "15%", revenue: "$3K avg" },
            tags: ["affiliate", "gear"],
            color: "blue"
          }
        ],
        bestPractices: [
          "Launch challenges on Mondays for maximum participation",
          "Include progress tracking in your campaigns",
          "Offer early-bird pricing for the first 48 hours",
          "Send motivational check-ins during programs"
        ]
      };
    }

    if (profile?.niche === 'gaming') {
      return {
        icon: Target,
        title: "Gaming Campaign Command Center",
        description: "Launch campaigns that engage your gaming community and boost support",
        action: {
          label: "Start Campaign",
          href: "/campaigns/new",
          icon: Gamepad2
        },
        templates: [
          {
            name: "Stream Schedule Announcement",
            description: "Promote upcoming streams with exclusive perks",
            icon: Camera,
            metrics: { conversion: "24%", revenue: "$5K avg" },
            tags: ["streaming", "schedule"],
            color: "purple"
          },
          {
            name: "Gaming Session Invites",
            description: "VIP game sessions with top supporters",
            icon: Gamepad2,
            metrics: { conversion: "35%", revenue: "$12K avg" },
            tags: ["exclusive", "interactive"],
            color: "green"
          },
          {
            name: "Merch Drop Campaign",
            description: "Launch gaming merchandise to your community",
            icon: Package,
            metrics: { conversion: "18%", revenue: "$8K avg" },
            tags: ["merch", "limited"],
            color: "blue"
          },
          {
            name: "Tournament Sponsorship",
            description: "Get fans to sponsor your tournament entry",
            icon: Trophy,
            metrics: { conversion: "22%", revenue: "$6K avg" },
            tags: ["tournament", "support"],
            color: "orange"
          }
        ],
        bestPractices: [
          "Announce campaigns during peak streaming hours",
          "Offer game-specific rewards and perks",
          "Create urgency with limited-time offers",
          "Include Discord benefits in campaigns"
        ]
      };
    }

    if (profile?.niche === 'adult') {
      return {
        icon: Target,
        title: "Premium Campaign Manager",
        description: "Create high-converting campaigns for PPV content and exclusive offers",
        action: {
          label: "Launch Campaign",
          href: "/campaigns/new",
          icon: Rocket
        },
        templates: [
          {
            name: "PPV Content Bundle",
            description: "Exclusive content packages for premium fans",
            icon: Package,
            metrics: { conversion: "42%", revenue: "$35K avg" },
            tags: ["ppv", "exclusive"],
            color: "pink"
          },
          {
            name: "VIP Tier Upgrade",
            description: "Convert regular subs to VIP membership",
            icon: Crown,
            metrics: { conversion: "28%", revenue: "$18K avg" },
            tags: ["upgrade", "vip"],
            color: "purple"
          },
          {
            name: "Custom Content Offers",
            description: "Personalized content creation campaigns",
            icon: Star,
            metrics: { conversion: "38%", revenue: "$25K avg" },
            tags: ["custom", "premium"],
            color: "gold"
          },
          {
            name: "Limited Time Special",
            description: "Flash sales for maximum conversions",
            icon: Flame,
            metrics: { conversion: "45%", revenue: "$15K avg" },
            tags: ["flash-sale", "urgent"],
            color: "red"
          }
        ],
        bestPractices: [
          "Launch campaigns during peak hours (10 PM - 2 AM)",
          "Use scarcity tactics with limited quantities",
          "Include preview content to boost conversions",
          "Segment campaigns by spending behavior"
        ]
      };
    }

    if (profile?.niche === 'fashion') {
      return {
        icon: Target,
        title: "Fashion Campaign Studio",
        description: "Create style campaigns that drive engagement and sales",
        action: {
          label: "Design Campaign",
          href: "/campaigns/new",
          icon: Sparkles
        },
        templates: [
          {
            name: "Seasonal Collection Launch",
            description: "Showcase new seasonal styles and trends",
            icon: ShoppingBag,
            metrics: { conversion: "26%", revenue: "$12K avg" },
            tags: ["seasonal", "launch"],
            color: "pink"
          },
          {
            name: "Style Guide Series",
            description: "Educational content that converts to sales",
            icon: Sparkles,
            metrics: { conversion: "22%", revenue: "$8K avg" },
            tags: ["educational", "style"],
            color: "purple"
          },
          {
            name: "Brand Collaboration",
            description: "Partner campaigns with fashion brands",
            icon: Gift,
            metrics: { conversion: "18%", revenue: "$15K avg" },
            tags: ["collab", "brand"],
            color: "blue"
          },
          {
            name: "Exclusive Access Sale",
            description: "Early access to limited fashion items",
            icon: Crown,
            metrics: { conversion: "32%", revenue: "$10K avg" },
            tags: ["exclusive", "limited"],
            color: "gold"
          }
        ],
        bestPractices: [
          "Launch campaigns on weekends for maximum engagement",
          "Include outfit breakdowns and styling tips",
          "Partner with brands for exclusive offers",
          "Use high-quality visuals in all campaigns"
        ]
      };
    }

    // Default for other niches
    return {
      icon: Target,
      title: "Launch Targeted Campaigns",
      description: `Create campaigns that resonate with your ${profile?.niche || 'creator'} audience`,
      action: {
        label: "Create Campaign",
        href: "/campaigns/new",
        icon: Plus
      },
      templates: [
        {
          name: "Welcome Series",
          description: "Automated campaign for new subscribers",
          icon: UserPlus,
          metrics: { conversion: "35%", revenue: "$5K avg" },
          tags: ["automated", "onboarding"],
          color: "green"
        },
        {
          name: "Re-engagement Campaign",
          description: "Win back inactive fans with special offers",
          icon: Heart,
          metrics: { conversion: "22%", revenue: "$8K avg" },
          tags: ["retention", "win-back"],
          color: "blue"
        },
        {
          name: "Premium Content Push",
          description: "Promote exclusive content to engaged fans",
          icon: Star,
          metrics: { conversion: "28%", revenue: "$12K avg" },
          tags: ["premium", "exclusive"],
          color: "purple"
        },
        {
          name: "Limited Time Offer",
          description: "Create urgency with time-sensitive deals",
          icon: Timer,
          metrics: { conversion: "40%", revenue: "$7K avg" },
          tags: ["urgent", "limited"],
          color: "red"
        }
      ],
      bestPractices: [
        "Test different campaign times to find your audience's peak activity",
        "Personalize messages based on fan behavior",
        "Use A/B testing to optimize conversions",
        "Follow up with non-converters after 48 hours"
      ]
    };
  };

  const campaignContent = getCampaignContent();
  const Icon = campaignContent.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </Link>
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-bold text-gray-900">Campaigns</h1>
                {aiConfig?.responseStyle && (
                  <span className="px-2 py-1 text-xs rounded-lg bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    AI-Powered
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                Templates
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
                <Plus className="w-4 h-4" />
                New Campaign
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-12 max-w-7xl mx-auto">
        {/* Empty State */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Hero Section */}
          <div className="p-12 text-center border-b border-gray-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl mb-6">
              <Icon className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{campaignContent.title}</h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8">{campaignContent.description}</p>
            
            <Link 
              href={campaignContent.action.href}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-600/25 transition-all font-medium"
            >
              <campaignContent.action.icon className="w-5 h-5" />
              {campaignContent.action.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Campaign Templates */}
          {campaignContent.templates.length > 0 && (
            <div className="p-8 bg-gradient-to-br from-gray-50 to-white">
              <h3 className="font-semibold text-gray-900 mb-6">
                {profile?.niche === 'fitness' ? 'Proven Fitness Campaign Templates' :
                 profile?.niche === 'gaming' ? 'Gaming Campaign Templates' :
                 profile?.niche === 'adult' ? 'High-Converting Templates' :
                 profile?.niche === 'fashion' ? 'Fashion Campaign Templates' :
                 'Ready-to-Use Templates'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaignContent.templates.map((template, index) => {
                  const TemplateIcon = template.icon;
                  return (
                    <div key={index} className="group bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-xl bg-${template.color}-50`}>
                            <TemplateIcon className={`w-6 h-6 text-${template.color}-600`} />
                          </div>
                          <div className="flex gap-2">
                            {template.tags.map((tag) => (
                              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <h4 className="font-semibold text-gray-900 mb-2">{template.name}</h4>
                        <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500">
                              <TrendingUp className="w-4 h-4 inline mr-1" />
                              {template.metrics.conversion}
                            </span>
                            <span className="text-gray-500">
                              <DollarSign className="w-4 h-4 inline mr-1" />
                              {template.metrics.revenue}
                            </span>
                          </div>
                          <span className="text-purple-600 font-medium group-hover:text-purple-700">
                            Use template →
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Best Practices */}
          {campaignContent.bestPractices && (
            <div className="p-8 bg-white border-t border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                {profile?.niche === 'fitness' ? 'Fitness Campaign Best Practices' :
                 profile?.niche === 'gaming' ? 'Gaming Campaign Tips' :
                 profile?.niche === 'adult' ? 'Maximizing Campaign Revenue' :
                 'Campaign Best Practices'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaignContent.bestPractices.map((practice, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">{practice}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Preview */}
          <div className="p-8 bg-gradient-to-br from-purple-50 to-pink-50">
            <h3 className="font-semibold text-gray-900 mb-6">Expected Campaign Performance</h3>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-gray-900">35-45%</p>
                <p className="text-sm text-gray-600">Avg. Conversion Rate</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">$15-25K</p>
                <p className="text-sm text-gray-600">Avg. Revenue per Campaign</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">3-5x</p>
                <p className="text-sm text-gray-600">ROI on Campaigns</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="p-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">
                  {profile?.goals?.includes('revenue') 
                    ? 'Ready to boost your revenue?'
                    : profile?.goals?.includes('growth')
                    ? 'Ready to grow your audience?'
                    : 'Ready to launch your first campaign?'}
                </h3>
                <p className="text-purple-100">
                  {profile?.niche === 'fitness' 
                    ? 'Launch fitness programs that transform lives and income'
                    : profile?.niche === 'gaming'
                    ? 'Engage your gaming community with targeted campaigns'
                    : profile?.niche === 'adult'
                    ? 'Create high-converting campaigns that maximize earnings'
                    : 'Start with proven templates and AI-powered optimization'}
                </p>
              </div>
              <button 
                onClick={() => router.push('/campaigns/new')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur border border-white/30 rounded-xl hover:bg-white/30 transition-colors font-medium"
              >
                <Rocket className="w-5 h-5" />
                Launch Campaign
              </button>
            </div>
          </div>
        </div>

        {/* AI Optimization Notice */}
        <div className="mt-8 bg-purple-50 border border-purple-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <Bot className="w-6 h-6 text-purple-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-purple-900 mb-1">
                AI-Powered Campaign Optimization
              </h4>
              <p className="text-purple-800">
                {profile?.niche === 'fitness' 
                  ? 'Our AI analyzes client engagement patterns to suggest optimal campaign timing and messaging for maximum program enrollment.'
                  : profile?.niche === 'gaming'
                  ? 'Smart algorithms track viewer behavior to recommend the best times and content types for your gaming campaigns.'
                  : profile?.niche === 'adult'
                  ? 'AI optimization predicts fan spending patterns and suggests personalized offers that convert 3x better.'
                  : 'Advanced AI helps you create campaigns that resonate with your audience and drive conversions.'}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm text-purple-700">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  A/B Testing
                </span>
                <span className="text-sm text-purple-700">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Smart Timing
                </span>
                <span className="text-sm text-purple-700">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Personalization
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

