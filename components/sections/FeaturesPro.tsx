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
    title: "AI Draft Assistance",
    description: "L'IA suggère des réponses dans votre style",
    details: [
      "Suggestions de réponses personnalisées",
      "Apprentissage de votre ton",
      "Vous approuvez avant envoi"
    ],
    gradient: "from-blue-600 to-blue-800"
  },
  {
    icon: MessageSquare,
    title: "Gestion des DMs",
    description: "Organisez et priorisez vos messages",
    details: [
      "Tri automatique des messages",
      "Templates de réponses rapides",
      "Support OnlyFans et Reddit"
    ],
    gradient: "from-gray-700 to-gray-900"
  },
  {
    icon: Shield,
    title: "Conformité Plateforme",
    description: "Respectez les guidelines de chaque réseau",
    details: [
      "Vérification du contenu avant post",
      "Alertes sur les risques",
      "Conseils par plateforme"
    ],
    gradient: "from-green-600 to-emerald-700"
  },
  {
    icon: BarChart3,
    title: "Analytics Revenus",
    description: "Suivez vos performances en temps réel",
    details: [
      "Tracking des conversions",
      "Revenus par abonné",
      "Rapports hebdomadaires"
    ],
    gradient: "from-red-600 to-red-800"
  }
];

const stats = [
  { value: "+50%", label: "Gain de temps", icon: TrendingUp },
  { value: "2-3h", label: "Économisées/jour", icon: Clock },
  { value: "15min", label: "Installation", icon: Zap },
  { value: "GDPR", label: "Conforme", icon: Lock }
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Premium Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Tout ce qu'il faut<br />
            <span className="text-gradient">pour gérer vos fans</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Outils complets pour organiser vos messages, analyser vos performances et développer votre business créateur
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
              <stat.icon className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
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
          <h3 className="text-2xl font-bold mb-8">Works with your favorite platforms</h3>
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