"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Check } from "lucide-react";
import Link from "next/link";
import { events } from "@/src/lib/analytics";
import { DashboardMockup } from "@/components/dashboard-mockup";

export function HeroLinear() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, 50]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.5]);
  const [videoPlaying, setVideoPlaying] = useState(false);

  // Floating CTA that follows scroll
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingCTA(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const trustBadges = [
    "Platform compliant",
    "No credit card required",
    "Cancel anytime"
  ];

  return (
    <section className="relative min-h-screen bg-[#0F0F10] text-[#EEEFF1] overflow-hidden">
      {/* Linear-style gradient mesh background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-[#635BFF] rounded-full mix-blend-multiply filter blur-3xl opacity-10" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-[#635BFF] rounded-full mix-blend-multiply filter blur-3xl opacity-10" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      </div>

      {/* Content */}
      <motion.div 
        className="relative container-width pt-32 pb-20 md:pt-40"
        style={{ y, opacity }}
      >
        {/* Trust badges - Linear style */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {trustBadges.map((badge, index) => (
            <div key={index} className="flex items-center gap-2 text-[#9CA3AF] text-sm font-medium">
              <Check className="w-4 h-4 text-[#00D9FF]" />
              <span>{badge}</span>
            </div>
          ))}
        </div>

        {/* Main headline - Linear's bold approach */}
        <div className="max-w-5xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.1] tracking-[-0.02em] mb-8 font-['Inter']"
          >
            AI that turns
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#635BFF] to-[#4F46E5]">
              conversations into cash
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-[#9CA3AF] max-w-3xl mb-12 leading-[1.6]"
          >
            Stop losing money to unread DMs. Huntaze AI responds instantly, 
            sells naturally, and scales infinitely. Join creators earning 2-3x more.
          </motion.p>

          {/* CTAs - Linear style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/auth">
              <Button
                size="lg"
                className="bg-[#635BFF] hover:bg-[#5A51E6] text-white px-6 py-3 text-base font-medium transition-all"
                onClick={() => events.ctaClick({ location: 'hero', label: 'Start for free' })}
              >
                Start for free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            
            <Button
              size="lg"
              variant="ghost"
              className="text-[#EEEFF1] border border-[#2A2A2A] hover:bg-[#1A1A1A] px-6 py-3 text-base transition-all"
              onClick={() => setVideoPlaying(true)}
            >
              <Play className="mr-2 w-5 h-5" />
              Watch 2-min demo
            </Button>
          </motion.div>
        </div>

        {/* Dashboard preview - Linear style */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-20 relative"
        >
          <div className="relative rounded-xl overflow-hidden border border-[#2A2A2A] bg-[#151516]/80 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#635BFF]/5 via-transparent to-[#635BFF]/5" />
            <DashboardMockup />
          </div>
          
          {/* Floating stats */}
          <div className="absolute -top-4 -right-4 bg-[#151516] border border-[#2A2A2A] rounded-xl p-4 shadow-2xl hidden md:block">
            <p className="text-sm text-[#9CA3AF] mb-1 font-medium">Avg. response time</p>
            <p className="text-2xl font-bold">0.8s</p>
          </div>
          
          <div className="absolute -bottom-4 -left-4 bg-black border border-gray-800 rounded-xl p-4 shadow-2xl hidden md:block">
            <p className="text-sm text-gray-400 mb-1">Revenue increase</p>
            <p className="text-2xl font-bold text-green-400">+247%</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating CTA - Linear style */}
      {showFloatingCTA && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <Link href="/auth">
            <Button
              size="lg"
              className="bg-white hover:bg-gray-100 text-black shadow-2xl"
              onClick={() => events.ctaClick({ location: 'floating', label: 'Start for free' })}
            >
              Start for free
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Video modal */}
      {videoPlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setVideoPlaying(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="relative max-w-4xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <iframe
              className="w-full aspect-video rounded-2xl"
              src="https://www.youtube.com/embed/demo-video-id"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              onClick={() => setVideoPlaying(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}