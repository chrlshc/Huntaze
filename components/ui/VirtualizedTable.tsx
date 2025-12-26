import React, { useMemo, useCallback } from 'react';
import { List } from 'react-window';
import type { RowComponentProps } from 'react-window';
import { Column } from '@/components/ui/IndexTable';

/**
 * VirtualizedTable Component
 * 
 * High-performance table component using react-window for virtual scrolling.
 * Only renders visible rows, dramatically improving performance for large datasets.
 * 
 * Performance Benefits:
 * - Renders only visible rows (typically 10-20 instead of 1000+)
 * - Constant memory usage regardless of dataset size
 * - Smooth scrolling even with 10,000+ rows
 * 
 * Requirements: 2.7, 6.4 - Table performance and responsive behavior
 */

interface VirtualizedTableProps<T> {
  /** Array of data items to display */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Key field for unique row identification */
  keyField: keyof T;
  /** Row height in pixels (default: 60) */
  rowHeight?: number;
  /** Table height in pixels (default: 600) */
  height?: number;
  /** Loading state */
  loading?: boolean;
  /** Additional class names */
  className?: string;
  /** Empty state component */
  emptyState?: React.ReactNode;
}

/**
 * Row component for virtualized list
 */
interface RowData<T> {
  items: T[];
  columns: Column<T>[];
  keyField: keyof T;
}

function Row<T>({ index, style, ariaAttributes, items, columns, keyField }: RowComponentProps<RowData<T>>) {
  const item = items[index];
  const rowKey = String(item[keyField]);
  
  return (
    <div
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-default, #E3E3E3)',
        backgroundColor: 'var(--bg-surface, #FFFFFF)',
        transition: 'background-color 150ms ease',
      }}
      className="virtualized-table-row"
      data-testid={`table-row-${rowKey}`}
      {...ariaAttributes}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--dashboard-card-hover-bg, #F3F4FF)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-surface, #FFFFFF)';
      }}
    >
      {columns.map((column, colIndex) => {
        const columnKey = String(column.key);
        const value = item[column.key];
        const content = column.render 
          ? column.render(value, item, index)
          : String(value ?? '');
        
        return (
          <div
            key={`${rowKey}-${columnKey}`}
            style={{
              width: column.width || 'auto',
              flex: column.width ? 'none' : 1,
              padding: 'var(--space-3, 12px)',
              textAlign: column.numeric ? 'right' : 'left',
              overflow: column.truncate ? 'hidden' : 'visible',
              textOverflow: column.truncate ? 'ellipsis' : 'clip',
              whiteSpace: column.truncate ? 'nowrap' : 'normal',
            }}
            data-testid={`table-cell-${columnKey}`}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

export function VirtualizedTable<T>({
  data,
  columns,
  keyField,
  rowHeight = 60,
  height = 600,
  loading = false,
  className = '',
  emptyState,
}: VirtualizedTableProps<T>) {
  const headerHeight = 45;
  const listHeight = Math.max(height - headerHeight, rowHeight);

  // Memoize item data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    items: data,
    columns,
    keyField,
  }), [data, columns, keyField]);
  
  // Memoize row renderer
  const RowRenderer = useCallback(
    (props: RowComponentProps<RowData<T>>) => <Row<T> {...props} />,
    []
  );
  
  if (loading) {
    return (
      <div 
        className={`virtualized-table-loading ${className}`}
        style={{ 
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-surface, #FFFFFF)',
          border: '1px solid var(--border-default, #E3E3E3)',
          borderRadius: 'var(--radius-lg, 12px)',
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5B6BFF] mx-auto mb-2"></div>
          <p className="text-sm text-[var(--color-text-secondary, #6B7280)]">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div 
        className={`virtualized-table-empty ${className}`}
        style={{ 
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-surface, #FFFFFF)',
          border: '1px solid var(--border-default, #E3E3E3)',
          borderRadius: 'var(--radius-lg, 12px)',
        }}
      >
        {emptyState || (
          <p className="text-sm text-[var(--color-text-secondary, #6B7280)]">
            No data available
          </p>
        )}
      </div>
    );
  }
  
  return (
    <div 
      className={`virtualized-table ${className}`}
      style={{
        border: '1px solid var(--border-default, #E3E3E3)',
        borderRadius: 'var(--radius-lg, 12px)',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-surface, #FFFFFF)',
      }}
    >
      {/* Table Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '2px solid var(--border-default, #E3E3E3)',
          backgroundColor: 'var(--bg-subtle, #F9FAFB)',
          fontWeight: 600,
          fontSize: '13px',
          color: 'var(--color-text-main, #111111)',
        }}
      >
        {columns.map((column) => (
          <div
            key={String(column.key)}
            style={{
              width: column.width || 'auto',
              flex: column.width ? 'none' : 1,
              padding: 'var(--space-3, 12px)',
              textAlign: column.numeric ? 'right' : 'left',
            }}
          >
            {column.header}
          </div>
        ))}
      </div>
      
      {/* Virtualized List */}
      <List
        defaultHeight={listHeight}
        rowCount={data.length}
        rowHeight={rowHeight}
        rowProps={itemData}
        rowComponent={RowRenderer}
        style={{ height: listHeight, width: '100%' }}
      />
    </div>
  );
}
