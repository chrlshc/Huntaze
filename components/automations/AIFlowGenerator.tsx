'use client';

/**
 * AIFlowGenerator Component
 * Natural language input to generate automation flows using AI
 * Requirements: 1.1
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { internalApiFetch } from '@/lib/api/client/internal-api-client';
import type { z } from 'zod';
import type { AutomationStep } from '@/lib/automations/types';
import { automationBuilderResponseSchema } from '@/lib/schemas/api-responses';

interface AIFlowGeneratorProps {
  onFlowGenerated: (name: string, description: string, steps: AutomationStep[]) => void;
}

// Example prompts for inspiration
const examplePrompts = [
  'Send a welcome message when someone subscribes',
  'Create a 20% discount offer when a fan makes their first purchase',
  'Tag VIP fans who spend over $100 and send them a thank you message',
  'Send a reminder message 3 days before subscription expires',
];

type AutomationBuilderResponse = z.infer<typeof automationBuilderResponseSchema>;

export function AIFlowGenerator({ onFlowGenerated }: AIFlowGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedFlow, setGeneratedFlow] = useState<{
    name: string;
    description: string;
    steps: AutomationStep[];
    confidence: number;
  } | null>(null);

  // Generate flow from natural language
  const generateFlow = async () => {
    if (!prompt.trim()) {
      setError('Please describe what you want to automate');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedFlow(null);

    try {
      const data = await internalApiFetch<AutomationBuilderResponse>('/api/ai/automation-builder', {
        method: 'POST',
        body: { action: 'build_flow', description: prompt },
        schema: automationBuilderResponseSchema,
      });

      if (data.success && data.data) {
        const normalizedSteps: AutomationStep[] = data.data.steps.map((step) => ({
          ...step,
          config: step.config ?? {},
        }));
        setGeneratedFlow({ ...data.data, steps: normalizedSteps });
      } else {
        setError(data.error?.message || 'Failed to generate automation');
      }
    } catch (err) {
      console.error('Error generating flow:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to AI service');
    } finally {
      setLoading(false);
    }
  };

  // Apply the generated flow
  const applyFlow = () => {
    if (generatedFlow) {
      onFlowGenerated(generatedFlow.name, generatedFlow.description, generatedFlow.steps);
      setGeneratedFlow(null);
      setPrompt('');
    }
  };

  // Get step type badge color
  const getStepBadgeColor = (type: string) => {
    switch (type) {
      case 'trigger':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'action':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'condition':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get human-readable step name
  const getStepDisplayName = (step: AutomationStep): string => {
    const nameMap: Record<string, string> = {
      new_subscriber: 'New Subscriber',
      message_received: 'Message Received',
      purchase_completed: 'Purchase Completed',
      subscription_expiring: 'Subscription Expiring',
      send_message: 'Send Message',
      create_offer: 'Create Offer',
      add_tag: 'Add Tag',
      wait: 'Wait',
    };
    return nameMap[step.name] || step.name;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">AI Flow Generator</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Describe what you want to automate in plain English
          </p>
        </div>
      </div>

      {/* Input Area */}
      <div className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Send a welcome message with a 10% discount when someone subscribes"
          className="w-full h-24 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          disabled={loading}
        />

        {/* Example Prompts */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Try:</span>
          {examplePrompts.map((example, index) => (
            <button
              key={index}
              onClick={() => setPrompt(example)}
              className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              disabled={loading}
            >
              {example.length > 40 ? example.substring(0, 40) + '...' : example}
            </button>
          ))}
        </div>

        {/* Generate Button */}
        <Button
          variant="primary"
          onClick={generateFlow}
          disabled={loading || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Automation
            </>
          )}
        </Button>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Generated Flow Preview */}
        {generatedFlow && (
          <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white">{generatedFlow.name}</h4>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                {Math.round(generatedFlow.confidence * 100)}% confidence
              </span>
            </div>
            
            {generatedFlow.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {generatedFlow.description}
              </p>
            )}

            {/* Steps Preview */}
            <div className="space-y-2 mb-4">
              {generatedFlow.steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                    {index + 1}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStepBadgeColor(step.type)}`}>
                    {step.type}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {getStepDisplayName(step)}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="primary" onClick={applyFlow} className="flex-1">
                Use This Flow
              </Button>
              <Button variant="secondary" onClick={() => setGeneratedFlow(null)}>
                Discard
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default AIFlowGenerator;
