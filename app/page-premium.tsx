'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Check, Zap, TrendingUp, Shield, DollarSign, Users, Star } from 'lucide-react';
import PlatformLogos from '@/components/platform-logos';
import CreatorTestimonials from '@/components/creator-testimonials';
import FAQSection from '@/components/faq-section';

export default function HomePagePremium() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Premium Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-purple-600/20 animate-gradient" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Trust badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-full mb-8"
            >
              <Star className="w-5 h-5 text-purple-600" fill="currentColor" />
              <span className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                Trusted by 5,000+ Creators
              </span>
            </motion.div>

            {/* Main headline - HUGE and BOLD */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight">
              <span className="block text-gray-900 dark:text-white">Stop Paying 50%</span>
              <span className="block gradient-text-premium">To Agencies</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl md:text-3xl font-medium text-gray-800 dark:text-gray-100 mb-12 max-w-3xl mx-auto">
              Keep 98.5% of your revenue with AI-powered automation that works 24/7
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/auth" className="group">
                <button className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-3">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/demo">
                <button className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-bold text-lg rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200">
                  Watch Demo
                </button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap justify-center gap-8 text-gray-800 dark:text-gray-200">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-semibold">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-semibold">Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-semibold">Setup in 2 minutes</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="animate-bounce">
            <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-gray-400 rounded-full mt-2" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Platform logos */}
      <section className="py-16 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-lg font-semibold text-gray-800 dark:text-gray-200 mb-8">
            Works seamlessly with all major platforms
          </p>
          <PlatformLogos />
        </div>
      </section>

      {/* Comparison Section - Premium Design */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6">
              The Math Is Simple
            </h2>
            <p className="text-xl text-gray-800 dark:text-gray-200 max-w-2xl mx-auto">
              See exactly how much more you'll earn with Huntaze
            </p>
          </div>

          {/* Premium comparison cards */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {/* Traditional Agency Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="relative premium-card p-8"
            >
              <div className="absolute -top-4 left-8 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                Traditional Agency
              </div>
              <div className="mt-4">
                <div className="text-center mb-8">
                  <div className="text-6xl font-black text-red-600 mb-2">50%</div>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">Commission Rate</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <span className="text-red-600 text-sm">✕</span>
                    </div>
                    <span className="text-gray-800 dark:text-gray-200">Manual messaging</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <span className="text-red-600 text-sm">✕</span>
                    </div>
                    <span className="text-gray-800 dark:text-gray-200">Limited hours</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <span className="text-red-600 text-sm">✕</span>
                    </div>
                    <span className="text-gray-800 dark:text-gray-200">No control</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Huntaze Card - Featured */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="relative premium-card p-8 ring-2 ring-purple-500 shadow-glow transform scale-105"
            >
              <div className="absolute -top-4 left-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                Huntaze Pro
              </div>
              <div className="mt-4">
                <div className="text-center mb-8">
                  <div className="text-6xl font-black gradient-text-premium mb-2">1.5%</div>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">Commission Rate</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">AI automation 24/7</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">Never miss a sale</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">You own everything</span>
                  </div>
                </div>
                <button className="w-full mt-8 btn-premium">
                  Get Started Free
                </button>
              </div>
            </motion.div>

            {/* Savings Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="relative premium-card p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Your Monthly Savings
                </h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">Making $5k/month</p>
                    <p className="text-3xl font-black text-green-600">+$2,420</p>
                  </div>
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">Making $10k/month</p>
                    <p className="text-3xl font-black text-green-600">+$4,850</p>
                  </div>
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">Making $25k/month</p>
                    <p className="text-3xl font-black text-green-600">+$12,125</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ROI Calculator CTA */}
          <div className="text-center">
            <Link href="/pricing">
              <button className="btn-outline-premium">
                Calculate Your Exact Savings →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid - Modern Design */}
      <section className="py-24 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6">
              Everything You Need To Scale
            </h2>
            <p className="text-xl text-gray-800 dark:text-gray-200 max-w-2xl mx-auto">
              Professional tools that top creators use to maximize their earnings
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8" />,
                title: "AI Chat Assistant",
                description: "Responds instantly to every message with personalized, converting responses",
                color: "purple"
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: "Revenue Analytics",
                description: "Track earnings, identify top spenders, and optimize your content strategy",
                color: "blue"
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Fan Management",
                description: "Segment fans by spending, engagement, and preferences automatically",
                color: "pink"
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Platform Safe",
                description: "Designed to work within platform guidelines - no account risks",
                color: "green"
              },
              {
                icon: <DollarSign className="w-8 h-8" />,
                title: "Smart Pricing",
                description: "AI suggests optimal pricing based on fan behavior and market data",
                color: "yellow"
              },
              {
                icon: <ArrowRight className="w-8 h-8" />,
                title: "Quick Setup",
                description: "Connect your accounts and start earning more in under 2 minutes",
                color: "red"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="premium-card p-8 hover:scale-105 transition-transform"
              >
                <div className={`w-16 h-16 bg-${feature.color}-100 dark:bg-${feature.color}-900/30 rounded-2xl flex items-center justify-center mb-6`}>
                  <div className={`text-${feature.color}-600 dark:text-${feature.color}-400`}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-200 text-lg">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <CreatorTestimonials />

      {/* FAQ */}
      <FAQSection />

      {/* Final CTA */}
      <section className="py-24 px-4 bg-gradient-to-br from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6">
            Ready To Keep More Of Your Money?
          </h2>
          <p className="text-xl text-purple-100 mb-12">
            Join thousands of creators who've taken back control of their business
          </p>
          <Link href="/auth">
            <button className="px-12 py-5 bg-white text-purple-600 font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200">
              Start Your Free Trial Now
            </button>
          </Link>
          <p className="text-purple-200 mt-6">
            No credit card required • Setup in 2 minutes • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}
