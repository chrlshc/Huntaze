/**
 * EmptyState Component
 * 
 * Displays helpful guidance when a page or section has no data.
 * Provides variants for different contexts (no data, no connection, error).
 * 
 * Feature: dashboard-ux-overhaul
 * Validates: Requirements 7.4
 */

import React from 'react';
import { 
  FileQuestion, 
  WifiOff, 
  AlertCircle, 
  Search, 
  Plus,
  RefreshCw,
  LucideIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export type EmptyStateVariant = 'no-data' | 'no-connection' | 'error' | 'no-results' | 'custom';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  /** Variant determines the default icon and styling */
  variant?: EmptyStateVariant;
  /** Custom icon to display (overrides variant icon) */
  icon?: React.ReactNode;
  /** Main title text */
  title: string;
  /** Description text providing guidance */
  description?: string;
  /** Primary action button */
  action?: EmptyStateAction;
  /** Secondary action button */
  secondaryAction?: EmptyStateAction;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

// Default icons for each variant
const variantIcons: Record<EmptyStateVariant, LucideIcon> = {
  'no-data': FileQuestion,
  'no-connection': WifiOff,
  'error': AlertCircle,
  'no-results': Search,
  'custom': FileQuestion,
};

// Default colors for each variant
const variantColors: Record<EmptyStateVariant, string> = {
  'no-data': 'text-gray-400',
  'no-connection': 'text-amber-500',
  'error': 'text-red-500',
  'no-results': 'text-gray-400',
  'custom': 'text-gray-400',
};


// Size configurations
const sizeConfig = {
  sm: {
    container: 'min-h-[200px] p-4',
    icon: 'h-10 w-10',
    title: 'text-base',
    description: 'text-sm max-w-sm',
  },
  md: {
    container: 'min-h-[300px] p-6',
    icon: 'h-12 w-12',
    title: 'text-lg',
    description: 'text-sm max-w-md',
  },
  lg: {
    container: 'min-h-[400px] p-8',
    icon: 'h-16 w-16',
    title: 'text-xl',
    description: 'text-base max-w-lg',
  },
};

/**
 * EmptyState component for displaying helpful guidance when no data is available.
 * 
 * @example
 * ```tsx
 * // Basic no data state
 * <EmptyState
 *   variant="no-data"
 *   title="No fans yet"
 *   description="Connect your OnlyFans account to see your fans here."
 *   action={{ label: "Connect Account", onClick: handleConnect }}
 * />
 * ```
 * 
 * @example
 * ```tsx
 * // Error state with retry
 * <EmptyState
 *   variant="error"
 *   title="Failed to load data"
 *   description="Something went wrong. Please try again."
 *   action={{ label: "Retry", onClick: handleRetry, icon: RefreshCw }}
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'no-data',
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
  size = 'md',
}) => {
  const IconComponent = variantIcons[variant];
  const iconColor = variantColors[variant];
  const sizes = sizeConfig[size];

  const renderIcon = () => {
    if (icon) {
      return <div className={`mb-4 ${iconColor}`}>{icon}</div>;
    }
    return (
      <div className={`mb-4 ${iconColor}`}>
        <IconComponent className={sizes.icon} strokeWidth={1.5} />
      </div>
    );
  };

  const renderAction = (actionConfig: EmptyStateAction, isPrimary: boolean) => {
    const ActionIcon = actionConfig.icon;
    const buttonVariant = actionConfig.variant || (isPrimary ? 'primary' : 'outline');
    
    return (
      <Button
        variant={buttonVariant as 'primary' | 'secondary' | 'outline'}
        onClick={actionConfig.onClick}
        className="gap-2"
      >
        {ActionIcon && <ActionIcon className="h-4 w-4" />}
        {actionConfig.label}
      </Button>
    );
  };

  return (
    <div
      className={`empty-state flex flex-col items-center justify-center text-center ${sizes.container} ${className}`}
      data-testid="empty-state"
      data-variant={variant}
    >
      {renderIcon()}
      
      <h3 
        className={`font-semibold text-[var(--color-text-main)] mb-2 ${sizes.title}`}
        data-testid="empty-state-title"
      >
        {title}
      </h3>
      
      {description && (
        <p 
          className={`text-[var(--color-text-sub)] mb-6 ${sizes.description}`}
          data-testid="empty-state-description"
        >
          {description}
        </p>
      )}
      
      {(action || secondaryAction) && (
        <div 
          className="flex flex-wrap gap-3 justify-center"
          data-testid="empty-state-actions"
        >
          {action && renderAction(action, true)}
          {secondaryAction && renderAction(secondaryAction, false)}
        </div>
      )}
    </div>
  );
};

// Preset empty states for common scenarios
export const NoDataEmptyState: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState
    variant="no-data"
    title="No data available"
    description="There's nothing here yet. Get started by adding some data."
    {...props}
  />
);

export const NoConnectionEmptyState: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState
    variant="no-connection"
    title="No connection"
    description="Please check your internet connection and try again."
    action={{ label: 'Retry', onClick: () => window.location.reload(), icon: RefreshCw }}
    {...props}
  />
);

export const ErrorEmptyState: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState
    variant="error"
    title="Something went wrong"
    description="We encountered an error. Please try again later."
    action={{ label: 'Retry', onClick: () => window.location.reload(), icon: RefreshCw }}
    {...props}
  />
);

export const NoResultsEmptyState: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState
    variant="no-results"
    title="No results found"
    description="Try adjusting your search or filters to find what you're looking for."
    {...props}
  />
);

export default EmptyState;
