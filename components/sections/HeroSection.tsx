'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';

const FallingLines = dynamic(
  () => import('@/components/FallingLines'),
  { ssr: false }
);

export default function HeroSection() {
  return (
    <section className="relative min-h-[100vh] min-h-[100svh] flex items-center justify-center overflow-hidden bg-white dark:bg-gray-800">
      {/* Falling Lines Effect - centered */}
      <FallingLines />

      <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-sm text-purple-300 px-6 py-3 rounded-full text-sm font-medium mb-8 border border-purple-500/30 purple-glow">
          <Sparkles className="w-4 h-4 text-purple-400" />
          AI-Powered Creator Platform
        </div>
        
        <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
          Turn your content into
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            recurring revenue
          </span>
        </h1>
        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
          Automate fan engagement, maximize earnings, and scale your creator business with AI
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/auth"
            className="text-gray-900 dark:text-white bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 text-center shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]"
          >
            Start Free Trial
          </Link>
          <Link 
            href="/demo"
            className="text-white/90 hover:text-white hover:bg-white/10 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 border border-white/20 text-center"
          >
            Watch Demo
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="flex items-center gap-8 text-sm text-gray-400 mt-12 justify-center">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            No credit card required
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Cancel anytime
          </div>
        </div>
      </div>
    </section>
  );
}