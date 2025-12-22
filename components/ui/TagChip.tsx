import React from 'react';
import { cn } from '@/lib/utils';
import './TagChip.css';

export type TagVariant =
  | 'vip'
  | 'active'
  | 'at-risk'
  | 'churned'
  | 'low'
  | 'medium'
  | 'high'
  | 'nouveau';

export type TagSize = 'sm' | 'md';

export interface TagChipProps {
  /** Label text to display */
  label: string;
  /** Visual variant determining colors */
  variant: TagVariant;
  /** Size variant */
  size?: TagSize;
  /** Additional class names */
  className?: string;
}

/**
 * TagChip Component
 * 
 * Displays status, category, or tier information as a compact, colored pill.
 * Used in Fans view for tier status and churn risk indicators.
 * 
 * Design Specification:
 * - Font size: 10px (sm), 11px (md)
 * - Padding: 2-6px vertical, 6-8px horizontal
 * - Border radius: 999px (pill shape)
 * - Font weight: 500
 * 
 * Tier Variants (Requirements 8.1, 8.2, 8.3):
 * - VIP: Violet-tinted (rgba(139, 92, 246, 0.1) background, #8b5cf6 text)
 * - Active: Blue-tinted (rgba(59, 130, 246, 0.1) background, #3b82f6 text)
 * - At-Risk: Orange-tinted (rgba(245, 158, 11, 0.1) background, #f59e0b text)
 * - Churned: Gray-tinted (rgba(107, 114, 128, 0.1) background, #6b7280 text)
 * 
 * Churn Risk Variants (Requirements 8.4, 8.5, 8.6):
 * - Low: Green (rgba(16, 185, 129, 0.1) background, #10b981 text)
 * - Medium: Orange (rgba(245, 158, 11, 0.1) background, #f59e0b text)
 * - High: Red (rgba(239, 68, 68, 0.1) background, #ef4444 text)
 * 
 * Performance: Memoized to prevent unnecessary re-renders
 */
export const TagChip = React.memo(function TagChip({ label, variant, size = 'md', className }: TagChipProps) {
  // Map variants to readable status names
  const statusMap: Record<TagVariant, string> = {
    'vip': 'VIP status',
    'active': 'Active status',
    'at-risk': 'At-risk status',
    'churned': 'Churned status',
    'low': 'Low churn risk',
    'medium': 'Medium churn risk',
    'high': 'High churn risk',
    'nouveau': 'New status',
  };
  
  // Add visual indicators (icons) for non-color identification
  const getIcon = () => {
    switch (variant) {
      case 'vip':
        return (
          <svg className="tag-chip__icon" width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M5 1L6.09 3.26L8.5 3.62L6.75 5.32L7.18 7.72L5 6.56L2.82 7.72L3.25 5.32L1.5 3.62L3.91 3.26L5 1Z" fill="currentColor"/>
          </svg>
        );
      case 'high':
      case 'at-risk':
        return (
          <svg className="tag-chip__icon" width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M5 1L9 9H1L5 1Z" fill="currentColor"/>
          </svg>
        );
      case 'low':
      case 'active':
        return (
          <svg className="tag-chip__icon" width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="5" cy="5" r="4" fill="currentColor"/>
          </svg>
        );
      default:
        return null;
    }
  };
  
  return (
    <span
      className={cn('tag-chip', `tag-chip--${variant}`, `tag-chip--${size}`, className)}
      data-testid="tag-chip"
      data-variant={variant}
      data-size={size}
      role="status"
      aria-label={`${label} - ${statusMap[variant]}`}
    >
      {getIcon()}
      {label}
    </span>
  );
});
