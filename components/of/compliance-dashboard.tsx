'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Clock,
  FileCheck,
  UserCheck,
  Lock,
  Activity,
  TrendingUp,
  AlertTriangle,
  Check,
  X,
  ChevronRight
} from 'lucide-react';

export default function ComplianceDashboard() {
  const [metrics, setMetrics] = useState({
    complianceScore: 94,
    totalDecisions: 12847,
    reviewedDecisions: 1205,
    approvalRate: 0.89,
    avgReviewTime: 12,
    pendingReviews: 3
  });
  
  const [pendingReviews] = useState([
    {
      id: '1',
      priority: 'high',
      description: 'Sales AI wants to set price $150 for VIP bundle',
      deadline: new Date(Date.now() + 45 * 60 * 1000),
      suggestedAction: 'Approve with 10% discount for loyal VIP'
    },
    {
      id: '2', 
      priority: 'medium',
      description: 'Messaging AI confidence 65% on response strategy',
      deadline: new Date(Date.now() + 90 * 60 * 1000),
      suggestedAction: 'Use template #3 instead'
    },
    {
      id: '3',
      priority: 'low',
      description: 'Analytics AI suggests new fan segmentation',
      deadline: new Date(Date.now() + 180 * 60 * 1000),
      suggestedAction: 'Review and approve'
    }
  ]);
  
  const platformCompliance = [
    {
      platform: 'Instagram',
      status: 'compliant',
      violations: 0,
      lastCheck: '2 min ago',
      rateLimit: { current: 18, max: 100, unit: 'messages/day' }
    },
    {
      platform: 'TikTok', 
      status: 'compliant',
      violations: 0,
      lastCheck: '5 min ago',
      rateLimit: { current: 0, max: 0, unit: 'DMs disabled' }
    },
    {
      platform: 'Reddit',
      status: 'warning',
      violations: 1,
      lastCheck: '1 hour ago',
      rateLimit: { current: 8, max: 10, unit: 'posts/day' }
    }
  ];
  
  const gdprMetrics = {
    activeConsents: 4521,
    dataRequests: 12,
    deletionRequests: 2,
    exportRequests: 3,
    retentionCompliance: 98
  };
  
  const recentDecisions = [
    {
      timestamp: '10:23 AM',
      actor: 'Messaging AI',
      action: 'Fan response generated',
      status: 'auto-approved',
      confidence: 92
    },
    {
      timestamp: '10:19 AM', 
      actor: 'Sales AI',
      action: 'PPV pricing optimized',
      status: 'human-reviewed',
      confidence: 78
    },
    {
      timestamp: '10:15 AM',
      actor: 'Compliance AI',
      action: 'Content filtered',
      status: 'auto-approved',
      confidence: 99
    }
  ];
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'violation': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return null;
    }
  };
  
  const getTimeRemaining = (deadline: Date) => {
    const diff = deadline.getTime() - Date.now();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">AI Compliance & Governance</h2>
            <p className="opacity-90">GDPR compliant • Platform policies enforced • Human oversight active</p>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div>
            <p className="text-4xl font-bold">{metrics.complianceScore}%</p>
            <p className="text-sm opacity-80">Compliance Score</p>
          </div>
          <div className="h-12 w-px bg-white/20" />
          <div>
            <p className="text-2xl font-bold">{metrics.pendingReviews}</p>
            <p className="text-sm opacity-80">Pending Reviews</p>
          </div>
          <div className="h-12 w-px bg-white/20" />
          <div>
            <p className="text-2xl font-bold">{(metrics.approvalRate * 100).toFixed(0)}%</p>
            <p className="text-sm opacity-80">Approval Rate</p>
          </div>
        </div>
      </div>
      
      {/* Pending Human Reviews */}
      {pendingReviews.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Human Review Required
          </h3>
          
          <div className="space-y-3">
            {pendingReviews.map(review => (
              <div key={review.id} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${getPriorityColor(review.priority)}`}>
                      {review.priority.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      🕑 {getTimeRemaining(review.deadline)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/20 rounded text-green-600">
                      <Check className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <p className="text-sm font-medium mb-1">{review.description}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Suggested: {review.suggestedAction}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Platform Compliance Status */}
      <div>
        <h3 className="font-semibold mb-4">Platform Compliance Status</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {platformCompliance.map(platform => (
            <div key={platform.platform} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{platform.platform}</h4>
                {getStatusIcon(platform.status)}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Violations</span>
                  <span className={platform.violations > 0 ? 'text-red-600 font-medium' : ''}>
                    {platform.violations}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Rate Limit</span>
                  <span>{platform.rateLimit.current}/{platform.rateLimit.max}</span>
                </div>
                
                <div className="text-xs text-gray-400">
                  {platform.rateLimit.unit}
                </div>
                
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500">Last check: {platform.lastCheck}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* GDPR Compliance */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            GDPR Compliance
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Active Consents</span>
              <span className="font-medium">{gdprMetrics.activeConsents.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Data Requests (30d)</span>
              <span className="font-medium">{gdprMetrics.dataRequests}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Deletion Requests</span>
              <span className="font-medium text-orange-600">{gdprMetrics.deletionRequests}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Export Requests</span>
              <span className="font-medium">{gdprMetrics.exportRequests}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Retention Compliance</span>
              <span className="font-medium text-green-600">{gdprMetrics.retentionCompliance}%</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All personal data is anonymized before AI learning
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent AI Decisions
          </h3>
          
          <div className="space-y-3">
            {recentDecisions.map((decision, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <p className="text-sm font-medium">{decision.action}</p>
                  <p className="text-xs text-gray-500">
                    {decision.actor} • {decision.timestamp}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {decision.confidence}%
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    decision.status === 'auto-approved' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20' 
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20'
                  }`}>
                    {decision.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Audit Trail */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <FileCheck className="w-5 h-5" />
          Compliance Features
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium mb-2">🔐 Data Protection</h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Personal data anonymization
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                90-day retention policy
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Right to erasure supported
              </li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium mb-2">👥 Human Oversight</h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                High-value decision review
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                AI confidence thresholds
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Complete audit trail
              </li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium mb-2">🌐 Platform Safety</h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Auto content filtering
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Rate limit enforcement
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                Policy violation detection
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}