'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Top 0.1% Creator',
    avatar: '👩‍🦰',
    content: "Huntaze transformed my business. I went from spending 6 hours daily on messages to just 1 hour. Revenue up 3.2x in 90 days.",
    metrics: { revenue: '+320%', time: '-5hrs/day' }
  },
  {
    name: 'Ashley Rivera',
    role: 'Fitness Influencer',
    avatar: '💪',
    content: "The AI responses are incredible - they actually sound like me! My fans love the quick replies and I love the extra time.",
    metrics: { revenue: '+180%', fans: '+2.4k' }
  },
  {
    name: 'Emma Thompson',
    role: 'Lifestyle Creator',
    avatar: '🌟',
    content: "Best investment I've made. The unified inbox alone saves me 3 hours daily. Analytics help me focus on what actually makes money.",
    metrics: { revenue: '+250%', efficiency: '+400%' }
  }
];

export default function TestimonialsMinimal() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Creators love Huntaze
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Don't just take our word for it. See what successful creators say about their experience.
          </p>
        </motion.div>

        {/* Featured testimonial */}
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <div className="bg-gray-900 rounded-2xl shadow-xl border border-gray-800 p-8 lg:p-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-5xl">{testimonials[activeIndex].avatar}</div>
              <div>
                <h3 className="text-xl font-semibold text-white">{testimonials[activeIndex].name}</h3>
                <p className="text-gray-400">{testimonials[activeIndex].role}</p>
              </div>
            </div>
            
            <p className="text-2xl text-gray-200 leading-relaxed mb-8">
              "{testimonials[activeIndex].content}"
            </p>

            <div className="flex items-center gap-8">
              {Object.entries(testimonials[activeIndex].metrics).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                    {value}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">{key}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Testimonial selector */}
        <div className="flex items-center justify-center gap-4">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-12 h-1 rounded-full transition-all ${
                index === activeIndex 
                  ? 'bg-purple-600 w-24' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Success stories grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-20 grid md:grid-cols-3 gap-8"
        >
          {[
            { metric: '$847K+', label: 'Total creator earnings', icon: '💰' },
            { metric: '98%', label: 'Creator satisfaction', icon: '😊' },
            { metric: '4.9/5', label: 'Average rating', icon: '⭐' }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              className="text-center bg-gray-900 border border-gray-800 rounded-xl p-6"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <div className="text-3xl font-bold text-white mb-1">{item.metric}</div>
              <p className="text-gray-400">{item.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}