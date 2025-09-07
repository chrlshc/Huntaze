'use client';

import { motion } from 'framer-motion';
import { UserPlus, Link2, Rocket } from 'lucide-react';

const STEPS = [
  { icon: UserPlus, title: 'Create your account', text: '30 seconds — email and password, that’s it.' },
  { icon: Link2, title: 'Connect your platforms', text: 'Instagram, TikTok, OnlyFans… one‑click via OAuth.' },
  { icon: Rocket, title: 'Start smarter', text: 'AI, analytics and payments — working together from day one.' },
];

export default function ThreeStepsEN() {
  return (
    <section className="py-20 bg-black text-white">
      <div className="max-w-6xl mx-auto px-4">
        <h3 className="text-3xl md:text-4xl font-extrabold text-center mb-12">
          Get started in three steps
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-white/10 p-6 text-center"
            >
              <div className="mx-auto w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                <s.icon className="w-6 h-6" />
              </div>
              <h4 className="font-bold mb-1">{s.title}</h4>
              <p className="text-sm text-gray-400">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

