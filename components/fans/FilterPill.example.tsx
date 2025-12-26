/**
 * FilterPill Component Examples
 * 
 * Demonstrates usage of the FilterPill component for displaying
 * active filter indicators on the Fans page.
 */

import React, { useState } from 'react';
import { FilterPill } from './FilterPill';
import { SegmentCard } from './SegmentCard';

/**
 * Basic FilterPill Example
 */
export function BasicFilterPillExample() {
  const [activeFilter, setActiveFilter] = useState<string | null>('VIP');

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3>Active Filter Indicator</h3>
      
      {activeFilter && (
        <FilterPill
          label={activeFilter}
          onRemove={() => setActiveFilter(null)}
        />
      )}
      
      {!activeFilter && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          No active filter. Click a segment card to apply a filter.
        </p>
      )}
    </div>
  );
}

/**
 * FilterPill with Segment Cards Example
 * 
 * Shows how FilterPill works together with SegmentCard components
 * to provide visual feedback for active filters.
 */
export function FilterPillWithSegmentCardsExample() {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  const segments = [
    { label: 'ALL FANS', count: 5 },
    { label: 'VIP', count: 2, percentage: 40 },
    { label: 'ACTIVE', count: 3, percentage: 60 },
    { label: 'AT-RISK', count: 1, percentage: 20 },
    { label: 'CHURNED', count: 0, percentage: 0 },
  ];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ marginBottom: '16px' }}>Fan Segments</h3>
        
        {/* Active Filter Indicator */}
        {activeSegment && activeSegment !== 'ALL FANS' && (
          <div style={{ marginBottom: '16px' }}>
            <FilterPill
              label={activeSegment}
              onRemove={() => setActiveSegment(null)}
            />
          </div>
        )}
        
        {/* Segment Cards Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px'
        }}>
          {segments.map((segment) => (
            <SegmentCard
              key={segment.label}
              label={segment.label}
              count={segment.count}
              percentage={segment.percentage}
              isActive={activeSegment === segment.label}
              onClick={() => setActiveSegment(segment.label)}
            />
          ))}
        </div>
      </div>
      
      <div style={{ 
        padding: '16px', 
        background: 'var(--bg-card-elevated)', 
        borderRadius: '8px',
        fontSize: '14px',
        color: 'var(--text-secondary)'
      }}>
        <strong>Active Segment:</strong> {activeSegment || 'None'}
      </div>
    </div>
  );
}

/**
 * Multiple Filter Pills Example
 * 
 * Demonstrates how multiple filter pills could be displayed
 * (though the current design only supports one active segment at a time).
 */
export function MultipleFilterPillsExample() {
  const [filters, setFilters] = useState<string[]>(['VIP', 'AT-RISK']);

  const removeFilter = (filterToRemove: string) => {
    setFilters(filters.filter(f => f !== filterToRemove));
  };

  return (
    <div style={{ padding: '24px' }}>
      <h3 style={{ marginBottom: '16px' }}>Active Filters</h3>
      
      {filters.length > 0 ? (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {filters.map((filter) => (
            <FilterPill
              key={filter}
              label={filter}
              onRemove={() => removeFilter(filter)}
            />
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          No active filters
        </p>
      )}
    </div>
  );
}

/**
 * FilterPill States Example
 * 
 * Shows different states and variations of the FilterPill component.
 */
export function FilterPillStatesExample() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Default State
        </h4>
        <FilterPill label="VIP" onRemove={() => console.log('Remove VIP')} />
      </div>
      
      <div>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Different Segment Labels
        </h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <FilterPill label="VIP" onRemove={() => {}} />
          <FilterPill label="ACTIVE" onRemove={() => {}} />
          <FilterPill label="AT-RISK" onRemove={() => {}} />
          <FilterPill label="CHURNED" onRemove={() => {}} />
        </div>
      </div>
      
      <div>
        <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          With Special Characters
        </h4>
        <FilterPill label="AT-RISK" onRemove={() => {}} />
      </div>
      
      <div style={{ 
        padding: '16px', 
        background: 'var(--bg-card-elevated)', 
        borderRadius: '8px',
        fontSize: '13px',
        color: 'var(--text-secondary)'
      }}>
        <strong>Interaction Notes:</strong>
        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
          <li>Hover over the pill to see subtle background change</li>
          <li>Hover over the X button to see it highlight</li>
          <li>Tab to the X button to see keyboard focus indicator</li>
          <li>Click the X button to remove the filter</li>
        </ul>
      </div>
    </div>
  );
}

const filterPillExamples = {
  BasicFilterPillExample,
  FilterPillWithSegmentCardsExample,
  MultipleFilterPillsExample,
  FilterPillStatesExample,
};

export default filterPillExamples;
