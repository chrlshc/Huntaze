'use client';

import { CheckCircle, XCircle, Zap, Brain, Clock, Image } from 'lucide-react';
import Link from 'next/link';

export default function AIComparison() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            AI Performance by Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Choose the AI power that matches your growth. All plans include full OnlyFans features - 
            the difference is in AI speed, quality, and content generation limits.
          </p>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
            <h3 className="font-bold text-green-600 mb-2">STARTER</h3>
            <p className="text-2xl font-black text-gray-900 dark:text-white mb-1">$19/mo</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Basic AI • 2-5s response</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800">
            <h3 className="font-bold text-purple-600 mb-2">PRO</h3>
            <p className="text-2xl font-black text-gray-900 dark:text-white mb-1">$39/mo</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Standard AI • 1-2s response</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
            <h3 className="font-bold text-blue-600 mb-2">SCALE</h3>
            <p className="text-2xl font-black text-gray-900 dark:text-white mb-1">$79/mo</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Advanced AI • &lt;1s response</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-yellow-200 dark:border-yellow-800">
            <h3 className="font-bold text-yellow-600 mb-2">ENTERPRISE</h3>
            <p className="text-2xl font-black text-gray-900 dark:text-white mb-1">$199/mo</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Premium AI • Instant</p>
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="text-left p-6 font-bold text-gray-900 dark:text-white">Feature</th>
                <th className="text-center p-6 font-bold text-green-600">Starter</th>
                <th className="text-center p-6 font-bold text-purple-600">Pro</th>
                <th className="text-center p-6 font-bold text-blue-600">Scale</th>
                <th className="text-center p-6 font-bold text-yellow-600">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* AI Model Quality */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">AI Model</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Response quality & intelligence</p>
                    </div>
                  </div>
                </td>
                <td className="text-center p-6">
                  <p className="font-medium">Basic</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">GPT-3.5</p>
                </td>
                <td className="text-center p-6">
                  <p className="font-medium">Standard</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">GPT-4</p>
                </td>
                <td className="text-center p-6">
                  <p className="font-medium">Advanced</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">GPT-4 Turbo</p>
                </td>
                <td className="text-center p-6">
                  <p className="font-medium">Premium</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Claude 3/GPT-4+</p>
                </td>
              </tr>

              {/* Response Speed */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Response Speed</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">How fast AI replies</p>
                    </div>
                  </div>
                </td>
                <td className="text-center p-6">
                  <p className="font-medium">2-5 sec</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Economy</p>
                </td>
                <td className="text-center p-6">
                  <p className="font-medium">1-2 sec</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Standard</p>
                </td>
                <td className="text-center p-6">
                  <p className="font-medium">&lt; 1 sec</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Fast</p>
                </td>
                <td className="text-center p-6">
                  <p className="font-medium">Instant</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">&lt; 0.5 sec</p>
                </td>
              </tr>

              {/* Messages */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">AI Messages</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Monthly & daily limits</p>
                    </div>
                  </div>
                </td>
                <td className="text-center p-6">
                  <p className="font-medium">1,000/mo</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">50/day</p>
                </td>
                <td className="text-center p-6">
                  <p className="font-medium">5,000/mo</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">200/day</p>
                </td>
                <td className="text-center p-6">
                  <p className="font-medium">25,000/mo</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">1,000/day</p>
                </td>
                <td className="text-center p-6">
                  <p className="font-medium">Unlimited</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">No limits</p>
                </td>
              </tr>

              {/* Content Generation */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <Image className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Content Creation</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Posts, captions, images</p>
                    </div>
                  </div>
                </td>
                <td className="text-center p-6">
                  <p className="font-medium">30 posts</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">100 captions</p>
                </td>
                <td className="text-center p-6">
                  <p className="font-medium">100 posts</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">500 captions<br/>10 AI images</p>
                </td>
                <td className="text-center p-6">
                  <p className="font-medium">500 posts</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">2000 captions<br/>100 AI images</p>
                </td>
                <td className="text-center p-6">
                  <p className="font-medium">Unlimited</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">1000 AI images</p>
                </td>
              </tr>

              {/* Context Memory */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-6">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Context Memory</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Messages AI remembers</p>
                  </div>
                </td>
                <td className="text-center p-6">5 messages</td>
                <td className="text-center p-6">10 messages</td>
                <td className="text-center p-6">25 messages</td>
                <td className="text-center p-6">Full conversation</td>
              </tr>

              {/* Platforms */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-6">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Platform Integrations</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">OF, IG, Twitter, TikTok, etc</p>
                  </div>
                </td>
                <td className="text-center p-6">1 platform</td>
                <td className="text-center p-6">3 platforms</td>
                <td className="text-center p-6">10 platforms</td>
                <td className="text-center p-6">Unlimited</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            All plans include FULL OnlyFans features. The difference is in AI performance and limits.
          </p>
          <Link href="/pricing">
            <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full hover:shadow-xl transform hover:-translate-y-1 transition-all">
              Choose Your Plan →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
