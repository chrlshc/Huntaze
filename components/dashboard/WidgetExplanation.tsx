'use client';

import { useState } from 'react';
import { X, Info, DollarSign, Calendar, Users, Brain } from 'lucide-react';

interface WidgetExplanationProps {
  widgetName: string;
  onClose?: () => void;
}

export function WidgetExplanation({ widgetName, onClose }: WidgetExplanationProps) {
  const explanations: Record<string, {
    title: string;
    icon: any;
    problem: string;
    solution: string;
    benefits: string[];
    example: string;
  }> = {
    'revenue': {
      title: 'Revenue Goal Widget',
      icon: DollarSign,
      problem: 'It’s hard to know if you are on track to hit your revenue goals',
      solution: 'Real-time tracking with AI predictions and tailored suggestions',
      benefits: [
        'See exactly how much to earn per day to hit your goal',
        'AI suggestions based on your niche (fitness, gaming, etc.)',
        'Alerts when you approach key milestones',
        'Compare against your best historical periods'
      ],
      example: 'If you’re in fitness, AI might suggest a "Summer Body" promo in May when your audience typically spends the most.'
    },
    'calendar': {
      title: 'Content Calendar Widget',
      icon: Calendar,
      problem: 'Posting at the wrong times costs you reach and revenue',
      solution: 'Smart scheduling that adapts to your niche and timezone',
      benefits: [
        'Optimal posting windows by niche (e.g., fitness = 6–8am, gaming = 8–11pm)',
        'Reminders before your audience’s peak hours',
        'Clear overview of your scheduled content',
        'Content suggestions based on trends'
      ],
      example: 'For a gaming creator, AI detects fans are 3x more active Friday night and suggests a 9pm stream.'
    },
    'fans': {
      title: 'Fan Engagement Widget',
      icon: Users,
      problem: 'Treating all fans the same misses the top 5% that drive 80% of revenue',
      solution: 'Automatic AI segmentation with tailored strategies',
      benefits: [
        'Instantly identify VIPs',
        'Spot who is at risk of churn',
        'Personalized message suggestions by segment',
        'Track the upsell potential of each fan'
      ],
      example: 'AI flags “John” spending $300/mo and suggests exclusive content to retain him.'
    },
    'performance': {
      title: 'AI Performance Widget',
      icon: Brain,
      problem: 'You spend hours responding to repetitive messages',
      solution: 'AI replies in your style while you create content',
      benefits: [
        '24/7 responses—even while you sleep',
        'Continuously learns your unique style',
        'Automatically detects sales opportunities',
        'Detailed metrics on what converts'
      ],
      example: 'A fan asks “Do you do customs?” at 3am. AI answers in your style, proposes pricing—and you wake up to a sale.'
    }
  };

  const widget = explanations[widgetName];
  if (!widget) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <widget.icon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{widget.title}</h2>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Problem */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
              ❌ The Problem
            </h3>
            <p className="text-red-700">{widget.problem}</p>
          </div>

          {/* Solution */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              ✅ The Huntaze Solution
            </h3>
            <p className="text-green-700">{widget.solution}</p>
          </div>

          {/* Benefits */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">What you get:</h3>
            <ul className="space-y-2">
              {widget.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold">•</span>
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Real Example */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
            <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
              💡 Real Example
            </h3>
            <p className="text-purple-700">{widget.example}</p>
          </div>

          {/* CTA */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600 mb-2">That’s the difference between making $5K and $25K per month.</p>
            {onClose && (
              <button 
                onClick={onClose}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Got it — show me my stats!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
