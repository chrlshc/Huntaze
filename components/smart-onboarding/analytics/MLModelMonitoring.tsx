'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';
import {
  CpuChipIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface MLModel {
  id: string;
  name: string;
  type: 'personalization' | 'success_prediction' | 'engagement_scoring' | 'content_recommendation';
  version: string;
  status: 'active' | 'training' | 'deploying' | 'error' | 'deprecated';
  accuracy: number;
  lastTrained: string;
  lastDeployed: string;
  predictions: number;
  driftScore: number;
  performanceMetrics: {
    precision: number;
    recall: number;
    f1Score: number;
    auc: number;
  };
  trainingMetrics: {
    loss: number;
    valLoss: number;
    epochs: number;
    trainingTime: number;
  };
  alerts: ModelAlert[];
}

interface ModelAlert {
  id: string;
  type: 'drift' | 'performance' | 'error' | 'retraining';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
}

interface ABTest {
  id: string;
  name: string;
  modelA: string;
  modelB: string;
  status: 'running' | 'completed' | 'paused';
  startDate: string;
  endDate?: string;
  trafficSplit: number;
  metrics: {
    modelA: { accuracy: number; engagement: number; conversions: number };
    modelB: { accuracy: number; engagement: number; conversions: number };
  };
  significance: number;
  winner?: 'A' | 'B' | 'inconclusive';
}

interface MLModelMonitoringProps {
  refreshInterval?: number;
  onModelAlert?: (model: MLModel, alert: ModelAlert) => void;
}

export const MLModelMonitoring: React.FC<MLModelMonitoringProps> = ({
  refreshInterval = 60000,
  onModelAlert
}) => {
  const [models, setModels] = useState<MLModel[]>([]);
  const [abTests, setAbTests] = useState<ABTest[]>([]);
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'abtests'>('overview');

  const fetchModelData = useCallback(async () => {
    try {
      const [modelsResponse, abTestsResponse] = await Promise.all([
        fetch('/api/smart-onboarding/ml/model-metrics'),
        fetch('/api/smart-onboarding/optimization/ab-test')
      ]);

      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        setModels(modelsData.models);
        
        // Check for new alerts
        if (onModelAlert) {
          modelsData.models.forEach((model: MLModel) => {
            model.alerts.forEach((alert: ModelAlert) => {
              if (alert.severity === 'high') {
                onModelAlert(model, alert);
              }
            });
          });
        }
      }

      if (abTestsResponse.ok) {
        const abTestsData = await abTestsResponse.json();
        setAbTests(abTestsData.tests);
      }
    } catch (error) {
      console.error('Failed to fetch ML model data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onModelAlert]);

  useEffect(() => {
    fetchModelData();
    const interval = setInterval(fetchModelData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchModelData, refreshInterval]);

  const handleRetrain = async (modelId: string) => {
    try {
      const response = await fetch(`/api/smart-onboarding/ml/models/${modelId}/retrain`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Update model status to training
        setModels(prev => prev.map(model => 
          model.id === modelId ? { ...model, status: 'training' } : model
        ));
      }
    } catch (error) {
      console.error('Failed to retrain model:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'training':
        return 'text-blue-600 bg-blue-100';
      case 'deploying':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'deprecated':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'training':
        return <ArrowPathIcon className="w-4 h-4 animate-spin" />;
      case 'deploying':
        return <ClockIcon className="w-4 h-4" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      default:
        return <CpuChipIcon className="w-4 h-4" />;
    }
  };

  const getDriftStatus = (driftScore: number) => {
    if (driftScore < 0.1) return { status: 'good', color: 'text-green-600' };
    if (driftScore < 0.3) return { status: 'warning', color: 'text-yellow-600' };
    return { status: 'critical', color: 'text-red-600' };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">ML Model Monitoring</h2>
        <div className="flex space-x-2">
          {(['overview', 'performance', 'abtests'] as const).map((tab) => (
            <Button
              key={tab}
              variant="primary"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab === 'abtests' ? 'A/B Tests' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => {
            const driftStatus = getDriftStatus(model.driftScore);
            
            return (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedModel(model)}
              >
                <div className="p-6">
                  {/* Model Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <CpuChipIcon className="w-6 h-6 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">{model.name}</h3>
                    </div>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(model.status)}`}>
                      {getStatusIcon(model.status)}
                      <span>{model.status}</span>
                    </div>
                  </div>

                  {/* Model Metrics */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Accuracy</span>
                      <span className="text-sm font-medium">{(model.accuracy * 100).toFixed(1)}%</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Predictions</span>
                      <span className="text-sm font-medium">{model.predictions.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Drift Score</span>
                      <span className={`text-sm font-medium ${driftStatus.color}`}>
                        {model.driftScore.toFixed(3)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Trained</span>
                      <span className="text-sm text-gray-500">
                        {new Date(model.lastTrained).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Alerts */}
                  {model.alerts.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-2 text-sm">
                        <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
                        <span className="text-gray-600">
                          {model.alerts.length} alert{model.alerts.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex space-x-2">
                    <Button
                      variant="primary"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        handleRetrain(model.id);
                      }}
                      disabled={model.status === 'training'}
                      className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {model.status === 'training' ? 'Training...' : 'Retrain'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && selectedModel && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {selectedModel.name} - Performance Metrics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Model Performance</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Precision</span>
                  <span className="font-medium">{(selectedModel.performanceMetrics.precision * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recall</span>
                  <span className="font-medium">{(selectedModel.performanceMetrics.recall * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">F1 Score</span>
                  <span className="font-medium">{selectedModel.performanceMetrics.f1Score.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">AUC</span>
                  <span className="font-medium">{selectedModel.performanceMetrics.auc.toFixed(3)}</span>
                </div>
              </div>
            </div>

            {/* Training Metrics */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Training Metrics</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Training Loss</span>
                  <span className="font-medium">{selectedModel.trainingMetrics.loss.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Validation Loss</span>
                  <span className="font-medium">{selectedModel.trainingMetrics.valLoss.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Epochs</span>
                  <span className="font-medium">{selectedModel.trainingMetrics.epochs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Training Time</span>
                  <span className="font-medium">{Math.round(selectedModel.trainingMetrics.trainingTime / 60)}m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Model Alerts */}
          {selectedModel.alerts.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-4">Active Alerts</h4>
              <div className="space-y-3">
                {selectedModel.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${
                      alert.severity === 'high' 
                        ? 'bg-red-50 border-red-200' 
                        : alert.severity === 'medium'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{alert.message}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        alert.severity === 'high' 
                          ? 'bg-red-100 text-red-800' 
                          : alert.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* A/B Tests Tab */}
      {activeTab === 'abtests' && (
        <div className="space-y-6">
          {abTests.map((test) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
                  <p className="text-sm text-gray-600">
                    {test.modelA} vs {test.modelB} • {test.trafficSplit}% split
                  </p>
                </div>
                <div className={`px-3 py-1 rounded text-sm font-medium ${
                  test.status === 'running' 
                    ? 'bg-green-100 text-green-800'
                    : test.status === 'completed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {test.status}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Model A</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Accuracy</span>
                      <span>{(test.metrics.modelA.accuracy * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Engagement</span>
                      <span>{(test.metrics.modelA.engagement * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Conversions</span>
                      <span>{test.metrics.modelA.conversions}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Model B</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Accuracy</span>
                      <span>{(test.metrics.modelB.accuracy * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Engagement</span>
                      <span>{(test.metrics.modelB.engagement * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Conversions</span>
                      <span>{test.metrics.modelB.conversions}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Results</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Significance</span>
                      <span>{(test.significance * 100).toFixed(1)}%</span>
                    </div>
                    {test.winner && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Winner</span>
                        <span className="font-medium text-green-600">Model {test.winner}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration</span>
                      <span>
                        {Math.ceil((new Date(test.endDate || Date.now()).getTime() - new Date(test.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Model Selection Modal */}
      <AnimatePresence>
        {selectedModel && activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedModel(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedModel.name} Details
                  </h3>
                  <Button
                    variant="primary"
                    onClick={() => setSelectedModel(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Model Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-2 font-medium">{selectedModel.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Version:</span>
                        <span className="ml-2 font-medium">{selectedModel.version}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Deployed:</span>
                        <span className="ml-2">{new Date(selectedModel.lastDeployed).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Predictions:</span>
                        <span className="ml-2">{selectedModel.predictions.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MLModelMonitoring;
