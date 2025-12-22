/**
 * FilterIndicator Component - Usage Examples
 * 
 * Demonstrates how to use the FilterIndicator component
 * on the PPV Content page to show active filter state.
 */

import React, { useState } from 'react';
import { FilterIndicator } from './FilterIndicator';

/**
 * Example 1: Basic Usage with Filter Button
 * 
 * Shows the indicator when filters are active.
 */
export function BasicFilterIndicatorExample() {
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <h3>Basic Filter Indicator</h3>
      
      <button
        style={{
          position: 'relative',
          padding: '8px 16px',
          background: '#1f2937',
          color: 'white',
          border: '1px solid #374151',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
        onClick={() => setHasActiveFilters(!hasActiveFilters)}
      >
        Filters
        {hasActiveFilters && <FilterIndicator />}
      </button>
      
      <p style={{ marginTop: '12px', fontSize: '14px', color: '#9ca3af' }}>
        Click the button to toggle filter state
      </p>
    </div>
  );
}

/**
 * Example 2: Multiple Filter Buttons
 * 
 * Shows indicators on multiple buttons independently.
 */
export function MultipleFilterIndicatorsExample() {
  const [statusFilter, setStatusFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState(false);
  const [priceFilter, setPriceFilter] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <h3>Multiple Filter Indicators</h3>
      
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          style={{
            position: 'relative',
            padding: '8px 16px',
            background: '#1f2937',
            color: 'white',
            border: '1px solid #374151',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
          onClick={() => setStatusFilter(!statusFilter)}
        >
          Status
          {statusFilter && <FilterIndicator />}
        </button>
        
        <button
          style={{
            position: 'relative',
            padding: '8px 16px',
            background: '#1f2937',
            color: 'white',
            border: '1px solid #374151',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
          onClick={() => setDateFilter(!dateFilter)}
        >
          Date Range
          {dateFilter && <FilterIndicator />}
        </button>
        
        <button
          style={{
            position: 'relative',
            padding: '8px 16px',
            background: '#1f2937',
            color: 'white',
            border: '1px solid #374151',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
          onClick={() => setPriceFilter(!priceFilter)}
        >
          Price
          {priceFilter && <FilterIndicator />}
        </button>
      </div>
      
      <p style={{ marginTop: '12px', fontSize: '14px', color: '#9ca3af' }}>
        Click buttons to toggle individual filter states
      </p>
    </div>
  );
}

/**
 * Example 3: PPV Page Integration
 * 
 * Shows how to integrate with actual filter state logic.
 */
export function PPVFilterIndicatorExample() {
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all-time',
    minPrice: null,
    maxPrice: null,
  });

  // Check if any filters differ from default
  const hasActiveFilters = 
    filters.status !== 'all' ||
    filters.dateRange !== 'all-time' ||
    filters.minPrice !== null ||
    filters.maxPrice !== null;

  const resetFilters = () => {
    setFilters({
      status: 'all',
      dateRange: 'all-time',
      minPrice: null,
      maxPrice: null,
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>PPV Page Filter Integration</h3>
      
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          style={{
            position: 'relative',
            padding: '8px 16px',
            background: '#1f2937',
            color: 'white',
            border: '1px solid #374151',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          All Filters
          {hasActiveFilters && <FilterIndicator />}
        </button>
        
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              color: '#7c3aed',
              border: '1px solid #7c3aed',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Clear Filters
          </button>
        )}
      </div>
      
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '14px', color: '#d1d5db' }}>
          <input
            type="radio"
            checked={filters.status === 'all'}
            onChange={() => setFilters({ ...filters, status: 'all' })}
            style={{ marginRight: '8px' }}
          />
          All Status
        </label>
        <label style={{ fontSize: '14px', color: '#d1d5db' }}>
          <input
            type="radio"
            checked={filters.status === 'active'}
            onChange={() => setFilters({ ...filters, status: 'active' })}
            style={{ marginRight: '8px' }}
          />
          Active Only
        </label>
        <label style={{ fontSize: '14px', color: '#d1d5db' }}>
          <input
            type="radio"
            checked={filters.status === 'draft'}
            onChange={() => setFilters({ ...filters, status: 'draft' })}
            style={{ marginRight: '8px' }}
          />
          Draft Only
        </label>
      </div>
      
      <p style={{ marginTop: '12px', fontSize: '14px', color: '#9ca3af' }}>
        Select a filter option to see the indicator appear
      </p>
    </div>
  );
}

/**
 * Example 4: Custom Styling
 * 
 * Shows how to apply custom styling to the indicator.
 */
export function CustomStyledFilterIndicatorExample() {
  const [hasFilters, setHasFilters] = useState(true);

  return (
    <div style={{ padding: '20px' }}>
      <h3>Custom Styled Indicator</h3>
      
      <button
        style={{
          position: 'relative',
          padding: '10px 20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 600,
        }}
        onClick={() => setHasFilters(!hasFilters)}
      >
        Premium Filters
        {hasFilters && <FilterIndicator className="custom-indicator" />}
      </button>
      
      <p style={{ marginTop: '12px', fontSize: '14px', color: '#9ca3af' }}>
        Custom button styling with indicator
      </p>
    </div>
  );
}

/**
 * Example 5: Accessibility Demonstration
 * 
 * Shows how the indicator works with keyboard navigation.
 */
export function AccessibleFilterIndicatorExample() {
  const [hasFilters, setHasFilters] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <h3>Accessible Filter Indicator</h3>
      
      <button
        style={{
          position: 'relative',
          padding: '8px 16px',
          background: '#1f2937',
          color: 'white',
          border: '1px solid #374151',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
        onClick={() => setHasFilters(!hasFilters)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setHasFilters(!hasFilters);
          }
        }}
        aria-label={hasFilters ? 'Filters (active)' : 'Filters'}
      >
        Filters
        {hasFilters && <FilterIndicator />}
      </button>
      
      <div style={{ marginTop: '12px', fontSize: '14px', color: '#9ca3af' }}>
        <p>Try keyboard navigation:</p>
        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
          <li>Tab to focus the button</li>
          <li>Enter or Space to toggle filter state</li>
          <li>Screen readers will announce "Active filters applied"</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * All Examples Component
 */
export function FilterIndicatorExamples() {
  return (
    <div style={{ 
      background: '#111827', 
      minHeight: '100vh', 
      padding: '40px',
      color: 'white',
    }}>
      <h1 style={{ marginBottom: '32px' }}>FilterIndicator Component Examples</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <BasicFilterIndicatorExample />
        <MultipleFilterIndicatorsExample />
        <PPVFilterIndicatorExample />
        <CustomStyledFilterIndicatorExample />
        <AccessibleFilterIndicatorExample />
      </div>
    </div>
  );
}

export default FilterIndicatorExamples;
