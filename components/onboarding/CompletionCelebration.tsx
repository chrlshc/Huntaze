'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, TrendingUp, Target, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Achievement {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface CompletionCelebrationProps {
  userId: string;
  completedSteps: number;
  unlockedFeatures: number;
  creatorLevel: string;
}

export default function CompletionCelebration({
  userId,
  completedSteps,
  unlockedFeatures,
  creatorLevel
}: CompletionCelebrationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsAnimating(true);
    
    // Trigger confetti
    const duration = 5000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

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
  }, []);

  const achievements: Achievement[] = [
    {
      icon: <Target className="w-8 h-8 text-blue-600" />,
      title: `${completedSteps} Steps Completed`,
      description: 'You finished the entire onboarding process'
    },
    {
      icon: <Sparkles className="w-8 h-8 text-purple-600" />,
      title: `${unlockedFeatures} Features Unlocked`,
      description: 'All features are now available to you'
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-green-600" />,
      title: `${creatorLevel.charAt(0).toUpperCase() + creatorLevel.slice(1)} Level`,
      description: 'Your experience level has been configured'
    }
  ];

  const handleStartCreating = () => {
    router.push('/dashboard');
  };

  const handleExploreFeatures = () => {
    router.push('/onboarding/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div 
        className={`max-w-3xl w-full transform transition-all duration-1000 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center space-y-8">
          {/* Main Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              <div className="relative text-8xl animate-bounce">
                🎉
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              You're All Set!
            </h1>
            <p className="text-xl text-gray-600">
              Your Huntaze account is fully configured and ready to go
            </p>
          </div>

          {/* Achievements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 transform transition-all duration-500 hover:scale-105"
                style={{
                  animationDelay: `${index * 200}ms`
                }}
              >
                <div className="flex justify-center mb-3">
                  {achievement.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {achievement.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>

          {/* What's Next */}
          <div className="bg-blue-50 rounded-xl p-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">
              What's next?
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>Create your first piece of content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>Schedule posts across your connected platforms</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>Use AI to generate engaging content ideas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>Track your performance with analytics</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={handleStartCreating}
              className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition shadow-lg hover:shadow-xl"
            >
              Start Creating Content
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleExploreFeatures}
              className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
            >
              Explore Features
            </button>
          </div>

          {/* Footer Note */}
          <p className="text-sm text-gray-500">
            Need help? Check out our{' '}
            <a href="/help" className="text-blue-600 hover:text-blue-700 font-medium">
              Help Center
            </a>
            {' '}or{' '}
            <a href="/support" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
