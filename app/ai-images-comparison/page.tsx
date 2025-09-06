'use client';

import { Image, Sparkles, Zap, Crown } from 'lucide-react';
import Link from 'next/link';

export default function AIImagesComparison() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-4">
            AI Image Generation by Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            See exactly what kind of promotional graphics each AI model can create for your content
          </p>
        </div>

        {/* Visual Examples Grid */}
        <div className="space-y-12">
          {/* Example 1: Sale Banner */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Example: "50% OFF Weekend Sale" Banner
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Starter */}
              <div className="space-y-3">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 h-48 flex items-center justify-center border-2 border-green-200 dark:border-green-800">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-800 dark:text-white">50% OFF</p>
                    <p className="text-gray-600 dark:text-gray-400">This Weekend</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-green-600">STARTER</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">DALL-E 2</p>
                  <p className="text-xs mt-1">Basic text, simple design</p>
                </div>
              </div>

              {/* Pro */}
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-4 h-48 flex items-center justify-center border-2 border-purple-200 dark:border-purple-800">
                  <div className="text-center text-white">
                    <p className="text-4xl font-black">50% OFF</p>
                    <p className="text-lg">✨ WEEKEND ONLY ✨</p>
                    <div className="mt-2 bg-white/20 backdrop-blur rounded-full px-3 py-1 text-sm">
                      Limited Time
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-purple-600">PRO</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">DALL-E 3</p>
                  <p className="text-xs mt-1">Gradients, better typography</p>
                </div>
              </div>

              {/* Scale */}
              <div className="space-y-3">
                <div className="relative rounded-xl h-48 overflow-hidden border-2 border-blue-200 dark:border-blue-800">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <p className="text-5xl font-black drop-shadow-lg">50% OFF</p>
                      <p className="text-xl font-bold mt-2">FLASH SALE</p>
                      <div className="mt-3 flex gap-2 justify-center">
                        <span className="bg-white/30 backdrop-blur px-2 py-1 rounded text-xs">48 HOURS</span>
                        <span className="bg-white/30 backdrop-blur px-2 py-1 rounded text-xs">VIP ONLY</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-blue-600">SCALE</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">DALL-E 3 HD</p>
                  <p className="text-xs mt-1">Professional, eye-catching</p>
                </div>
              </div>

              {/* Enterprise */}
              <div className="space-y-3">
                <div className="relative rounded-xl h-48 overflow-hidden border-2 border-yellow-200 dark:border-yellow-800">
                  <div className="absolute inset-0 bg-gradient-to-br from-black to-gray-900" />
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(251, 191, 36, 0.4) 0%, transparent 50%)',
                  }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-6xl font-black bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                        50% OFF
                      </p>
                      <p className="text-white/90 text-sm tracking-[0.3em] mt-2">EXCLUSIVE ACCESS</p>
                      <div className="mt-4 border border-yellow-400/50 rounded px-4 py-1 text-yellow-400 text-xs">
                        ENTER: GOLD50
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-yellow-600">ENTERPRISE</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Midjourney V6</p>
                  <p className="text-xs mt-1">Luxury brand quality</p>
                </div>
              </div>
            </div>
          </div>

          {/* Example 2: Tip Menu */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Example: Tip Menu Design
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Starter */}
              <div className="space-y-3">
                <div className="bg-white dark:bg-gray-700 rounded-xl p-4 h-64 border border-gray-300 dark:border-gray-600">
                  <h3 className="font-bold mb-3">TIP MENU</h3>
                  <ul className="space-y-2 text-sm">
                    <li>Good morning - $5</li>
                    <li>Rate outfit - $10</li>
                    <li>Special request - $25</li>
                    <li>Make my day - $50</li>
                  </ul>
                </div>
                <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                  Basic list format
                </p>
              </div>

              {/* Pro */}
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 h-64 border border-purple-300 dark:border-purple-700">
                  <h3 className="font-bold mb-3 text-purple-800 dark:text-purple-200 text-center">
                    💕 TIP MENU 💕
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                      <span className="text-sm">Good morning ☀️</span>
                      <span className="font-bold text-purple-600">$5</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                      <span className="text-sm">Rate outfit 👗</span>
                      <span className="font-bold text-purple-600">$10</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                      <span className="text-sm">Special request 🎁</span>
                      <span className="font-bold text-purple-600">$25</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                  Styled with colors & emojis
                </p>
              </div>

              {/* Scale */}
              <div className="space-y-3">
                <div className="relative rounded-xl h-64 overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-600 p-[2px]">
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-4 h-full">
                    <h3 className="font-black text-center mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      EXCLUSIVE TIP MENU
                    </h3>
                    <div className="space-y-3">
                      {['Good Morning ☀️|$5|text-yellow-500', 'Rate My Outfit 👗|$10|text-pink-500', 'Special Request 🎁|$25|text-purple-500', 'Spoil Me 👑|$100|text-yellow-500'].map((item, i) => {
                        const [text, price, color] = item.split('|');
                        return (
                          <div key={i} className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative flex justify-between items-center p-2">
                              <span className="font-medium">{text}</span>
                              <span className={`font-bold ${color}`}>{price}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                  Interactive, premium feel
                </p>
              </div>

              {/* Enterprise */}
              <div className="space-y-3">
                <div className="relative rounded-xl h-64 overflow-hidden">
                  <div className="absolute inset-0 bg-black" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-yellow-600/30 to-transparent" />
                  <div className="relative p-6 h-full flex flex-col">
                    <h3 className="text-center mb-auto">
                      <span className="text-xs text-yellow-400 tracking-[0.3em]">EXCLUSIVE</span>
                      <br />
                      <span className="text-xl font-black text-white">TIP MENU</span>
                    </h3>
                    <div className="space-y-2 text-white">
                      {[
                        ['MORNING LOVE', '$5'],
                        ['STYLE CHECK', '$10'],
                        ['SURPRISE ME', '$25'],
                        ['VIP TREATMENT', '$100']
                      ].map(([text, price], i) => (
                        <div key={i} className="flex justify-between items-center border-b border-white/10 pb-2">
                          <span className="text-xs tracking-wider">{text}</span>
                          <span className="text-yellow-400 font-bold">{price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                  Luxury brand aesthetic
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-16 bg-gray-100 dark:bg-gray-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Why Image Quality Matters</h2>
          
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <h3 className="font-bold mb-2">First Impressions</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Pro graphics = Pro creator. Fans judge quality in seconds.
              </p>
            </div>
            
            <div>
              <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-3" />
              <h3 className="font-bold mb-2">Higher Conversions</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Better visuals = 3-5x more clicks and purchases.
              </p>
            </div>
            
            <div>
              <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <h3 className="font-bold mb-2">Brand Building</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Consistent quality builds premium brand perception.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link href="/pricing">
            <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full hover:shadow-xl transform hover:-translate-y-1 transition-all">
              Get The AI That Matches Your Standards →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}