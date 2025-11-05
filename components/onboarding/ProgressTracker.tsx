'use client';

import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  completed: boolean;
}

interface ProgressTrackerProps {
  steps: Step[];
  currentStepIndex: number;
  progressPercentage: number;
  estimatedTimeRemaining: number;
}

export default function ProgressTracker({
  steps,
  currentStepIndex,
  progressPercentage,
  estimatedTimeRemaining
}: ProgressTrackerProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">Setup Progress</span>
          <span className="text-gray-600">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Time Remaining */}
      {estimatedTimeRemaining > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>About {estimatedTimeRemaining} minutes remaining</span>
        </div>
      )}

      {/* Steps Checklist */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">Steps</h3>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                index === currentStepIndex
                  ? 'bg-blue-50 border border-blue-200'
                  : ''
              }`}
            >
              {step.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <Circle
                  className={`w-5 h-5 flex-shrink-0 ${
                    index === currentStepIndex
                      ? 'text-blue-600'
                      : 'text-gray-300'
                  }`}
                />
              )}
              <span
                className={`text-sm ${
                  step.completed
                    ? 'text-gray-500 line-through'
                    : index === currentStepIndex
                    ? 'text-blue-900 font-medium'
                    : 'text-gray-700'
                }`}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export { ProgressTracker };