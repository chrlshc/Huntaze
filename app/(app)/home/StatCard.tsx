import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  trend: number;
  description: string;
}

export function StatCard({ label, value, trend, description }: StatCardProps) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-label">{label}</span>
        {trend !== 0 && (
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
      <div className="stat-value">{value}</div>
      <div className="stat-description">{description}</div>
    </div>
  );
}
