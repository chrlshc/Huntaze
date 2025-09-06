"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, Zap, Shield, BarChart3, Globe2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSafeTheme } from "@/src/hooks/useSafeTheme";

const features = [
  { icon: Zap, text: "Suggestions IA" },
  { icon: Shield, text: "Respect des règles" },
  { icon: BarChart3, text: "Suivi des revenus" },
  { icon: Globe2, text: "Compatible OnlyFans" },
];

const testimonials = [
  { name: "Alex M.", role: "Créatrice", text: "2 heures de gagnées par jour sur mes messages" },
  { name: "Jordan S.", role: "Créatrice de contenu", text: "Meilleur engagement avec les suggestions IA" },
  { name: "Ryan K.", role: "Créatrice", text: "Mes DMs enfin organisés efficacement" },
];

export function HeroPro() {
  const { theme } = useSafeTheme();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

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
      
      {/* Floating shapes animation */}
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

      <div className="container-width relative z-10 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6"
            >
              <Zap className="w-4 h-4" />
              <span>Plateforme IA pour créatrices</span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
            >
              <span className="text-gradient">Gardez 95%</span><br />
              de vos<br />
              <span className="relative">
                revenus
                <motion.span
                  className="absolute -bottom-2 left-0 right-0 h-3 bg-blue-500 opacity-30 rounded-lg"
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
              className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
            >
              L'IA vous aide à rédiger des réponses personnalisées. Vous gardez le contrôle, 
              approuvez chaque message. Compatible OnlyFans, Instagram et Reddit. 
              Économisez 2-3 heures par jour sur vos DMs.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <Link href="/onboarding">
                <Button className="btn-primary group px-8 py-6 text-lg">
                  Essai gratuit
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" className="px-8 py-6 text-lg border-2">
                  Voir la démo
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 gap-4"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>

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
                  <div className="font-semibold">+2,500 créatrices</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">nous font confiance</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right content - Interactive demo */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
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
                        <div className="font-semibold">Votre assistante IA</div>
                        <div className="text-xs text-green-500">En ligne</div>
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
                          <p className="text-sm">Salut! J'adore ton contenu 😍 Tu proposes des sessions privées?</p>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2 }}
                        className="flex gap-3 justify-end"
                      >
                        <div className="bg-purple-600 text-white rounded-2xl px-4 py-2 max-w-[80%]">
                          <p className="text-sm">Merci beaucoup! 💜 Oui, j'ai plusieurs options disponibles. Laisse-moi t'envoyer les détails...</p>
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