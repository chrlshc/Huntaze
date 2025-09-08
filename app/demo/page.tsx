'use client';

import { motion } from 'framer-motion';
import InteractiveDemo from '@/components/InteractiveDemo';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Hero Section */}
      <section className="pt-20 pb-12 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Interactive Product Tour
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Experience Huntaze in Action
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Take a guided tour through our platform and discover how Huntaze can transform 
            your workflow with AI-powered automation and insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <Link href="/pricing">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 font-semibold rounded-xl border-2 border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300"
              >
                View Pricing
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Interactive Demo Section */}
      <section className="pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <InteractiveDemo />
        </motion.div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              What You\'ll Discover
            </h2>
            <p className="text-xl text-gray-600">
              Key features that make Huntaze the platform of choice for thousands of creators
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Smart Dashboard",
                description: "Get a complete view of your business performance with customizable widgets and real-time data.",
                icon: "📊"
              },
              {
                title: "AI Automation",
                description: "Automate repetitive tasks and focus on what matters most - growing your business.",
                icon: "🤖"
              },
              {
                title: "Powerful Analytics",
                description: "Make data-driven decisions with detailed insights and performance tracking.",
                icon: "📈"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of creators who are already using Huntaze to grow their business
            </p>
            <Link href="/auth">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-purple-600 font-bold rounded-xl hover:shadow-xl transition-all duration-300"
              >
                Start Your Free Trial
              </motion.button>
            </Link>
            <p className="mt-4 text-sm opacity-75">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}