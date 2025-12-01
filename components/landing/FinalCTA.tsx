'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Users } from 'lucide-react';
import Link from 'next/link';

interface TrustIndicator {
  icon: React.ReactNode;
  text: string;
}

interface FinalCTAProps {
  title: string;
  subtitle: string;
  primaryCTA: {
    text: string;
    href: string;
  };
  secondaryCTA: {
    text: string;
    href: string;
  };
  trustIndicators?: TrustIndicator[];
}

export function FinalCTA({
  title,
  subtitle,
  primaryCTA,
  secondaryCTA,
  trustIndicators = [
    { icon: <Shield className="w-5 h-5" />, text: 'Enterprise-grade security' },
    { icon: <Zap className="w-5 h-5" />, text: 'Setup in 5 minutes' },
    { icon: <Users className="w-5 h-5" />, text: 'Join 10,000+ creators' },
  ],
}: FinalCTAProps) {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />
      
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
            {title}
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            {subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={primaryCTA.href}
                className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg shadow-xl hover:shadow-2xl transition-all"
              >
                {primaryCTA.text}
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={secondaryCTA.href}
                className="inline-block px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg border-2 border-[var(--border-default)] hover:border-[var(--border-emphasis)] hover:bg-white/20 transition-all"
              >
                {secondaryCTA.text}
              </Link>
            </motion.div>
          </div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8 text-white/90"
          >
            {trustIndicators.map((indicator, index) => (
              <div key={index} className="flex items-center gap-2">
                {indicator.icon}
                <span className="text-sm">{indicator.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
