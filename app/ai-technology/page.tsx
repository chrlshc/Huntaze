'use client';

import { Brain, Zap, MessageSquare, TrendingUp, Sparkles, Crown } from 'lucide-react';
import Link from 'next/link';

export default function AITechnologyPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20" />
        
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <Brain className="w-5 h-5 text-purple-300" />
            <span className="text-purple-200 font-semibold">Revolutionary Multi-Branch AI System</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Not All AI Is Created Equal
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            While others give everyone the same AI, Huntaze uses different AI models 
            for each plan - optimized for your growth stage and profitability needs.
          </p>
        </div>
      </section>

      {/* Visual Comparison */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {/* What Others Do */}
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <h3 className="text-2xl font-bold mb-6 text-red-400">❌ What Others Do</h3>
              <div className="space-y-4">
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-400">All Plans</p>
                  <p className="text-xl font-bold">Same AI Model (GPT-3.5)</p>
                  <p className="text-sm text-gray-500 mt-1">Just different message limits</p>
                </div>
                <p className="text-gray-400">
                  Every user gets the same basic AI, whether paying $10 or $100. 
                  The only difference? How many messages you can send.
                </p>
              </div>
            </div>

            {/* What Huntaze Does */}
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl p-8 border border-purple-500/50">
              <h3 className="text-2xl font-bold mb-6 text-green-400">✅ What Huntaze Does</h3>
              <div className="space-y-3">
                <div className="bg-gray-900/50 rounded-lg p-3 border border-green-500/30">
                  <p className="text-sm text-green-400">Starter</p>
                  <p className="font-bold">GPT-4 + GPT-3.5</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3 border border-purple-500/30">
                  <p className="text-sm text-purple-400">Pro</p>
                  <p className="font-bold">GPT-4-Turbo (All features)</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3 border border-blue-500/30">
                  <p className="text-sm text-blue-400">Scale</p>
                  <p className="font-bold">GPT-4-Turbo + Predictive</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3 border border-yellow-500/30">
                  <p className="text-sm text-yellow-400">Enterprise</p>
                  <p className="font-bold">GPT-4o + Claude 3 Opus</p>
                </div>
              </div>
            </div>
          </div>

          {/* Real Examples */}
          <h2 className="text-3xl font-bold text-center mb-12">See The Difference In Action</h2>
          
          <div className="bg-gray-800 rounded-2xl p-8 space-y-8">
            <div className="text-center mb-8">
              <p className="text-gray-400">Fan message:</p>
              <p className="text-2xl font-semibold">"Hey beautiful! How's your day going?"</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Starter Response */}
              <div className="bg-gray-900 rounded-xl p-6 border border-green-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm font-bold text-green-400">STARTER AI</span>
                </div>
                <p className="text-gray-300 italic">
                  "Hey babe! My day is going great! Thanks for asking 😘 How about yours?"
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  Good but generic • 2-3s response
                </p>
              </div>

              {/* Pro Response */}
              <div className="bg-gray-900 rounded-xl p-6 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span className="text-sm font-bold text-purple-400">PRO AI</span>
                </div>
                <p className="text-gray-300 italic">
                  "Aww hi John! 🥰 My day just got so much better seeing your message! 
                  I was just thinking about that conversation we had last week... 
                  you always know how to make me smile!"
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  Personalized • 1s response
                </p>
              </div>

              {/* Scale Response */}
              <div className="bg-gray-900 rounded-xl p-6 border border-blue-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-sm font-bold text-blue-400">SCALE AI</span>
                </div>
                <p className="text-gray-300 italic">
                  "John! Perfect timing! 😍 I was literally just editing some content 
                  and thought of you... Remember when you said you loved [specific thing]? 
                  Well, I have something special dropping tonight that I think you'll LOVE 🔥"
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  Predictive selling • &lt;1s response
                </p>
              </div>

              {/* Enterprise Response */}
              <div className="bg-gray-900 rounded-xl p-6 border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span className="text-sm font-bold text-yellow-400">ENTERPRISE AI</span>
                </div>
                <p className="text-gray-300 italic">
                  "John! You always check in at the perfect time 💕 My day's been amazing - 
                  just finished that [specific interest] content we talked about! 
                  BTW, I noticed you're usually online around this time... want me to send 
                  you a preview before anyone else sees it? 😏 You know you're my favorite!"
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  Hyper-intelligent • Instant • 94% conversion
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Details */}
      <section className="py-16 px-4 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Multi-Branch AI Architecture</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Messaging Branch */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
              <MessageSquare className="w-10 h-10 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold mb-3">Messaging AI</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Starter: GPT-4 (good)</li>
                <li>• Pro: GPT-4-Turbo (smart)</li>
                <li>• Scale: GPT-4-Turbo+ (predictive)</li>
                <li>• Enterprise: GPT-4o (perfect)</li>
              </ul>
            </div>

            {/* Analytics Branch */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
              <TrendingUp className="w-10 h-10 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold mb-3">Analytics AI</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Starter: What happened</li>
                <li>• Pro: Why it happened</li>
                <li>• Scale: What will happen</li>
                <li>• Enterprise: What to do next</li>
              </ul>
            </div>

            {/* Content Branch */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
              <Sparkles className="w-10 h-10 text-pink-400 mb-4" />
              <h3 className="text-xl font-bold mb-3">Content AI</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Starter: DALL-E 2</li>
                <li>• Pro: DALL-E 3</li>
                <li>• Scale: DALL-E 3 HD</li>
                <li>• Enterprise: Midjourney V6</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-3xl font-bold mb-6">
          Ready For AI That Matches Your Ambition?
        </h2>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Don't settle for basic AI. Get the intelligence level that matches your growth goals.
        </p>
        <Link href="/pricing">
          <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full hover:shadow-2xl transform hover:-translate-y-1 transition-all">
            Choose Your AI Power Level →
          </button>
        </Link>
      </section>
    </div>
  );
}
