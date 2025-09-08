'use client';

import { motion } from 'framer-motion';
import GradientMesh from '@/components/animations/GradientMesh';
import Link from 'next/link';
import { IPhoneMockup } from '@/components/CSSMockups';
import Image from 'next/image';

export default function HeroAnimatedEN() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black text-white">
      <GradientMesh className="absolute inset-0" intensity={1.1} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="display-1 balance-text"
            >
              Double your revenue.
              <br />
              Cut the busywork.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lead mt-4 text-gray-300"
            >
              Unified inbox, AI assistant, revenue analytics — working together from day one.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 flex items-center justify-center lg:justify-start gap-3"
            >
              <Link href="/auth" className="px-5 py-3 rounded-xl bg-white text-black font-semibold hover:bg-white/90">
                Start free trial
              </Link>
              <Link href="#features" className="px-5 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10">
                See how it works
              </Link>
            </motion.div>
          </div>

          {/* iPhone Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <IPhoneMockup scale={0.9}>
              <div className="relative w-full h-full bg-gradient-to-br from-purple-50 to-pink-50">
                {/* Mock content - simplified dashboard */}
                <div className="p-4">
                  <div className="bg-white rounded-xl shadow-sm p-4 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-gray-900">Today's Revenue</div>
                      <div className="text-xs text-green-600">+12.5%</div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">$2,847</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl shadow-sm p-4">
                      <div className="text-xs text-gray-600 mb-1">Messages</div>
                      <div className="text-xl font-bold text-gray-900">147</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4">
                      <div className="text-xs text-gray-600 mb-1">Active Fans</div>
                      <div className="text-xl font-bold text-gray-900">892</div>
                    </div>
                  </div>
                </div>
              </div>
            </IPhoneMockup>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

