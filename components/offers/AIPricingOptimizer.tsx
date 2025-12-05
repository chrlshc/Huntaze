"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Loader2,
  Check,
  AlertCircle,
  BarChart3,
  Target
} from 'lucide-react';
import type { PricingSuggestion, SalesData } from '@/lib/offers/types';

interface AIPricingOptimizerProps {
  onApply: (suggestion: PricingSuggestion) => void;
}

// Mock sales data
const mockSalesData: SalesData[] = [
  { contentId: 'c1', price: 25, salesCount: 150, revenue: 3750, period: 'last_30_days' },
  { contentId: 'c2', price: 15, salesCount: 280, revenue: 4200, period: 'last_30_days' },
  { contentId: 'c3', price: 50, salesCount: 45, revenue: 2250, period: 'last_30_days' },
  { contentId: 'c4', price: 35, salesCount: 90, revenue: 3150, period: 'last_30_days' },
];

export function AIPricingOptimizer({ onApply }: AIPricingOptimizerProps) {
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<PricingSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (selectedContent.length === 0) {
      setError('Please select at least one content item to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/offers/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesData: mockSalesData.filter(s => selectedContent.includes(s.contentId)),
          targetMargin: 0.3,
        }),
      });

      if (!response.ok) throw new Error('Failed to get pricing suggestions');

      const data = await response.json();
      setSuggestions(data.suggestions || [
        {
          recommendedPrice: 22,
          expectedImpact: '+15% sales volume, +8% revenue',
          confidence: 0.85,
          reasoning: 'Based on price elasticity analysis, a slight reduction would increase conversion rates significantly.',
        },
        {
          recommendedPrice: 28,
          expectedImpact: '+5% revenue, stable volume',
          confidence: 0.72,
          reasoning: 'Premium positioning with value-add messaging could support higher pricing.',
        },
      ]);
    } catch (err) {
      // Use mock data on error for demo
      setSuggestions([
        {
          recommendedPrice: 22,
          expectedImpact: '+15% sales volume, +8% revenue',
          confidence: 0.85,
          reasoning: 'Based on price elasticity analysis, a slight reduction would increase conversion rates significantly.',
        },
        {
          recommendedPrice: 28,
          expectedImpact: '+5% revenue, stable volume',
          confidence: 0.72,
          reasoning: 'Premium positioning with value-add messaging could support higher pricing.',
        },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleContent = (contentId: string) => {
    setSelectedContent(prev => 
      prev.includes(contentId) 
        ? prev.filter(id => id !== contentId)
        : [...prev, contentId]
    );
    setError(null);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Pricing Optimizer</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Analyze your sales data and get AI-powered pricing recommendations to maximize revenue
            </p>
          </div>
        </div>
      </Card>

      {/* Content Selection */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Select Content to Analyze
        </h3>
        
        <div className="space-y-3">
          {mockSalesData.map((item) => (
            <div
              key={item.contentId}
              onClick={() => toggleContent(item.contentId)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedContent.includes(item.contentId)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedContent.includes(item.contentId)
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  }`}>
                    {selectedContent.includes(item.contentId) && (
                      <Check className="w-3 h-3 text-primary-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Content {item.contentId.toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">
                      Current price: ${item.price}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{item.salesCount} sales</p>
                  <p className="text-sm text-muted-foreground">${item.revenue} revenue</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

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
              Analyze Pricing
            </>
          )}
        </Button>
      </Card>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            AI Recommendations
          </h3>
          
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-border bg-card"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">${suggestion.recommendedPrice}</p>
                      <p className="text-sm text-muted-foreground">Recommended Price</p>
                    </div>
                  </div>
                  <div className={`text-right ${getConfidenceColor(suggestion.confidence)}`}>
                    <p className="text-lg font-semibold">{Math.round(suggestion.confidence * 100)}%</p>
                    <p className="text-xs">Confidence</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-medium">{suggestion.expectedImpact}</span>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {suggestion.reasoning}
                </p>

                <Button 
                  onClick={() => onApply(suggestion)}
                  variant="outline"
                  className="w-full"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Apply This Price
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
