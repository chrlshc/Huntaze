"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, Sparkles, Zap, Crown } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    icon: Sparkles,
    price: { monthly: 29, yearly: 290 },
    description: "Parfait pour débuter",
    features: [
      { text: "Jusqu'à 500 messages/mois", included: true },
      { text: "1 plateforme connectée", included: true },
      { text: "IA basique", included: true },
      { text: "Analytics essentielles", included: true },
      { text: "Support par email", included: true },
      { text: "Personnalisation avancée", included: false },
      { text: "API access", included: false }
    ],
    cta: "Commencer gratuitement",
    popular: false
  },
  {
    name: "Pro",
    icon: Zap,
    price: { monthly: 99, yearly: 990 },
    description: "Pour les créateurs sérieux",
    features: [
      { text: "Messages illimités", included: true },
      { text: "3 plateformes connectées", included: true },
      { text: "IA avancée + personnalisation", included: true },
      { text: "Analytics complètes", included: true },
      { text: "Support prioritaire 24/7", included: true },
      { text: "Formations exclusives", included: true },
      { text: "API access", included: false }
    ],
    cta: "Essai gratuit 14 jours",
    popular: true
  },
  {
    name: "Enterprise",
    icon: Crown,
    price: { monthly: 299, yearly: 2990 },
    description: "Solutions sur mesure",
    features: [
      { text: "Tout du plan Pro", included: true },
      { text: "Plateformes illimitées", included: true },
      { text: "IA personnalisée", included: true },
      { text: "Manager dédié", included: true },
      { text: "API complète", included: true },
      { text: "Formation personnalisée", included: true },
      { text: "SLA garanti", included: true }
    ],
    cta: "Contacter les ventes",
    popular: false
  }
];

export function PricingPro() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section className="py-20 md:py-32 bg-white dark:bg-black">
      <div className="container-width">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Des tarifs <span className="text-gradient">transparents</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Commencez gratuitement, évoluez à votre rythme. Pas de frais cachés.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-gray-100 dark:bg-gray-900 rounded-full">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                !isYearly
                  ? "bg-white dark:bg-gray-800 shadow-md text-purple-600 dark:text-purple-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                isYearly
                  ? "bg-white dark:bg-gray-800 shadow-md text-purple-600 dark:text-purple-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Annuel
              <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative ${plan.popular ? "md:-mt-8" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-0 right-0 text-center">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-full">
                    <Zap className="w-4 h-4" />
                    Plus populaire
                  </span>
                </div>
              )}

              <div
                className={`relative h-full bg-white dark:bg-gray-900 rounded-3xl p-8 ${
                  plan.popular
                    ? "ring-2 ring-purple-600 dark:ring-purple-400 shadow-2xl"
                    : "border border-gray-200 dark:border-gray-800"
                }`}
              >
                {/* Plan header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 mb-4">
                    <plan.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-5xl font-bold">
                      €{isYearly ? Math.floor(plan.price.yearly / 12) : plan.price.monthly}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">/mois</span>
                    {isYearly && (
                      <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                        Facturé €{plan.price.yearly} annuellement
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 dark:text-gray-700 mt-0.5 flex-shrink-0" />
                      )}
                      <span
                        className={
                          feature.included
                            ? "text-gray-700 dark:text-gray-300"
                            : "text-gray-400 dark:text-gray-600"
                        }
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link href="/onboarding" className="block">
                  <Button
                    className={`w-full py-6 text-lg font-medium ${
                      plan.popular
                        ? "btn-primary"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <div className="inline-flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Essai gratuit</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Sans engagement</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Paiement sécurisé</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Support 24/7</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}