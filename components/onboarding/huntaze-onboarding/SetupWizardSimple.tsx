'use client';

/**
 * Simple 4-Step Setup Wizard
 * Completes in < 30 seconds
 * 
 * Steps:
 * 1. Welcome (5s)
 * 2. Platform (Required)
 * 3. Goal (Required)
 * 4. Tone (Optional - skippable)
 */

import { useState } from 'react';
import { Button } from "@/components/ui/button";

type Platform = 'onlyfans' | 'instagram' | 'tiktok' | 'reddit' | 'other';
type Goal = 'grow' | 'automate' | 'content' | 'all';
type Tone = 'playful' | 'professional' | 'casual' | 'seductive';

interface WizardData {
  platform?: Platform;
  primary_goal?: Goal;
  ai_tone?: Tone;
  time_to_complete: number;
  questions_skipped: number[];
}

interface Props {
  onComplete: (data: WizardData) => void;
  onSkip: () => void;
}

export default function SetupWizardSimple({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState(1);
  const [startTime] = useState(Date.now());
  const [data, setData] = useState<WizardData>({
    time_to_complete: 0,
    questions_skipped: [],
  });

  const handlePlatformSelect = (platform: Platform) => {
    setData({ ...data, platform });
    setStep(3);
  };

  const handleGoalSelect = (goal: Goal) => {
    setData({ ...data, primary_goal: goal });
    setStep(4);
  };

  const handleToneSelect = (tone: Tone) => {
    const timeToComplete = Math.floor((Date.now() - startTime) / 1000);
    onComplete({
      ...data,
      ai_tone: tone,
      time_to_complete: timeToComplete,
    });
  };

  const handleSkipTone = () => {
    const timeToComplete = Math.floor((Date.now() - startTime) / 1000);
    onComplete({
      ...data,
      ai_tone: 'professional', // Default
      time_to_complete: timeToComplete,
      questions_skipped: [4],
    });
  };

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 text-white shadow-2xl ring-1 ring-violet-500/20 overflow-hidden">
      {/* Progress bar */}
      <div className="h-1 bg-neutral-800">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <div className="p-8">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Welcome! Configure your AI in 30 seconds.
              </h2>
              <p className="text-neutral-400">
                Quick setup to personalize Huntaze to your needs
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="primary" 
                onClick={() => setStep(2)}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 font-medium transition-all"
              >
                Continue
              </Button>
              <Button variant="primary" onClick={onSkip}>
                Skip for now
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Platform */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Which platform do you create for?
              </h2>
              <p className="text-sm text-neutral-400">Required</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'onlyfans', label: 'OnlyFans', icon: '🔥' },
                { id: 'instagram', label: 'Instagram', icon: '📸' },
                { id: 'tiktok', label: 'TikTok', icon: '🎵' },
                { id: 'reddit', label: 'Reddit', icon: '🤖' },
                { id: 'other', label: 'Other', icon: '✨' },
              ].map((platform) => (
                <Button 
                  key={platform.id}
                  variant="primary" 
                  onClick={() => handlePlatformSelect(platform.id as Platform)}
                  className="p-4 rounded-xl border border-neutral-700 hover:border-violet-500 hover:bg-neutral-800/50 transition-all text-left"
                >
                  <div className="text-2xl mb-2">{platform.icon}</div>
                  <div className="font-medium">{platform.label}</div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Goal */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                What is your primary goal?
              </h2>
              <p className="text-sm text-neutral-400">Required</p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'grow',
                  label: 'Grow my audience',
                  desc: 'Analytics, recommendations, follower tracking',
                },
                {
                  id: 'automate',
                  label: 'Automate my messages',
                  desc: 'Auto-DM, templates, scheduling',
                },
                {
                  id: 'content',
                  label: 'Generate content ideas',
                  desc: 'AI content generator, trend scanner',
                },
                {
                  id: 'all',
                  label: 'All of the above',
                  desc: 'Full feature access',
                },
              ].map((goal) => (
                <Button 
                  key={goal.id}
                  variant="primary" 
                  onClick={() => handleGoalSelect(goal.id as Goal)}
                  className="w-full p-4 rounded-xl border border-neutral-700 hover:border-violet-500 hover:bg-neutral-800/50 transition-all text-left"
                >
                  <div className="font-medium mb-1">{goal.label}</div>
                  <div className="text-sm text-neutral-400">{goal.desc}</div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Tone (Optional) */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                What tone should the AI use?
              </h2>
              <p className="text-sm text-neutral-400">Optional</p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'playful',
                  label: 'Playful',
                  desc: 'Casual, light, suggestive (3-5 emojis)',
                },
                {
                  id: 'professional',
                  label: 'Professional',
                  desc: 'Formal, clear, data-driven (no emojis)',
                },
                {
                  id: 'casual',
                  label: 'Casual',
                  desc: 'Friendly, conversational (light emoji)',
                },
                {
                  id: 'seductive',
                  label: 'Seductive',
                  desc: 'Flirty, emotionally engaging',
                },
              ].map((tone) => (
                <Button 
                  key={tone.id}
                  variant="primary" 
                  onClick={() => handleToneSelect(tone.id as Tone)}
                  className="w-full p-4 rounded-xl border border-neutral-700 hover:border-violet-500 hover:bg-neutral-800/50 transition-all text-left"
                >
                  <div className="font-medium mb-1">{tone.label}</div>
                  <div className="text-sm text-neutral-400">{tone.desc}</div>
                </Button>
              ))}
            </div>

            <Button variant="primary" onClick={handleSkipTone}>
              Skip (defaults to Professional)
            </Button>
          </div>
        )}

        {/* Step indicator */}
        <div className="mt-6 flex justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 w-2 rounded-full transition-all ${
                s === step
                  ? 'bg-violet-500 w-6'
                  : s < step
                  ? 'bg-violet-500/50'
                  : 'bg-neutral-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
