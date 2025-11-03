'use client';

import { TouchTarget, IconButton } from '@/components/ui/TouchTarget';
import { useState } from 'react';

export default function TouchTargetsDemo() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1A1A1A] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Touch Target Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            All interactive elements meet WCAG 2.2 minimum touch target size (44×44px)
          </p>
        </div>

        {/* Button Variants */}
        <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Button Variants
          </h2>
          <div className="flex flex-wrap gap-4">
            <TouchTarget variant="primary">Primary Button</TouchTarget>
            <TouchTarget variant="secondary">Secondary Button</TouchTarget>
            <TouchTarget variant="ghost">Ghost Button</TouchTarget>
            <TouchTarget variant="danger">Danger Button</TouchTarget>
          </div>
        </div>

        {/* Button Sizes */}
        <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Button Sizes (All ≥44px)
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <TouchTarget variant="primary" size="sm">
              Small (44px)
            </TouchTarget>
            <TouchTarget variant="primary" size="md">
              Medium (44px)
            </TouchTarget>
            <TouchTarget variant="primary" size="lg">
              Large (48px)
            </TouchTarget>
          </div>
        </div>

        {/* Icon Buttons */}
        <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Icon Buttons (44×44px minimum)
          </h2>
          <div className="flex flex-wrap gap-4">
            <IconButton label="Close" size="sm">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </IconButton>
            <IconButton label="Menu" size="md">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </IconButton>
            <IconButton label="Settings" size="lg">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </IconButton>
          </div>
        </div>

        {/* Interactive Counter */}
        <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Interactive Example
          </h2>
          <div className="flex items-center gap-4">
            <IconButton
              label="Decrease"
              onClick={() => setCount(count - 1)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </IconButton>
            <span className="text-3xl font-bold text-gray-900 dark:text-white min-w-[60px] text-center">
              {count}
            </span>
            <IconButton
              label="Increase"
              onClick={() => setCount(count + 1)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </IconButton>
            <TouchTarget
              variant="secondary"
              onClick={() => setCount(0)}
            >
              Reset
            </TouchTarget>
          </div>
        </div>

        {/* Full Width Buttons */}
        <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Full Width Buttons
          </h2>
          <div className="space-y-3">
            <TouchTarget variant="primary" fullWidth>
              Primary Full Width
            </TouchTarget>
            <TouchTarget variant="secondary" fullWidth>
              Secondary Full Width
            </TouchTarget>
          </div>
        </div>

        {/* CSS Utility Classes */}
        <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            CSS Utility Classes
          </h2>
          <div className="flex flex-wrap gap-4">
            <button className="touch-target bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              .touch-target
            </button>
            <button className="touch-target-lg bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              .touch-target-lg
            </button>
            <button className="touch-target-icon bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Guidelines */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
            WCAG 2.2 Touch Target Guidelines
          </h3>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p>
              <strong>Minimum Size:</strong> All touch targets must be at least 44×44 CSS pixels
            </p>
            <p>
              <strong>Spacing:</strong> Maintain adequate spacing between touch targets to prevent accidental activation
            </p>
            <p>
              <strong>Visual Feedback:</strong> Provide clear hover and active states for all interactive elements
            </p>
            <p>
              <strong>Focus Indicators:</strong> Ensure keyboard focus is clearly visible with focus rings
            </p>
            <p className="mt-4">
              <strong>Implementation:</strong> Use the <code className="bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">TouchTarget</code> component or{' '}
              <code className="bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">.touch-target</code> CSS class to ensure compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
