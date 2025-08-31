'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight,
  Instagram,
  Video,
  MessageSquare,
  Bot,
  DollarSign,
  Check,
  X
} from 'lucide-react';

export default function MobileOnboardingSetup() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);

  const steps = [
    {
      title: "Welcome to Huntaze! 🎉",
      subtitle: "Let's get you set up in 2 minutes",
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-2">Keep 98% of your earnings</h3>
            <p className="text-white/80">No more 50% agency fees. You're in control.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-xl border border-gray-100">
              <Bot className="w-8 h-8 text-purple-600 mb-2" />
              <p className="font-medium text-sm">AI Assistant</p>
              <p className="text-xs text-gray-600">24/7 automation</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100">
              <DollarSign className="w-8 h-8 text-green-600 mb-2" />
              <p className="font-medium text-sm">More Revenue</p>
              <p className="text-xs text-gray-600">3x your income</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Connect Your Platforms",
      subtitle: "Where do you create content?",
      content: (
        <div className="space-y-3">
          {[
            { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'from-purple-500 to-pink-500' },
            { id: 'tiktok', name: 'TikTok', icon: Video, color: 'from-red-500 to-blue-500' },
            { id: 'reddit', name: 'Reddit', icon: MessageSquare, color: 'from-orange-500 to-red-500' }
          ].map((platform) => {
            const Icon = platform.icon;
            const isSelected = selectedPlatforms.includes(platform.id);
            
            return (
              <button
                key={platform.id}
                onClick={() => {
                  if (isSelected) {
                    setSelectedPlatforms(prev => prev.filter(p => p !== platform.id));
                  } else {
                    setSelectedPlatforms(prev => [...prev, platform.id]);
                  }
                }}
                className={`w-full p-4 rounded-2xl border-2 transition-all ${
                  isSelected 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 bg-gradient-to-br ${platform.color} rounded-xl`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{platform.name}</p>
                      <p className="text-xs text-gray-600">Connect account</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-purple-500' : 'bg-gray-200'
                  }`}>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )
    },
    {
      title: "What are your goals?",
      subtitle: "Select all that apply",
      content: (
        <div className="space-y-3">
          {[
            { id: 'revenue', label: 'Increase revenue', emoji: '💰' },
            { id: 'time', label: 'Save time on messages', emoji: '⏰' },
            { id: 'fans', label: 'Grow fan base', emoji: '👥' },
            { id: 'content', label: 'Focus on content creation', emoji: '🎥' }
          ].map((goal) => {
            const isSelected = goals.includes(goal.id);
            
            return (
              <button
                key={goal.id}
                onClick={() => {
                  if (isSelected) {
                    setGoals(prev => prev.filter(g => g !== goal.id));
                  } else {
                    setGoals(prev => [...prev, goal.id]);
                  }
                }}
                className={`w-full p-4 rounded-2xl border-2 transition-all ${
                  isSelected 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goal.emoji}</span>
                    <p className="font-medium text-gray-900">{goal.label}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-purple-500' : 'bg-gray-200'
                  }`}>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      router.push('/dashboard');
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return selectedPlatforms.length > 0;
    if (currentStep === 2) return goals.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.push('/dashboard')}
              className="p-2"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 w-16 rounded-full transition-colors ${
                    step <= currentStep ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <button 
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-600"
            >
              Skip
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {steps[currentStep].title}
          </h1>
          <p className="text-gray-600 mb-8">
            {steps[currentStep].subtitle}
          </p>

          {steps[currentStep].content}
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            canProceed()
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          {currentStep === steps.length - 1 ? 'Complete Setup' : 'Continue'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}