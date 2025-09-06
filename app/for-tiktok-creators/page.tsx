"use client";

import { motion } from "framer-motion";
import { Music, Users, MessageSquare, TrendingUp, Shield, Clock, ArrowRight, Video } from "lucide-react";
import Link from "next/link";
import { MagneticButton } from "@/src/components/ui/magnetic-button";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: Video,
    title: "Convert Views to Revenue",
    description: "Turn your TikTok audience into paying subscribers with smart funnel automation"
  },
  {
    icon: MessageSquare,
    title: "Manage DMs at Scale",
    description: "Handle thousands of messages without losing the personal touch"
  },
  {
    icon: Clock,
    title: "Post at Peak Times",
    description: "AI determines when your audience is most active and engaged"
  },
  {
    icon: Shield,
    title: "TikTok Compliant",
    description: "Stay within community guidelines while maximizing monetization"
  }
];

const challenges = [
  "TikTok fame but struggling to monetize",
  "Losing potential customers in DM chaos",
  "No clear path from viral videos to income",
  "Manually copying fans to other platforms"
];

export default function TikTokCreatorsPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-black to-gray-900">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
              <Music className="w-4 h-4" />
              <span>For TikTok Creators</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Turn TikTok Fame Into 
              <span className="text-gradient bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent"> Real Income</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              You've mastered going viral. Now master monetization. 
              Convert your TikTok following into sustainable revenue with AI automation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/onboarding">
                <MagneticButton size="lg" className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-cyan-500 text-white hover:from-pink-600 hover:to-cyan-600">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </MagneticButton>
              </Link>
              <Link href="/demo">
                <MagneticButton size="lg" variant="secondary" className="w-full sm:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20">
                  Watch Demo
                </MagneticButton>
              </Link>
            </div>

            <p className="text-sm text-gray-400">
              Free trial • No credit card • Setup in minutes
            </p>
          </motion.div>
        </div>

        {/* Animated background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-cyan-500/20 animate-pulse" />
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The TikTok Creator Dilemma
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Millions of views, thousands of followers, but where's the income?
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {challenges.map((challenge, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">{challenge}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              You're not alone. We've helped 1,500+ TikTok creators turn followers into income.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-gradient-to-r from-pink-50 to-cyan-50 dark:from-gray-900 dark:to-gray-950">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your TikTok Monetization Toolkit
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Everything you need to convert followers into paying fans
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 text-center shadow-lg"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Story */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                From 0 to $12K/Month in 6 Months
              </h2>
              <p className="text-xl text-gray-300">
                How TikTok creator Emma turned her dance videos into a business
              </p>
            </div>

            <div className="bg-gray-800 rounded-3xl p-8 md:p-12">
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-pink-500 mb-2">2.1M</div>
                  <p className="text-gray-400">TikTok Followers</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-cyan-500 mb-2">$12K</div>
                  <p className="text-gray-400">Monthly Revenue</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-500 mb-2">15hrs</div>
                  <p className="text-gray-400">Saved Weekly</p>
                </div>
              </div>
              
              <blockquote className="text-lg italic text-gray-300 text-center">
                "I was getting millions of views but making nothing. Huntaze helped me build 
                a sales funnel that converts TikTok fans into paying subscribers. Now I run 
                a real business, not just a TikTok account."
              </blockquote>
              
              <p className="text-sm text-gray-500 text-center mt-6">
                Individual results vary. Success depends on audience, content, and effort.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Earning in 3 Simple Steps
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {[
              {
                number: "01",
                title: "Connect Your Platforms",
                description: "Link TikTok, Instagram, and your monetization platforms in one dashboard"
              },
              {
                number: "02",
                title: "Set Up Your Funnel",
                description: "AI creates personalized funnels to convert followers into customers"
              },
              {
                number: "03",
                title: "Watch Revenue Flow",
                description: "Automated DMs, content scheduling, and sales tracking work 24/7"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className={`flex gap-6 mb-12 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
              >
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {step.number}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-pink-600 to-cyan-600 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your TikTok Success Starts Now
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join 1,500+ TikTok creators earning real income from their following
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/onboarding">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                  Start Your Free Trial
                </Button>
              </Link>
              <Link href="/case-studies">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                  See Success Stories
                </Button>
              </Link>
            </div>
            <p className="text-sm mt-6 opacity-75">
              No credit card required • Cancel anytime • Results vary by creator
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}