'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChartBarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface InterventionReport {
  id: string;
  type: 'hint' | 'guidance' | 'tutorial' | 'proactive';
  name: string;
  period: {
    start: string;
    end: string;
  };
  metrics: {
    totalTriggers: number;
    successfulInterventions: number;
    successRate: number;
    averageEngagementIncrease: number;
    completionRateImprovement: number;
    timeToCompletionReduction: number;
    userSatisfactionScore: number;
    costPerIntervention: number;
    roi: number;
  };
  cohortAnalysis: CohortData[];
  trends: TrendPoint[];
}

interface CohortData {
  cohortId: string;
  cohortName: string;
  userCount: number;
  interventionRate: number;
  successRate: number;
  completionRate: number;
  engagementScore: number;
  averageSessionTime: number;
  retentionRate: number;
}

interface TrendPoint {
  date: string;
  successRate: number;
  engagementIncrease: number;
  completionImprovement: number;
  roi: number;
}

interface ROIAnalysis {
  smartOnboarding: {
    completionRate: number;
    averageTime: number;
    supportTickets: number;
    userSatisfaction: number;
    cost: number;
  };
  traditionalOnboarding: {
    completionRate: number;
    averageTime: number;
    supportTickets: number;
    userSatisfaction: number;
    cost: number;
  };
  improvement: {
    completionRateIncrease: number;
    timeReduction: number;
    supportTicketReduction: number;
    satisfactionIncrease: number;
    costSavings: number;
    roi: number;
  };
}

interface InterventionEffectivenessReportingProps {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  onExportReport?: (reportData: any) => void;
}

