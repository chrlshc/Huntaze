'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Search,
  Filter,
  Plus,
  Users,
  DollarSign,
  Calendar,
  MessageSquare,
  Star,
  Heart,
  Crown,
  TrendingUp
} from 'lucide-react';

export default function MobileFans() {
  const [activeFilter, setActiveFilter] = useState('all');
  
  const filters = [
    { id: 'all', label: 'All Fans' },
    { id: 'vip', label: 'VIP' },
    { id: 'top', label: 'Top Spenders' },
    { id: 'new', label: 'New' },
    { id: 'inactive', label: 'Inactive' }
  ];

  const fans = [
    {
      id: 1,
      name: 'Alex Thompson',
      avatar: 'https://ui-avatars.com/api/?name=Alex+Thompson&background=gradient',
      isVip: true,
      totalSpent: '$2,456',
      joinDate: '3 months ago',
      lastActive: '2 hours ago',
      tier: 'platinum',
      messages: 156,
      purchases: 23
    },
    {
      id: 2,
      name: 'Sarah Mitchell',
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Mitchell&background=gradient',
      isVip: true,
      totalSpent: '$1,847',
      joinDate: '6 months ago',
      lastActive: '1 day ago',
      tier: 'gold',
      messages: 89,
      purchases: 15
    },
    {
      id: 3,
      name: 'Mike Johnson',
      avatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=gradient',
      isVip: false,
      totalSpent: '$567',
      joinDate: '1 month ago',
      lastActive: '3 days ago',
      tier: 'silver',
      messages: 34,
      purchases: 5
    },
    {
      id: 4,
      name: 'Emma Wilson',
      avatar: 'https://ui-avatars.com/api/?name=Emma+Wilson&background=gradient',
      isVip: false,
      totalSpent: '$234',
      joinDate: '2 weeks ago',
      lastActive: '1 week ago',
      tier: 'bronze',
      messages: 12,
      purchases: 2
    }
  ];

  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'platinum': return 'from-purple-600 to-pink-600';
      case 'gold': return 'from-yellow-400 to-orange-400';
      case 'silver': return 'from-gray-400 to-gray-500';
      case 'bronze': return 'from-orange-600 to-red-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getTierIcon = (tier: string) => {
    switch(tier) {
      case 'platinum': return Crown;
      case 'gold': return Star;
      case 'silver': return Heart;
      default: return Heart;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Fans</h1>
            <div className="flex items-center gap-2">
              <button className="p-2.5 bg-white rounded-full shadow-sm border border-gray-100">
                <Search className="w-5 h-5 text-gray-700" />
              </button>
              <button className="p-2.5 bg-white rounded-full shadow-sm border border-gray-100">
                <Filter className="w-5 h-5 text-gray-700" />
              </button>
              <Link href="/fans/add" className="p-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg">
                <Plus className="w-5 h-5 text-white" />
              </Link>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">1,247</p>
            <p className="text-sm text-gray-600">Total Fans</p>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-pink-600" />
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Top 5%</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">$124</p>
            <p className="text-sm text-gray-600">Avg. Value</p>
          </div>
        </div>
      </div>

      {/* Fans List */}
      <div className="px-4 space-y-3">
        {fans.map((fan) => {
          const TierIcon = getTierIcon(fan.tier);
          
          return (
            <Link
              key={fan.id}
              href={`/fans/${fan.id}`}
              className="block bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <img
                      src={fan.avatar}
                      alt={fan.name}
                      className="w-14 h-14 rounded-2xl"
                    />
                    {fan.isVip && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-md">
                        <Crown className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="font-semibold text-gray-900">{fan.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r ${getTierColor(fan.tier)} text-white rounded-full text-xs font-semibold`}>
                            <TierIcon className="w-3 h-3" />
                            <span className="capitalize">{fan.tier}</span>
                          </div>
                          <span className="text-xs text-gray-500">Joined {fan.joinDate}</span>
                        </div>
                      </div>
                      <span className="font-bold text-gray-900">{fan.totalSpent}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{fan.messages}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{fan.purchases} purchases</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{fan.lastActive}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="border-t border-gray-100 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">Quick Actions:</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        // Handle message action
                      }}
                      className="px-3 py-1.5 bg-white text-purple-600 rounded-full text-xs font-medium border border-purple-200"
                    >
                      Message
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        // Handle offer action
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-xs font-medium shadow-sm"
                    >
                      Send Offer
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty State */}
      {fans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mb-6">
            <Users className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Build Your Community</h3>
          <p className="text-gray-600 text-center mb-6">Start connecting with your amazing fans</p>
          <Link
            href="/fans/add"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Add First Fan
          </Link>
        </div>
      )}
    </div>
  );
}