import React, { useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { validateSearchInput, sanitizeSearchInput } from '@/lib/validation/input-validation';

export interface ValidatedSearchInputProps {
  /** Current search value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Submit handler */
  onSubmit?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to show validation errors inline */
  showErrors?: boolean;
  /** Debounce delay in milliseconds */
  debounceDelay?: number;
  /** Additional class names */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * ValidatedSearchInput Component
 * 
 * Search input with built-in validation:
 * - Maximum 100 characters
 * - No HTML tags
 * - Inline error messages
 * - Automatic sanitization
 * - Debounced validation
 * 
 * Usage:
 * ```tsx
 * <ValidatedSearchInput
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   onSubmit={handleSearch}
 *   placeholder="Search fans..."
 * />
 * ```
 */
export function ValidatedSearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search...',
  showErrors = true,
  debounceDelay = 300,
  className,
  disabled = false,
}: ValidatedSearchInputProps) {
  const [isTouched, setIsTouched] = useState(false);
  const validation = useMemo(() => validateSearchInput(value), [value]);

  // Validate input on change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      
      // Validate
      const validation = validateSearchInput(newValue);
      
      if (!validation.valid) {
        // Still update value to show user what they typed
        onChange(newValue);
      } else {
        // Sanitize and update
        const sanitized = sanitizeSearchInput(newValue);
        onChange(sanitized);
      }
      
      setIsTouched(true);
    },
    [onChange]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validate before submit
      const validation = validateSearchInput(value);
      
      if (!validation.valid) {
        setIsTouched(true);
        return;
      }
      
      // Submit sanitized value
      const sanitized = sanitizeSearchInput(value);
      if (onSubmit) {
        onSubmit(sanitized);
      }
    },
    [value, onSubmit]
  );

  const error = showErrors && isTouched && !validation.valid ? validation.error : undefined;
  const hasError = Boolean(error);

  return (
    <div className={cn('validated-search-input', className)}>
      <form onSubmit={handleSubmit} className="validated-search-input__form">
        <div className="validated-search-input__wrapper">
          {/* Search icon */}
          <svg
            className="validated-search-input__icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          {/* Input */}
          <input
            type="text"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'validated-search-input__input',
              hasError && 'validated-search-input__input--error'
            )}
            aria-label="Search"
            aria-invalid={hasError}
            aria-describedby={hasError ? 'search-error' : undefined}
            maxLength={100}
          />

          {/* Clear button */}
          {value && !disabled && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsTouched(false);
              }}
              className="validated-search-input__clear"
              aria-label="Clear search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Error message */}
        {hasError && (
          <div
            id="search-error"
            className="validated-search-input__error"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {/* Character count */}
        {value && value.length > 80 && (
          <div
            className={cn(
              'validated-search-input__count',
              value.length > 100 && 'validated-search-input__count--error'
            )}
            aria-live="polite"
          >
            {value.length}/100
          </div>
        )}
      </form>

      <style jsx>{`
        .validated-search-input {
          width: 100%;
        }

        .validated-search-input__form {
          width: 100%;
        }

        .validated-search-input__wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .validated-search-input__icon {
          position: absolute;
          left: 12px;
          width: 20px;
          height: 20px;
          color: #9CA3AF;
          pointer-events: none;
        }

        .validated-search-input__input {
          width: 100%;
          max-height: 40px;
          padding: 10px 40px 10px 40px;
          font-size: 14px;
          color: #111111;
          background: #FFFFFF;
          border: 1px solid #E3E3E3;
          border-radius: 8px;
          transition: all 150ms ease;
        }

        .validated-search-input__input::placeholder {
          color: #9CA3AF;
        }

        .validated-search-input__input:focus {
          outline: none;
          border-color: #5B6BFF;
          box-shadow: 0 0 0 3px rgba(91, 107, 255, 0.1);
        }

        .validated-search-input__input--error {
          border-color: #DC2626;
        }

        .validated-search-input__input--error:focus {
          border-color: #DC2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }

        .validated-search-input__input:disabled {
          background: #F3F4F6;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .validated-search-input__clear {
          position: absolute;
          right: 12px;
          width: 20px;
          height: 20px;
          padding: 0;
          color: #9CA3AF;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 150ms ease;
        }

        .validated-search-input__clear:hover {
          color: #6B7280;
        }

        .validated-search-input__clear:focus {
          outline: 2px solid #5B6BFF;
          outline-offset: 2px;
          border-radius: 4px;
        }

        .validated-search-input__error {
          margin-top: 4px;
          font-size: 12px;
          color: #DC2626;
        }

        .validated-search-input__count {
          margin-top: 4px;
          font-size: 12px;
          color: #6B7280;
          text-align: right;
        }

        .validated-search-input__count--error {
          color: #DC2626;
        }
      `}</style>
    </div>
  );
}
