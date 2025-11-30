/**
 * AI Message Composer Component - Premium Edition
 * Interface ultra-moderne avec animations et effets visuels
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles, RefreshCw, AlertCircle, Zap, Brain, TrendingUp, Copy, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface MessageSuggestion {
  text: string;
  category: string;
  confidence?: number;
  memoryContext?: {
    referencedTopics?: string[];
    personalityAdjusted: boolean;
    emotionalContext?: string;
  };
}

interface AIMessageComposerProps {
  fanId: string;
  creatorId: string;
  conversationContext?: {
    lastMessage?: string;
    messageCount?: number;
    fanValueCents?: number;
  };
  onSelectSuggestion?: (suggestion: MessageSuggestion) => void;
}

export function AIMessageComposer({
  fanId,
  creatorId,
  conversationContext,
  onSelectSuggestion,
}: AIMessageComposerProps) {
  const [suggestions, setSuggestions] = useState<MessageSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Charger les suggestions au montage et quand le contexte change
  useEffect(() => {
    loadSuggestions();
  }, [fanId, creatorId, conversationContext?.lastMessage]);

  const loadSuggestions = async () => {
    setLoading(true);
    setIsGenerating(true);
    setError(null);
    setSelectedIndex(null);

    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fanId,
          creatorId,
          lastMessage: conversationContext?.lastMessage,
          messageCount: conversationContext?.messageCount || 0,
          fanValueCents: conversationContext?.fanValueCents || 0,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Animation d'apparition progressive
      setSuggestions([]);
      for (let i = 0; i < (data.suggestions || []).length; i++) {
        await new Promise(resolve => setTimeout(resolve, 150));
        setSuggestions(prev => [...prev, data.suggestions[i]]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('Failed to load suggestions:', err);
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSelectSuggestion = (suggestion: MessageSuggestion, index: number) => {
    setSelectedIndex(index);
    onSelectSuggestion?.(suggestion);
  };

  const getEmotionColor = (emotion?: string) => {
    switch (emotion) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'promotional':
        return '💰';
      case 'engaging':
        return '💬';
      case 'flirty':
        return '😘';
      case 'supportive':
        return '🤗';
      default:
        return '✨';
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-[2px]">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500 blur-xl opacity-50 animate-pulse"></div>
                <Brain className="relative w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI Assistant
                </h3>
                <p className="text-xs text-gray-500">Suggestions personnalisées en temps réel</p>
              </div>
            </div>
            <Button variant="primary" onClick={loadSuggestions} disabled={loading}>
  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span className="hidden sm:inline">Actualiser</span>
</Button>
          </div>
          
          {/* Stats Bar */}
          {suggestions.length > 0 && !loading && (
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span>{suggestions.length} suggestions</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span>Optimisé pour engagement</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">
              Erreur de chargement
            </p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State Premium */}
      {loading && suggestions.length === 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-8">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-30 animate-pulse"></div>
              <Brain className="relative w-12 h-12 text-purple-600 animate-bounce" />
            </div>
            <div className="space-y-2">
              <p className="text-base font-semibold text-gray-900">
                🧠 Analyse en cours...
              </p>
              <p className="text-sm text-gray-600">
                L'IA analyse le contexte émotionnel et la personnalité
              </p>
            </div>
            {/* Progress dots */}
            <div className="flex justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Suggestions List Premium */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${
                selectedIndex === index
                  ? 'ring-2 ring-purple-500 shadow-xl scale-[1.02]'
                  : 'hover:shadow-lg hover:scale-[1.01]'
              }`}
              style={{
                animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
              }}
            >
              {/* Gradient Border */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative bg-white dark:bg-gray-900 m-[2px] rounded-2xl p-5">
                <button
                  onClick={() => handleSelectSuggestion(suggestion, index)}
                  className="w-full text-left"
                >
                  {/* Suggestion Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl transform group-hover:scale-110 transition-transform">
                        {getCategoryIcon(suggestion.category)}
                      </span>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {suggestion.category}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {suggestion.memoryContext?.emotionalContext && (
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-medium ${getEmotionColor(
                            suggestion.memoryContext.emotionalContext
                          )}`}
                        >
                          {suggestion.memoryContext.emotionalContext}
                        </span>
                      )}
                      
                      {/* Copy Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(suggestion.text, index);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Copier"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Suggestion Text */}
                  <p className="text-base text-gray-900 dark:text-gray-100 mb-4 leading-relaxed font-medium">
                    {suggestion.text}
                  </p>

                  {/* Memory Context Indicators */}
                  {suggestion.memoryContext && (
                    <div className="flex flex-wrap gap-2">
                      {suggestion.memoryContext.personalityAdjusted && (
                        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full font-medium">
                          <Sparkles className="w-3 h-3" />
                          Personnalisé
                        </span>
                      )}
                      
                      {suggestion.memoryContext.referencedTopics &&
                        suggestion.memoryContext.referencedTopics.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                          💭 {suggestion.memoryContext.referencedTopics.length} sujets
                        </span>
                      )}
                      
                      {suggestion.confidence && (
                        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-medium">
                          <Zap className="w-3 h-3" />
                          {Math.round(suggestion.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State Premium */}
      {!loading && !error && suggestions.length === 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-12">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gray-400 blur-xl opacity-20"></div>
              <Sparkles className="relative w-16 h-16 text-gray-400 mx-auto" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-700">
                Prêt à générer des suggestions
              </p>
              <p className="text-sm text-gray-500">
                Cliquez sur "Actualiser" pour obtenir des suggestions personnalisées
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
