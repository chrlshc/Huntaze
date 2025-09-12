'use client';

import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { useState } from 'react';

export default function WorkflowPreview() {
  const [isPlaying, setIsPlaying] = useState(true);

  const steps = [
    {
      title: "Fan envoie un message",
      description: "« Hey babe, tu fais quoi ? »",
      icon: "💬"
    },
    {
      title: "IA analyse et répond",
      description: "Réponse personnalisée en 0.3s",
      icon: "🤖"
    },
    {
      title: "Détection d'opportunité",
      description: "Fan intéressé → prix suggéré",
      icon: "💰"
    },
    {
      title: "Conversion automatique",
      description: "+€45 de revenu généré",
      icon: "✨"
    }
  ];

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Comment ça marche en 10 secondes
          </h3>
          <p className="text-gray-400">
            Workflow réel d'une conversation automatisée
          </p>
        </div>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-full transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-purple-400" />
          ) : (
            <Play className="w-5 h-5 text-purple-400" />
          )}
        </button>
      </div>

      {/* Workflow Steps */}
      <div className="relative">
        {/* Connection line */}
        <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-purple-500 to-pink-500" />

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: isPlaying ? 1 : 0.5, 
                x: 0 
              }}
              transition={{ 
                delay: isPlaying ? index * 2 : 0,
                duration: 0.6,
                repeat: isPlaying ? Infinity : 0,
                repeatDelay: 6
              }}
              className="flex items-start gap-4 relative"
            >
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 p-0.5 z-10">
                <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center text-2xl">
                  {step.icon}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pt-2">
                <h4 className="text-white font-semibold mb-1">{step.title}</h4>
                <p className="text-gray-400">{step.description}</p>
                
                {/* Mock UI element */}
                {index === 1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ 
                      opacity: isPlaying ? 1 : 0, 
                      scale: 1 
                    }}
                    transition={{ 
                      delay: isPlaying ? index * 2 + 0.5 : 0,
                      duration: 0.4,
                      repeat: isPlaying ? Infinity : 0,
                      repeatDelay: 6
                    }}
                    className="mt-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20"
                  >
                    <p className="text-sm text-purple-300">
                      "Salut chéri! Je prépare du contenu exclusif... 😘 Tu veux voir?"
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20"
      >
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Temps total</span>
          <span className="text-white font-bold">8.7 secondes</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-400">Revenu généré</span>
          <span className="text-green-400 font-bold">+€45</span>
        </div>
      </motion.div>
    </div>
  );
}