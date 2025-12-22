'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, DollarSign, Calendar, TrendingUp, RefreshCw } from 'lucide-react';
import useSWR from 'swr';
import { EmptyState } from '@/components/ui/EmptyState';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';

interface FansApiItem {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  subscriptionTier?: string;
  subscriptionAmount: number;
  subscriptionStatus: 'active' | 'cancelled' | 'expired';
  subscribedAt: string;
  expiresAt?: string;
  totalSpent: number;
  messageCount: number;
  lastMessageAt?: string;
}

interface FansApiResponse {
  success: boolean;
  data?: {
    items: FansApiItem[];
  };
}

function formatRelativeTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function FanProfilePage() {
  const params = useParams();
  const fanId = params.id as string;

  const { data, error, isLoading, mutate } = useSWR<FansApiResponse>(
    '/api/onlyfans/fans?limit=100&offset=0',
    (url) => internalApiFetch<FansApiResponse>(url),
  );

  const fan = useMemo(() => {
    const items = data?.data?.items ?? [];
    const selected = items.find((item) => item.id === fanId);
    if (!selected) return null;

    const avatar =
      selected.avatar ||
      `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(String(selected.id))}`;
    const tier = selected.subscriptionTier || (selected.subscriptionAmount >= 50 ? 'VIP' : 'Active');

    return {
      id: selected.id,
      name: selected.name || 'Subscriber',
      username: selected.username || '@unknown',
      avatar,
      tier,
      ltv: selected.totalSpent ?? 0,
      arpu: selected.subscriptionAmount ?? 0,
      lastActive: formatRelativeTime(selected.lastMessageAt || selected.subscribedAt),
      joinedDate: selected.subscribedAt,
      stats: {
        totalSpent: selected.totalSpent ?? 0,
        messagesSent: selected.messageCount ?? 0,
        ppvPurchased: 0,
        tipsGiven: 0,
      },
      recentPurchases: [] as Array<{ id: string; type: string; title: string; amount: number; date: string }>,
    };
  }, [data, fanId]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <Link
          href="/onlyfans/fans"
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fans
        </Link>
        <EmptyState
          variant="custom"
          title="Loading fan profile..."
          description="Fetching the latest subscriber details."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <Link
          href="/onlyfans/fans"
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fans
        </Link>
        <EmptyState
          variant="error"
          title="Failed to load fan profile"
          description="Please try again."
          secondaryAction={{ label: 'Retry', onClick: () => void mutate(), icon: RefreshCw }}
        />
      </div>
    );
  }

  if (!fan) {
    return (
      <div className="max-w-7xl mx-auto">
        <Link
          href="/onlyfans/fans"
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fans
        </Link>
        <EmptyState
          variant="no-data"
          title="No fan data yet"
          description="Connect OnlyFans to sync your fans and view detailed profiles."
          action={{ label: 'Go to integrations', onClick: () => (window.location.href = '/integrations') }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Link
        href="/onlyfans/fans"
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Fans
      </Link>

      {/* Fan Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <img src={fan.avatar} alt={fan.name} className="w-20 h-20 rounded-full" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{fan.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-2">{fan.username}</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                fan.tier === 'VIP' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {fan.tier}
              </span>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <MessageSquare className="w-4 h-4" />
            Send Message
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Lifetime Value</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">${fan.ltv}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ARPU</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">${fan.arpu}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Messages</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{fan.stats.messagesSent}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Active</p>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{fan.lastActive}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Activity Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Stats</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Spent</span>
              <span className="font-semibold text-gray-900 dark:text-white">${fan.stats.totalSpent}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">PPV Purchased</span>
              <span className="font-semibold text-gray-900 dark:text-white">{fan.stats.ppvPurchased}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Tips Given</span>
              <span className="font-semibold text-gray-900 dark:text-white">{fan.stats.tipsGiven}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Member Since</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {new Date(fan.joinedDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

      {/* Recent Purchases */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Purchases</h2>
        {fan.recentPurchases.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No recent purchases yet.</p>
        ) : (
          <div className="space-y-3">
            {fan.recentPurchases.map(purchase => (
              <div key={purchase.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{purchase.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {purchase.type} • {new Date(purchase.date).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">${purchase.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
