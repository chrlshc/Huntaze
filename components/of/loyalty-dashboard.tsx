'use client';

import { useState } from 'react';
import { 
  Trophy, 
  Star, 
  Gift, 
  Target, 
  Zap,
  TrendingUp,
  Award,
  Heart,
  Calendar,
  Clock
} from 'lucide-react';
import { POINT_RULES, REWARDS_CATALOG } from '@/lib/of/subscription-tiers';

interface FanLoyaltyData {
  fanId: string;
  username: string;
  avatar: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  nextMilestone: number;
  joinDate: Date;
  totalSpent: number;
  subscriptionMonths: number;
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    earnedAt: Date;
  }>;
  recentActivity: Array<{
    type: string;
    points: number;
    date: Date;
  }>;
}

export default function LoyaltyDashboard() {
  const [selectedFan, setSelectedFan] = useState<FanLoyaltyData | null>(null);
  
  // Mock data
  const topFans: FanLoyaltyData[] = [
    {
      fanId: '1',
      username: 'BigSpender23',
      avatar: '🦈',
      points: 4250,
      tier: 'gold',
      nextMilestone: 5000,
      joinDate: new Date('2023-06-15'),
      totalSpent: 1250,
      subscriptionMonths: 8,
      badges: [
        { id: '1', name: '6 Month Member', icon: '📅', earnedAt: new Date('2024-01-15') },
        { id: '2', name: 'Big Tipper', icon: '💰', earnedAt: new Date('2023-12-20') },
        { id: '3', name: 'VIP Whale', icon: '🐋', earnedAt: new Date('2024-02-01') }
      ],
      recentActivity: [
        { type: 'PPV Purchase', points: 50, date: new Date() },
        { type: 'Monthly Sub', points: 100, date: new Date(Date.now() - 86400000) },
        { type: 'Tip $100', points: 100, date: new Date(Date.now() - 172800000) }
      ]
    },
    {
      fanId: '2',
      username: 'LoyalFan99',
      avatar: '👑',
      points: 2850,
      tier: 'gold',
      nextMilestone: 3000,
      joinDate: new Date('2023-04-20'),
      totalSpent: 890,
      subscriptionMonths: 10,
      badges: [
        { id: '1', name: 'Founding Member', icon: '🎖️', earnedAt: new Date('2023-04-20') },
        { id: '2', name: 'Never Missed', icon: '🔥', earnedAt: new Date('2024-01-20') }
      ],
      recentActivity: [
        { type: 'Anniversary Bonus', points: 200, date: new Date(Date.now() - 86400000) },
        { type: 'Live Attendance', points: 20, date: new Date(Date.now() - 259200000) }
      ]
    }
  ];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-orange-600 bg-orange-100';
      case 'silver': return 'text-gray-600 bg-gray-100';
      case 'gold': return 'text-yellow-600 bg-yellow-100';
      case 'platinum': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '💎';
      default: return '⭐';
    }
  };

  const calculateProgress = (current: number, milestone: number) => {
    const previousMilestone = Math.floor(current / 500) * 500;
    const progress = ((current - previousMilestone) / (milestone - previousMilestone)) * 100;
    return Math.min(progress, 100);
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <Trophy className="w-5 h-5 text-purple-600 mb-2" />
          <p className="text-sm text-gray-500">Active Loyalty Members</p>
          <p className="text-2xl font-bold">342</p>
          <p className="text-xs text-green-600">+23% this month</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <Star className="w-5 h-5 text-yellow-600 mb-2" />
          <p className="text-sm text-gray-500">Total Points Earned</p>
          <p className="text-2xl font-bold">892.5K</p>
          <p className="text-xs text-gray-600">Across all fans</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <Gift className="w-5 h-5 text-green-600 mb-2" />
          <p className="text-sm text-gray-500">Rewards Redeemed</p>
          <p className="text-2xl font-bold">156</p>
          <p className="text-xs text-purple-600">$3,120 value</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <TrendingUp className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-sm text-gray-500">Avg Retention</p>
          <p className="text-2xl font-bold">8.7mo</p>
          <p className="text-xs text-green-600">+2.3mo vs non-loyalty</p>
        </div>
      </div>

      {/* Top Loyalty Members */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5" />
          Top Loyalty Members
        </h2>
        
        <div className="space-y-4">
          {topFans.map((fan, index) => (
            <div 
              key={fan.fanId}
              onClick={() => setSelectedFan(fan)}
              className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="text-3xl">{fan.avatar}</div>
                  {index < 3 && (
                    <div className="absolute -top-1 -right-1 text-xs">
                      {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{fan.username}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getTierColor(fan.tier)}`}>
                      {getTierIcon(fan.tier)} {fan.tier.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{fan.points.toLocaleString()} points</span>
                    <span>•</span>
                    <span>${fan.totalSpent} spent</span>
                    <span>•</span>
                    <span>{fan.subscriptionMonths} months</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1">
                  {fan.badges.slice(0, 3).map(badge => (
                    <span key={badge.id} title={badge.name}>
                      {badge.icon}
                    </span>
                  ))}
                  {fan.badges.length > 3 && (
                    <span className="text-xs text-gray-500">+{fan.badges.length - 3}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Next: {fan.nextMilestone.toLocaleString()} pts
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Fan Details */}
      {selectedFan && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{selectedFan.avatar}</div>
              <div>
                <h2 className="text-xl font-semibold">{selectedFan.username}</h2>
                <p className="text-sm text-gray-500">
                  Member since {selectedFan.joinDate.toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedFan(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Progress to Next Milestone */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Progress to Next Milestone</span>
              <span className="text-sm text-gray-500">
                {selectedFan.points} / {selectedFan.nextMilestone} points
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                style={{ width: `${calculateProgress(selectedFan.points, selectedFan.nextMilestone)}%` }}
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mb-6">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Activity
            </h3>
            <div className="space-y-2">
              {selectedFan.recentActivity.map((activity, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{activity.type}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    +{activity.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <button className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
              Send Reward
            </button>
            <button className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
              Award Bonus Points
            </button>
          </div>
        </div>
      )}

      {/* Rewards Catalog */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Active Rewards
        </h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          {REWARDS_CATALOG.slice(0, 6).map(reward => (
            <div key={reward.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-sm">{reward.name}</h3>
                <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                  {reward.cost} pts
                </span>
              </div>
              
              <div className="flex justify-between items-end mt-4">
                <p className="text-xs text-gray-500">
                  {reward.type === 'discount' && `${Number(reward.value) * 100}% off`}
                  {reward.type === 'content' && 'Exclusive'}
                  {reward.type === 'experience' && 'Special'}
                  {reward.type === 'upgrade' && 'Tier upgrade'}
                </p>
                <p className="text-xs text-green-600">
                  23 redeemed
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Points Earning Guide */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
        <h3 className="font-semibold mb-4">How Fans Earn Points</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Regular Actions</h4>
            <ul className="space-y-1 text-sm">
              <li className="flex justify-between">
                <span>Monthly subscription</span>
                <span className="font-medium">{POINT_RULES.subscription} pts</span>
              </li>
              <li className="flex justify-between">
                <span>PPV purchase</span>
                <span className="font-medium">{POINT_RULES.ppv_purchase} pts</span>
              </li>
              <li className="flex justify-between">
                <span>Send message</span>
                <span className="font-medium">{POINT_RULES.message_sent} pt</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-sm mb-2">Bonus Points</h4>
            <ul className="space-y-1 text-sm">
              <li className="flex justify-between">
                <span>Anniversary</span>
                <span className="font-medium">{POINT_RULES.anniversary} pts</span>
              </li>
              <li className="flex justify-between">
                <span>Referral</span>
                <span className="font-medium">{POINT_RULES.referral} pts</span>
              </li>
              <li className="flex justify-between">
                <span>Live attendance</span>
                <span className="font-medium">{POINT_RULES.live_attendance} pts</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
