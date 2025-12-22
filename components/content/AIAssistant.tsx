'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/export-all";
import { Card } from '@/components/ui/card';

interface AISuggestion {
  id: string;
  type: string;
  content: string;
  confidence: number;
  reasoning?: string;
}

interface AIAssistantProps {
  onSuggestionSelect: (suggestion: string) => void;
  context?: {
    existingContent?: string;
    targetPlatforms?: string[];
  };
}

export default function AIAssistant({ onSuggestionSelect, context }: AIAssistantProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'ideas' | 'caption' | 'hashtags' | 'improvement'>('ideas');
  const [tone, setTone] = useState<'professional' | 'casual' | 'humorous' | 'inspirational'>('casual');

  const generateSuggestions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/content/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'current-user-id' },
        body: JSON.stringify({ type: selectedType, context: { ...context, tone } }),
      });

      if (!response.ok) throw new Error('Failed to generate suggestions');
      const result = await response.json();
      setSuggestions(result.data.suggestions);
    } catch (error) {
      alert('Failed to generate AI suggestions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">AI</span>
        </div>
        <h3 className="font-semibold text-gray-800">AI Assistant</h3>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">What do you need help with?</label>
          <Select value={selectedType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedType(e.target.value as any)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#2c6ecb] focus:border-transparent">
            <option value="ideas">Content Ideas</option>
            <option value="caption">Write Caption</option>
            <option value="hashtags">Generate Hashtags</option>
            <option value="improvement">Improve Content</option>
          </Select>
        </div>

        {selectedType === 'caption' && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Tone</label>
            <Select value={tone} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTone(e.target.value as any)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#2c6ecb] focus:border-transparent">
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="humorous">Humorous</option>
              <option value="inspirational">Inspirational</option>
            </Select>
          </div>
        )}

        <Button variant="primary" onClick={generateSuggestions} disabled={loading}>
  {loading ? <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Generating...</div> : 'Generate Suggestions'}
</Button>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800">Suggestions:</h4>
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:border-purple-300 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">{Math.round(suggestion.confidence * 100)}% match</span>
                <Button variant="primary" onClick={() => onSuggestionSelect(suggestion.content)}>Use This</Button>
              </div>
              <p className="text-gray-800 mb-2">{suggestion.content}</p>
              {suggestion.reasoning && <p className="text-xs text-gray-600 italic">💡 {suggestion.reasoning}</p>}
            </div>
          ))}
        </div>
      )}

      {suggestions.length === 0 && !loading && (
        <div className="text-center py-6 text-gray-500">
          <div className="text-2xl mb-2">🤖</div>
          <p className="text-sm">Click "Generate Suggestions" to get AI-powered content ideas!</p>
        </div>
      )}
    </div>
  );
}
