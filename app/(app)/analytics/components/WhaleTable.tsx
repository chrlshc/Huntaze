'use client';

import { formatCurrency } from '@/lib/dashboard/formatters';

interface Whale {
  fanId: string;
  name: string;
  totalSpent: number;
  lastPurchaseAt: string;
  isOnline: boolean;
  aiPriority: 'normal' | 'high';
}

interface WhaleTableProps {
  whales: Whale[];
  onTarget: (fanId: string) => void;
  onUndoTarget: (fanId: string) => void;
  sortBy: 'totalSpent' | 'lastPurchase' | 'name';
  sortOrder: 'asc' | 'desc';
  onSortChange: (column: 'totalSpent' | 'lastPurchase' | 'name') => void;
  isLoading?: boolean;
}

export function WhaleTable({
  whales,
  onTarget,
  onUndoTarget,
  sortBy,
  sortOrder,
  onSortChange,
  isLoading,
}: WhaleTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!whales || whales.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-gray-500">No top spenders found</p>
      </div>
    );
  }

  const sortedWhales = [...whales].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'totalSpent':
        comparison = a.totalSpent - b.totalSpent;
        break;
      case 'lastPurchase':
        comparison = new Date(a.lastPurchaseAt).getTime() - new Date(b.lastPurchaseAt).getTime();
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Fan
            </th>
            <th
              className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              onClick={() => onSortChange('totalSpent')}
            >
              <span className="inline-flex items-center gap-1">
                Total Spent
                <SortIcon active={sortBy === 'totalSpent'} order={sortOrder} />
              </span>
            </th>
            <th
              className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              onClick={() => onSortChange('lastPurchase')}
            >
              <span className="inline-flex items-center gap-1">
                Last Purchase
                <SortIcon active={sortBy === 'lastPurchase'} order={sortOrder} />
              </span>
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedWhales.map((whale, index) => (
            <tr
              key={whale.fanId}
              className="hover:bg-gray-50 transition-colors"
            >
              {/* Fan Info */}
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                      {whale.name.charAt(0).toUpperCase()}
                    </div>
                    {whale.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{whale.name}</div>
                    <div className="text-xs text-gray-500">#{index + 1} Top Spender</div>
                  </div>
                </div>
              </td>

              {/* Total Spent */}
              <td className="py-4 px-4 text-right">
                <span className="text-lg font-semibold text-gray-900">
                  {formatCurrency(whale.totalSpent)}
                </span>
              </td>

              {/* Last Purchase */}
              <td className="py-4 px-4 text-right">
                <span className="text-sm text-gray-600">
                  {formatRelativeDate(whale.lastPurchaseAt)}
                </span>
              </td>

              {/* Status */}
              <td className="py-4 px-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  {whale.isOnline && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      Online
                    </span>
                  )}
                  {whale.aiPriority === 'high' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                      🎯 Priority
                    </span>
                  )}
                </div>
              </td>

              {/* Action */}
              <td className="py-4 px-4 text-right">
                {whale.aiPriority === 'high' ? (
                  <button
                    onClick={() => onUndoTarget(whale.fanId)}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Remove Priority
                  </button>
                ) : (
                  <button
                    onClick={() => onTarget(whale.fanId)}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
                  >
                    Set Priority
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortIcon({ active, order }: { active: boolean; order: 'asc' | 'desc' }) {
  return (
    <svg
      className={`w-4 h-4 ${active ? 'text-purple-600' : 'text-gray-400'}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      {order === 'desc' || !active ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      )}
    </svg>
  );
}

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
