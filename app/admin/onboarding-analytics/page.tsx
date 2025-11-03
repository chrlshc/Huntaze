'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';

interface OnboardingMetrics {
  totalUsers: number;
  completedUsers: number;
  completionRate: number;
  averageCompletionTime: number;
  dropOffPoints: Array<{
    step: string;
    dropOffRate: number;
    usersReached: number;
    usersCompleted: number;
  }>;
  levelDistribution: Record<string, number>;
  featureUnlockRates: Record<string, number>;
}

interface RealTimeData {
  activeUsers: number;
  todayCompletions: number;
  currentCompletionRate: number;
  recentEvents: Array<{
    userId: string;
    eventType: string;
    eventData: any;
    timestamp: string;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function OnboardingAnalyticsPage() {
  const [metrics, setMetrics] = useState<OnboardingMetrics | null>(null);
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
    fetchRealTimeData();

    // Set up real-time updates
    const interval = setInterval(fetchRealTimeData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/onboarding/analytics?range=${dateRange}`);
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealTimeData = async () => {
    try {
      const response = await fetch('/api/admin/onboarding/realtime');
      const data = await response.json();
      setRealTimeData(data);
    } catch (error) {
      console.error('Failed to fetch real-time data:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m ${Math.floor(seconds % 60)}s`;
  };

  const formatEventType = (eventType: string) => {
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading && !metrics) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Onboarding Analytics</h1>
        
        <div className="flex space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Real-time metrics */}
      {realTimeData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Active Users</h3>
            <p className="text-3xl font-bold text-green-600">{realTimeData.activeUsers}</p>
            <p className="text-sm text-gray-500">Last hour</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Today's Completions</h3>
            <p className="text-3xl font-bold text-blue-600">{realTimeData.todayCompletions}</p>
            <p className="text-sm text-gray-500">Since midnight</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Current Completion Rate</h3>
            <p className="text-3xl font-bold text-purple-600">
              {realTimeData.currentCompletionRate.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500">Last 7 days</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Activity</h3>
            <p className="text-3xl font-bold text-orange-600">{realTimeData.recentEvents.length}</p>
            <p className="text-sm text-gray-500">Events in last 10</p>
          </div>
        </div>
      )}

      {/* Main metrics */}
      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalUsers.toLocaleString()}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Completed Users</h3>
              <p className="text-3xl font-bold text-green-600">{metrics.completedUsers.toLocaleString()}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Completion Rate</h3>
              <p className="text-3xl font-bold text-blue-600">{metrics.completionRate.toFixed(1)}%</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Avg. Completion Time</h3>
              <p className="text-3xl font-bold text-purple-600">{formatTime(metrics.averageCompletionTime)}</p>
            </div>
          </div>

          {/* Drop-off funnel */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">Onboarding Funnel</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={metrics.dropOffPoints}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="step" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'usersReached' ? `${value} users` : `${value}%`,
                    name === 'usersReached' ? 'Users Reached' : 'Drop-off Rate'
                  ]}
                />
                <Bar dataKey="usersReached" fill="#8884d8" name="usersReached" />
                <Bar dataKey="dropOffRate" fill="#ff7c7c" name="dropOffRate" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Level distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">User Level Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(metrics.levelDistribution).map(([level, count]) => ({
                      name: level,
                      value: count
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(metrics.levelDistribution).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Feature unlock rates */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Feature Unlock Rates</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={Object.entries(metrics.featureUnlockRates).map(([feature, count]) => ({
                    feature: feature.replace(/_/g, ' '),
                    unlocks: count
                  }))}
                  layout="horizontal"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="feature" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="unlocks" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent events */}
          {realTimeData && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Recent Events</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {realTimeData.recentEvents.map((event, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {event.userId.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            event.eventType === 'onboarding_completed' ? 'bg-green-100 text-green-800' :
                            event.eventType === 'onboarding_started' ? 'bg-blue-100 text-blue-800' :
                            event.eventType === 'step_completed' ? 'bg-purple-100 text-purple-800' :
                            event.eventType === 'feature_unlocked' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {formatEventType(event.eventType)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {event.eventData.stepName && `Step: ${event.eventData.stepName}`}
                          {event.eventData.featureName && `Feature: ${event.eventData.featureName}`}
                          {event.eventData.unlockLevel && `Level: ${event.eventData.unlockLevel}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}