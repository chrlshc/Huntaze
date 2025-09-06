'use client';

import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ContentModerationUI } from '@/components/moderation/ContentModerationUI';
import { RFMDashboard } from '@/components/analytics/RFMDashboard';

export default function ContentModerationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <span className="font-semibold">Content Moderation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Moderation Tool */}
          <div className="lg:col-span-2">
            <ContentModerationUI />
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Platform Guidelines */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Platform Guidelines</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="font-medium text-sm">Instagram & TikTok</span>
                  </div>
                  <p className="text-xs text-gray-600 pl-4">
                    No nudity, suggestive content limited, strict enforcement
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="font-medium text-sm">Reddit</span>
                  </div>
                  <p className="text-xs text-gray-600 pl-4">
                    Varies by subreddit, NSFW content allowed in appropriate communities
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-sm">OnlyFans</span>
                  </div>
                  <p className="text-xs text-gray-600 pl-4">
                    Most content allowed, focus on consent and legality
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-bold text-blue-900 mb-3">Quick Tips</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Always check content before cross-posting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Create platform-specific versions when needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Use teaser content for mainstream platforms</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Save explicit content for appropriate platforms</span>
                </li>
              </ul>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Moderation Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Checked Today</span>
                  <span className="font-semibold">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Safe for All</span>
                  <span className="font-semibold text-green-600">18 (75%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Platform Limited</span>
                  <span className="font-semibold text-amber-600">6 (25%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RFM Dashboard */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">Fan Segmentation</h2>
          <RFMDashboard />
        </div>
      </div>
    </div>
  );
}