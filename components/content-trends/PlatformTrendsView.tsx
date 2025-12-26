'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Platform = 'tiktok' | 'instagram' | 'youtube' | 'twitter';

interface TrendItem {
  id: string;
  title: string;
  platform: Platform;
  viralScore: number;
  engagement: number;
  velocity: number;
  category: string;
  hashtags: string[];
  thumbnailUrl?: string;
  url?: string;
  author?: string;
  timestamp: string;
}

const PLATFORM_TABS: { id: Platform | 'all'; name: string; icon: string }[] = [
  { id: 'all', name: 'Tous', icon: '🌐' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'youtube', name: 'YouTube', icon: '▶️' },
  { id: 'twitter', name: 'Twitter/X', icon: '𝕏' },
];

export function PlatformTrendsView() {
  const [activePlatform, setActivePlatform] = useState<Platform | 'all'>('all');
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('24h');

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    try {
      const platformParam = activePlatform === 'all' ? '' : `&platform=${activePlatform}`;
      const response = await fetch(`/api/ai/content-trends/trends?timeframe=${timeframe}${platformParam}`);
      const data = await response.json();
      
      if (data.success && data.data?.trends) {
        setTrends(data.data.trends);
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  }, [activePlatform, timeframe]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const getViralBadge = (score: number) => {
    if (score >= 90) return { text: '🔥 Viral', class: 'bg-red-100 text-red-800' };
    if (score >= 70) return { text: '📈 Hot', class: 'bg-orange-100 text-orange-800' };
    if (score >= 50) return { text: '⬆️ Rising', class: 'bg-yellow-100 text-yellow-800' };
    return { text: '📊 Stable', class: 'bg-gray-100 text-gray-800' };
  };

  const formatEngagement = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold">📊 Tendances par Plateforme</h2>
        
        <div className="flex items-center gap-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-1.5 border rounded-md text-sm"
          >
            <option value="1h">Dernière heure</option>
            <option value="6h">6 heures</option>
            <option value="24h">24 heures</option>
            <option value="7d">7 jours</option>
          </select>
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
        {PLATFORM_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActivePlatform(tab.id)}
            className={`px-4 py-2 rounded-lg transition-all ${
              activePlatform === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Trends Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : trends.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">Aucune tendance trouvée</p>
          <p className="text-sm">Lancez le scraper pour collecter des données</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trends.map(trend => {
            const viralBadge = getViralBadge(trend.viralScore);
            return (
              <div
                key={trend.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span>{PLATFORM_TABS.find(p => p.id === trend.platform)?.icon}</span>
                    <Badge variant="outline" className="text-xs">{trend.platform}</Badge>
                  </div>
                  <Badge className={viralBadge.class}>{viralBadge.text}</Badge>
                </div>

                {/* Title */}
                <h3 className="font-medium mb-2 line-clamp-2">{trend.title}</h3>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <span title="Viral Score">🎯 {trend.viralScore}%</span>
                  <span title="Engagement">💬 {formatEngagement(trend.engagement)}</span>
                  <span title="Velocity">⚡ +{trend.velocity}%</span>
                </div>

                {/* Hashtags */}
                {trend.hashtags && trend.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {trend.hashtags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                    {trend.hashtags.length > 3 && (
                      <span className="text-xs text-gray-500">+{trend.hashtags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                  <span>{trend.category}</span>
                  <span>{new Date(trend.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
