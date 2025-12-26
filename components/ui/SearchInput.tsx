'use client';

import React, { forwardRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  showClearButton?: boolean;
  inputProps?: Omit<React.ComponentPropsWithoutRef<'input'>, 'value'>;
};

export const SearchInput = forwardRef<React.ElementRef<'input'>, SearchInputProps>(function SearchInput(
  {
    value,
    onChange,
    placeholder = 'Search…',
    ariaLabel = 'Search',
    className,
    inputClassName,
    disabled = false,
    showClearButton = false,
    inputProps,
  },
  ref,
) {
  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      inputProps?.onChange?.(event);
      onChange(event.target.value);
    },
    [inputProps, onChange],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      inputProps?.onKeyDown?.(event);
      if (event.defaultPrevented) {
        return;
      }
      if (event.key === 'Escape' && value) {
        event.preventDefault();
        handleClear();
      }
    },
    [handleClear, inputProps, value],
  );

  return (
    <div className={cn('relative w-full', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6b7177]"
        aria-hidden="true"
      />
      <input
        ref={ref}
        {...inputProps}
        type={inputProps?.type ?? 'text'}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          'w-full text-[#1a1a1a] placeholder:text-[#6b7177]',
          'focus:outline-none focus:ring-2 focus:ring-[#2c6ecb] focus:border-transparent',
          disabled && 'opacity-60 cursor-not-allowed',
          inputProps?.className,
          inputClassName,
        )}
        style={{
          height: '40px',
          padding: 'var(--of-input-padding, 12px 16px)',
          paddingLeft: '44px',
          paddingRight: showClearButton ? '44px' : undefined,
          borderRadius: 'var(--of-radius-input, 12px)',
          fontSize: 'var(--of-text-base, 14px)',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-default, rgba(15, 23, 42, 0.12))',
          ...(inputProps?.style ?? {}),
        }}
      />
      {showClearButton && value && !disabled ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1',
            'text-[#6b7177] hover:text-[#1a1a1a] hover:bg-slate-100',
            'focus:outline-none focus:ring-2 focus:ring-[#2c6ecb] focus:ring-offset-2',
          )}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
});

SearchInput.displayName = 'SearchInput';
