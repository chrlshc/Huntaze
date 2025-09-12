'use client';

import Link from 'next/link';
import { Shield, CheckCircle, Users } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import PlatformLogos from './PlatformLogos';

const FallingLines = dynamic(
  () => import('@/components/FallingLines'),
  { ssr: false }
);

export default function HeroSectionPro() {
  return (
    <section className="relative min-h-[100vh] min-h-[100svh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-950 to-black">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          
          {/* Left: Copy */}
          <div className="text-center lg:text-left">
            {/* Social proof */}
            <div className="flex items-center gap-4 mb-6 justify-center lg:justify-start">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-gray-950"
                  />
                ))}
              </div>
              <p className="text-sm text-gray-400">
                Join <span className="text-white font-semibold">15,000+</span> creators earning more
              </p>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white">
              Turn your content into
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                predictable revenue
              </span>
            </h1>
            
            <p className="text-lg lg:text-xl text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              For OnlyFans, Instagram and TikTok creators: AI that replies to fans, 
              optimizes your pricing and schedules your content.{' '}
              <span className="text-purple-300 font-medium">Save 20+ hours/week without hiring.*</span>
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Link 
                href="/auth"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 text-center shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                Start free trial
              </Link>
              <Link 
                href="/demo"
                className="text-gray-400 hover:text-white text-lg transition-all duration-200 text-center"
              >
                Watch demo →
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400 justify-center lg:justify-start">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                No credit card
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                Cancel anytime
              </div>
            </div>
          </div>

          {/* Right: Product Screenshot */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl" />
              
              {/* Main product mockup */}
              <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 p-8 shadow-2xl">
                {/* Fake browser chrome */}
                <div className="bg-gray-800 rounded-t-lg p-3 flex items-center gap-2 mb-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                  </div>
                  <div className="flex-1 bg-gray-700 rounded px-3 py-1 text-xs text-gray-400 ml-4">
                    app.huntaze.com/dashboard
                  </div>
                </div>
                
                {/* Dashboard preview */}
                <div className="space-y-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <p className="text-xs text-gray-400 mb-1">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-white">$12 847</p>
                      <p className="text-xs text-purple-400 mt-1">+32%*</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <p className="text-xs text-gray-400 mb-1">Active Fans</p>
                      <p className="text-2xl font-bold text-white">1 284</p>
                      <p className="text-xs text-purple-400 mt-1">+89 new</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <p className="text-xs text-gray-400 mb-1">Time Saved</p>
                      <p className="text-2xl font-bold text-white">23.5h</p>
                      <p className="text-xs text-purple-400 mt-1">this week</p>
                    </div>
                  </div>
                  
                  {/* AI Chat preview */}
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                      <p className="text-xs font-medium text-gray-300">AI Assistant Active</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex-shrink-0" />
                        <div className="bg-gray-700 rounded-lg p-2 text-sm text-gray-300">
                          Hey babe! Thanks for subscribing 💕
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-2 text-sm text-purple-300">
                          Can\'t wait to see your exclusive content!
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Single floating metric */}
              <div className="absolute -top-4 -right-4 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl px-4 py-2 shadow-xl">
                <p className="text-xs text-purple-100">Monthly Revenue</p>
                <p className="text-lg font-bold text-white">$12 847</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom logos */}
        <div className="mt-20">
          <PlatformLogos />
        </div>
      </div>
    </section>
  );
}