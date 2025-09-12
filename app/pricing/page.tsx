"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import HeaderImproved from "@/src/components/header-improved";
import FooterImproved from "@/src/components/footer-improved";
import { Button } from "@/components/ui/button";
import { Check, X, Sparkles, Zap, Crown } from "lucide-react";
import { events } from "@/src/lib/analytics";

const plans = [
  {
    name: "Starter",
    icon: Sparkles,
    description: "Perfect for new creators",
    price: { monthly: 19, yearly: 15 },
    commission: "7%",
    features: [
      { text: "1,000 AI messages/month", included: true },
      { text: "1 platform connection", included: true },
      { text: "Basic analytics", included: true },
      { text: "Email support", included: true },
      { text: "Mobile app access", included: true },
      { text: "Advanced analytics", included: false },
      { text: "Team collaboration", included: false },
      { text: "Priority support", included: false },
      { text: "Custom AI training", included: false }
    ],
    cta: "Start free trial",
    popular: false
  },
  {
    name: "Pro",
    icon: Zap,
    description: "For growing creators",
    price: { monthly: 49, yearly: 39 },
    commission: "5%",
    features: [
      { text: "5,000 AI messages/month", included: true },
      { text: "3 platform connections", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Priority support", included: true },
      { text: "A/B testing tools", included: true },
      { text: "Custom workflows", included: true },
      { text: "API access", included: true },
      { text: "Team collaboration", included: false },
      { text: "Custom AI training", included: false }
    ],
    cta: "Start free trial",
    popular: true
  },
  {
    name: "Scale",
    icon: Crown,
    description: "For power creators",
    price: { monthly: 79, yearly: 63 },
    commission: "3%",
    features: [
      { text: "Unlimited AI messages", included: true },
      { text: "Unlimited platforms", included: true },
      { text: "Advanced analytics", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Custom AI training", included: true },
      { text: "White-label options", included: true },
      { text: "SLA guarantee", included: true },
      { text: "Team seats (up to 5)", included: true },
      { text: "Custom integrations", included: true }
    ],
    cta: "Contact sales",
    popular: false
  }
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <>
      <HeaderImproved />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-black">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              Simple pricing,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                powerful results
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8">
              Start free. Scale as you grow. Cancel anytime.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 p-1 bg-gray-100 dark:bg-gray-900 rounded-full">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  billingCycle === "monthly"
                    ? "bg-white dark:bg-black text-gray-900 dark:text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  billingCycle === "yearly"
                    ? "bg-white dark:bg-black text-gray-900 dark:text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                Yearly
                <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-white dark:bg-black">
        <div className="container-width">
          <div className="grid md:grid-cols-3 gap-8 lg:gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative ${plan.popular ? "md:-mt-8" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-0 right-0 text-center">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-full">
                      <Zap className="w-4 h-4" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div
                  className={`relative h-full bg-white dark:bg-gray-900 rounded-3xl p-8 ${
                    plan.popular
                      ? "ring-2 ring-purple-600 shadow-2xl"
                      : "border border-gray-200 dark:border-gray-800"
                  }`}
                >
                  {/* Plan header */}
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                      <plan.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>
                  </div>

                  {/* Pricing */}
                  <div className="text-center mb-8">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-bold">
                        ${plan.price[billingCycle]}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">/month</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      + {plan.commission} platform fee
                    </p>
                    {billingCycle === "yearly" && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        ${(plan.price.monthly - plan.price.yearly) * 12} saved annually
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button
                    size="lg"
                    className={`w-full mb-8 ${
                      plan.popular
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        : "bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900"
                    }`}
                    onClick={() => events.planSelect({ plan: plan.name, billing: billingCycle })}
                  >
                    {plan.cta}
                  </Button>

                  {/* Features */}
                  <ul className="space-y-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
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
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Enterprise Option */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 md:p-12 text-center"
          >
            <h3 className="text-3xl font-bold text-white mb-4">Need more power?</h3>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Get custom pricing, dedicated infrastructure, and premium support for your agency or team.
            </p>
            <Button
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100"
              onClick={() => events.ctaClick({ location: 'pricing', label: 'Contact enterprise' })}
            >
              Contact sales for enterprise
            </Button>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="container-width max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-3">Can I change plans anytime?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">What payment methods do you accept?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We accept all major credit cards, debit cards, and PayPal. Enterprise customers can pay via invoice.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">Is there a setup fee?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                No setup fees ever. Start your free trial instantly and only pay when you're ready.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">How does the commission work?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We charge a small percentage of revenue generated through our platform. This aligns our success with yours.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FooterImproved />
    </>
  );
}
