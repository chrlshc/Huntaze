'use client';

import { useEffect, useState } from 'react';
import { Heart, MessageCircle, TrendingUp, Users, Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface FanSegment {
  name: string;
  count: number;
  avgRevenue: number;
  engagement: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
  suggestions: string[];
}

interface FanEngagementProps {
  userProfile: any;
  totalFans: number;
}

export function FanEngagementWidget({ userProfile, totalFans }: FanEngagementProps) {
  const [segments, setSegments] = useState<FanSegment[]>([]);
  const [activeSegment, setActiveSegment] = useState(0);

  useEffect(() => {
    const generateSegments = () => {
      const baseSegments: FanSegment[] = [
        {
          name: 'VIP Fans',
          count: Math.floor(totalFans * 0.05),
          avgRevenue: 450,
          engagement: 92,
          trend: 'up',
          color: 'purple',
          suggestions: [
            'Send exclusive weekend content to maintain engagement',
            'Personal voice messages increase tips by 40%'
          ]
        },
        {
          name: 'Regular Supporters',
          count: Math.floor(totalFans * 0.25),
          avgRevenue: 85,
          engagement: 67,
          trend: 'stable',
          color: 'blue',
          suggestions: [
            'Upgrade potential: 15% close to VIP tier',
            'Friday PPV messages convert 3x better'
          ]
        },
        {
          name: 'New Fans',
          count: Math.floor(totalFans * 0.3),
          avgRevenue: 25,
          engagement: 45,
          trend: 'up',
          color: 'green',
          suggestions: [
            'Welcome series increases retention by 60%',
            'First 48 hours are critical for engagement'
          ]
        },
        {
          name: 'At Risk',
          count: Math.floor(totalFans * 0.1),
          avgRevenue: 15,
          engagement: 12,
          trend: 'down',
          color: 'red',
          suggestions: [
            'Win-back campaign recommended',
            'Special offer may re-engage 30% of this segment'
          ]
        }
      ];

      if (userProfile?.niche) {
        baseSegments.forEach(segment => {
          if (userProfile.niche === 'fitness' && segment.name === 'VIP Fans') {
            segment.suggestions.push('Workout plans increase VIP retention by 45%');
          } else if (userProfile.niche === 'gaming' && segment.name === 'Regular Supporters') {
            segment.suggestions.push('Game night events boost engagement 2x');
          }
        });
      }

      setSegments(baseSegments);
    };

    generateSegments();
  }, [userProfile, totalFans]);

  const currentSegment = segments[activeSegment];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Fan Engagement Insights</h3>
            <p className="text-sm text-gray-500">AI-powered segmentation</p>
          </div>
        </div>
        <Link href="/fans" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
          Manage
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-6">
        {segments.map((segment, index) => (
          <button
            key={index}
            onClick={() => setActiveSegment(index)}
            className={`p-3 rounded-xl border transition-all ${
              activeSegment === index 
                ? 'border-purple-300 bg-purple-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className={`text-2xl font-bold ${
              activeSegment === index ? 'text-purple-700' : 'text-gray-900'
            }`}>{segment.count}</p>
            <p className="text-xs text-gray-600 mt-1">{segment.name}</p>
          </button>
        ))}
      </div>

      {currentSegment && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${currentSegment.avgRevenue}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Engagement Rate</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-gray-900">{currentSegment.engagement}%</p>
                {currentSegment.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                {currentSegment.trend === 'down' && <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              AI Recommendations
            </p>
            {currentSegment.suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 bg-${currentSegment.color}-500`}></div>
                <p className="text-sm text-gray-700">{suggestion}</p>
              </div>
            ))}
          </div>

          <button className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-600/25 transition-all">
            Create Campaign for {currentSegment.name}
          </button>
        </div>
      )}
    </div>
  );
}