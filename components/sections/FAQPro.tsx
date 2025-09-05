"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Comment l'IA apprend-elle mon style de communication ?",
    answer: "Notre IA analyse vos conversations passées pour comprendre votre ton, votre vocabulaire et vos patterns de réponse. Elle s'améliore continuellement grâce au machine learning, tout en respectant votre vie privée. Vous gardez toujours le contrôle final sur les messages envoyés."
  },
  {
    question: "Mes données sont-elles en sécurité ?",
    answer: "Absolument. Nous utilisons un chiffrement de niveau bancaire (AES-256) pour toutes vos données. Vos contenus ne sont jamais partagés ni vendus. Nous sommes conformes RGPD et vous pouvez supprimer vos données à tout moment. Nos serveurs sont hébergés en France."
  },
  {
    question: "Puis-je utiliser Huntaze sur plusieurs plateformes ?",
    answer: "Oui ! Huntaze fonctionne avec Instagram, TikTok, Reddit, et d'autres plateformes. Le nombre de plateformes connectées dépend de votre plan. Vous pouvez gérer toutes vos conversations depuis un seul dashboard."
  },
  {
    question: "Que se passe-t-il si je veux annuler ?",
    answer: "Vous pouvez annuler votre abonnement à tout moment depuis votre dashboard. Il n'y a pas de frais d'annulation ni de période d'engagement minimum. Votre accès reste actif jusqu'à la fin de votre période de facturation."
  },
  {
    question: "L'IA peut-elle gérer les paiements et les ventes ?",
    answer: "L'IA peut guider les conversations vers la vente et proposer vos offres, mais les transactions restent sur les plateformes originales. Cela garantit la sécurité et la conformité avec les règles de chaque plateforme."
  },
  {
    question: "Combien de temps faut-il pour configurer Huntaze ?",
    answer: "La configuration initiale prend environ 15 minutes. Connectez vos comptes, laissez l'IA analyser vos conversations (quelques minutes), personnalisez vos préférences, et c'est parti ! Notre équipe support est là pour vous aider si besoin."
  }
];

export function FAQPro() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 md:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container-width max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            <span>FAQ</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Questions <span className="text-gradient">fréquentes</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Tout ce que vous devez savoir sur Huntaze et comment il peut transformer votre business
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <h3 className="font-semibold text-lg pr-4">{faq.question}</h3>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5">
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vous avez d'autres questions ?
          </p>
          <a
            href="mailto:support@huntaze.com"
            className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium hover:underline"
          >
            Contactez notre équipe support
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}