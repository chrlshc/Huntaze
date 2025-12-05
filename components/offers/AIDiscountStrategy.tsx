"use client";

import { useState } from 'react';
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
import type { DiscountRecommendation, FanSegment } from '@/lib/offers/types';

interface AIDiscountStrategyProps {
  onApplyDiscount: (discount: DiscountRecommendation) => void;
}

// Mock fan segments
const mockSegments: FanSegment[] = [
  { id: 's1', name: 'New Subscribers', size: 245, averageSpend: 15, engagementScore: 0.65 },
  { id: 's2', name: 'VIP Fans', size: 89, averageSpend: 120, engagementScore: 0.92 },
  { id: 's3', name: 'Inactive Fans', size: 156, averageSpend: 8, engagementScore: 0.15 },
  { id: 's4', name: 'High Spenders', size: 67, averageSpend: 200, engagementScore: 0.85 },
  { id: 's5', name: 'Regular Fans', size: 412, averageSpend: 45, engagementScore: 0.55 },
];

const segmentIcons: Record<string, typeof Users> = {
  'New Subscribers': UserPlus,
  'VIP Fans': Crown,
  'Inactive Fans': UserMinus,
  'High Spenders': DollarSign,
  'Regular Fans': Users,
};

export function AIDiscountStrategy({ onApplyDiscount }: AIDiscountStrategyProps) {
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<DiscountRecommendation[]>([]);
  const [goal, setGoal] = useState<'revenue' | 'engagement' | 'retention'>('revenue');

  const handleAnalyze = async () => {
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/ai/offers/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments: mockSegments.filter(s => selectedSegments.includes(s.id)),
          goal,
        }),
      });

      if (!response.ok) throw new Error('Failed to get recommendations');

      const data = await response.json();
      setRecommendations(data.recommendations || getMockRecommendations());
    } catch (err) {
      setRecommendations(getMockRecommendations());
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMockRecommendations = (): DiscountRecommendation[] => {
    const baseRecs: DiscountRecommendation[] = [];
    
    if (selectedSegments.includes('s1') || selectedSegments.length === 0) {
      baseRecs.push({
        discountType: 'percentage',
        discountValue: 25,
        targetAudience: 'New Subscribers',
        timing: 'First 48 hours after signup',
        reasoning: 'New subscribers have high intent but need a push. A 25% welcome discount converts 40% more first-time buyers.',
      });
    }
    
    if (selectedSegments.includes('s3') || selectedSegments.length === 0) {
      baseRecs.push({
        discountType: 'fixed',
        discountValue: 10,
        targetAudience: 'Inactive Fans',
        timing: 'After 30 days of inactivity',
        reasoning: 'Win-back campaigns with fixed discounts perform 2x better than percentage discounts for re-engagement.',
      });
    }
    
    if (selectedSegments.includes('s2') || selectedSegments.length === 0) {
      baseRecs.push({
        discountType: 'bogo',
        discountValue: 50,
        targetAudience: 'VIP Fans',
        timing: 'Exclusive early access',
        reasoning: 'VIP fans respond better to exclusive offers than discounts. BOGO deals increase average order value by 35%.',
      });
    }

    return baseRecs.length > 0 ? baseRecs : [
      {
        discountType: 'percentage',
        discountValue: 15,
        targetAudience: 'All Fans',
        timing: 'Weekend flash sale',
        reasoning: 'A moderate discount during peak engagement times maximizes both volume and revenue.',
      },
    ];
  };

  const toggleSegment = (segmentId: string) => {
    setSelectedSegments(prev => 
      prev.includes(segmentId) 
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
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
          {mockSegments.map((segment) => {
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
                        {segment.size} fans • Avg spend: ${segment.averageSpend}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {Math.round(segment.engagementScore * 100)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Engagement</p>
                    </div>
                    {selectedSegments.includes(segment.id) && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button 
          onClick={handleAnalyze} 
          disabled={isAnalyzing}
          className="w-full mt-4"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Get Discount Recommendations
            </>
          )}
        </Button>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Recommendations
          </h3>
          
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-border bg-card"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Percent className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{getDiscountDisplay(rec)}</p>
                      <p className="text-sm text-muted-foreground">
                        for {rec.targetAudience}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 text-sm">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-blue-500 font-medium">{rec.timing}</span>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {rec.reasoning}
                </p>

                <Button 
                  onClick={() => onApplyDiscount(rec)}
                  variant="outline"
                  className="w-full"
                >
                  <Check className="w-4 h-4 mr-2" />
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
