'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { ButlerTip } from '@/components/ui/ButlerTip';
import Image from 'next/image';
import {
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Badge,
  Divider,
  Tabs,
} from '@shopify/polaris';
import { 
  TrendingUp, 
  Zap, 
  Target, 
  Sparkles, 
  Clock, 
  Eye,
  Play,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Hash,
  FileText,
  ExternalLink,
  Upload
} from 'lucide-react';
import '@/styles/polaris-analytics.css';
import '@/styles/content-mobile.css';
import { EmptyState } from '@/components/ui/EmptyState';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';

type PlatformFilter = 'all' | 'tiktok' | 'instagram' | 'reddit';

type TrendsApiResponse = {
  success: boolean;
  data?: unknown;
  usage?: unknown;
};

type RecommendationsApiResponse = {
  success: boolean;
  data?: {
    recommendations?: unknown;
    contentIdeas?: unknown;
  };
};

type UiTrend = {
  id: string;
  title: string;
  platform: string;
  viralScore: number;
  engagement: number;
  velocity: number;
  category: string;
  hashtags: string[];
  thumbnail?: string;
  author?: string;
  description?: string;
  tips?: string[];
  majordomeAdvice?: string;
  videoUrl?: string;
};

type UiIdea = {
  id: string;
  title: string;
  description: string;
  platform: string;
  successRate: number;
  basedOn?: string;
  hashtags: string[];
  bestTime?: string;
  reasoning?: string;
};

type UiRecommendation = {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  platform: string;
};

const fetcher = <T,>(url: string) => internalApiFetch<T>(url);

function safeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function titleCase(value: string): string {
  return value
    .split(/[_\s]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function defaultThumbnailForPlatform(platform: string): string {
  switch (platform) {
    case 'tiktok':
      return '🎵';
    case 'instagram':
      return '📸';
    case 'reddit':
      return '💬';
    default:
      return '🔥';
  }
}

function extractTrends(response: TrendsApiResponse | undefined): any[] {
  if (!response) return [];
  const data: any = (response as any).data;
  if (Array.isArray(data)) return data;
  const trends = data?.trends;
  return Array.isArray(trends) ? trends : [];
}

function mapTrend(raw: any): UiTrend {
  const platform = safeString(raw?.platform, 'unknown');
  const title = safeString(raw?.title, 'Untitled');
  const hashtags = safeStringArray(raw?.hashtags ?? raw?.tags);
  const tips = Array.isArray(raw?.tips) ? raw.tips.filter((v: any) => typeof v === 'string') : undefined;
  const videoUrl = safeString(raw?.videoUrl ?? raw?.url ?? raw?.link, '');

  return {
    id: safeString(raw?.id, `${platform}:${title}`),
    title,
    platform,
    viralScore: safeNumber(raw?.viralScore),
    engagement: safeNumber(raw?.engagement),
    velocity: safeNumber(raw?.velocity),
    category: safeString(raw?.category, '—'),
    hashtags,
    thumbnail: safeString(raw?.thumbnail, defaultThumbnailForPlatform(platform)),
    author: safeString(raw?.author),
    description: safeString(raw?.description),
    tips,
    majordomeAdvice: safeString(raw?.majordomeAdvice),
    videoUrl: videoUrl || undefined,
  };
}

function extractRecommendations(response: RecommendationsApiResponse | undefined): {
  recommendations: UiRecommendation[];
  ideas: UiIdea[];
} {
  const data: any = response?.data;
  const recs = Array.isArray(data?.recommendations) ? data.recommendations : [];
  const ideas = Array.isArray(data?.contentIdeas) ? data.contentIdeas : [];

  const mappedRecs: UiRecommendation[] = recs.map((raw: any) => {
    const confidence = safeNumber(raw?.confidence);
    const normalizedConfidence = confidence > 0 && confidence <= 1 ? confidence * 100 : confidence;

    return {
      id: safeString(raw?.id, safeString(raw?.title, 'rec')),
      type: safeString(raw?.type, 'timing'),
      title: safeString(raw?.title, 'Recommendation'),
      description: safeString(raw?.description),
      confidence: normalizedConfidence,
      platform: safeString(raw?.platform, 'all'),
    };
  });

  const mappedIdeas: UiIdea[] = ideas.map((raw: any) => {
    const successRate = safeNumber(raw?.successRate, safeNumber(raw?.estimatedViralScore));

    return {
      id: safeString(raw?.id, safeString(raw?.title, 'idea')),
      title: safeString(raw?.title, 'Content idea'),
      description: safeString(raw?.description),
      platform: safeString(raw?.platform, 'all'),
      successRate,
      basedOn: safeString(raw?.basedOn, safeString(raw?.contentType)),
      hashtags: safeStringArray(raw?.hashtags ?? raw?.suggestedHashtags),
      bestTime: safeString(raw?.bestTime, safeString(raw?.bestPostingTime)),
      reasoning: safeString(raw?.reasoning, safeString(raw?.suggestedAction)),
    };
  });

  return { recommendations: mappedRecs, ideas: mappedIdeas };
}

function getRecommendationIcon(type: string) {
  switch (type) {
    case 'hashtag':
      return <Hash size={20} />;
    case 'format':
      return <Play size={20} />;
    case 'content_idea':
      return <Sparkles size={20} />;
    case 'timing':
    default:
      return <Clock size={20} />;
  }
}

export default function ContentPage() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformFilter>('all');
  const [expandedTrend, setExpandedTrend] = useState<string | null>(null);

  const trendsKey =
    selectedPlatform === 'all'
      ? '/api/ai/content-trends/trends'
      : `/api/ai/content-trends/trends?platform=${encodeURIComponent(selectedPlatform)}`;

  const {
    data: trendsResponse,
    error: trendsError,
    isLoading: trendsLoading,
    isValidating: trendsValidating,
    mutate: mutateTrends,
  } = useSWR<TrendsApiResponse>(trendsKey, fetcher);

  const {
    data: recommendationsResponse,
    error: recommendationsError,
    isLoading: recommendationsLoading,
    isValidating: recommendationsValidating,
    mutate: mutateRecommendations,
  } = useSWR<RecommendationsApiResponse>('/api/ai/content-trends/recommendations', fetcher);

  const refreshing = trendsValidating || recommendationsValidating;

  const trends = useMemo(() => extractTrends(trendsResponse).map(mapTrend), [trendsResponse]);

  const { ideas, recommendations } = useMemo(
    () => extractRecommendations(recommendationsResponse),
    [recommendationsResponse]
  );

  const filteredTrends =
    selectedPlatform === 'all' ? trends : trends.filter((t) => t.platform === selectedPlatform);

  const handleTabChange = (index: number) => setSelectedTab(index);

  const refreshTrends = async () => {
    await Promise.all([mutateTrends(), mutateRecommendations()]);
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  const isInitialLoading =
    (trendsLoading && !trendsResponse) || (recommendationsLoading && !recommendationsResponse);
  const hasAnyData =
    filteredTrends.length > 0 || ideas.length > 0 || recommendations.length > 0;

  if (!hasAnyData && !isInitialLoading && !trendsError && !recommendationsError) {
    return (
      <div className="polaris-analytics">
        <EmptyState
          variant="no-data"
          title="No content insights yet"
          description="Connect TikTok, Instagram, or Reddit to start collecting trends and recommendations."
          action={{ label: 'Connect platforms', onClick: () => (window.location.href = '/integrations') }}
          secondaryAction={{ label: 'Retry', onClick: () => void refreshTrends(), icon: RefreshCw }}
        />
      </div>
    );
  }

  if (!hasAnyData && !isInitialLoading && (trendsError || recommendationsError)) {
    const message =
      (trendsError instanceof Error ? trendsError.message : null) ||
      (recommendationsError instanceof Error ? recommendationsError.message : null) ||
      'Failed to load content insights';

    return (
      <div className="polaris-analytics">
        <EmptyState
          variant="error"
          title="Failed to load content insights"
          description={message}
          action={{ label: 'Retry', onClick: () => void refreshTrends(), icon: RefreshCw }}
        />
      </div>
    );
  }

  const activeTrends = filteredTrends.length;
  const avgViralScore =
    activeTrends > 0
      ? filteredTrends.reduce((sum, t) => sum + t.viralScore, 0) / activeTrends
      : 0;
  const predictedEngagement = filteredTrends.reduce((sum, t) => sum + t.engagement, 0);

  const tabs = [
    { id: 'trends', content: '📊 Trends', panelID: 'trends-panel' },
    { id: 'ideas', content: '💡 AI Ideas', panelID: 'ideas-panel' },
    { id: 'recommendations', content: '🎯 Recommendations', panelID: 'recommendations-panel' },
  ];

  return (
    <div className="polaris-analytics">
      <BlockStack gap="600">
        {/* Header */}
        <div className="page-header" style={{ justifyContent: 'space-between' }}>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={22} />
            Content
          </h1>
          <button onClick={refreshTrends} disabled={refreshing} className="filter-pill">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Stats Overview */}
        <div className="content-stats-grid">
	          <Card padding="400">
	            <BlockStack gap="200">
	              <InlineStack gap="200" blockAlign="center">
	                <TrendingUp size={20} className="text-muted-foreground" />
	                <Text as="p" variant="bodySm" tone="subdued">Active trends</Text>
	              </InlineStack>
	              <Text as="p" variant="headingLg" fontWeight="bold">{activeTrends}</Text>
	              <Badge tone="info">
	                {selectedPlatform === 'all' ? 'All platforms' : titleCase(selectedPlatform)}
	              </Badge>
	            </BlockStack>
	          </Card>
	          <Card padding="400">
	            <BlockStack gap="200">
	              <InlineStack gap="200" blockAlign="center">
	                <Zap size={20} className="text-muted-foreground" />
	                <Text as="p" variant="bodySm" tone="subdued">Avg viral score</Text>
	              </InlineStack>
	              <Text as="p" variant="headingLg" fontWeight="bold">{avgViralScore.toFixed(0)}%</Text>
	              <Badge tone="info">{activeTrends > 0 ? `Based on ${activeTrends}` : 'No data'}</Badge>
	            </BlockStack>
	          </Card>
	          <Card padding="400">
	            <BlockStack gap="200">
	              <InlineStack gap="200" blockAlign="center">
	                <Target size={20} className="text-muted-foreground" />
	                <Text as="p" variant="bodySm" tone="subdued">Ideas generated</Text>
	              </InlineStack>
	              <Text as="p" variant="headingLg" fontWeight="bold">{ideas.length}</Text>
	              <Badge tone="info">{ideas.length > 0 ? 'Available' : '—'}</Badge>
	            </BlockStack>
	          </Card>
	          <Card padding="400">
	            <BlockStack gap="200">
	              <InlineStack gap="200" blockAlign="center">
	                <BarChart3 size={20} className="text-muted-foreground" />
	                <Text as="p" variant="bodySm" tone="subdued">Predicted engagement</Text>
	              </InlineStack>
	              <Text as="p" variant="headingLg" fontWeight="bold">{formatNumber(predictedEngagement)}</Text>
	              <Badge>{activeTrends > 0 ? 'From trends' : '—'}</Badge>
	            </BlockStack>
	          </Card>
	        </div>

        {/* Platform Filter */}
        <Card padding="400">
          <InlineStack gap="300" blockAlign="center">
            <Text as="p" variant="bodyMd" fontWeight="medium">Platform:</Text>
            <div className="content-platform-filter">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'tiktok', label: 'TikTok' },
                  { id: 'instagram', label: 'Instagram' },
                  { id: 'reddit', label: 'Reddit' },
                ] as const
              ).map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(p.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: selectedPlatform === p.id ? '2px solid #374151' : '1px solid #e5e7eb',
                    background: selectedPlatform === p.id ? '#f3f4f6' : 'white',
                    cursor: 'pointer',
                    fontWeight: selectedPlatform === p.id ? 600 : 400,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </InlineStack>
        </Card>

        {/* Tabs */}
        <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange} />

        {/* Tab Content */}
        {selectedTab === 0 && (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">🔥 Trending now</Text>
            {filteredTrends.length === 0 ? (
              <EmptyState
                variant="no-data"
                size="sm"
                title="No trends yet"
                description="Try another platform or refresh."
                action={{ label: 'Retry', onClick: () => void refreshTrends(), icon: RefreshCw }}
              />
            ) : (
              <div className="content-trends-grid">
                {filteredTrends.map((trend) => {
                  const hasDescription = Boolean(trend.description);
                  const hasTips = Boolean(trend.tips && trend.tips.length > 0);
                  const hasAdvice = Boolean(trend.majordomeAdvice);
                  const hasGuidance = hasTips || hasAdvice;
                  const shouldSeparateBeforeMetrics = hasDescription || hasGuidance;

                  return (
                    <Card key={trend.id} padding="400">
                      <BlockStack gap="300">
                        <InlineStack align="space-between" blockAlign="start">
                          <InlineStack gap="200" blockAlign="center">
                            <span style={{ fontSize: 32 }}>{trend.thumbnail}</span>
                            <BlockStack gap="100">
                              <Text as="p" variant="bodyMd" fontWeight="semibold">
                                {trend.title}
                              </Text>
                              {trend.author ? (
                                <Text as="p" variant="bodySm" tone="subdued">
                                  {trend.author}
                                </Text>
                              ) : null}
                            </BlockStack>
                          </InlineStack>
                        </InlineStack>

                        <InlineStack gap="200">
                          <Badge tone="info">{trend.platform}</Badge>
                          <Badge>{trend.category}</Badge>
                        </InlineStack>

                        {trend.description ? (
                          <Text as="p" variant="bodySm" tone="subdued">
                            {trend.description}
                          </Text>
                        ) : null}

                        {hasGuidance ? <Divider /> : null}

                        {hasTips ? (
                          <BlockStack gap="100">
                            <Text as="p" variant="bodySm" fontWeight="medium">
                              How to replicate:
                            </Text>
                            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: '#6b7280' }}>
                              {trend.tips?.map((tip, i) => (
                                <li key={i}>{tip}</li>
                              ))}
                            </ul>
                          </BlockStack>
                        ) : null}

                        {hasAdvice ? (
                          <div
                            style={{
                              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                              borderRadius: 8,
                              padding: '14px 16px',
                              display: 'flex',
                              gap: 14,
                              alignItems: 'flex-start',
                            }}
                          >
                            <Image
                              src="/butler.svg"
                              alt="Majordome"
                              width={32}
                              height={32}
                              style={{
                                borderRadius: 6,
                                flexShrink: 0,
                              }}
                            />
                            <Text as="p" variant="bodyMd">
                              <span
                                style={{
                                  color: '#e5e7eb',
                                  fontSize: '16px',
                                  lineHeight: '1.65',
                                  fontWeight: 500,
                                }}
                              >
                                {trend.majordomeAdvice}
                              </span>
                            </Text>
                          </div>
                        ) : null}

                        {shouldSeparateBeforeMetrics ? <Divider /> : null}

                        <InlineStack gap="400">
                          <InlineStack gap="100" blockAlign="center">
                            <Eye size={14} className="text-muted-foreground" />
                            <Text as="span" variant="bodySm">
                              {formatNumber(trend.engagement)}
                            </Text>
                          </InlineStack>
                          <InlineStack gap="100" blockAlign="center">
                            <TrendingUp size={14} className="text-muted-foreground" />
                            <Text as="span" variant="bodySm" tone="success">
                              +{trend.velocity}%
                            </Text>
                          </InlineStack>
                          <InlineStack gap="100" blockAlign="center">
                            <Target size={14} className="text-muted-foreground" />
                            <Text as="span" variant="bodySm">
                              {trend.viralScore}%
                            </Text>
                          </InlineStack>
                        </InlineStack>

                        <InlineStack gap="100" wrap>
                          {trend.hashtags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontSize: 12,
                                padding: '2px 8px',
                                background: '#f3f4f6',
                                color: '#6b7280',
                                borderRadius: 4,
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </InlineStack>

                        {/* Create Content Section */}
                        <button
                          onClick={() => setExpandedTrend(expandedTrend === trend.id ? null : trend.id)}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: '#1a1a2e',
                            border: 'none',
                            borderRadius: 8,
                            color: 'white',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                          }}
                        >
                          <Sparkles size={16} />
                          Create similar content
                          <ChevronDown
                            size={16}
                            style={{
                              transform: expandedTrend === trend.id ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease',
                            }}
                          />
                        </button>

                        {/* Expanded Creation Panel */}
                        {expandedTrend === trend.id && (
                          <div
                            style={{
                              background: '#f8fafc',
                              borderRadius: 8,
                              padding: 16,
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <BlockStack gap="300">
                              {trend.videoUrl ? (
                                <div
                                  style={{
                                    background: 'white',
                                    borderRadius: 6,
                                    padding: 12,
                                    border: '1px solid #e2e8f0',
                                  }}
                                >
                                  <InlineStack gap="200" blockAlign="center">
                                    <Play size={16} style={{ color: '#374151' }} />
                                    <Text as="p" variant="bodySm" fontWeight="medium">
                                      Original content
                                    </Text>
                                  </InlineStack>
                                  <a
                                    href={trend.videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      marginTop: 8,
                                      fontSize: 13,
                                      color: '#374151',
                                      textDecoration: 'none',
                                      wordBreak: 'break-all',
                                    }}
                                  >
                                    <ExternalLink size={14} />
                                    {trend.videoUrl}
                                  </a>
                                </div>
                              ) : null}

                              {/* Upload Button */}
                              <button
                                onClick={() => (window.location.href = '/marketing')}
                                style={{
                                  width: '100%',
                                  padding: '12px 16px',
                                  background: 'white',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 8,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 8,
                                  fontSize: 14,
                                  fontWeight: 500,
                                  color: '#374151',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = '#374151';
                                  e.currentTarget.style.background = '#f9fafb';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = '#e2e8f0';
                                  e.currentTarget.style.background = 'white';
                                }}
                              >
                                <Upload size={18} style={{ color: '#374151' }} />
                                Upload your content
                              </button>
                            </BlockStack>
                          </div>
                        )}
                      </BlockStack>
                    </Card>
                  );
                })}
              </div>
            )}
          </BlockStack>
        )}

        {selectedTab === 1 && (
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center" wrap>
              <Text as="h2" variant="headingMd">💡 AI Ideas Based on Your Best Content</Text>
              <Button icon={<Sparkles size={16} />}>Generate more ideas</Button>
            </InlineStack>
            {ideas.length === 0 ? (
              <EmptyState
                variant="no-data"
                size="sm"
                title="No ideas yet"
                description="Generate ideas once trends and recommendations are available."
              />
            ) : (
              <div className="content-ideas-grid">
                {ideas.map((idea) => (
                  <Card key={idea.id} padding="400">
                    <BlockStack gap="300">
                      <InlineStack align="space-between" blockAlign="start">
                        <BlockStack gap="100">
                          <Text as="p" variant="bodyLg" fontWeight="semibold">
                            {idea.title}
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {idea.description}
                          </Text>
                        </BlockStack>
                        <div
                          style={{
                            padding: '4px 12px',
                            background: '#dcfce7',
                            borderRadius: 20,
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#166534',
                          }}
                        >
                          ✓ {idea.successRate.toFixed(0)}%
                        </div>
                      </InlineStack>

                      {/* Based on indicator */}
                      {idea.basedOn ? (
                        <div
                          style={{
                            padding: '8px 12px',
                            background: '#f0f9ff',
                            borderRadius: 6,
                            fontSize: 12,
                            color: '#0369a1',
                            fontWeight: 500,
                          }}
                        >
                          📊 {idea.basedOn}
                        </div>
                      ) : null}

                      <InlineStack gap="200">
                        <Badge tone="info">{idea.platform}</Badge>
                        {idea.bestTime ? <Badge>{`⏰ ${idea.bestTime}`}</Badge> : null}
                      </InlineStack>

                      {idea.hashtags.length > 0 ? (
                        <InlineStack gap="100" wrap>
                          {idea.hashtags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontSize: 12,
                                padding: '2px 8px',
                                background: '#f3f4f6',
                                color: '#6b7280',
                                borderRadius: 4,
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </InlineStack>
                      ) : null}

                      {/* Butler advice - Why this works */}
                      {idea.reasoning ? (
                        <div
                          style={{
                            padding: '14px 16px',
                            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                            borderRadius: 6,
                            display: 'flex',
                            gap: 14,
                            alignItems: 'flex-start',
                          }}
                        >
                          <Image
                            src="/butler.svg"
                            alt="Majordome"
                            width={32}
                            height={32}
                            style={{
                              borderRadius: 4,
                              flexShrink: 0,
                            }}
                          />
                          <Text as="p" variant="bodyMd">
                            <span
                              style={{
                                color: '#e5e7eb',
                                fontSize: '16px',
                                lineHeight: '1.65',
                                fontWeight: 500,
                              }}
                            >
                              {idea.reasoning}
                            </span>
                          </Text>
                        </div>
                      ) : null}

                      <InlineStack gap="200">
                        <Button fullWidth onClick={() => (window.location.href = '/marketing')}>
                          Create this content
                        </Button>
                        <Button variant="plain">📋</Button>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                ))}
              </div>
            )}
          </BlockStack>
        )}

        {selectedTab === 2 && (
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">🎯 Personalized recommendations</Text>
            <BlockStack gap="300">
              {recommendations.length === 0 ? (
                <EmptyState
                  variant="no-data"
                  size="sm"
                  title="No recommendations yet"
                  description="Recommendations will appear once data is available."
                  secondaryAction={{ label: 'Retry', onClick: () => void refreshTrends(), icon: RefreshCw }}
                />
              ) : (
                recommendations.map((rec) => (
                  <Card key={rec.id} padding="400">
                    <InlineStack gap="400" blockAlign="center">
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#6b7280',
                        }}
                      >
                        {getRecommendationIcon(rec.type)}
                      </div>
                      <BlockStack gap="100" inlineAlign="start">
                        <InlineStack gap="200" blockAlign="center">
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            {rec.title}
                          </Text>
                          <Badge>{`${rec.confidence.toFixed(0)}% confidence`}</Badge>
                          <Badge tone="info">{rec.platform}</Badge>
                        </InlineStack>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {rec.description}
                        </Text>
                      </BlockStack>
                      <div style={{ marginLeft: 'auto' }}>
                        <Button icon={<ChevronRight size={16} />}>Apply</Button>
                      </div>
                    </InlineStack>
                  </Card>
                ))
              )}
            </BlockStack>

            {/* Butler Tip */}
            <ButlerTip page="Content" />
          </BlockStack>
        )}

        {/* Quick Actions */}
        <Card padding="400">
          <BlockStack gap="300">
            <Text as="h3" variant="headingMd">⚡ Quick actions</Text>
            <div className="content-quick-actions">
              <Button url="/content-trends">View all trends</Button>
              <Button variant="secondary">Analyze a URL</Button>
              <Button variant="secondary">Schedule a post</Button>
              <Button variant="secondary">Export data</Button>
            </div>
          </BlockStack>
        </Card>
      </BlockStack>
    </div>
  );
}
