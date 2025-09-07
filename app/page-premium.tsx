'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, Check, Zap, TrendingUp, Shield, DollarSign, Users, Star } from 'lucide-react';

// Import premium animation components
import AnimatedHero from '@/components/animations/AnimatedHero';
import PhoneMockup3DWrapper from '@/components/animations/PhoneMockup3DWrapper';
// Lazy-load LiveDashboard to avoid SSR/hydration issues with Chart.js
const LiveDashboard = dynamic(() => import('@/components/animations/LiveDashboard'), { ssr: false });
import { ScrollReveal, ScrollParallax, StaggerChildren, ScrollProgressBar } from '@/components/animations/ScrollAnimations';
import { SectionErrorBoundary } from '@/src/components/ErrorBoundary';

// Lazy load existing components
const PlatformLogos = dynamic(() => import('@/components/platform-logos'));
const FAQSection = dynamic(() => import('@/components/faq-section'));

export default function HomePagePremium() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);

    // Standard scrolling for better mobile performance
    document.documentElement.style.scrollBehavior = 'auto';
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* Removed scroll progress indicator for cleaner experience */}
      
      {/* Premium Animated Hero Section */}
      <SectionErrorBoundary sectionName="Hero">
        <AnimatedHero />
      </SectionErrorBoundary>

      {/* Quick Navigation - 13 Key Pages */}
      <section className="py-16 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-white mb-8">
            Discover all our features
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { label: 'Pricing', href: '/pricing', icon: '💰' },
              { label: 'Features', href: '/features', icon: '✨' },
              { label: 'AI Chat', href: '/features/ai-chat', icon: '🤖' },
              { label: 'Analytics', href: '/features/analytics', icon: '📊' },
              { label: 'Dashboard', href: '/features/dashboard', icon: '🎯' },
              { label: 'OnlyFans', href: '/features/onlyfans', icon: '🔥' },
              { label: 'For Agencies', href: '/for-agencies', icon: '🏢' },
              { label: 'Instagram', href: '/for-instagram-creators', icon: '📸' },
              { label: 'TikTok', href: '/for-tiktok-creators', icon: '🎵' },
              { label: 'Blog', href: '/blog', icon: '📝' },
              { label: 'Case Studies', href: '/case-studies', icon: '📈' },
              { label: 'Support', href: '/support', icon: '💬' },
              { label: 'Demo', href: '/demo', icon: '🎮' }
            ].map((item, i) => (
              <Link key={i} href={item.href}>
                <motion.div 
                  className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer text-center"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="text-sm text-gray-300">{item.label}</div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* 3D Phone Mockup - simplified for mobile */}
      <div className="py-16">
        <SectionErrorBoundary sectionName="3D Phone">
          <PhoneMockup3DWrapper />
        </SectionErrorBoundary>
      </div>
      
      {/* Live Dashboard Demo - no delay for mobile */}
      <div className="py-16">
        <SectionErrorBoundary sectionName="Live Dashboard">
          <LiveDashboard />
        </SectionErrorBoundary>
      </div>

      {/* Platform logos with animation */}
      <ScrollReveal>
        <section className="py-16 border-y border-white/10">
          <div className="max-w-7xl mx-auto px-4">
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-center text-lg font-semibold text-gray-200 mb-8"
            >
              Works with all major platforms
            </motion.p>
            <PlatformLogos />
          </div>
        </section>
      </ScrollReveal>

      {/* Comparison Section - Premium Design */}
      <ScrollParallax offset={50}>
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-16">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    The Math Is Simple
                  </span>
                </h2>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  See exactly how much more you'll earn with Huntaze
                </p>
              </div>
            </ScrollReveal>

            {/* Premium comparison cards */}
            <StaggerChildren staggerDelay={0.2} className="grid lg:grid-cols-3 gap-8 mb-16">
              {/* Traditional Agency Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative glass-card p-8 border border-red-500/20"
              >
                <div className="absolute -top-4 left-8 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                  Traditional Agency
                </div>
                <div className="mt-4">
                  <div className="text-center mb-8">
                    <motion.div 
                      className="text-6xl font-black text-red-500 mb-2"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 100 }}
                    >
                      50%
                    </motion.div>
                    <p className="text-xl font-semibold text-white">Commission Rate</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        <span className="text-red-400 text-sm">✕</span>
                      </div>
                      <span className="text-gray-300">Manual messaging</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        <span className="text-red-400 text-sm">✕</span>
                      </div>
                      <span className="text-gray-300">Limited hours</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        <span className="text-red-400 text-sm">✕</span>
                      </div>
                      <span className="text-gray-300">No control</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Huntaze Card - Featured */}
              <motion.div
                whileHover={{ scale: 1.08 }}
                className="relative glass-card p-8 ring-2 ring-purple-500 shadow-2xl shadow-purple-500/20 transform scale-105"
              >
                <div className="absolute -top-4 left-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                  Huntaze Pro
                </div>
                <div className="mt-4">
                  <div className="text-center mb-8">
                    <motion.div 
                      className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                    >
                      1.5%
                    </motion.div>
                    <p className="text-xl font-semibold text-white">Commission Rate</p>
                  </div>
                  <div className="space-y-4">
                    <motion.div 
                      className="flex items-center gap-3"
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium">AI automation 24/7</span>
                    </motion.div>
                    <motion.div 
                      className="flex items-center gap-3"
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium">Never miss a sale</span>
                    </motion.div>
                    <motion.div 
                      className="flex items-center gap-3"
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium">You own everything</span>
                    </motion.div>
                  </div>
                  <motion.button 
                    className="w-full mt-8 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start Free Trial
                  </motion.button>
                </div>
              </motion.div>

              {/* Savings Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative glass-card p-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20"
              >
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-6">
                    Your Monthly Savings
                  </h3>
                  <div className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <p className="text-gray-300 mb-2">Earning $5k/month</p>
                      <motion.p 
                        className="text-3xl font-black text-green-400"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.4 }}
                      >
                        +$2,420
                      </motion.p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <p className="text-gray-300 mb-2">Earning $10k/month</p>
                      <motion.p 
                        className="text-3xl font-black text-green-400"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.6 }}
                      >
                        +$4,850
                      </motion.p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      <p className="text-gray-300 mb-2">Earning $25k/month</p>
                      <motion.p 
                        className="text-3xl font-black text-green-400"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.8 }}
                      >
                        +$12,125
                      </motion.p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </StaggerChildren>

            {/* ROI Calculator CTA */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link href="/pricing">
                <motion.button 
                  className="px-8 py-4 border-2 border-purple-500 text-purple-400 font-bold rounded-xl hover:bg-purple-500/10 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Calculate Your Exact Savings →
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>
      </ScrollParallax>

      {/* Features Grid - Modern Design */}
      <ScrollReveal>
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <motion.h2 
                className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Everything to Scale
                </span>
              </motion.h2>
              <motion.p 
                className="text-xl text-gray-300 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Professional tools that top creators use to maximize their revenue
              </motion.p>
            </div>

            <StaggerChildren staggerDelay={0.1} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Zap className="w-8 h-8" />,
                  title: "AI Assistant",
                  description: "Instantly responds to every message with personalized replies that convert",
                  gradient: "from-purple-500 to-pink-500"
                },
                {
                  icon: <TrendingUp className="w-8 h-8" />,
                  title: "Advanced Analytics",
                  description: "Track your earnings, identify your best fans and optimize your strategy",
                  gradient: "from-blue-500 to-cyan-500"
                },
                {
                  icon: <Users className="w-8 h-8" />,
                  title: "Fan Management",
                  description: "Automatically segment by spending, engagement and preferences",
                  gradient: "from-pink-500 to-rose-500"
                },
                {
                  icon: <Shield className="w-8 h-8" />,
                  title: "100% Secure",
                  description: "Designed to respect guidelines - no risk to your accounts",
                  gradient: "from-green-500 to-emerald-500"
                },
                {
                  icon: <DollarSign className="w-8 h-8" />,
                  title: "Smart Pricing",
                  description: "AI suggests optimal prices based on fan behavior",
                  gradient: "from-yellow-500 to-orange-500"
                },
                {
                  icon: <ArrowRight className="w-8 h-8" />,
                  title: "Quick Setup",
                  description: "Connect your accounts and start earning more in 2 minutes",
                  gradient: "from-red-500 to-pink-500"
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="glass-card p-8 group cursor-pointer relative overflow-hidden"
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Removed darkening overlay effect */}
                  <motion.div 
                    className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 text-white`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </StaggerChildren>
          </div>
        </section>
      </ScrollReveal>

      {/* FAQ */}
      <ScrollReveal>
        <FAQSection />
      </ScrollReveal>

      {/* Final CTA */}
      <ScrollParallax offset={-50}>
        <section className="py-24 px-4 bg-gradient-to-br from-purple-600 to-pink-600 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-32 h-32 bg-white/10 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 5 + Math.random() * 5,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                }}
              />
            ))}
          </div>
          
          <motion.div 
            className="max-w-4xl mx-auto text-center relative z-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6">
              Ready to Keep More of Your Revenue?
            </h2>
            <p className="text-xl text-purple-100 mb-12">
              Join thousands of creators who have taken back control of their business
            </p>
            <Link href="/auth">
              <motion.button 
                className="px-12 py-5 bg-white text-purple-600 font-bold text-lg rounded-2xl shadow-xl"
                whileHover={{ scale: 1.05, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                whileTap={{ scale: 0.95 }}
              >
                Start Your Free Trial
              </motion.button>
            </Link>
            <motion.p 
              className="text-purple-200 mt-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              No card required • 2-minute setup • Cancel anytime
            </motion.p>
          </motion.div>
        </section>
      </ScrollParallax>
    </div>
  );
}
