'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Testimonial {
  name: string;
  role: string;
  quote: string;
}

const DATA: Testimonial[] = [
  {
    name: 'Sarah C.',
    role: 'Top 0.1% Creator',
    quote: 'Huntaze doubled my revenue in 90 days. The AI answers exactly like me — just faster.'
  },
  {
    name: 'Ashley R.',
    role: 'Agency Owner',
    quote: 'We manage 12 creators with a lean team thanks to the unified inbox and workflows.'
  },
  {
    name: 'Lina M.',
    role: 'Creator',
    quote: 'Analytics showed me where I was wasting promo spend. +32% margin in six weeks.'
  }
];

export default function TestimonialsCarouselEN() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % DATA.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="py-20 bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h3 className="text-3xl font-bold mb-10">Real creators, real results</h3>
        <div className="relative h-40 md:h-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <blockquote className="text-lg md:text-xl text-gray-200 max-w-3xl">
                “{DATA[index].quote}”
              </blockquote>
              <p className="mt-4 text-sm text-gray-400">
                {DATA[index].name} — {DATA[index].role}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {DATA.map((_, i) => (
            <button
              key={i}
              aria-label={`slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`w-2.5 h-2.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/30'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

