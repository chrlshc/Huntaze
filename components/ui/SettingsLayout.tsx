'use client';

import React from 'react';
import { Toggle } from './Toggle';
import { cn } from '@/lib/utils';

/**
 * Settings Layout Components
 * 
 * Implements Requirements 11.1 and 11.2:
 * - Toggle adjacent to label in same container (Gestalt proximity)
 * - Visual separators between items (borders or zebra striping)
 */

// ============================================================================
// Types
// ============================================================================

export interface SettingsItemProps {
  /** Unique identifier for the setting */
  id: string;
  /** Label text displayed next to the control */
  label: string;
  /** Optional description text below the label */
  description?: string;
  /** Additional CSS classes */
  className?: string;
  /** Children elements (for custom controls) */
  children?: React.ReactNode;
}

export interface SettingsToggleItemProps extends Omit<SettingsItemProps, 'children'> {
  /** Current toggle state */
  checked: boolean;
  /** Callback when toggle changes */
  onChange: (checked: boolean) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
}

export interface SettingsListProps {
  /** List items */
  children: React.ReactNode;
  /** Separator style between items */
  separatorStyle?: 'border' | 'zebra' | 'both';
  /** Spacing between items */
  spacing?: 'compact' | 'default' | 'relaxed';
  /** Additional CSS classes */
  className?: string;
}

export interface SettingsSectionProps {
  /** Section title */
  title: string;
  /** Optional section description */
  description?: string;
  /** Section content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Components
// ============================================================================

/**
 * SettingsItem - Base container for a settings item
 * Ensures label and control are in the same flex container (Gestalt proximity)
 */
export function SettingsItem({
  id,
  label,
  description,
  className,
  children
}: SettingsItemProps) {
  return (
    <div
      className={cn(
        'settings-list-item',
        'flex items-center justify-between',
        'py-3 px-4',
        className
      )}
      data-testid={`settings-item-${id}`}
    >
      <div className="flex-1 min-w-0 mr-4">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-content-primary"
        >
          {label}
        </label>
        {description && (
          <p className="mt-1 text-sm text-content-secondary">
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );
}

/**
 * SettingsToggleItem - Settings item with integrated toggle
 * Toggle is adjacent to label in same container (Requirements 11.1)
 * 
 * Uses the Toggle component which already includes label support,
 * but wraps it in the settings list item structure for consistency.
 */
export function SettingsToggleItem({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
  className
}: SettingsToggleItemProps) {
  return (
    <div
      className={cn(
        'settings-list-item',
        'px-4',
        className
      )}
      data-testid={`settings-item-${id}`}
    >
      <Toggle
        id={id}
        label={label}
        description={description}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-full"
      />
    </div>
  );
}

/**
 * SettingsList - Container for settings items with separators
 * Implements visual separators between items (Requirements 11.2)
 */
export function SettingsList({
  children,
  separatorStyle = 'border',
  spacing = 'default',
  className
}: SettingsListProps) {
  const spacingClasses = {
    compact: '[&_.settings-list-item]:py-2',
    default: '[&_.settings-list-item]:py-3',
    relaxed: '[&_.settings-list-item]:py-4'
  };

  const separatorClasses = {
    border: '[&_.settings-list-item:not(:last-child)]:border-b [&_.settings-list-item:not(:last-child)]:border-border-light dark:[&_.settings-list-item:not(:last-child)]:border-border',
    zebra: '[&_.settings-list-item:nth-child(odd)]:bg-surface-subdued',
    both: '[&_.settings-list-item:not(:last-child)]:border-b [&_.settings-list-item:not(:last-child)]:border-border-light dark:[&_.settings-list-item:not(:last-child)]:border-border [&_.settings-list-item:nth-child(odd)]:bg-surface-subdued'
  };

  return (
    <div
      className={cn(
        'settings-list',
        'rounded-lg overflow-hidden',
        'bg-surface-card-light dark:bg-surface-card',
        'border border-border-light dark:border-border',
        spacingClasses[spacing],
        separatorClasses[separatorStyle],
        className
      )}
      role="list"
      data-separator-style={separatorStyle}
      data-spacing={spacing}
    >
      {children}
    </div>
  );
}

/**
 * SettingsSection - Groups related settings with a title
 */
export function SettingsSection({
  title,
  description,
  children,
  className
}: SettingsSectionProps) {
  return (
    <section className={cn('settings-section', 'mb-8', className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-content-primary">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-content-secondary">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * SettingsCalloutCard - Compact callout for account connection prompts
 * Implements Requirements 11.3
 */
export interface SettingsCalloutCardProps {
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Action button label */
  actionLabel: string;
  /** Action button callback */
  onAction: () => void;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Card variant */
  variant?: 'default' | 'warning' | 'info';
  /** Additional CSS classes */
  className?: string;
}

export function SettingsCalloutCard({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  variant = 'default',
  className
}: SettingsCalloutCardProps) {
  const variantClasses = {
    default: 'bg-surface-subdued border-border-light dark:border-border',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  };

  return (
    <div
      className={cn(
        'settings-callout-card',
        'flex items-center gap-4 p-4 rounded-lg border',
        variantClasses[variant],
        className
      )}
    >
      {icon && (
        <div className="flex-shrink-0 text-content-secondary">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-content-primary">
          {title}
        </h4>
        <p className="mt-0.5 text-sm text-content-secondary">
          {description}
        </p>
      </div>
      <button
        onClick={onAction}
        className={cn(
          'flex-shrink-0 px-4 py-2 rounded-lg',
          'text-sm font-medium',
          'bg-action-primary text-white',
          'hover:bg-action-primary-hover',
          'transition-colors duration-200',
          'min-h-[44px]' // Touch target minimum
        )}
      >
        {actionLabel}
      </button>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default {
  Item: SettingsItem,
  ToggleItem: SettingsToggleItem,
  List: SettingsList,
  Section: SettingsSection,
  CalloutCard: SettingsCalloutCard
};
