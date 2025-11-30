'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

interface TagAnalyticsProps {
  userId: string;
}

interface TagData {
  tag: string;
  usage_count: number;
  published_count: number;
  last_used: string;
}

interface TagCombination {
  tag1: string;
  tag2: string;
  co_occurrence: number;
}

export default function TagAnalytics({ userId }: TagAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'frequency' | 'combinations' | 'cloud'>('frequency');

  useEffect(() => {
    fetchAnalytics();
  }, [userId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/content/tags/analytics?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching tag analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-8 text-gray-500">No analytics data available</div>;
  }

  return (
    <Card className="bg-white rounded-lg border p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Tag Analytics</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setView('frequency')}
            className={`px-3 py-1 text-sm rounded ${view === 'frequency' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Frequency
          </button>
          <button
            onClick={() => setView('combinations')}
            className={`px-3 py-1 text-sm rounded ${view === 'combinations' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Combinations
          </button>
          <button
            onClick={() => setView('cloud')}
            className={`px-3 py-1 text-sm rounded ${view === 'cloud' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Tag Cloud
          </button>
        </div>
      </div>

      {view === 'frequency' && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Most Used Tags</h4>
          {analytics.tagFrequency.slice(0, 20).map((tag: TagData) => (
            <div key={tag.tag} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="font-medium text-blue-600">#{tag.tag}</span>
                <span className="text-sm text-gray-600">
                  {tag.usage_count} uses • {tag.published_count} published
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{ width: `${(tag.usage_count / analytics.tagFrequency[0].usage_count) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500">{tag.usage_count}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'combinations' && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Tags That Appear Together</h4>
          {analytics.tagCombinations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tag combinations found yet
            </div>
          ) : (
            analytics.tagCombinations.map((combo: TagCombination, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    #{combo.tag1}
                  </span>
                  <span className="text-gray-400">+</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    #{combo.tag2}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {combo.co_occurrence} times together
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {view === 'cloud' && (
        <div>
          <h4 className="font-medium text-gray-700 mb-4">Tag Cloud</h4>
          <div className="flex flex-wrap gap-3 justify-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            {analytics.tagCloud.map((tag: any) => {
              const fontSize = 12 + tag.weight * 2;
              const opacity = 0.5 + (tag.weight / 10) * 0.5;
              
              return (
                <span
                  key={tag.tag}
                  className="px-3 py-1 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  style={{
                    fontSize: `${fontSize}px`,
                    opacity
                  }}
                  title={`${tag.count} uses, ${tag.publishedCount} published`}
                >
                  #{tag.tag}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {analytics.tagFrequency.length}
          </div>
          <div className="text-sm text-gray-600">Unique Tags</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {analytics.tagFrequency.reduce((sum: number, t: TagData) => sum + t.usage_count, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Uses</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {analytics.tagCombinations.length}
          </div>
          <div className="text-sm text-gray-600">Tag Pairs</div>
        </div>
      </div>
    </Card>
  );
}
