'use client';

import { useState, useCallback } from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown,
  Users, 
  DollarSign, 
  Image,
  Clock,
  ChevronRight,
  Sparkles,
  Bell,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Types
export type InsightType = 'revenue' | 'fan' | 'content' | 'engagement' | 'churn' | 'opportunity';
export type InsightPriority = 'low' | 'medium' | 'high' | 'critical';
export type InsightTrend = 'up' | 'down' | 'stable';

export interface AIInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  recommendation: string;
  metrics?: {
    value: number;
    change: number;
    trend: InsightTrend;
    period: string;
  };
  priority: InsightPriority;
  actionable: boolean;
  actionLabel?: string;
  actionHref?: string;
  createdAt: Date;
  isNew?: boolean;
}

export interface AIInsightsDashboardProps {
  insights?: AIInsight[];
  isLoading?: boolean;
  onInsightAction?: (insight: AIInsight) => void;
  onDismiss?: (insightId: string) => void;
  className?: string;
}

// Default insights for demo
const DEFAULT_INSIGHTS: AIInsight[] = [
  {
    id: 'revenue-1',
    type: 'revenue',
    title: 'PPV Sales Surge',
    description: 'Your PPV sales increased 23% this week compared to last week.',
    recommendation: 'Consider creating more exclusive content to capitalize on this momentum.',
    metrics: {
      value: 1250,
      change: 23,
      trend: 'up',
      period: 'vs last week'
    },
    priority: 'high',
    actionable: true,
    actionLabel: 'Create PPV',
    actionHref: '/onlyfans/ppv/new',
    createdAt: new Date(),
    isNew: true
  },
  {
    id: 'fan-1',
    type: 'fan',
    title: 'At-Risk Fans Detected',
    description: '5 fans haven\'t engaged in 7 days and may be at risk of churning.',
    recommendation: 'Send them a personalized message or exclusive offer to re-engage.',
    metrics: {
      value: 5,
      change: -2,
      trend: 'down',
      period: 'from last week'
    },
    priority: 'critical',
    actionable: true,
    actionLabel: 'View At-Risk Fans',
    actionHref: '/analytics/churn',
    createdAt: new Date(),
    isNew: true
  },
  {
    id: 'content-1',
    type: 'content',
    title: 'Optimal Posting Time',
    description: 'Your best posting time is 8 PM EST based on engagement patterns.',
    recommendation: 'Schedule your next post for 8 PM EST for maximum engagement.',
    metrics: {
      value: 8,
      change: 15,
      trend: 'up',
      period: 'engagement boost'
    },
    priority: 'medium',
    actionable: true,
    actionLabel: 'Schedule Post',
    actionHref: '/content/schedule',
    createdAt: new Date()
  },
  {
    id: 'opportunity-1',
    type: 'opportunity',
    title: 'Bundle Opportunity',
    description: 'Creating a content bundle could increase revenue by an estimated 18%.',
    recommendation: 'Bundle your top 5 performing posts into a discounted package.',
    metrics: {
      value: 18,
      change: 18,
      trend: 'up',
      period: 'potential increase'
    },
    priority: 'medium',
    actionable: true,
    actionLabel: 'Create Bundle',
    actionHref: '/offers/new',
    createdAt: new Date()
  }
];

