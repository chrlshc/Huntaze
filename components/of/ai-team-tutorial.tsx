'use client';

import { useState } from 'react';
import { 
  Brain,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Shield,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export default function AITeamTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const scenario = {
    fan: {
      name: 'Mike',
      tier: 'VIP',
      ltv: '$450',
      lastPurchase: '3 days ago'
    },
    message: 'Hey beautiful, what new content do you have? 😍'
  };
  
  const steps = [
    {
      id: 1,
      ai: { name: 'Analytics AI', icon: TrendingUp, color: 'text-purple-600' },
      action: 'Analyzing fan profile...',
      discovery: 'High purchase intent detected (92% confidence)',
      details: [
        'Purchase keywords detected',
        'Fan typically buys within 4 days',
        'Evening time matches past purchases'
      ],
      broadcast: 'Purchase pattern #45'
    },
    {
      id: 2,
      ai: { name: 'Sales AI', icon: DollarSign, color: 'text-green-600' },
      action: 'Optimizing offer strategy...',
      discovery: 'VIP pricing: $45 with 3 psychological tactics',
      details: [
        'Personal connection: "Made this thinking of you"',
        'Scarcity: "Only keeping up for 24h"',
        'Price anchoring: "Usually $60, for you $45"'
      ],
      broadcast: 'VIP conversion formula'
    },
    {
      id: 3,
      ai: { name: 'Messaging AI', icon: MessageSquare, color: 'text-blue-600' },
      action: 'Personalizing response...',
      discovery: 'Crafting message with fan history context',
      details: [
        'References previous interests (feet content)',
        'Uses successful conversation style',
        'Perfect emoji placement for engagement'
      ],
      broadcast: 'Personalization template #12'
    },
    {
      id: 4,
      ai: { name: 'Compliance AI', icon: Shield, color: 'text-red-600' },
      action: 'Checking platform safety...',
      discovery: '✅ All checks passed',
      details: [
        'No platform violations detected',
        'Price within acceptable range',
        'Content type matches fan interests'
      ],
      broadcast: 'Safety confirmation'
    }
  ];
  
  const finalResponse = {
    message: "Hey babe! 😍 Perfect timing! I just finished something special that I think you'll LOVE based on what you enjoyed before... Only keeping this up for 24h and giving my VIPs a special price 💕 Usually $60 but for you just $45. Want a preview? 🔥",
    predictions: {
      conversionProbability: '78%',
      expectedRevenue: '$45',
      optimalSendTime: 'Now (10:45 PM)'
    }
  };
  
  const handlePlay = () => {
    setIsPlaying(true);
    setShowResults(false);
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          setIsPlaying(false);
          setTimeout(() => setShowResults(true), 500);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);
  };
  
  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    setShowResults(false);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">AI Team in Action</h2>
            <p className="opacity-90">Watch how 4 AIs collaborate on every message</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {!isPlaying && currentStep === 0 && (
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Demo
            </button>
          )}
          {isPlaying && (
            <button
              onClick={() => setIsPlaying(false)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          )}
          {(currentStep > 0 || showResults) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>
      </div>
      
      {/* Scenario Setup */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Scenario: VIP Fan Message</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Fan Profile</p>
            <div className="space-y-1">
              <p className="font-medium">{scenario.fan.name} (VIP)</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">LTV: {scenario.fan.ltv}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last purchase: {scenario.fan.lastPurchase}</p>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Incoming Message</p>
            <p className="italic">"{scenario.message}"</p>
          </div>
        </div>
      </div>
      
      {/* AI Processing Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.ai.icon;
          const isActive = index <= currentStep;
          const isCurrentStep = index === currentStep;
          
          return (
            <div 
              key={step.id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm transition-all duration-500 ${
                isActive ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-2'
              } ${
                isCurrentStep && isPlaying ? 'ring-2 ring-purple-600' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg bg-gray-50 dark:bg-gray-700 ${
                  isActive ? '' : 'grayscale'
                }`}>
                  <Icon className={`w-6 h-6 ${step.ai.color}`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{step.ai.name}</h4>
                    {isActive && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  
                  {isActive && (
                    <>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {step.action}
                      </p>
                      
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 mb-3">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          Discovery: {step.discovery}
                        </p>
                      </div>
                      
                      <ul className="space-y-1 mb-3">
                        {step.details.map((detail, i) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <ArrowRight className="w-3 h-3 mt-1 flex-shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-purple-600 font-medium">
                          Broadcasting: {step.broadcast}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Final Result */}
      {showResults && (
        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 animate-fade-in">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            AI Team Response Ready!
          </h3>
          
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Generated Response:</p>
              <p className="italic">"{finalResponse.message}"</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Conversion Probability</p>
                <p className="text-2xl font-bold text-green-600">{finalResponse.predictions.conversionProbability}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Expected Revenue</p>
                <p className="text-2xl font-bold text-green-600">{finalResponse.predictions.expectedRevenue}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Send Time</p>
                <p className="text-2xl font-bold text-green-600">{finalResponse.predictions.optimalSendTime}</p>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">🧠 Team Learning</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All 4 AIs have shared their discoveries. The next VIP interaction will be 15% more effective based on this collective learning.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* How It Works Summary */}
      {!isPlaying && currentStep === 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
          <h3 className="font-semibold mb-4">How AI Team Collaboration Works</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">1. Parallel Processing</h4>
              <p className="text-gray-600 dark:text-gray-400">
                All 4 AIs analyze the message simultaneously, each focusing on their specialty.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Knowledge Sharing</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Discoveries are instantly shared, making each AI smarter in real-time.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. Collective Intelligence</h4>
              <p className="text-gray-600 dark:text-gray-400">
                The final response combines insights from all AIs for maximum effectiveness.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">4. Continuous Learning</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Every interaction makes the entire team smarter through shared experiences.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}