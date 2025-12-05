'use client';

/**
 * Analytics Churn Page
 * 
 * Displays at-risk fans with AI recommendations and churn prediction scores.
 * Uses PageLayout for consistent structure.
 * 
 * Feature: dashboard-ux-overhaul
 * Requirements: 4.4
 */

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useChurnRisks } from '@/hooks/revenue/useChurnRisks';
import { ChurnRiskList } from '@/components/revenue/churn/ChurnRiskList';
import { LoadingState } from '@/components/revenue/shared/LoadingState';
import { ErrorBoundary } from '@/components/revenue/shared/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Users, 
  TrendingDown, 
  Shield,
  Sparkles,
  RefreshCw
} from 'lucide-react';

// Risk level type
type RiskLevel = 'all' | 'high' | 'medium' | 'low';

const RISK_LEVELS: { value: RiskLevel; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: 'gray' },
  { value: 'high', label: 'High Risk', color: 'red' },
  { value: 'medium', label: 'Medium Risk', color: 'yellow' },
  { value: 'low', label: 'Low Risk', color: 'green' },
];

export default function ChurnPage() {
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<RiskLevel>('all');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [selectedFans, setSelectedFans] = useState<string[]>([]);

  const creatorId = 'creator_123';

  const {
    churnRisks,
    isLoading,
    error,
    reEngageFan,
    bulkReEngage,
    isReEngaging,
  } = useChurnRisks({
    creatorId,
    riskLevel: selectedRiskLevel === 'all' ? undefined : selectedRiskLevel,
  });

  const handleReEngage = async (fanId: string) => {
    try {
      await reEngageFan({ creatorId, fanId });
      setToastMessage('Re-engagement message sent successfully!');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Failed to send re-engagement message.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleBulkReEngage = async () => {
    if (selectedFans.length === 0) return;
    try {
      await bulkReEngage(selectedFans);
      setToastMessage(`Re-engagement messages sent to ${selectedFans.length} fans!`);
      setToastType('success');
      setShowToast(true);
      setSelectedFans([]);
    } catch (err) {
      setToastMessage('Failed to send bulk re-engagement messages.');
      setToastType('error');
      setShowToast(true);
    }
  };

  // Risk level filter actions
  const RiskLevelFilter = (
    <div className="flex items-center gap-2" data-testid="risk-level-filter">
      {RISK_LEVELS.map((level) => (
        <Button
          key={level.value}
          variant={selectedRiskLevel === level.value ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setSelectedRiskLevel(level.value)}
          data-testid={`risk-level-${level.value}`}
          data-active={selectedRiskLevel === level.value}
        >
          {level.label}
        </Button>
      ))}
      {selectedFans.length > 0 && (
        <Button 
          variant="primary" 
          size="sm"
          onClick={handleBulkReEngage} 
          disabled={isReEngaging}
          className="ml-4"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isReEngaging ? 'animate-spin' : ''}`} />
          {isReEngaging ? 'Sending...' : `Re-engage ${selectedFans.length} Selected`}
        </Button>
      )}
    </div>
  );


  if (isLoading) {
    return (
      <PageLayout
        title="Churn Risk Management"
        subtitle="Loading churn data..."
        breadcrumbs={[
          { label: 'Analytics', href: '/analytics' },
          { label: 'Churn' }
        ]}
      >
        <div className="py-12">
          <LoadingState variant="card" count={3} />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout
        title="Churn Risk Management"
        subtitle="Identify and re-engage fans at risk of churning"
        breadcrumbs={[
          { label: 'Analytics', href: '/analytics' },
          { label: 'Churn' }
        ]}
      >
        <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error Loading Churn Data</h3>
          <p className="text-red-600 dark:text-red-300 text-sm">
            {error.message || 'Failed to load churn risk data.'}
          </p>
        </Card>
      </PageLayout>
    );
  }

  const summary = churnRisks?.summary;
  const fans = churnRisks?.fans || [];

  return (
    <ErrorBoundary>
      <PageLayout
        title="Churn Risk Management"
        subtitle="Identify and re-engage fans at risk of churning"
        breadcrumbs={[
          { label: 'Analytics', href: '/analytics' },
          { label: 'Churn' }
        ]}
        actions={RiskLevelFilter}
      >
        {/* Summary Cards */}
        {summary && (
          <section className="mb-8" data-testid="churn-summary">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Total At Risk */}
              <Card className="p-6" data-testid="churn-total-at-risk">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--color-text-sub)]">Total At Risk</span>
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[var(--color-text-main)]" data-testid="churn-total-value">
                  {summary.totalAtRisk}
                </div>
              </Card>

              {/* High Risk */}
              <Card className="p-6" data-testid="churn-high-risk">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--color-text-sub)]">High Risk</span>
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div 
                  className="text-2xl font-bold text-red-600 dark:text-red-400" 
                  data-testid="churn-high-value"
                  data-risk-level="high"
                >
                  {summary.highRisk}
                </div>
              </Card>

              {/* Medium Risk */}
              <Card className="p-6" data-testid="churn-medium-risk">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--color-text-sub)]">Medium Risk</span>
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <TrendingDown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <div 
                  className="text-2xl font-bold text-yellow-600 dark:text-yellow-400" 
                  data-testid="churn-medium-value"
                  data-risk-level="medium"
                >
                  {summary.mediumRisk}
                </div>
              </Card>

              {/* Low Risk */}
              <Card className="p-6" data-testid="churn-low-risk">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--color-text-sub)]">Low Risk</span>
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div 
                  className="text-2xl font-bold text-green-600 dark:text-green-400" 
                  data-testid="churn-low-value"
                  data-risk-level="low"
                >
                  {summary.lowRisk}
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* AI Recommendations Banner */}
        <section className="mb-6">
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-main)] mb-1">AI Retention Recommendations</h3>
                <p className="text-sm text-[var(--color-text-sub)]">
                  Our AI analyzes fan behavior patterns to identify those at risk of churning. 
                  Click on any fan to see personalized re-engagement suggestions.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Fan List */}
        <section data-testid="churn-fan-list">
          <ChurnRiskList
            fans={fans}
            onReEngage={handleReEngage}
            onViewDetails={(fanId: string) => console.log('View details:', fanId)}
          />
        </section>

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className={`rounded-lg p-4 shadow-lg ${
              toastType === 'success' ? 'bg-green-600' : 'bg-red-600'
            } text-white`}>
              <div className="flex items-center gap-3">
                <span>{toastMessage}</span>
                <button 
                  onClick={() => setShowToast(false)}
                  className="text-white hover:text-gray-200 font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}
      </PageLayout>
    </ErrorBoundary>
  );
}
