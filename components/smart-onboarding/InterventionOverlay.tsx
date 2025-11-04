'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, QuestionMarkCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline';

interface InterventionOverlayProps {
  isVisible: boolean;
  interventionType: 'hint' | 'guidance' | 'tutorial';
  content: {
    title: string;
    message: string;
    steps?: string[];
    actionLabel?: string;
  };
  position?: {
    x: number;
    y: number;
  };
  onDismiss: () => void;
  onAction?: () => void;
  onInteraction: (type: string, data?: any) => void;
}

export const InterventionOverlay: React.FC<InterventionOverlayProps> = ({
  isVisible,
  interventionType,
  content,
  position,
  onDismiss,
  onAction,
  onInteraction
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isVisible) {
      onInteraction('intervention_shown', { 
        type: interventionType,
        content: content.title 
      });
    }
  }, [isVisible, interventionType, content.title, onInteraction]);

  const handleExpand = () => {
    setIsExpanded(true);
    onInteraction('intervention_expanded', { type: interventionType });
  };

  const handleDismiss = () => {
    onInteraction('intervention_dismissed', { 
      type: interventionType,
      wasExpanded: isExpanded,
      currentStep: interventionType === 'tutorial' ? currentStep : undefined
    });
    onDismiss();
  };

  const handleAction = () => {
    onInteraction('intervention_action_taken', { 
      type: interventionType,
      action: content.actionLabel 
    });
    if (onAction) onAction();
  };

  const nextStep = () => {
    if (content.steps && currentStep < content.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      onInteraction('tutorial_step_advanced', { 
        from: currentStep, 
        to: currentStep + 1 
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      onInteraction('tutorial_step_back', { 
        from: currentStep, 
        to: currentStep - 1 
      });
    }
  };

  const getIcon = () => {
    switch (interventionType) {
      case 'hint':
        return <LightBulbIcon className="w-5 h-5" />;
      case 'guidance':
        return <QuestionMarkCircleIcon className="w-5 h-5" />;
      case 'tutorial':
        return <QuestionMarkCircleIcon className="w-5 h-5" />;
      default:
        return <QuestionMarkCircleIcon className="w-5 h-5" />;
    }
  };

  const getColorClasses = () => {
    switch (interventionType) {
      case 'hint':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-600',
          button: 'bg-yellow-600 hover:bg-yellow-700'
        };
      case 'guidance':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'tutorial':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-800',
          icon: 'text-purple-600',
          button: 'bg-purple-600 hover:bg-purple-700'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: 'text-gray-600',
          button: 'bg-gray-600 hover:bg-gray-700'
        };
    }
  };

  const colors = getColorClasses();

  const overlayVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  const contentVariants = {
    collapsed: { 
      height: 'auto',
      opacity: 1
    },
    expanded: { 
      height: 'auto',
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop for tutorial mode */}
          {interventionType === 'tutorial' && isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={handleDismiss}
            />
          )}

          {/* Intervention Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              fixed z-50 max-w-sm rounded-lg shadow-lg border-2 
              ${colors.bg} ${colors.border}
              ${position ? '' : 'top-4 right-4'}
            `}
            style={position ? { 
              left: position.x, 
              top: position.y,
              transform: 'translate(-50%, -100%)' 
            } : {}}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-2">
              <div className="flex items-center space-x-2">
                <div className={colors.icon}>
                  {getIcon()}
                </div>
                <h3 className={`font-semibold ${colors.text}`}>
                  {content.title}
                </h3>
              </div>
              <button
                onClick={handleDismiss}
                className={`${colors.icon} hover:opacity-70 transition-opacity`}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <motion.div
              variants={contentVariants}
              animate={isExpanded ? 'expanded' : 'collapsed'}
              className="px-4 pb-4"
            >
              {/* Basic Message */}
              {!isExpanded && (
                <div className="space-y-3">
                  <p className={`text-sm ${colors.text}`}>
                    {content.message}
                  </p>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {interventionType !== 'hint' && (
                      <button
                        onClick={handleExpand}
                        className={`px-3 py-1 text-xs font-medium text-white rounded ${colors.button} transition-colors`}
                      >
                        Show me how
                      </button>
                    )}
                    {content.actionLabel && (
                      <button
                        onClick={handleAction}
                        className={`px-3 py-1 text-xs font-medium text-white rounded ${colors.button} transition-colors`}
                      >
                        {content.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Expanded Content */}
              {isExpanded && (
                <div className="space-y-4">
                  <p className={`text-sm ${colors.text}`}>
                    {content.message}
                  </p>

                  {/* Tutorial Steps */}
                  {content.steps && content.steps.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${colors.text}`}>
                          Step {currentStep + 1} of {content.steps.length}
                        </span>
                        <div className="flex space-x-1">
                          {content.steps.map((_, index) => (
                            <div
                              key={index}
                              className={`w-2 h-2 rounded-full ${
                                index <= currentStep 
                                  ? colors.button.split(' ')[0] 
                                  : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className={`p-3 bg-white rounded border ${colors.text}`}>
                        <p className="text-sm">
                          {content.steps[currentStep]}
                        </p>
                      </div>

                      {/* Navigation */}
                      <div className="flex justify-between">
                        <button
                          onClick={prevStep}
                          disabled={currentStep === 0}
                          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                            currentStep === 0
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : `${colors.button} text-white`
                          }`}
                        >
                          Previous
                        </button>
                        
                        {currentStep < content.steps.length - 1 ? (
                          <button
                            onClick={nextStep}
                            className={`px-3 py-1 text-xs font-medium text-white rounded ${colors.button} transition-colors`}
                          >
                            Next
                          </button>
                        ) : (
                          <button
                            onClick={handleAction || handleDismiss}
                            className={`px-3 py-1 text-xs font-medium text-white rounded ${colors.button} transition-colors`}
                          >
                            {content.actionLabel || 'Got it!'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Single Action for Guidance */}
                  {!content.steps && content.actionLabel && (
                    <button
                      onClick={handleAction}
                      className={`w-full py-2 text-sm font-medium text-white rounded ${colors.button} transition-colors`}
                    >
                      {content.actionLabel}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InterventionOverlay;