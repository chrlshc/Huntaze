'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Sparkles, Users, Zap, MessageSquare, BarChart3 } from 'lucide-react';
import MD3Button from '@/components/ui/md3-button';
import MD3Card from '@/components/ui/md3-card';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  component: React.ReactNode;
}

export default function ProgressiveOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [onboardingData, setOnboardingData] = useState({
    businessType: '',
    platforms: [] as string[],
    teamSize: '',
    goals: [] as string[],
  });

  // Onboarding steps inspired by SaaS leaders
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Huntaze',
      description: 'Let\'s get you started in less than 3 minutes',
      icon: <Sparkles className="w-6 h-6" />,
      action: 'Get Started',
      component: <WelcomeStep onComplete={(data) => handleStepComplete('welcome', data)} />
    },
    {
      id: 'platforms',
      title: 'Connect Your Platforms',
      description: 'Link your content platforms for seamless management',
      icon: <Users className="w-6 h-6" />,
      action: 'Connect Platforms',
      component: <PlatformStep onComplete={(data) => handleStepComplete('platforms', data)} />
    },
    {
      id: 'ai-setup',
      title: 'Train Your AI Assistant',
      description: 'Customize how your AI interacts with fans',
      icon: <MessageSquare className="w-6 h-6" />,
      action: 'Setup AI',
      component: <AISetupStep onComplete={(data) => handleStepComplete('ai-setup', data)} />
    },
    {
      id: 'first-automation',
      title: 'Create Your First Automation',
      description: 'Start automating fan interactions immediately',
      icon: <Zap className="w-6 h-6" />,
      action: 'Create Automation',
      component: <AutomationStep onComplete={(data) => handleStepComplete('first-automation', data)} />
    },
  ];

  const handleStepComplete = (stepId: string, data: any) => {
    setCompletedSteps(prev => new Set(prev).add(stepId));
    setOnboardingData(prev => ({ ...prev, ...data }));
    
    // Auto-advance to next step
    if (currentStep < steps.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 300);
    } else {
      // Complete onboarding
      completeOnboarding();
    }
  };

  const completeOnboarding = () => {
    // Track completion metrics
    const completionTime = Date.now() - startTime;
    console.log('Onboarding completed in:', completionTime / 1000, 'seconds');
    
    // Save onboarding state
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_data', JSON.stringify(onboardingData));
    
    // Redirect to dashboard
    window.location.href = '/dashboard';
  };

  // Track onboarding start time
  const [startTime] = useState(Date.now());

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-500">
              ~{Math.ceil((steps.length - currentStep) * 0.75)} min remaining
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-pink-600"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
          
          {/* Step indicators */}
          <div className="flex justify-between mt-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                  completedSteps.has(step.id)
                    ? "bg-green-500 text-white"
                    : index === currentStep
                    ? "bg-purple-600 text-white scale-110"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                )}
              >
                {completedSteps.has(step.id) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={steps[currentStep].id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <MD3Card className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  {steps[currentStep].icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {steps[currentStep].title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {steps[currentStep].description}
                  </p>
                </div>
              </div>

              {/* Dynamic step component */}
              {steps[currentStep].component}
            </MD3Card>
          </motion.div>
        </AnimatePresence>

        {/* Skip option for experienced users */}
        {currentStep > 0 && currentStep < steps.length - 1 && (
          <div className="text-center mt-4">
            <button
              onClick={() => completeOnboarding()}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Skip and explore on my own →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Step Components
function WelcomeStep({ onComplete }: { onComplete: (data: any) => void }) {
  const [businessType, setBusinessType] = useState('');

  const businessTypes = [
    { id: 'creator', label: 'Content Creator', icon: '🎨' },
    { id: 'influencer', label: 'Influencer', icon: '✨' },
    { id: 'model', label: 'Model', icon: '📸' },
    { id: 'artist', label: 'Artist', icon: '🎭' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          What best describes you?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {businessTypes.map((type) => (
            <motion.button
              key={type.id}
              onClick={() => setBusinessType(type.id)}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-left",
                businessType === type.id
                  ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-purple-400"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{type.icon}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {type.label}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <MD3Button
        variant="filled"
        size="large"
        onClick={() => onComplete({ businessType })}
        disabled={!businessType}
        className="w-full"
      >
        Continue
        <ArrowRight className="w-5 h-5 ml-2" />
      </MD3Button>
    </div>
  );
}

function PlatformStep({ onComplete }: { onComplete: (data: any) => void }) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const platforms = [
    { id: 'onlyfans', label: 'OnlyFans', icon: '🔥' },
    { id: 'instagram', label: 'Instagram', icon: '📷' },
    { id: 'tiktok', label: 'TikTok', icon: '🎵' },
    { id: 'reddit', label: 'Reddit', icon: '🤖' },
    { id: 'threads', label: 'Threads', icon: '🧵' },
  ];

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Select your platforms (you can add more later)
        </label>
        <div className="space-y-3">
          {platforms.map((platform) => (
            <motion.button
              key={platform.id}
              onClick={() => togglePlatform(platform.id)}
              className={cn(
                "w-full p-4 rounded-xl border-2 transition-all text-left",
                selectedPlatforms.includes(platform.id)
                  ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-purple-400"
              )}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{platform.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {platform.label}
                  </span>
                </div>
                {selectedPlatforms.includes(platform.id) && (
                  <Check className="w-5 h-5 text-purple-600" />
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <MD3Button
        variant="filled"
        size="large"
        onClick={() => onComplete({ platforms: selectedPlatforms })}
        disabled={selectedPlatforms.length === 0}
        className="w-full"
      >
        Connect {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 ? 's' : ''}
        <ArrowRight className="w-5 h-5 ml-2" />
      </MD3Button>
    </div>
  );
}

function AISetupStep({ onComplete }: { onComplete: (data: any) => void }) {
  const [tone, setTone] = useState('friendly');
  const [responseSpeed, setResponseSpeed] = useState('balanced');

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          How should your AI communicate?
        </label>
        <div className="grid grid-cols-3 gap-3">
          {['friendly', 'flirty', 'professional'].map((option) => (
            <motion.button
              key={option}
              onClick={() => setTone(option)}
              className={cn(
                "p-3 rounded-xl border-2 capitalize transition-all",
                tone === option
                  ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                  : "border-gray-200 dark:border-gray-700"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {option}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Response speed preference
        </label>
        <div className="grid grid-cols-2 gap-3">
          {['instant', 'balanced'].map((option) => (
            <motion.button
              key={option}
              onClick={() => setResponseSpeed(option)}
              className={cn(
                "p-4 rounded-xl border-2 transition-all",
                responseSpeed === option
                  ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                  : "border-gray-200 dark:border-gray-700"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white capitalize">
                  {option}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {option === 'instant' 
                    ? 'Reply immediately to all messages' 
                    : 'Natural delays for authenticity'}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <MD3Button
        variant="filled"
        size="large"
        onClick={() => onComplete({ aiSettings: { tone, responseSpeed } })}
        className="w-full"
      >
        Configure AI Assistant
        <ArrowRight className="w-5 h-5 ml-2" />
      </MD3Button>
    </div>
  );
}

function AutomationStep({ onComplete }: { onComplete: (data: any) => void }) {
  const [selectedAutomations, setSelectedAutomations] = useState<string[]>([]);

  const automations = [
    {
      id: 'welcome',
      label: 'Welcome New Fans',
      description: 'Send personalized welcome messages',
      icon: '👋'
    },
    {
      id: 'tips',
      label: 'Thank for Tips',
      description: 'Auto-reply to tips with custom messages',
      icon: '💰'
    },
    {
      id: 'inactive',
      label: 'Re-engage Inactive Fans',
      description: 'Win back fans who haven\'t messaged recently',
      icon: '🎯'
    },
  ];

  const toggleAutomation = (id: string) => {
    setSelectedAutomations(prev =>
      prev.includes(id)
        ? prev.filter(a => a !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Enable your first automations
        </label>
        <div className="space-y-3">
          {automations.map((automation) => (
            <motion.button
              key={automation.id}
              onClick={() => toggleAutomation(automation.id)}
              className={cn(
                "w-full p-4 rounded-xl border-2 transition-all text-left",
                selectedAutomations.includes(automation.id)
                  ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-purple-400"
              )}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{automation.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {automation.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {automation.description}
                    </div>
                  </div>
                </div>
                {selectedAutomations.includes(automation.id) && (
                  <Check className="w-5 h-5 text-purple-600" />
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <MD3Button
        variant="filled"
        size="large"
        onClick={() => onComplete({ automations: selectedAutomations })}
        className="w-full"
      >
        Complete Setup
        <Check className="w-5 h-5 ml-2" />
      </MD3Button>
    </div>
  );
}