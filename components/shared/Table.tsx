/**
 * Table Component
 * 
 * Standardized table component based on OnlyFans design system
 * with Shopify-like polish and consistent styling.
 */

import React, { ReactNode } from 'react';
import { CategoryPill } from './CategoryPill';

export interface TableColumn<T> {
  /** Column header label */
  header: string;
  /** Field key from data object or custom render function */
  accessor: keyof T | ((item: T) => ReactNode);
  /** Optional class name for the column */
  className?: string;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Optional fixed column width */
  width?: string;
}

export interface TableProps<T> {
  /** Array of data objects to display */
  data: T[];
  /** Column configuration */
  columns: TableColumn<T>[];
  /** Optional key function to generate row keys */
  keyExtractor?: (item: T) => string;
  /** Optional empty state component when data is empty */
  emptyState?: ReactNode;
  /** Optional loading state */
  isLoading?: boolean;
  /** Optional handler for row click */
  onRowClick?: (item: T) => void;
  /** Optional CSS class name */
  className?: string;
  /** Optional footer content */
  footer?: ReactNode;
  /** Show alternating zebra striping */
  zebra?: boolean;
  /** Enable border around table */
  bordered?: boolean;
}

export function Table<T extends object>({
  data,
  columns,
  keyExtractor,
  emptyState,
  isLoading,
  onRowClick,
  className = '',
  footer,
  zebra = false,
  bordered = false,
}: TableProps<T>) {
  // Generate default row keys if keyExtractor not provided
  const getRowKey = (item: T, index: number): string => {
    if (keyExtractor) {
      return keyExtractor(item);
    }
    return index.toString();
  };

  return (
    <div className={`table-container ${className}`}>
      <table className={`of-table ${zebra ? 'of-table--zebra' : ''} ${bordered ? 'of-table--bordered' : ''}`}>
        {/* Table Header */}
        <thead className="of-table__head">
          <tr>
            {columns.map((column, index) => (
              <th 
                key={index} 
                className={`of-table__header ${column.className || ''} ${column.sortable ? 'of-table__header--sortable' : ''}`}
                style={column.width ? { width: column.width } : {}}
              >
                {column.header}
                {column.sortable && (
                  <span className="of-table__sort-icon">↕</span>
                )}
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="of-table__body">
          {isLoading ? (
            <tr className="of-table__loading-row">
              <td colSpan={columns.length} className="of-table__loading-cell">
                <div className="of-table__loading-indicator">
                  <div className="spinner"></div> Loading...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr className="of-table__empty-row">
              <td colSpan={columns.length} className="of-table__empty-cell">
                {emptyState || (
                  <div className="of-table__empty-state">
                    <p>No data to display</p>
                  </div>
                )}
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => (
              <tr
                key={getRowKey(item, rowIndex)}
                className={`of-table__row ${onRowClick ? 'of-table__row--clickable' : ''}`}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {columns.map((column, colIndex) => {
                  const cellContent = typeof column.accessor === 'function'
                    ? column.accessor(item)
                    : (item[column.accessor] as ReactNode);

                  return (
                    <td key={colIndex} className={`of-table__cell ${column.className || ''}`}>
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
        
        {/* Optional Footer */}
        {footer && (
          <tfoot className="of-table__foot">
            <tr>
              <td colSpan={columns.length}>{footer}</td>
            </tr>
          </tfoot>
        )}
      </table>

      <style jsx>{`
        .table-container {
          overflow-x: auto;
          border-radius: var(--of-radius-card, 20px);
          background-color: white;
        }

        .of-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 14px;
        }
        
        .of-table--bordered {
          border: 1px solid var(--of-border-color, #E5E7EB);
          border-radius: var(--of-radius-card, 20px);
          overflow: hidden;
        }

        /* Header styles */
        .of-table__head {
          background-color: #F9FAFB;
        }
        
        .of-table__header {
          padding: 16px;
          font-weight: 500;
          color: #374151;
          text-align: left;
          border-bottom: 1px solid var(--of-border-color, #E5E7EB);
          white-space: nowrap;
        }
        
        .of-table__header--sortable {
          cursor: pointer;
        }
        
        .of-table__header--sortable:hover {
          background-color: #F3F4F6;
        }
        
        .of-table__sort-icon {
          font-size: 10px;
          margin-left: 4px;
          opacity: 0.5;
        }

        /* Row styles */
        .of-table__row:not(:last-child) .of-table__cell {
          border-bottom: 1px solid var(--of-border-color, #E5E7EB);
        }
        
        .of-table__row--clickable {
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        
        .of-table__row--clickable:hover {
          background-color: #F9FAFB;
        }

        /* Cell styles */
        .of-table__cell {
          padding: 16px;
          vertical-align: top;
        }
        
        /* Loading state */
        .of-table__loading-cell {
          padding: 48px 16px;
          text-align: center;
        }
        
        .of-table__loading-indicator {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #6B7280;
        }
        
        .spinner {
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-top-color: #2C6ECB;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Empty state */
        .of-table__empty-cell {
          padding: 48px 16px;
          text-align: center;
        }
        
        .of-table__empty-state {
          color: #6B7280;
        }

        /* Footer styles */
        .of-table__foot td {
          padding: 16px;
          border-top: 1px solid var(--of-border-color, #E5E7EB);
          background-color: #F9FAFB;
        }

        /* Zebra striping */
        .of-table--zebra .of-table__row:nth-child(even) {
          background-color: #F9FAFB;
        }
        
        /* Responsive handling - allow horizontal scroll on small screens */
        @media (max-width: 640px) {
          .table-container {
            margin: 0 -16px;
            width: calc(100% + 32px);
            border-radius: 0;
          }
          
          .of-table--bordered {
            border-left: none;
            border-right: none;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );
}
