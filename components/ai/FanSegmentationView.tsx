'use client';

import { useState, useCallback } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Heart,
  Star,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Types
export interface FanSegment {
  id: string;
  name: string;
  description: string;
  fanCount: number;
  characteristics: SegmentCharacteristics;
  aiGenerated: boolean;
  color: string;
  icon: 'star' | 'heart' | 'dollar' | 'trending' | 'alert';
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentCharacteristics {
  avgSpending: number;
  avgEngagement: number;
  topInterests: string[];
  avgMessageFrequency?: number;
  avgTipAmount?: number;
  purchaseFrequency?: 'low' | 'medium' | 'high';
  retentionRisk?: 'low' | 'medium' | 'high';
}

export interface FanProfile {
  id: string;
  name: string;
  avatar?: string;
  segments: string[];
  metrics: {
    totalSpent: number;
    messageCount: number;
    lastActive: Date;
    subscriptionDate: Date;
  };
  aiPredictions: {
    ltv: number;
    churnRisk: number;
    nextPurchaseProbability: number;
  };
}

export interface FanSegmentationViewProps {
  segments?: FanSegment[];
  fans?: FanProfile[];
  isLoading?: boolean;
  onSegmentSelect?: (segment: FanSegment) => void;
  onRefresh?: () => void;
  className?: string;
}

// Default segments for demo
const DEFAULT_SEGMENTS: FanSegment[] = [
  {
    id: 'vip',
    name: 'VIP Fans',
    description: 'High-spending loyal fans with consistent engagement',
    fanCount: 45,
    characteristics: {
      avgSpending: 250,
      avgEngagement: 92,
      topInterests: ['Exclusive content', 'Personal messages', 'Custom requests'],
      avgMessageFrequency: 15,
      avgTipAmount: 50,
      purchaseFrequency: 'high',
      retentionRisk: 'low'
    },
    aiGenerated: true,
    color: 'gold',
    icon: 'star',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  },
  {
    id: 'engaged',
    name: 'Engaged Fans',
    description: 'Active fans who interact regularly but spend moderately',
    fanCount: 128,
    characteristics: {
      avgSpending: 75,
      avgEngagement: 78,
      topInterests: ['Daily posts', 'Stories', 'Polls'],
      avgMessageFrequency: 8,
      avgTipAmount: 15,
      purchaseFrequency: 'medium',
      retentionRisk: 'low'
    },
    aiGenerated: true,
    color: 'blue',
    icon: 'heart',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  },
  {
    id: 'potential',
    name: 'High Potential',
    description: 'New fans showing signs of becoming VIPs',
    fanCount: 67,
    characteristics: {
      avgSpending: 45,
      avgEngagement: 65,
      topInterests: ['PPV content', 'Bundles', 'Promotions'],
      avgMessageFrequency: 5,
      avgTipAmount: 10,
      purchaseFrequency: 'medium',
      retentionRisk: 'medium'
    },
    aiGenerated: true,
    color: 'green',
    icon: 'trending',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date()
  },
  {
    id: 'at-risk',
    name: 'At Risk',
    description: 'Fans showing decreased engagement who may churn',
    fanCount: 34,
    characteristics: {
      avgSpending: 25,
      avgEngagement: 25,
      topInterests: ['Free content', 'Discounts'],
      avgMessageFrequency: 1,
      avgTipAmount: 5,
      purchaseFrequency: 'low',
      retentionRisk: 'high'
    },
    aiGenerated: true,
    color: 'red',
    icon: 'alert',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date()
  }
];

const ICON_MAP = {
  star: Star,
  heart: Heart,
  dollar: DollarSign,
  trending: TrendingUp,
  alert: AlertTriangle
};

const COLOR_MAP: Record<string, string> = {
  gold: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  blue: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  green: 'bg-green-500/20 text-green-500 border-green-500/30',
  red: 'bg-red-500/20 text-red-500 border-red-500/30',
  purple: 'bg-purple-500/20 text-purple-500 border-purple-500/30'
};

export function FanSegmentationView({
  segments = DEFAULT_SEGMENTS,
  fans = [],
  isLoading = false,
  onSegmentSelect,
  onRefresh,
  className = ''
}: FanSegmentationViewProps) {
  const [selectedSegment, setSelectedSegment] = useState<FanSegment | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleSegmentClick = useCallback((segment: FanSegment) => {
    setSelectedSegment(segment);
    onSegmentSelect?.(segment);
  }, [onSegmentSelect]);

  const totalFans = segments.reduce((sum, s) => sum + s.fanCount, 0);

  return (
    <div className={`fan-segmentation ${className}`} data-testid="fan-segmentation-view">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Fan Segments
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {segments.length} segments • {totalFans} total fans
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Segments Grid */}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        data-testid="segments-grid"
      >
        {segments.map((segment) => {
          const IconComponent = ICON_MAP[segment.icon];
          const colorClass = COLOR_MAP[segment.color] || COLOR_MAP.blue;
          
          return (
            <Card 
              key={segment.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedSegment?.id === segment.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleSegmentClick(segment)}
              data-testid={`segment-card-${segment.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  {segment.aiGenerated && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      AI Generated
                    </span>
                  )}
                </div>
                <CardTitle className="text-base mt-2">{segment.name}</CardTitle>
                <CardDescription className="text-xs">{segment.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{segment.fanCount}</div>
                <div className="text-xs text-muted-foreground">fans in segment</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Segment Details */}
      {selectedSegment && (
        <Card className="mb-6" data-testid="segment-details">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{selectedSegment.name} - Characteristics</CardTitle>
              <Button variant="outline" size="sm">
                View All Fans
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              data-testid="segment-characteristics"
            >
              {/* Average Spending */}
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="w-4 h-4" />
                  Avg Spending
                </div>
                <div className="text-xl font-bold" data-testid="avg-spending">
                  ${selectedSegment.characteristics.avgSpending}
                </div>
              </div>

              {/* Average Engagement */}
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Heart className="w-4 h-4" />
                  Avg Engagement
                </div>
                <div className="text-xl font-bold" data-testid="avg-engagement">
                  {selectedSegment.characteristics.avgEngagement}%
                </div>
              </div>

              {/* Purchase Frequency */}
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4" />
                  Purchase Freq
                </div>
                <div className="text-xl font-bold capitalize" data-testid="purchase-frequency">
                  {selectedSegment.characteristics.purchaseFrequency || 'N/A'}
                </div>
              </div>

              {/* Retention Risk */}
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  Retention Risk
                </div>
                <div 
                  className={`text-xl font-bold capitalize ${
                    selectedSegment.characteristics.retentionRisk === 'high' 
                      ? 'text-red-500' 
                      : selectedSegment.characteristics.retentionRisk === 'medium'
                      ? 'text-yellow-500'
                      : 'text-green-500'
                  }`}
                  data-testid="retention-risk"
                >
                  {selectedSegment.characteristics.retentionRisk || 'N/A'}
                </div>
              </div>
            </div>

            {/* Top Interests */}
            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-2">Top Interests</div>
              <div className="flex flex-wrap gap-2" data-testid="top-interests">
                {selectedSegment.characteristics.topInterests.map((interest, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Suggestion */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary/20">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">AI Campaign Suggestion</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Based on your segments, we recommend targeting "High Potential" fans with a 
                limited-time PPV bundle to convert them to VIP status.
              </p>
              <Button size="sm">
                Create Campaign
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default FanSegmentationView;
