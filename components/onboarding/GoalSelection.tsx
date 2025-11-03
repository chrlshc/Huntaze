'use client';

import { useState } from 'react';
import { Target, TrendingUp, DollarSign, Users, Video, Calendar } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const availableGoals: Goal[] = [
  {
    id: 'content_creation',
    title: 'Content Creation',
    description: 'Create and publish engaging content',
    icon: <Video className="w-6 h-6" />
  },
  {
    id: 'audience_growth',
    title: 'Audience Growth',
    description: 'Grow and engage your audience',
    icon: <TrendingUp className="w-6 h-6" />
  },
  {
    id: 'monetization',
    title: 'Monetization',
    description: 'Earn money from your content',
    icon: <DollarSign className="w-6 h-6" />
  },
  {
    id: 'fan_management',
    title: 'Fan Management',
    description: 'Build relationships with your fans',
    icon: <Users className="w-6 h-6" />
  },
  {
    id: 'scheduling',
    title: 'Content Scheduling',
    description: 'Plan and schedule posts in advance',
    icon: <Calendar className="w-6 h-6" />
  },
  {
    id: 'analytics',
    title: 'Analytics & Insights',
    description: 'Track performance and optimize',
    icon: <Target className="w-6 h-6" />
  }
];

interface GoalSelectionProps {
  onComplete: (data: { goals: string[] }) => void;
}

export function GoalSelection({ onComplete }: GoalSelectionProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleContinue = () => {
    onComplete({ goals: selectedGoals });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What are your goals?
        </h2>
        <p className="text-gray-600">
          Select all that apply. We'll personalize your experience based on your goals.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {availableGoals.map(goal => (
          <button
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className={`p-6 rounded-lg border-2 text-left transition-all ${
              selectedGoals.includes(goal.id)
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg ${
                selectedGoals.includes(goal.id)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {goal.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {goal.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {goal.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedGoals.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>{selectedGoals.length} goal{selectedGoals.length > 1 ? 's' : ''} selected.</strong>
            {' '}We'll customize your onboarding to help you achieve these goals.
          </p>
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={selectedGoals.length === 0}
        className={`w-full py-3 rounded-lg font-semibold transition ${
          selectedGoals.length > 0
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Continue
      </button>
    </div>
  );
}
