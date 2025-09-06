'use client';

import { useState } from 'react';
import {
  Brain,
  Info,
  TrendingUp,
  MessageSquare,
  DollarSign,
  Shield,
  BarChart3,
  Target,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Eye,
  Zap
} from 'lucide-react';

export default function AIExplainability() {
  const [expandedDecision, setExpandedDecision] = useState<number | null>(null);
  const [selectedExample, setSelectedExample] = useState(0);
  
  const examples = [
    {
      title: 'PPV Pricing Decision',
      ai: 'Sarah (Sales AI)',
      decision: 'Set price to $35 for beach content PPV',
      confidence: 88,
      outcome: 'success',
      revenue: '$2,345',
      factors: [
        { name: 'Fan spending history', impact: 35, description: 'VIP fan with $450 LTV' },
        { name: 'Content type demand', impact: 25, description: 'Beach content converts 23% better' },
        { name: 'Time of day', impact: 20, description: 'Friday 10PM optimal window' },
        { name: 'Recent engagement', impact: 15, description: 'Fan active in last 24h' },
        { name: 'Price sensitivity', impact: 5, description: 'Fan typically buys $25-40 range' }
      ],
      reasoning: [
        'VIP fans have 78% purchase rate for content under $40',
        'Beach content historically performs 23% above average',
        'Friday evening shows highest conversion rates',
        'Fan\'s recent activity indicates high interest'
      ],
      aiThinking: {
        dataAnalyzed: '450 similar transactions',
        patternsFound: 12,
        confidenceFactors: [
          'Historical accuracy: 91% on similar decisions',
          'Data quality: High (recent, relevant)',
          'Pattern strength: Strong correlation'
        ]
      }
    },
    {
      title: 'Message Response Strategy',
      ai: 'Emma (Messaging AI)',
      decision: 'Use playful + personal approach with PPV tease',
      confidence: 92,
      outcome: 'success',
      conversion: '45%',
      factors: [
        { name: 'Message sentiment', impact: 30, description: 'Positive, engaging tone detected' },
        { name: 'Fan personality match', impact: 30, description: 'Prefers playful interactions' },
        { name: 'Purchase timing', impact: 25, description: '3 days since last purchase' },
        { name: 'Content interest alignment', impact: 15, description: 'Matches stated preferences' }
      ],
      reasoning: [
        'Fan responds 3x better to playful messages',
        'Personal references increase engagement 45%',
        'Optimal timing for re-purchase detected',
        'High interest keywords in original message'
      ],
      aiThinking: {
        dataAnalyzed: '1,247 past conversations',
        patternsFound: 8,
        confidenceFactors: [
          'Response pattern consistency: Very high',
          'Personality profile: Well-established',
          'Success rate with approach: 89%'
        ]
      }
    },
    {
      title: 'Fan Segmentation Update',
      ai: 'Alex (Analytics AI)', 
      decision: 'Move fan from Regular to VIP segment',
      confidence: 95,
      outcome: 'success',
      impact: '+$125/month',
      factors: [
        { name: 'Spending velocity', impact: 40, description: '$150 in last 30 days' },
        { name: 'Engagement frequency', impact: 25, description: 'Daily messages, high open rate' },
        { name: 'Purchase consistency', impact: 20, description: 'Bought 5/6 last PPVs' },
        { name: 'Response quality', impact: 15, description: 'Detailed, enthusiastic messages' }
      ],
      reasoning: [
        'Spending pattern matches VIP profile (top 10%)',
        'Engagement metrics exceed VIP threshold',
        'Purchase behavior indicates low price sensitivity',
        'Communication style shows deep interest'
      ],
      aiThinking: {
        dataAnalyzed: '10,000 fan profiles',
        patternsFound: 15,
        confidenceFactors: [
          'Statistical significance: p < 0.01',
          'Cluster fit: 94% match to VIP group',
          'Predictive accuracy: 96% on similar cases'
        ]
      }
    }
  ];
  
  const currentExample = examples[selectedExample];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">AI Decision Explainability</h2>
            <p className="opacity-90">Understand how your AI team makes decisions</p>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => setSelectedExample(index)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedExample === index
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              {example.title}
            </button>
          ))}
        </div>
      </div>
      
      {/* Decision Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">{currentExample.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              By {currentExample.ai} • Confidence: {currentExample.confidence}%
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-green-600">
              Outcome: {currentExample.outcome === 'success' ? '✓ Success' : 'Pending'}
            </span>
            <span className="text-sm font-bold">
              {currentExample.revenue || currentExample.conversion || currentExample.impact}
            </span>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
          <p className="font-medium flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-yellow-500" />
            Decision
          </p>
          <p className="text-lg">{currentExample.decision}</p>
        </div>
      </div>
      
      {/* Key Factors */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Decision Factors
        </h3>
        
        <div className="space-y-3">
          {currentExample.factors.map((factor, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{factor.name}</span>
                <span className="text-sm text-gray-500">{factor.impact}% impact</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${factor.impact}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{factor.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total factors analyzed: {currentExample.aiThinking.patternsFound} patterns across {currentExample.aiThinking.dataAnalyzed}
          </p>
        </div>
      </div>
      
      {/* AI Reasoning */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            AI Reasoning Process
          </h3>
          
          <div className="space-y-3">
            {currentExample.reasoning.map((reason, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-600">{index + 1}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{reason}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Confidence Calculation
          </h3>
          
          <div className="space-y-3">
            <div className="text-center py-4">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56 * currentExample.confidence / 100} ${2 * Math.PI * 56}`}
                    transform="rotate(-90 64 64)"
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient">
                      <stop offset="0%" stopColor="#9333ea" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute">
                  <p className="text-3xl font-bold">{currentExample.confidence}%</p>
                  <p className="text-xs text-gray-500">Confidence</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              {currentExample.aiThinking.confidenceFactors.map((factor, index) => (
                <p key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {factor}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* How AI Learning Works */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Info className="w-5 h-5" />
          How Our AI Makes Transparent Decisions
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium mb-2">1. Data Analysis</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI analyzes thousands of similar cases, identifying patterns and correlations while respecting privacy.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium mb-2">2. Factor Weighting</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Each factor is weighted based on its historical impact on outcomes, continuously refined through learning.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium mb-2">3. Confidence Score</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI calculates confidence based on data quality, pattern strength, and historical accuracy.
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Human Oversight:</strong> Decisions below 70% confidence or involving amounts over $100 are flagged for human review.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper component
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}