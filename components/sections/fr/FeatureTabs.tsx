'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, BarChart3, CreditCard, Bot, Shield, Users } from 'lucide-react';

type FeatureKey = 'inbox' | 'analytics' | 'payments' | 'ai' | 'security' | 'collab';

const FEATURES: Record<FeatureKey, { title: string; desc: string; bullets: string[]; icon: any; color: string }[]> = {
  inbox: [{
    title: 'Messagerie unifiée',
    desc: 'Instagram, TikTok et OnlyFans réunis au même endroit. Répondez 2× plus vite et ne manquez jamais une vente.',
    bullets: [
      'Priorité automatique des conversations à haut potentiel',
      'Templates et snippets IA en un clic',
      'Affectation à l’équipe et notes internes'
    ],
    icon: MessageSquare,
    color: 'from-purple-500 to-pink-500'
  }],
  analytics: [{
    title: 'Analytics revenus',
    desc: 'Comprenez ce qui fait croître vos revenus et où investir votre temps.',
    bullets: [
      'LTV, rétention, ARPU par segment',
      'Cohortes par campagne et plateforme',
      'Alertes intelligentes quand une métrique décroche'
    ],
    icon: BarChart3,
    color: 'from-green-500 to-emerald-500'
  }],
  payments: [{
    title: 'Paiements et offres',
    desc: 'Générez des offres ciblées et suivez la conversion en temps réel.',
    bullets: [
      'Bundles et PPV dynamiques',
      'Codes promo et campagnes',
      'Dashboard revenus multi-plateformes'
    ],
    icon: CreditCard,
    color: 'from-blue-500 to-cyan-500'
  }],
  ai: [{
    title: 'Assistant IA',
    desc: 'Réponses naturelles, upsell contextualisé et messages 24/7 — toujours dans votre ton.',
    bullets: [
      'Fine‑tuning sur votre historique',
      'Sécurité: jamais d’envoi sans validation si vous le souhaitez',
      'Détection d’intention et suivi des opportunités'
    ],
    icon: Bot,
    color: 'from-amber-500 to-orange-500'
  }],
  security: [{
    title: 'Sécurité & conformité',
    desc: 'Chiffrement, rôles & permissions, audit des accès. Votre business, en sécurité.',
    bullets: [
      'Chiffrement au repos et en transit',
      'SSO agence et 2FA',
      'Journalisation conforme'
    ],
    icon: Shield,
    color: 'from-indigo-500 to-sky-500'
  }],
  collab: [{
    title: 'Collaboration',
    desc: 'Travaillez à plusieurs sans friction — rôles clairs, contenus partagés, productivité maximale.',
    bullets: [
      'Rôles granularisés (Créateur, Manager, Assistant)',
      'Bibliothèque de contenus et approbations',
      'Commentaires et tâches sur conversation'
    ],
    icon: Users,
    color: 'from-fuchsia-500 to-rose-500'
  }],
};

const ORDER: FeatureKey[] = ['inbox', 'analytics', 'payments', 'ai', 'security', 'collab'];

export default function FeatureTabsFR() {
  const [active, setActive] = useState<FeatureKey>('inbox');
  const data = FEATURES[active][0];
  const Icon = data.icon;

  return (
    <section className="py-24 bg-gradient-to-b from-black via-black to-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-12">
          Une plateforme, tout gérer
        </h2>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {ORDER.map(key => {
            const label = FEATURES[key][0].title;
            const isActive = key === active;
            return (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                  isActive ? 'bg-white text-black border-white' : 'border-white/20 hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Panel */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={active + '-copy'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="inline-flex items-center gap-3 mb-4">
                <span className={`p-2 rounded-lg bg-gradient-to-r ${data.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </span>
                <h3 className="text-2xl font-bold">{data.title}</h3>
              </div>
              <p className="text-gray-300 mb-6">{data.desc}</p>
              <ul className="space-y-2 text-gray-200">
                {data.bullets.map(b => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-white/70" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>

          {/* Mockup placeholder */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active + '-mock'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-2xl border border-white/10 overflow-hidden"
            >
              <div className={`h-[320px] bg-gradient-to-br ${data.color} opacity-80`} />
              <div className="absolute inset-0 grid place-items-center">
                <p className="text-sm text-white/90">Mockup d’interface — {data.title}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

