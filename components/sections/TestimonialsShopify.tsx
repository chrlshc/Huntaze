"use client";

import { motion } from "framer-motion";
import { Star, CheckCircle } from "lucide-react";

const testimonials = [
  {
    name: "Sarah M.",
    role: "Instagram Creator",
    avatar: "SM",
    content: "Went from $3k to $12k/month in 3 months. The AI responds exactly like I would but 100x faster.",
    rating: 5,
    verified: true,
    platform: "Instagram",
    followers: "127K"
  },
  {
    name: "Alex T.",
    role: "TikTok Creator",
    avatar: "AT",
    content: "I sleep while my AI makes sales. Woke up to $800 in new revenue. This is insane!",
    rating: 5,
    verified: true,
    platform: "TikTok",
    followers: "89K"
  },
  {
    name: "Jessica R.",
    role: "Multi-Platform Creator",
    avatar: "JR",
    content: "Cut my work hours by 80% and doubled my income. Huntaze pays for itself in 2 days.",
    rating: 5,
    verified: true,
    platform: "OnlyFans",
    followers: "45K"
  }
];

export function TestimonialsShopify() {
  return (
    <section className="py-20 md:py-32 bg-gray-50 dark:bg-gray-950">
      <div className="container-width">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-4">
            Success stories
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Real creators, <span className="text-gradient bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">real results</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Join thousands earning more while working less
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-black rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-800"
            >
              {/* Rating */}
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-lg mb-6 text-gray-900 dark:text-white">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-1">
                      {testimonial.name}
                      {testimonial.verified && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                      )}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">{testimonial.platform}</p>
                  <p className="text-gray-500">{testimonial.followers}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          <div>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">10,000+</p>
            <p className="text-gray-600 dark:text-gray-400">Active creators</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">$50M+</p>
            <p className="text-gray-600 dark:text-gray-400">Revenue generated</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">2-3x</p>
            <p className="text-gray-600 dark:text-gray-400">Avg revenue increase</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">20hr</p>
            <p className="text-gray-600 dark:text-gray-400">Saved per week</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}