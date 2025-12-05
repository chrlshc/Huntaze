'use client';

import React from 'react';

/**
 * ContentGrid Component
 * 
 * A responsive CSS Grid component for displaying PPV content cards
 * with consistent gap spacing, fixed aspect ratio thumbnails,
 * and clear action button hierarchy.
 * 
 * Implements Requirements 9.1, 9.2, 9.3, 9.4
 */

export interface ContentItem {
  id: string;
  thumbnail: string;
  title: string;
  price: number;
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
}

function ContentCard({ item, aspectRatio, onSend, onEdit }: ContentCardProps) {
  return (
    <div
      className="content-card"
      data-testid="content-card"
      style={{
        backgroundColor: 'var(--color-surface-card, #FFFFFF)',
        borderRadius: 'var(--radius-base, 8px)',
        boxShadow: 'var(--shadow-card, 0px 1px 3px rgba(0,0,0,0.1))',
        overflow: 'hidden',
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
          }}
        />
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

        {/* Stats row */}
        <div
          className="content-stats"
          data-testid="content-stats"
          style={{
            display: 'flex',
            gap: '16px',
            fontSize: '12px',
            color: 'var(--color-text-secondary, #6D7175)',
            marginBottom: '12px',
          }}
        >
          <StatItem label="Sent" value={item.stats.sent} />
          <StatItem label="Opened" value={item.stats.opened} />
          <StatItem label="Purchased" value={item.stats.purchased} />
        </div>

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
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: number;
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontWeight: 500 }}>{value}</span>
      <span>{label}</span>
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
