import { cn } from "@/lib/utils";
import { Card } from "./card";
import { Skeleton } from "./Skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface StatCardProps {
  /** Label displayed above the value */
  label: string;
  /** Main value to display */
  value: string | number;
  /** Optional trend indicator */
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  /** Whether the data is empty */
  isEmpty?: boolean;
  /** Message to show when empty */
  emptyMessage?: string;
  /** Loading state */
  loading?: boolean;
  /** Additional class names */
  className?: string;
}

const trendColors = {
  up: 'text-[var(--color-status-success)]',
  down: 'text-[var(--color-status-critical)]',
  neutral: 'text-[var(--color-text-secondary)]',
};

const TrendIcon = ({ direction }: { direction: 'up' | 'down' | 'neutral' }) => {
  const iconClass = "w-4 h-4";
  switch (direction) {
    case 'up':
      return <TrendingUp className={iconClass} />;
    case 'down':
      return <TrendingDown className={iconClass} />;
    default:
      return <Minus className={iconClass} />;
  }
};

export function StatCard({
  label,
  value,
  trend,
  isEmpty = false,
  emptyMessage = "No data available",
  loading = false,
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className={className} data-testid="stat-card" data-loading="true">
        <Skeleton variant="text" width="60%" height={14} className="mb-2" />
        <Skeleton variant="text" width="80%" height={28} />
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="stat-card">
      {/* Label always comes first in DOM order */}
      <p 
        className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] font-[var(--font-weight-medium)] mb-[var(--space-1)]"
        data-testid="stat-card-label"
      >
        {label}
      </p>
      
      {isEmpty ? (
        <p 
          className="text-[var(--font-size-base)] text-[var(--color-text-subdued)] italic"
          data-testid="stat-card-empty"
        >
          {emptyMessage}
        </p>
      ) : (
        <div className="flex items-baseline gap-[var(--space-2)]">
          <span 
            className="text-[var(--font-size-xl)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]"
            data-testid="stat-card-value"
          >
            {value}
          </span>
          
          {trend && (
            <span 
              className={cn(
                "flex items-center gap-1 text-[var(--font-size-sm)]",
                trendColors[trend.direction]
              )}
              data-testid="stat-card-trend"
            >
              <TrendIcon direction={trend.direction} />
              {trend.value}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