export const InterventionEffectivenessReporting: React.FC<InterventionEffectivenessReportingProps> = ({
  timeRange = '30d',
  onExportReport
}) => {
  const [reports, setReports] = useState<InterventionReport[]>([]);
  const [roiAnalysis, setRoiAnalysis] = useState<ROIAnalysis | null>(null);
  const [selectedReport, setSelectedReport] = useState<InterventionReport | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'cohorts' | 'roi'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  useEffect(() => {
    fetchReports();
  }, [selectedTimeRange]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const [reportsResponse, roiResponse] = await Promise.all([
        fetch(`/api/smart-onboarding/intervention/effectiveness?timeRange=${selectedTimeRange}`),
        fetch(`/api/smart-onboarding/analytics/roi-analysis?timeRange=${selectedTimeRange}`)
      ]);

      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData.reports);
        if (reportsData.reports.length > 0) {
          setSelectedReport(reportsData.reports[0]);
        }
      }

      if (roiResponse.ok) {
        const roiData = await roiResponse.json();
        setRoiAnalysis(roiData);
      }
    } catch (error) {
      console.error('Failed to fetch intervention reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = () => {
    if (onExportReport) {
      const exportData = {
        reports,
        roiAnalysis,
        timeRange: selectedTimeRange,
        generatedAt: new Date().toISOString()
      };
      onExportReport(exportData);
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getROIColor = (roi: number) => {
    if (roi >= 200) return 'text-green-600';
    if (roi >= 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Intervention Effectiveness</h2>
          <p className="text-gray-600">Analyze intervention success rates and ROI</p>
        </div>
        
        <div className="flex space-x-3">
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          {/* Export Button */}
          <button
            onClick={handleExportReport}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['overview', 'cohorts', 'roi'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'roi' ? 'ROI Analysis' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && selectedReport && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className={`text-2xl font-bold ${getSuccessRateColor(selectedReport.metrics.successRate)}`}>
                    {selectedReport.metrics.successRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <ArrowTrendingUpIcon className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Engagement Increase</p>
                  <p className="text-2xl font-bold text-gray-900">
                    +{selectedReport.metrics.averageEngagementIncrease.toFixed(1)}%
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <ClockIcon className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Time Reduction</p>
                  <p className="text-2xl font-bold text-gray-900">
                    -{selectedReport.metrics.timeToCompletionReduction.toFixed(1)}%
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">ROI</p>
                  <p className={`text-2xl font-bold ${getROIColor(selectedReport.metrics.roi)}`}>
                    {selectedReport.metrics.roi.toFixed(0)}%
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Intervention Types Comparison */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Intervention Types Performance</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedReport?.id === report.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-gray-900">{report.name}</h4>
                        <p className="text-sm text-gray-600 capitalize">{report.type} intervention</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getSuccessRateColor(report.metrics.successRate)}`}>
                          {report.metrics.successRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">
                          {report.metrics.totalTriggers} triggers
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Engagement:</span>
                        <span className="ml-1 font-medium">+{report.metrics.averageEngagementIncrease.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Completion:</span>
                        <span className="ml-1 font-medium">+{report.metrics.completionRateImprovement.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">ROI:</span>
                        <span className={`ml-1 font-medium ${getROIColor(report.metrics.roi)}`}>
                          {report.metrics.roi.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trends Chart Placeholder */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Trends visualization would be implemented here</p>
                  <p className="text-sm text-gray-400">
                    Success rate, engagement, and ROI trends over time
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cohorts Tab */}
      {activeTab === 'cohorts' && selectedReport && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Cohort Analysis</h3>
            <p className="text-gray-600">Performance breakdown by user segments</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cohort
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Intervention Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engagement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Retention
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedReport.cohortAnalysis.map((cohort) => (
                  <tr key={cohort.cohortId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{cohort.cohortName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cohort.userCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cohort.interventionRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getSuccessRateColor(cohort.successRate)}`}>
                        {cohort.successRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cohort.completionRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cohort.engagementScore.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cohort.retentionRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ROI Tab */}
      {activeTab === 'roi' && roiAnalysis && (
        <div className="space-y-6">
          {/* ROI Summary */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg shadow-lg text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">Smart Onboarding ROI</h3>
                <p className="text-green-100">vs Traditional Onboarding</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">
                  {roiAnalysis.improvement.roi.toFixed(0)}%
                </div>
                <div className="text-green-100">Return on Investment</div>
              </div>
            </div>
          </div>

          {/* Comparison Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Smart Onboarding */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 bg-blue-50">
                <h3 className="text-lg font-semibold text-blue-900">Smart Onboarding</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-medium">{roiAnalysis.smartOnboarding.completionRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Time</span>
                  <span className="font-medium">{Math.round(roiAnalysis.smartOnboarding.averageTime / 60)}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Support Tickets</span>
                  <span className="font-medium">{roiAnalysis.smartOnboarding.supportTickets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">User Satisfaction</span>
                  <span className="font-medium">{roiAnalysis.smartOnboarding.userSatisfaction.toFixed(1)}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Cost</span>
                  <span className="font-medium">${roiAnalysis.smartOnboarding.cost.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Traditional Onboarding */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Traditional Onboarding</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-medium">{roiAnalysis.traditionalOnboarding.completionRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Time</span>
                  <span className="font-medium">{Math.round(roiAnalysis.traditionalOnboarding.averageTime / 60)}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Support Tickets</span>
                  <span className="font-medium">{roiAnalysis.traditionalOnboarding.supportTickets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">User Satisfaction</span>
                  <span className="font-medium">{roiAnalysis.traditionalOnboarding.userSatisfaction.toFixed(1)}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Cost</span>
                  <span className="font-medium">${roiAnalysis.traditionalOnboarding.cost.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Improvements */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Improvements & Savings</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    +{roiAnalysis.improvement.completionRateIncrease.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Completion Rate Increase</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    -{roiAnalysis.improvement.timeReduction.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Time Reduction</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    -{roiAnalysis.improvement.supportTicketReduction.toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600">Support Ticket Reduction</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    +{roiAnalysis.improvement.satisfactionIncrease.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Satisfaction Increase</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    ${roiAnalysis.improvement.costSavings.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Monthly Cost Savings</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {roiAnalysis.improvement.roi.toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600">Return on Investment</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterventionEffectivenessReporting;
