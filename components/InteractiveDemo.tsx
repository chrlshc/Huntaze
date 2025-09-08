'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCw, Play, Pause } from 'lucide-react';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  highlight?: string;
  action?: () => void;
}

export default function InteractiveDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  const steps: DemoStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Huntaze',
      description: 'Discover how our platform can transform your workflow with AI-powered automation and real-time insights.',
      highlight: 'hero-section'
    },
    {
      id: 'dashboard',
      title: 'Unified Dashboard',
      description: 'View all your important metrics at a glance. Customize widgets, track performance, and make data-driven decisions faster.',
      highlight: 'dashboard-preview'
    },
    {
      id: 'automation',
      title: 'Smart Automation',
      description: 'Set up powerful workflows that adapt to your needs. Let AI handle repetitive tasks while you focus on growth.',
      highlight: 'automation-builder'
    },
    {
      id: 'analytics',
      title: 'Real-time Analytics',
      description: 'Get instant insights into your performance. Track conversions, engagement, and revenue with beautiful visualizations.',
      highlight: 'analytics-view'
    },
    {
      id: 'collaboration',
      title: 'Team Collaboration',
      description: 'Work seamlessly with your team. Share insights, assign tasks, and keep everyone aligned without endless meetings.',
      highlight: 'team-features'
    }
  ];

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, 5000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, steps.length]);

  const goToStep = (index: number) => {
    setCurrentStep(index);
    setIsPlaying(false);
  };

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % steps.length);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  const reset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Demo Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
          <div className="flex items-center justify-between">
            {/* Progress Bar */}
            <div className="flex-1 mr-8">
              <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-white h-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <p className="text-white/90 text-sm mt-2">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={reset}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                title="Reset demo"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              <button
                onClick={togglePlay}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Demo Content */}
        <div className="relative" ref={demoRef}>
          {/* Device Mockup */}
          <div className="p-8 lg:p-12">
            <div className="relative mx-auto" style={{ maxWidth: '900px' }}>
              {/* Browser Chrome */}
              <div className="bg-gray-800 rounded-t-xl p-3 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-700 rounded px-3 py-1 text-xs text-gray-300">
                    app.huntaze.com/dashboard
                  </div>
                </div>
              </div>

              {/* Screen Content */}
              <div className="bg-gray-100 rounded-b-xl overflow-hidden shadow-inner" style={{ aspectRatio: '16/10' }}>
                <div className="w-full h-full relative">
                  {/* Demo screens - animated based on current step */}
                  {steps.map((step, index) => (
                    <motion.div
                      key={step.id}
                      className="absolute inset-0 p-8"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{
                        opacity: index === currentStep ? 1 : 0,
                        scale: index === currentStep ? 1 : 0.95,
                        zIndex: index === currentStep ? 10 : 1
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      {/* Placeholder screens - replace with actual demo content */}
                      <div className="bg-white rounded-xl shadow-lg h-full p-6">
                        {step.id === 'dashboard' && (
                          <div className="grid grid-cols-3 gap-4 h-full">
                            <div className="col-span-2">
                              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-4 h-48 mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Revenue Overview</h3>
                                <div className="mt-4 h-24 bg-white/60 rounded"></div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 rounded-lg p-4 h-32">
                                  <h4 className="font-medium text-gray-700">Active Users</h4>
                                  <p className="text-3xl font-bold text-blue-600 mt-2">2,847</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 h-32">
                                  <h4 className="font-medium text-gray-700">Conversion Rate</h4>
                                  <p className="text-3xl font-bold text-green-600 mt-2">4.2%</p>
                                </div>
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                              <div className="space-y-3">
                                {[1, 2, 3, 4].map(i => (
                                  <div key={i} className="bg-white p-3 rounded flex items-center gap-3">
                                    <div className="w-8 h-8 bg-purple-200 rounded-full"></div>
                                    <div className="flex-1">
                                      <div className="h-2 bg-gray-200 rounded w-3/4 mb-1"></div>
                                      <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        {step.id === 'automation' && (
                          <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl mx-auto mb-4 flex items-center justify-center">
                                <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <h3 className="text-2xl font-bold text-gray-800 mb-2">Automation Builder</h3>
                              <p className="text-gray-600">Drag and drop to create powerful workflows</p>
                            </div>
                          </div>
                        )}
                        {step.id === 'analytics' && (
                          <div className="h-full">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Performance Analytics</h3>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                                <p className="text-sm opacity-90">Total Revenue</p>
                                <p className="text-2xl font-bold">$47,829</p>
                                <p className="text-xs opacity-75 mt-1">+23% from last month</p>
                              </div>
                              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                                <p className="text-sm opacity-90">Active Subscribers</p>
                                <p className="text-2xl font-bold">1,247</p>
                                <p className="text-xs opacity-75 mt-1">+142 this week</p>
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 h-48">
                              <div className="h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded"></div>
                            </div>
                          </div>
                        )}
                        {(step.id === 'welcome' || step.id === 'collaboration') && (
                          <div className="h-full flex items-center justify-center text-center">
                            <div>
                              <h2 className="text-3xl font-bold text-gray-800 mb-4">{step.title}</h2>
                              <p className="text-lg text-gray-600 max-w-md mx-auto">{step.description}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step Info */}
          <div className="px-8 pb-8">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-50 rounded-2xl p-6"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {steps[currentStep].title}
              </h3>
              <p className="text-gray-600 text-lg">
                {steps[currentStep].description}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="bg-gray-100 px-8 py-6">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Previous</span>
            </button>

            {/* Step Indicators */}
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-purple-600'
                      : 'bg-gray-400 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextStep}
              disabled={currentStep === steps.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg shadow-sm hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}