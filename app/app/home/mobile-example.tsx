'use client';

import { useState } from 'react';
import { MobileHeader, CollapsibleHeader } from '@/components/mobile/MobileHeader';
import { MobileCard, DoubleTap, SwipeableItem, PullToRefresh, MobileList } from '@/components/mobile/MobileCard';
import { TouchGestures, ForceTouch, useShakeDetector } from '@/components/mobile/TouchGestures';
import { QuickActionFAB } from '@/components/mobile/BottomNavBar';
import { MetricCard, MiniMetric } from '@/components/ui/metric-card';
import { Heart, Share2, Bookmark, MoreVertical, TrendingUp, DollarSign, Users } from 'lucide-react';

export default function MobileExample() {
  const [liked, setLiked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Example data
  const [metrics] = useState({
    revenue: 47298,
    subscribers: 2847,
    messages: 12453,
    engagement: 78.5
  });

  const [activities] = useState([
    { id: 1, type: 'subscriber', user: '@emma_jones', value: '+$49', time: '2m ago' },
    { id: 2, type: 'message', user: '18 fans', value: '92% open', time: '15m ago' },
    { id: 3, type: 'content', user: 'Premium set', value: '$847', time: '1h ago' },
    { id: 4, type: 'tip', user: '@michael_k', value: '+$25', time: '2h ago' },
    { id: 5, type: 'renewal', user: '@sarah_j', value: '+$35/mo', time: '3h ago' },
  ]);

  // Shake to refresh
  useShakeDetector({
    onShake: () => {
      handleRefresh();
    }
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  return (
    <>
      <CollapsibleHeader
        title="Dashboard"
        expandedContent={
          <div className="space-y-4">
            {/* Mini metrics in header */}
            <div className="flex gap-4 overflow-x-auto hide-scrollbar">
              <MiniMetric label="Today" value="$3,847" trend={12} />
              <MiniMetric label="Active" value="892" trend={5} />
              <MiniMetric label="New" value="+47" trend={-2} />
              <MiniMetric label="Rate" value="94%" trend={3} />
            </div>
          </div>
        }
        expandedHeight={140}
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen pt-32 pb-20 px-4 space-y-6">
          {/* Hero metric card with double tap */}
          <DoubleTap onDoubleTap={() => setLiked(!liked)}>
            <MetricCard
              label="Revenue This Month"
              value={metrics.revenue}
              prefix="$"
              trend={{ value: 12.5, label: 'vs last month' }}
              variant="highlight"
              size="lg"
              className="relative overflow-hidden"
            />
          </DoubleTap>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-3">
            <TouchGestures
              onSwipeUp={() => console.log('Swiped up on subscribers')}
              onLongPress={() => console.log('Long pressed subscribers')}
            >
              <MetricCard
                label="Subscribers"
                value={metrics.subscribers.toLocaleString()}
                trend={{ value: 8.3 }}
                size="sm"
              />
            </TouchGestures>

            <ForceTouch
              onForceClick={() => console.log('Force touched messages')}
            >
              <MetricCard
                label="Messages"
                value="12.4k"
                trend={{ value: -3.2 }}
                size="sm"
              />
            </ForceTouch>
          </div>

          {/* Activity feed with swipeable items */}
          <MobileCard className="divide-y divide-gray-100 dark:divide-gray-800">
            <div className="p-4">
              <h3 className="font-semibold">Recent Activity</h3>
            </div>
            
            <MobileList
              items={activities}
              renderItem={(activity) => (
                <SwipeableItem
                  key={activity.id}
                  leftActions={[
                    {
                      icon: Heart,
                      label: 'Like',
                      color: 'bg-pink-500',
                      action: () => console.log('Liked', activity.id)
                    }
                  ]}
                  rightActions={[
                    {
                      icon: Share2,
                      label: 'Share',
                      color: 'bg-blue-500',
                      action: () => console.log('Shared', activity.id)
                    },
                    {
                      icon: Bookmark,
                      label: 'Save',
                      color: 'bg-purple-500',
                      action: () => console.log('Saved', activity.id)
                    }
                  ]}
                >
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{activity.user}</p>
                      <p className="text-sm text-gray-500">{activity.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{activity.value}</p>
                      <p className="text-xs text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                </SwipeableItem>
              )}
              hasMore={false}
            />
          </MobileCard>

          {/* Example cards with different interactions */}
          <div className="space-y-3">
            <MobileCard
              onPress={() => console.log('Card pressed')}
              className="p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Top Content</h4>
                  <p className="text-sm text-gray-500">Your best performing posts</p>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="font-bold">+24%</span>
                </div>
              </div>
            </MobileCard>

            <MobileCard
              onPress={() => console.log('Analytics pressed')}
              className="p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">View Analytics</h4>
                  <p className="text-sm text-gray-500">Detailed performance metrics</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <MoreVertical className="w-5 h-5" />
                </div>
              </div>
            </MobileCard>
          </div>

          {/* Loading skeleton example */}
          {refreshing && (
            <div className="space-y-3">
              <div className="animate-skeleton h-32 rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <div className="animate-skeleton h-24 rounded-xl" />
                <div className="animate-skeleton h-24 rounded-xl" />
              </div>
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Floating Action Button */}
      <QuickActionFAB />
    </>
  );
}