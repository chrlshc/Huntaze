'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Bot, 
  Link2, 
  ArrowRight, 
  ArrowLeft,
  Globe,
  Sparkles,
  Shield,
  Zap,
  MessageSquare,
  Users,
  BarChart3,
  Lock,
  Star,
  ChevronRight,
  Rocket,
  Target,
  Brain
} from 'lucide-react';

const steps = [
  { 
    id: 1, 
    name: 'Welcome', 
    icon: Rocket,
    title: 'Welcome to Huntaze',
    description: 'Let\'s get your AI-powered creator platform set up in just a few minutes'
  },
  { 
    id: 2, 
    name: 'Connect Platforms', 
    icon: Globe,
    title: 'Connect Your Platforms',
    description: 'Link your OnlyFans, Fansly, or other platforms to start automating'
  },
  { 
    id: 3, 
    name: 'Configure AI', 
    icon: Brain,
    title: 'Train Your AI Assistant',
    description: 'Customize how your AI interacts with fans to match your personality'
  },
  {
    id: 4,
    name: 'Setup Complete',
    icon: Star,
    title: 'You\'re All Set!',
    description: 'Your AI assistant is ready to help you scale your creator business'
  }
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      router.push('/join');
    }
  }, [token, router]);

  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/dashboard');
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full opacity-20 blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200/50 backdrop-blur z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
          initial={{ width: '0%' }}
          animate={{ width: `${(currentStep / steps.length) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 pt-16 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/25">
                <span className="text-white font-bold text-2xl">H</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">Huntaze</span>
            </div>
          </div>

          {/* Steps Indicator */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <motion.div
                      className={`relative ${isActive ? 'scale-110' : ''}`}
                      initial={false}
                      animate={{ scale: isActive ? 1.1 : 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                          isActive
                            ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                            : isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-6 h-6" />
                        ) : (
                          <Icon className="w-6 h-6" />
                        )}
                      </div>
                      {isActive && (
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                          <p className="text-xs font-medium text-gray-600 whitespace-nowrap">{step.name}</p>
                        </div>
                      )}
                    </motion.div>
                    {index < steps.length - 1 && (
                      <div className="w-12 md:w-24 h-0.5 mx-2">
                        <div className="h-full bg-gray-200 relative">
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                            initial={{ width: '0%' }}
                            animate={{ width: isCompleted ? '100%' : '0%' }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-20"
            >
              {currentStep === 1 && <WelcomeStep onNext={handleNextStep} />}
              {currentStep === 2 && <ConnectPlatformStep onNext={handleNextStep} onPrev={handlePrevStep} />}
              {currentStep === 3 && <ConfigureAIStep onNext={handleNextStep} onPrev={handlePrevStep} />}
              {currentStep === 4 && <CompleteStep onNext={handleNextStep} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Step 1: Welcome
function WelcomeStep({ onNext }: { onNext: () => void }) {
  const features = [
    {
      icon: MessageSquare,
      title: 'AI-Powered Messaging',
      description: 'Automate fan interactions with personalized AI responses'
    },
    {
      icon: Users,
      title: 'Fan Management',
      description: 'Track, segment, and engage with your audience effectively'
    },
    {
      icon: BarChart3,
      title: 'Revenue Analytics',
      description: 'Monitor your growth with detailed insights and metrics'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Bank-level security to protect your data and earnings'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="inline-flex p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl mb-6"
        >
          <Sparkles className="w-12 h-12 text-purple-600" />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Welcome to Huntaze
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          The AI-powered platform that helps creators automate their business and scale their revenue
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="elevated-card rounded-2xl p-6 hover:border-purple-200 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                  <Icon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-600/25 transition-all"
        >
          Get Started
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-sm text-gray-500 mt-4">Setup takes less than 5 minutes</p>
      </div>
    </div>
  );
}

// Step 2: Connect Platforms
function ConnectPlatformStep({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);

  const platforms = [
    {
      id: 'onlyfans',
      name: 'OnlyFans',
      description: 'Connect your OnlyFans account',
      icon: '🔥',
      color: 'from-blue-500 to-cyan-600',
      available: true
    },
    {
      id: 'fansly',
      name: 'Fansly',
      description: 'Connect your Fansly account',
      icon: '💎',
      color: 'from-purple-500 to-pink-600',
      available: true
    },
    {
      id: 'patreon',
      name: 'Patreon',
      description: 'Coming soon',
      icon: '🎨',
      color: 'from-orange-500 to-red-600',
      available: false
    },
    {
      id: 'fanvue',
      name: 'Fanvue',
      description: 'Coming soon',
      icon: '⭐',
      color: 'from-green-500 to-teal-600',
      available: false
    }
  ];

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSelectedPlatforms([...selectedPlatforms, platformId]);
    setConnecting(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Connect Your Platforms</h2>
        <p className="text-lg text-gray-600">
          Select the platforms where you create content. You can always add more later.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {platforms.map((platform) => (
          <motion.div
            key={platform.id}
            whileHover={{ scale: platform.available ? 1.02 : 1 }}
            className={`relative elevated-card rounded-2xl border-2 transition-all ${
              selectedPlatforms.includes(platform.id)
                ? 'border-green-500 shadow-lg shadow-green-500/20'
                : platform.available
                ? 'border-gray-200 hover:border-purple-300'
                : 'border-gray-200 opacity-60'
            }`}
          >
            {selectedPlatforms.includes(platform.id) && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
            )}
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`text-4xl p-3 bg-gradient-to-br ${platform.color} bg-opacity-10 rounded-xl`}>
                    {platform.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{platform.name}</h3>
                    <p className="text-sm text-gray-600">{platform.description}</p>
                  </div>
                </div>
              </div>
              
              {platform.available ? (
                <button
                  onClick={() => handleConnect(platform.id)}
                  disabled={connecting === platform.id || selectedPlatforms.includes(platform.id)}
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    selectedPlatforms.includes(platform.id)
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                  }`}
                >
                  {connecting === platform.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Connecting...
                    </span>
                  ) : selectedPlatforms.includes(platform.id) ? (
                    'Connected'
                  ) : (
                    'Connect'
                  )}
                </button>
              ) : (
                <div className="py-3 text-center text-gray-400 bg-gray-50 rounded-xl">
                  Coming Soon
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          {selectedPlatforms.length > 0 ? 'Continue' : 'Skip for now'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Step 3: Configure AI
function ConfigureAIStep({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const [personality, setPersonality] = useState('friendly');
  const [tone, setTone] = useState('casual');
  const [responseLength, setResponseLength] = useState('medium');

  const personalities = [
    { id: 'friendly', name: 'Friendly & Warm', icon: '😊', description: 'Approachable and caring' },
    { id: 'flirty', name: 'Flirty & Playful', icon: '😉', description: 'Fun and engaging' },
    { id: 'professional', name: 'Professional', icon: '💼', description: 'Direct and business-like' },
    { id: 'mysterious', name: 'Mysterious', icon: '🎭', description: 'Intriguing and alluring' }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Configure Your AI Assistant</h2>
        <p className="text-lg text-gray-600">
          Customize how your AI interacts with fans to match your unique personality
        </p>
      </div>

      <div className="space-y-8">
        {/* Personality Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">Choose AI Personality</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {personalities.map((p) => (
              <motion.button
                key={p.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPersonality(p.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  personality === p.id
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="text-3xl mb-2">{p.icon}</div>
                <p className="font-medium text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-600 mt-1">{p.description}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tone Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">Conversation Tone</label>
          <div className="flex gap-4">
            {['casual', 'balanced', 'formal'].map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`flex-1 py-3 px-6 rounded-xl border-2 font-medium capitalize transition-all ${
                  tone === t
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-700 hover:border-purple-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Response Length */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">Response Length</label>
          <div className="flex gap-4">
            {['short', 'medium', 'detailed'].map((length) => (
              <button
                key={length}
                onClick={() => setResponseLength(length)}
                className={`flex-1 py-3 px-6 rounded-xl border-2 font-medium capitalize transition-all ${
                  responseLength === length
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-700 hover:border-purple-300'
                }`}
              >
                {length}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
          <h4 className="font-semibold text-gray-900 mb-3">AI Response Preview</h4>
          <div className="space-y-3">
            <div className="elevated-card rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">Fan: "Hey! How are you today?"</p>
              <p className="text-sm font-medium text-purple-700">
                AI: {personality === 'friendly' ? "Hi there! I'm doing great, thanks for asking! 😊 How's your day going?" :
                     personality === 'flirty' ? "Hey you! I'm feeling amazing now that you're here 😉 What have you been up to?" :
                     personality === 'professional' ? "Hello! I'm well, thank you. How can I help you today?" :
                     "Hello... I've been thinking about you. Tell me, what brings you here today? 🎭"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-12">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          Complete Setup
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Step 4: Complete
function CompleteStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="inline-flex p-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-8"
      >
        <Check className="w-16 h-16 text-green-600" />
      </motion.div>
      
      <h2 className="text-4xl font-bold text-gray-900 mb-4">You're All Set! 🎉</h2>
      <p className="text-xl text-gray-600 mb-12">
        Your AI assistant is ready to help you scale your creator business
      </p>

      <div className="elevated-card rounded-2xl p-8 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">What's Next?</h3>
        <div className="space-y-4 text-left">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Start messaging</p>
              <p className="text-sm text-gray-600">Your AI is ready to handle fan conversations</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Create campaigns</p>
              <p className="text-sm text-gray-600">Launch targeted messages to boost engagement</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Track performance</p>
              <p className="text-sm text-gray-600">Monitor your growth with detailed analytics</p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-600/25 transition-all"
      >
        Go to Dashboard
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
