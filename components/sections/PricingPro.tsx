"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, Sparkles, Zap, Crown, CheckCircle } from "lucide-react";
import Link from "next/link";
import { events } from "@/src/lib/analytics";

const plans = [
  {
    name: "Starter",
    icon: Sparkles,
    price: { monthly: 19, yearly: 190 },
    description: "Launch your empire",
    features: [
      { text: "1,000 AI suggestions/month", included: true },
      { text: "1 platform connection", included: true },
      { text: "Basic analytics", included: true },
      { text: "7% platform fee", included: true },
      { text: "Email support", included: true },
      { text: "Social audit", included: false },
      { text: "OnlyFans audit", included: false },
      { text: "Advanced features", included: false },
      { text: "Team collaboration", included: false }
    ],
    cta: "Start Free Trial",
    popular: false
  },
  {
    name: "Pro",
    icon: Zap,
    price: { monthly: 39, yearly: 390 },
    description: "Scale to 6 figures",
    features: [
      { text: "5,000 AI suggestions/month", included: true },
      { text: "3 platform connections", included: true },
      { text: "Advanced analytics", included: true },
      { text: "5% platform fee", included: true },
      { text: "Priority support", included: true },
      { text: "Monthly social audit", included: true },
      { text: "Monthly OnlyFans audit", included: true },
      { text: "Smart automations", included: true },
      { text: "Team collaboration", included: false }
    ],
    cta: "Start Free Trial",
    popular: true
  },
  {
    name: "Scale",
    icon: Crown,
    price: { monthly: 79, yearly: 790 },
    description: "Dominate your niche",
    features: [
      { text: "25,000 AI messages/month", included: true },
      { text: "All Pro features", included: true },
      { text: "3 team seats", included: true },
      { text: "Advanced automation", included: true },
      { text: "3% platform fee", included: true },
      { text: "Weekly social audit", included: true },
      { text: "Weekly OnlyFans audit", included: true },
      { text: "Custom AI training", included: true },
      { text: "Dedicated success manager", included: true }
    ],
    cta: "Book Strategy Call",
    popular: false
  }
];

export function PricingPro() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section className="py-20 md:py-32 bg-white dark:bg-gray-950">
      <div className="container-width">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Join the <span className="text-gradient">1% club</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Where top creators keep 97% and AI does 80% of the work
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-gray-100 dark:bg-gray-900 rounded-full" role="group" aria-label="Billing">
            <button
              onClick={() => { setIsYearly(false); events.pricingToggle({ billing: 'monthly' }); }}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                !isYearly
                  ? "bg-white dark:bg-gray-800 shadow-md text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => { setIsYearly(true); events.pricingToggle({ billing: 'yearly' }); }}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                isYearly
                  ? "bg-white dark:bg-gray-800 shadow-md text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Yearly
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
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-full">
                    <Zap className="w-4 h-4" />
                    Populaire
                  </span>
                </div>
              )}

              <div
                className={`relative h-full bg-white dark:bg-gray-900 rounded-3xl p-8 ${
                  plan.popular
                    ? "ring-2 ring-blue-600 dark:ring-blue-400 shadow-2xl"
                    : "border border-gray-200 dark:border-gray-800"
                }`}
              >
                {/* Plan header */}
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center">
                    <plan.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>
                </div>

                {/* Pricing */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold">
                      ${isYearly ? Math.round(plan.price.yearly / 12) : plan.price.monthly}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">/month</span>
                  </div>
                  {isYearly && (
                    <p className="text-sm text-gray-500 mt-2">
                      billed annually (${plan.price.yearly}/year)
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <Link href={plan.popular ? "/onboarding" : "/demo"}>
                  <Button
                    size="lg"
                    className={`w-full mb-8 ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                        : "bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900"
                    }`}
                    onClick={() => events.planSelect({ plan: plan.name, billing: isYearly ? 'yearly' : 'monthly' })}
                  >
                    {plan.cta}
                  </Button>
                </Link>

                {/* Features */}
                <ul className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included
                            ? "text-gray-700 dark:text-gray-300"
                            : "text-gray-500 dark:text-gray-500"
                        }`}
                      >
                        {feature.text}
                        {!feature.included && (
                          <span className="ml-1 text-xs text-gray-500">(Available on higher plan)</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All plans include: Secure payments • GDPR compliant • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}
