'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, DollarSign, Calendar, Users, Brain, Target, Zap, 
  ChevronRight, ArrowRight, Check, Sparkles, Shield, Clock,
  MessageSquare, BarChart3, Bell, Heart, X
} from 'lucide-react';

export default function WhyHuntazePage() {
  const [activeWidget, setActiveWidget] = useState(0);

  const widgets = [
    {
      title: 'Revenue Goal Widget',
      icon: DollarSign,
      color: 'purple',
      problem: 'Paying 50% to an agency destroys your margins',
      solution: 'Keep your earnings with personalized AI insights',
      features: [
        'Track monthly goals in real time',
        'AI tips by niche',
        'Milestone alerts'
      ],
      impact: '+73% average revenue lift after 3 months'
    },
    {
      title: 'Content Calendar Widget',
      icon: Calendar,
      color: 'blue',
      problem: 'Inconsistent posting loses fans and revenue',
      solution: 'Never miss your optimal posting windows',
      features: [
        'Best posting times by niche',
        'Smart reminders',
        'Simple visual planner'
      ],
      impact: '3x more engagement at peak times'
    },
    {
      title: 'Fan Engagement Widget',
      icon: Users,
      color: 'pink',
      problem: 'Not knowing your top fans leaves money on the table',
      solution: 'AI segmentation to maximize each relationship',
      features: [
        'Auto‑detect VIP fans',
        'Churn alerts',
        'Personalized suggestions'
      ],
      impact: '+45% retention among top fans'
    },
    {
      title: 'AI Performance Widget',
      icon: Brain,
      color: 'green',
      problem: 'Replying to every message takes hours',
      solution: 'AI replies like you—even while you sleep',
      features: [
        '24/7 replies in your style',
        'Detects sales moments',
        'Learns your preferences'
      ],
      impact: '87% automation, ~2 hours saved/day'
    }
  ];

  const currentWidget = widgets[activeWidget];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-12">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-8">
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to dashboard
          </Link>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Why creators choose Huntaze</h1>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl">Keep more of your earnings. Automate chats with AI that sounds like you.</p>
        </div>
      </div>

      {/* How Widgets Help Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">How Huntaze helps</h2>
          <p className="text-base text-gray-600">Clear tools for real problems.</p>
        </div>

        {/* Widget Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Widget Selector */}
          <div className="space-y-4">
            {widgets.map((widget, index) => (
              <button
                key={index}
                onClick={() => setActiveWidget(index)}
                className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
                  activeWidget === index 
                    ? 'border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-${widget.color}-100`}>
                    <widget.icon className={`w-6 h-6 text-${widget.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">{widget.title}</h3>
                    <p className="text-sm text-red-600 mb-1">❌ {widget.problem}</p>
                    <p className="text-sm text-green-600">✅ {widget.solution}</p>
                  </div>
                  {activeWidget === index && (
                    <ChevronRight className="w-5 h-5 text-purple-600 mt-1" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Active Widget Details */}
          <div className="elevated-card rounded-2xl p-8">
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-${currentWidget.color}-100 rounded-lg mb-6`}>
              <currentWidget.icon className={`w-5 h-5 text-${currentWidget.color}-600`} />
              <span className={`font-semibold text-${currentWidget.color}-700`}>{currentWidget.title}</span>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">What it does for you:</h3>

            <ul className="space-y-3 mb-6">
              {currentWidget.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
              <p className="text-sm font-semibold text-purple-900 mb-1">Average impact:</p>
              <p className="text-lg font-bold text-purple-900">{currentWidget.impact}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Huntaze vs. Traditional Agency</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Agence */}
            <div className="bg-gray-800 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-red-400 mb-6">Traditional Agency 👎</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400" />
                  <span>50% commission on your earnings</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400" />
                  <span>Generic replies that feel fake</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400" />
                  <span>You lose control over your fan relationships</span>
                </li>
              </ul>
            </div>

            {/* Huntaze */}
            <div className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-green-400 mb-6">Huntaze 💜</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Keep 85% of your earnings (vs 50% with agencies)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>AI that learns your unique style</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>You keep full control</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials trimmed for clarity */}

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-14">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Keep more. Do less.</h2>
          <p className="text-base mb-6 opacity-90">Switch in minutes. No contracts.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:shadow-xl transition-all">
              <Sparkles className="w-5 h-5" />
              Start for free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-purple-700 text-white rounded-xl font-semibold hover:bg-purple-800 transition-all">
              <BarChart3 className="w-5 h-5" />
              View dashboard
            </Link>
          </div>
          <p className="mt-3 text-sm opacity-75">No card • 5‑min setup • Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}
