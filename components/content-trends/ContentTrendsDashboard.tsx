'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface TrendData {
  id: string;
  title: string;
  platform: string;
  viralScore: number;
  engagement: number;
  velocity: number;
  category: string;
  timestamp: string;
}

interface AnalysisResult {
  viralPotential: number;
  recommendations: string[];
  insights: string[];
  optimizedTiming: string;
  targetAudience: string[];
}

export function ContentTrendsDashboard() {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [contentUrl, setContentUrl] = useState('');
  const [platform, setPlatform] = useState('tiktok');
  const [loading, setLoading] = useState(false);
  const [trendsLoading, setTrendsLoading] = useState(true);

  const fetchTrends = useCallback(async () => {
    try {
      setTrendsLoading(true);
      const response = await fetch(`/api/ai/content-trends/trends?platform=${platform}&timeframe=24h`);
      const data = await response.json();
      
      if (data.success) {
        setTrends(data.data.trends || []);
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setTrendsLoading(false);
    }
  }, [platform]);

  // Fetch trending content on component mount
  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const analyzeContent = async () => {
    if (!contentUrl.trim()) return;

    try {
      setLoading(true);
      const response = await fetch('/api/ai/content-trends/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentUrl,
          platform,
          context: {
            analysisType: 'viral_potential',
            includeRecommendations: true,
          },
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.data);
      } else {
        console.error('Analysis failed:', data.error);
      }
    } catch (error) {
      console.error('Error analyzing content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getViralScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Content Analysis Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Analyze Content for Viral Potential</h2>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter content URL (TikTok, Instagram, YouTube, etc.)"
                value={contentUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContentUrl(e.target.value)}
              />
            </div>
            <select
              value={platform}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPlatform(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
              <option value="twitter">Twitter</option>
            </select>
            <Button 
              onClick={analyzeContent}
              disabled={loading || !contentUrl.trim()}
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>

          {analysis && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">Analysis Results</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">Viral Potential:</span>
                    <div className={`w-3 h-3 rounded-full ${getViralScoreColor(analysis.viralPotential)}`}></div>
                    <span className="font-bold">{analysis.viralPotential}%</span>
                  </div>
                  
                  <div className="mb-3">
                    <span className="text-sm font-medium">Optimal Timing:</span>
                    <p className="text-sm text-gray-600">{analysis.optimizedTiming}</p>
                  </div>

                  <div>
                    <span className="text-sm font-medium">Target Audience:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {analysis.targetAudience.map((audience, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {audience}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-3">
                    <span className="text-sm font-medium">Key Insights:</span>
                    <ul className="text-sm text-gray-600 mt-1 space-y-1">
                      {analysis.insights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-sm font-medium">Recommendations:</span>
                    <ul className="text-sm text-gray-600 mt-1 space-y-1">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Trending Content Section */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Trending Content</h2>
          <Button variant="outline" onClick={fetchTrends} disabled={trendsLoading}>
            {trendsLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {trendsLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {trends.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No trending content found</p>
            ) : (
              trends.map((trend) => (
                <div key={trend.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{trend.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {trend.platform}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {trend.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Viral Score: {trend.viralScore}%</span>
                      <span>Engagement: {trend.engagement.toLocaleString()}</span>
                      <span>Velocity: +{trend.velocity}%</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(trend.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
