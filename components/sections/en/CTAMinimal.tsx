'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CTAMinimal() {
  return (
    <section className="py-24 bg-gradient-to-br from-purple-600 to-pink-600 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-grid-pattern" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl lg:text-6xl font-bold mb-6">
            Ready to 10x your creator business?
          </h2>
          <p className="text-xl lg:text-2xl mb-8 text-white/90">
            Join thousands of creators who are earning more and working less with Huntaze.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/auth" 
              className="w-full sm:w-auto px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-100 transition-all hover:scale-[1.02] text-center shadow-lg"
            >
              Start free trial
            </Link>
            <Link 
              href="/demo" 
              className="w-full sm:w-auto px-8 py-4 bg-transparent text-white rounded-xl font-semibold border-2 border-white/30 hover:bg-white/10 transition-all hover:scale-[1.02] text-center"
            >
              Watch demo
            </Link>
          </div>

          <p className="mt-8 text-sm text-white/70">
            No credit card required · Setup in 30 seconds · Cancel anytime
          </p>
        </motion.div>

        {/* Floating testimonials */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 grid md:grid-cols-3 gap-4 max-w-3xl mx-auto"
        >
          {[
            { name: 'Mia K.', text: 'Best decision ever!' },
            { name: 'Jake L.', text: 'Doubled my revenue!' },
            { name: 'Sophie R.', text: 'Saves me hours daily!' }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4"
            >
              <p className="text-sm mb-2">"{item.text}"</p>
              <p className="text-xs text-white/70">- {item.name}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}