'use client';

import { CheckCircle, Zap, MessageSquare, DollarSign, Users, BarChart3, Shield, Gift } from 'lucide-react';
import Link from 'next/link';

export default function OnlyFansFeatures() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Zap className="w-5 h-5 text-yellow-300" />
            <span className="text-white font-semibold">Game-Changing AI for OnlyFans</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
            Every OnlyFans Feature You Need
            <span className="block text-3xl md:text-5xl mt-2 text-blue-200">
              Included in ALL Plans - Even Starter!
            </span>
          </h1>
          
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            No feature restrictions. No upsells. Just pick the plan that matches your message volume 
            and revenue. All creators get access to our complete OnlyFans automation suite.
          </p>
          
          <Link href="/pricing">
            <button className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full hover:shadow-xl transform hover:-translate-y-1 transition-all">
              View Simple Pricing →
            </button>
          </Link>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
              Complete OnlyFans Automation Suite
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Every feature below is available in every plan - from $19 Starter to Enterprise
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* DM Automation */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                24/7 DM Automation
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                AI responds instantly to every message with your personality and style
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">3 AI personalities to choose from</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Contextual responses based on fan profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Natural conversation flow</span>
                </li>
              </ul>
            </div>

            {/* PPV Campaigns */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                PPV & Mass Messages
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Send targeted PPV campaigns to maximize revenue from your content
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Audience segmentation & targeting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Natural sending delays</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Campaign performance tracking</span>
                </li>
              </ul>
            </div>

            {/* Welcome Messages */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Welcome Messages
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Automatically greet new subscribers with personalized messages
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Customizable delays</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Different messages by fan type</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Re-subscriber detection</span>
                </li>
              </ul>
            </div>

            {/* Fan Analytics */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Advanced Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Deep insights into your fans and revenue performance
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Revenue breakdown & trends</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Fan segmentation (whales, spenders)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Conversion rate tracking</span>
                </li>
              </ul>
            </div>

            {/* Fan Management */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Smart Fan Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Automatically categorize and track your fans
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Auto-tagging by spending level</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Engagement tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">VIP identification</span>
                </li>
              </ul>
            </div>

            {/* Security */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-14 h-14 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Platform Safe
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Built to work safely within OnlyFans guidelines
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Browser automation (no API hacks)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Natural delays & rate limiting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">Encrypted session management</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center text-gray-900 dark:text-white mb-12">
            Why We Don't Lock Features
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-700 rounded-xl p-8">
              <h3 className="text-xl font-bold text-red-600 mb-4">
                ❌ What Others Do
              </h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li>• Lock PPV campaigns to higher tiers</li>
                <li>• Charge extra for analytics</li>
                <li>• Limit welcome messages</li>
                <li>• Restrict fan segmentation</li>
                <li>• Make you upgrade for basic features</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-8">
              <h3 className="text-xl font-bold text-green-600 mb-4">
                ✅ What Huntaze Does
              </h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li>• ALL features in EVERY plan</li>
                <li>• Pay only for message volume</li>
                <li>• Commission based on revenue</li>
                <li>• No surprise upgrades needed</li>
                <li>• Grow at your own pace</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
              Just pick the plan that matches your message volume. That's it.
            </p>
            <Link href="/pricing">
              <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full hover:shadow-xl transform hover:-translate-y-1 transition-all">
                See Simple, Honest Pricing
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}