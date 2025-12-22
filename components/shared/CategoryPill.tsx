/**
 * CategoryPill Component
 * 
 * Standardized badge/pill component based on OnlyFans design system
 * for consistent styling across the application.
 */

import React from 'react';

export type PillVariant = 'default' | 'ai' | 'success' | 'warning' | 'error' | 'info' | 'draft' | 'active';

export interface CategoryPillProps {
  /** Pill label text */
  children: React.ReactNode;
  /** Visual variant/tone */
  variant?: PillVariant;
  /** Optional CSS class name */
  className?: string;
  /** Optional icon to display before text */
  icon?: React.ReactNode;
}

export function CategoryPill({
  children,
  variant = 'default',
  className = '',
  icon
}: CategoryPillProps) {
  return (
    <span className={`category-pill category-pill--${variant} ${className}`}>
      {icon && <span className="category-pill__icon">{icon}</span>}
      {children}
      
      <style jsx>{`
        .category-pill {
          display: inline-flex;
          align-items: center;
          padding: 2px 10px;
          border-radius: 999px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 600;
        }
        
        .category-pill__icon {
          margin-right: 4px;
          display: flex;
          align-items: center;
          font-size: 12px;
        }
        
        /* Default variant */
        .category-pill--default {
          background: rgba(15, 23, 42, 0.03);
          color: #475569;
          border: 1px solid var(--border-default, rgba(15, 23, 42, 0.08));
        }
        
        /* AI variant */
        .category-pill--ai {
          background: var(--accent-primary-soft, rgba(124, 58, 237, 0.12));
          color: var(--accent-primary, #7c3aed);
          border: 1px solid rgba(124, 58, 237, 0.18);
        }
        
        /* Success variant */
        .category-pill--success {
          background: var(--of-chip-vip-bg, #DEF7EC);
          color: var(--of-chip-vip-text, #03543F);
          border: 1px solid rgba(3, 84, 63, 0.12);
        }
        
        /* Warning variant */
        .category-pill--warning {
          background: var(--of-chip-medium-risk-bg, #FEF3C7);
          color: var(--of-chip-medium-risk-text, #92400E);
          border: 1px solid rgba(146, 64, 14, 0.12);
        }
        
        /* Error variant */
        .category-pill--error {
          background: var(--of-chip-high-risk-bg, #FEE2E2);
          color: var(--of-chip-high-risk-text, #991B1B);
          border: 1px solid rgba(153, 27, 27, 0.12);
        }
        
        /* Info variant */
        .category-pill--info {
          background: var(--of-chip-sent-bg, #DBEAFE);
          color: var(--of-chip-sent-text, #1E40AF);
          border: 1px solid rgba(30, 64, 175, 0.12);
        }
        
        /* Draft variant */
        .category-pill--draft {
          background: var(--of-chip-draft-bg, #F3F4F6);
          color: var(--of-chip-draft-text, #374151);
          border: 1px solid rgba(55, 65, 81, 0.12);
        }
        
        /* Active variant */
        .category-pill--active {
          background: var(--of-chip-active-bg, #DEF7EC);
          color: var(--of-chip-active-text, #03543F);
          border: 1px solid rgba(3, 84, 63, 0.12);
        }
      `}</style>
    </span>
  );
}
