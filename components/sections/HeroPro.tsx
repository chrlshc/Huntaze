"use client";

import { useState, useEffect } from "react";
import { useIsMobile } from "@/src/hooks/useReducedMotion";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MagneticButton } from "@/src/components/ui/magnetic-button";
import { StaggerContainer, StaggerItem } from "@/src/components/ui/stagger-container";
import { ChevronRight, Sparkles, Zap, Shield, BarChart3, Globe2, ArrowRight, Lock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useSafeTheme } from "@/src/hooks/useSafeTheme";
import { events } from "@/src/lib/analytics";

const features = [
  { icon: Zap, text: "Save 20+ Hours Weekly", gradient: "from-yellow-400 to-orange-500" },
  { icon: Shield, text: "Platform Compliant", gradient: "from-green-400 to-emerald-500" },
  { icon: BarChart3, text: "2-3x Revenue Growth", gradient: "from-blue-400 to-indigo-500" },
  { icon: Globe2, text: "24/7 Smart Automation", gradient: "from-purple-400 to-pink-500" },
];

const testimonials = [
  { name: "Alex M.", role: "Fitness Creator", text: "From $3k to $8k/month in 4 months" },
  { name: "Jordan S.", role: "Gaming Creator", text: "Saved 25 hours/week on messages" },
  { name: "Ryan K.", role: "Lifestyle Creator", text: "Finally have work-life balance" },
];

export function HeroPro() {
  const { theme } = useSafeTheme();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 opacity-10 dark:opacity-20" />
      
      {/* Floating shapes animation - disabled on mobile for performance */}
      {!isMobile && (
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-20 -left-20 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 dark:opacity-5"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          />
        </div>
      )}

      <div className="container-width relative z-10 py-12 sm:py-16 md:py-20">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: isMobile ? 0 : -50, y: isMobile ? 20 : 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: isMobile ? 0.4 : 0.8, ease: "easeOut" }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-6 shadow-lg"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Trusted by 5,000+ Growing Creators</span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight"
            >
              Build the next<br />
              <span className="text-gradient bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                creator empire
              </span><br />
              <span className="relative">
                on autopilot
                <motion.span
                  className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-purple-500 to-pink-500 opacity-30 rounded-lg blur-sm"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                />
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 leading-relaxed max-w-2xl"
            >
              Join thousands of creators who doubled their revenue while working half the time. 
              Smart automation that handles repetitive tasks, so you can focus on what matters - 
              creating great content and living your life.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12"
            >
              <Link href="/onboarding" className="w-full sm:w-auto">
                <MagneticButton 
                  size="lg" 
                  variant="primary"
                  className="w-full sm:w-auto group"
                  onClick={() => events.ctaClick({ location: 'hero', label: 'Start Earning 95% Today' })}
                >
                  Claim Your AI Empire
                  <ArrowRight className="ml-2 w-5 h-5 inline-block group-hover:translate-x-1 transition-transform" />
                </MagneticButton>
              </Link>
              <Link href="/demo" className="w-full sm:w-auto">
                <MagneticButton 
                  size="lg" 
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => events.ctaClick({ location: 'hero', label: 'See 3-Min Demo' })}
                >
                  Watch Success Stories
                  <ChevronRight className="ml-2 w-5 h-5 inline-block" />
                </MagneticButton>
              </Link>
            </motion.div>

            {/* Features */}
            <StaggerContainer
              className="grid grid-cols-2 gap-4"
              staggerDelay={0.1}
              delayChildren={0.6}
            >
              {features.map((feature, index) => (
                <StaggerItem
                  key={index}
                  className="flex items-center gap-3 glass-card p-3 hover:scale-105 transition-transform cursor-pointer group"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center group-hover:shadow-lg transition-all`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{feature.text}</span>
                </StaggerItem>
              ))}
            </StaggerContainer>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white dark:border-gray-900"
                    />
                  ))}
                </div>
                <div>
                  <div className="font-semibold">5,000+ creators</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">growing sustainably with Huntaze</div>
                </div>
              </div>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="mt-8 flex flex-wrap items-center gap-6"
            >
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Shield className="w-4 h-4 text-green-500" />
                <span>SOC 2 Type II</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Lock className="w-4 h-4 text-green-500" />
                <span>256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Norton Secured</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right content - Interactive demo */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            {/* Phone mockup with chat */}
            <div className="relative mx-auto max-w-sm">
              <div className="bg-gray-900 rounded-[3rem] p-4 shadow-2xl">
                <div className="bg-black rounded-[2.5rem] p-2">
                  <div className="bg-white dark:bg-gray-900 rounded-[2.25rem] p-6 h-[600px] overflow-hidden relative">
                    {/* Chat header */}
                    <div className="flex items-center gap-3 pb-4 border-b">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                      <div className="flex-1">
                        <div className="font-semibold">Your AI assistant</div>
                        <div className="text-xs text-green-500">Online</div>
                      </div>
                    </div>

                    {/* Animated chat messages */}
                    <div className="mt-4 space-y-4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 }}
                        className="flex gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2 max-w-[80%]">
                          <p className="text-sm">Hey! I love your content 😍 Do you do private sessions?</p>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2 }}
                        className="flex gap-3 justify-end"
                      >
                        <div className="bg-purple-600 text-white rounded-2xl px-4 py-2 max-w-[80%]">
                          <p className="text-sm">Thank you! 💜 Yes, I have a few options. Let me send the details…</p>
                        </div>
                      </motion.div>

                      {/* Typing indicator */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.5 }}
                        className="flex gap-3 justify-end"
                      >
                        <div className="bg-purple-100 dark:bg-purple-900/30 rounded-2xl px-4 py-3">
                          <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Bottom stats overlay */}
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 3 }}
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pt-20 p-6"
                    >
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Conversion rate</span>
                          <span className="text-green-500 text-sm font-bold">+312%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                            initial={{ width: "0%" }}
                            animate={{ width: "85%" }}
                            transition={{ delay: 3.5, duration: 1 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Floating testimonials */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="absolute -right-4 top-20 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-xl max-w-xs"
                >
                  <p className="text-sm mb-2">"{testimonials[currentTestimonial].text}"</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                    <div>
                      <div className="text-sm font-semibold">{testimonials[currentTestimonial].name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{testimonials[currentTestimonial].role}</div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
