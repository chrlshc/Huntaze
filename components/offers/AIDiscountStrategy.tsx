"use client";

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Users, 
  Loader2,
  Check,
  Percent,
  Clock,
  Target,
  TrendingUp,
  UserPlus,
  UserMinus,
  Crown,
  DollarSign
} from 'lucide-react';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import type { DiscountRecommendation, FanSegment } from '@/lib/offers/types';
import type { Fan } from '@/lib/services/crmData';

interface AIDiscountStrategyProps {
  onApplyDiscount: (discount: DiscountRecommendation) => void;
}

type FansResponse = {
  fans: Fan[];
};

const segmentIcons: Record<string, typeof Users> = {
  'New Subscribers': UserPlus,
  'VIP Fans': Crown,
  'Inactive Fans': UserMinus,
  'High Spenders': DollarSign,
  'Regular Fans': Users,
};

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysSince(date: Date | null): number {
  if (!date) return Number.POSITIVE_INFINITY;
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
}

function averageSpend(fans: Fan[]): number {
  if (fans.length === 0) return 0;
  const totalCents = fans.reduce((sum, fan) => sum + (fan.valueCents ?? 0), 0);
  return totalCents / 100 / fans.length;
}

function engagementScore(fans: Fan[]): number {
  if (fans.length === 0) return 0;
  const scores = fans.map((fan) => {
    const lastSeen = parseDate(fan.lastSeenAt) ?? parseDate(fan.updatedAt) ?? parseDate(fan.createdAt);
    const ageDays = Math.min(daysSince(lastSeen), 30);
    return Math.max(0, 1 - ageDays / 30);
  });
  const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(avg * 10 * 10) / 10;
}

