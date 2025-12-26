'use client';

/**
 * SetupWizard Component
 * 
 * 4-step wizard for initial AI configuration and service activation.
 * Implements the spec from docs/SETUP_WIZARD_GUIDE.md
 * 
 * Target: < 30 seconds completion time
 */

import * as React from 'react';
import { Button } from "@/components/ui/button";

type Platform = 'onlyfans' | 'instagram' | 'tiktok' | 'reddit' | 'other';
type Goal = 'grow' | 'automate' | 'content' | 'all';
type Tone = 'playful' | 'professional' | 'casual' | 'seductive';

interface WizardData {
  platform?: Platform;
  primary_goal?: Goal;
  ai_tone?: Tone;
  follower_range?: string;
}

interface SetupWizardProps {
  onComplete: (data: WizardData) => void;
  onSkip: () => void;
}

const PLATFORMS = [
  { 
    id: 'onlyfans' as Platform, 
    title: 'OnlyFans', 
    description: 'Auto-DM, PPV tracking, subscriber management' 
  },
  { 
    id: 'instagram' as Platform, 
    title: 'Instagram', 
    description: 'Hashtags, engagement, Reels optimization' 
  },
  { 
    id: 'tiktok' as Platform, 
    title: 'TikTok', 
    description: 'Trends, sounds, viral content ideas' 
  },
  { 
    id: 'reddit' as Platform, 
    title: 'Reddit', 
    description: 'Subreddit targeting, karma optimization' 
  },
  { 
    id: 'other' as Platform, 
    title: 'Other', 
    description: 'Connect your platform later' 
  },
];

const GOALS = [
  { 
    id: 'grow' as Goal, 
    title: 'Grow my audience', 
    description: 'Analytics, recommendations, follower tracking' 
  },
  { 
    id: 'automate' as Goal, 
    title: 'Automate my messages', 
    description: 'Auto-DM, templates, scheduling' 
  },
  { 
    id: 'content' as Goal, 
    title: 'Generate content ideas', 
    description: 'Daily ideas, trends, inspiration' 
  },
  { 
    id: 'all' as Goal, 
    title: 'All of the above', 
    description: 'Full suite of features' 
  },
];

const TONES = [
  { 
    id: 'playful' as Tone, 
    title: 'Playful', 
    description: 'Casual, light, suggestive (3–5 emojis)' 
  },
  { 
    id: 'professional' as Tone, 
    title: 'Professional', 
    description: 'Formal, clear, data-driven (no emojis)' 
  },
  { 
    id: 'casual' as Tone, 
    title: 'Casual', 
    description: 'Friendly, conversational (light emoji)' 
  },
  { 
    id: 'seductive' as Tone, 
    title: 'Seductive', 
    description: 'Flirty, emotionally engaging' 
  },
];

