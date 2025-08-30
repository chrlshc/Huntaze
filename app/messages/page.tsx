'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  ChevronLeft,
  Inbox,
  Send,
  Heart,
  Star,
  Clock,
  Bot,
  TrendingUp,
  UserPlus,
  Zap,
  ArrowRight,
  Sparkles,
  Target,
  DollarSign,
  Users,
  Calendar,
  Globe,
  CheckCircle,
  Plus
} from 'lucide-react';
import { MINIMAL_UI } from '@/lib/ui';

export default function MessagesPage() {
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

  // Get personalized empty state content based on niche and goals
  const getEmptyStateContent = () => {
    if (!hasConnectedPlatforms) {
      return {
        icon: Globe,
        title: "Connect Your Platform First",
        description: MINIMAL_UI ? '' : "Link your OnlyFans or Fansly account to start managing messages",
        action: {
          label: "Connect Platform",
          href: "/onboarding/setup?step=3",
          icon: Plus
        },
        tips: [
          { icon: CheckCircle, text: "Secure OAuth connection" },
          { icon: Zap, text: "Instant message sync" },
          { icon: Bot, text: "AI automation ready" }
        ]
      };
    }

    if (profile?.niche === 'fitness') {
      return {
        icon: MessageSquare,
        title: "Your Fitness Community Hub",
        description: MINIMAL_UI ? '' : "Manage conversations with clients, share workout plans, and provide motivation",
        action: {
          label: "Import Messages",
          href: "/messages/import",
          icon: Send
        },
        tips: [
          { icon: Target, text: "Set up workout check-in automations" },
          { icon: Heart, text: "Send motivational messages at optimal times" },
          { icon: Calendar, text: "Schedule nutrition tips and challenges" },
          { icon: TrendingUp, text: "Track client progress and engagement" }
        ],
        stats: [
          { label: "Avg. Response Time", value: "< 2 min", icon: Clock },
          { label: "Client Satisfaction", value: "95%", icon: Star },
          { label: "Monthly Check-ins", value: "450+", icon: Users }
        ]
      };
    }

    if (profile?.niche === 'gaming') {
      return {
        icon: MessageSquare,
        title: "Gaming Community Messages",
        description: MINIMAL_UI ? '' : "Connect with your gaming fans, share exclusive content, and build your community",
        action: {
          label: "Start Messaging",
          href: "/messages/inbox",
          icon: Send
        },
        tips: [
          { icon: Zap, text: "Auto-reply during streams" },
          { icon: Star, text: "VIP perks for top supporters" },
          { icon: Calendar, text: "Schedule game session invites" },
          { icon: Heart, text: "Thank fans for bits and donations" }
        ],
        stats: [
          { label: "Active Fans", value: "2.4K", icon: Users },
          { label: "Stream Alerts", value: "Auto", icon: Bot },
          { label: "Response Rate", value: "94%", icon: TrendingUp }
        ]
      };
    }

    if (profile?.niche === 'adult') {
      return {
        icon: MessageSquare,
        title: "Premium Message Center",
        description: MINIMAL_UI ? '' : "Engage with subscribers, send PPV content, and maximize your earnings",
        action: {
          label: "View Messages",
          href: "/messages/inbox",
          icon: Inbox
        },
        tips: [
          { icon: DollarSign, text: "Send targeted PPV messages" },
          { icon: Bot, text: "AI handles initial conversations" },
          { icon: Heart, text: "Build deeper connections" },
          { icon: Clock, text: "Peak hours: 10 PM - 2 AM" }
        ],
        stats: [
          { label: "PPV Revenue", value: "$45K/mo", icon: DollarSign },
          { label: "Response Rate", value: "98%", icon: Bot },
          { label: "VIP Fans", value: "234", icon: Star }
        ]
      };
    }

    if (profile?.niche === 'fashion') {
      return {
        icon: MessageSquare,
        title: "Fashion Community Chat",
        description: MINIMAL_UI ? '' : "Share style tips, exclusive looks, and connect with fashion enthusiasts",
        action: {
          label: "Open Inbox",
          href: "/messages/inbox",
          icon: Inbox
        },
        tips: [
          { icon: Sparkles, text: "Share exclusive outfit previews" },
          { icon: Calendar, text: "Schedule collection launches" },
          { icon: Heart, text: "Get style feedback from fans" },
          { icon: Target, text: "Promote brand collaborations" }
        ],
        stats: [
          { label: "Style Fans", value: "5.2K", icon: Users },
          { label: "Engagement", value: "12.3%", icon: Heart },
          { label: "Collab Requests", value: "28", icon: Sparkles }
        ]
      };
    }

    // Default for other niches
    return {
      icon: MessageSquare,
      title: "Start Engaging with Your Fans",
      description: MINIMAL_UI ? '' : `Connect authentically and grow your ${profile?.niche || 'creator'} community`,
      action: {
        label: "Open Messages",
        href: "/messages/inbox",
        icon: Send
      },
      tips: [
        { icon: Bot, text: "AI assistant handles routine messages" },
        { icon: Clock, text: "Schedule messages for optimal times" },
        { icon: Heart, text: "Build meaningful connections" },
        { icon: DollarSign, text: "Monetize through personalized content" }
      ],
      stats: [
        { label: "Avg. Revenue/Fan", value: "$47", icon: DollarSign },
        { label: "Response Time", value: "< 5 min", icon: Clock },
        { label: "Satisfaction", value: "4.8/5", icon: Star }
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
                <MessageSquare className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                {aiConfig?.responseStyle && (
                  <span className="px-2 py-1 text-xs rounded-lg bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    AI {aiConfig.responseStyle}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Import Messages
              </button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
                Compose New
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-12 max-w-6xl mx-auto">
        {/* Empty State */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Hero Section */}
          <div className="p-12 text-center border-b border-gray-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl mb-6">
              <Icon className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{emptyState.title}</h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8">{emptyState.description}</p>
            
            <Link 
              href={emptyState.action.href}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-600/25 transition-all font-medium"
            >
              <emptyState.action.icon className="w-5 h-5" />
              {emptyState.action.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Tips Grid */}
          <div className="p-8 bg-gradient-to-br from-gray-50 to-white">
            <h3 className="font-semibold text-gray-900 mb-6">What you can do with Messages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emptyState.tips.map((tip, index) => {
                const TipIcon = tip.icon;
                return (
                  <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                      <TipIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-gray-700">{tip.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats Section (if available) */}
          {emptyState.stats && (
            <div className="p-8 bg-gradient-to-br from-purple-50 to-pink-50">
              <h3 className="font-semibold text-gray-900 mb-6">Expected Performance</h3>
              <div className="grid grid-cols-3 gap-6">
                {emptyState.stats.map((stat, index) => {
                  const StatIcon = stat.icon;
                  return (
                    <div key={index} className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-xl mb-3">
                        <StatIcon className="w-6 h-6 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="p-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">Ready to boost engagement?</h3>
                <p className="text-purple-100">
                  {profile?.goals?.includes('revenue') 
                    ? 'Start conversations that convert to sales'
                    : profile?.goals?.includes('growth')
                    ? 'Build a loyal community of engaged fans'
                    : profile?.goals?.includes('time')
                    ? 'Let AI handle routine messages while you create'
                    : 'Connect with your audience like never before'}
                </p>
              </div>
              <button 
                onClick={() => router.push('/ai/training')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur border border-white/30 rounded-xl hover:bg-white/30 transition-colors font-medium"
              >
                <Sparkles className="w-5 h-5" />
                Configure AI Assistant
              </button>
            </div>
          </div>
        </div>

        {/* Quick Setup Guide */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <UserPlus className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-1">Quick Setup Guide</h4>
              <ol className="text-amber-800 space-y-1">
                <li>1. {hasConnectedPlatforms ? 'Import your existing messages' : 'Connect your OnlyFans/Fansly account'}</li>
                <li>2. Configure your AI assistant personality</li>
                <li>3. Set up automated welcome messages</li>
                <li>4. Create message templates for common scenarios</li>
              </ol>
              <Link href="/help/messages" className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-amber-900 hover:text-amber-700">
                View complete guide
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
