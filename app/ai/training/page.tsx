'use client';

import Link from 'next/link';
import { 
  ArrowLeft, 
  Sparkles, 
  AlertCircle,
  Info
} from 'lucide-react';

export default function AITrainingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to dashboard</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="font-semibold">AI Training</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Coming Soon Notice */}
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Feature Coming Soon</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Custom AI training is not yet available. This feature will be added soon.
            </p>

            {/* What's Coming */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-left max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">Coming soon:</p>
                  <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    <li>• Customize tone and style</li>
                    <li>• Import example conversations</li>
                    <li>• Custom response rules</li>
                    <li>• Preferred vocabulary and phrases</li>
                    <li>• Real-time testing</li>
                    <li>• Multiple profiles per platform</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Current State */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Currently:</strong> The AI uses pre-trained models that learn from your corrections and validations over time.
              </p>
            </div>

            {/* CTA */}
            <div className="mt-8">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
