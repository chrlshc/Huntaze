"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import '@/styles/polaris-analytics.css';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { Plus, Edit, MoreHorizontal, Copy, Archive, BarChart3, Image, Video, RefreshCw, Send, DollarSign, ShoppingCart, Percent, ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Tab = 'library' | 'campaigns';
type DateRange = '7d' | '30d' | 'all';
type PPVStatus = 'draft' | 'ready' | 'archived';
type CampaignStatus = 'scheduled' | 'sending' | 'sent' | 'failed';

interface PPVTemplate {
  id: string;
  title: string;
  description: string;
  price: number;
  mediaType: 'image' | 'video';
  mediaCount: number;
  thumbnail: string;
  status: PPVStatus;
  tags: string[];
  createdAt: string;
}

interface PPVCampaign {
  id: string;
  templateId: string;
  templateTitle: string;
  thumbnail: string;
  price: number;
  status: CampaignStatus;
  sentAt: string;
  recipientsCount: number;
  sentCount: number;
  openedCount: number;
  purchaseCount: number;
  revenue: number;
}

function KPICard({ label, value, icon: Icon, change, trend }: { 
  label: string; 
  value: string; 
  icon?: LucideIcon;
  change?: number; 
  trend?: 'up' | 'down';
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {Icon && <Icon size={14} style={{ color: '#616161' }} />}
        {label}
      </div>
      <div className="kpi-value">{value}</div>
      {change !== undefined && trend && (
        <div className={`kpi-change ${trend === 'up' ? 'positive' : 'negative'}`}>
          <ArrowUpRight size={12} />
          {Math.abs(change)}%
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: PPVStatus | CampaignStatus }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    draft: { bg: '#FFF4E5', color: '#916A00', label: 'Draft' },
    ready: { bg: '#E3F1DF', color: '#008060', label: 'Ready' },
    archived: { bg: '#F1F1F1', color: '#616161', label: 'Archived' },
    scheduled: { bg: '#E3F0FF', color: '#0055B3', label: 'Scheduled' },
    sending: { bg: '#FFF4E5', color: '#916A00', label: 'Sending' },
    sent: { bg: '#E3F1DF', color: '#008060', label: 'Sent' },
    failed: { bg: '#FFF4F4', color: '#D72C0D', label: 'Failed' },
  };
  const style = styles[status] || styles.draft;
  
  return (
    <span style={{ 
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 10, fontSize: 12, fontWeight: 500, background: style.bg, color: style.color,
    }}>
      {style.label}
    </span>
  );
}

export default function OnlyFansPPVPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('library');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('create') === '1') router.replace('/onlyfans/ppv/create', { scroll: false });
    if (searchParams.get('tab') === 'campaigns') setActiveTab('campaigns');
  }, [router, searchParams]);

  const ppvTemplates: PPVTemplate[] = [
    { id: '1', title: 'Exclusive Holiday Content 🎄', description: 'Special holiday-themed content!', price: 25, mediaType: 'video', mediaCount: 3, thumbnail: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=400', status: 'ready', tags: ['Holiday'], createdAt: '2025-11-10' },
    { id: '2', title: 'Behind the Scenes Photos 📸', description: 'Exclusive BTS photos', price: 15, mediaType: 'image', mediaCount: 12, thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400', status: 'ready', tags: ['BTS'], createdAt: '2025-11-08' },
    { id: '3', title: 'Weekend Special Content', description: 'Special weekend content', price: 20, mediaType: 'video', mediaCount: 2, thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400', status: 'draft', tags: ['Weekend'], createdAt: '2025-11-12' },
    { id: '4', title: 'Summer Vibes Collection ☀️', description: 'Hot summer content', price: 18, mediaType: 'image', mediaCount: 8, thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400', status: 'ready', tags: ['Summer'], createdAt: '2025-10-15' },
  ];

  const ppvCampaigns: PPVCampaign[] = [
    { id: 'c1', templateId: '1', templateTitle: 'Exclusive Holiday Content 🎄', thumbnail: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=400', price: 25, status: 'sent', sentAt: '2025-11-10T14:30:00', recipientsCount: 156, sentCount: 156, openedCount: 89, purchaseCount: 23, revenue: 575 },
    { id: 'c2', templateId: '2', templateTitle: 'Behind the Scenes Photos 📸', thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400', price: 15, status: 'sent', sentAt: '2025-11-08T10:00:00', recipientsCount: 203, sentCount: 203, openedCount: 134, purchaseCount: 45, revenue: 675 },
    { id: 'c3', templateId: '1', templateTitle: 'Exclusive Holiday Content 🎄', thumbnail: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=400', price: 25, status: 'sent', sentAt: '2025-10-28T16:00:00', recipientsCount: 189, sentCount: 189, openedCount: 156, purchaseCount: 67, revenue: 1675 },
  ];

  const totals = useMemo(() => {
    const base = ppvCampaigns.reduce((acc, c) => ({ revenue: acc.revenue + c.revenue, sent: acc.sent + c.sentCount, purchased: acc.purchased + c.purchaseCount }), { revenue: 0, sent: 0, purchased: 0 });
    return { ...base, conversion: base.sent > 0 ? Math.round((base.purchased / base.sent) * 100) : 0 };
  }, []);

  const filteredTemplates = useMemo(() => ppvTemplates.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()) && (statusFilter === 'all' || t.status === statusFilter)), [searchTerm, statusFilter]);
  const filteredCampaigns = useMemo(() => ppvCampaigns.filter(c => c.templateTitle.toLowerCase().includes(searchTerm.toLowerCase())), [searchTerm]);

  const handleSend = useCallback((id: string) => router.push('/onlyfans/messages?compose=ppv&mode=mass&ppvId=' + id), [router]);
  const handleEdit = useCallback((id: string) => router.push('/onlyfans/ppv/' + id + '/edit'), [router]);
  const handleRefresh = () => { setLoading(true); setTimeout(() => setLoading(false), 500); };

  useEffect(() => {
    if (menuOpen) {
      const close = () => setMenuOpen(null);
      document.addEventListener('click', close);
      return () => document.removeEventListener('click', close);
    }
  }, [menuOpen]);

  return (
    <ContentPageErrorBoundary pageName="PPV">
      <div className="polaris-analytics">
        <div className="page-header">
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Video size={24} /> PPV
            </h1>
            <p className="page-meta">Manage your pay-per-view content</p>
          </div>
          <div className="filter-pills">
            {(['7d', '30d', 'all'] as DateRange[]).map((range) => (
              <button key={range} onClick={() => setDateRange(range)} className={'filter-pill ' + (dateRange === range ? 'active' : '')}>
                {range === 'all' ? 'All time' : range}
              </button>
            ))}
            <button className="filter-pill" onClick={handleRefresh}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link href="/onlyfans/ppv/create">
              <button className="filter-pill" style={{ background: '#303030', color: '#fff', border: 'none' }}>
                <Plus size={14} /> New PPV
              </button>
            </Link>
          </div>
        </div>

        <div className="content-wrapper">
          <div className="kpi-grid">
            <KPICard label="Revenue" value={'$' + totals.revenue.toLocaleString()} icon={DollarSign} change={12} trend="up" />
            <KPICard label="Sent" value={totals.sent.toLocaleString()} icon={Send} />
            <KPICard label="Purchases" value={totals.purchased.toLocaleString()} icon={ShoppingCart} change={8} trend="up" />
            <KPICard label="Conversion" value={totals.conversion + '%'} icon={Percent} />
          </div>

          <div className="p-card">
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E3E3E3', padding: '0 16px' }}>
              <button onClick={() => setActiveTab('library')} style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: activeTab === 'library' ? '#303030' : '#616161', background: 'none', border: 'none', borderBottom: activeTab === 'library' ? '2px solid #303030' : '2px solid transparent', cursor: 'pointer', marginBottom: -1 }}>
                Library
              </button>
              <button onClick={() => setActiveTab('campaigns')} style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: activeTab === 'campaigns' ? '#303030' : '#616161', background: 'none', border: 'none', borderBottom: activeTab === 'campaigns' ? '2px solid #303030' : '2px solid transparent', cursor: 'pointer', marginBottom: -1 }}>
                Campaigns
              </button>
            </div>

            <div style={{ padding: 16, borderBottom: '1px solid #E3E3E3' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." style={{ width: '100%', height: 36, padding: '0 12px 0 36px', border: '1px solid #C9CCCF', borderRadius: 8, fontSize: 14, outline: 'none' }} />
                  <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8C9196' }} width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {activeTab === 'library' && (
                  <div className="filter-pills">
                    {['all', 'ready', 'draft', 'archived'].map((s) => (
                      <button key={s} onClick={() => setStatusFilter(s)} className={'filter-pill ' + (statusFilter === s ? 'active' : '')}>
                        {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-card-body no-padding">
              {activeTab === 'library' ? (
                filteredTemplates.length > 0 ? (
                  <div className="breakdown-list">
                    {filteredTemplates.map((t) => (
                      <div key={t.id} className="breakdown-item" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#F1F1F1' }}>
                            <img src={t.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: '#303030', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                            <div style={{ fontSize: 13, color: '#616161' }}>{t.mediaCount} {t.mediaType === 'video' ? 'videos' : 'images'}{t.tags?.[0] ? ' • ' + t.tags[0] : ''}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <StatusBadge status={t.status} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#303030', minWidth: 50, textAlign: 'right' }}>${t.price}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16 }}>
                          <button onClick={() => handleSend(t.id)} className="filter-pill" style={{ background: '#303030', color: '#fff', border: 'none' }}>Send</button>
                          <button onClick={() => handleEdit(t.id)} className="filter-pill" style={{ padding: '6px 8px' }}><Edit size={14} /></button>
                          <div style={{ position: 'relative' }}>
                            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === t.id ? null : t.id); }} className="filter-pill" style={{ padding: '6px 8px' }}><MoreHorizontal size={14} /></button>
                            {menuOpen === t.id && (
                              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, width: 160, background: '#fff', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid #E3E3E3', zIndex: 50, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => setMenuOpen(null)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', fontSize: 13, color: '#303030', background: 'none', border: 'none', cursor: 'pointer' }}><Copy size={14} /> Duplicate</button>
                                <button onClick={() => setMenuOpen(null)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', fontSize: 13, color: '#303030', background: 'none', border: 'none', cursor: 'pointer' }}><Archive size={14} /> Archive</button>
                                <button onClick={() => { router.push('/onlyfans/ppv/campaigns?template=' + t.id); setMenuOpen(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', fontSize: 13, color: '#303030', background: 'none', border: 'none', cursor: 'pointer' }}><BarChart3 size={14} /> View stats</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 48, textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, margin: '0 auto 16px', background: '#F1F1F1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Image size={24} style={{ color: '#616161' }} /></div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#303030', marginBottom: 8 }}>No PPV templates yet</h3>
                    <p style={{ fontSize: 14, color: '#616161', marginBottom: 16 }}>Create your first PPV to start earning.</p>
                    <Link href="/onlyfans/ppv/create"><button className="filter-pill" style={{ background: '#303030', color: '#fff', border: 'none', padding: '10px 20px' }}><Plus size={14} /> Create PPV</button></Link>
                  </div>
                )
              ) : (
                filteredCampaigns.length > 0 ? (
                  <div className="breakdown-list">
                    {filteredCampaigns.map((c) => (
                      <div key={c.id} className="breakdown-item" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#F1F1F1' }}>
                            <img src={c.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: '#303030', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.templateTitle}</div>
                            <div style={{ fontSize: 13, color: '#616161' }}>{new Date(c.sentAt).toLocaleDateString()} • ${c.price}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 13 }}>
                          <div><span style={{ color: '#616161' }}>Sent </span><span style={{ fontWeight: 500, color: '#303030' }}>{c.sentCount}</span></div>
                          <div><span style={{ color: '#616161' }}>Opened </span><span style={{ fontWeight: 500, color: '#303030' }}>{c.openedCount}</span></div>
                          <div><span style={{ color: '#616161' }}>Bought </span><span style={{ fontWeight: 500, color: '#303030' }}>{c.purchaseCount}</span></div>
                          <div><span style={{ color: '#616161' }}>Rev </span><span style={{ fontWeight: 500, color: '#008060' }}>${c.revenue}</span></div>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 48, textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, margin: '0 auto 16px', background: '#F1F1F1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={24} style={{ color: '#616161' }} /></div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#303030', marginBottom: 8 }}>No campaigns yet</h3>
                    <p style={{ fontSize: 14, color: '#616161', marginBottom: 16 }}>Send your first PPV to see stats here.</p>
                    <button onClick={() => setActiveTab('library')} className="filter-pill" style={{ background: '#303030', color: '#fff', border: 'none', padding: '10px 20px' }}>Go to Library</button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </ContentPageErrorBoundary>
  );
}
