import { cn } from "@/lib/utils";

export interface SkeletonProps {
  /** Shape variant */
  variant: 'text' | 'circular' | 'rectangular' | 'card';
  /** Width - can be string (e.g., "100%", "200px") or number (pixels) */
  width?: string | number;
  /** Height - can be string or number */
  height?: string | number;
  /** Animation type */
  animation?: 'pulse' | 'wave' | 'none';
  /** Additional class names */
  className?: string;
}

const variantStyles = {
  text: 'rounded-[var(--radius-sm)]',
  circular: 'rounded-full',
  rectangular: 'rounded-[var(--radius-base)]',
  card: 'rounded-[var(--radius-base)]',
};

const defaultDimensions = {
  text: { width: '100%', height: 16 },
  circular: { width: 40, height: 40 },
  rectangular: { width: '100%', height: 100 },
  card: { width: '100%', height: 120 },
};

export function Skeleton({
  variant,
  width,
  height,
  animation = 'pulse',
  className,
}: SkeletonProps) {
  const defaults = defaultDimensions[variant];
  const finalWidth = width ?? defaults.width;
  const finalHeight = height ?? defaults.height;

  return (
    <div
      className={cn(
        "bg-[var(--color-surface-subdued)]",
        variantStyles[variant],
        animation === 'pulse' && "animate-pulse",
        animation === 'wave' && "animate-shimmer",
        className
      )}
      style={{
        width: typeof finalWidth === 'number' ? `${finalWidth}px` : finalWidth,
        height: typeof finalHeight === 'number' ? `${finalHeight}px` : finalHeight,
      }}
      data-testid="skeleton"
      data-variant={variant}
      aria-hidden="true"
    />
  );
}

export interface SkeletonTableProps {
  /** Number of rows to render */
  rows: number;
  /** Number of columns to render */
  columns: number;
  /** Additional class names */
  className?: string;
}

export function SkeletonTable({ rows, columns, className }: SkeletonTableProps) {
  return (
    <div className={cn("space-y-[var(--space-2)]", className)} data-testid="skeleton-table">
      {/* Header row */}
      <div className="flex gap-[var(--space-4)] pb-[var(--space-2)] border-b border-[var(--border-subdued)]">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant="text" width={`${100 / columns}%`} height={14} />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-[var(--space-4)] py-[var(--space-2)]">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              variant="text" 
              width={`${100 / columns}%`} 
              height={16} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}
