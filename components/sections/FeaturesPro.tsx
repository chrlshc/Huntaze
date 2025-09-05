"use client";

import { motion } from "framer-motion";
import { 
  MessageSquare, 
  Brain, 
  Shield, 
  BarChart3, 
  Zap, 
  Users, 
  Globe, 
  Lock,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: Brain,
    title: "IA Personnalisée",
    description: "Notre IA apprend votre style unique et répond comme vous le feriez",
    details: [
      "Analyse de vos conversations passées",
      "Adaptation au ton et vocabulaire",
      "Amélioration continue"
    ],
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: MessageSquare,
    title: "Conversations Naturelles",
    description: "Engagez avec vos fans 24/7 sans perdre votre authenticité",
    details: [
      "Réponses contextuelles",
      "Gestion des émotions",
      "Multi-langues supporté"
    ],
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: Shield,
    title: "100% Conforme",
    description: "Respectez les règles des plateformes automatiquement",
    details: [
      "Filtrage automatique",
      "Détection de contenu sensible",
      "Mises à jour régulières"
    ],
    gradient: "from-green-500 to-emerald-500"
  },
  {
    icon: BarChart3,
    title: "Analytics Avancées",
    description: "Comprenez ce qui fonctionne et optimisez vos revenus",
    details: [
      "Taux de conversion",
      "Revenus par fan",
      "Tendances en temps réel"
    ],
    gradient: "from-orange-500 to-red-500"
  }
];

const stats = [
  { value: "300%", label: "Augmentation des revenus", icon: TrendingUp },
  { value: "24/7", label: "Disponibilité", icon: Clock },
  { value: "15min", label: "Configuration rapide", icon: Zap },
  { value: "100%", label: "Données sécurisées", icon: Lock }
];

export function FeaturesPro() {
  return (
    <section className="py-20 md:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container-width">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Fonctionnalités Premium</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Tout ce dont vous avez besoin<br />
            <span className="text-gradient">pour réussir</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Une suite complète d'outils pour automatiser, analyser et optimiser votre business de créateur
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg"
            >
              <stat.icon className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gradient mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl overflow-hidden">
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <ul className="space-y-3">
                    {feature.details.map((detail, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.2 + idx * 0.1 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-3"
                      >
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{detail}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Hover effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 dark:from-gray-800/0 dark:to-gray-700/10"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Integration showcase */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <h3 className="text-2xl font-bold mb-8">Compatible avec vos plateformes préférées</h3>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {["Instagram", "TikTok", "Reddit", "OnlyFans", "Twitter"].map((platform) => (
              <motion.div
                key={platform}
                whileHover={{ scale: 1.1 }}
                className="px-6 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-md font-medium text-gray-700 dark:text-gray-300"
              >
                {platform}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}