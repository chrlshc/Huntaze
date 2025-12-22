import React from 'react';
import { cn } from '@/lib/utils';
import './DashboardSkeleton.css';

export interface SkeletonProps {
  /** Width of the skeleton */
  width?: string | number;
  /** Height of the skeleton */
  height?: string | number;
  /** Border radius */
  borderRadius?: string | number;
  /** Additional class names */
  className?: string;
}

/**
 * Base Skeleton Component
 * 
 * Displays an animated loading placeholder that matches the dimensions
 * of the content it's replacing.
 */
export function Skeleton({
  width,
  height,
  borderRadius,
  className,
}: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', className)}
      style={{
        width,
        height,
        borderRadius,
      }}
      data-testid="skeleton"
      aria-hidden="true"
    />
  );
}

/**
 * StatCardSkeleton Component
 * 
 * Loading skeleton for StatCard component.
 * Matches the dimensions and layout of the actual StatCard.
 */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('stat-card-skeleton', className)}
      data-testid="stat-card-skeleton"
      role="status"
      aria-label="Loading metric"
    >
      {/* Icon skeleton */}
      <Skeleton width="32px" height="32px" borderRadius="50%" />
      
      {/* Label skeleton */}
      <Skeleton width="60%" height="11px" borderRadius="4px" />
      
      {/* Value skeleton */}
      <Skeleton width="80%" height="20px" borderRadius="4px" />
      
      {/* Optional delta skeleton */}
      <Skeleton width="40%" height="12px" borderRadius="4px" />
      
      <span className="sr-only">Loading metric data</span>
    </div>
  );
}

/**
 * InfoCardSkeleton Component
 * 
 * Loading skeleton for InfoCard component.
 * Matches the dimensions and layout of the actual InfoCard.
 */
export function InfoCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('info-card-skeleton', className)}
      data-testid="info-card-skeleton"
      role="status"
      aria-label="Loading information"
    >
      {/* Icon skeleton */}
      <Skeleton width="32px" height="32px" borderRadius="50%" />
      
      <div className="info-card-skeleton__content">
        {/* Title skeleton */}
        <Skeleton width="70%" height="14px" borderRadius="4px" />
        
        {/* Description skeleton - 2 lines */}
        <Skeleton width="100%" height="13px" borderRadius="4px" />
        <Skeleton width="85%" height="13px" borderRadius="4px" />
      </div>
      
      <span className="sr-only">Loading information card</span>
    </div>
  );
}

/**
 * TableRowSkeleton Component
 * 
 * Loading skeleton for table rows.
 * Displays multiple skeleton cells in a row layout.
 */
export function TableRowSkeleton({
  columns = 5,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('table-row-skeleton', className)}
      data-testid="table-row-skeleton"
      role="status"
      aria-label="Loading table row"
    >
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton
          key={index}
          width="100%"
          height="16px"
          borderRadius="4px"
        />
      ))}
      <span className="sr-only">Loading table data</span>
    </div>
  );
}

/**
 * TableSkeleton Component
 * 
 * Loading skeleton for entire tables.
 * Displays multiple skeleton rows.
 */
export function TableSkeleton({
  rows = 10,
  columns = 5,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('table-skeleton', className)}
      data-testid="table-skeleton"
      role="status"
      aria-label="Loading table"
    >
      {/* Header row */}
      <div className="table-skeleton__header">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton
            key={index}
            width="100%"
            height="14px"
            borderRadius="4px"
          />
        ))}
      </div>
      
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <TableRowSkeleton key={index} columns={columns} />
      ))}
      
      <span className="sr-only">Loading table with {rows} rows</span>
    </div>
  );
}

/**
 * DashboardViewSkeleton Component
 * 
 * Complete loading skeleton for dashboard views.
 * Displays skeleton for metrics, search, and table.
 */
export function DashboardViewSkeleton({
  metrics = 4,
  showSearch = true,
  showTable = true,
  tableRows = 10,
  className,
}: {
  metrics?: number;
  showSearch?: boolean;
  showTable?: boolean;
  tableRows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('dashboard-view-skeleton', className)}
      data-testid="dashboard-view-skeleton"
      role="status"
      aria-label="Loading dashboard"
    >
      {/* Metrics row */}
      <div className="dashboard-view-skeleton__metrics">
        {Array.from({ length: metrics }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
      
      {/* Search bar */}
      {showSearch && (
        <div className="dashboard-view-skeleton__search">
          <Skeleton width="100%" height="40px" borderRadius="8px" />
        </div>
      )}
      
      {/* Table */}
      {showTable && (
        <div className="dashboard-view-skeleton__table">
          <TableSkeleton rows={tableRows} />
        </div>
      )}
      
      <span className="sr-only">Loading dashboard view</span>
    </div>
  );
}
