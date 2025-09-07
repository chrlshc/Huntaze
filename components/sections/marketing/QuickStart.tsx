"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles,
  UserPlus,
  Link as LinkIcon,
  Rocket,
  CheckCircle,
  ArrowRight,
  Clock,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function QuickStart() {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      number: 1,
      title: 'Create your account',
      description: 'Sign up with email or social login in seconds',
      icon: UserPlus,
      duration: '30 seconds',
      details: [
        'No credit card required',
        'Instant account activation',
        'Free 14-day trial',
        'Cancel anytime'
      ]
    },
    {
      number: 2,
      title: 'Connect your platforms',
      description: 'Link all your accounts with one-click authorization',
      icon: LinkIcon,
      duration: '2 minutes',
      details: [
        'Secure OAuth connection',
        'Auto-import existing content',
        'Sync fans & messages',
        'Historical data import'
      ]
    },
    {
      number: 3,
      title: 'Start smarter',
      description: 'Let automation handle the busywork while you create',
      icon: Rocket,
      duration: 'Immediate',
      details: [
        'Automation starts instantly',
        'Measurable improvements in weeks',
        'Continuous optimization',
        'You stay in control'
      ]
    }
  ];

  const testimonials = [
    {
      name: 'Ashley Rivera',
      role: 'Top 0.5% Creator',
      content: 'Set up in 5 minutes, making 5x more in 5 weeks.',
      revenue: '$85k/month',
      image: '/api/placeholder/48/48'
    },
    {
      name: 'Jenna Park',
      role: 'Rising Star',
      content: 'The easiest platform I\'ve ever used. Period.',
      revenue: '$42k/month',
      image: '/api/placeholder/48/48'
    },
    {
      name: 'Sophia Chen',
      role: 'Content Queen',
      content: 'From signup to first sale in under 10 minutes!',
      revenue: '$120k/month',
      image: '/api/placeholder/48/48'
    }
  ];

  return (
    <section id="quickstart" className="py-24 lg:py-32 bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100 dark:bg-purple-950/20 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 dark:bg-blue-950/20 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-8">
            <Clock className="w-4 h-4" />
            <span>Average setup time: 3 minutes</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Start selling in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">
              no time
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Three simple steps. That's all it takes to transform your creator business.
          </p>
        </motion.div>

        {/* Steps Section */}
        <div className="max-w-6xl mx-auto mb-20">
          {/* Step Indicators */}
          <div className="flex justify-between items-center mb-12 relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 -translate-y-1/2" />
            <div 
              className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-purple-600 to-blue-600 -translate-y-1/2 transition-all duration-500"
              style={{ width: `${((activeStep - 1) / 2) * 100}%` }}
            />
            
            {steps.map((step, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(step.number)}
                className="relative z-10 group"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                    activeStep >= step.number
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {activeStep > step.number ? (
                    <CheckCircle className="w-8 h-8" />
                  ) : (
                    step.number
                  )}
                </motion.div>
                <span className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 text-sm font-medium whitespace-nowrap ${
                  activeStep >= step.number ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.title}
                </span>
              </button>
            ))}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="grid lg:grid-cols-2 gap-12 items-center mt-20"
            >
              {/* Left: Step Details */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center">
                    {React.createElement(steps[activeStep - 1].icon, {
                      className: "w-7 h-7 text-purple-600 dark:text-purple-400"
                    })}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Step {activeStep}: {steps[activeStep - 1].title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Time needed: {steps[activeStep - 1].duration}
                    </p>
                  </div>
                </div>

                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                  {steps[activeStep - 1].description}
                </p>

                <ul className="space-y-3 mb-8">
                  {steps[activeStep - 1].details.map((detail, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {detail}
                      </span>
                    </motion.li>
                  ))}
                </ul>

                {activeStep === 3 && (
                  <Link href="/demo">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                    >
                      Start now - it's free
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                )}
              </div>

              {/* Right: Visual */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-3xl blur-2xl" />
                
                <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-xl">
                  <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-2xl flex items-center justify-center">
                    <span className="text-gray-400 dark:text-gray-600">
                      Step {activeStep} Preview
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h3 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-12">
            Creators are up and running in minutes
          </h3>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {testimonial.revenue}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 text-white max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold mb-4">
              Your empire awaits
            </h3>
            <p className="text-xl text-purple-100 mb-8">
              Join 50,000+ creators who've transformed their business with Huntaze.
              Start your free trial now and see results in 24 hours.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/demo">
                <Button
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Start free trial
                </Button>
              </Link>
              <div className="flex items-center gap-4 text-purple-100">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  No credit card
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  14 days free
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
