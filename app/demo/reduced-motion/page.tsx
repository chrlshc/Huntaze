'use client';

import { useState } from 'react';
import { ArrowLeft, Play, Pause, Info } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useReducedMotion, useAnimationDuration, useAnimationConfig } from '../../../src/hooks/useReducedMotion';

/**
 * Reduced Motion Demo
 * 
 * Demonstrates respect for prefers-reduced-motion preference.
 * Requirements: 4.8
 */

export default function ReducedMotionDemo() {
  const prefersReducedMotion = useReducedMotion();
  const [isAnimating, setIsAnimating] = useState(false);
  
  const animationDuration = useAnimationDuration(1);
  const fadeConfig = useAnimationConfig({
    duration: 0.6,
    ease: 'easeOut' as const,
  });

  const handleAnimate = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 2000);
  };

  return (
    <div className="min-h-screen bg-theme-bg p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/demo/scroll-reveal"
            className="p-2 rounded-lg hover:bg-theme-border/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-theme-text" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-theme-text">Reduced Motion Support</h1>
            <p className="text-theme-muted mt-1">
              Respects user's motion preferences
            </p>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`p-4 rounded-xl border ${
          prefersReducedMotion 
            ? 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400'
            : 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
        }`}>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">
                {prefersReducedMotion ? 'Reduced Motion Enabled' : 'Normal Motion Enabled'}
              </h3>
              <p className="text-sm opacity-90">
                {prefersReducedMotion 
                  ? 'Animations are disabled or minimized based on your system preferences.'
                  : 'All animations are enabled. You can disable them in your system settings.'}
              </p>
            </div>
          </div>
        </div>

        {/* How to Test */}
        <div className="bg-theme-surface rounded-xl p-6 border border-theme-border">
          <h2 className="text-xl font-semibold text-theme-text mb-4">
            How to Test
          </h2>
          <div className="space-y-4 text-sm text-theme-muted">
            <div>
              <h3 className="font-medium text-theme-text mb-2">macOS:</h3>
              <p>System Preferences → Accessibility → Display → Reduce motion</p>
            </div>
            <div>
              <h3 className="font-medium text-theme-text mb-2">Windows:</h3>
              <p>Settings → Ease of Access → Display → Show animations in Windows</p>
            </div>
            <div>
              <h3 className="font-medium text-theme-text mb-2">iOS:</h3>
              <p>Settings → Accessibility → Motion → Reduce Motion</p>
            </div>
            <div>
              <h3 className="font-medium text-theme-text mb-2">Android:</h3>
              <p>Settings → Accessibility → Remove animations</p>
            </div>
          </div>
        </div>

        {/* Animation Examples */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-theme-text">Animation Examples</h2>
          
          {/* Fade Animation */}
          <div className="bg-theme-surface rounded-xl p-6 border border-theme-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-theme-text">Fade Animation</h3>
              <button
                onClick={handleAnimate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                Animate
              </button>
            </div>
            <div className="flex justify-center py-8">
              <motion.div
                key={isAnimating ? 'animating' : 'idle'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={fadeConfig}
                className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold"
              >
                Fade In
              </motion.div>
            </div>
            <p className="text-sm text-theme-muted text-center">
              Duration: {prefersReducedMotion ? '0.01s (instant)' : '0.6s'}
            </p>
          </div>

          {/* Slide Animation */}
          <div className="bg-theme-surface rounded-xl p-6 border border-theme-border">
            <h3 className="font-semibold text-theme-text mb-4">Slide Animation</h3>
            <div className="flex justify-center py-8">
              <motion.div
                animate={{
                  x: isAnimating ? 100 : 0,
                }}
                transition={{
                  duration: animationDuration,
                  ease: 'easeInOut',
                }}
                className="w-32 h-32 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-semibold"
              >
                Slide
              </motion.div>
            </div>
            <p className="text-sm text-theme-muted text-center">
              Duration: {prefersReducedMotion ? '0.01s (instant)' : '1s'}
            </p>
          </div>

          {/* Scale Animation */}
          <div className="bg-theme-surface rounded-xl p-6 border border-theme-border">
            <h3 className="font-semibold text-theme-text mb-4">Scale Animation</h3>
            <div className="flex justify-center py-8">
              <motion.div
                animate={{
                  scale: isAnimating ? 1.2 : 1,
                }}
                transition={{
                  duration: animationDuration,
                  ease: 'easeInOut',
                }}
                className="w-32 h-32 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white font-semibold"
              >
                Scale
              </motion.div>
            </div>
            <p className="text-sm text-theme-muted text-center">
              Duration: {prefersReducedMotion ? '0.01s (instant)' : '1s'}
            </p>
          </div>

          {/* Rotate Animation */}
          <div className="bg-theme-surface rounded-xl p-6 border border-theme-border">
            <h3 className="font-semibold text-theme-text mb-4">Rotate Animation</h3>
            <div className="flex justify-center py-8">
              <motion.div
                animate={{
                  rotate: isAnimating ? 360 : 0,
                }}
                transition={{
                  duration: animationDuration,
                  ease: 'linear',
                }}
                className="w-32 h-32 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold"
              >
                Rotate
              </motion.div>
            </div>
            <p className="text-sm text-theme-muted text-center">
              Duration: {prefersReducedMotion ? '0.01s (instant)' : '1s'}
            </p>
          </div>
        </div>

        {/* CSS Implementation */}
        <div className="bg-theme-surface rounded-xl p-6 border border-theme-border">
          <h2 className="text-xl font-semibold text-theme-text mb-4">
            CSS Implementation
          </h2>
          <p className="text-sm text-theme-muted mb-4">
            The global CSS includes a media query that disables all animations when reduced motion is preferred:
          </p>
          <pre className="bg-theme-bg p-4 rounded-lg overflow-x-auto text-sm">
            <code className="text-theme-text">{`@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}`}</code>
          </pre>
        </div>

        {/* React Hook Usage */}
        <div className="bg-theme-surface rounded-xl p-6 border border-theme-border">
          <h2 className="text-xl font-semibold text-theme-text mb-4">
            React Hook Usage
          </h2>
          <pre className="bg-theme-bg p-4 rounded-lg overflow-x-auto text-sm">
            <code className="text-theme-text">{`import { useReducedMotion, useAnimationDuration } from '@/hooks/useReducedMotion';

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();
  const duration = useAnimationDuration(1); // 1s or 0.01s
  
  return (
    <motion.div
      animate={{ x: 100 }}
      transition={{ duration }}
    >
      {prefersReducedMotion ? 'No animation' : 'Animated'}
    </motion.div>
  );
}`}</code>
          </pre>
        </div>

        {/* Best Practices */}
        <div className="bg-theme-surface rounded-xl p-6 border border-theme-border">
          <h2 className="text-xl font-semibold text-theme-text mb-4">
            Best Practices
          </h2>
          <ul className="space-y-3 text-sm text-theme-muted">
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                ✓
              </div>
              <span>Always respect the user's motion preference</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                ✓
              </div>
              <span>Use instant transitions (0.01ms) instead of removing animations entirely</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                ✓
              </div>
              <span>Test your application with reduced motion enabled</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                ✓
              </div>
              <span>Ensure functionality works without animations</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-5 h-5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                ✓
              </div>
              <span>Consider users with vestibular disorders and motion sensitivity</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
