'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TouchTarget, IconButton } from '@/components/ui/TouchTarget';

export default function ButtonInteractionsDemo() {
  const [clickCount, setClickCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1A1A1A] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Button Micro-Interactions Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Hover and click buttons to see smooth scale animations
          </p>
        </div>

        {/* Button Variants */}
        <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Button Variants with Micro-Interactions
          </h2>
          <div className="flex flex-wrap gap-4">
            <TouchTarget variant="primary">Primary Button</TouchTarget>
            <TouchTarget variant="secondary">Secondary Button</TouchTarget>
            <TouchTarget variant="ghost">Ghost Button</TouchTarget>
            <TouchTarget variant="danger">Danger Button</TouchTarget>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Hover: scale(1.05) | Click: scale(0.95)
          </div>
        </div>

        {/* Icon Buttons */}
        <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Icon Buttons with Enhanced Interactions
          </h2>
          <div className="flex flex-wrap gap-4">
            <IconButton label="Heart">
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
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </IconButton>
            <IconButton label="Star">
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
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </IconButton>
            <IconButton label="Share">
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
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </IconButton>
            <IconButton label="Bookmark">
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
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </IconButton>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Hover: scale(1.1) | Click: scale(0.9)
          </div>
        </div>

        {/* Interactive Counter */}
        <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Interactive Counter
          </h2>
          <div className="flex items-center justify-center gap-6">
            <TouchTarget
              variant="secondary"
              onClick={() => setClickCount(Math.max(0, clickCount - 1))}
            >
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
                  d="M20 12H4"
                />
              </svg>
            </TouchTarget>
            
            <motion.div
              key={clickCount}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 min-w-[100px] text-center"
            >
              {clickCount}
            </motion.div>
            
            <TouchTarget
              variant="primary"
              onClick={() => setClickCount(clickCount + 1)}
            >
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </TouchTarget>
          </div>
          <div className="mt-4 text-center">
            <TouchTarget
              variant="ghost"
              size="sm"
              onClick={() => setClickCount(0)}
            >
              Reset Counter
            </TouchTarget>
          </div>
        </div>

        {/* Custom Animations */}
        <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Custom Animation Examples
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <motion.button
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg"
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95, rotate: -2 }}
            >
              Rotate on Hover
            </motion.button>
            
            <motion.button
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-lg"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95, y: 0 }}
            >
              Lift on Hover
            </motion.button>
            
            <motion.button
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg"
              whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
              whileTap={{ scale: 0.95 }}
            >
              Shadow on Hover
            </motion.button>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
            Animation Properties
          </h3>
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <strong>whileHover:</strong> Triggered when mouse enters the button
            </div>
            <div>
              <strong>whileTap:</strong> Triggered when button is pressed
            </div>
            <div>
              <strong>Spring Physics:</strong> stiffness: 400, damping: 17
            </div>
            <div>
              <strong>Scale Values:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Buttons: hover 1.05, tap 0.95</li>
                <li>Icon Buttons: hover 1.1, tap 0.9</li>
              </ul>
            </div>
            <div className="mt-4 bg-blue-100 dark:bg-blue-900/40 rounded p-3">
              <strong>Performance:</strong> All animations use GPU-accelerated
              transforms (scale, rotate, translate) for smooth 60fps performance
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
