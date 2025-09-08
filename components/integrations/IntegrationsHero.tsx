'use client';
import { motion } from 'framer-motion';

export function IntegrationsHero() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-pink-50" />
      
      <motion.div 
        className="relative max-w-6xl mx-auto px-6 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-8"
        >
          <span>🔗</span>
          <span>100+ Integrations</span>
        </motion.div>
        
        <h1 className="display-1 mb-6 balance-text">
          Connect Your
          <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Entire Stack
          </span>
        </h1>
        
        <p className="lead max-w-3xl mx-auto mb-10">
          Seamlessly integrate Huntaze with the tools you already use and love. 
          From social platforms to analytics, we've got you covered.
        </p>
        
        <motion.div 
          className="flex flex-wrap gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300">
            Browse All Integrations
          </button>
          <button className="px-8 py-4 border-2 border-purple-200 text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all duration-300">
            Request Integration
          </button>
        </motion.div>
      </motion.div>
      
      {/* Floating logos preview */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-10 left-10 w-16 h-16 bg-white rounded-xl shadow-lg p-3 opacity-70"
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-20 right-20 w-16 h-16 bg-white rounded-xl shadow-lg p-3 opacity-70"
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-16 h-16 bg-white rounded-xl shadow-lg p-3 opacity-70"
          animate={{ y: [0, -15, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity }}
        />
      </div>
    </section>
  );
}