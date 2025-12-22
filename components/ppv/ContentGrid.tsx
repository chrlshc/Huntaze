'use client';

import React from 'react';

/**
 * ContentGrid Component
 * 
 * A responsive CSS Grid component for displaying PPV content cards
 * with consistent gap spacing, fixed aspect ratio thumbnails,
 * and clear action button hierarchy.
 * 
 * Implements Requirements 9.1, 9.2, 9.3, 9.4, 11.1, 11.2, 11.3, 11.5
 * 
 * Task 14 Enhancements:
 * - Status badge in top-left corner (Active, Draft, Scheduled) - Requirement 11.3
 * - Hover state with image scale(1.01) - Requirement 11.1
 * - Quick action overlay on hover (Duplicate, Edit, View Stats) - Requirements 11.2, 11.5
 * - Smooth transitions for all interactions - Requirement 11.4
 */

// Add CSS animation for fade-in effect
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `;
  if (!document.querySelector('style[data-campaign-card-animations]')) {
    style.setAttribute('data-campaign-card-animations', 'true');
    document.head.appendChild(style);
  }
}

export interface ContentItem {
  id: string;
  thumbnail: string;
  title: string;
  price: number;
  status?: 'active' | 'draft' | 'scheduled';
  stats: {
    sent: number;
    opened: number;
    purchased: number;
  };
}

export interface ContentGridProps {
  items: ContentItem[];
  aspectRatio?: '16:9' | '1:1' | '4:3';
  gap?: 'sm' | 'base' | 'lg';
  loading?: boolean;
  onSend: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onViewStats?: (id: string) => void;
  columns?: 2 | 3 | 4;
}

const gapValues = {
  sm: '8px',
  base: '16px',
  lg: '24px',
} as const;

const aspectRatioValues = {
  '16:9': '16 / 9',
  '1:1': '1 / 1',
  '4:3': '4 / 3',
} as const;

export function ContentGrid({
  items,
  aspectRatio = '16:9',
  gap = 'base',
  loading = false,
  onSend,
  onEdit,
  onDuplicate,
  onViewStats,
  columns = 3,
}: ContentGridProps) {
  const gapValue = gapValues[gap];
  const aspectRatioValue = aspectRatioValues[aspectRatio];

  if (loading) {
    return (
      <div
        className="content-grid"
        data-testid="content-grid"
        data-gap={gapValue}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: gapValue,
        }}
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <ContentCardSkeleton key={index} aspectRatio={aspectRatioValue} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="content-grid-empty"
        data-testid="content-grid-empty"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 600 }}>
          No content yet
        </h3>
        <p style={{ margin: 0, color: 'var(--color-text-secondary, #6D7175)' }}>
          Upload your first PPV content to get started
        </p>
      </div>
    );
  }

  return (
    <div
      className="content-grid"
      data-testid="content-grid"
      data-gap={gapValue}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: gapValue,
      }}
    >
      {items.map((item) => (
        <ContentCard
          key={item.id}
          item={item}
          aspectRatio={aspectRatioValue}
          onSend={onSend}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onViewStats={onViewStats}
        />
      ))}
    </div>
  );
}


interface ContentCardProps {
  item: ContentItem;
  aspectRatio: string;
  onSend: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onViewStats?: (id: string) => void;
}

function ContentCard({ item, aspectRatio, onSend, onEdit, onDuplicate, onViewStats }: ContentCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  // Status badge configuration
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: 'Active', color: '#047857', bg: 'rgba(4, 120, 87, 0.1)' },
    draft: { label: 'Draft', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
    scheduled: { label: 'Scheduled', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    expired: { label: 'Expired', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
    paused: { label: 'Paused', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  };

  const status = item.status || 'draft';
  const statusStyle = statusConfig[status] || statusConfig.draft;

  return (
    <div
      className="content-card ppv-content-card"
      data-testid="content-card"
      data-status={status}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E3E3E3',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Thumbnail with fixed aspect ratio */}
      <div
        className="content-thumbnail-container"
        data-testid="thumbnail-container"
        style={{
          aspectRatio: aspectRatio,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'var(--color-surface-subdued, #FAFBFB)',
        }}
      >
        <img
          src={item.thumbnail}
          alt={item.title}
          className="content-thumbnail"
          data-testid="content-thumbnail"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isHovered ? 'scale(1.01)' : 'scale(1)',
          }}
        />

        {/* Status badge in top-left corner - Requirement 11.3 */}
        <div
          className="status-badge"
          data-testid="status-badge"
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            backgroundColor: statusStyle.bg,
            color: statusStyle.color,
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            backdropFilter: 'blur(8px)',
          }}
        >
          {statusStyle.label}
        </div>

        {/* Price badge overlay */}
        <div
          className="price-badge"
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            color: '#FFFFFF',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          ${item.price.toFixed(2)}
        </div>

        {/* Quick action overlay on hover - Requirements 11.2, 11.5 */}
        {isHovered && (onDuplicate || onViewStats) && (
          <div
            className="quick-actions-overlay"
            data-testid="quick-actions-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '16px',
              animation: 'fadeIn 150ms ease-out',
            }}
          >
            {onDuplicate && (
              <button
                className="quick-action-btn"
                data-testid="quick-action-duplicate"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(item.id);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#202223',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Duplicate
              </button>
            )}
            <button
              className="quick-action-btn"
              data-testid="quick-action-edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item.id);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: '#202223',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Edit
            </button>
            {onViewStats && (
              <button
                className="quick-action-btn"
                data-testid="quick-action-stats"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewStats(item.id);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#202223',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                View Stats
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content info */}
      <div style={{ padding: '12px 16px' }}>
        <h4
          style={{
            margin: '0 0 8px',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-text-primary, #202223)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.title}
        </h4>

        {/* Action buttons with hierarchy */}
        <div
          className="content-actions"
          data-testid="content-actions"
          style={{
            display: 'flex',
            gap: '8px',
          }}
        >
          {/* Primary action - solid background */}
          <button
            className="btn-primary"
            data-testid="btn-primary"
            onClick={() => onSend(item.id)}
            style={{
              flex: 1,
              padding: '8px 16px',
              minHeight: '44px',
              backgroundColor: 'var(--color-action-primary, #7C3AED)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-sm, 4px)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Send
          </button>

          {/* Secondary action - outline style */}
          <button
            className="btn-secondary"
            data-testid="btn-secondary"
            onClick={() => onEdit(item.id)}
            style={{
              flex: 1,
              padding: '8px 16px',
              minHeight: '44px',
              backgroundColor: 'transparent',
              color: 'var(--color-text-primary, #202223)',
              border: '1px solid var(--color-border-default, #E1E3E5)',
              borderRadius: 'var(--radius-sm, 4px)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Stats footer - Task 4.4: Card statistics footer styling */}
      <div className="ppv-card-footer" data-testid="content-stats">
        <div className="ppv-card-footer__stat">
          <span style={{ fontWeight: 500 }}>{item.stats.sent}</span>
          <span>Sent</span>
        </div>
        <div className="ppv-card-footer__stat">
          <span style={{ fontWeight: 500 }}>{item.stats.opened}</span>
          <span>Opened</span>
        </div>
        <div className="ppv-card-footer__stat">
          <span style={{ fontWeight: 500 }}>{item.stats.purchased}</span>
          <span>Purchased</span>
        </div>
      </div>
    </div>
  );
}

function ContentCardSkeleton({ aspectRatio }: { aspectRatio: string }) {
  return (
    <div
      className="content-card-skeleton"
      data-testid="content-card-skeleton"
      style={{
        backgroundColor: 'var(--color-surface-card, #FFFFFF)',
        borderRadius: 'var(--radius-base, 8px)',
        boxShadow: 'var(--shadow-card, 0px 1px 3px rgba(0,0,0,0.1))',
        overflow: 'hidden',
      }}
    >
      {/* Thumbnail skeleton */}
      <div
        style={{
          aspectRatio: aspectRatio,
          backgroundColor: 'var(--color-surface-subdued, #FAFBFB)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
      {/* Content skeleton */}
      <div style={{ padding: '12px 16px' }}>
        <div
          style={{
            height: '14px',
            width: '70%',
            backgroundColor: 'var(--color-surface-subdued, #FAFBFB)',
            borderRadius: '4px',
            marginBottom: '8px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            height: '12px',
            width: '50%',
            backgroundColor: 'var(--color-surface-subdued, #FAFBFB)',
            borderRadius: '4px',
            marginBottom: '12px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <div
            style={{
              flex: 1,
              height: '44px',
              backgroundColor: 'var(--color-surface-subdued, #FAFBFB)',
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <div
            style={{
              flex: 1,
              height: '44px',
              backgroundColor: 'var(--color-surface-subdued, #FAFBFB)',
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default ContentGrid;