export default function SetupWizard({ onComplete, onSkip }: SetupWizardProps) {
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState<WizardData>({});
  const startTimeRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    startTimeRef.current = performance.now();
  }, []);

  const handleSelect = (key: keyof WizardData, value: string) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (step === 0) {
      // Welcome -> Platform
      setStep(1);
    } else if (step === 1 && data.platform) {
      // Platform -> Goal
      setStep(2);
    } else if (step === 2 && data.primary_goal) {
      // Goal -> Tone
      setStep(3);
    } else if (step === 3) {
      // Tone -> Complete (tone is optional)
      handleComplete();
    }
  };

  const handleSkipTone = () => {
    // Default to professional if skipped
    const finalData = {
      ...data,
      ai_tone: data.ai_tone || ('professional' as Tone),
    };
    
    const startTime = startTimeRef.current ?? 0;
    const timeToComplete = Math.round((performance.now() - startTime) / 1000);
    
    onComplete({
      ...finalData,
      time_to_complete: timeToComplete,
      questions_skipped: data.ai_tone ? [] : [4],
    } as any);
  };

  const handleComplete = () => {
    const finalData = {
      ...data,
      ai_tone: data.ai_tone || ('professional' as Tone),
    };
    
    const startTime = startTimeRef.current ?? 0;
    const timeToComplete = Math.round((performance.now() - startTime) / 1000);
    
    onComplete({
      ...finalData,
      time_to_complete: timeToComplete,
      questions_skipped: data.ai_tone ? [] : [4],
    } as any);
  };

  const canProceed = () => {
    if (step === 0) return true;
    if (step === 1) return !!data.platform;
    if (step === 2) return !!data.primary_goal;
    if (step === 3) return true; // Tone is optional
    return false;
  };

  return (
    <div className="relative">
      {/* Layered cards for depth */}
      <div 
        aria-hidden 
        className="absolute inset-x-6 -top-6 h-[86%] rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-pink-950/40 backdrop-blur-sm shadow-[0_8px_40px_rgba(139, 92, 246, 0.15)] -z-10" 
      />
      <div 
        aria-hidden 
        className="absolute inset-x-10 -top-3 h-[90%] rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-950/30 to-pink-950/30 backdrop-blur-sm shadow-[0_8px_40px_rgba(139, 92, 246, 0.12)] -z-10" 
      />

      {/* Main card */}
      <section 
        role="dialog" 
        aria-labelledby="wizard-title" 
        className="relative rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 text-white shadow-2xl ring-1 ring-violet-500/20 p-5 sm:p-6 md:p-8"
      >
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-400">
              Step {step + 1} of 4
            </span>
            <span className="text-xs text-neutral-500">
              {Math.round(((step + 1) / 4) * 100)}%
            </span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-1 overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-500 to-pink-500 h-1 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${((step + 1) / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="space-y-6">
            <header>
              <h1 id="wizard-title" className="text-2xl md:text-3xl font-semibold text-white mb-2">
                Welcome! Configure your AI in 30 seconds.
              </h1>
              <p className="text-neutral-400">
                Answer a few quick questions to personalize your experience.
              </p>
            </header>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <svg className="h-5 w-5 text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M10 6v4m0 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-sm text-neutral-300">
                You can skip any question and update your preferences later.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="primary" onClick={onSkip}>
  Skip for now
</Button>
              <Button variant="primary" onClick={handleNext}>
  Continue
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
</Button>
            </div>
          </div>
        )}

        {/* Step 1: Platform */}
        {step === 1 && (
          <div className="space-y-6">
            <header>
              <h2 id="wizard-title" className="text-xl md:text-2xl font-semibold text-white mb-1">
                Which platform do you create for?
              </h2>
              <p className="text-sm text-neutral-400">
                We'll activate the right tools and templates for your platform.
              </p>
            </header>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PLATFORMS.map((platform) => {
                const isSelected = data.platform === platform.id;
                return (
                  <li key={platform.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect('platform', platform.id)}
                      className={[
                        'w-full text-left rounded-xl border p-4 transition-all',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6ecb]',
                        isSelected
                          ? 'border-violet-500/60 bg-violet-500/10 shadow-lg shadow-violet-500/20'
                          : 'border-neutral-700 hover:border-violet-500/40 bg-neutral-800/50',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-white">{platform.title}</p>
                          <p className="text-sm text-neutral-400 mt-0.5">{platform.description}</p>
                        </div>
                        <span
                          className={[
                            'inline-flex h-5 w-5 items-center justify-center rounded-full border transition-all flex-shrink-0',
                            isSelected
                              ? 'border-violet-500 bg-violet-500'
                              : 'border-neutral-600',
                          ].join(' ')}
                        >
                          {isSelected && (
                            <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3 text-white">
                              <path d="M5 10l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          )}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between pt-2">
              <Button 
                variant="primary" 
                onClick={() => setStep(0)}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-400 transition-colors"
              >
                ← Back
              </Button>
              <Button variant="primary" onClick={handleNext} disabled={!canProceed()}>
                Next
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
</Button>
            </div>
          </div>
        )}

        {/* Step 2: Goal */}
        {step === 2 && (
          <div className="space-y-6">
            <header>
              <h2 id="wizard-title" className="text-xl md:text-2xl font-semibold text-white mb-1">
                What is your primary goal?
              </h2>
              <p className="text-sm text-neutral-400">
                We'll prioritize features that help you achieve this goal.
              </p>
            </header>

            <ul className="grid grid-cols-1 gap-3">
              {GOALS.map((goal) => {
                const isSelected = data.primary_goal === goal.id;
                return (
                  <li key={goal.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect('primary_goal', goal.id)}
                      className={[
                        'w-full text-left rounded-xl border p-4 transition-all',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6ecb]',
                        isSelected
                          ? 'border-violet-500/60 bg-violet-500/10 shadow-lg shadow-violet-500/20'
                          : 'border-neutral-700 hover:border-violet-500/40 bg-neutral-800/50',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-white">{goal.title}</p>
                          <p className="text-sm text-neutral-400 mt-0.5">{goal.description}</p>
                        </div>
                        <span
                          className={[
                            'inline-flex h-5 w-5 items-center justify-center rounded-full border transition-all flex-shrink-0',
                            isSelected
                              ? 'border-violet-500 bg-violet-500'
                              : 'border-neutral-600',
                          ].join(' ')}
                        >
                          {isSelected && (
                            <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3 text-white">
                              <path d="M5 10l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          )}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between pt-2">
              <Button 
                variant="primary" 
                onClick={() => setStep(1)}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-400 transition-colors"
              >
                ← Back
              </Button>
              <Button variant="primary" onClick={handleNext} disabled={!canProceed()}>
                Next
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Tone (Optional) */}
        {step === 3 && (
          <div className="space-y-6">
            <header>
              <h2 id="wizard-title" className="text-xl md:text-2xl font-semibold text-white mb-1">
                What tone should the AI use?
              </h2>
              <p className="text-sm text-neutral-400">
                Optional — defaults to Professional if skipped.
              </p>
            </header>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TONES.map((tone) => {
                const isSelected = data.ai_tone === tone.id;
                return (
                  <li key={tone.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect('ai_tone', tone.id)}
                      className={[
                        'w-full text-left rounded-xl border p-4 transition-all',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6ecb]',
                        isSelected
                          ? 'border-violet-500/60 bg-violet-500/10 shadow-lg shadow-violet-500/20'
                          : 'border-neutral-700 hover:border-violet-500/40 bg-neutral-800/50',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-white">{tone.title}</p>
                          <p className="text-sm text-neutral-400 mt-0.5">{tone.description}</p>
                        </div>
                        <span
                          className={[
                            'inline-flex h-5 w-5 items-center justify-center rounded-full border transition-all flex-shrink-0',
                            isSelected
                              ? 'border-violet-500 bg-violet-500'
                              : 'border-neutral-600',
                          ].join(' ')}
                        >
                          {isSelected && (
                            <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3 text-white">
                              <path d="M5 10l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          )}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between pt-2">
              <Button 
                variant="primary" 
                onClick={() => setStep(2)}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-400 transition-colors"
              >
                ← Back
              </Button>
              <div className="flex items-center gap-3">
                <Button variant="primary" onClick={handleSkipTone}>
                  Skip (use Professional)
                </Button>
                <Button variant="primary" onClick={handleComplete}>
                  Complete Setup
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                    <path d="M5 10l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
</Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
