import React from 'react';
import Link from 'next/link';
import { Button } from '../components/ui/button';
import { ArrowRight, CheckCircle, TrendingUp } from 'lucide-react';

export default function HomePageImproved() {
  return (
    <div className="bg-white">
      {/* Hero Section - Simplified like Shopify */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              {/* Social Proof Badge */}
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-500 border-2 border-white"></div>
                </div>
                <span className="text-sm text-gray-600">
                  <strong>500+</strong> creators saving millions in agency fees
                </span>
              </div>

              {/* Main Headline - Huge & Clear */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
                Keep 98% of your{' '}
                <span className="bg-gradient-to-r from-purple-600 to-purple-600 bg-clip-text text-transparent">
                  revenue
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
                Stop paying 50% to agencies. Our AI handles everything 24/7 
                while you keep control and earnings.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  asChild 
                  className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-8 py-6 h-auto font-medium"
                >
                  <Link href="/join">
                    Start free trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 text-lg px-8 py-6 h-auto font-medium"
                >
                  <Link href="/demo">Watch demo</Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Free if under $1.5k/mo</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Right Visual - Product Dashboard */}
            <div className="relative">
              <div className="relative bg-gray-50 rounded-2xl shadow-2xl overflow-hidden">
                {/* Mock Dashboard */}
                <div className="bg-white p-6">
                  {/* Dashboard Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Revenue Dashboard</h3>
                      <p className="text-sm text-gray-500">Real-time performance</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">$47,829</p>
                      <p className="text-sm text-green-600 flex items-center justify-end">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +285% this month
                      </p>
                    </div>
                  </div>

                  {/* Chart Mockup */}
                  <div className="h-48 bg-gradient-to-t from-purple-50 to-transparent rounded-lg mb-6 relative overflow-hidden">
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                      <path
                        d="M0,150 C50,120 100,100 150,80 C200,60 250,40 300,20 L300,200 L0,200 Z"
                        fill="url(#gradient)"
                        opacity="0.8"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#9333ea" />
                          <stop offset="100%" stopColor="#9333ea" stopOpacity="0.1" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Active Fans</p>
                      <p className="text-lg font-semibold text-gray-900">2,847</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Messages/Day</p>
                      <p className="text-lg font-semibold text-gray-900">1,243</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">AI Response</p>
                      <p className="text-lg font-semibold text-gray-900">2 sec</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                Save $15k+/month
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Bar - Simple & Clean */}
      <section className="py-12 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-sm text-gray-500 mb-8">
            Trusted by top creators on all platforms
          </p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-8 items-center justify-center opacity-60">
            <div className="text-center text-gray-400 font-semibold">OnlyFans</div>
            <div className="text-center text-gray-400 font-semibold">Fansly</div>
            <div className="text-center text-gray-400 font-semibold">Instagram</div>
            <div className="text-center text-gray-400 font-semibold">TikTok</div>
            <div className="text-center text-gray-400 font-semibold">Twitter</div>
            <div className="text-center text-gray-400 font-semibold">Reddit</div>
          </div>
        </div>
      </section>

      {/* Value Props - 3 Column Clean */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything you need to scale
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              One platform to automate your entire creator business. No agencies, no hassle.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                AI Chat Assistant
              </h3>
              <p className="text-gray-600 mb-4">
                Responds to every message in your style. Converts fans 24/7 while you sleep.
              </p>
              <Link href="/features/ai-chat" className="text-purple-600 font-medium hover:text-purple-700">
                Learn more →
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Smart Analytics
              </h3>
              <p className="text-gray-600 mb-4">
                Know exactly what content sells. Track revenue, engagement, and growth.
              </p>
              <Link href="/features/analytics" className="text-purple-600 font-medium hover:text-purple-700">
                Learn more →
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Content Automation
              </h3>
              <p className="text-gray-600 mb-4">
                Schedule posts, send mass DMs, and optimize pricing automatically.
              </p>
              <Link href="/features/automation" className="text-purple-600 font-medium hover:text-purple-700">
                Learn more →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}