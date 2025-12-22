/**
 * SettingsTable Component
 * Feature: onlyfans-settings-saas-transformation
 * Property 10: Table Header Stickiness
 * Property 11: Table Row Hover Feedback
 * Property 12: Status Chip Color Mapping
 * 
 * Clean, scannable table for automation rules and data display.
 * 
 * @requirements
 * - Sticky header with #F9FAFB background
 * - 48px row height
 * - Hover state (#F9FAFB background)
 * - Only horizontal dividers (no vertical borders)
 * - Status values as colored chips
 */

import React from 'react';
import './SettingsTable.css';

export interface TableColumn {
  /** Column header text */
  header: string;
  /** Accessor key for data */
  accessor: string;
  /** Optional alignment (default: 'left') */
  align?: 'left' | 'center' | 'right';
  /** Optional custom cell renderer */
  render?: (value: any, row: any) => React.ReactNode;
}

export interface SettingsTableProps {
  /** Table columns configuration */
  columns: TableColumn[];
  /** Table data rows */
  data: any[];
  /** Optional CSS class name */
  className?: string;
  /** Optional empty state message */
  emptyMessage?: string;
}

export const SettingsTable: React.FC<SettingsTableProps> = ({
  columns,
  data,
  className = '',
  emptyMessage = 'No data available',
}) => {
  return (
    <div className={`of-settings-table-wrapper ${className}`}>
      <table className="of-settings-table">
        {/* Sticky Header */}
        <thead className="of-settings-table__header">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={`of-settings-table__header-cell of-settings-table__header-cell--${column.align || 'left'}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="of-settings-table__body">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="of-settings-table__empty"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="of-settings-table__row"
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`of-settings-table__cell of-settings-table__cell--${column.align || 'left'}`}
                  >
                    {column.render
                      ? column.render(row[column.accessor], row)
                      : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

/**
 * StatusChip Component
 * Helper component for rendering status chips in tables
 */
export interface StatusChipProps {
  status: 'active' | 'inactive' | 'pending' | 'error';
  children: React.ReactNode;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, children }) => {
  const statusColors = {
    active: {
      bg: '#DEF7EC',
      text: '#03543F',
    },
    inactive: {
      bg: '#F3F4F6',
      text: '#374151',
    },
    pending: {
      bg: '#FEF3C7',
      text: '#92400E',
    },
    error: {
      bg: '#FEE2E2',
      text: '#991B1B',
    },
  };

  const colors = statusColors[status];

  return (
    <span
      className="of-status-chip"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {children}
    </span>
  );
};
