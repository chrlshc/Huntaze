'use client'

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, TrendingUp, Users, DollarSign, MessageSquare, Zap, BarChart3, Settings } from 'lucide-react';
import { DashboardMockup, ChatInterfaceMockup, AnalyticsMockup } from '@/components/product-mockups';
import UseCasesCarousel from '@/components/use-cases-carousel';
import AnimatedCounter, { AnimatedStat } from '@/components/animated-counter';
import LiveChatDemo from '@/components/live-chat-demo';
import { motion } from 'framer-motion';
import PremiumButton from '@/components/premium-button';
import PremiumCard from '@/components/premium-card';
import CreatorTestimonials from '@/components/creator-testimonials';

export default function HomePageImproved() {
  return (
    <div className="bg-white dark:bg-black transition-colors">
      {/* Hero Section - Simplified like Shopify */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              {/* Social Proof Badge */}
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-800"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-400 dark:bg-gray-500 border-2 border-white dark:border-gray-800"></div>
                  <div className="w-8 h-8 rounded-full bg-gray-500 dark:bg-gray-400 border-2 border-white dark:border-gray-800"></div>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>500+</strong> creators saving millions in agency fees
                </span>
              </div>

              {/* Main Headline - Huge & Clear */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                Keep 98% of your{' '}
                <span className="bg-gradient-to-r from-purple-600 to-purple-600 bg-clip-text text-transparent">
                  revenue
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Stop paying 50% to agencies. Our AI handles everything 24/7 
                while you keep control and earnings.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/join">
                  <PremiumButton size="lg" className="w-full sm:w-auto">
                    Start free trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </PremiumButton>
                </Link>
                <Link href="/demo">
                  <PremiumButton variant="secondary" size="lg" className="w-full sm:w-auto">
                    Watch demo
                  </PremiumButton>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="dark:text-gray-300">No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="dark:text-gray-300">Free if under $1.5k/mo</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="dark:text-gray-300">Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Right Visual - Product Dashboard */}
            <div className="relative">
              <DashboardMockup />
              
              {/* Floating Badge */}
              <div className="absolute top-4 right-4 bg-purple-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-md">
                Save $15k+/month
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Stats Bar - No animations */}
      <section className="py-16 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                500+
              </div>
              <div className="text-gray-600 dark:text-gray-300">Active Creators</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                $50M+
              </div>
              <div className="text-gray-600 dark:text-gray-300">Revenue Processed</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                4.9/5
              </div>
              <div className="text-gray-600 dark:text-gray-300">Creator Rating</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                24/7
              </div>
              <div className="text-gray-600 dark:text-gray-300">AI Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Carousel */}
      <UseCasesCarousel />

      {/* Creator Testimonials */}
      <CreatorTestimonials />

      {/* Live Chat Demo Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
              >
                Try our AI live
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-gray-600 dark:text-gray-300 mb-8"
              >
                Experience how our AI engages with fans in real-time. 
                Type anything and see instant, personalized responses.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">2 second response time</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Never miss a message or sale opportunity</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Learns your style</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">AI adapts to your personality and tone</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Increases sales by 285%</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Smart upselling at the perfect moment</p>
                  </div>
                </div>
              </motion.div>
            </div>
            <div>
              <LiveChatDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Value Props - 3 Column Clean */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to scale
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              One platform to automate your entire creator business. No agencies, no hassle.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
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
                  Responds to every message in your style. Converts fans 24/7 while you sleep.
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
                  Schedule posts, send mass DMs, and optimize pricing automatically.
                </p>
                <Link href="/features/automation" className="text-purple-600 dark:text-purple-400 font-medium hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
                  Learn more →
                </Link>
              </div>
            </PremiumCard>
          </div>
        </div>
      </section>

      {/* Product Showcase Section */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
            >
              See Huntaze multiply your revenue
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8"
            >
              Watch how our AI handles everything while you focus on creating content
            </motion.p>
            
            {/* Demo Video CTA */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-12"
            >
              <Link href="/demo" className="inline-flex items-center gap-3 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch 2-minute demo
              </Link>
            </motion.div>
          </div>

          {/* 3 Product Mockups in Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
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
              <div className="mt-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Real-time Dashboard
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Track revenue, fans, and performance metrics in real-time
                </p>
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
              <div className="mt-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  AI Chat Assistant
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Engage fans 24/7 with personalized AI responses
                </p>
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
              <div className="mt-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Smart Analytics
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  AI-powered insights to maximize your revenue
                </p>
                <Link href="/features/analytics" className="text-purple-600 dark:text-purple-400 font-medium hover:underline">
                  View Analytics →
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Results & Social Proof */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-20"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Proven results from real creators</h3>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center shadow-lg border dark:border-gray-800">
                <div className="text-4xl font-bold text-purple-600 mb-2">3X</div>
                <div className="text-gray-600 dark:text-gray-300">Revenue in 2 months</div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center shadow-lg border dark:border-gray-800">
                <div className="text-4xl font-bold text-purple-600 mb-2">500+</div>
                <div className="text-gray-600 dark:text-gray-300">Creators onboarded</div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center shadow-lg border dark:border-gray-800">
                <div className="text-4xl font-bold text-purple-600 mb-2">98%</div>
                <div className="text-gray-600 dark:text-gray-300">Revenue retained</div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center shadow-lg border dark:border-gray-800">
                <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
                <div className="text-gray-600 dark:text-gray-300">AI response time</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to 10x your creator business?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join 500+ creators who ditched their agencies and kept millions in revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
            <Link href="/demo">
              <PremiumButton 
                variant="ghost"
                size="lg" 
                className="border-2 border-white text-white hover:bg-white/10"
              >
                Watch 2-min demo
              </PremiumButton>
            </Link>
          </div>
          <p className="text-purple-100 mt-6">
            ✓ No credit card required ✓ Free if under $1.5k/mo ✓ Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}