'use client'

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, MessageSquare, BarChart3, Settings, TrendingUp, Users, DollarSign } from 'lucide-react';
import { DashboardMockup, ChatInterfaceMockup, AnalyticsMockup } from '@/components/product-mockups';
import LiveChatDemo from '@/components/live-chat-demo';
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

      {/* Agency vs Huntaze Comparison */}
      <section className="py-16 px-6 md:px-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Stop losing half your revenue
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              See why creators are switching from agencies to Huntaze
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Traditional Agency */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 relative">
              <div className="absolute -top-3 left-6 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                Traditional Agency
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600 dark:text-gray-300">Their cut</span>
                  <span className="text-3xl font-bold text-red-600">50%</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-red-500">✗</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">You lose control</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-500">✗</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Generic responses</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-500">✗</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Long contracts</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-500">✗</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Hidden fees</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* VS */}
            <div className="flex items-center justify-center">
              <div className="text-4xl font-bold text-gray-300 dark:text-gray-600">VS</div>
            </div>
            
            {/* Huntaze */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-purple-300 dark:border-purple-700 relative transform scale-105 shadow-xl">
              <div className="absolute -top-3 left-6 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Huntaze
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600 dark:text-gray-300">Platform fee</span>
                  <span className="text-3xl font-bold text-green-600">1.5-7%</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm text-gray-700 dark:text-gray-200">You keep control</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm text-gray-700 dark:text-gray-200">AI learns your style</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm text-gray-700 dark:text-gray-200">Cancel anytime</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm text-gray-700 dark:text-gray-200">Transparent pricing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Savings Calculator */}
          <div className="mt-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              If you're making $10k/month
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">With Agency</p>
                <p className="text-2xl font-bold text-red-600">-$5,000</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">With Huntaze</p>
                <p className="text-2xl font-bold text-green-600">-$300</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">You save</p>
                <p className="text-xl md:text-2xl font-bold text-purple-600">$4,700/mo</p>
              </div>
            </div>
            <Link href="/pricing" className="inline-block mt-6 text-purple-600 dark:text-purple-400 font-medium hover:underline">
              See full pricing breakdown →
            </Link>
          </div>
        </div>
      </section>

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
      <section id="learn" className="py-20 px-6 md:px-8">
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
                <Link href="/features/ai-chat" className="text-purple-600 dark:text-purple-400 font-medium hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
                  Learn more →
                </Link>
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
                <Link href="/features/analytics" className="text-purple-600 dark:text-purple-400 font-medium hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
                  Learn more →
                </Link>
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
                  Schedule posts, scale replies with AI suggestions (manual approval), and optimize pricing.
                </p>
                <Link href="/features/automation" className="text-purple-600 dark:text-purple-400 font-medium hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
                  Learn more →
                </Link>
              </div>
            </PremiumCard>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 md:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Get started in 3 simple steps
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Switch from your agency in minutes, not months
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-600">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Connect your accounts
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Securely link your OnlyFans, Instagram, and other platforms
              </p>
            </motion.div>
            
            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-600">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Train your AI
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                AI learns your communication style from past conversations
              </p>
            </motion.div>
            
            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-600">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Start earning more
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                AI handles conversations while you create content and earn
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Platform Integrations */}
      <section className="py-20 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Works with all your platforms
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Connect and manage all your content platforms in one place
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl font-bold text-gray-400">OF</span>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">OnlyFans</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl font-bold text-gray-400">F</span>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Fansly</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl font-bold text-gray-400">IG</span>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Instagram</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl font-bold text-gray-400">TT</span>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">TikTok</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 md:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently asked questions
            </h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Is my content safe and private?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Yes. We use bank-level encryption and never store your content. You maintain full ownership and control.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                How does the AI learn my style?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                The AI analyzes your past conversations to understand your tone, personality, and communication patterns. You can always review and approve messages before sending.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Absolutely. No long-term contracts, no cancellation fees. Cancel or change your plan anytime from your dashboard.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What's the difference between plans?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Plans differ in message limits, platform integrations, and commission rates. Higher plans have lower fees and more features. Start with any plan and upgrade as you grow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product showcase section removed per request */}

      {/* Live AI Chat Demo */}
      <section className="py-20 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Try our AI in action
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Chat with our AI assistant and see how it adapts to your style
            </p>
          </div>
          <LiveChatDemo />
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
