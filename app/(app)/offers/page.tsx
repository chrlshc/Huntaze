"use client";

/**
 * Offers Page - Huntaze Monochrome Design
 * Manage promotional offers and track performance
 */

import { useRef, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { DashboardErrorState, DashboardLoadingState } from '@/components/ui/DashboardLoadingState';
import { 
  Plus, 
  Tag, 
  Percent, 
  Gift, 
  MoreVertical,
  Play,
  Pause,
  Copy,
  Trash2,
  Edit,
  TrendingUp,
  Calendar,
  Users,
  DollarSign,
  BarChart3,
  ArrowUpRight
} from 'lucide-react';
import type { Offer, OfferStatus, DiscountType } from '@/lib/offers/types';
import { standardFetcher } from '@/lib/swr';

type FilterStatus = 'all' | OfferStatus;

// Huntaze Design Tokens
const hzStyles = `
  .hz-offers {
    --hz-radius-card: 14px;
    --hz-radius-icon: 8px;
    --hz-radius-pill: 6px;
    --hz-space-xs: 8px;
    --hz-space-sm: 12px;
    --hz-space-md: 16px;
    --hz-space-lg: 24px;
    --hz-shadow-card: 0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03);
    --hz-shadow-hover: 0 2px 4px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.06);
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--hz-space-lg);
  }
  .hz-offers-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--hz-space-lg);
    flex-wrap: wrap;
    gap: var(--hz-space-md);
  }
  .hz-offers-title {
    font-size: 22px;
    font-weight: 600;
    color: #303030;
    margin: 0 0 4px;
    display: flex;
    align-items: center;
    gap: var(--hz-space-xs);
  }
  .hz-offers-subtitle {
    font-size: 13px;
    color: #616161;
    margin: 0;
  }
  .hz-offers-actions {
    display: flex;
    gap: var(--hz-space-xs);
  }
  .hz-offers-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 500;
    border-radius: var(--hz-radius-icon);
    border: 1px solid #e5e7eb;
    background: #fff;
    color: #616161;
    cursor: pointer;
    transition: all 140ms ease;
    text-decoration: none;
  }
  .hz-offers-btn:hover { background: #f3f4f6; color: #303030; border-color: #d1d5db; }
  .hz-offers-btn-primary {
    background: linear-gradient(180deg, #1f1f1f, #111);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  .hz-offers-btn-primary:hover { 
    background: linear-gradient(180deg, #2a2a2a, #1a1a1a);
    border-color: rgba(255, 255, 255, 0.15);
    color: #fff;
  }
  .hz-offers-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--hz-space-sm);
    margin-bottom: var(--hz-space-lg);
  }
  @media (max-width: 768px) {
    .hz-offers-stats { grid-template-columns: 1fr; }
  }
  .hz-offers-stat {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: var(--hz-radius-card);
    padding: var(--hz-space-md);
    box-shadow: var(--hz-shadow-card);
    display: flex;
    align-items: center;
    gap: var(--hz-space-sm);
  }
  .hz-offers-stat-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--hz-radius-icon);
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
  }
  .hz-offers-stat-label {
    font-size: 12px;
    color: #9ca3af;
    margin-bottom: 2px;
  }
  .hz-offers-stat-value {
    font-family: 'SF Mono', ui-monospace, monospace;
    font-size: 20px;
    font-weight: 600;
    color: #303030;
  }
  .hz-offers-filters {
    display: flex;
    gap: 4px;
    margin-bottom: var(--hz-space-md);
    overflow-x: auto;
    padding-bottom: var(--hz-space-xs);
  }
  .hz-offers-filter {
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--hz-radius-pill);
    cursor: pointer;
    transition: all 140ms ease;
    white-space: nowrap;
    text-transform: capitalize;
  }
  .hz-offers-filter:hover { background: #f3f4f6; color: #374151; }
  .hz-offers-filter.active { background: #111; color: #fff; border-color: #111; }
  .hz-offers-filter-count {
    margin-left: 6px;
    padding: 1px 6px;
    font-size: 10px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
  .hz-offers-list {
    display: flex;
    flex-direction: column;
    gap: var(--hz-space-sm);
  }
  .hz-offer-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: var(--hz-radius-card);
    padding: var(--hz-space-md);
    box-shadow: var(--hz-shadow-card);
    transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
  }
  .hz-offer-card:hover {
    transform: translateY(-1px);
    border-color: #d1d5db;
    box-shadow: var(--hz-shadow-hover);
  }
  .hz-offer-row {
    display: flex;
    align-items: flex-start;
    gap: var(--hz-space-md);
  }
  .hz-offer-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--hz-radius-icon);
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    flex-shrink: 0;
  }
  .hz-offer-content { flex: 1; min-width: 0; }
  .hz-offer-header {
    display: flex;
    align-items: center;
    gap: var(--hz-space-xs);
    margin-bottom: 4px;
    flex-wrap: wrap;
  }
  .hz-offer-name {
    font-size: 14px;
    font-weight: 600;
    color: #303030;
  }
  .hz-offer-status {
    font-size: 10px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 4px;
    text-transform: capitalize;
  }
  .hz-offer-status.active { background: #e5e7eb; color: #059669; }
  .hz-offer-status.expired { background: #e5e7eb; color: #6b7280; }
  .hz-offer-status.scheduled { background: #e5e7eb; color: #303030; }
  .hz-offer-status.draft { background: #e5e7eb; color: #9ca3af; }
  .hz-offer-desc {
    font-size: 13px;
    color: #616161;
    margin-bottom: var(--hz-space-xs);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hz-offer-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--hz-space-md);
    font-size: 12px;
    color: #9ca3af;
  }
  .hz-offer-meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .hz-offer-actions {
    position: relative;
    flex-shrink: 0;
  }
  .hz-offer-menu-btn {
    width: 32px;
    height: 32px;
    border-radius: var(--hz-radius-icon);
    border: 1px solid #e5e7eb;
    background: #fff;
    color: #9ca3af;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 140ms ease;
  }
  .hz-offer-menu-btn:hover { background: #f3f4f6; color: #616161; border-color: #d1d5db; }
  .hz-offer-menu {
    position: absolute;
    right: 0;
    top: 100%;
    margin-top: 4px;
    width: 160px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: var(--hz-radius-icon);
    box-shadow: var(--hz-shadow-hover);
    z-index: 10;
    overflow: hidden;
  }
  .hz-offer-menu-item {
    display: flex;
    align-items: center;
    gap: var(--hz-space-xs);
    width: 100%;
    padding: 10px 12px;
    font-size: 13px;
    color: #616161;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    text-decoration: none;
    transition: background 140ms ease;
  }
  .hz-offer-menu-item:hover { background: #f3f4f6; color: #303030; }
  .hz-offer-menu-item.danger { color: #dc2626; }
  .hz-offer-menu-item.danger:hover { background: #fef2f2; }
  .hz-offer-menu-divider {
    height: 1px;
    background: #e5e7eb;
    margin: 4px 0;
  }
  .hz-offers-empty {
    text-align: center;
    padding: 64px var(--hz-space-lg);
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: var(--hz-radius-card);
  }
  .hz-offers-empty-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto var(--hz-space-md);
    border-radius: 50%;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
  }
  .hz-offers-empty-title {
    font-size: 18px;
    font-weight: 600;
    color: #303030;
    margin: 0 0 var(--hz-space-xs);
  }
  .hz-offers-empty-desc {
    font-size: 13px;
    color: #616161;
    margin: 0 0 var(--hz-space-lg);
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
`;

type OfferDto = Omit<Offer, 'validFrom' | 'validUntil' | 'createdAt' | 'updatedAt'> & {
  validFrom: string;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
};

type OffersListResponse = {
  offers: OfferDto[];
  total: number;
};

function normalizeOffer(dto: OfferDto): Offer {
  return {
    ...dto,
    validFrom: new Date(dto.validFrom),
    validUntil: new Date(dto.validUntil),
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}

const discountIcons: Record<DiscountType, typeof Percent> = { percentage: Percent, fixed: DollarSign, bogo: Gift };

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function formatDiscount(type: DiscountType, value: number): string {
  switch (type) {
    case 'percentage': return `${value}% off`;
    case 'fixed': return `$${value} off`;
    case 'bogo': return 'Buy 2 Get 1';
    default: return `${value}`;
  }
}

export default function OffersPage() {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const lastActionRef = useRef<null | (() => Promise<void>)>(null);

  const { data, error, isLoading, mutate } = useSWR<OffersListResponse>(
    '/api/offers?limit=100&offset=0',
    standardFetcher,
  );

  const offers = (data?.offers ?? []).map(normalizeOffer);

  const filteredOffers = filter === 'all' ? offers : offers.filter(o => o.status === filter);
  const stats = {
    total: offers.length,
    active: offers.filter(o => o.status === 'active').length,
    totalRedemptions: offers.reduce((sum, o) => sum + o.redemptionCount, 0),
  };

  const getResponseErrorMessage = async (response: Response) => {
    const payload = await response.json().catch(() => null);
    if (payload && typeof payload === 'object' && 'error' in payload) {
      return String((payload as any).error);
    }
    return `Request failed (${response.status})`;
  };

  const runAction = async (action: () => Promise<void>) => {
    lastActionRef.current = action;
    setActionBusy(true);
    setActionError(null);
    try {
      await action();
      await mutate();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionBusy(false);
      setOpenMenu(null);
    }
  };

  const retryLastAction = () => {
    if (!lastActionRef.current || actionBusy) return;
    void runAction(lastActionRef.current);
  };

  const handleToggleStatus = (offer: Offer) => {
    void runAction(async () => {
      const newStatus: OfferStatus = offer.status === 'active' ? 'draft' : 'active';
      const response = await fetch(`/api/offers/${offer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response));
      }
    });
  };

  const handleDuplicate = (offer: Offer) => {
    void runAction(async () => {
      const response = await fetch(`/api/offers/${offer.id}/duplicate`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response));
      }
    });
  };

  const handleDelete = (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    void runAction(async () => {
      const response = await fetch(`/api/offers/${offerId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(await getResponseErrorMessage(response));
      }
    });
  };

  if (isLoading && offers.length === 0) {
    return (
      <ContentPageErrorBoundary pageName="Offers">
        <div className="hz-offers">
          <style>{hzStyles}</style>
          <div className="hz-offers-header">
            <div>
              <h1 className="hz-offers-title"><Gift size={24} /> Offers & Discounts</h1>
            </div>
          </div>
          <div className="hz-offers-empty">
            <DashboardLoadingState message="Loading offers..." />
          </div>
        </div>
      </ContentPageErrorBoundary>
    );
  }

  if (error && offers.length === 0) {
    return (
      <ContentPageErrorBoundary pageName="Offers">
        <div className="hz-offers">
          <style>{hzStyles}</style>
          <div className="hz-offers-header">
            <div>
              <h1 className="hz-offers-title"><Gift size={24} /> Offers & Discounts</h1>
            </div>
          </div>
          <div className="hz-offers-empty">
            <DashboardErrorState
              message={error instanceof Error ? error.message : 'Failed to load offers'}
              onRetry={() => void mutate()}
            />
          </div>
        </div>
      </ContentPageErrorBoundary>
    );
  }

  if (offers.length === 0) {
    return (
      <ContentPageErrorBoundary pageName="Offers">
        <div className="hz-offers">
          <style>{hzStyles}</style>
          <div className="hz-offers-header">
            <div>
              <h1 className="hz-offers-title"><Gift size={24} /> Offers & Discounts</h1>
            </div>
          </div>
          <div className="hz-offers-empty">
            <div className="hz-offers-empty-icon"><Tag size={28} /></div>
            <h2 className="hz-offers-empty-title">No offers yet</h2>
            <p className="hz-offers-empty-desc">Create your first offer to boost sales and engage your fans with special discounts and bundles.</p>
            <Link href="/offers/new" className="hz-offers-btn hz-offers-btn-primary"><Plus size={16} /> Create Your First Offer</Link>
          </div>
        </div>
      </ContentPageErrorBoundary>
    );
  }

  return (
    <ContentPageErrorBoundary pageName="Offers">
      <div className="hz-offers">
        <style>{hzStyles}</style>
        
        {/* Header */}
        <div className="hz-offers-header">
          <div>
            <h1 className="hz-offers-title"><Gift size={24} /> Offers & Discounts</h1>
            <p className="hz-offers-subtitle">Manage your promotional offers and track performance</p>
          </div>
          <div className="hz-offers-actions">
            <Link href="/offers/analytics" className="hz-offers-btn"><BarChart3 size={16} /> Analytics</Link>
            <Link href="/offers/new" className="hz-offers-btn hz-offers-btn-primary"><Plus size={16} /> New Offer</Link>
          </div>
        </div>

        {actionError && (
          <div
            role="alert"
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 12,
              padding: '12px 14px',
              fontSize: 13,
              color: '#991B1B',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <span>{actionError}</span>
            <button
              type="button"
              className="hz-offers-btn"
              onClick={retryLastAction}
              disabled={actionBusy}
              style={{ opacity: actionBusy ? 0.6 : 1 }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="hz-offers-stats">
          <div className="hz-offers-stat">
            <div className="hz-offers-stat-icon"><Tag size={20} /></div>
            <div>
              <div className="hz-offers-stat-label">Total Offers</div>
              <div className="hz-offers-stat-value">{stats.total}</div>
            </div>
          </div>
          <div className="hz-offers-stat">
            <div className="hz-offers-stat-icon"><Play size={20} /></div>
            <div>
              <div className="hz-offers-stat-label">Active Offers</div>
              <div className="hz-offers-stat-value">{stats.active}</div>
            </div>
          </div>
          <div className="hz-offers-stat">
            <div className="hz-offers-stat-icon"><Users size={20} /></div>
            <div>
              <div className="hz-offers-stat-label">Total Redemptions</div>
              <div className="hz-offers-stat-value">{stats.totalRedemptions}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="hz-offers-filters">
          {(['all', 'active', 'scheduled', 'draft', 'expired'] as FilterStatus[]).map((status) => (
            <button key={status} className={`hz-offers-filter ${filter === status ? 'active' : ''}`} onClick={() => setFilter(status)}>
              {status}
              {status !== 'all' && <span className="hz-offers-filter-count">{offers.filter(o => o.status === status).length}</span>}
            </button>
          ))}
        </div>

        {/* Offers List */}
        <div className="hz-offers-list">
          {filteredOffers.map((offer) => {
            const DiscountIcon = discountIcons[offer.discountType];
            return (
              <div key={offer.id} className="hz-offer-card">
                <div className="hz-offer-row">
                  <div className="hz-offer-icon"><DiscountIcon size={24} /></div>
                  <div className="hz-offer-content">
                    <div className="hz-offer-header">
                      <span className="hz-offer-name">{offer.name}</span>
                      <span className={`hz-offer-status ${offer.status}`}>{offer.status}</span>
                    </div>
                    {offer.description && <div className="hz-offer-desc">{offer.description}</div>}
                    <div className="hz-offer-meta">
                      <span className="hz-offer-meta-item"><Percent size={12} /> {formatDiscount(offer.discountType, offer.discountValue)}</span>
                      <span className="hz-offer-meta-item"><Calendar size={12} /> {formatDate(offer.validFrom)} - {formatDate(offer.validUntil)}</span>
                      {offer.targetAudience && <span className="hz-offer-meta-item"><Users size={12} /> {offer.targetAudience}</span>}
                      <span className="hz-offer-meta-item"><TrendingUp size={12} /> {offer.redemptionCount} redemptions</span>
                    </div>
                  </div>
                  <div className="hz-offer-actions">
                    <button className="hz-offer-menu-btn" onClick={() => setOpenMenu(openMenu === offer.id ? null : offer.id)}><MoreVertical size={16} /></button>
                    {openMenu === offer.id && (
                      <div className="hz-offer-menu">
                        <Link href={`/offers/${offer.id}`} className="hz-offer-menu-item" onClick={() => setOpenMenu(null)}><Edit size={14} /> Edit</Link>
                        <button className="hz-offer-menu-item" onClick={() => handleToggleStatus(offer)}>
                          {offer.status === 'active' ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Activate</>}
                        </button>
                        <button className="hz-offer-menu-item" onClick={() => handleDuplicate(offer)}><Copy size={14} /> Duplicate</button>
                        <div className="hz-offer-menu-divider" />
                        <button className="hz-offer-menu-item danger" onClick={() => handleDelete(offer.id)}><Trash2 size={14} /> Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty filtered state */}
        {filteredOffers.length === 0 && offers.length > 0 && (
          <div className="hz-offers-empty">
            <p style={{ color: '#616161', marginBottom: 16 }}>No {filter} offers found.</p>
            <button className="hz-offers-btn" onClick={() => setFilter('all')}>View all offers</button>
          </div>
        )}
      </div>
    </ContentPageErrorBoundary>
  );
}
