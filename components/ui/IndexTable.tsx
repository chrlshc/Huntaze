'use client';

import React, { useState, useCallback } from 'react';
import { Skeleton } from './skeleton';

/**
 * Column definition for IndexTable
 */
export interface Column<T> {
  key: keyof T;
  header: string | React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  truncate?: boolean;
  /** Mark column as numeric for right-alignment */
  numeric?: boolean;
}

/**
 * IndexTable component props
 */
export interface IndexTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: 'compact' | 'default' | 'relaxed';
  loading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  onRowHover?: (row: T | null) => void;
  className?: string;
  /** Unique key field for row identification */
  keyField?: keyof T;
}

const ROW_HEIGHTS = {
  compact: '40px',
  default: '52px',
  relaxed: '64px',
} as const;

/**
 * IndexTable - Data table component with uniform row heights,
 * text truncation, and proper numerical column alignment.
 * 
 * Design System Compliance:
 * - Uniform row heights (compact: 40px, default: 52px, relaxed: 64px)
 * - Right-aligned numerical columns
 * - Hover state highlighting
 * - Text truncation for overflow
 */
export function IndexTable<T extends Record<string, unknown>>({
  data,
  columns,
  rowHeight = 'default',
  loading = false,
  emptyState,
  onRowClick,
  onRowHover,
  className = '',
  keyField,
}: IndexTableProps<T>) {
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);

  const handleRowMouseEnter = useCallback(
    (row: T, index: number) => {
      setHoveredRowIndex(index);
      onRowHover?.(row);
    },
    [onRowHover]
  );

  const handleRowMouseLeave = useCallback(() => {
    setHoveredRowIndex(null);
    onRowHover?.(null);
  }, [onRowHover]);

  const handleRowClick = useCallback(
    (row: T) => {
      onRowClick?.(row);
    },
    [onRowClick]
  );

  const getRowKey = (row: T, index: number): string => {
    if (keyField && row[keyField] !== undefined) {
      return String(row[keyField]);
    }
    return `row-${index}`;
  };

  const getColumnAlignment = (column: Column<T>): 'left' | 'center' | 'right' => {
    // Numeric columns are always right-aligned
    if (column.numeric) {
      return 'right';
    }
    return column.align || 'left';
  };

  // Loading state with skeleton rows
  if (loading) {
    return (
      <div className={`index-table index-table--loading ${className}`} data-testid="index-table">
        <table className="index-table__table">
          <thead className="index-table__header">
            <tr>
              {columns.map((column, colIndex) => (
                <th
                  key={`header-${String(column.key)}-${colIndex}`}
                  className="index-table__header-cell"
                  style={{ width: column.width, textAlign: getColumnAlignment(column) }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="index-table__body">
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr
                key={`skeleton-row-${rowIndex}`}
                className="index-table__row"
                style={{ height: ROW_HEIGHTS[rowHeight] }}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={`skeleton-cell-${rowIndex}-${colIndex}`}
                    className="index-table__cell"
                    style={{ textAlign: getColumnAlignment(column) }}
                  >
                    <Skeleton variant="text" width="80%" height="16px" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={`index-table index-table--empty ${className}`} data-testid="index-table">
        <table className="index-table__table">
          <thead className="index-table__header">
            <tr>
              {columns.map((column, colIndex) => (
                <th
                  key={`header-${String(column.key)}-${colIndex}`}
                  className="index-table__header-cell"
                  style={{ width: column.width, textAlign: getColumnAlignment(column) }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="index-table__empty-state" data-testid="index-table-empty">
          {emptyState || (
            <div className="index-table__empty-default">
              <p className="index-table__empty-message">No data available</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`index-table ${className}`} data-testid="index-table">
      <table className="index-table__table">
        <thead className="index-table__header">
          <tr>
            {columns.map((column, colIndex) => {
              const alignment = getColumnAlignment(column);
              return (
                <th
                  key={`header-${String(column.key)}-${colIndex}`}
                  className={`index-table__header-cell index-table__header-cell--${alignment}`}
                  style={{ width: column.width, textAlign: alignment }}
                  data-align={alignment}
                  data-numeric={column.numeric || undefined}
                >
                  {column.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="index-table__body">
          {data.map((row, rowIndex) => {
            const isHovered = hoveredRowIndex === rowIndex;
            const isClickable = !!onRowClick;

            return (
              <tr
                key={getRowKey(row, rowIndex)}
                className={`index-table__row ${isHovered ? 'index-table__row--hovered' : ''} ${isClickable ? 'index-table__row--clickable' : ''}`}
                style={{ height: ROW_HEIGHTS[rowHeight] }}
                data-row-height={ROW_HEIGHTS[rowHeight]}
                onMouseEnter={() => handleRowMouseEnter(row, rowIndex)}
                onMouseLeave={handleRowMouseLeave}
                onClick={() => handleRowClick(row)}
              >
                {columns.map((column, colIndex) => {
                  const value = row[column.key];
                  const alignment = getColumnAlignment(column);
                  const shouldTruncate = column.truncate !== false;

                  return (
                    <td
                      key={`cell-${rowIndex}-${String(column.key)}-${colIndex}`}
                      className={`index-table__cell index-table__cell--${alignment} ${shouldTruncate ? 'index-table__cell--truncate' : ''}`}
                      style={{ textAlign: alignment }}
                      data-align={alignment}
                      data-numeric={column.numeric || undefined}
                    >
                      <div className={`index-table__cell-content ${shouldTruncate ? 'index-table__cell-content--truncate' : ''}`}>
                        {column.render 
                          ? column.render(value, row)
                          : String(value ?? '')
                        }
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      <style jsx>{`
        .index-table {
          width: 100%;
          overflow-x: auto;
        }

        .index-table__table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .index-table__header {
          background-color: #f8fafc;
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .index-table__header-cell {
          padding: var(--space-3, 12px) var(--space-4, 16px);
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-align: left;
          white-space: nowrap;
          background-color: #f8fafc;
        }

        .index-table__header-cell--right {
          text-align: right;
        }

        .index-table__header-cell--center {
          text-align: center;
        }

        .index-table__body {
          background-color: var(--color-surface-card, #FFFFFF);
        }

        .index-table__row {
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
          transition: background-color 200ms cubic-bezier(0.4, 0, 0.2, 1),
            border-color 200ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .index-table__row--hovered {
          background-color: #f8fafc;
        }

        .index-table__row--clickable {
          cursor: pointer;
        }

        .index-table__cell {
          padding: var(--space-3, 12px) var(--space-4, 16px);
          font-size: var(--font-size-sm, 14px);
          color: var(--color-text-primary, #202223);
          vertical-align: middle;
        }

        .index-table__cell--right {
          text-align: right;
        }

        .index-table__cell--center {
          text-align: center;
        }

        .index-table__cell[data-numeric] {
          font-variant-numeric: tabular-nums;
        }

        .index-table__cell--truncate {
          max-width: 0;
          overflow: hidden;
        }

        .index-table__cell-content {
          display: block;
        }

        .index-table__cell-content--truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .index-table__empty-state {
          padding: var(--space-8, 32px) var(--space-4, 16px);
          text-align: center;
          background-color: var(--color-surface-card, #FFFFFF);
          border: 1px solid rgba(226, 232, 240, 0.6);
          border-top: none;
          border-radius: 0 0 var(--radius-base, 8px) var(--radius-base, 8px);
        }

        .index-table__empty-default {
          color: var(--color-text-secondary, #6D7175);
        }

        .index-table__empty-message {
          margin: 0;
          font-size: var(--font-size-sm, 14px);
        }
      `}</style>
    </div>
  );
}

export default IndexTable;
