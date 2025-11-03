'use client';

import { useEffect, useState } from 'react';
import { X, ExternalLink, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: string;
  quickStartUrl?: string;
}

interface FeatureUnlockModalProps {
  feature: Feature;
  isOpen: boolean;
  onClose: () => void;
}

export default function FeatureUnlockModal({ 
  feature, 
  isOpen, 
  onClose 
}: FeatureUnlockModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      
      // Trigger confetti animation
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-500 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 animate-bounce">
              <Sparkles className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Feature Unlocked! 🎉
            </h2>
            <p className="text-blue-100">
              You've unlocked a new capability
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {feature.name}
            </h3>
            <p className="text-gray-600">
              {feature.description}
            </p>
          </div>

          {/* Feature Benefits */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">What you can do now:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>Access advanced features for this capability</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>Enhance your content creation workflow</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>Unlock additional automation options</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {feature.quickStartUrl && (
              <a
                href={feature.quickStartUrl}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                <ExternalLink className="w-4 h-4" />
                Quick Start Guide
              </a>
            )}
            <button
              onClick={onClose}
              className={`${feature.quickStartUrl ? 'flex-1' : 'w-full'} px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition`}
            >
              {feature.quickStartUrl ? 'Later' : 'Got it!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
