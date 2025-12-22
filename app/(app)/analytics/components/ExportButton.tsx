'use client';

import { useState, useMemo } from 'react';

interface ExportButtonProps {
  data: Record<string, any>[];
  filename: string;
  period?: string;
  columnLabels?: Record<string, string>;
}

export function ExportButton({ data, filename, period, columnLabels }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!data || data.length === 0) return;

    setIsExporting(true);

    try {
      // Get columns from first row
      const columns = Object.keys(data[0]);
      
      // Create CSV header
      const header = columns
        .map((col) => columnLabels?.[col] || col)
        .join(',');

      // Create CSV rows
      const rows = data.map((row) =>
        columns
          .map((col) => {
            const value = row[col];
            // Escape quotes and wrap in quotes if contains comma
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
          })
          .join(',')
      );

      // Combine header and rows
      const csv = [header, ...rows].join('\n');

      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const dateStr = new Date().toISOString().split('T')[0];
      const fullFilename = period
        ? `${filename}-${period}-${dateStr}.csv`
        : `${filename}-${dateStr}.csv`;

      link.setAttribute('href', url);
      link.setAttribute('download', fullFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || !data || data.length === 0}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isExporting ? (
        <LoadingSpinner className="w-4 h-4" />
      ) : (
        <DownloadIcon className="w-4 h-4" />
      )}
      Export CSV
    </button>
  );
}

/**
 * Hook to format the export period string
 */
export function useExportPeriod(from?: Date, to?: Date): string | undefined {
  return useMemo(() => {
    if (!from || !to) return undefined;
    const formatDate = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).replace(' ', '');
    return `${formatDate(from)}-${formatDate(to)}`;
  }, [from, to]);
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
