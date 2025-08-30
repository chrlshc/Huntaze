'use client'

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, MessageSquare, BarChart3, Settings } from 'lucide-react';
import { DashboardMockup, ChatInterfaceMockup, AnalyticsMockup } from '@/components/product-mockups';
import { motion } from 'framer-motion';
import PremiumButton from '@/components/premium-button';
import PremiumCard from '@/components/premium-card';
import CreatorTestimonials from '@/components/creator-testimonials';

export default function HomePageImproved() {
  useEffect(() => {
    // Disable automatic scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    // Force scroll to top a few times
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    // Immediately
    scrollToTop();
    // After DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', scrollToTop);
    } else {
      scrollToTop();
    }
    // After a short delay
    setTimeout(scrollToTop, 100);
  }, []);
  
  return (
    <div className="bg-white dark:bg-black transition-colors">
      {/* Hero Section - Simplified like Shopify */}
      <section className="relative pt-20 md:pt-24 pb-10 md:pb-12 px-6 md:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            {/* Left Content */}
            <div className="w-full lg:w-1/2">
              {/* Small credibility line */}
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">Trusted by creators who left agencies</div>

              {/* Main Headline - Huge & Clear */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                Keep more of your{' '}
                <span className="bg-gradient-to-r from-purple-600 to-purple-600 bg-clip-text text-transparent">
                  revenue
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed max-w-xl">
                Automate fan chats with AI. Keep control. Keep more revenue.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/auth">
                  <PremiumButton size="lg" className="w-full sm:w-auto">
                    Start free trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </PremiumButton>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                <span className="inline-flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Free trial</span>
                <span className="inline-flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Cancel anytime</span>
              </div>
            </div>

            {/* Right Visual - Product Dashboard */}
            <div className="w-full lg:w-1/2 relative">
              <DashboardMockup />
              
              {/* Floating Badge */}
              <div className="absolute top-4 right-4 bg-purple-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-md">Lower fees</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar removed to avoid unsupported claims */}

      {/* Compact value highlights */}
      <section className="py-10 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border dark:border-gray-800 text-center">
              <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <div className="font-semibold">AI replies in your style</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">24/7 conversations that convert</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border dark:border-gray-800 text-center">
              <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <div className="font-semibold">Know what sells</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Clear revenue and fan insights</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border dark:border-gray-800 text-center">
              <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <div className="font-semibold">Automate the busywork</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Schedule, DM, and optimize</div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props - 3 Column Clean */}
      <section className="py-20 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to scale
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              One platform to automate your entire creator business. No agencies, no hassle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <PremiumCard>
              <div className="text-center p-6">
                <motion.div 
                  className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <MessageSquare className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  AI Chat Assistant
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Responds to messages in your style. Converts fans while you create.
                </p>
                <button className="text-purple-600 dark:text-purple-400 font-medium hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
                  Learn more →
                </button>
              </div>
            </PremiumCard>

            {/* Feature 2 */}
            <PremiumCard glowColor="pink">
              <div className="text-center p-6">
                <motion.div 
                  className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Smart Analytics
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Know exactly what content sells. Track revenue, engagement, and growth.
                </p>
                <button className="text-purple-600 dark:text-purple-400 font-medium hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
                  Learn more →
                </button>
              </div>
            </PremiumCard>

            {/* Feature 3 */}
            <PremiumCard glowColor="blue">
              <div className="text-center p-6">
                <motion.div 
                  className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Settings className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Content Automation
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Schedule posts, send mass DMs, and optimize pricing automatically.
                </p>
                <button className="text-purple-600 dark:text-purple-400 font-medium hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
                  Learn more →
                </button>
              </div>
            </PremiumCard>
          </div>
        </div>
      </section>

      {/* Product Showcase Section - concise */}
      <section className="py-16 px-6 md:px-8 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3"
            >
              See the product in action
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6"
            >
              Dashboard, AI chat, and analytics you actually use.
            </motion.p>
            
          </div>

          {/* 3 Product Mockups in Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="group"
            >
              <div className="relative overflow-hidden rounded-xl shadow-2xl transition-transform group-hover:scale-105">
                <DashboardMockup />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Real-time Dashboard
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3">Revenue, fans, and performance at a glance.</p>
                <Link href="/features/dashboard" className="text-purple-600 dark:text-purple-400 font-medium hover:underline">
                  Explore Dashboard →
                </Link>
              </div>
            </motion.div>

            {/* Chat Interface Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="group"
            >
              <div className="relative overflow-hidden rounded-xl shadow-2xl transition-transform group-hover:scale-105">
                <ChatInterfaceMockup />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  AI Chat Assistant
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3">Personalized replies that convert.</p>
                <Link href="/features/ai-chat" className="text-purple-600 dark:text-purple-400 font-medium hover:underline">
                  Learn About AI Chat →
                </Link>
              </div>
            </motion.div>

            {/* Analytics Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="group"
            >
              <div className="relative overflow-hidden rounded-xl shadow-2xl transition-transform group-hover:scale-105">
                <AnalyticsMockup />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Smart Analytics
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3">Insights to grow what works.</p>
                <Link href="/features/analytics" className="text-purple-600 dark:text-purple-400 font-medium hover:underline">
                  View Analytics →
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Minimal by design: detailed stats moved to analytics page */}
        </div>
      </section>

      {/* Creator Testimonials - Hidden on mobile */}
      <div className="hidden md:block">
        <CreatorTestimonials />
      </div>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center px-6 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Start keeping more of your revenue</h2>
          <p className="text-base md:text-lg text-purple-100 mb-6">Switch in minutes. No long contracts.</p>
          <div className="flex justify-center">
            <Link href="/join">
              <PremiumButton 
                variant="secondary"
                size="lg" 
                className="bg-white text-purple-600 hover:bg-gray-100 shadow-xl"
              >
                Start free trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </PremiumButton>
            </Link>
          </div>
          <p className="text-purple-100 mt-4">✓ Free trial ✓ Cancel anytime</p>
        </div>
      </section>
    </div>
  );
}
