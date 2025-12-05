'use client';

/**
 * FlowBuilder Component
 * Visual builder for automation workflows with step display
 * Requirements: 1.3
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { 
  AutomationStep, 
  TriggerType, 
  ActionType,
  StepType 
} from '@/lib/automations/types';

interface FlowBuilderProps {
  steps: AutomationStep[];
  onChange: (steps: AutomationStep[]) => void;
  readOnly?: boolean;
}

// Step type badges
const stepTypeBadges: Record<StepType, { bg: string; text: string; label: string }> = {
  trigger: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', label: 'Trigger' },
  condition: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Condition' },
  action: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Action' },
};

// Trigger type options
const triggerOptions: { value: TriggerType; label: string; description: string }[] = [
  { value: 'new_subscriber', label: 'New Subscriber', description: 'When someone subscribes to your page' },
  { value: 'message_received', label: 'Message Received', description: 'When you receive a new message' },
  { value: 'purchase_completed', label: 'Purchase Completed', description: 'When a fan makes a purchase' },
  { value: 'subscription_expiring', label: 'Subscription Expiring', description: 'When a subscription is about to expire' },
];

// Action type options
const actionOptions: { value: ActionType; label: string; description: string }[] = [
  { value: 'send_message', label: 'Send Message', description: 'Send an automated message' },
  { value: 'create_offer', label: 'Create Offer', description: 'Create a special offer' },
  { value: 'add_tag', label: 'Add Tag', description: 'Tag the fan for segmentation' },
  { value: 'wait', label: 'Wait', description: 'Wait before next action' },
];

// Generate unique ID
const generateId = () => `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function FlowBuilder({ steps, onChange, readOnly = false }: FlowBuilderProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingStep, setEditingStep] = useState<string | null>(null);

  // Add a new step
  const addStep = (type: StepType, name: string) => {
    const newStep: AutomationStep = {
      id: generateId(),
      type,
      name,
      config: getDefaultConfig(type, name),
    };
    onChange([...steps, newStep]);
    setShowAddMenu(false);
    setEditingStep(newStep.id);
  };

  // Get default config for step type
  const getDefaultConfig = (type: StepType, name: string): Record<string, unknown> => {
    if (type === 'trigger') {
      return { conditions: {} };
    }
    if (type === 'action') {
      switch (name) {
        case 'send_message':
          return { template: '', placeholders: {} };
        case 'create_offer':
          return { discountType: 'percentage', discountValue: 10, validDays: 7 };
        case 'add_tag':
          return { tagName: '' };
        case 'wait':
          return { duration: 1, unit: 'hours' };
        default:
          return {};
      }
    }
    return {};
  };

  // Update step config
  const updateStepConfig = (stepId: string, config: Record<string, unknown>) => {
    onChange(steps.map(s => s.id === stepId ? { ...s, config } : s));
  };

  // Remove step
  const removeStep = (stepId: string) => {
    onChange(steps.filter(s => s.id !== stepId));
    if (editingStep === stepId) setEditingStep(null);
  };

  // Move step up/down
  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;
    
    const newSteps = [...steps];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    onChange(newSteps);
  };

  // Get step display name
  const getStepDisplayName = (step: AutomationStep): string => {
    if (step.type === 'trigger') {
      return triggerOptions.find(t => t.value === step.name)?.label || step.name;
    }
    if (step.type === 'action') {
      return actionOptions.find(a => a.value === step.name)?.label || step.name;
    }
    return step.name;
  };

  // Render step config editor
  const renderConfigEditor = (step: AutomationStep) => {
    if (step.type === 'action') {
      switch (step.name) {
        case 'send_message':
          return (
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Message Template</span>
                <textarea
                  value={(step.config.template as string) || ''}
                  onChange={(e) => updateStepConfig(step.id, { ...step.config, template: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="Hi {{fan_name}}, thanks for subscribing!"
                  disabled={readOnly}
                />
              </label>
              <p className="text-xs text-gray-500">Use {'{{fan_name}}'}, {'{{username}}'} for personalization</p>
            </div>
          );
        
        case 'create_offer':
          return (
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Discount Type</span>
                <select
                  value={(step.config.discountType as string) || 'percentage'}
                  onChange={(e) => updateStepConfig(step.id, { ...step.config, discountType: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={readOnly}
                >
                  <option value="percentage">Percentage Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                  <option value="bogo">Buy One Get One</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Discount Value</span>
                <input
                  type="number"
                  value={(step.config.discountValue as number) || 10}
                  onChange={(e) => updateStepConfig(step.id, { ...step.config, discountValue: Number(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min={1}
                  disabled={readOnly}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Valid Days</span>
                <input
                  type="number"
                  value={(step.config.validDays as number) || 7}
                  onChange={(e) => updateStepConfig(step.id, { ...step.config, validDays: Number(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min={1}
                  disabled={readOnly}
                />
              </label>
            </div>
          );
        
        case 'add_tag':
          return (
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tag Name</span>
              <input
                type="text"
                value={(step.config.tagName as string) || ''}
                onChange={(e) => updateStepConfig(step.id, { ...step.config, tagName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., vip, new-subscriber"
                disabled={readOnly}
              />
            </label>
          );
        
        case 'wait':
          return (
            <div className="flex gap-3">
              <label className="flex-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</span>
                <input
                  type="number"
                  value={(step.config.duration as number) || 1}
                  onChange={(e) => updateStepConfig(step.id, { ...step.config, duration: Number(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min={1}
                  disabled={readOnly}
                />
              </label>
              <label className="flex-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Unit</span>
                <select
                  value={(step.config.unit as string) || 'hours'}
                  onChange={(e) => updateStepConfig(step.id, { ...step.config, unit: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={readOnly}
                >
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </label>
            </div>
          );
      }
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Steps List */}
      {steps.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Start by adding a trigger to your automation
          </p>
          {!readOnly && (
            <Button variant="primary" onClick={() => setShowAddMenu(true)}>
              Add First Step
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Connector Line */}
              {index > 0 && (
                <div className="absolute left-6 -top-3 w-0.5 h-3 bg-gray-300 dark:bg-gray-600" />
              )}
              
              <Card className={`p-4 ${editingStep === step.id ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="flex items-start gap-3">
                  {/* Step Number */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                    {index + 1}
                  </div>
                  
                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${stepTypeBadges[step.type].bg} ${stepTypeBadges[step.type].text}`}>
                        {stepTypeBadges[step.type].label}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getStepDisplayName(step)}
                      </span>
                    </div>
                    
                    {/* Config Editor (when editing) */}
                    {editingStep === step.id && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        {renderConfigEditor(step)}
                      </div>
                    )}
                    
                    {/* Config Summary (when not editing) */}
                    {editingStep !== step.id && step.type === 'action' && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {step.name === 'send_message' && step.config.template && (
                          <span className="truncate block">&quot;{(step.config.template as string).substring(0, 50)}...&quot;</span>
                        )}
                        {step.name === 'create_offer' && (
                          <span>{step.config.discountValue}% off for {step.config.validDays} days</span>
                        )}
                        {step.name === 'add_tag' && step.config.tagName && (
                          <span>Tag: {step.config.tagName as string}</span>
                        )}
                        {step.name === 'wait' && (
                          <span>Wait {step.config.duration} {step.config.unit}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  {!readOnly && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingStep(editingStep === step.id ? null : step.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveStep(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                        title="Move up"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveStep(index, 'down')}
                        disabled={index === steps.length - 1}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                        title="Move down"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => removeStep(step.id)}
                        className="p-1.5 text-red-400 hover:text-red-600"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Add Step Button */}
      {!readOnly && steps.length > 0 && (
        <div className="relative">
          <div className="absolute left-6 -top-1 w-0.5 h-4 bg-gray-300 dark:bg-gray-600" />
          <Button
            variant="secondary"
            onClick={() => setShowAddMenu(true)}
            className="ml-4 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Step
          </Button>
        </div>
      )}

      {/* Add Step Menu */}
      {showAddMenu && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddMenu(false)}>
          <Card className="w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Step</h3>
            
            {/* Triggers */}
            {!steps.some(s => s.type === 'trigger') && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Triggers</h4>
                <div className="space-y-2">
                  {triggerOptions.map((trigger) => (
                    <button
                      key={trigger.value}
                      onClick={() => addStep('trigger', trigger.value)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{trigger.label}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{trigger.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Actions</h4>
              <div className="space-y-2">
                {actionOptions.map((action) => (
                  <button
                    key={action.value}
                    onClick={() => addStep('action', action.value)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{action.label}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{action.description}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <Button variant="secondary" onClick={() => setShowAddMenu(false)} className="w-full mt-4">
              Cancel
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

export default FlowBuilder;
