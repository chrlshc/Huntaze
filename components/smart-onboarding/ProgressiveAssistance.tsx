'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';
import {
  LightBulbIcon, 
  QuestionMarkCircleIcon, 
  AcademicCapIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface AssistanceLevel {
  id: string;
  type: 'hint' | 'guidance' | 'tutorial';
  title: string;
  content: string;
  steps?: string[];
  actionLabel?: string;
}

interface ProgressiveAssistanceProps {
  isVisible: boolean;
  currentLevel: number;
  assistanceLevels: AssistanceLevel[];
  onLevelChange: (level: number) => void;
  onAction?: (level: number, action: string) => void;
  onDismiss: () => void;
  onInteraction: (type: string, data?: any) => void;
}

export const ProgressiveAssistance: React.FC<ProgressiveAssistanceProps> = ({
  isVisible,
  currentLevel,
  assistanceLevels,
  onLevelChange,
  onAction,
  onDismiss,
  onInteraction
}) => {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);

  useEffect(() => {
    if (isVisible) {
      onInteraction('progressive_assistance_shown', { 
        currentLevel,
        availableLevels: assistanceLevels.length
      });
    }
  }, [isVisible, currentLevel, assistanceLevels.length, onInteraction]);

  const handleLevelSelect = (level: number) => {
    if (level === expandedLevel) {
      setExpandedLevel(null);
    } else {
      setExpandedLevel(level);
      setCurrentTutorialStep(0);
      onLevelChange(level);
      onInteraction('assistance_level_selected', { 
        level,
        type: assistanceLevels[level]?.type
      });
    }
  };

  const handleLevelComplete = (level: number) => {
    setCompletedLevels(prev => new Set([...prev, level]));
    onInteraction('assistance_level_completed', { 
      level,
      type: assistanceLevels[level]?.type
    });
    
    if (onAction) {
      onAction(level, assistanceLevels[level]?.actionLabel || 'complete');
    }
  };

  const handleTutorialStep = (direction: 'next' | 'prev') => {
    const currentAssistance = assistanceLevels[expandedLevel!];
    if (!currentAssistance?.steps) return;

    if (direction === 'next' && currentTutorialStep < currentAssistance.steps.length - 1) {
      setCurrentTutorialStep(prev => prev + 1);
      onInteraction('tutorial_step_advanced', { 
        level: expandedLevel,
        step: currentTutorialStep + 1
      });
    } else if (direction === 'prev' && currentTutorialStep > 0) {
      setCurrentTutorialStep(prev => prev - 1);
      onInteraction('tutorial_step_back', { 
        level: expandedLevel,
        step: currentTutorialStep - 1
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'hint':
        return <LightBulbIcon className="w-5 h-5" />;
      case 'guidance':
        return <QuestionMarkCircleIcon className="w-5 h-5" />;
      case 'tutorial':
        return <AcademicCapIcon className="w-5 h-5" />;
      default:
        return <QuestionMarkCircleIcon className="w-5 h-5" />;
    }
  };

  const getColorClasses = (type: string, isActive: boolean, isCompleted: boolean) => {
    if (isCompleted) {
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        icon: 'text-green-600',
        button: 'bg-green-600 hover:bg-green-700'
      };
    }

    if (isActive) {
      switch (type) {
        case 'hint':
          return {
            bg: 'bg-yellow-50',
            border: 'border-yellow-300',
            text: 'text-yellow-900',
            icon: 'text-yellow-600',
            button: 'bg-yellow-600 hover:bg-yellow-700'
          };
        case 'guidance':
          return {
            bg: 'bg-blue-50',
            border: 'border-blue-300',
            text: 'text-blue-900',
            icon: 'text-blue-600',
            button: 'bg-blue-600 hover:bg-blue-700'
          };
        case 'tutorial':
          return {
            bg: 'bg-purple-50',
            border: 'border-purple-300',
            text: 'text-purple-900',
            icon: 'text-purple-600',
            button: 'bg-purple-600 hover:bg-purple-700'
          };
      }
    }

    return {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      icon: 'text-gray-500',
      button: 'bg-gray-600 hover:bg-gray-700'
    };
  };

  const containerVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1
    },
    exit: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-30 -z-10"
            onClick={onDismiss}
          />

          {/* Assistance Panel */}
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <h3 className="text-lg font-semibold">Need Help?</h3>
              <p className="text-blue-100 text-sm">
                Choose the level of assistance that works best for you
              </p>
            </div>

            {/* Assistance Levels */}
            <div className="p-4 space-y-3">
              {assistanceLevels.map((assistance, index) => {
                const isActive = expandedLevel === index;
                const isCompleted = completedLevels.has(index);
                const colors = getColorClasses(assistance.type, isActive, isCompleted);

                return (
                  <motion.div
                    key={assistance.id}
                    variants={itemVariants}
                    className={`
                      border-2 rounded-lg transition-all duration-200 cursor-pointer
                      ${colors.bg} ${colors.border}
                      ${isActive ? 'shadow-md' : 'hover:shadow-sm'}
                    `}
                    onClick={() => handleLevelSelect(index)}
                  >
                    {/* Level Header */}
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={colors.icon}>
                          {getIcon(assistance.type)}
                        </div>
                        <div>
                          <h4 className={`font-semibold ${colors.text}`}>
                            {assistance.title}
                          </h4>
                          <p className={`text-xs ${colors.text} opacity-75`}>
                            {assistance.type.charAt(0).toUpperCase() + assistance.type.slice(1)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {isCompleted && (
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                        )}
                        <div className={colors.icon}>
                          {isActive ? (
                            <ChevronDownIcon className="w-4 h-4" />
                          ) : (
                            <ChevronRightIcon className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 border-t border-gray-200">
                            <div className="pt-3 space-y-3">
                              {/* Content */}
                              <p className={`text-sm ${colors.text}`}>
                                {assistance.content}
                              </p>

                              {/* Tutorial Steps */}
                              {assistance.steps && assistance.steps.length > 0 && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-xs font-medium ${colors.text}`}>
                                      Step {currentTutorialStep + 1} of {assistance.steps.length}
                                    </span>
                                    <div className="flex space-x-1">
                                      {assistance.steps.map((_, stepIndex) => (
                                        <div
                                          key={stepIndex}
                                          className={`w-2 h-2 rounded-full ${
                                            stepIndex <= currentTutorialStep 
                                              ? colors.button.split(' ')[0] 
                                              : 'bg-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>

                                  <div className="bg-white rounded border p-3">
                                    <p className={`text-sm ${colors.text}`}>
                                      {assistance.steps[currentTutorialStep]}
                                    </p>
                                  </div>

                                  {/* Tutorial Navigation */}
                                  <div className="flex justify-between">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTutorialStep('prev');
                                      }}
                                      disabled={currentTutorialStep === 0}
                                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                                        currentTutorialStep === 0
                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                          : `${colors.button} text-white`
                                      }`}
                                    >
                                      Previous
                                    </button>
                                    
                                    {currentTutorialStep < assistance.steps.length - 1 ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleTutorialStep('next');
                                        }}
                                        className={`px-3 py-1 text-xs font-medium text-white rounded ${colors.button} transition-colors`}
                                      >
                                        Next
                                      </button>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleLevelComplete(index);
                                        }}
                                        className={`px-3 py-1 text-xs font-medium text-white rounded ${colors.button} transition-colors`}
                                      >
                                        {assistance.actionLabel || 'Complete'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Single Action Button */}
                              {!assistance.steps && assistance.actionLabel && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLevelComplete(index);
                                  }}
                                  className={`w-full py-2 text-sm font-medium text-white rounded ${colors.button} transition-colors`}
                                >
                                  {assistance.actionLabel}
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
              <span className="text-xs text-gray-500">
                Choose what works best for you
              </span>
              <Button variant="primary" onClick={onDismiss}>
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProgressiveAssistance;