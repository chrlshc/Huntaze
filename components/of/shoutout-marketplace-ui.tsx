'use client';

import { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Star,
  MessageSquare,
  Calendar,
  Filter,
  Check,
  X,
  Clock,
  Award
} from 'lucide-react';
import { SHOUTOUT_TIPS } from '@/lib/of/shoutout-marketplace';

interface ShoutoutPartner {
  id: string;
  username: string;
  platform: 'onlyfans' | 'instagram' | 'tiktok';
  avatar: string;
  followers: number;
  engagementRate: number;
  niche: string[];
  priceRange: string;
  shoutoutRates?: {
    story: number;
    post: number;
    reel: number;
  };
  compatibility: number;
  lastActive: Date;
  verified: boolean;
  successRate: number;
  avgNewFollowers: number;
}

interface ShoutoutDeal {
  id: string;
  partner: ShoutoutPartner;
  type: 'S4S' | 'paid';
  status: 'pending' | 'accepted' | 'scheduled' | 'completed';
  scheduledDate: Date;
  contentType: 'story' | 'post' | 'reel';
  performance?: {
    newFollowers: number;
    revenue: number;
  };
}

export default function ShoutoutMarketplaceUI() {
  const [activeTab, setActiveTab] = useState<'discover' | 'active' | 'history'>('discover');
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [selectedDealType, setSelectedDealType] = useState<'all' | 'S4S' | 'paid'>('all');
  
  // Mock data
  const partners: ShoutoutPartner[] = [
    {
      id: '1',
      username: 'FitnessBabe23',
      platform: 'onlyfans',
      avatar: '💪',
      followers: 45000,
      engagementRate: 4.9,
      niche: ['fitness', 'lifestyle'],
      priceRange: '$$',
      shoutoutRates: { story: 50, post: 150, reel: 200 },
      compatibility: 0.92,
      lastActive: new Date(),
      verified: true,
      successRate: 87,
      avgNewFollowers: 142
    },
    {
      id: '2',
      username: 'GamerGirlXO',
      platform: 'onlyfans',
      avatar: '🎮',
      followers: 38000,
      engagementRate: 8.2,
      niche: ['gaming', 'cosplay'],
      priceRange: '$$',
      compatibility: 0.78,
      lastActive: new Date(Date.now() - 86400000),
      verified: true,
      successRate: 82,
      avgNewFollowers: 98
    },
    {
      id: '3',
      username: 'YogaGoddess',
      platform: 'onlyfans',
      avatar: '🧘',
      followers: 52000,
      engagementRate: 6.1,
      niche: ['fitness', 'wellness'],
      priceRange: '$$$',
      shoutoutRates: { story: 75, post: 200, reel: 300 },
      compatibility: 0.85,
      lastActive: new Date(),
      verified: true,
      successRate: 91,
      avgNewFollowers: 178
    }
  ];

  const activeDeals: ShoutoutDeal[] = [
    {
      id: '1',
      partner: partners[0],
      type: 'S4S',
      status: 'scheduled',
      scheduledDate: new Date(Date.now() + 86400000),
      contentType: 'story'
    },
    {
      id: '2',
      partner: partners[2],
      type: 'paid',
      status: 'pending',
      scheduledDate: new Date(Date.now() + 172800000),
      contentType: 'post'
    }
  ];

  const completedDeals: ShoutoutDeal[] = [
    {
      id: '3',
      partner: partners[1],
      type: 'S4S',
      status: 'completed',
      scheduledDate: new Date(Date.now() - 604800000),
      contentType: 'reel',
      performance: {
        newFollowers: 127,
        revenue: 1905
      }
    }
  ];

  const niches = ['fitness', 'gaming', 'lifestyle', 'cosplay', 'wellness'];

  const getCompatibilityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderPartnerCard = (partner: ShoutoutPartner) => (
    <div key={partner.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{partner.avatar}</div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{partner.username}</h3>
              {partner.verified && (
                <Check className="w-4 h-4 text-blue-500" />
              )}
            </div>
            <p className="text-sm text-gray-500">
              {partner.followers.toLocaleString()} followers
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-2xl font-bold ${getCompatibilityColor(partner.compatibility)}`}>
            {Math.round(partner.compatibility * 100)}%
          </div>
          <p className="text-xs text-gray-500">match</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Stats */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Engagement</span>
          <span className="font-medium">{partner.engagementRate}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Success Rate</span>
          <span className="font-medium">{partner.successRate}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Avg New Fans</span>
          <span className="font-medium text-green-600">+{partner.avgNewFollowers}</span>
        </div>
        
        {/* Niches */}
        <div className="flex gap-2 flex-wrap">
          {partner.niche.map(n => (
            <span key={n} className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
              {n}
            </span>
          ))}
        </div>
        
        {/* Rates */}
        {partner.shoutoutRates && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 mb-2">Paid Shoutout Rates:</p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Story</span>
                <p className="font-medium">${partner.shoutoutRates.story}</p>
              </div>
              <div>
                <span className="text-gray-500">Post</span>
                <p className="font-medium">${partner.shoutoutRates.post}</p>
              </div>
              <div>
                <span className="text-gray-500">Reel</span>
                <p className="font-medium">${partner.shoutoutRates.reel}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2 pt-3">
          <button className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
            Send S4S Proposal
          </button>
          {partner.shoutoutRates && (
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <DollarSign className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderDealCard = (deal: ShoutoutDeal, showPerformance = false) => (
    <div key={deal.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{deal.partner.avatar}</div>
          <div>
            <h3 className="font-semibold">{deal.partner.username}</h3>
            <p className="text-sm text-gray-500">
              {deal.type === 'S4S' ? 'Shoutout for Shoutout' : 'Paid Shoutout'}
            </p>
          </div>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          deal.status === 'completed' ? 'bg-green-100 text-green-700' :
          deal.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
          deal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {deal.status}
        </span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Content Type</span>
          <span className="font-medium capitalize">{deal.contentType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Scheduled</span>
          <span className="font-medium">
            {deal.scheduledDate.toLocaleDateString()}
          </span>
        </div>
        
        {showPerformance && deal.performance && (
          <>
            <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">New Followers</span>
                <span className="font-medium text-green-600">
                  +{deal.performance.newFollowers}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Revenue Generated</span>
                <span className="font-medium text-green-600">
                  ${deal.performance.revenue}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
      
      {deal.status === 'pending' && (
        <div className="flex gap-2 mt-4">
          <button className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
            Accept
          </button>
          <button className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm">
            Negotiate
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <Users className="w-5 h-5 text-purple-600 mb-2" />
          <p className="text-sm text-gray-500">Total S4S Partners</p>
          <p className="text-2xl font-bold">47</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <TrendingUp className="w-5 h-5 text-green-600 mb-2" />
          <p className="text-sm text-gray-500">Avg New Fans/Shoutout</p>
          <p className="text-2xl font-bold">+127</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <DollarSign className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-sm text-gray-500">Revenue from S4S</p>
          <p className="text-2xl font-bold">$14.2K</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <Award className="w-5 h-5 text-yellow-600 mb-2" />
          <p className="text-sm text-gray-500">Success Rate</p>
          <p className="text-2xl font-bold">86%</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {(['discover', 'active', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800'
            }`}
          >
            {tab}
            {tab === 'active' && ` (${activeDeals.length})`}
          </button>
        ))}
      </div>

      {/* Discover Tab */}
      {activeTab === 'discover' && (
        <>
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </h3>
              
              <select
                value={selectedDealType}
                onChange={(e) => setSelectedDealType(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              >
                <option value="all">All Types</option>
                <option value="S4S">S4S Only</option>
                <option value="paid">Paid Only</option>
              </select>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {niches.map(niche => (
                <button
                  key={niche}
                  onClick={() => setSelectedNiche(selectedNiche === niche ? null : niche)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedNiche === niche
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {niche}
                </button>
              ))}
            </div>
          </div>

          {/* Partner Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {partners
              .filter(p => !selectedNiche || p.niche.includes(selectedNiche))
              .map(renderPartnerCard)}
          </div>
        </>
      )}

      {/* Active Deals Tab */}
      {activeTab === 'active' && (
        <div className="grid md:grid-cols-2 gap-6">
          {activeDeals.map(deal => renderDealCard(deal))}
          
          {activeDeals.length === 0 && (
            <div className="col-span-2 text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No active shoutout deals</p>
              <button 
                onClick={() => setActiveTab('discover')}
                className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Discover Partners
              </button>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            {completedDeals.map(deal => renderDealCard(deal, true))}
          </div>
          
          {/* Best Practices */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Shoutout Best Practices</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(SHOUTOUT_TIPS).slice(0, 2).map(([category, tips]) => (
                <div key={category}>
                  <h4 className="font-medium text-sm mb-2 capitalize">
                    {category.replace('_', ' ')}
                  </h4>
                  <ul className="space-y-1">
                    {tips.map((tip, idx) => (
                      <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}