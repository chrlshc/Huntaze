'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface ShopifyIndexTableColumn {
  /** Column header text */
  header: string;
  /** Accessor key for the data */
  accessor: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Marks the column as numeric (enables stronger numeric styling) */
  numeric?: boolean;
  /** Column width */
  width?: string;
  /** Custom render function */
  render?: (value: any, row: any) => React.ReactNode;
}

export interface ShopifyIndexTableProps {
  /** Column definitions */
  columns: ShopifyIndexTableColumn[];
  /** Table data */
  data: Array<Record<string, any>>;
  /** Row click handler */
  onRowClick?: (row: any) => void;
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row IDs */
  selectedRows?: string[];
  /** Selection change handler */
  onSelectionChange?: (selectedIds: string[]) => void;
  /** Row ID accessor (default: 'id') */
  rowIdAccessor?: string;
  /** Loading state */
  loading?: boolean;
  /** Empty state component */
  emptyState?: React.ReactNode;
  /** Render without outer bordered container (use when already inside a card) */
  embedded?: boolean;
  /** Use subtle zebra striping on rows */
  striped?: boolean;
  /** Force a minimum table width (helps prevent column "collisions" on shrink) */
  minTableWidth?: string;
  /** Additional class names */
  className?: string;
  /** Test ID */
  'data-testid'?: string;
}

/**
 * ShopifyIndexTable - A data table component following Shopify Admin design
 * 
 * Features:
 * - Sticky header on scroll
 * - Row selection with checkboxes
 * - Hover states on rows
 * - Responsive (horizontal scroll on mobile)
 * - Loading skeletons
 * - Empty state support
 */
