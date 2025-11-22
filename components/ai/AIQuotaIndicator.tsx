'use client';

import { useEffect, useState } from 'react';

type QuotaData = {
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  plan: 'starter' | 'pro' | 'business';
};

export function AIQuotaIndicator() {
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuota();
  }, []);

  const fetchQuota = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/quota');
      
      if (!response.ok) {
        throw new Error('Failed to fetch quota');
      }
      
      const data = await response.json();
      setQuota(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quota');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ai-quota-indicator loading">
        <div className="quota-skeleton" />
      </div>
    );
  }

  if (error || !quota) {
    return (
      <div className="ai-quota-indicator error">
        <span className="error-icon">⚠️</span>
        <span className="error-text">Unable to load AI quota</span>
      </div>
    );
  }

  const getStatusColor = () => {
    if (quota.percentUsed >= 95) return 'critical';
    if (quota.percentUsed >= 80) return 'warning';
    return 'normal';
  };

  const getPlanLabel = () => {
    return quota.plan.charAt(0).toUpperCase() + quota.plan.slice(1);
  };

  return (
    <div className={`ai-quota-indicator ${getStatusColor()}`}>
      <div className="quota-header">
        <span className="quota-title">AI Usage</span>
        <span className="quota-plan">{getPlanLabel()} Plan</span>
      </div>
      
      <div className="quota-bar-container">
        <div 
          className="quota-bar-fill" 
          style={{ width: `${Math.min(quota.percentUsed, 100)}%` }}
        />
      </div>
      
      <div className="quota-details">
        <span className="quota-spent">${quota.spent.toFixed(2)}</span>
        <span className="quota-separator">/</span>
        <span className="quota-limit">
          {quota.plan === 'business' ? 'Unlimited' : `$${quota.limit.toFixed(2)}`}
        </span>
      </div>
      
      {quota.percentUsed >= 80 && quota.plan !== 'business' && (
        <div className="quota-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">
            {quota.percentUsed >= 95 
              ? 'Quota almost exhausted. Consider upgrading.' 
              : 'Approaching quota limit.'}
          </span>
        </div>
      )}
    </div>
  );
}
