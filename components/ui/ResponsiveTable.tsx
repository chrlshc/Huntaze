'use client';

import React from 'react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  className?: string;
}

export function ResponsiveTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  className = '',
}: ResponsiveTableProps<T>) {
  return (
    <table className={`responsive-table ${className}`}>
      <thead>
        <tr>
          {columns.map((column, index) => (
            <th key={`header-${index}`}>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, rowIndex) => (
          <tr key={keyExtractor(item, rowIndex)}>
            {columns.map((column, colIndex) => {
              const value = column.render
                ? column.render(item)
                : item[column.key as keyof T];
              
              return (
                <td key={`cell-${rowIndex}-${colIndex}`} data-label={column.label}>
                  {value}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
