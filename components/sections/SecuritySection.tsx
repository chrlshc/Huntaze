'use client';

import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Database, 
  Key, 
  FileCheck, 
  Activity,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export default function SecuritySection() {
  const securityFeatures = [
    {
      icon: Lock,
      title: "Chiffrement de bout en bout",
      description: "TLS 1.3+ en transit, AES-256 au repos",
      badge: "Enterprise Grade"
    },
    {
      icon: Shield,
      title: "Conformité RGPD/CCPA",
      description: "Suppression sur demande, droit à l'oubli",
      badge: "100% Compliant"
    },
    {
      icon: Database,
      title: "Isolation des données",
      description: "Aucun entraînement croisé entre comptes",
      badge: "Data Privacy"
    },
    {
      icon: Key,
      title: "Authentification 2FA",
      description: "Protection renforcée avec journal d'audit",
      badge: "Secure Access"
    },
    {
      icon: FileCheck,
      title: "Hébergement certifié",
      description: "Infrastructure SOC 2 Type II / ISO 27001",
      badge: "Certified"
    },
    {
      icon: Activity,
      title: "Monitoring 24/7",
      description: "99.99% uptime garanti, status page public",
      badge: "Always On"
    }
  ];

  const certifications = [
    { name: "SOC 2", logo: "🛡️" },
    { name: "ISO 27001", logo: "🔒" },
    { name: "RGPD", logo: "🇪🇺" },
    { name: "CCPA", logo: "🇺🇸" }
  ];

  return (
    <section className="py-20 px-4 bg-black relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 60 0 L 0 0 0 60" fill="none" stroke="white" stroke-width="1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23grid)"/%3E%3C/svg%3E')] bg-center" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20 mb-6">
            <Shield className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-green-400">Sécurité Enterprise</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Vos données sont sacrées
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Protection militaire pour vos contenus et conversations. 
            Conforme aux standards les plus stricts de l'industrie.
          </p>
        </motion.div>

        {/* Security Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-green-500/30 transition-all h-full">
                {/* Badge */}
                <div className="absolute -top-3 right-4">
                  <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
                    {feature.badge}
                  </span>
                </div>

                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-green-400" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>

                {/* Hover effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-800"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Certifications & Conformités
              </h3>
              <p className="text-gray-400">
                Audité et certifié par les organismes leaders du secteur
              </p>
            </div>

            {/* Certification badges */}
            <div className="flex gap-6">
              {certifications.map((cert, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center text-2xl mb-2">
                    {cert.logo}
                  </div>
                  <p className="text-xs text-gray-400 font-medium">{cert.name}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Trust Points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-3 gap-4 mt-8"
        >
          <div className="flex items-center gap-3 p-4 bg-gray-900/30 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-sm text-gray-300">Aucune donnée vendue à des tiers</span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-900/30 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-sm text-gray-300">Suppression définitive en 24h</span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-900/30 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-sm text-gray-300">Audit de sécurité mensuel</span>
          </div>
        </motion.div>

        {/* Status Page Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mt-12"
        >
          <a 
            href="https://status.huntaze.com" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Activity className="w-5 h-5" />
            <span className="font-medium">Voir notre status page en temps réel</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            99.99% uptime • Temps de réponse < 200ms • Infrastructure globale
          </p>
        </motion.div>
      </div>
    </section>
  );
}