'use client';

import { useState, useEffect } from 'react';
import { 
  Instagram, 
  Twitter, 
  Video,
  Link2,
  TrendingUp,
  Calendar,
  AlertCircle,
  Hash,
  MessageCircle,
  BarChart,
  Shield
} from 'lucide-react';
import { PLATFORM_STRATEGIES, GROWTH_TACTICS } from '@/lib/marketing/cross-platform-growth';
import { IG_DM_TEMPLATES } from '@/lib/marketing/instagram-dm-automation';

interface PlatformStats {
  platform: string;
  followers: number;
  growth: number;
  engagement: number;
  clicks: number;
  conversions: number;
}

export default function CrossPlatformDashboard() {
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [stats, setStats] = useState<PlatformStats[]>([
    { platform: 'instagram', followers: 45200, growth: 12.5, engagement: 4.8, clicks: 892, conversions: 67 },
    { platform: 'tiktok', followers: 23100, growth: 25.3, engagement: 8.2, clicks: 445, conversions: 28 },
    { platform: 'twitter', followers: 8900, growth: 5.2, engagement: 2.1, clicks: 234, conversions: 19 }
  ]);

  const strategy = PLATFORM_STRATEGIES[selectedPlatform];
  const currentStats = stats.find(s => s.platform === selectedPlatform);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'tiktok': return <Video className="w-5 h-5" />;
      case 'twitter': return <Twitter className="w-5 h-5" />;
      default: return null;
    }
  };

  const getSFWBadgeColor = (level: string) => {
    switch (level) {
      case 'strict': return 'bg-red-100 text-red-700';
      case 'moderate': return 'bg-yellow-100 text-yellow-700';
      case 'spicy': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        {stats.map(stat => (
          <button
            key={stat.platform}
            onClick={() => setSelectedPlatform(stat.platform)}
            className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 transition-all ${
              selectedPlatform === stat.platform 
                ? 'border-purple-500' 
                : 'border-transparent hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              {getPlatformIcon(stat.platform)}
              <span className={`text-sm font-medium ${
                stat.growth > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.growth > 0 ? '+' : ''}{stat.growth}%
              </span>
            </div>
            
            <h3 className="font-semibold capitalize mb-1">{stat.platform}</h3>
            <p className="text-2xl font-bold">{stat.followers.toLocaleString()}</p>
            <p className="text-sm text-gray-500">followers</p>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span>Engagement</span>
                <span className="font-medium">{stat.engagement}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>→ OF Clicks</span>
                <span className="font-medium">{stat.clicks}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>→ Conversions</span>
                <span className="font-medium text-green-600">{stat.conversions}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Platform Strategy */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {getPlatformIcon(selectedPlatform)}
            <h2 className="text-xl font-semibold capitalize">{selectedPlatform} Strategy</h2>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSFWBadgeColor(strategy.sfwLevel)}`}>
            {strategy.sfwLevel.toUpperCase()} Content Only
          </span>
        </div>

        {/* Best Times */}
        <div className="mb-6">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Best Posting Times
          </h3>
          <div className="flex gap-2">
            {strategy.bestTimes.map(hour => (
              <div key={hour} className="px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-medium">
                {hour > 12 ? `${hour - 12}pm` : hour === 0 ? '12am' : `${hour}am`}
              </div>
            ))}
          </div>
        </div>

        {/* Banned Words Warning */}
        {strategy.bannedWords.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h3 className="font-medium mb-2 flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4" />
              Never Use These Words
            </h3>
            <div className="flex flex-wrap gap-2">
              {strategy.bannedWords.slice(0, 8).map(word => (
                <span key={word} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm">
                  {word}
                </span>
              ))}
              {strategy.bannedWords.length > 8 && (
                <span className="px-2 py-1 text-red-600 text-sm">
                  +{strategy.bannedWords.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Safe Hashtags */}
        <div className="mb-6">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Hash className="w-4 h-4" />
            Safe Hashtags
          </h3>
          <div className="flex flex-wrap gap-2">
            {strategy.safeTags.map(tag => (
              <button
                key={tag}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                onClick={() => navigator.clipboard.writeText(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Growth Tactics */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Growth Tactics
          </h3>
          <div className="space-y-2">
            {Object.entries((GROWTH_TACTICS as any)[selectedPlatform] || {}).slice(0, 1).map(([category, tactics]) => (
              <div key={category} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2 capitalize">{category.replace('_', ' ')}</h4>
                <ul className="space-y-1">
                  {(tactics as string[]).slice(0, 3).map((tactic, idx) => (
                    <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <span className="text-purple-600 mt-0.5">•</span>
                      {tactic}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instagram DM Automation */}
      {selectedPlatform === 'instagram' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Instagram DM Templates
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(IG_DM_TEMPLATES).slice(0, 4).map(([key, template]) => (
              <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium mb-2 capitalize">
                  {template.messageType.replace('_', ' ')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-3">
                  "{template.response}"
                </p>
                {template.followUpDelay && (
                  <p className="text-xs text-purple-600">
                    Follow-up after {template.followUpDelay}h
                  </p>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>⚠️ Important:</strong> Never mention "OnlyFans" directly in DMs. Always say "exclusive page" or "VIP content"
            </p>
          </div>
        </div>
      )}

      {/* Conversion Funnel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <BarChart className="w-5 h-5" />
          Cross-Platform Funnel
        </h2>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span>Social Media Followers</span>
              <span className="font-medium">77,200</span>
            </div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              <div className="h-full bg-purple-600 w-full" />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span>Bio Link Clicks</span>
              <span className="font-medium">1,571 (2.0%)</span>
            </div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: '20%' }} />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span>OF Subscriptions</span>
              <span className="font-medium">114 (7.3% of clicks)</span>
            </div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              <div className="h-full bg-green-600" style={{ width: '7.3%' }} />
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Total Conversion Rate:</strong> 0.15% (industry avg: 0.1%)
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              You're performing 50% better than average! 🎉
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <button className="p-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
          <Link2 className="w-5 h-5 mb-2" />
          <h4 className="font-semibold">Generate Caption</h4>
          <p className="text-sm opacity-90">AI-powered safe captions</p>
        </button>
        
        <button className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
          <Hash className="w-5 h-5 mb-2" />
          <h4 className="font-semibold">Find Hashtags</h4>
          <p className="text-sm opacity-90">Trending & safe tags</p>
        </button>
        
        <button className="p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
          <Shield className="w-5 h-5 mb-2" />
          <h4 className="font-semibold">Check Shadowban</h4>
          <p className="text-sm opacity-90">Detect account issues</p>
        </button>
      </div>
    </div>
  );
}
