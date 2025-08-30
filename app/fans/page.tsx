'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GatedContent, GatedBanner } from '@/components/dashboard/GatedContent';
import { 
  Users, 
  ChevronLeft,
  UserPlus,
  Star,
  Heart,
  DollarSign,
  TrendingUp,
  Filter,
  Search,
  Bot,
  Calendar,
  Clock,
  Target,
  Zap,
  ArrowRight,
  Trophy,
  Shield,
  MessageSquare,
  Activity,
  Gift,
  Crown,
  Sparkles,
  Database,
  ChartBar,
  Globe,
  Plus,
  CheckCircle,
  AlertCircle,
  Dumbbell,
  Gamepad2,
  Camera,
  ShoppingBag
} from 'lucide-react';
import { MINIMAL_UI } from '@/lib/ui';

export default function FansPage() {
  const [profile, setProfile] = useState<any>(null);
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [hasConnectedPlatforms, setHasConnectedPlatforms] = useState(false);
  const [fans, setFans] = useState<any[]>([]);
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
        const lf = await fetch('/api/crm/fans', { cache: 'no-store' });
        if (lf.ok) {
          const data = await lf.json();
          setFans(data.fans || []);
        }
      } catch {}
    })();
  }, []);

  // Get personalized empty state content based on niche and goals
  const getEmptyStateContent = () => {
    if (!hasConnectedPlatforms) {
      return {
        icon: Globe,
        title: "Connect Your Platform to Import Fans",
        description: "Sync your OnlyFans or Fansly subscribers to start managing relationships",
        action: {
          label: "Connect Platform",
          href: "/onboarding/setup?step=3",
          icon: Plus
        },
        features: [
          { icon: Database, text: "Automatic fan sync" },
          { icon: Shield, text: "Secure data handling" },
          { icon: Activity, text: "Real-time updates" }
        ]
      };
    }

    if (profile?.niche === 'fitness') {
      return {
        icon: Users,
        title: "Your Fitness Community Hub",
        description: "Track client progress, manage subscriptions, and build lasting fitness relationships",
        action: {
          label: "Import Clients",
          href: "/fans/import",
          icon: UserPlus
        },
        features: [
          { icon: Dumbbell, text: "Track workout completion rates" },
          { icon: Trophy, text: "Identify top performers" },
          { icon: Calendar, text: "Monitor subscription cycles" },
          { icon: Heart, text: "Measure client satisfaction" }
        ],
        segments: [
          { name: "Dedicated Athletes", count: "156", icon: Trophy, color: "purple" },
          { name: "New Members", count: "48", icon: UserPlus, color: "green" },
          { name: "Need Motivation", count: "23", icon: AlertCircle, color: "amber" },
          { name: "VIP Clients", count: "12", icon: Crown, color: "gold" }
        ],
        metrics: [
          { label: "Avg. Client LTV", value: "$489", trend: "+23%" },
          { label: "Retention Rate", value: "87%", trend: "+5%" },
          { label: "Program Completion", value: "76%", trend: "+12%" }
        ]
      };
    }

    if (profile?.niche === 'gaming') {
      return {
        icon: Users,
        title: "Gaming Community Manager",
        description: "Manage your gaming fans, track supporters, and build an engaged community",
        action: {
          label: "Sync Fans",
          href: "/fans/sync",
          icon: UserPlus
        },
        features: [
          { icon: Gamepad2, text: "Tag fans by favorite games" },
          { icon: Trophy, text: "Reward top supporters" },
          { icon: MessageSquare, text: "Discord integration" },
          { icon: Gift, text: "Track bits and donations" }
        ],
        segments: [
          { name: "VIP Supporters", count: "234", icon: Crown, color: "purple" },
          { name: "Regular Viewers", count: "1.2K", icon: Users, color: "blue" },
          { name: "New Followers", count: "156", icon: UserPlus, color: "green" },
          { name: "Top Donors", count: "45", icon: Gift, color: "pink" }
        ],
        metrics: [
          { label: "Avg. Fan Value", value: "$67", trend: "+34%" },
          { label: "Stream Loyalty", value: "4.2/5", trend: "+0.3" },
          { label: "Community Growth", value: "+450/mo", trend: "+18%" }
        ]
      };
    }

    if (profile?.niche === 'adult') {
      return {
        icon: Users,
        title: "Premium Fan Management",
        description: "Segment high-value subscribers, track spending patterns, and maximize revenue",
        action: {
          label: "Import Subscribers",
          href: "/fans/import",
          icon: UserPlus
        },
        features: [
          { icon: DollarSign, text: "Track spending behavior" },
          { icon: Star, text: "VIP tier management" },
          { icon: Heart, text: "Engagement scoring" },
          { icon: Clock, text: "Renewal predictions" }
        ],
        segments: [
          { name: "Whale Spenders", count: "89", icon: Crown, color: "gold" },
          { name: "VIP Subscribers", count: "234", icon: Star, color: "purple" },
          { name: "Regular Fans", count: "1.8K", icon: Users, color: "blue" },
          { name: "At Risk", count: "156", icon: AlertCircle, color: "red" }
        ],
        metrics: [
          { label: "Avg. Fan Spend", value: "$127/mo", trend: "+45%" },
          { label: "VIP Conversion", value: "23%", trend: "+8%" },
          { label: "Churn Rate", value: "12%", trend: "-3%" }
        ]
      };
    }

    if (profile?.niche === 'fashion') {
      return {
        icon: Users,
        title: "Fashion Community CRM",
        description: "Manage style enthusiasts, track engagement, and build brand partnerships",
        action: {
          label: "Import Followers",
          href: "/fans/import",
          icon: UserPlus
        },
        features: [
          { icon: ShoppingBag, text: "Style preference tracking" },
          { icon: Camera, text: "Content engagement metrics" },
          { icon: Sparkles, text: "Influence scoring" },
          { icon: Heart, text: "Brand affinity analysis" }
        ],
        segments: [
          { name: "Brand Advocates", count: "342", icon: Sparkles, color: "pink" },
          { name: "Style Seekers", count: "2.1K", icon: ShoppingBag, color: "purple" },
          { name: "New Followers", count: "567", icon: UserPlus, color: "green" },
          { name: "Top Engagers", count: "128", icon: Heart, color: "red" }
        ],
        metrics: [
          { label: "Engagement Rate", value: "12.3%", trend: "+2.1%" },
          { label: "Avg. Order Value", value: "$89", trend: "+15%" },
          { label: "Brand Collabs", value: "14 active", trend: "+3" }
        ]
      };
    }

    // Default for other niches
    return {
      icon: Users,
      title: "Build Your Fan Database",
      description: `Organize and understand your ${profile?.niche || 'creator'} community better than ever`,
      action: {
        label: "Start Building",
        href: "/fans/import",
        icon: UserPlus
      },
      features: [
        { icon: Database, text: "Centralized fan database" },
        { icon: ChartBar, text: "Engagement analytics" },
        { icon: Target, text: "Smart segmentation" },
        { icon: Zap, text: "Automated workflows" }
      ],
      segments: [
        { name: "Top Fans", count: "--", icon: Star, color: "purple" },
        { name: "Active", count: "--", icon: Activity, color: "green" },
        { name: "New", count: "--", icon: UserPlus, color: "blue" },
        { name: "Inactive", count: "--", icon: Clock, color: "gray" }
      ],
      metrics: [
        { label: "Total Fans", value: "--", trend: "--" },
        { label: "Avg. Value", value: "--", trend: "--" },
        { label: "Growth Rate", value: "--", trend: "--" }
      ]
    };
  };

  const emptyState = getEmptyStateContent();
  const Icon = emptyState.icon;

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
                <Users className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-bold text-gray-900">Fans</h1>
                {profile?.niche && (
                  <span className="px-2 py-1 text-xs rounded-lg bg-gray-100 text-gray-700 border border-gray-200">
                    {profile.niche === 'fitness' ? 'Fitness Clients' :
                     profile.niche === 'gaming' ? 'Gaming Community' :
                     profile.niche === 'adult' ? 'Premium Subscribers' :
                     profile.niche === 'fashion' ? 'Style Community' : 'Creator Fans'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Search className="w-4 h-4" />
                Search
              </button>
              <Link href="/fans/import" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
                <UserPlus className="w-4 h-4" />
                Add Fan
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-12 max-w-7xl mx-auto">
        {/* Gated banner if no platform connected */}
        {!hasConnectedPlatforms && (
          <GatedBanner type="no-platform" aiConfig={aiConfig} userProfile={profile} />
        )}
        
        {/* Existing fans list */}
        {fans.length > 0 && (
          <div className="mb-8 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Fans</h3>
              <Link href="/fans/import" className="text-sm text-purple-600 hover:text-purple-700">Add another</Link>
            </div>
            <div className="divide-y divide-gray-100">
              {fans.slice(0, 6).map((f) => (
                <div key={f.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{f.name}</p>
                    {!MINIMAL_UI && (
                      <p className="text-sm text-gray-500">{f.platform || 'custom'} {f.handle ? `• @${f.handle}` : ''}</p>
                    )}
                  </div>
                  {typeof f.valueCents === 'number' && f.valueCents > 0 && (
                    <span className="text-sm font-medium text-gray-700">${(f.valueCents/100).toFixed(2)}/mo</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        <div className={!hasConnectedPlatforms ? "mt-6 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden" : "bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden"}>
          {/* Hero Section */}
          <div className="p-12 text-center border-b border-gray-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl mb-6">
              <Icon className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{emptyState.title}</h2>
            {!MINIMAL_UI && (
              <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8">{emptyState.description}</p>
            )}
            
            <Link 
              href={emptyState.action.href}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-600/25 transition-all font-medium"
            >
              <emptyState.action.icon className="w-5 h-5" />
              {emptyState.action.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {!MINIMAL_UI && (
          <div className="p-8 bg-gradient-to-br from-gray-50 to-white features-grid">
            <h3 className="font-semibold text-gray-900 mb-6">Powerful Fan Management Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emptyState.features.map((feature, index) => {
                const FeatureIcon = feature.icon;
                return (
                  <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                      <FeatureIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-gray-700">{feature.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Segments Preview */}
          {emptyState.segments && (
            <div className="p-8 bg-white border-t border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-6">Smart Fan Segmentation</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {emptyState.segments.map((segment, index) => {
                  const SegmentIcon = segment.icon;
                  return (
                    <div key={index} className="text-center p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                      <div className={`inline-flex items-center justify-center w-12 h-12 bg-${segment.color}-50 rounded-xl mb-3`}>
                        <SegmentIcon className={`w-6 h-6 text-${segment.color}-600`} />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{segment.count}</p>
                      <p className="text-sm text-gray-600">{segment.name}</p>
                    </div>
                  );
                })}
              </div>
          </div>
          )}

          {/* Metrics Preview */}
          {!MINIMAL_UI && emptyState.metrics && (
            <div className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 metrics-grid">
              <h3 className="font-semibold text-gray-900 mb-6">Expected Performance</h3>
              <div className="grid grid-cols-3 gap-6">
                {emptyState.metrics.map((metric, index) => (
                  <div key={index} className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                    <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                    {metric.trend !== '--' && (
                      <p className={`text-sm font-medium ${metric.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {metric.trend}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call to Action */}
          {!MINIMAL_UI && (
          <div className="p-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white integration-notice">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">Ready to understand your fans better?</h3>
                <p className="text-purple-100">
                  {profile?.goals?.includes('revenue') 
                    ? 'Identify high-value fans and maximize earnings'
                    : profile?.goals?.includes('growth')
                    ? 'Track fan growth and engagement patterns'
                    : profile?.goals?.includes('time')
                    ? 'Automate fan management and save hours'
                    : 'Build deeper connections with smart insights'}
                </p>
              </div>
              <button 
                onClick={() => router.push('/automations')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur border border-white/30 rounded-xl hover:bg-white/30 transition-colors font-medium"
              >
                <Zap className="w-5 h-5" />
                Setup Automations
              </button>
            </div>
          </div>
          )}
        </div>

        {!MINIMAL_UI && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6 integration-notice">
          <div className="flex items-start gap-4">
            <Bot className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">
                {profile?.niche === 'fitness' ? 'AI-Powered Client Insights' :
                 profile?.niche === 'gaming' ? 'Smart Community Analytics' :
                 profile?.niche === 'adult' ? 'Revenue Optimization AI' :
                 'Intelligent Fan Analysis'}
              </h4>
              <p className="text-blue-800">
                {profile?.niche === 'fitness' 
                  ? 'Our AI analyzes workout patterns and suggests personalized check-in times for each client.'
                  : profile?.niche === 'gaming'
                  ? 'AI tracks viewer patterns and suggests optimal stream times for maximum engagement.'
                  : profile?.niche === 'adult'
                  ? 'Smart algorithms predict renewal likelihood and suggest targeted retention campaigns.'
                  : 'Advanced AI helps you understand fan behavior and optimize engagement strategies.'}
              </p>
              <Link href="/ai/insights" className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-blue-900 hover:text-blue-700">
                Learn about AI insights
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
        )}
      </main>
    </div>
  );
}
