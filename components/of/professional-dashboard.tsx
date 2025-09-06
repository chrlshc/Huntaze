'use client';

import { useState } from 'react';
import { 
  LayoutDashboard,
  Trophy,
  Users,
  TrendingUp,
  DollarSign,
  Sparkles,
  ChevronRight,
  Target,
  Zap,
  Gift,
  Calendar
} from 'lucide-react';

// Import our dashboards
import LoyaltyDashboard from './loyalty-dashboard';
import ShoutoutMarketplaceUI from './shoutout-marketplace-ui';
import TrendCalendar from './trend-calendar';

export default function ProfessionalDashboard() {
  const [activeView, setActiveView] = useState<'overview' | 'loyalty' | 'shoutouts' | 'trends'>('overview');

  const features = [
    {
      id: 'loyalty',
      name: 'Loyalty & Rewards',
      description: 'Points system to retain top fans',
      icon: Trophy,
      color: 'purple',
      stats: {
        value: '342',
        label: 'Loyalty Members',
        growth: '+23%'
      }
    },
    {
      id: 'shoutouts',
      name: 'S4S Marketplace',
      description: 'Find perfect shoutout partners',
      icon: Users,
      color: 'blue',
      stats: {
        value: '47',
        label: 'Partners Available',
        growth: '+127 fans/S4S'
      }
    },
    {
      id: 'trends',
      name: 'Trend Calendar',
      description: 'Viral content planning',
      icon: TrendingUp,
      color: 'green',
      stats: {
        value: '12',
        label: 'Hot Trends',
        growth: '+142% revenue'
      }
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
    };
    return colors[color as keyof typeof colors] || colors.purple;
  };

  if (activeView !== 'overview') {
    return (
      <div className="space-y-6">
        {/* Navigation */}
        <button
          onClick={() => setActiveView('overview')}
          className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline"
        >
          <LayoutDashboard className="w-4 h-4" />
          Back to Overview
        </button>

        {/* Active Dashboard */}
        {activeView === 'loyalty' && <LoyaltyDashboard />}
        {activeView === 'shoutouts' && <ShoutoutMarketplaceUI />}
        {activeView === 'trends' && <TrendCalendar />}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Professional OF Tools</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Advanced features to scale your OnlyFans business
        </p>
      </div>

      {/* Revenue Impact */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            Professional Tools = Professional Results
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Creators using all 3 professional features see an average revenue increase of
          </p>
          <div className="text-5xl font-bold mb-2">+247%</div>
          <p className="text-sm opacity-75">
            Based on 3-month average across 127 creators
          </p>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <button
              key={feature.id}
              onClick={() => setActiveView(feature.id as any)}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${getColorClasses(feature.color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
              
              <h3 className="text-lg font-semibold mb-1">{feature.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {feature.description}
              </p>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-baseline">
                  <div>
                    <p className="text-2xl font-bold">{feature.stats.value}</p>
                    <p className="text-xs text-gray-500">{feature.stats.label}</p>
                  </div>
                  <p className="text-sm text-green-600 font-medium">
                    {feature.stats.growth}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Impact Metrics
        </h2>
        
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="text-3xl font-bold">$4.99</p>
            <p className="text-sm text-gray-500">Optimal Sub Price</p>
            <p className="text-xs text-green-600 mt-1">3x more subscribers</p>
          </div>
          
          <div className="text-center">
            <Gift className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <p className="text-3xl font-bold">8.7mo</p>
            <p className="text-sm text-gray-500">Avg Retention</p>
            <p className="text-xs text-green-600 mt-1">+2.3mo vs standard</p>
          </div>
          
          <div className="text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="text-3xl font-bold">127</p>
            <p className="text-sm text-gray-500">New Fans per S4S</p>
            <p className="text-xs text-green-600 mt-1">86% success rate</p>
          </div>
          
          <div className="text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
            <p className="text-3xl font-bold">3.7%</p>
            <p className="text-sm text-gray-500">Trend Conversion</p>
            <p className="text-xs text-green-600 mt-1">+2.1% vs average</p>
          </div>
        </div>
      </div>

      {/* Success Timeline */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-8">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Your Success Timeline
        </h2>
        
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold">Week 1-2: Set Up Loyalty System</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Launch points & rewards. Expect 20-30% of fans to engage immediately.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold">Week 3-4: Start S4S Partnerships</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connect with 5-10 creators. Aim for 2-3 shoutouts per week.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold">Month 2: Ride Trend Waves</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Post 3-4 trend-based content per week. Watch conversion rates soar.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center">
              🚀
            </div>
            <div>
              <h3 className="font-semibold">Month 3: See 200%+ Revenue Growth</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Most creators triple their income by consistently using all features.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={() => setActiveView('loyalty')}
          className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          Start with Loyalty System
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Most creators start here and see results within days
        </p>
      </div>
    </div>
  );
}