'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon, LightBulbIcon, PlayIcon } from '@heroicons/react/24/outline';

interface AdaptiveContentProps {
  content: any;
  stepId: string;
  userId: string;
  predictions?: any;
  behaviorData?: any;
  onInteraction: (type: string, data?: any) => void;
  onComplete: (data: any) => void;
  isLoading?: boolean;
}

export const AdaptiveContent: React.FC<AdaptiveContentProps> = ({
  content,
  stepId,
  userId,
  predictions,
  behaviorData,
  onInteraction,
  onComplete,
  isLoading = false
}) => {
  const [currentVariant, setCurrentVariant] = useState(content?.variant || 'default');
  const [interactionCount, setInteractionCount] = useState(0);
  const [completionData, setCompletionData] = useState<any>({});

  // Adapt content complexity based on predictions
  const getContentComplexity = () => {
    if (predictions?.successProbability < 0.4) return 'simple';
    if (predictions?.successProbability > 0.8) return 'advanced';
    return 'standard';
  };

  // Adapt presentation style based on behavior
  const getPresentationStyle = () => {
    if (behaviorData?.struggleIndicators?.includes('low_engagement')) return 'interactive';
    if (behaviorData?.struggleIndicators?.includes('time_pressure')) return 'concise';
    return 'standard';
  };

  const complexity = getContentComplexity();
  const presentationStyle = getPresentationStyle();

  const handleInteraction = (type: string, data?: any) => {
    setInteractionCount(prev => prev + 1);
    onInteraction(type, { ...data, interactionCount: interactionCount + 1 });
  };

  const handleComplete = () => {
    const data = {
      stepId,
      completionData,
      interactionCount,
      complexity,
      presentationStyle,
      completedAt: new Date().toISOString()
    };
    onComplete(data);
  };

  const renderContent = () => {
    if (!content) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading content...</div>
        </div>
      );
    }

    switch (presentationStyle) {
      case 'interactive':
        return renderInteractiveContent();
      case 'concise':
        return renderConciseContent();
      default:
        return renderStandardContent();
    }
  };

  const renderStandardContent = () => (
    <div className="space-y-6">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {content.title}
        </h2>
        {content.subtitle && (
          <p className="text-lg text-gray-600">
            {content.subtitle}
          </p>
        )}
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="prose max-w-none"
      >
        {complexity === 'simple' ? (
          <div className="text-base leading-relaxed">
            {content.simpleDescription || content.description}
          </div>
        ) : complexity === 'advanced' ? (
          <div className="text-sm">
            {content.detailedDescription || content.description}
            {content.technicalNotes && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Technical Details</h4>
                <p className="text-gray-700">{content.technicalNotes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-base">
            {content.description}
          </div>
        )}
      </motion.div>

      {/* Interactive Elements */}
      {content.interactiveElements && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {content.interactiveElements.map((element: any, index: number) => (
            <div key={index} className="border rounded-lg p-4">
              {renderInteractiveElement(element, index)}
            </div>
          ))}
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-end space-x-3"
      >
        {content.actions?.map((action: any, index: number) => (
          <button
            key={index}
            onClick={() => {
              handleInteraction('action_clicked', { action: action.id });
              if (action.completes) {
                handleComplete();
              }
            }}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              action.primary
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {action.label}
          </button>
        ))}
      </motion.div>
    </div>
  );

  const renderInteractiveContent = () => (
    <div className="space-y-6">
      {/* Engaging Title with Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <LightBulbIcon className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {content.title}
        </h2>
        <p className="text-lg text-gray-600">
          Let's make this interactive!
        </p>
      </motion.div>

      {/* Interactive Cards */}
      <div className="grid gap-4">
        {content.steps?.map((step: any, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
            onClick={() => handleInteraction('step_clicked', { stepIndex: index })}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <button
          onClick={handleComplete}
          className="inline-flex items-center px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          <PlayIcon className="w-5 h-5 mr-2" />
          Continue Your Journey
        </button>
      </motion.div>
    </div>
  );

  const renderConciseContent = () => (
    <div className="space-y-4">
      {/* Quick Title */}
      <h2 className="text-xl font-bold text-gray-900">
        {content.title}
      </h2>

      {/* Key Points */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="text-sm">
          <h3 className="font-semibold text-blue-900 mb-2">Quick Summary:</h3>
          <ul className="space-y-1 text-blue-800">
            {content.keyPoints?.map((point: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quick Action */}
      <button
        onClick={handleComplete}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Got it, continue →
      </button>
    </div>
  );

  const renderInteractiveElement = (element: any, index: number) => {
    switch (element.type) {
      case 'quiz':
        return (
          <div>
            <h4 className="font-semibold mb-3">{element.question}</h4>
            <div className="space-y-2">
              {element.options?.map((option: string, optionIndex: number) => (
                <button
                  key={optionIndex}
                  onClick={() => handleInteraction('quiz_answer', { 
                    questionIndex: index, 
                    answerIndex: optionIndex,
                    answer: option
                  })}
                  className="block w-full text-left p-3 border rounded hover:bg-gray-50 transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case 'input':
        return (
          <div>
            <label className="block font-semibold mb-2">{element.label}</label>
            <input
              type={element.inputType || 'text'}
              placeholder={element.placeholder}
              onChange={(e) => {
                setCompletionData(prev => ({
                  ...prev,
                  [element.id]: e.target.value
                }));
                handleInteraction('input_changed', { 
                  elementId: element.id, 
                  value: e.target.value 
                });
              }}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      case 'checklist':
        return (
          <div>
            <h4 className="font-semibold mb-3">{element.title}</h4>
            <div className="space-y-2">
              {element.items?.map((item: string, itemIndex: number) => (
                <label key={itemIndex} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      const checklistData = completionData[element.id] || [];
                      if (e.target.checked) {
                        checklistData.push(item);
                      } else {
                        const index = checklistData.indexOf(item);
                        if (index > -1) checklistData.splice(index, 1);
                      }
                      setCompletionData(prev => ({
                        ...prev,
                        [element.id]: checklistData
                      }));
                      handleInteraction('checklist_item_toggled', { 
                        elementId: element.id, 
                        item, 
                        checked: e.target.checked 
                      });
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{item}</span>
                </label>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-gray-500">
            Unknown interactive element: {element.type}
          </div>
        );
    }
  };

  return (
    <div className="adaptive-content">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${complexity}-${presentationStyle}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* Adaptation Feedback */}
      {(complexity !== 'standard' || presentationStyle !== 'standard') && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-700">
              Content adapted for your learning style
              {complexity !== 'standard' && ` (${complexity} level)`}
              {presentationStyle !== 'standard' && ` (${presentationStyle} format)`}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdaptiveContent;