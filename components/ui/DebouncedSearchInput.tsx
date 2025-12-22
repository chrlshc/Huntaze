import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { cn } from '@/lib/utils';

/**
 * DebouncedSearchInput Component
 * 
 * Search input with built-in debouncing and loading indicator.
 * Reduces API calls and improves performance by delaying search until user stops typing.
 * 
 * Features:
 * - 300ms debounce delay (configurable)
 * - Loading indicator while search is pending
 * - Clear button to reset search
 * - Accessible keyboard navigation
 * 
 * Requirements: 2.3 - Search bar functionality with performance optimization
 */

interface DebouncedSearchInputProps {
  /** Placeholder text */
  placeholder?: string;
  /** Callback when debounced search value changes */
  onSearch: (value: string) => void;
  /** Debounce delay in milliseconds (default: 300) */
  delay?: number;
  /** Minimum characters before triggering search (default: 0) */
  minLength?: number;
  /** Additional class names */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** ARIA label for accessibility */
  ariaLabel?: string;
}

export const DebouncedSearchInput = React.memo(function DebouncedSearchInput({
  placeholder = 'Search...',
  onSearch,
  delay = 300,
  minLength = 0,
  className,
  disabled = false,
  ariaLabel = 'Search',
}: DebouncedSearchInputProps) {
  const {
    inputValue,
    debouncedValue,
    isSearching,
    setInputValue,
    clearSearch,
  } = useDebouncedSearch({
    delay,
    minLength,
    onSearch,
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  const handleClear = () => {
    clearSearch();
    onSearch(''); // Immediately trigger search with empty value
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };
  
  return (
    <div className={cn('relative flex-1', className)}>
      {/* Search Icon */}
      <Search 
        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" 
        aria-hidden="true"
      />
      
      {/* Input Field */}
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-busy={isSearching}
        aria-describedby={isSearching ? 'search-loading' : undefined}
        className={cn(
          'w-full max-h-[40px] pl-9 pr-10 py-2',
          'border border-[#E3E3E3] rounded-[8px]',
          'bg-[#FFFFFF] text-[#111111] text-[14px]',
          'placeholder:text-[#9CA3AF]',
          'focus:outline-none focus:border-[#5B6BFF]',
          'transition-colors duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
        style={{ height: '40px' }}
      />
      
      {/* Loading Indicator or Clear Button */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
        {isSearching && (
          <Loader2 
            className="w-4 h-4 text-[#5B6BFF] animate-spin" 
            aria-hidden="true"
            id="search-loading"
          />
        )}
        
        {inputValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className={cn(
              'p-1 rounded-full',
              'text-[#6B7280] hover:text-[#111111]',
              'hover:bg-[#F3F4F6]',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-[#5B6BFF] focus:ring-offset-2',
            )}
          >
            <X className="w-3 h-3" aria-hidden="true" />
          </button>
        )}
      </div>
      
      {/* Screen reader announcement for search state */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isSearching && 'Searching...'}
        {!isSearching && debouncedValue && `Found results for "${debouncedValue}"`}
      </div>
    </div>
  );
});
