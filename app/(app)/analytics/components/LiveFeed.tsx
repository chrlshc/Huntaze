'use client';

import { formatCurrency } from '@/lib/dashboard/formatters';

type EventType = 'NEW_SUB' | 'AI_MESSAGE' | 'TIP' | 'PPV_PURCHASE' | 'CUSTOM_ORDER';

interface LiveEvent {
  id: string;
  timestamp: string;
  type: EventType;
  amount?: number;
  source?: 'Instagram' | 'TikTok' | 'Twitter' | 'OnlyFans';
  fanHandle?: string;
}

interface LiveFeedProps {
  events: LiveEvent[];
  onRefresh?: () => void;
}

const EVENT_CONFIG: Record<EventType, { icon: string; label: string; color: string }> = {
  NEW_SUB: { icon: '👤', label: 'New Subscriber', color: 'text-gray-900' },
  AI_MESSAGE: { icon: '🤖', label: 'AI Message Sent', color: 'text-gray-900' },
  TIP: { icon: '💰', label: 'Tip Received', color: 'text-gray-900' },
  PPV_PURCHASE: { icon: '🔓', label: 'PPV Unlocked', color: 'text-gray-900' },
  CUSTOM_ORDER: { icon: '🎁', label: 'Custom Order', color: 'text-gray-900' },
};

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: 'bg-gray-200 text-gray-700',
  TikTok: 'bg-gray-200 text-gray-700',
  Twitter: 'bg-gray-200 text-gray-700',
  OnlyFans: 'bg-gray-200 text-gray-700',
};

export function LiveFeed({ events, onRefresh }: LiveFeedProps) {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">Live Feed</h3>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center min-h-0">
          <p className="text-gray-500 text-sm">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">Live Feed</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-gray-500">Live</span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
        {events.map((event) => {
          const config = EVENT_CONFIG[event.type];
          return (
            <div
              key={event.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Icon */}
              <div className="text-xl flex-shrink-0">{config.icon}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${config.color}`}>
                    {config.label}
                  </span>
                  {event.source && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        PLATFORM_COLORS[event.source] || 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {event.source}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {event.fanHandle && (
                    <span className="text-sm text-gray-600 truncate">
                      @{event.fanHandle}
                    </span>
                  )}
                  {event.amount !== undefined && event.amount > 0 && (
                    <span className="text-sm font-semibold text-emerald-600">
                      +{formatCurrency(event.amount)}
                    </span>
                  )}
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-xs text-gray-400 flex-shrink-0">
                {formatRelativeTime(event.timestamp)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const eventTime = new Date(timestamp);
  const diffMs = now.getTime() - eventTime.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'now';
  if (diffMins === 1) return '1m';
  if (diffMins < 60) return `${diffMins}m`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1h';
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1d';
  return `${diffDays}d`;
}
