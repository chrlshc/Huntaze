'use client';

/**
 * Pricing Analytics Page - Huntaze Monochrome Style
 * 
 * Analyze pricing strategies and optimize revenue.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users,
  ArrowRight,
  BarChart3,
  Target,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import '../analytics.css';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthSession } from '@/hooks/useAuthSession';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import type { PricingRecommendation } from '@/lib/services/revenue/types';

export default function PricingAnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const { user, isLoading: sessionLoading } = useAuthSession();

  const pricingKey = user?.id ? `/api/revenue/pricing?creatorId=${encodeURIComponent(user.id)}` : null;
  const { data, error, isLoading, mutate } = useSWR<PricingRecommendation>(
    pricingKey,
    (url) => internalApiFetch<PricingRecommendation>(url),
  );

  const pricingTiers = useMemo(() => {
    if (!data) return [];
    const subscribers = data.metadata?.dataPoints ?? 0;
    const currentRevenue = data.subscription.current * subscribers;
    const recommendedRevenue = data.subscription.recommended * subscribers;
    return [
      {
        name: 'Current',
        price: data.subscription.current,
        subscribers,
        revenue: currentRevenue,
        trend: 0,
      },
      {
        name: 'Recommended',
        price: data.subscription.recommended,
        subscribers,
        revenue: recommendedRevenue,
        trend: data.subscription.revenueImpact,
      },
    ].filter((tier) => tier.price > 0);
  }, [data]);

  const ppvPricing = useMemo(() => {
    if (!data?.ppv?.length) return [];
    return data.ppv.map((rec) => {
      const avgPrice = (rec.recommendedRange.min + rec.recommendedRange.max) / 2;
      const avgRevenue = (rec.expectedRevenue.min + rec.expectedRevenue.max) / 2;
      return {
        range: `$${rec.recommendedRange.min}-${rec.recommendedRange.max}`,
        sales: 0,
        avgPrice,
        revenue: avgRevenue,
      };
    });
  }, [data]);

  const aiSuggestions = useMemo(() => {
    if (!data) return [];
    const suggestions = [
      {
        title: `Adjust subscription to $${data.subscription.recommended.toFixed(2)}`,
        impact: `${data.subscription.revenueImpact}% impact`,
        confidence: Math.round(data.subscription.confidence * 100),
      },
    ];
    data.ppv.forEach((rec) => {
      suggestions.push({
        title: `Price ${rec.contentType} at $${rec.recommendedRange.min}-${rec.recommendedRange.max}`,
        impact: `+$${rec.expectedRevenue.max.toLocaleString()}/mo`,
        confidence: Math.round(data.subscription.confidence * 100),
      });
    });
    return suggestions;
  }, [data]);

  const hasPricingData = Boolean(
    data &&
      ((data.subscription?.current ?? 0) > 0 ||
        (data.subscription?.recommended ?? 0) > 0 ||
        data.ppv?.length > 0),
  );

  if (sessionLoading || isLoading) {
    return (
      <div className="polaris-analytics">
        <div className="page-header">
          <div>
            <h1 className="page-title">Pricing Analytics</h1>
            <p className="page-meta">Optimize your pricing strategy</p>
          </div>
        </div>
        <div className="content-wrapper">
          <EmptyState
            variant="custom"
            title="Loading pricing insights..."
            description="Fetching the latest pricing recommendations."
          />
        </div>
      </div>
    );
  }

  if (!sessionLoading && !isLoading && !hasPricingData && !error) {
    return (
      <div className="polaris-analytics">
        <div className="page-header">
          <div>
            <h1 className="page-title">Pricing Analytics</h1>
            <p className="page-meta">Optimize your pricing strategy</p>
          </div>
        </div>
        <div className="content-wrapper">
          <EmptyState
            variant="no-data"
            title="No pricing data yet"
            description="Connect your revenue sources to see subscription and PPV pricing insights."
            action={{ label: 'Go to integrations', onClick: () => (window.location.href = '/integrations') }}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="polaris-analytics">
        <div className="page-header">
          <div>
            <h1 className="page-title">Pricing Analytics</h1>
            <p className="page-meta">Optimize your pricing strategy</p>
          </div>
        </div>
        <div className="content-wrapper">
          <EmptyState
            variant="error"
            title="Failed to load pricing data"
            description="Please retry."
            secondaryAction={{ label: 'Retry', onClick: () => void mutate(), icon: RefreshCw }}
          />
        </div>
      </div>
    );
  }

  const totalRevenue = pricingTiers.reduce((sum, t) => sum + t.revenue, 0);
  const totalSubscribers = pricingTiers.reduce((sum, t) => sum + t.subscribers, 0);
  const avgPrice = totalSubscribers > 0 ? totalRevenue / totalSubscribers : 0;

  return (
    <div className="polaris-analytics">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Pricing Analytics</h1>
          <p className="page-meta">Optimize your pricing strategy</p>
        </div>
        <div className="filter-pills">
          {['7d', '30d', '90d'].map(period => (
            <button
              key={period}
              className={`filter-pill ${selectedPeriod === period ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="content-wrapper">
        {/* KPI Grid */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">AVG SUBSCRIPTION</div>
            <div className="kpi-value">${avgPrice.toFixed(2)}</div>
            <div className="kpi-change positive">
              <TrendingUp size={12} /> +5.2%
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">TOTAL SUBSCRIBERS</div>
            <div className="kpi-value">{totalSubscribers.toLocaleString()}</div>
            <div className="kpi-change positive">
              <TrendingUp size={12} /> +18
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">MRR</div>
            <div className="kpi-value">${totalRevenue.toLocaleString()}</div>
            <div className="kpi-change positive">
              <TrendingUp size={12} /> +8.4%
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">AVG PPV PRICE</div>
            <div className="kpi-value">$24.50</div>
            <div className="kpi-change negative">
              <TrendingDown size={12} /> -2.1%
            </div>
          </div>
        </div>

        {/* Subscription Tiers */}
        <div className="p-card">
          <div className="p-card-header">
            <h2 className="p-card-title">Subscription Tiers</h2>
          </div>
          <div className="p-card-body no-padding">
            <div className="breakdown-list">
              {pricingTiers.map(tier => (
                <div key={tier.name} className="breakdown-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '8px', 
                      background: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <DollarSign size={16} style={{ color: '#6b7280' }} />
                    </div>
                    <div>
                      <div className="breakdown-value">{tier.name}</div>
                      <div className="breakdown-label">${tier.price}/mo · {tier.subscribers} subs</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="breakdown-value">${tier.revenue.toLocaleString()}</div>
                    <div className={`kpi-change ${tier.trend >= 0 ? 'positive' : 'negative'}`}>
                      {tier.trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {tier.trend >= 0 ? '+' : ''}{tier.trend}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="chart-section">
          {/* PPV Pricing */}
          <div className="p-card">
            <div className="p-card-header">
              <h2 className="p-card-title">PPV Price Distribution</h2>
            </div>
            <div className="p-card-body no-padding">
              <div className="breakdown-list">
                {ppvPricing.map(range => (
                  <div key={range.range} className="breakdown-item">
                    <div>
                      <div className="breakdown-value">{range.range}</div>
                      <div className="breakdown-label">{range.sales} sales · avg ${range.avgPrice}</div>
                    </div>
                    <div className="breakdown-value">${range.revenue.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="p-card">
            <div className="p-card-header">
              <h2 className="p-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} /> AI Pricing Suggestions
              </h2>
            </div>
            <div className="p-card-body no-padding">
              <div className="breakdown-list">
                {aiSuggestions.map((suggestion, i) => (
                  <div key={i} className="breakdown-item" style={{ cursor: 'pointer' }}>
                    <div>
                      <div className="breakdown-value">{suggestion.title}</div>
                      <div className="breakdown-label">{suggestion.confidence}% confidence</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        fontFamily: 'SF Mono, monospace',
                        fontWeight: 600,
                        color: '#111'
                      }}>
                        {suggestion.impact}
                      </span>
                      <ArrowRight size={14} style={{ color: '#9ca3af' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-card">
          <div className="p-card-header">
            <h2 className="p-card-title">Quick Actions</h2>
          </div>
          <div className="p-card-body">
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link 
                href="/offers/new"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: '#111',
                  color: '#fff',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  textDecoration: 'none'
                }}
              >
                <Target size={16} /> Create Offer
              </Link>
              <Link 
                href="/analytics/revenue"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: '#f3f4f6',
                  color: '#374151',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  border: '1px solid #e5e7eb'
                }}
              >
                <BarChart3 size={16} /> Revenue Details
              </Link>
              <Link 
                href="/onlyfans/fans"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: '#f3f4f6',
                  color: '#374151',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  border: '1px solid #e5e7eb'
                }}
              >
                <Users size={16} /> View Fans
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
