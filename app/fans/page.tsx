'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GatedContent, GatedBanner } from '@/components/dashboard/GatedContent';
import { 
  Users, 
  ChevronLeft,
  UserPlus,
  Filter,
  Search,
  Plus
} from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold">Fans</h1>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm">
                <Filter className="w-4 h-4 inline mr-1" />
                Filter
              </button>
              <button className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm">
                <Search className="w-4 h-4 inline mr-1" />
                Search
              </button>
              <Link href="/fans/import" className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                <UserPlus className="w-4 h-4 inline mr-1" />
                Add Fan
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-6 max-w-6xl mx-auto">
        {/* Alert for no platform */}
        {!hasConnectedPlatforms && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
            <Link href="/platforms/connect" className="text-amber-800">
              Connect a platform to import fans →
            </Link>
          </div>
        )}
        
        {/* Fans list */}
        {fans.length > 0 ? (
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-medium">All Fans ({fans.length})</h3>
              <Link href="/fans/import" className="text-sm text-purple-600">Add</Link>
            </div>
            <div className="divide-y">
              {fans.map((f) => (
                <div key={f.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-medium">{f.name}</p>
                    <p className="text-sm text-gray-500">{f.platform || 'custom'}</p>
                  </div>
                  {typeof f.valueCents === 'number' && f.valueCents > 0 && (
                    <span className="text-sm font-medium">${(f.valueCents/100).toFixed(2)}/mo</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (

          {/* Empty State */}
          <div className="bg-white rounded-lg border p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No fans yet</h2>
            <p className="text-gray-600 mb-6">Start building your fan database</p>
            
            <Link 
              href={hasConnectedPlatforms ? "/fans/import" : "/platforms/connect"}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
              {hasConnectedPlatforms ? "Add First Fan" : "Connect Platform"}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
