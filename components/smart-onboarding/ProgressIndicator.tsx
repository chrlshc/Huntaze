'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ProgressIndicatorProps {
  currentStep: string;
  predictions?: any;
  behaviorData?: any;
  onInteraction: (type: string, data?: any) => void;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  predictions,
  behaviorData,
  onInteraction
}) => {
  const getProgressColor = () => {
    if (predictions?.successProbability > 0.7) return 'green';
    if (predictions?.successProbability < 0.4) return 'red';
    return 'blue';
  };

  const getProgressMessage = () => {
    if (predictions?.successProbability > 0.8) {
      return 'You\'re doing great! Keep it up!';
    }
    if (predictions?.successProbability < 0.4) {
      return 'Need some help? I\'m here to assist you.';
    }
    return 'You\'re making good progress!';
  };

  const progressColor = getProgressColor();
  const progressMessage = getProgressMessage();

  const colorClasses = {
    green: {
      bg: 'bg-green-100',
      border: 'border-green-300',
      text: 'text-green-800',
      icon: 'text-green-600',
      progress: 'bg-green-500'
    },
    blue: {
      bg: 'bg-blue-100',
      border: 'border-blue-300',
      text: 'text-blue-800',
      icon: 'text-blue-600',
      progress: 'bg-blue-500'
    },
    red: {
      bg: 'bg-red-100',
      border: 'border-red-300',
      text: 'text-red-800',
      icon: 'text-red-600',
      progress: 'bg-red-500'
    }
  };

  const classes = colorClasses[progressColor];

  const handleProgressClick = () => {
    onInteraction('progress_indicator_clicked', {
      currentStep,
      successProbability: predictions?.successProbability,
      strugglingAreas: behaviorData?.struggleIndicators
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${classes.bg} ${classes.border} border rounded-lg p-4 mb-6 cursor-pointer`}
      onClick={handleProgressClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Progress Icon */}
          <div className={`${classes.icon}`}>
            {progressColor === 'green' && <CheckCircleIcon className="w-6 h-6" />}
            {progressColor === 'blue' && <ClockIcon className="w-6 h-6" />}
            {progressColor === 'red' && <ExclamationTriangleIcon className="w-6 h-6" />}
          </div>

          {/* Progress Info */}
          <div>
            <div className={`font-semibold ${classes.text}`}>
              {progressMessage}
            </div>
            {predictions?.successProbability && (
              <div className="text-sm text-gray-600">
                Success likelihood: {Math.round(predictions.successProbability * 100)}%
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 max-w-xs ml-4">
          <div className="bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ 
                width: `${(predictions?.successProbability || 0.5) * 100}%` 
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-2 rounded-full ${classes.progress}`}
            />
          </div>
        </div>
      </div>

      {/* Struggle Indicators */}
      {behaviorData?.struggleIndicators && behaviorData.struggleIndicators.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.3 }}
          className="mt-3 pt-3 border-t border-gray-200"
        >
          <div className="text-sm text-gray-600">
            <span className="font-medium">Areas needing attention:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {behaviorData.struggleIndicators.map((indicator: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs"
                >
                  {indicator}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Positive Factors */}
      {predictions?.positiveFactors && predictions.positiveFactors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.4 }}
          className="mt-3 pt-3 border-t border-gray-200"
        >
          <div className="text-sm text-gray-600">
            <span className="font-medium">You're excelling at:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {predictions.positiveFactors.map((factor: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProgressIndicator;