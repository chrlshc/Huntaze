'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";

type AnalyticsResult = {
  insights: string[];
  recommendations: string[];
  patterns: string[];
  predictions?: string[];
  confidence: number;
};

export function AIAnalyticsDashboard() {
  const [result, setResult] = useState<AnalyticsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('7d');

  const timeframes = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
  ];

  const handleAnalyze = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/ai/analyze-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: {
            timeframe,
            platforms: ['instagram', 'tiktok', 'onlyfans'],
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze performance');
      }

      const data = await response.json();
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze performance');
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    handleAnalyze();
  }, [handleAnalyze]);

  return (
    <div className="ai-analytics-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          <span className="dashboard-icon">📊</span>
          <h3 className="dashboard-title">AI Performance Analytics</h3>
        </div>
        
        <div className="timeframe-selector">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              disabled={loading}
              className={`timeframe-button ${timeframe === tf.value ? 'active' : ''}`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !result && (
        <div className="dashboard-loading">
          <span className="spinner" />
          <span className="loading-text">Analyzing your performance...</span>
        </div>
      )}

      {error && (
        <div className="dashboard-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button onClick={handleAnalyze} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      {result && (
        <div className="dashboard-content">
          <div className="confidence-indicator">
            <span className="confidence-label">Analysis Confidence:</span>
            <div className="confidence-bar">
              <div 
                className="confidence-fill" 
                style={{ width: `${result.confidence * 100}%` }}
              />
            </div>
            <span className="confidence-value">
              {Math.round(result.confidence * 100)}%
            </span>
          </div>

          {result.insights.length > 0 && (
            <div className="dashboard-section insights-section">
              <h4 className="section-title">
                <span className="section-icon">💡</span>
                Key Insights
              </h4>
              <ul className="insights-list">
                {result.insights.map((insight, index) => (
                  <li key={index} className="insight-item">
                    <span className="insight-bullet">•</span>
                    <span className="insight-text">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.patterns.length > 0 && (
            <div className="dashboard-section patterns-section">
              <h4 className="section-title">
                <span className="section-icon">📈</span>
                Patterns Detected
              </h4>
              <div className="patterns-grid">
                {result.patterns.map((pattern, index) => (
                  <div key={index} className="pattern-card">
                    <span className="pattern-icon">🔍</span>
                    <span className="pattern-text">{pattern}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.recommendations.length > 0 && (
            <div className="dashboard-section recommendations-section">
              <h4 className="section-title">
                <span className="section-icon">🎯</span>
                Recommendations
              </h4>
              <div className="recommendations-list">
                {result.recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-card">
                    <div className="recommendation-number">{index + 1}</div>
                    <div className="recommendation-content">
                      <p className="recommendation-text">{rec}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.predictions && result.predictions.length > 0 && (
            <div className="dashboard-section predictions-section">
              <h4 className="section-title">
                <span className="section-icon">🔮</span>
                Predictions
              </h4>
              <ul className="predictions-list">
                {result.predictions.map((prediction, index) => (
                  <li key={index} className="prediction-item">
                    <span className="prediction-icon">→</span>
                    <span className="prediction-text">{prediction}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="dashboard-actions">
            <button onClick={handleAnalyze} disabled={loading} className="refresh-button">
              {loading ? (
                <>
                  <span className="spinner" />
                  Refreshing...
                </>
              ) : (
                <>
                  <span className="refresh-icon">🔄</span>
                  Refresh Analysis
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
