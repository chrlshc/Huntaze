'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function HeroSimple() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-black">
      <div className="container mx-auto px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Turn your content into
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            predictable revenue
          </span>
        </h1>
        
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          For OnlyFans, Instagram and TikTok creators: AI that replies to fans, 
          optimizes your pricing and schedules your content. Save 20+ hours/week.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link 
            href="/auth"
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold text-lg"
          >
            Start free trial
          </Link>
          <Link 
            href="/demo"
            className="text-gray-400 hover:text-white text-lg"
          >
            Watch demo →
          </Link>
        </div>

        <div className="flex items-center gap-6 justify-center text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-purple-400" />
            14-day free trial
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-purple-400" />
            No credit card
          </div>
        </div>
      </div>
    </section>
  );
}