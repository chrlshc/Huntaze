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
        'Real-time tracking of monthly goals',
        'AI suggestions to grow revenue by niche',
        'Alerts when you’re close to a milestone',
        'Predictions based on past performance'
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
        'Optimal times by niche (fitness = morning, gaming = evening)',
        'Automatic reminders before peak hours',
        'Visual planner for all your content',
        'Suggestions based on what performs'
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
        'Automatic VIP identification (top 5% driving 80% of revenue)',
        'Alerts for churn‑risk fans',
        'Segment‑based personalized suggestions',
        'Track upgrade potential for each fan'
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
        'Instant replies 24/7 in your style',
        'Sales opportunity detection',
        'Continuously learns your preferences',
        'Alerts for important conversations'
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
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Why Huntaze is a <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Must‑Have</span> 💜</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl">
            Stop giving 50% to agencies. Keep 85% of your earnings and scale with an AI that learns your style.
          </p>

          {/* Key Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <p className="text-3xl font-bold text-purple-600 mb-2">15%</p>
              <p className="text-gray-600">Huntaze commission</p>
              <p className="text-xs text-gray-500">vs 50% agency</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <p className="text-3xl font-bold text-pink-600 mb-2">87%</p>
              <p className="text-gray-600">Automated messages</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <p className="text-3xl font-bold text-purple-600 mb-2">2h/jour</p>
              <p className="text-gray-600">Time saved</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <p className="text-3xl font-bold text-pink-600 mb-2">+73%</p>
              <p className="text-gray-600">Avg. revenue lift</p>
            </div>
          </div>
        </div>
      </div>

      {/* How Widgets Help Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How These Widgets Transform Your Business</h2>
          <p className="text-xl text-gray-600">Each widget is designed to solve a real creator problem.</p>
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
          <div className="bg-white rounded-2xl shadow-xl p-8">
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
                <li className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400" />
                  <span>Chatters who don’t know your personality</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400" />
                  <span>No data on what truly works</span>
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
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Personalized replies that convert</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Detailed analytics to optimize</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Success Stories */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">What creators say about Huntaze</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <img src="https://ui-avatars.com/api/?name=Sophie+M&background=gradient" className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-semibold">Sophie M.</p>
                <p className="text-sm text-gray-500">Fitness Creator</p>
              </div>
            </div>
            <p className="text-gray-700 mb-3">"I tripled my revenue in 2 months! The AI answers exactly like me— my fans don’t notice the difference. Now I focus on creating."</p>
            <p className="text-sm font-semibold text-purple-600">+$12K/mo since Huntaze</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <img src="https://ui-avatars.com/api/?name=Luna+R&background=gradient" className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-semibold">Luna R.</p>
                <p className="text-sm text-gray-500">Gaming Creator</p>
              </div>
            </div>
            <p className="text-gray-700 mb-3">"The widgets show exactly when to post and who to engage. I finally understand who my true VIP fans are!"</p>
            <p className="text-sm font-semibold text-purple-600">87% automation</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <img src="https://ui-avatars.com/api/?name=Mia+K&background=gradient" className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-semibold">Mia K.</p>
                <p className="text-sm text-gray-500">Lifestyle Creator</p>
              </div>
            </div>
            <p className="text-gray-700 mb-3">"I used to pay 50% to an agency for bad replies. Now it’s 15% and the AI is 10x better!"</p>
            <p className="text-sm font-semibold text-purple-600">35% commission saved</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to keep 85% instead of 50%? 💰</h2>
          <p className="text-xl mb-8 opacity-90">
            Join creators who took back control of their business
            <br />
            <span className="text-sm opacity-75">Huntaze commission: just 15% vs 50% with agencies</span>
          </p>
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
          <p className="mt-4 text-sm opacity-75">No card required • 5‑minute setup • Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}
