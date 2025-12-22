'use client';

import React, { useState, useMemo } from 'react';
import '@/styles/polaris-analytics.css';
import useSWR from 'swr';
import { ButlerTip } from '@/components/ui/ButlerTip';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  ArrowUpRight, ArrowDownRight, Calendar, ChevronDown, RefreshCw,
  TrendingUp, Users, DollarSign, Zap, Clock, HelpCircle, BarChart3
} from 'lucide-react';
import { fetchOverviewData, fetchFinanceData, fetchAcquisitionData, getErrorMessage } from '@/lib/dashboard/api';
import type { 
  DateRange, OverviewResponse, FinanceResponse, AcquisitionResponse,
  Kpi, Whale, PlatformMetrics, TopContent, FunnelData, RevenueBreakdown,
  RetentionKpis, ExpansionKpis, RiskKpis, MessagingKpis
} from '@/lib/dashboard/types';
import { InfoTooltip } from '@/components/analytics/InfoTooltip';
import { GlossaryDrawer } from '@/components/analytics/GlossaryDrawer';

export const dynamic = 'force-dynamic';

// --- HELPERS ---
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const formatNumber = (value: number) => 
  new Intl.NumberFormat('en-US').format(value);

const formatPercent = (value: number) => 
  `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const formatTimeAgo = (isoDate: string) => {
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getConversionRate = (from: number | null, to: number) => {
  if (!from || from === 0) return '0%';
  return `${((to / from) * 100).toFixed(1)}%`;
};

// --- POLARIS COMPONENTS ---

// Polaris Card
interface PCardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
}

const PCard = ({ children, title, subtitle, action, noPadding }: PCardProps) => (
  <div className="p-card">
    {(title || action) && (
      <div className="p-card-header">
        <div>
          {title && <h3 className="p-card-title">{title}</h3>}
          {subtitle && <p className="p-card-subtitle">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    <div className={noPadding ? "p-card-body no-padding" : "p-card-body"}>
      {children}
    </div>
  </div>
);

// Polaris KPI Card with InfoTooltip and Compare support
interface KPICardProps {
  label: string;
  value: string;
  change?: number;
  trend?: 'up' | 'down';
  glossaryId?: string;
  compareEnabled?: boolean;
  prevValue?: string;
}

const KPICard = ({ label, value, change, trend, glossaryId, compareEnabled, prevValue }: KPICardProps) => (
  <div className="kpi-card">
    <div className="kpi-content">
      <div className="kpi-label">
        {label}
        {glossaryId && <InfoTooltip glossaryId={glossaryId} size={12} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div className="kpi-value">{value}</div>
        {compareEnabled && prevValue && (
          <span style={{ fontSize: 11, color: '#8C9196', fontWeight: 400 }}>
            ({prevValue})
          </span>
        )}
      </div>
    </div>
    {change !== undefined && trend && (
      <div className={`kpi-change ${trend === 'up' ? 'positive' : 'negative'}`}>
        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {Math.abs(change)}%
      </div>
    )}
  </div>
);

// Breakdown Item
interface BreakdownItemProps {
  label: string;
  value: string;
}

const BreakdownItem = ({ label, value }: BreakdownItemProps) => (
  <div className="breakdown-item">
    <span className="breakdown-label">{label}</span>
    <span className="breakdown-value">{value}</span>
  </div>
);

// Custom Tooltip for Polaris charts
const PolarisTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#303030',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: 500,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ marginBottom: '4px', color: '#999' }}>{label}</div>
        <div style={{ fontVariantNumeric: 'tabular-nums' }}>${payload[0].value.toLocaleString()}</div>
      </div>
    );
  }
  return null;
};

// --- PAGE PRINCIPALE ---

export default function ProAnalytics() {
  // Global filter state (single source of truth)
  const [dateRange, setDateRange] = useState<DateRange>({ type: 'preset', preset: '30d' });
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  
  // Data Fetching - 3 calls max as per spec
  const { data: overviewData, error: overviewError, isLoading: overviewLoading, mutate: mutateOverview } = useSWR(
    ['dashboard-overview', dateRange],
    () => fetchOverviewData(dateRange),
    { refreshInterval: 30000, revalidateOnFocus: true }
  );
  
  const { data: financeData, error: financeError, isLoading: financeLoading, mutate: mutateFinance } = useSWR(
    ['dashboard-finance', dateRange],
    () => fetchFinanceData(dateRange),
    { refreshInterval: 30000 }
  );
  
  const { data: acquisitionData, error: acquisitionError, isLoading: acquisitionLoading, mutate: mutateAcquisition } = useSWR(
    ['dashboard-acquisition', dateRange],
    () => fetchAcquisitionData(dateRange),
    { refreshInterval: 30000 }
  );

  // Derived state
  const isLoading = overviewLoading || financeLoading || acquisitionLoading;
  const error = overviewError || financeError || acquisitionError;
  const lastSyncAt = overviewData?.lastSyncAt ? formatTimeAgo(overviewData.lastSyncAt) : 'Just now';

  // Loading State - Polaris skeleton
  if (isLoading && !overviewData) {
    return (
      <div className="polaris-analytics">
        <div className="page-header">
          <div style={{ height: 28, width: 120, background: '#E3E3E3', borderRadius: 8 }} />
        </div>
        <div className="content-wrapper">
          <div className="kpi-grid">
            {[1,2,3,4].map(i => (
              <div key={i} className="kpi-card" style={{ height: 88 }}>
                <div style={{ height: 12, width: 80, background: '#E3E3E3', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 24, width: 100, background: '#E3E3E3', borderRadius: 4 }} />
              </div>
            ))}
          </div>
          <div className="chart-section">
            <div className="p-card" style={{ height: 340 }} />
            <div className="p-card" style={{ height: 340 }} />
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !overviewData) {
    return (
      <div className="polaris-analytics" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 650, color: '#303030', marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ fontSize: 14, color: '#616161', marginBottom: 16 }}>{getErrorMessage(error)}</p>
          <button 
            onClick={() => Promise.all([mutateOverview(), mutateFinance(), mutateAcquisition()])} 
            style={{ color: '#005BD3', fontWeight: 550, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Extract data with fallbacks
  const kpis = overviewData?.kpis;
  const retention = overviewData?.retention;
  const revenueDaily = overviewData?.revenueDaily || [];
  const revenueDailyPrev = overviewData?.revenueDailyPrev || [];
  const breakdown = financeData?.breakdown;
  const expansion = financeData?.expansion;
  const risk = financeData?.risk;
  const messaging = financeData?.messaging;
  const whales = financeData?.whales || [];
  const funnel = acquisitionData?.funnel;
  const platformMetrics = acquisitionData?.platformMetrics || [];
  const topContent = acquisitionData?.topContent || [];
  
  // Calculate previous period values from delta percentages for compare mode
  const calcPrevValue = (current: number, deltaPct: number) => {
    if (deltaPct === 0) return current;
    return Math.round(current / (1 + deltaPct / 100));
  };

  return (
    <div className="polaris-analytics">
      {/* PAGE HEADER - Title on top, filters below */}
      <div className="page-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={24} />
          Analytics
        </h1>
        <div className="filter-pills">
          <button className="filter-pill" onClick={() => setDateRange({ type: 'preset', preset: '7d' })}>
            7 days
            <ChevronDown size={14} />
          </button>
          <button className="filter-pill">
            <Calendar size={14} />
            Last 30 days
          </button>
          <button 
            className={`filter-pill ${compareEnabled ? 'active' : ''}`}
            onClick={() => setCompareEnabled(!compareEnabled)}
          >
            Compare
          </button>
          <button 
            className="filter-pill help-button"
            onClick={() => setGlossaryOpen(true)}
            aria-label="Open glossary"
            title="Metrics glossary"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </div>

      <div className="content-wrapper">
        {/* A. KPI ROW - OnlyFans metrics */}
        <div className="kpi-grid">
          <KPICard 
            label={kpis?.netRevenue.label || 'Net Revenue'} 
            value={kpis ? formatCurrency(kpis.netRevenue.value) : '$0'} 
            change={kpis?.netRevenue.deltaPct} 
            trend={kpis && kpis.netRevenue.deltaPct >= 0 ? 'up' : 'down'}
            glossaryId="netRevenue"
          />
          <KPICard 
            label={kpis?.activeFans.label || 'Active Fans'} 
            value={kpis ? formatNumber(kpis.activeFans.value) : '0'} 
            change={kpis?.activeFans.deltaPct} 
            trend={kpis && kpis.activeFans.deltaPct >= 0 ? 'up' : 'down'}
            glossaryId="activeFans"
          />
          <KPICard 
            label="ARPU" 
            value={kpis && kpis.activeFans.value > 0 ? formatCurrency(kpis.netRevenue.value / kpis.activeFans.value) : '$0'} 
            change={kpis?.conversionRate.deltaPct} 
            trend={kpis && kpis.conversionRate.deltaPct >= 0 ? 'up' : 'down'}
            glossaryId="arpu"
          />
          <KPICard 
            label={kpis?.ltv.label || 'LTV'} 
            value={kpis ? formatCurrency(kpis.ltv.value) : '$0'} 
            change={kpis?.ltv.deltaPct} 
            trend={kpis && kpis.ltv.deltaPct >= 0 ? 'up' : 'down'}
            glossaryId="ltv"
          />
        </div>

        {/* B. CHART - Revenue over time */}
        <div className="chart-section chart-section--single">
          {/* Revenue over time chart */}
          <PCard title="Revenue over time" subtitle="Last 30 days">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueDaily} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E3E3" strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#616161', fontSize: 12 }} 
                    dy={10}
                    tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#616161', fontSize: 12 }} 
                    tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`}
                    width={50}
                  />
                  <Tooltip content={<PolarisTooltip />} />
                  {compareEnabled && revenueDailyPrev.length > 0 && (
                    <Line 
                      type="monotone" 
                      data={revenueDailyPrev}
                      dataKey="value" 
                      stroke="#CCCCCC" 
                      strokeWidth={1.5} 
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  )}
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#303030" 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 4, fill: '#303030', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </PCard>
        </div>

        {/* C. REVENUE BREAKDOWN + PLATFORM DISTRIBUTION */}
        <div className="chart-section">
          {/* Revenue breakdown from /api/dashboard/finance - Pie Chart */}
          <PCard title="Revenue breakdown">
            {breakdown ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 160, height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Subscriptions', value: breakdown.subscriptions, color: '#303030' },
                          { name: 'Tips', value: breakdown.tips, color: '#008060' },
                          { name: 'PPV', value: breakdown.ppv, color: '#5C6AC4' },
                          { name: 'Customs', value: breakdown.customs, color: '#9C6ADE' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {[
                          { color: '#303030' },
                          { color: '#008060' },
                          { color: '#5C6AC4' },
                          { color: '#9C6ADE' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: '#303030' }} />
                        <span style={{ fontSize: 13, color: '#616161' }}>Subscriptions</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#303030' }}>{formatCurrency(breakdown.subscriptions)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: '#008060' }} />
                        <span style={{ fontSize: 13, color: '#616161' }}>Tips</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#303030' }}>{formatCurrency(breakdown.tips)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: '#5C6AC4' }} />
                        <span style={{ fontSize: 13, color: '#616161' }}>PPV</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#303030' }}>{formatCurrency(breakdown.ppv)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: '#9C6ADE' }} />
                        <span style={{ fontSize: 13, color: '#616161' }}>Customs</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#303030' }}>{formatCurrency(breakdown.customs)}</span>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid #E3E3E3', marginTop: 12, paddingTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 650 }}>
                      <span style={{ color: '#303030' }}>Total</span>
                      <span style={{ color: '#303030' }}>{formatCurrency(breakdown.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state"><p className="empty-state-text">No revenue data</p></div>
            )}
          </PCard>

          {/* Platform distribution chart */}
          <PCard title="Platform distribution">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 160, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'TikTok', value: 65, color: '#000000' },
                        { name: 'Instagram', value: 35, color: '#E1306C' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {[
                        { color: '#000000' },
                        { color: '#E1306C' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: '#000000' }} />
                      <span style={{ fontSize: 13, color: '#616161' }}>TikTok</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#303030' }}>65%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: '#E1306C' }} />
                      <span style={{ fontSize: 13, color: '#616161' }}>Instagram</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#303030' }}>35%</span>
                  </div>
                </div>
              </div>
            </div>
          </PCard>
        </div>

        {/* D. ACQUISITION - Funnel + Platform Battle from /api/dashboard/acquisition */}
        <div className="chart-section">
          {/* Acquisition Funnel (single card, not per-platform) */}
          <PCard 
            title={<>Acquisition funnel <InfoTooltip glossaryId="conversionRate" size={12} /></>} 
            subtitle="Views → New Subs"
          >
            {funnel ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: '8px 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#616161', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    Views <InfoTooltip glossaryId="views" size={10} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 650, color: '#303030' }}>{formatNumber(funnel.views || 0)}</span>
                    {compareEnabled && (
                      <span style={{ fontSize: 11, color: '#8C9196' }}>({formatNumber(calcPrevValue(funnel.views || 0, 15))})</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#616161', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    Profile Clicks <InfoTooltip glossaryId="profileClicks" size={10} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 650, color: '#303030' }}>{formatNumber(funnel.profileClicks || 0)}</span>
                    {compareEnabled && (
                      <span style={{ fontSize: 11, color: '#8C9196' }}>({formatNumber(calcPrevValue(funnel.profileClicks || 0, 12))})</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#008060' }}>{getConversionRate(funnel.views, funnel.profileClicks || 0)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#616161', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    Link Taps <InfoTooltip glossaryId="linkTaps" size={10} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 650, color: '#303030' }}>{formatNumber(funnel.linkTaps || 0)}</span>
                    {compareEnabled && (
                      <span style={{ fontSize: 11, color: '#8C9196' }}>({formatNumber(calcPrevValue(funnel.linkTaps || 0, 8))})</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#008060' }}>{getConversionRate(funnel.profileClicks, funnel.linkTaps || 0)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#616161', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    New Subs <InfoTooltip glossaryId="newSubs" size={10} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 650, color: '#303030' }}>{formatNumber(funnel.newSubs || 0)}</span>
                    {compareEnabled && (
                      <span style={{ fontSize: 11, color: '#8C9196' }}>({formatNumber(calcPrevValue(funnel.newSubs || 0, 10))})</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#008060' }}>{getConversionRate(funnel.linkTaps, funnel.newSubs)}</div>
                </div>
              </div>
            ) : (
              <div className="empty-state"><p className="empty-state-text">No funnel data available</p></div>
            )}
          </PCard>

          {/* Platform Battle table */}
          <PCard title="Platform performance" noPadding>
            {platformMetrics.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E3E3E3' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 550, color: '#616161' }}>Platform</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 550, color: '#616161' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>Views <InfoTooltip glossaryId="views" size={10} /></span>
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 550, color: '#616161' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>Link Taps <InfoTooltip glossaryId="linkTaps" size={10} /></span>
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 550, color: '#616161' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>New Subs <InfoTooltip glossaryId="newSubs" size={10} /></span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {platformMetrics.map((p, i) => (
                      <tr key={i} style={{ borderBottom: i < platformMetrics.length - 1 ? '1px solid #E3E3E3' : 'none' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 500, color: '#303030' }}>{p.platform}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#303030', fontVariantNumeric: 'tabular-nums' }}>{formatNumber(p.views)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#303030', fontVariantNumeric: 'tabular-nums' }}>{formatNumber(p.linkTaps)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#303030', fontVariantNumeric: 'tabular-nums' }}>{formatNumber(p.newSubs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state"><p className="empty-state-text">No platform data available</p></div>
            )}
          </PCard>
        </div>

        {/* E. CONTENT + WHALES */}
        <div className="chart-section">
          {/* Whales from /api/dashboard/finance */}
          <PCard title="Top spenders (Whales)" noPadding>
            {whales.length > 0 ? (
              <div className="breakdown-list">
                {whales.slice(0, 5).map((whale, i) => (
                  <div key={i} className="breakdown-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ 
                        width: 32, height: 32, borderRadius: '50%', 
                        background: '#F1F1F1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 600, color: '#616161'
                      }}>
                        {whale.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#303030' }}>{whale.name}</div>
                        <div style={{ fontSize: 11, color: '#616161' }}>Last: {formatTimeAgo(whale.lastPurchaseAt)}</div>
                      </div>
                    </div>
                    <span style={{ fontWeight: 650, color: '#008060', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(whale.totalSpent)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state"><p className="empty-state-text">No whale data available</p></div>
            )}
          </PCard>

          {/* Top Content by conversions from /api/dashboard/acquisition */}
          <PCard title="Top content (by conversions)" noPadding>
            {topContent.length > 0 ? (
              <div className="breakdown-list">
                {topContent.slice(0, 5).map((content, i) => (
                  <div key={i} className="breakdown-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ color: '#303030', fontWeight: 500, fontSize: 13 }}>{content.title}</span>
                      <span style={{ color: '#008060', fontWeight: 600, fontSize: 13 }}>{content.newSubs} subs</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#616161' }}>
                      <span>{content.platform}</span>
                      <span>{formatNumber(content.linkTaps)} taps</span>
                      <span>{formatNumber(content.views)} views</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state"><p className="empty-state-text">No content data available</p></div>
            )}
          </PCard>
        </div>

        {/* F. RETENTION METRICS (P0 Creator-specific) */}
        <div className="three-col-grid">
          {/* Rebill Rate */}
          <PCard title={<>Rebill rate <InfoTooltip glossaryId="rebillRate" size={12} /></>}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 18, fontWeight: 650, color: '#303030' }}>
                {retention ? `${retention.rebillRate.value.toFixed(1)}%` : '0%'}
              </span>
              {retention && (
                <span style={{ 
                  fontSize: 13, 
                  color: retention.rebillRate.deltaPct >= 0 ? '#008060' : '#D72C0D', 
                  display: 'flex', alignItems: 'center', gap: 2 
                }}>
                  {retention.rebillRate.deltaPct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(retention.rebillRate.deltaPct).toFixed(1)}%
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#616161', marginTop: 4 }}>Subscriptions renewed at expiry</p>
          </PCard>

          {/* Net New Subs */}
          <PCard title={<>Net new subs <InfoTooltip glossaryId="netNewSubs" size={12} /></>}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 18, fontWeight: 650, color: retention && retention.netNewSubs.value >= 0 ? '#008060' : '#D72C0D' }}>
                {retention ? (retention.netNewSubs.value >= 0 ? '+' : '') + formatNumber(retention.netNewSubs.value) : '0'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#616161', marginTop: 4 }}>
              {retention ? `+${retention.newSubs} new, -${retention.churnedSubs} churned` : 'New - Churned'}
            </p>
          </PCard>

          {/* Avg Tenure */}
          <PCard title={<>Avg tenure <InfoTooltip glossaryId="avgTenure" size={12} /></>}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 650, color: '#303030' }}>
                  {retention ? `${retention.avgTenure.value}` : '0'}
                </span>
                <span style={{ fontSize: 13, color: '#616161' }}>days</span>
              </div>
              {retention && (
                <span style={{ 
                  fontSize: 13, 
                  color: retention.avgTenure.deltaPct >= 0 ? '#008060' : '#D72C0D', 
                  display: 'flex', alignItems: 'center', gap: 2 
                }}>
                  {retention.avgTenure.deltaPct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(retention.avgTenure.deltaPct).toFixed(1)}%
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#616161', marginTop: 4 }}>Before churn</p>
          </PCard>
        </div>

        {/* G. EXPANSION REVENUE (P0 Creator-specific) */}
        <div className="three-col-grid">
          {/* ARPPU */}
          <PCard title={<>ARPPU <InfoTooltip glossaryId="arppu" size={12} /></>}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 18, fontWeight: 650, color: '#303030' }}>
                {expansion ? formatCurrency(expansion.arppu.value) : '$0'}
              </span>
              {expansion && (
                <span style={{ 
                  fontSize: 13, 
                  color: expansion.arppu.deltaPct >= 0 ? '#008060' : '#D72C0D', 
                  display: 'flex', alignItems: 'center', gap: 2 
                }}>
                  {expansion.arppu.deltaPct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(expansion.arppu.deltaPct).toFixed(1)}%
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#616161', marginTop: 4 }}>Revenue per paying user</p>
          </PCard>

          {/* PPV Attach Rate */}
          <PCard title={<>PPV attach rate <InfoTooltip glossaryId="ppvAttachRate" size={12} /></>}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 18, fontWeight: 650, color: '#303030' }}>
                {expansion ? `${expansion.ppvAttachRate.value.toFixed(1)}%` : '0%'}
              </span>
              {expansion && (
                <span style={{ 
                  fontSize: 13, 
                  color: expansion.ppvAttachRate.deltaPct >= 0 ? '#008060' : '#D72C0D', 
                  display: 'flex', alignItems: 'center', gap: 2 
                }}>
                  {expansion.ppvAttachRate.deltaPct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(expansion.ppvAttachRate.deltaPct).toFixed(1)}%
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#616161', marginTop: 4 }}>Fans who bought PPV</p>
          </PCard>

          {/* Payers Ratio */}
          <PCard title={<>Payers ratio <InfoTooltip glossaryId="payersRatio" size={12} /></>}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 18, fontWeight: 650, color: '#303030' }}>
                {expansion ? `${expansion.payersRatio.value.toFixed(1)}%` : '0%'}
              </span>
              {expansion && (
                <span style={{ 
                  fontSize: 13, 
                  color: expansion.payersRatio.deltaPct >= 0 ? '#008060' : '#D72C0D', 
                  display: 'flex', alignItems: 'center', gap: 2 
                }}>
                  {expansion.payersRatio.deltaPct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(expansion.payersRatio.deltaPct).toFixed(1)}%
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#616161', marginTop: 4 }}>Fans with transactions beyond sub</p>
          </PCard>
        </div>

        {/* H. MESSAGING + RISK (P0) */}
        <div className="chart-section">
          {/* Messaging Performance */}
          <PCard title={<>Messaging performance <InfoTooltip glossaryId="broadcastOpenRate" size={12} /></>} noPadding>
            {messaging ? (
              <div className="breakdown-list">
                <div className="breakdown-item">
                  <span className="breakdown-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Open rate <InfoTooltip glossaryId="broadcastOpenRate" size={10} />
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 600, color: '#303030' }}>{messaging.broadcastOpenRate.value.toFixed(1)}%</span>
                    <span style={{ fontSize: 13, color: messaging.broadcastOpenRate.deltaPct >= 0 ? '#008060' : '#D72C0D', display: 'flex', alignItems: 'center', gap: 2 }}>
                      {messaging.broadcastOpenRate.deltaPct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {Math.abs(messaging.broadcastOpenRate.deltaPct).toFixed(1)}%
                    </span>
                  </span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Unlock rate (PPV)</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 600, color: '#303030' }}>{messaging.unlockRate.value.toFixed(1)}%</span>
                    <span style={{ fontSize: 13, color: messaging.unlockRate.deltaPct >= 0 ? '#008060' : '#D72C0D', display: 'flex', alignItems: 'center', gap: 2 }}>
                      {messaging.unlockRate.deltaPct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {Math.abs(messaging.unlockRate.deltaPct).toFixed(1)}%
                    </span>
                  </span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Rev / broadcast</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 600, color: '#303030' }}>{formatCurrency(messaging.revenuePerBroadcast.value)}</span>
                    <span style={{ fontSize: 13, color: messaging.revenuePerBroadcast.deltaPct >= 0 ? '#008060' : '#D72C0D', display: 'flex', alignItems: 'center', gap: 2 }}>
                      {messaging.revenuePerBroadcast.deltaPct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {Math.abs(messaging.revenuePerBroadcast.deltaPct).toFixed(1)}%
                    </span>
                  </span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Response time</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 600, color: '#303030' }}>{messaging.medianResponseTime.value.toFixed(1)} min</span>
                    <span style={{ fontSize: 13, color: messaging.medianResponseTime.deltaPct <= 0 ? '#008060' : '#D72C0D', display: 'flex', alignItems: 'center', gap: 2 }}>
                      {messaging.medianResponseTime.deltaPct <= 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                      {Math.abs(messaging.medianResponseTime.deltaPct).toFixed(1)}%
                    </span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="empty-state"><p className="empty-state-text">No messaging data</p></div>
            )}
          </PCard>

          {/* Risk / Chargebacks */}
          <PCard title="Risk & chargebacks">
            {risk ? (
              <div style={{ padding: '8px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontSize: 18, fontWeight: 650, color: risk.chargebackRate.value > 1 ? '#D72C0D' : '#303030' }}>
                    {risk.chargebackRate.value.toFixed(2)}%
                  </span>
                  <span style={{ fontSize: 13, color: risk.chargebackRate.deltaPct <= 0 ? '#008060' : '#D72C0D', display: 'flex', alignItems: 'center', gap: 2 }}>
                    {risk.chargebackRate.deltaPct <= 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                    {Math.abs(risk.chargebackRate.deltaPct).toFixed(1)}%
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
                  <div>
                    <div style={{ color: '#616161', marginBottom: 2 }}>Chargebacks</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#D72C0D' }}>-{formatCurrency(risk.chargebackAmount)}</div>
                  </div>
                  <div>
                    <div style={{ color: '#616161', marginBottom: 2 }}>Refunds</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#616161' }}>-{formatCurrency(risk.refundAmount)}</div>
                  </div>
                  <div>
                    <div style={{ color: '#616161', marginBottom: 2 }}>Net impact</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#D72C0D' }}>-{formatCurrency(risk.netRevenueImpact)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state"><p className="empty-state-text">No risk data</p></div>
            )}
          </PCard>
        </div>

        {/* Butler Tip */}
        <ButlerTip page="Analytics" className="mb-6" />

        {/* H. ORIGINAL INSIGHT CARDS */}
        <div className="three-col-grid">
          {/* Conversion rate */}
          <PCard title="Conversion rate">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 18, fontWeight: 650, color: '#303030' }}>
                {kpis ? `${kpis.conversionRate.value.toFixed(1)}%` : '0%'}
              </span>
              {kpis && (
                <span style={{ 
                  fontSize: 13, 
                  color: kpis.conversionRate.deltaPct >= 0 ? '#008060' : '#D72C0D', 
                  display: 'flex', alignItems: 'center', gap: 2 
                }}>
                  {kpis.conversionRate.deltaPct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(kpis.conversionRate.deltaPct).toFixed(1)}%
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#616161', marginTop: 4 }}>New Subs / Link Taps</p>
          </PCard>

          {/* Tip Conversion */}
          <PCard title="Tip conversion">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 18, fontWeight: 650, color: '#303030' }}>
                {expansion ? `${expansion.tipConversionRate.value.toFixed(1)}%` : '0%'}
              </span>
              {expansion && (
                <span style={{ 
                  fontSize: 13, 
                  color: expansion.tipConversionRate.deltaPct >= 0 ? '#008060' : '#D72C0D', 
                  display: 'flex', alignItems: 'center', gap: 2 
                }}>
                  {expansion.tipConversionRate.deltaPct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(expansion.tipConversionRate.deltaPct).toFixed(1)}%
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#616161', marginTop: 4 }}>Fans who tipped</p>
          </PCard>

          {/* AI Performance */}
          <PCard title="AI performance">
            {financeData?.aiMetrics ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 18, fontWeight: 650, color: '#303030' }}>
                    ${financeData.aiMetrics.rpm.value.toFixed(2)}
                  </span>
                  <span style={{ fontSize: 13, color: '#008060', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ArrowUpRight size={14} />
                    {financeData.aiMetrics.rpm.deltaPct.toFixed(1)}%
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#616161', marginTop: 4 }}>Revenue per message</p>
              </>
            ) : (
              <div className="empty-state"><p className="empty-state-text">No AI data</p></div>
            )}
          </PCard>
        </div>
      </div>

      {/* Glossary Drawer - Level 3 progressive disclosure */}
      <GlossaryDrawer isOpen={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
    </div>
  );
}
