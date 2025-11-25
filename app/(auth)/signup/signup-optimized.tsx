/**
 * Optimized Signup Page Component
 * 
 * Performance optimizations:
 * - Code splitting with dynamic imports
 * - Critical CSS inlined
 * - Resource preloading
 * - Performance monitoring
 * 
 * Requirements: 11.1, 11.2, 11.4, 11.5
 */

'use client';

import { useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { SignupPerformanceMonitor } from '@/lib/performance/signup-optimization';

// Lazy load heavy components
const SignupForm = dynamic(
  () => import('@/components/auth/SignupForm').then(mod => ({ default: mod.SignupForm })),
  {
    loading: () => <SignupFormSkeleton />,
    ssr: false, // Client-side only for better code splitting
  }
);

// Skeleton loader for signup form
function SignupFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Social buttons skeleton */}
      <div className="space-y-3">
        <div className="h-12 bg-gray-200 rounded-lg" />
        <div className="h-12 bg-gray-200 rounded-lg" />
      </div>
      
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-400">
            or continue with email
          </span>
        </div>
      </div>
      
      {/* Email form skeleton */}
      <div className="space-y-4">
        <div>
          <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-12 bg-gray-200 rounded-lg" />
        </div>
        <div className="h-12 bg-gray-200 rounded-lg" />
        <div className="h-4 w-48 bg-gray-200 rounded mx-auto" />
      </div>
    </div>
  );
}

interface SignupOptimizedProps {
  redirectTo?: string;
}

export function SignupOptimized({ redirectTo }: SignupOptimizedProps) {
  useEffect(() => {
    // Mark component mount
    SignupPerformanceMonitor.mark('signup-component-mount');
    
    // Track Core Web Vitals
    SignupPerformanceMonitor.getCoreWebVitals().then((vitals) => {
      console.log('📊 Core Web Vitals:', vitals);
      
      // Send to analytics if needed
      if (vitals.fcp) {
        // Track FCP
      }
    });
    
    // Cleanup
    return () => {
      const mountDuration = SignupPerformanceMonitor.measure(
        'signup-component-duration',
        'signup-component-mount'
      );
      
      if (mountDuration) {
        console.log(`⏱️  Signup component was active for ${mountDuration.toFixed(0)}ms`);
      }
    };
  }, []);
  
  return (
    <Suspense fallback={<SignupFormSkeleton />}>
      <SignupForm redirectTo={redirectTo} />
    </Suspense>
  );
}
