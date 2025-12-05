'use client';

import React, { useId } from 'react';

/**
 * Toggle Component - Design System Unified
 * 
 * Custom styled toggle switch with design system colors.
 * ON state uses action-primary color, OFF state uses neutral gray.
 * 
 * @requirements 10.4 - Custom styling with design system colors
 */

export interface ToggleProps {
  /** Whether the toggle is checked */
  checked: boolean;
  /** Callback when toggle state changes */
  onChange: (checked: boolean) => void;
  /** Label text displayed next to the toggle */
  label: string;
  /** Optional description text */
  description?: string;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** ID for the toggle input */
  id?: string;
  /** Additional class name */
  className?: string;
  /** Name attribute for form submission */
  name?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  id: providedId,
  className = '',
  name,
}) => {
  const generatedId = useId();
  const toggleId = providedId || generatedId;
  const descriptionId = description ? `${toggleId}-description` : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(e.target.checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  const sizeClasses = {
    sm: 'toggle-sm',
    md: 'toggle-md',
    lg: 'toggle-lg',
  };

  return (
    <div
      className={`toggle-wrapper ${className}`}
      data-testid="toggle-wrapper"
    >
      <label
        htmlFor={toggleId}
        className={`toggle-label ${disabled ? 'toggle-disabled' : ''}`}
        data-testid="toggle-label"
      >
        <div className="toggle-content">
          <span className="toggle-label-text" data-testid="toggle-label-text">
            {label}
          </span>
          {description && (
            <span
              id={descriptionId}
              className="toggle-description"
              data-testid="toggle-description"
            >
              {description}
            </span>
          )}
        </div>
        
        <div
          className={`toggle-track ${sizeClasses[size]} ${checked ? 'toggle-checked' : 'toggle-unchecked'}`}
          data-testid="toggle-track"
          data-checked={checked}
          role="presentation"
        >
          <input
            type="checkbox"
            id={toggleId}
            name={name}
            checked={checked}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="toggle-input"
            aria-describedby={descriptionId}
            data-testid="toggle-input"
          />
          <span
            className="toggle-thumb"
            data-testid="toggle-thumb"
          />
        </div>
      </label>
      
      <style jsx>{`
        .toggle-wrapper {
          display: inline-flex;
        }
        
        .toggle-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
          cursor: pointer;
          user-select: none;
        }
        
        .toggle-label.toggle-disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        
        .toggle-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }
        
        .toggle-label-text {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
        }
        
        .toggle-description {
          font-size: var(--text-xs);
          color: var(--text-secondary);
        }
        
        .toggle-track {
          position: relative;
          flex-shrink: 0;
          border-radius: var(--radius-full);
          transition: background-color var(--transition-fast);
        }
        
        /* Size variants */
        .toggle-sm {
          width: 32px;
          height: 18px;
        }
        
        .toggle-md {
          width: 40px;
          height: 22px;
        }
        
        .toggle-lg {
          width: 48px;
          height: 26px;
        }
        
        /* OFF state - neutral gray - Requirement 10.4 */
        .toggle-unchecked {
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border-default);
        }
        
        /* ON state - action-primary color - Requirement 10.4 */
        .toggle-checked {
          background-color: var(--accent-primary);
          border: 1px solid var(--accent-primary);
        }
        
        .toggle-input {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        
        /* Focus ring */
        .toggle-input:focus-visible + .toggle-thumb {
          box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
        }
        
        .toggle-thumb {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background-color: var(--text-primary);
          border-radius: var(--radius-full);
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-sm);
        }
        
        /* Thumb sizes and positions */
        .toggle-sm .toggle-thumb {
          width: 14px;
          height: 14px;
          left: 2px;
        }
        
        .toggle-md .toggle-thumb {
          width: 18px;
          height: 18px;
          left: 2px;
        }
        
        .toggle-lg .toggle-thumb {
          width: 22px;
          height: 22px;
          left: 2px;
        }
        
        /* Checked thumb positions */
        .toggle-sm.toggle-checked .toggle-thumb {
          left: calc(100% - 16px);
        }
        
        .toggle-md.toggle-checked .toggle-thumb {
          left: calc(100% - 20px);
        }
        
        .toggle-lg.toggle-checked .toggle-thumb {
          left: calc(100% - 24px);
        }
        
        /* Hover states */
        .toggle-label:not(.toggle-disabled):hover .toggle-unchecked {
          background-color: var(--bg-hover);
          border-color: var(--border-emphasis);
        }
        
        .toggle-label:not(.toggle-disabled):hover .toggle-checked {
          background-color: var(--accent-primary-hover);
        }
        
        /* Active/pressed state */
        .toggle-label:not(.toggle-disabled):active .toggle-thumb {
          transform: translateY(-50%) scale(0.95);
        }
      `}</style>
    </div>
  );
};

Toggle.displayName = 'Toggle';

export default Toggle;