export function AIDiscountStrategy({ onApplyDiscount }: AIDiscountStrategyProps) {
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<DiscountRecommendation[]>([]);
  const [goal, setGoal] = useState<'revenue' | 'engagement' | 'retention'>('revenue');
  const [error, setError] = useState<string | null>(null);

  const { data: fansData, error: fansError, isLoading: fansLoading } = useSWR<FansResponse>(
    '/api/crm/fans',
    (url) => internalApiFetch<FansResponse>(url),
  );

  const segments = useMemo<FanSegment[]>(() => {
    const fans = fansData?.fans ?? [];
    if (fans.length === 0) return [];

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newSubscribers = fans.filter((fan) => {
      const createdAt = parseDate(fan.createdAt);
      return createdAt && createdAt >= sevenDaysAgo;
    });

    const vipFans = fans.filter((fan) => {
      const tags = Array.isArray(fan.tags) ? fan.tags.join(' ').toLowerCase() : '';
      return tags.includes('vip') || (fan.valueCents ?? 0) >= 50_000;
    });

    const inactiveFans = fans.filter((fan) => {
      const lastSeen = parseDate(fan.lastSeenAt) ?? parseDate(fan.updatedAt) ?? parseDate(fan.createdAt);
      return lastSeen !== null && lastSeen <= thirtyDaysAgo;
    });

    const highSpenders = fans.filter((fan) => (fan.valueCents ?? 0) >= 20_000);
    const regularFans = fans.filter((fan) => {
      const value = fan.valueCents ?? 0;
      return value > 0 && value < 20_000;
    });

    const rawSegments: Array<{ id: string; name: string; fans: Fan[] }> = [
      { id: 'new_subscribers', name: 'New Subscribers', fans: newSubscribers },
      { id: 'vip_fans', name: 'VIP Fans', fans: vipFans },
      { id: 'inactive_fans', name: 'Inactive Fans', fans: inactiveFans },
      { id: 'high_spenders', name: 'High Spenders', fans: highSpenders },
      { id: 'regular_fans', name: 'Regular Fans', fans: regularFans },
    ];

    return rawSegments
      .filter((segment) => segment.fans.length > 0)
      .map((segment) => ({
        id: segment.id,
        name: segment.name,
        size: segment.fans.length,
        averageSpend: Math.round(averageSpend(segment.fans)),
        engagementScore: engagementScore(segment.fans),
      }));
  }, [fansData]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const selected = selectedSegments.length
        ? segments.filter((segment) => selectedSegments.includes(segment.id))
        : segments;

      if (selected.length === 0) {
        setError('No fan segments available for analysis');
        return;
      }

      const data = await internalApiFetch<{ recommendations?: DiscountRecommendation[] }>(
        '/api/ai/offers/discounts',
        {
          method: 'POST',
          body: {
            fanSegments: selected,
          },
        },
      );

      setRecommendations(Array.isArray(data?.recommendations) ? data.recommendations : []);
      if (!data?.recommendations?.length) {
        setError('No discount recommendations returned');
      }
    } catch (err) {
      setRecommendations([]);
      setError(err instanceof Error ? err.message : 'Failed to get recommendations');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSegment = (segmentId: string) => {
    setSelectedSegments(prev => 
      prev.includes(segmentId) 
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
    setError(null);
  };

  const getDiscountDisplay = (rec: DiscountRecommendation) => {
    switch (rec.discountType) {
      case 'percentage':
        return `${rec.discountValue}% off`;
      case 'fixed':
        return `$${rec.discountValue} off`;
      case 'bogo':
        return 'Buy 1 Get 1';
      default:
        return `${rec.discountValue}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Discount Strategy</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Get strategic discount recommendations tailored to your fan segments and business goals
            </p>
          </div>
        </div>
      </Card>

      {/* Goal Selection */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          What's Your Goal?
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { value: 'revenue', label: 'Maximize Revenue', icon: DollarSign, color: 'green' },
            { value: 'engagement', label: 'Boost Engagement', icon: TrendingUp, color: 'blue' },
            { value: 'retention', label: 'Improve Retention', icon: Users, color: 'purple' },
          ].map(({ value, label, icon: Icon, color }) => (
            <button
              key={value}
              type="button"
              onClick={() => setGoal(value as typeof goal)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                goal === value
                  ? `border-${color}-500 bg-${color}-500/10`
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Icon className={`w-6 h-6 mb-2 ${
                goal === value ? `text-${color}-500` : 'text-muted-foreground'
              }`} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Fan Segments */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Target Fan Segments
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select segments to target, or leave empty for recommendations across all segments
        </p>
        
        <div className="space-y-3">
          {fansLoading && (
            <div className="text-sm text-muted-foreground">Loading fan segments...</div>
          )}
          {!fansLoading && fansError && (
            <div className="text-sm text-red-500">Failed to load fan segments</div>
          )}
          {!fansLoading && !fansError && segments.length === 0 && (
            <div className="text-sm text-muted-foreground">No fan segments available yet.</div>
          )}
          {segments.map((segment) => {
            const Icon = segmentIcons[segment.name] || Users;
            return (
              <div
                key={segment.id}
                onClick={() => toggleSegment(segment.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedSegments.includes(segment.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedSegments.includes(segment.id)
                        ? 'bg-primary/20'
                        : 'bg-muted'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        selectedSegments.includes(segment.id) ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">{segment.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {segment.size} fans • ${segment.averageSpend} avg spend
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedSegments.includes(segment.id) && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* CTA */}
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Percent className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Generate Recommendations</h3>
            <p className="text-sm text-muted-foreground">
              AI will analyze your segments and suggest the best discount strategies
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-500">{error}</div>
        )}

        <Button 
          onClick={handleAnalyze}
          disabled={isAnalyzing || fansLoading || segments.length === 0}
          className="w-full mt-4"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Segments...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Recommendations
            </>
          )}
        </Button>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recommended Strategies
          </h3>
          
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div 
                key={index}
                className="p-4 rounded-lg border border-border bg-card"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{rec.targetAudience}</h4>
                    <p className="text-sm text-muted-foreground">{rec.timing}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {getDiscountDisplay(rec)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {rec.reasoning}
                </p>
                <Button 
                  onClick={() => onApplyDiscount(rec)}
                  variant="outline"
                  className="w-full"
                >
                  Apply This Strategy
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
