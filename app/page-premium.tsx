'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, Check, Zap, TrendingUp, Shield, DollarSign, Users, Star } from 'lucide-react';

// Import premium animation components
import AnimatedHero from '@/components/animations/AnimatedHero';
import PhoneMockup3DWrapper from '@/components/animations/PhoneMockup3DWrapper';
// Lazy-load LiveDashboard to avoid SSR/hydration issues with Chart.js
const LiveDashboard = dynamic(() => import('@/components/animations/LiveDashboard'), { ssr: false });
import { ScrollReveal, ScrollParallax, StaggerChildren, ScrollProgressBar } from '@/components/animations/ScrollAnimations';

// Lazy load existing components
const PlatformLogos = dynamic(() => import('@/components/platform-logos'));
const FAQSection = dynamic(() => import('@/components/faq-section'));

export default function HomePagePremium() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);

    // Initialize smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* Scroll progress indicator */}
      <ScrollProgressBar />
      
      {/* Premium Animated Hero Section */}
      <AnimatedHero />
      
      {/* 3D Phone Mockup showcase */}
      <ScrollParallax offset={100}>
        <PhoneMockup3DWrapper />
      </ScrollParallax>
      
      {/* Live Dashboard Demo */}
      <ScrollReveal delay={0.2}>
        <LiveDashboard />
      </ScrollReveal>

      {/* Platform logos with animation */}
      <ScrollReveal>
        <section className="py-16 border-y border-white/10">
          <div className="max-w-7xl mx-auto px-4">
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-center text-lg font-semibold text-gray-200 mb-8"
            >
              Fonctionne avec toutes les plateformes majeures
            </motion.p>
            <PlatformLogos />
          </div>
        </section>
      </ScrollReveal>

      {/* Comparison Section - Premium Design */}
      <ScrollParallax offset={50}>
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-16">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Les Maths Sont Simples
                  </span>
                </h2>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  Voyez exactement combien vous gagnerez en plus avec Huntaze
                </p>
              </div>
            </ScrollReveal>

            {/* Premium comparison cards */}
            <StaggerChildren staggerDelay={0.2} className="grid lg:grid-cols-3 gap-8 mb-16">
              {/* Traditional Agency Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative glass-card p-8 border border-red-500/20"
              >
                <div className="absolute -top-4 left-8 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                  Agence Traditionnelle
                </div>
                <div className="mt-4">
                  <div className="text-center mb-8">
                    <motion.div 
                      className="text-6xl font-black text-red-500 mb-2"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 100 }}
                    >
                      50%
                    </motion.div>
                    <p className="text-xl font-semibold text-white">Taux de Commission</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        <span className="text-red-400 text-sm">✕</span>
                      </div>
                      <span className="text-gray-300">Messagerie manuelle</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        <span className="text-red-400 text-sm">✕</span>
                      </div>
                      <span className="text-gray-300">Heures limitées</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        <span className="text-red-400 text-sm">✕</span>
                      </div>
                      <span className="text-gray-300">Aucun contrôle</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Huntaze Card - Featured */}
              <motion.div
                whileHover={{ scale: 1.08 }}
                className="relative glass-card p-8 ring-2 ring-purple-500 shadow-2xl shadow-purple-500/20 transform scale-105"
              >
                <div className="absolute -top-4 left-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                  Huntaze Pro
                </div>
                <div className="mt-4">
                  <div className="text-center mb-8">
                    <motion.div 
                      className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                    >
                      1.5%
                    </motion.div>
                    <p className="text-xl font-semibold text-white">Taux de Commission</p>
                  </div>
                  <div className="space-y-4">
                    <motion.div 
                      className="flex items-center gap-3"
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium">IA automation 24/7</span>
                    </motion.div>
                    <motion.div 
                      className="flex items-center gap-3"
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium">Ne ratez jamais une vente</span>
                    </motion.div>
                    <motion.div 
                      className="flex items-center gap-3"
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium">Vous possédez tout</span>
                    </motion.div>
                  </div>
                  <motion.button 
                    className="w-full mt-8 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Commencer Gratuitement
                  </motion.button>
                </div>
              </motion.div>

              {/* Savings Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative glass-card p-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20"
              >
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-6">
                    Vos Économies Mensuelles
                  </h3>
                  <div className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <p className="text-gray-300 mb-2">Gagnant 5k€/mois</p>
                      <motion.p 
                        className="text-3xl font-black text-green-400"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.4 }}
                      >
                        +2,420€
                      </motion.p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <p className="text-gray-300 mb-2">Gagnant 10k€/mois</p>
                      <motion.p 
                        className="text-3xl font-black text-green-400"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.6 }}
                      >
                        +4,850€
                      </motion.p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      <p className="text-gray-300 mb-2">Gagnant 25k€/mois</p>
                      <motion.p 
                        className="text-3xl font-black text-green-400"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.8 }}
                      >
                        +12,125€
                      </motion.p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </StaggerChildren>

            {/* ROI Calculator CTA */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link href="/pricing">
                <motion.button 
                  className="px-8 py-4 border-2 border-purple-500 text-purple-400 font-bold rounded-xl hover:bg-purple-500/10 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Calculez Vos Économies Exactes →
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>
      </ScrollParallax>

      {/* Features Grid - Modern Design */}
      <ScrollReveal>
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <motion.h2 
                className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Tout Pour Scaler
                </span>
              </motion.h2>
              <motion.p 
                className="text-xl text-gray-300 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Les outils professionnels que les top créateurs utilisent pour maximiser leurs revenus
              </motion.p>
            </div>

            <StaggerChildren staggerDelay={0.1} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Zap className="w-8 h-8" />,
                  title: "Assistant IA",
                  description: "Répond instantanément à chaque message avec des réponses personnalisées qui convertissent",
                  gradient: "from-purple-500 to-pink-500"
                },
                {
                  icon: <TrendingUp className="w-8 h-8" />,
                  title: "Analytics Avancés",
                  description: "Suivez vos gains, identifiez vos meilleurs fans et optimisez votre stratégie",
                  gradient: "from-blue-500 to-cyan-500"
                },
                {
                  icon: <Users className="w-8 h-8" />,
                  title: "Gestion des Fans",
                  description: "Segmentez automatiquement par dépenses, engagement et préférences",
                  gradient: "from-pink-500 to-rose-500"
                },
                {
                  icon: <Shield className="w-8 h-8" />,
                  title: "100% Sécurisé",
                  description: "Conçu pour respecter les guidelines - aucun risque pour vos comptes",
                  gradient: "from-green-500 to-emerald-500"
                },
                {
                  icon: <DollarSign className="w-8 h-8" />,
                  title: "Pricing Intelligent",
                  description: "L'IA suggère les prix optimaux basés sur le comportement des fans",
                  gradient: "from-yellow-500 to-orange-500"
                },
                {
                  icon: <ArrowRight className="w-8 h-8" />,
                  title: "Setup Rapide",
                  description: "Connectez vos comptes et commencez à gagner plus en 2 minutes",
                  gradient: "from-red-500 to-pink-500"
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="glass-card p-8 group cursor-pointer relative overflow-hidden"
                  whileHover={{ scale: 1.05, y: -10 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div 
                    className={`absolute inset-0 opacity-0 bg-gradient-to-br ${feature.gradient} group-hover:opacity-10 transition-opacity`}
                  />
                  <motion.div 
                    className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 text-white`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </StaggerChildren>
          </div>
        </section>
      </ScrollReveal>

      {/* FAQ */}
      <ScrollReveal>
        <FAQSection />
      </ScrollReveal>

      {/* Final CTA */}
      <ScrollParallax offset={-50}>
        <section className="py-24 px-4 bg-gradient-to-br from-purple-600 to-pink-600 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-32 h-32 bg-white/10 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 5 + Math.random() * 5,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                }}
              />
            ))}
          </div>
          
          <motion.div 
            className="max-w-4xl mx-auto text-center relative z-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6">
              Prêt à Garder Plus de Vos Revenus?
            </h2>
            <p className="text-xl text-purple-100 mb-12">
              Rejoignez des milliers de créateurs qui ont repris le contrôle de leur business
            </p>
            <Link href="/auth">
              <motion.button 
                className="px-12 py-5 bg-white text-purple-600 font-bold text-lg rounded-2xl shadow-xl"
                whileHover={{ scale: 1.05, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                whileTap={{ scale: 0.95 }}
              >
                Commencer Votre Essai Gratuit
              </motion.button>
            </Link>
            <motion.p 
              className="text-purple-200 mt-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Aucune carte requise • Setup en 2 minutes • Annulez quand vous voulez
            </motion.p>
          </motion.div>
        </section>
      </ScrollParallax>
    </div>
  );
}
