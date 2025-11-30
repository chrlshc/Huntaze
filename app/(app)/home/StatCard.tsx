import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: number;
  description?: string;
  icon?: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  type?: 'number' | 'currency' | 'percentage';
  loading?: boolean;
}

export function StatCard({ 
  label, 
  value, 
  trend, 
  description, 
  icon: Icon,
  color = 'blue',
  type = 'number',
  loading = false
}: StatCardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;

  // Format value based on type
  const formattedValue = typeof value === 'number' 
    ? type === 'currency' 
      ? `$${value.toLocaleString()}`
      : type === 'percentage'
      ? `${value}%`
      : value.toLocaleString()
    : value;

  if (loading) {
    return (
      <Card className="-loading">
        <div className="-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-value"></div>
          <div className="skeleton-description"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="-header">
        <div className="-label-group">
          {Icon && (
            <div className={`stat-card-icon stat-card-icon-${color}`}>
              <Icon className="icon" aria-hidden="true" />
            </div>
          )}
          <span className="stat-label">{label}</span>
        </div>
        {trend !== undefined && trend !== 0 && (
          <span className={`stat-trend ${isPositive ? 'stat-trend-positive' : 'stat-trend-negative'}`}>
            {isPositive ? (
              <TrendingUp className="stat-trend-icon" aria-hidden="true" />
            ) : (
              <TrendingDown className="stat-trend-icon" aria-hidden="true" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stat-value">{formattedValue}</div>
      {description && <div className="stat-description">{description}</div>}
    </div>
  );
}
