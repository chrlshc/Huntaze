'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Clock, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { DailyAction } from '@/lib/of/daily-action-list';

export default function SimpleActionDashboard({ accountId }: { accountId: string }) {
  const [urgentActions, setUrgentActions] = useState<DailyAction[]>([]);
  const [todayActions, setTodayActions] = useState<DailyAction[]>([]);
  const [totalPotential, setTotalPotential] = useState(0);
  const [bestTimes, setBestTimes] = useState<{ hours: number[], days: string[] }>({ hours: [], days: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDailyActions();
  }, [accountId]);

  const loadDailyActions = async () => {
    try {
      const response = await fetch(`/api/of/daily-actions/${accountId}`);
      const data = await response.json();
      
      setUrgentActions(data.urgentActions);
      setTodayActions(data.todayActions);
      setTotalPotential(data.totalPotential);
      setBestTimes(data.bestTimes);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load actions:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TODAY'S MONEY - BIG AND CLEAR */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-2">Today's Potential</h1>
        <div className="text-5xl font-black">${totalPotential}</div>
        <p className="text-purple-100 mt-2">
          {urgentActions.length + todayActions.length} fans ready to spend
        </p>
      </div>

      {/* BEST TIMES - SIMPLE */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">When Your Fans Buy Most</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-2">Best Hours</p>
            <div className="flex gap-2">
              {bestTimes.hours.map(hour => (
                <span key={hour} className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-semibold">
                  {hour > 12 ? `${hour - 12}pm` : `${hour}am`}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Best Days</p>
            <div className="flex gap-2">
              {bestTimes.days.map(day => (
                <span key={day} className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-semibold">
                  {day}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* URGENT - DO NOW! */}
      {urgentActions.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-red-900 dark:text-red-100">
              MESSAGE NOW! (${urgentActions.reduce((sum, a) => sum + a.expectedValue, 0)} potential)
            </h2>
          </div>
          
          <div className="space-y-3">
            {urgentActions.map((action, index) => (
              <div key={`urgent-${action.fanId}-${index}`} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{action.fanName}</h3>
                    <p className="text-sm text-red-600 dark:text-red-400">{action.reason}</p>
                  </div>
                  <span className="text-2xl font-bold text-green-600">${action.expectedValue}</span>
                </div>
                
                <p className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded italic mb-3">
                  "{action.suggestion}"
                </p>
                
                <button className="w-full py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
                  Send Message Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TODAY'S OPPORTUNITIES */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">
          Today's List (${todayActions.reduce((sum, a) => sum + a.expectedValue, 0)} potential)
        </h2>
        
        <div className="space-y-3">
          {todayActions.slice(0, 10).map((action, index) => (
            <div key={`today-${action.fanId}-${index}`} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">{action.fanName}</h3>
                  <span className="text-sm text-gray-500">{action.reason}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Last spent: ${action.lastSpent} • {action.daysSinceLastPurchase} days ago
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="font-semibold text-lg">${action.expectedValue}</span>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>

        {todayActions.length > 10 && (
          <p className="text-center text-gray-500 mt-4">
            +{todayActions.length - 10} more opportunities
          </p>
        )}
      </div>

      {/* SIMPLE STATS */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
          <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">
            {urgentActions.filter(a => a.reason.includes('Big spender')).length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">VIPs going cold</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
          <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">
            {urgentActions.filter(a => a.reason.includes('Viewed PPV')).length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Abandoned carts</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
          <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">
            {todayActions.filter(a => a.reason.includes('New fan')).length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">New fans to convert</p>
        </div>
      </div>
    </div>
  );
}