export function ShopifyIndexTable({
  columns,
  data,
  onRowClick,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  rowIdAccessor = 'id',
  loading = false,
  emptyState,
  embedded = false,
  striped = true,
  minTableWidth,
  className,
  'data-testid': testId,
}: ShopifyIndexTableProps) {
  const hasExplicitColumnWidths = columns.some((column) => !!column.width);
  const computedMinTableWidth = (() => {
    if (!hasExplicitColumnWidths) return undefined;
    const pixelWidths = columns
      .map((column) => column.width)
      .filter((width): width is string => typeof width === 'string')
      .map((width) => {
        const match = /^(\d+(?:\.\d+)?)px$/.exec(width.trim());
        return match ? Number(match[1]) : null;
      })
      .filter((width): width is number => typeof width === 'number' && Number.isFinite(width));

    if (pixelWidths.length === 0) return undefined;
    const sum = pixelWidths.reduce((acc, width) => acc + width, 0);
    return `${sum}px`;
  })();

  const resolvedMinTableWidth = minTableWidth ?? computedMinTableWidth;

  const wrapperClassName = cn(
    embedded
      ? 'w-full'
      : 'bg-white rounded-[var(--radius-card)] border border-[var(--border-default)] overflow-hidden shadow-[var(--of-shadow-card-saas)]',
    className
  );

  // Handle select all
  const allSelected = data.length > 0 && selectedRows.length === data.length;
  const someSelected = selectedRows.length > 0 && selectedRows.length < data.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange?.([]);
    } else {
      const allIds = data.map(row => row[rowIdAccessor]);
      onSelectionChange?.(allIds);
    }
  };

  const handleRowSelect = (rowId: string) => {
    if (selectedRows.includes(rowId)) {
      onSelectionChange?.(selectedRows.filter(id => id !== rowId));
    } else {
      onSelectionChange?.([...selectedRows, rowId]);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className={wrapperClassName} data-testid={testId}>
        <div className="overflow-x-auto">
          <table
            className={cn('w-full', hasExplicitColumnWidths ? 'table-fixed' : 'table-auto')}
            style={{ minWidth: resolvedMinTableWidth }}
          >
            <thead className="bg-[#fafbfb] border-b border-[var(--border-default)]">
              <tr>
                {selectable && <th className="w-10 pl-3 pr-2 py-3" />}
                {columns.map((col, idx) => (
                  <th key={idx} className="px-6 py-3 text-left">
                    <div className="h-4 bg-[#e1e3e5] rounded w-24 animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
	              {[...Array(5)].map((_, idx) => (
	                <tr key={idx} className="border-b border-[var(--border-default)] last:border-b-0">
	                  {selectable && <td className="pl-3 pr-2 py-4"><div className="h-4 w-4 bg-[#e1e3e5] rounded animate-pulse" /></td>}
	                  {columns.map((_, colIdx) => (
	                    <td key={colIdx} className="px-6 py-4">
	                      <div className="h-4 bg-[#e1e3e5] rounded w-32 animate-pulse" />
	                    </td>
	                  ))}
	                </tr>
	              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={wrapperClassName} data-testid={testId}>
        {emptyState || (
          <div className="py-12 text-center">
            <p className="text-[14px] text-[#6b7177]">No data available</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={wrapperClassName} data-testid={testId}>
      <div className="overflow-x-auto">
        <table
          className={cn('w-full', hasExplicitColumnWidths ? 'table-fixed' : 'table-auto')}
          style={{ minWidth: resolvedMinTableWidth }}
        >
          {/* Sticky Header */}
          <thead className="bg-[#fafbfb] border-b border-[var(--border-default)] sticky top-0 z-10">
            <tr>
              {/* Select All Checkbox */}
              {selectable && (
                <th className="w-9 pl-3 pr-2 py-3">
                  <button
                    onClick={handleSelectAll}
                    className={cn(
                      'w-4 h-4 rounded-[6px] border flex items-center justify-center transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--shopify-border-focus)]',
                      allSelected
                        ? 'bg-[var(--shopify-interactive-default)] border-[var(--shopify-interactive-default)]'
                        : someSelected
                        ? 'bg-[var(--shopify-interactive-default)] border-[var(--shopify-interactive-default)]'
                        : 'border-[var(--border-default)] hover:border-[var(--border-emphasis)]'
                    )}
                    aria-label="Select all rows"
                  >
                    {(allSelected || someSelected) && (
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    )}
                  </button>
                </th>
              )}
              
              {/* Column Headers */}
              {columns.map((column, idx) => {
                const isLastColumn = idx === columns.length - 1;

                return (
                <th
                  key={idx}
                  className={cn(
                    'px-6 py-3 text-[11px] font-medium text-[#6b7177] uppercase tracking-[0.08em] whitespace-nowrap',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    !column.align && 'text-left',
                    isLastColumn && 'pr-10'
                  )}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              )})}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {data.map((row, rowIdx) => {
              const rowId = row[rowIdAccessor];
              const isSelected = selectedRows.includes(rowId);
              const isClickable = !!onRowClick;

              return (
                <tr
                  key={rowId || rowIdx}
                  className={cn(
                    'border-b border-[var(--border-default)] last:border-b-0 transition-colors hover:bg-slate-50',
                    striped && 'even:bg-slate-50/50',
                    isSelected && 'bg-[var(--shopify-bg-surface-active)]',
                    isClickable && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {/* Row Selection Checkbox */}
                  {selectable && (
                    <td className="pl-3 pr-2 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowSelect(rowId);
                        }}
                        className={cn(
                          'w-4 h-4 rounded-[6px] border flex items-center justify-center transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--shopify-border-focus)]',
                          isSelected
                            ? 'bg-[var(--shopify-interactive-default)] border-[var(--shopify-interactive-default)]'
                            : 'border-[var(--border-default)] hover:border-[var(--border-emphasis)]'
                        )}
                        aria-label={`Select row ${rowIdx + 1}`}
                      >
                        {isSelected && (
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        )}
                      </button>
                    </td>
                  )}

                  {/* Row Cells */}
                  {columns.map((column, colIdx) => {
                    const value = row[column.accessor];
                    const content = column.render ? column.render(value, row) : value;
                    const isLastColumn = colIdx === columns.length - 1;
                    const isNumericColumn = column.align === 'right';
                    const isStrongNumeric = column.numeric === true;

                    return (
                      <td
                        key={colIdx}
                        className={cn(
                          'px-6 py-4 text-[14px] text-[#202223]',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right',
                          isNumericColumn && 'tabular-nums',
                          isStrongNumeric && 'font-medium',
                          !column.align && 'text-left',
                          isLastColumn && 'pr-10'
                        )}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ShopifyIndexTable;
