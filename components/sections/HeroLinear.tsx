"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Check } from "lucide-react";
import Link from "next/link";
import { events } from "@/src/lib/analytics";

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
    <section className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Linear-style gradient mesh background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
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
            <div key={index} className="flex items-center gap-2 text-gray-400 text-sm">
              <Check className="w-4 h-4 text-green-400" />
              <span>{badge}</span>
            </div>
          ))}
        </div>

        {/* Main headline - Linear's bold approach */}
        <div className="max-w-5xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.9] tracking-tight mb-8"
          >
            AI that turns
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
              conversations into cash
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-gray-400 max-w-3xl mb-12 leading-relaxed"
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
                className="bg-white hover:bg-gray-100 text-black px-8 py-6 text-lg font-medium"
                onClick={() => events.ctaClick({ location: 'hero', label: 'Start for free' })}
              >
                Start for free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            
            <Button
              size="lg"
              variant="ghost"
              className="text-white border border-gray-800 hover:bg-gray-900 px-8 py-6 text-lg"
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
          <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-gray-950/50 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/10 via-transparent to-pink-600/10" />
            <img
              src="/dashboard-preview.png"
              alt="Huntaze Dashboard"
              className="w-full h-auto"
            />
          </div>
          
          {/* Floating stats */}
          <div className="absolute -top-4 -right-4 bg-black border border-gray-800 rounded-xl p-4 shadow-2xl hidden md:block">
            <p className="text-sm text-gray-400 mb-1">Avg. response time</p>
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