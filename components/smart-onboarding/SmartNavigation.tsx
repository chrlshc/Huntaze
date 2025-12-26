'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface SmartNavigationProps {
  stepId: string;
  predictions?: any;
  behaviorData?: any;
  onStepChange: (direction: 'next' | 'previous') => void;
  onInteraction: (type: string, data?: any) => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  isLoading?: boolean;
}

export const SmartNavigation: React.FC<SmartNavigationProps> = ({
  stepId,
  predictions,
  behaviorData,
  onStepChange,
  onInteraction,
  canGoBack = true,
  canGoForward = true,
  isLoading = false
}) => {
  const showWarning = Boolean(predictions?.successProbability < 0.5 && canGoForward);
  const warningMessage = showWarning
    ? 'You might want to review this step before continuing.'
    : '';

  const handleNavigation = (direction: 'next' | 'previous') => {
    onInteraction('navigation_clicked', { 
      direction, 
      stepId,
      successProbability: predictions?.successProbability,
      hasStruggleIndicators: behaviorData?.struggleIndicators?.length > 0
    });

    // If going forward with low success probability, show confirmation
    if (direction === 'next' && predictions?.successProbability < 0.4) {
      const confirmed = window.confirm(
        'It looks like you might benefit from spending more time on this step. Are you sure you want to continue?'
      );
      
      if (!confirmed) {
        onInteraction('navigation_cancelled', { 
          direction, 
          reason: 'low_success_probability' 
        });
        return;
      }
    }

    onStepChange(direction);
  };

  const getNextButtonState = () => {
    if (isLoading) return 'loading';
    if (predictions?.successProbability > 0.8) return 'confident';
    if (predictions?.successProbability < 0.4) return 'warning';
    return 'normal';
  };

  const getNextButtonClasses = () => {
    const state = getNextButtonState();
    
    switch (state) {
      case 'loading':
        return 'bg-gray-400 text-white cursor-not-allowed';
      case 'confident':
        return 'bg-green-600 text-white hover:bg-green-700';
      case 'warning':
        return 'bg-yellow-600 text-white hover:bg-yellow-700';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700';
    }
  };

  const getNextButtonText = () => {
    const state = getNextButtonState();
    
    switch (state) {
      case 'loading':
        return 'Loading...';
      case 'confident':
        return 'Continue →';
      case 'warning':
        return 'Continue anyway →';
      default:
        return 'Next →';
    }
  };

  return (
    <div className="smart-navigation mt-6 space-y-4">
      {/* Warning Message */}
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
        >
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-yellow-800">{warningMessage}</span>
          </div>
        </motion.div>
      )}

      {/* Success Indicator */}
      {predictions?.successProbability > 0.8 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-3"
        >
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-800">
              Great job! You're ready for the next step.
            </span>
          </div>
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        {/* Previous Button */}
        <button
          onClick={() => handleNavigation('previous')}
          disabled={!canGoBack || isLoading}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
            ${canGoBack && !isLoading
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <ChevronLeftIcon className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {/* Progress Indicator */}
        <div className="flex items-center space-x-2">
          {predictions?.successProbability !== undefined && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Confidence:</span>
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${predictions.successProbability * 100}%` 
                  }}
                  transition={{ duration: 0.5 }}
                  className={`h-2 rounded-full ${
                    predictions.successProbability > 0.7 
                      ? 'bg-green-500' 
                      : predictions.successProbability > 0.4 
                      ? 'bg-yellow-500' 
                      : 'bg-red-500'
                  }`}
                />
              </div>
              <span className="text-xs text-gray-500">
                {Math.round(predictions.successProbability * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={() => handleNavigation('next')}
          disabled={!canGoForward || isLoading}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
            ${canGoForward && !isLoading
              ? getNextButtonClasses()
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Loading...</span>
            </>
          ) : (
            <>
              <span>{getNextButtonText()}</span>
              <ChevronRightIcon className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Struggle Indicators */}
      {behaviorData?.struggleIndicators && behaviorData.struggleIndicators.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-3"
        >
          <div className="text-sm">
            <span className="font-medium text-blue-800">
              Need help with:
            </span>
            <div className="flex flex-wrap gap-2 mt-1">
              {behaviorData.struggleIndicators.map((indicator: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                >
                  {indicator}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Adaptive Suggestions */}
      {predictions?.suggestions && predictions.suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-50 border border-purple-200 rounded-lg p-3"
        >
          <div className="text-sm">
            <span className="font-medium text-purple-800 mb-2 block">
              Personalized suggestions:
            </span>
            <ul className="space-y-1">
              {predictions.suggestions.map((suggestion: string, index: number) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span className="text-purple-700">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SmartNavigation;
