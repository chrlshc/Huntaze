'use client';

import { useState } from 'react';
import { Bot, MessageSquare, Sparkles, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

interface AIConfigurationProps {
  onComplete: (data: { 
    verbosity: string;
    helpFrequency: string;
    suggestionStyle: string;
  }) => void;
}

export function AIConfiguration({ onComplete }: AIConfigurationProps) {
  const [config, setConfig] = useState({
    verbosity: 'balanced',
    helpFrequency: 'medium',
    suggestionStyle: 'creative'
  });

  const [showPreview, setShowPreview] = useState(false);

  const handleConfigChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const getPreviewText = () => {
    const previews = {
      detailed: "I'd be happy to help you create engaging content! Let me walk you through the process step by step. First, we'll start by understanding your audience...",
      balanced: "Let's create some engaging content! I'll help you craft a post that resonates with your audience.",
      concise: "Ready to create? Let's make something great.",
      minimal: "Create content →"
    };
    return previews[config.verbosity as keyof typeof previews];
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Configure your AI assistant
        </h2>
        <p className="text-gray-600">
          Customize how the AI helps you create content
        </p>
      </div>

      {/* Verbosity Setting */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-900">
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Response Style
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: 'detailed', label: 'Detailed', desc: 'Step-by-step guidance' },
            { value: 'balanced', label: 'Balanced', desc: 'Clear and helpful' },
            { value: 'concise', label: 'Concise', desc: 'Quick and direct' },
            { value: 'minimal', label: 'Minimal', desc: 'Just the essentials' }
          ].map(option => (
            <Button 
              key={option.value}
              variant="secondary" 
              onClick={() => handleConfigChange('verbosity', option.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                config.verbosity === option.value
                  ? 'border-[var(--accent-primary)] bg-blue-50'
                  : 'border-[var(--border-default)] hover:border-[var(--border-emphasis)]'
              }`}
            >
              <div className="font-medium text-gray-900 mb-1">{option.label}</div>
              <div className="text-xs text-gray-600">{option.desc}</div>
            </Button>
          ))}
        </div>
      </div>

      {/* Help Frequency */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-900">
          <Sparkles className="w-4 h-4 inline mr-2" />
          Help Frequency
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { value: 'high', label: 'Frequent', desc: 'Proactive suggestions' },
            { value: 'medium', label: 'Balanced', desc: 'When you need it' },
            { value: 'low', label: 'Minimal', desc: 'Only when asked' }
          ].map(option => (
            <Button 
              key={option.value}
              variant="secondary" 
              onClick={() => handleConfigChange('helpFrequency', option.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                config.helpFrequency === option.value
                  ? 'border-[var(--accent-primary)] bg-blue-50'
                  : 'border-[var(--border-default)] hover:border-[var(--border-emphasis)]'
              }`}
            >
              <div className="font-medium text-gray-900 mb-1">{option.label}</div>
              <div className="text-xs text-gray-600">{option.desc}</div>
            </Button>
          ))}
        </div>
      </div>

      {/* Suggestion Style */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-900">
          <Zap className="w-4 h-4 inline mr-2" />
          Suggestion Style
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { value: 'creative', label: 'Creative', desc: 'Bold and unique ideas' },
            { value: 'professional', label: 'Professional', desc: 'Polished and refined' },
            { value: 'casual', label: 'Casual', desc: 'Friendly and relatable' }
          ].map(option => (
            <Button 
              key={option.value}
              variant="secondary" 
              onClick={() => handleConfigChange('suggestionStyle', option.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                config.suggestionStyle === option.value
                  ? 'border-[var(--accent-primary)] bg-blue-50'
                  : 'border-[var(--border-default)] hover:border-[var(--border-emphasis)]'
              }`}
            >
              <div className="font-medium text-gray-900 mb-1">{option.label}</div>
              <div className="text-xs text-gray-600">{option.desc}</div>
            </Button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Preview AI Response</h3>
          <Bot className="w-5 h-5 text-blue-600" />
        </div>
        <Card className="bg-white rounded-lg p-4 border border-[var(--border-default)]">
          <p className="text-gray-700">{getPreviewText()}</p>
        </Card>
        <p className="text-xs text-gray-500">
          You can always change these settings later in your preferences.
        </p>
      </div>

      <Button 
        variant="primary" 
        onClick={() => onComplete(config)}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Save AI Preferences
      </Button>
    </div>
  );
}
