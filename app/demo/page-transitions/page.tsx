'use client';

import { useState } from 'react';
import { PageTransition, FadeTransition, SlideTransition } from '@/components/layout/AppShell';
import { TouchTarget } from '@/components/ui/TouchTarget';

export default function PageTransitionsDemo() {
  const [activeTab, setActiveTab] = useState<'fade' | 'slide' | 'page'>('page');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1A1A1A] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Page Transitions Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Smooth animations powered by Framer Motion AnimatePresence
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-2 mb-6 inline-flex gap-2">
          <TouchTarget
            variant={activeTab === 'page' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('page')}
          >
            Page Transition
          </TouchTarget>
          <TouchTarget
            variant={activeTab === 'fade' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('fade')}
          >
            Fade Transition
          </TouchTarget>
          <TouchTarget
            variant={activeTab === 'slide' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('slide')}
          >
            Slide Transition
          </TouchTarget>
        </div>

        {/* Content Area */}
        {activeTab === 'page' && (
          <PageTransition>
            <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Page Transition
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This is the default page transition used throughout the app. It combines
                fade and slide animations for a smooth, professional feel.
              </p>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                  Animation Properties
                </h3>
                <ul className="space-y-1 text-sm text-indigo-800 dark:text-indigo-200">
                  <li>• Initial: opacity 0, y: 8px</li>
                  <li>• Animate: opacity 1, y: 0</li>
                  <li>• Exit: opacity 0, y: -8px</li>
                  <li>• Duration: 400ms</li>
                  <li>• Easing: easeOut</li>
                </ul>
              </div>
            </div>
          </PageTransition>
        )}

        {activeTab === 'fade' && (
          <FadeTransition>
            <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Fade Transition
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                A simple fade transition that's perfect for subtle content changes.
                Great for modals, tooltips, and overlays.
              </p>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">
                  Animation Properties
                </h3>
                <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
                  <li>• Initial: opacity 0</li>
                  <li>• Animate: opacity 1</li>
                  <li>• Exit: opacity 0</li>
                  <li>• Duration: 300ms</li>
                  <li>• Optional delay support</li>
                </ul>
              </div>
            </div>
          </FadeTransition>
        )}

        {activeTab === 'slide' && (
          <SlideTransition direction="up">
            <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Slide Transition
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Directional slide transitions that can move from any direction.
                Perfect for drawers, sidebars, and sequential content.
              </p>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                  Animation Properties
                </h3>
                <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
                  <li>• Directions: left, right, up, down</li>
                  <li>• Initial: opacity 0 + directional offset</li>
                  <li>• Animate: opacity 1, position 0</li>
                  <li>• Exit: opacity 0 + directional offset</li>
                  <li>• Duration: 400ms</li>
                  <li>• Easing: easeOut</li>
                </ul>
              </div>
            </div>
          </SlideTransition>
        )}

        {/* Examples Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <FadeTransition delay={0.1}>
            <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Fast Performance
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Optimized animations that maintain 60fps
              </p>
            </div>
          </FadeTransition>

          <FadeTransition delay={0.2}>
            <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Smooth Transitions
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Professional easing curves for natural motion
              </p>
            </div>
          </FadeTransition>

          <FadeTransition delay={0.3}>
            <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Customizable
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Flexible API with delays and directions
              </p>
            </div>
          </FadeTransition>
        </div>

        {/* Implementation Guide */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
            Implementation Guide
          </h3>
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <strong>AppShell Component:</strong> Wrap your app layout with AppShell
              to enable automatic page transitions based on route changes
            </div>
            <div>
              <strong>PageTransition:</strong> Use for main content areas that need
              smooth transitions
            </div>
            <div>
              <strong>FadeTransition:</strong> Use for subtle content changes, supports
              delay prop
            </div>
            <div>
              <strong>SlideTransition:</strong> Use for directional animations, supports
              4 directions
            </div>
            <div className="mt-4 bg-blue-100 dark:bg-blue-900/40 rounded p-3">
              <strong>AnimatePresence:</strong> All transitions use mode="wait" to
              ensure smooth exit/enter animations
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