const TYPE_CONFIG: Record<InsightType, { icon: typeof Lightbulb; color: string; bgColor: string }> = {
  revenue: { icon: DollarSign, color: 'text-green-500', bgColor: 'bg-green-500/20' },
  fan: { icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
  content: { icon: Image, color: 'text-purple-500', bgColor: 'bg-purple-500/20' },
  engagement: { icon: TrendingUp, color: 'text-orange-500', bgColor: 'bg-orange-500/20' },
  churn: { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-500/20' },
  opportunity: { icon: Lightbulb, color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' }
};

const PRIORITY_CONFIG: Record<InsightPriority, { color: string; label: string }> = {
  low: { color: 'bg-gray-500/20 text-gray-500', label: 'Low' },
  medium: { color: 'bg-blue-500/20 text-blue-500', label: 'Medium' },
  high: { color: 'bg-orange-500/20 text-orange-500', label: 'High' },
  critical: { color: 'bg-red-500/20 text-red-500', label: 'Critical' }
};

export function AIInsightsDashboard({
  insights = DEFAULT_INSIGHTS,
  isLoading = false,
  onInsightAction,
  onDismiss,
  className = ''
}: AIInsightsDashboardProps) {
  const [filter, setFilter] = useState<InsightType | 'all'>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const handleAction = useCallback((insight: AIInsight) => {
    onInsightAction?.(insight);
    if (insight.actionHref) {
      window.location.href = insight.actionHref;
    }
  }, [onInsightAction]);

  const handleDismiss = useCallback((insightId: string) => {
    setDismissedIds(prev => new Set([...prev, insightId]));
    onDismiss?.(insightId);
  }, [onDismiss]);

  const filteredInsights = insights
    .filter(i => !dismissedIds.has(i.id))
    .filter(i => filter === 'all' || i.type === filter);

  const newInsightsCount = insights.filter(i => i.isNew && !dismissedIds.has(i.id)).length;

  return (
    <div className={`ai-insights-dashboard ${className}`} data-testid="ai-insights-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Insights
            {newInsightsCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {newInsightsCount} new
              </span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Actionable recommendations powered by AI
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Bell className="w-4 h-4 mr-2" />
          Notification Settings
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['all', 'revenue', 'fan', 'content', 'engagement', 'opportunity'] as const).map((type) => (
          <button
            key={type}
            className={`px-4 py-2 text-sm rounded-full whitespace-nowrap transition-colors ${
              filter === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
            onClick={() => setFilter(type)}
          >
            {type === 'all' ? 'All Insights' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Insights Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                <div className="h-3 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredInsights.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No insights available</p>
            <p className="text-sm text-muted-foreground mt-1">
              Check back later for AI-powered recommendations
            </p>
          </CardContent>
        </Card>
      ) : (
        <div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          data-testid="insights-grid"
        >
          {filteredInsights.map((insight) => {
            const typeConfig = TYPE_CONFIG[insight.type];
            const priorityConfig = PRIORITY_CONFIG[insight.priority];
            const IconComponent = typeConfig.icon;
            
            return (
              <Card 
                key={insight.id}
                className={`relative overflow-hidden ${insight.isNew ? 'ring-2 ring-primary/50' : ''}`}
                data-testid={`insight-card-${insight.id}`}
                data-insight-type={insight.type}
              >
                {insight.isNew && (
                  <div className="absolute top-0 right-0 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-bl">
                    New
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
                      <IconComponent className={`w-5 h-5 ${typeConfig.color}`} />
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${priorityConfig.color}`}>
                      {priorityConfig.label}
                    </span>
                  </div>
                  <CardTitle className="text-base mt-2">{insight.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3" data-testid="insight-description">
                    {insight.description}
                  </p>
                  
                  {/* Metrics */}
                  {insight.metrics && (
                    <div className="flex items-center gap-4 mb-3 p-3 rounded-lg bg-muted/50">
                      <div>
                        <div className="text-2xl font-bold">
                          {insight.type === 'revenue' && '$'}
                          {insight.metrics.value}
                          {insight.type === 'content' && ' PM'}
                          {insight.metrics.trend === 'up' && '%'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {insight.metrics.period}
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 ${
                        insight.metrics.trend === 'up' ? 'text-green-500' : 
                        insight.metrics.trend === 'down' ? 'text-red-500' : 
                        'text-gray-500'
                      }`}>
                        {insight.metrics.trend === 'up' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : insight.metrics.trend === 'down' ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : null}
                        <span className="text-sm font-medium">
                          {insight.metrics.change > 0 ? '+' : ''}{insight.metrics.change}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Recommendation */}
                  <div 
                    className="p-3 rounded-lg bg-primary/5 border border-primary/10 mb-3"
                    data-testid="insight-recommendation"
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{insight.recommendation}</p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  {insight.actionable && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleAction(insight)}
                        className="flex-1"
                      >
                        {insight.actionLabel || 'Take Action'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDismiss(insight.id)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AIInsightsDashboard;
