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
import FAQSection from '@/components/faq-section';

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
      <section className="relative py-20 md:py-32 px-6 md:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            {/* Left Content */}
            <div className="w-full lg:w-1/2">
              {/* Small credibility line */}
              <div className="text-sm text-gray-700 dark:text-gray-400 mb-6 font-medium">Trusted by creators who left agencies</div>

              {/* Main Headline - Huge & Clear */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight mb-8">
                Keep more of your revenue
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-400 mb-8 leading-relaxed max-w-xl">
                Automate fan chats with AI. Keep control. Keep more revenue.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/auth">
                  <PremiumButton size="lg" className="w-full sm:w-auto">
                    Start free trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </PremiumButton>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-400 font-medium">
                <span className="inline-flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Free trial</span>
                <span className="inline-flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Cancel anytime</span>
              </div>
            </div>

            {/* Right Visual - Product Dashboard */}
            <div className="w-full lg:w-1/2 relative">
              <DashboardMockup />
              
              {/* Floating Badge removed for a cleaner, professional look */}
            </div>
          </div>
        </div>
      </section>

      {/* Agency vs Huntaze Comparison */}
      <section className="py-20 md:py-32 px-6 md:px-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Stop losing half your revenue
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-400">
              See why creators are switching from agencies to Huntaze
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Traditional Agency */}
            <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-200 dark:border-gray-600 relative">
              <div className="absolute -top-3 left-6 bg-red-100 dark:bg-red-900/30 text-[var(--brand-red)] dark:text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                Traditional Agency
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-700 dark:text-gray-400 font-medium">Their cut</span>
                  <span className="text-3xl font-bold text-[var(--brand-red)]">50%</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-red-500">✗</span>
                    <span className="text-sm text-gray-700 dark:text-[var(--text-secondary-dark)]">You lose control</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-500">✗</span>
                    <span className="text-sm text-gray-700 dark:text-[var(--text-secondary-dark)]">Generic responses</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-500">✗</span>
                    <span className="text-sm text-gray-700 dark:text-[var(--text-secondary-dark)]">Long contracts</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-500">✗</span>
                    <span className="text-sm text-gray-700 dark:text-[var(--text-secondary-dark)]">Hidden fees</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* VS */}
            <div className="flex items-center justify-center">
              <div className="text-4xl font-bold text-gray-400 dark:text-gray-400">VS</div>
            </div>
            
            {/* Huntaze */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800/80 rounded-2xl p-6 border-2 border-purple-400 dark:border-purple-600 relative transform scale-105 shadow-xl">
              <div className="absolute -top-3 left-6 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Huntaze
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-700 dark:text-gray-400 font-medium">Huntaze Cut</span>
                  <span className="text-3xl font-bold text-green-600">1.5-7%</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm text-gray-700 dark:text-[var(--text-secondary-dark)]">You keep control</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm text-gray-700 dark:text-[var(--text-secondary-dark)]">AI learns your style</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm text-gray-700 dark:text-[var(--text-secondary-dark)]">Cancel anytime</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm text-gray-700 dark:text-[var(--text-secondary-dark)]">Transparent pricing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Savings Calculator */}
          <div className="mt-12 bg-gray-100 dark:bg-gray-800/60 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              If you're making $10k/month with Huntaze Pro
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-400 mb-1 font-medium">With Agency</p>
                <p className="text-2xl font-bold text-red-600">-$5,000</p>
              </div>
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-400 mb-1 font-medium">With Huntaze</p>
                <p className="text-2xl font-bold text-green-600">-$300</p>
              </div>
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-400 mb-1 font-medium">You save</p>
                <p className="text-xl md:text-2xl font-bold text-purple-600">$4,700/mo</p>
              </div>
            </div>
            <Link href="/pricing" className="inline-block mt-6 text-purple-600 dark:text-purple-400 font-medium hover:underline">
              See full pricing breakdown →
            </Link>
          </div>
        </div>
      </section>


      {/* Value Props - 3 Column Clean */}
      <section id="learn" className="py-20 md:py-32 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Everything you need to scale
            </h2>
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-400 max-w-3xl mx-auto">
              One platform to automate your entire creator business. No agencies, no hassle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Feature 1 */}
            <PremiumCard>
              <div className="text-center p-6">
                <motion.div 
                  className="w-16 h-16 bg-purple-100 dark:bg-purple-800/40 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <MessageSquare className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  AI Chat Assistant
                </h3>
                <p className="text-gray-700 dark:text-gray-400 mb-4">
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
                  className="w-16 h-16 bg-purple-100 dark:bg-purple-800/40 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Smart Analytics
                </h3>
                <p className="text-gray-700 dark:text-gray-400 mb-4">
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
            <p className="text-lg text-gray-700 dark:text-gray-400">
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
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-800/40 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-600">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Connect your accounts
              </h3>
              <p className="text-gray-700 dark:text-gray-400">
                Connect Instagram, TikTok, Reddit, and Threads to drive traffic to your OnlyFans. Connect OnlyFans for messaging and sales.
              </p>
            </motion.div>
            
            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-800/40 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-600">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Train your AI
              </h3>
              <p className="text-gray-700 dark:text-gray-400">AI learns your communication style from past conversations</p>
            </motion.div>
            
            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-800/40 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-600">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Start earning more
              </h3>
              <p className="text-gray-700 dark:text-gray-400">
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
            <p className="text-lg text-gray-700 dark:text-gray-400">
              Drive traffic from Instagram, TikTok, Reddit, and Threads to your OnlyFans — then convert with AI.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 flex items-center justify-center mx-auto mb-3">
                {/* OnlyFans */}
                <svg viewBox="0 0 32 32" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg" aria-label="OnlyFans logo">
                  <circle cx="16" cy="16" r="16" fill="#00D4FF"/>
                  <text x="16" y="20" fill="white" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="bold" textAnchor="middle">OF</text>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-400">OnlyFans</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Revenue hub</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 flex items-center justify-center mx-auto mb-3">
                {/* Instagram */}
                <svg viewBox="0 0 32 32" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg" aria-label="Instagram logo">
                  <defs>
                    <linearGradient id="igGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#405DE6"/>
                      <stop offset="100%" stopColor="#E1306C"/>
                    </linearGradient>
                  </defs>
                  <rect width="32" height="32" rx="8" fill="url(#igGradient)"/>
                  <rect x="8" y="8" width="16" height="16" rx="4" stroke="white" strokeWidth="2" fill="none"/>
                  <circle cx="16" cy="16" r="4" stroke="white" strokeWidth="2" fill="none"/>
                  <circle cx="20" cy="12" r="1.5" fill="white"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-400">Instagram</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Traffic source → OF</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 flex items-center justify-center mx-auto mb-3">
                {/* TikTok */}
                <svg viewBox="0 0 32 32" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg" aria-label="TikTok logo">
                  <rect width="32" height="32" rx="6" fill="#000000"/>
                  <path fill="#FF0050" d="M19 8.5c.8 1.2 2.1 2 3.5 2v3c-1.2 0-2.3-.3-3.3-.8v4.8c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8c.4 0 .8 0 1.2.1v4.4c-.4-.1-.8-.1-1.2-.1-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4V8.5H19z"/>
                  <path fill="#25F4EE" d="M19 8.5c.8 1.2 2.1 2 3.5 2v3c-1.2 0-2.3-.3-3.3-.8v4.8c0 2.2-.9 4.2-2.4 5.7-.7.7-1.5 1.2-2.4 1.5-1.1.4-2.3.4-3.4 0-.9-.3-1.7-.8-2.4-1.5C7.1 21.9 6.2 19.9 6.2 17.7c0-2.2.9-4.2 2.4-5.7.7-.7 1.5-1.2 2.4-1.5.4-.1.8-.2 1.2-.2v4.4c-.4-.1-.8-.1-1.2-.1-.6 0-1.1.2-1.6.5-.4.3-.7.7-.9 1.2-.1.2-.1.5-.1.7 0 1.1.4 2.1 1.1 2.8.7.7 1.7 1.1 2.8 1.1s2.1-.4 2.8-1.1c.7-.7 1.1-1.7 1.1-2.8V8.5H19z"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-400">TikTok</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Traffic source → OF</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 flex items-center justify-center mx-auto mb-3">
                {/* Reddit */}
                <svg viewBox="0 0 32 32" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg" aria-label="Reddit logo">
                  <circle cx="16" cy="16" r="16" fill="#FF4500"/>
                  <path fill="white" d="M24 16c0 1.1-.9 2-2 2-.4 0-.7-.1-1-.3-.6 2.2-2.6 4.3-5.5 4.3s-4.9-2.1-5.5-4.3c-.3.2-.6.3-1 .3-1.1 0-2-.9-2-2s.9-2 2-2c.1 0 .3 0 .4.1C10.2 12.8 12 11 15.5 11s5.3 1.8 6.1 3.1c.1 0 .3-.1.4-.1 1.1 0 2 .9 2 2zM13 17c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1zm6 0c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1zm-3 3c-1.1 0-2-.2-2.5-.5-.1-.1-.1-.3 0-.4.1-.1.3-.1.4 0 .3.2 1.2.4 2.1.4s1.8-.2 2.1-.4c.1-.1.3-.1.4 0 .1.1.1.3 0 .4-.5.3-1.4.5-2.5.5z"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-400">Reddit</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Traffic source → OF</p>
            </div>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-3">
              {/* Threads */}
              <svg viewBox="0 0 32 32" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg" aria-label="Threads logo">
                <rect width="32" height="32" rx="8" fill="#000000"/>
                <path fill="white" d="M16 6C10.5 6 6 10.5 6 16s4.5 10 10 10 10-4.5 10-10S21.5 6 16 6zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
                <path fill="white" d="M20.5 12.5c-1.1-1.1-2.6-1.8-4.2-1.9v2c1.1.1 2.1.6 2.8 1.4.7.8 1.1 1.8 1.1 2.9 0 2.2-1.8 4-4 4s-4-1.8-4-4c0-1.1.4-2.1 1.1-2.9.7-.8 1.7-1.3 2.8-1.4v-2c-1.6.1-3.1.8-4.2 1.9C10.7 13.7 10 15.3 10 17c0 3.3 2.7 6 6 6s6-2.7 6-6c0-1.7-.7-3.3-1.5-4.5z"/>
                <circle cx="16" cy="17" r="2" fill="white"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-400">Threads</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Traffic source → OF</p>
          </div>
        </div>
      </section>

      {/* Combined FAQ & AI Demo Section */}
      <section className="py-20 md:py-32 px-6 md:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left: FAQ */}
            <FAQSection />
            
            {/* Right: AI Demo */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Try our AI in action
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-400 mb-8">
                Chat with our AI assistant and see how it adapts to your style
              </p>
              <LiveChatDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Creator Testimonials - Hidden on mobile */}
      <div className="hidden md:block">
        <CreatorTestimonials />
      </div>

      {/* Final CTA */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto text-center px-6 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Start keeping more of your revenue</h2>
          <p className="text-base md:text-lg text-gray-700 dark:text-gray-400 mb-6">Switch in minutes. No long contracts.</p>
          <div className="flex justify-center">
            <Link href="/join">
              <PremiumButton size="lg">
                Start free trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </PremiumButton>
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">✓ Free trial ✓ Cancel anytime</p>
        </div>
      </section>
    </div>
  );
}
