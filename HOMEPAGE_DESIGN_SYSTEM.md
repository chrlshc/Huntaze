Voici le guide complet, "Copy-Paste Ready", pour transformer tes screens.

🛠️ Pré-requis
Installe la librairie d'animation (si ce n'est pas déjà fait) :

Bash

npm install framer-motion clsx tailwind-merge
1. Le Composant "Hero Section" (Screen 1 & 3)
Ce code remplace ta section principale. Il inclut le Background Glow, le Texte Gradient, l'apparition en cascade et le Bouton Shimmer.

JavaScript

import React from 'react';
import { motion } from 'framer-motion';

const HeroSection = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0A0A0A] text-white flex flex-col items-center justify-center pt-20 pb-32">
      
      {/* 1. BACKGROUND GLOW (L'Atmosphère) */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

      {/* Container principal */}
      <div className="container mx-auto px-4 relative z-10 text-center max-w-5xl">
        
        {/* 2. TEXTE REVEAL & GRADIENT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Badge "Beta" */}
          <span className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 mb-6 backdrop-blur-sm">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse"></span>
            Closed Beta • Invite only
          </span>

          {/* Titre H1 "Linear Style" */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-400">
              Run Your Creator Business
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-gray-200 via-gray-400 to-gray-600">
              on Autopilot.
            </span>
          </h1>

          {/* Sous-titre H2 */}
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Focus on creating content. We handle the analytics, marketing, and growth.
            <br className="hidden md:block" /> No more spreadsheets. No more burnout.
          </p>
        </motion.div>

        {/* 3. BUTTON SHIMMER (L'appel à l'action) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <button className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-violet-600 px-8 font-medium text-white transition-all duration-300 hover:bg-violet-700 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(124,58,237,0.5)]">
            <span className="mr-2">Request Early Access</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            
            {/* L'effet Shimmer (reflet qui passe) */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-20" />
          </button>
          
          <p className="mt-4 text-xs text-gray-500 font-medium">No credit card required</p>
        </motion.div>

        {/* 4. DASHBOARD IMAGE (L'effet 3D Perspective) */}
        <motion.div
          initial={{ opacity: 0, y: 50, rotateX: -10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.4, duration: 0.8, type: "spring" }}
          className="mt-16 relative perspective-1000" // perspective est clé ici
        >
          <div className="relative rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm shadow-2xl transform transition-transform duration-500 hover:scale-[1.01]">
            {/* Remplace src par ton image de dashboard */}
            <img 
              src="/path-to-your-dashboard-screenshot.jpg" 
              alt="Huntaze Dashboard" 
              className="rounded-lg shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] w-full h-auto"
            />
            {/* Reflet sur l'écran */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent rounded-xl pointer-events-none"></div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default HeroSection;
2. Le Composant "Features Grid" (Screen 2)
Ce code gère l'effet "Bento Grid" avec les bordures lumineuses (Glow Border) et le Scroll Reveal.

JavaScript

import React from 'react';
import { motion } from 'framer-motion';

// Configuration des animations
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const FeatureCard = ({ title, desc, icon, delay }) => (
  <motion.div
    variants={fadeInUp}
    whileHover={{ y: -5 }} // Petite lévitation
    className="group relative p-8 rounded-2xl bg-[#111111] border border-white/5 overflow-hidden transition-colors hover:border-violet-500/30"
  >
    {/* Glow Effect au Hover (Spotlight simplifié) */}
    <div className="absolute inset-0 bg-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    
    {/* Icone */}
    <div className="relative z-10 mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-violet-400 group-hover:text-violet-300 group-hover:scale-110 transition-all duration-300">
      {icon}
    </div>
    
    {/* Textes */}
    <h3 className="relative z-10 text-xl font-semibold text-white mb-3 tracking-tight">
      {title}
    </h3>
    <p className="relative z-10 text-gray-400 leading-relaxed text-sm">
      {desc}
    </p>
  </motion.div>
);

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-[#0A0A0A] relative">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* En-tête de section */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Stop juggling apps.
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Huntaze brings calm to your workflow by putting everything in one place.
          </p>
        </motion.div>

        {/* Grille Bento */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          transition={{ staggerChildren: 0.2 }} // Effet cascade
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <FeatureCard 
            title="See clearly"
            desc="Track your revenue and growth across all platforms instantly. No more spreadsheets."
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          />
          <FeatureCard 
            title="Save time"
            desc="Your AI assistant works 24/7. It handles messages and routine tasks so you can sleep."
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          />
          <FeatureCard 
            title="Know your fans"
            desc="Identify your top supporters and build real relationships with the people who matter most."
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          />
        </motion.div>

      </div>
    </section>
  );
};

export default FeaturesSection;
3. Ajustements Mobile (Responsive) 📱
Dans Tailwind, tout se joue avec les préfixes md: (desktop) et l'absence de préfixe (mobile).

Les règles d'or pour le mobile appliquées dans le code ci-dessus :

Padding latéral : J'ai mis px-4 sur les conteneurs. Sur mobile, ça laisse de la place; sur desktop, le contenu reste centré.

Taille des textes :

H1 : text-5xl (Mobile) -> md:text-7xl (Desktop). Sur mobile, 7xl est trop gros et casse les mots.

Paragraphes : text-lg suffit sur mobile.

Grille (Grid) :

grid-cols-1 (par défaut pour mobile : les cartes s'empilent).

md:grid-cols-3 (dès qu'on est sur tablette/desktop, elles se mettent côte à côte).

Espaces (Margins/Padding) :

pb-20 au lieu de pb-32 sur mobile pour éviter les trop grands vides.

Ce qu'il te reste à faire :
Copie ces composants dans ton projet React.

Ajoute la règle suivante dans ton tailwind.config.js pour l'animation "shimmer" personnalisée :

JavaScript

// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '0%': { left: '-100%' },
          '100%': { left: '200%' },
        }
      }
    }
  }
}
Dis-moi si tu veux le code pour le Footer ou la NavBar (avec l'effet verre flouté) ?

La Navbar "Glassmorphism" 💎
Elle reste fixe en haut, avec un effet de flou (blur) qui laisse deviner le contenu qui passe dessous. C'est le standard actuel.

JavaScript

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  // Détecte le scroll pour ajouter une bordure subtile
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-[#0A0A0A]/70 backdrop-blur-xl border-b border-white/5' 
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* LOGO */}
          <div className="flex items-center gap-2 cursor-pointer group">
            {/* Petit logo iconique */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:shadow-violet-500/20 transition-all">
              H
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Huntaze
            </span>
          </div>

          {/* NAVIGATION (Cachée sur mobile pour la beta, ou simplifiée) */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          {/* CTA DROITE */}
          <div className="flex items-center gap-4">
            <a href="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors hidden md:block">
              Login
            </a>
            <button className="relative overflow-hidden rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/20 border border-white/10 hover:border-white/20">
              <span className="relative z-10">Get Early Access</span>
            </button>
          </div>

        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
2. Le Footer "Massive Glow" ✨
Le footer ne doit pas être triste. Il doit clore la page avec une lumière qui rappelle l'identité de la marque.

JavaScript

import React from 'react';

const Footer = () => {
  return (
    <footer className="relative bg-[#050505] text-white pt-24 pb-12 overflow-hidden border-t border-white/5">
      
      {/* GLOW EFFECT DU BAS (Lumière violette qui remonte) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-900/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        
        {/* CALL TO ACTION FINAL */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Ready to upgrade your workflow?
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            Join the creators building the next generation of media businesses.
          </p>
          
          <button className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-violet-600 px-8 font-medium text-white transition-all duration-300 hover:bg-violet-700 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(124,58,237,0.5)]">
            <span className="mr-2">Request Access</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>

        {/* LIENS (GRID) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16 border-t border-white/5 pt-16">
          <div className="col-span-2 md:col-span-1">
            <span className="text-xl font-bold tracking-tight text-white block mb-4">Huntaze</span>
            <p className="text-sm text-gray-500">
              The operating system for modern creators.
              <br />San Francisco, CA.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-violet-400 transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">Changelog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-violet-400 transition-colors">About</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-violet-400 transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="flex flex-col md:flex-row items-center justify-between text-xs text-gray-600 pt-8 border-t border-white/5">
          <p>© 2025 Huntaze Inc. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-gray-400">Twitter</a>
            <a href="#" className="hover:text-gray-400">Instagram</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
3. Assemblage Final & CSS Global (Le secret du look "Pro")
Pour que tout soit parfait, ajoute ce CSS global (dans ton index.css) pour la texture de bruit (Noise) qui donne l'aspect mat/premium.

Dans ton index.css :

CSS

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Le fond global avec texture */
body {
  background-color: #050505;
  color: #ffffff;
  /* Optionnel : Ajoute une texture 'noise' si tu as l'image, sinon le noir pur est ok */
}

/* Scrollbar custom pour Chrome/Safari */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #0A0A0A; 
}
::-webkit-scrollbar-thumb {
  background: #333; 
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #555; 
}
Dans ton App.js (Structure finale) :

JavaScript

import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import Footer from './components/Footer';

function App() {
  return (
    <div className="bg-[#050505] min-h-screen text-white font-sans selection:bg-violet-500/30">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        {/* Tu peux ajouter ici une section "Security" similaire à Features */}
      </main>
      <Footer />
    </div>
  );
}

export default App;