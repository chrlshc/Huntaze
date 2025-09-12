'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Sparkles, Zap, Crown } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

const StepCard = ({ number, title, description, icon: Icon, delay }: any) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <motion.div
      ref={ref}
      className="relative"
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ delay, duration: 0.6 }}
    >
      {/* Connector line */}
      {number < 3 && (
        <motion.div
          className="hidden lg:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-purple-600 to-pink-600"
          initial={{ scaleX: 0, originX: 0 }}
          animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ delay: delay + 0.3, duration: 0.6 }}
        />
      )}

      <motion.div
        className="bg-gray-900 rounded-2xl p-8 border border-gray-800 hover:border-purple-600/50 transition-all relative z-10"
        whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(147, 51, 234, 0.1)' }}
      >
        {/* Step number */}
        <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-xl font-bold">
          {number}
        </div>

        {/* Icon */}
        <div className="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6 ml-4">
          <Icon className="w-8 h-8 text-purple-400" />
        </div>

        {/* Content */}
        <h3 className="text-2xl font-bold mb-3">{title}</h3>
        <p className="text-gray-400 mb-4">{description}</p>

        {/* Features */}
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-gray-300">No credit card required</span>
          </li>
          <li className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-gray-300">Setup in under 5 minutes</span>
          </li>
        </ul>
      </motion.div>
    </motion.div>
  );
};

export default function GetStarted() {
  const { ref: titleRef, inView: titleInView } = useInView({ triggerOnce: true, threshold: 0.3 });

  const steps = [
    {
      number: 1,
      title: "Connect Your Platforms",
      description: "Link your OnlyFans, Instagram, TikTok, and Reddit accounts in one click.",
      icon: Zap
    },
    {
      number: 2,
      title: "Train Your AI Twin",
      description: "Upload voice samples and chat examples. Our AI learns your unique style.",
      icon: Sparkles
    },
    {
      number: 3,
      title: "Watch Revenue Grow",
      description: "Sit back as AI handles conversations and you see earnings multiply.",
      icon: Crown
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="container mx-auto px-4">
        <motion.div
          ref={titleRef}
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={titleInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-purple-600/20 text-purple-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Get Started in Minutes
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Three Steps to 10x Your Revenue
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Join thousands of creators who are already using Huntaze to transform their business
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 mb-16 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <StepCard
              key={step.number}
              {...step}
              delay={index * 0.2}
            />
          ))}
        </div>

        {/* CTA section */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-12 max-w-4xl mx-auto border border-purple-600/30">
            <h3 className="text-3xl font-bold mb-4">
              Ready to Transform Your Business?
            </h3>
            <p className="text-xl text-gray-400 mb-8">
              Start your free trial today and see results within 24 hours
            </p>

            <motion.button
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all mb-6"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Free Trial
              <ArrowRight className="w-6 h-6" />
            </motion.button>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Cancel anytime
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                No credit card required
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}