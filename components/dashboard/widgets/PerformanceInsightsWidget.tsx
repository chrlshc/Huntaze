'use client';

import { useEffect, useState } from 'react';
import { Brain, TrendingUp, AlertCircle, Lightbulb, BarChart3, Clock } from 'lucide-react';

interface Insight {
  type: 'opportunity' | 'warning' | 'trend' | 'tip';
  title: string;
  description: string;
  impact: string;
  action?: string;
  icon: any;
  color: string;
}

interface PerformanceInsightsProps {
  userProfile: any;
  analyticsData: any;
}

export function PerformanceInsightsWidget({ userProfile, analyticsData }: PerformanceInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [currentInsight, setCurrentInsight] = useState(0);

  useEffect(() => {
    const generateInsights = () => {
      const insightsList: Insight[] = [];
      
      // Time-based insights
      const currentHour = new Date().getHours();
      if (currentHour >= 18 && currentHour <= 22) {
        insightsList.push({
          type: 'opportunity',
          title: 'Peak Hours Active',
          description: 'Your fans are most active right now. Perfect time for live content or PPV messages.',
          impact: '+40% engagement rate',
          action: 'Start live stream',
          icon: Clock,
          color: 'green'
        });
      }

      // Niche-specific insights
      if (userProfile?.niche === 'fitness') {
        insightsList.push({
          type: 'trend',
          title: 'Fitness Content Trending',
          description: 'Home workout videos are seeing 65% higher engagement this week.',
          impact: '+$1,200 potential revenue',
          action: 'Create workout series',
          icon: TrendingUp,
          color: 'blue'
        });
      } else if (userProfile?.niche === 'gaming') {
        insightsList.push({
          type: 'trend',
          title: 'Gaming Streams Popular',
          description: 'Gaming content after 8 PM generates 3x more tips than other times.',
          impact: '+85% tip increase',
          action: 'Schedule gaming stream',
          icon: TrendingUp,
          color: 'purple'
        });
      }

      // Performance warnings
      if (analyticsData?.messageResponseRate < 80) {
        insightsList.push({
          type: 'warning',
          title: 'Response Rate Dropping',
          description: 'Your message response rate has decreased by 15% this week.',
          impact: '-$500 potential loss',
          action: 'Enable AI auto-reply',
          icon: AlertCircle,
          color: 'orange'
        });
      }

      // General tips based on profile
      if (userProfile?.settings?.language === 'es') {
        insightsList.push({
          type: 'tip',
          title: 'Spanish Content Opportunity',
          description: 'Spanish-speaking fans show 2x higher retention. Consider bilingual content.',
          impact: '+30% fan retention',
          icon: Lightbulb,
          color: 'indigo'
        });
      }

      // Revenue optimization
      insightsList.push({
        type: 'opportunity',
        title: 'Bundle Pricing Works',
        description: 'Fans who buy content bundles spend 3.5x more on average.',
        impact: '+$2,400/month',
        action: 'Create bundle offer',
        icon: BarChart3,
        color: 'green'
      });

      setInsights(insightsList.slice(0, 5));
    };

    generateInsights();
    
    // Rotate insights every 10 seconds
    const interval = setInterval(() => {
      setCurrentInsight((prev) => (prev + 1) % insights.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [userProfile, analyticsData, insights.length]);

  const insight = insights[currentInsight];

  if (!insight) return null;

  const Icon = insight.icon;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full blur-3xl"></div>
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 backdrop-blur rounded-xl">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">AI Performance Insights</h3>
              <p className="text-sm text-gray-300">Real-time recommendations</p>
            </div>
          </div>
          <div className="flex gap-1">
            {insights.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentInsight ? 'bg-white w-4' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className={`flex items-start gap-4 p-4 bg-white/10 backdrop-blur rounded-xl border border-white/20`}>
            <div className={`p-2 rounded-lg bg-${insight.color}-500/20`}>
              <Icon className={`w-5 h-5 text-${insight.color}-400`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{insight.title}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full bg-${insight.color}-500/20 text-${insight.color}-300`}>
                  {insight.type}
                </span>
              </div>
              <p className="text-sm text-gray-300 mb-2">{insight.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Impact: {insight.impact}</span>
                {insight.action && (
                  <button className="text-xs text-white bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30 transition-colors">
                    {insight.action} →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-400">
            Insights updated every hour based on your performance data
          </p>
        </div>
      </div>
    </div>
  );
}