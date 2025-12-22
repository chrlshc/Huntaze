'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from '@/components/ui/card';
import { Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { ChatCloserContext } from '@/components/knowledge/PoweredByContext';
import type { KnowledgeItem } from '@/lib/knowledge/retrieval';

interface SmartReplySuggestionsProps {
  fanMessage: string;
  onSelectReply: (reply: string) => void;
  userId?: number;
  niche?: string;
}

interface SuggestedReply extends KnowledgeItem {
  suggestedText: string;
  confidence: number;
}

export function SmartReplySuggestions({ 
  fanMessage, 
  onSelectReply, 
  userId,
  niche = 'lifestyle' 
}: SmartReplySuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestedReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);

  // Debounced search for suggestions
  useEffect(() => {
    if (!fanMessage || fanMessage.length < 5) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchSuggestions();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [fanMessage]);

  const searchSuggestions = async () => {
    setLoading(true);
    try {
      // Fetch suggestions from API instead of direct import
      const response = await fetch('/api/knowledge/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1', // Simple auth
        },
        body: JSON.stringify({
          fanMessage,
          userId: userId || 1,
          niche
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Transform API response to expected format
        const suggestedReplies: SuggestedReply[] = data.suggestions.map((suggestion: any) => ({
          id: suggestion.id,
          inputText: suggestion.source,
          suggestedText: suggestion.text,
          confidence: suggestion.confidence,
          distance: 1 - suggestion.confidence, // Convert back to distance
        }));

        setSuggestions(suggestedReplies);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestedReply = (payload: any, fanMessage: string): string => {
    // Extract the response pattern from the playbook
    if (payload?.responsePattern) {
      // Customize the response based on the fan's message
      const response = payload.response;
      
      // Simple personalization
      if (fanMessage.toLowerCase().includes('how much') || fanMessage.toLowerCase().includes('price')) {
        return response.includes('$') ? response : `${response} 💕`;
      }
      
      return response;
    }
    
    return payload?.outputText || "Hey! Thanks for your message 😘";
  };

  const calculateConfidence = (item: KnowledgeItem, fanMessage: string): number => {
    // Base confidence from semantic similarity
    let confidence = 1 - item.distance; // distance is 0-1, so invert
    
    // Boost based on revenue
    if (item.revenueUsd) {
      confidence += Math.min(item.revenueUsd / 100, 0.3); // Max 30% boost
    }
    
    // Boost based on score
    if (item.score) {
      confidence += item.score * 0.2; // Max 20% boost
    }
    
    return Math.min(confidence, 1);
  };

  if (loading) {
    return (
      <Card className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin text-purple-600" />
          <span className="text-sm text-purple-700 dark:text-purple-300">
            Finding smart replies...
          </span>
        </div>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
      <div className="space-y-3">
        {/* Header with context toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Smart Suggestions
            </span>
            <Badge variant="secondary" className="text-xs">
              AI Powered
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowContext(!showContext)}
            className="text-xs h-6 px-2"
          >
            {showContext ? 'Hide' : 'Show'} context
          </Button>
        </div>

        {/* Powered by Context */}
        {showContext && (
          <div className="mb-3">
            <ChatCloserContext 
              sources={suggestions.map(s => ({
                id: s.id,
                title: s.title,
                similarity: s.confidence,
                type: 'Chat Closer',
                revenue: s.revenueUsd,
                views: s.views,
              }))}
              compact={true}
            />
          </div>
        )}

        {/* Suggestion buttons */}
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <div key={suggestion.id} className="relative">
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto p-3 whitespace-normal hover:bg-purple-100 dark:hover:bg-purple-900/30"
                onClick={() => onSelectReply(suggestion.suggestedText)}
              >
                <div className="space-y-1">
                  <p className="text-sm">{suggestion.suggestedText}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3" />
                    <span>{Math.round(suggestion.confidence * 100)}% match</span>
                    {suggestion.revenueUsd && (
                      <>
                        <DollarSign className="w-3 h-3" />
                        <span>${suggestion.revenueUsd} proven</span>
                      </>
                    )}
                    {suggestion.views && (
                      <span>{suggestion.views.toLocaleString()} views</span>
                    )}
                  </div>
                </div>
              </Button>
              
              {/* Confidence indicator */}
              <div 
                className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                style={{ width: `${suggestion.confidence * 100}%` }}
              />
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center">
          Suggestions based on top performing messages. Always personalize your response.
        </p>
      </div>
    </Card>
  );
}

// Hook for using smart suggestions
export function useSmartSuggestions(userId?: number, niche?: string) {
  const [lastUsedStrategy, setLastUsedStrategy] = useState<string | null>(null);
  
  const trackUsage = async (strategyId: string, success?: boolean) => {
    try {
      // Update the usage in the knowledge base
      await fetch('/api/knowledge/track-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId,
          success,
          userId,
        }),
      });
      
      setLastUsedStrategy(strategyId);
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  };

  return {
    lastUsedStrategy,
    trackUsage,
  };
}
