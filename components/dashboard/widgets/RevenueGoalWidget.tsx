'use client';

import { useEffect, useState } from 'react';
import { Target, TrendingUp, Zap, Award } from 'lucide-react';

interface RevenueGoalProps {
  currentRevenue: number;
  monthlyGoal: number;
  userProfile: any;
}

export function RevenueGoalWidget({ currentRevenue, monthlyGoal, userProfile }: RevenueGoalProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const percentage = Math.min((currentRevenue / monthlyGoal) * 100, 100);
  const remainingDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();
  const dailyTarget = (monthlyGoal - currentRevenue) / remainingDays;

  useEffect(() => {
    const generateSuggestions = () => {
      const suggestionList = [];
      const revenueRatio = currentRevenue / monthlyGoal;

      if (revenueRatio < 0.5 && remainingDays < 15) {
        suggestionList.push('Consider launching a limited-time offer to boost revenue');
        suggestionList.push('Increase engagement with top fans through personalized messages');
      }

      if (userProfile?.settings?.workingHours) {
        suggestionList.push(`Your best performing hours are ${userProfile.settings.preferredWorkingTime || 'evenings'}. Schedule content accordingly`);
      }

      if (userProfile?.niche === 'fitness') {
        suggestionList.push('Fitness content performs 40% better on weekends');
      } else if (userProfile?.niche === 'gaming') {
        suggestionList.push('Gaming streams in evening hours generate 3x more tips');
      }

      if (revenueRatio > 0.8) {
        suggestionList.push('You're on track! Consider setting a stretch goal');
      }

      setSuggestions(suggestionList.slice(0, 2));
    };

    generateSuggestions();
  }, [currentRevenue, monthlyGoal, remainingDays, userProfile]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Monthly Revenue Goal</h3>
          <p className="text-sm text-gray-500">{remainingDays} days remaining</p>
        </div>
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
          <Target className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-3xl font-bold text-gray-900">${currentRevenue.toLocaleString()}</span>
          <span className="text-sm text-gray-500">of ${monthlyGoal.toLocaleString()}</span>
        </div>
        
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          >
            <div className="h-full bg-white/30 animate-shimmer"></div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{percentage.toFixed(1)}% completed</span>
          <span className="text-gray-900 font-medium">${dailyTarget.toFixed(0)}/day needed</span>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">AI Suggestions</p>
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <Zap className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-600">{suggestion}</span>
            </div>
          ))}
        </div>
      )}

      {percentage >= 100 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">Goal achieved! 🎉</span>
          </div>
        </div>
      )}
    </div>
  );
}