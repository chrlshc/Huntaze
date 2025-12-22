import React from 'react';
import { cn } from '@/lib/utils';
import './InfoCard.css';

export interface InfoCardProps {
  /** Icon element to display */
  icon: React.ReactNode;
  /** Card title */
  title: string;
  /** Card description (max 2 lines) */
  description: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * InfoCard Component
 * 
 * Displays informational content with icon, title, and description in a compact format.
 * Used in Smart Messages view for highlights and other informational displays.
 * 
 * Design Specification:
 * - Background: #FFFFFF
 * - Border: 1px solid #E3E3E3
 * - Border radius: 12px
 * - Padding: 12-14px
 * - Icon: 32px circular, #EEF2FF background, #5B6BFF color
 * - Title: 14px, 600 weight, #111111
 * - Description: 13px, #6B7280, 2-line clamp
 * - Gap: 12px between icon and content
 * - Hover: background #F9FAFF, border #D0D0D0
 * 
 * Performance: Memoized to prevent unnecessary re-renders
 */
export const InfoCard = React.memo(function InfoCard({
  icon,
  title,
  description,
  onClick,
  className,
}: InfoCardProps) {
  const Component = onClick ? 'button' : 'div';
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };
  
  return (
    <Component
      className={cn('info-card', className)}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      type={onClick ? 'button' : undefined}
      data-testid="info-card"
      aria-label={onClick ? `${title}: ${description}` : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick && Component === 'div' ? 'button' : undefined}
    >
      <div className="info-card__icon" data-testid="info-card-icon" aria-hidden="true">
        {icon}
      </div>
      
      <div className="info-card__content">
        <div className="info-card__title" data-testid="info-card-title">
          {title}
        </div>
        <div className="info-card__description" data-testid="info-card-description">
          {description}
        </div>
      </div>
    </Component>
  );
});
