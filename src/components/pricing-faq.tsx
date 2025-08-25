'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    question: "Puis-je changer de plan à tout moment ?",
    answer: "Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment. Les changements prennent effet immédiatement et sont calculés au prorata."
  },
  {
    question: "Y a-t-il des frais de configuration ?",
    answer: "Non, il n'y a aucun frais de configuration. Vous pouvez commencer immédiatement après votre inscription."
  },
  {
    question: "Quelle est la politique d'annulation ?",
    answer: "Vous pouvez annuler votre abonnement à tout moment. Votre accès restera actif jusqu'à la fin de votre période de facturation actuelle."
  },
  {
    question: "Les prix incluent-ils la TVA ?",
    answer: "Les prix affichés sont hors TVA. La TVA applicable sera ajoutée lors du paiement en fonction de votre pays de résidence."
  },
  {
    question: "Proposez-vous des réductions pour les associations ?",
    answer: "Oui, nous offrons une réduction de 20% pour les associations à but non lucratif. Contactez notre équipe pour en savoir plus."
  },
  {
    question: "Puis-je avoir un essai gratuit ?",
    answer: "Oui, tous nos plans incluent un essai gratuit de 3 mois. Aucune carte de crédit n'est requise pour commencer."
  }
]

export default function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-3xl font-bold text-center mb-12">
        Questions fréquentes
      </h2>
      
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">{faq.question}</span>
              <ChevronDown
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 text-gray-600">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}