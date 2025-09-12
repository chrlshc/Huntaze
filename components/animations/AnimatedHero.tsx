'use client';

import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Shield, Users } from 'lucide-react';
import MagneticButton from './MagneticButton';
import GradientMesh from './GradientMesh';

interface Stat {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const AnimatedHero: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  
  // Parallax transforms
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.9]);

  // Spring animation for smooth number counting
  const revenueSpring = useSpring(0, { damping: 30, stiffness: 100 });
  // Derived transforms MUST be declared at top-level (not inside JSX)
  const revenueOpacity = useTransform(revenueSpring, [0, 312], [0, 1]);
  const revenueScaleMotion = useTransform(revenueSpring, [0, 312], [0.8, 1]);
  const unitScale = useSpring(1, { damping: 10, stiffness: 100 });

  useEffect(() => {
    setMounted(true);
    // Animate revenue counter
    setTimeout(() => {
      revenueSpring.set(312);
    }, 500);
  }, [revenueSpring]);

  const stats: Stat[] = [
    { value: '10,847', label: 'Active Creators', icon: <Users className="w-4 h-4" />, color: 'from-purple-400 to-pink-400' },
    { value: '$2.3M', label: 'This month', icon: <Zap className="w-4 h-4" />, color: 'from-green-400 to-emerald-400' },
    { value: '500+', label: 'Messages/hour', icon: <Sparkles className="w-4 h-4" />, color: 'from-blue-400 to-cyan-400' },
    { value: '95%', label: 'Retention', icon: <Shield className="w-4 h-4" />, color: 'from-orange-400 to-red-400' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const
      }
    }
  };

  if (!mounted) return null;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <GradientMesh className="absolute inset-0" intensity={1.2} />
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20],
              x: [-10, 10],
              opacity: [0.2, 1, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 container mx-auto px-4 py-24"
        style={{ opacity, scale }}
      >
        <motion.div
          className="max-w-6xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-gray-300">10,847 creators earning $2.3M this month</span>
          </motion.div>

          {/* Main title */}
          <motion.div variants={itemVariants} style={{ y: y1 }}>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                Huntaze AI
              </span>
            </h1>
          </motion.div>

          {/* Revenue counter */}
          <motion.div
            variants={itemVariants}
            className="mb-8"
            style={{ y: y1 }}
          >
            <motion.div className="text-5xl md:text-6xl font-bold text-white">
              <motion.span
                className="inline-block"
                style={{
                  opacity: revenueOpacity,
                  scale: revenueScaleMotion,
                }}
              >
                +
              </motion.span>
              <motion.span
                className="inline-block tabular-nums"
                style={{
                  scale: unitScale,
                }}
              >
                {Math.floor(revenueSpring.get())}
              </motion.span>
              <motion.span
                className="inline-block"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                %
              </motion.span>
              <span className="text-2xl ml-3 text-gray-300">more revenue</span>
            </motion.div>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto"
            style={{ y: y2 }}
          >
            AI that automates your conversations, boosts sales 
            and saves you 20 hours per week
          </motion.p>

          {/* Stats grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="glass-card p-4 group"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <motion.div
                  className={`inline-flex p-2 rounded-lg bg-gradient-to-r ${stat.color} mb-2`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  {stat.icon}
                </motion.div>
                <motion.div
                  className="text-2xl font-bold text-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, type: 'spring' }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <MagneticButton
              variant="primary"
              size="large"
              onClick={() => window.location.href = '/demo'}
              className="group"
            >
              <span>Start free trial</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </MagneticButton>
            
            <MagneticButton
              variant="secondary"
              size="large"
              onClick={() => window.location.href = '/features'}
            >
              <Sparkles className="w-5 h-5" />
              <span>See live demo</span>
            </MagneticButton>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-6 mt-16 opacity-60"
          >
            {['GDPR Compliant', 'SOC2 Type II', '99.9% Uptime', '256-bit SSL'].map((badge, i) => (
              <motion.div
                key={badge}
                className="flex items-center gap-2 text-sm text-gray-400"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.6, scale: 1 }}
                transition={{ delay: 1.5 + i * 0.1 }}
                whileHover={{ opacity: 1, scale: 1.1 }}
              >
                <Shield className="w-4 h-4" />
                <span>{badge}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 cursor-pointer"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <span className="text-xs text-gray-400">Explore</span>
          <div className="w-6 h-10 border-2 border-white/20 rounded-full p-1">
            <motion.div
              className="w-1 h-3 bg-white/50 rounded-full mx-auto"
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </motion.div>

      <style jsx>{`
        @keyframes animate-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: animate-gradient 3s ease infinite;
        }
      `}</style>
    </section>
  );
};

export default AnimatedHero;
