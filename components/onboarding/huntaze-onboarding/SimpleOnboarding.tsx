'use client';

/**
 * SimpleOnboarding Component
 * 
 * Clean Shopify-style onboarding with questions and options.
 * Each question is a separate card with checkboxes.
 * 
 * NOTE: For the new 4-step wizard, use SetupWizard.tsx instead.
 * This component is kept for backward compatibility.
 */

import * as React from 'react';
import { Button } from "@/components/ui/button";

interface Option {
  id: string;
  title: string;
  description: string;
}

interface Question {
  id: string;
  question: string;
  subtitle: string;
  options: Option[];
}

const QUESTIONS: Question[] = [
  {
    id: 'huntaze_setup',
    question: 'What should we set up first?',
    subtitle: "We'll tailor Huntaze to your growth workflow",
    options: [
      { id: 'platforms', title: 'Connect platforms', description: 'Instagram, TikTok, Reddit, X and more' },
      { id: 'ai', title: 'AI assistant', description: 'Tone, reply rules and safety rails' },
      { id: 'autopilot', title: 'Growth autopilot', description: 'Campaigns, sequences and smart triggers' },
      { id: 'crm', title: 'Audience import', description: 'Contacts, labels and segments' },
      { id: 'branding', title: 'Branding & profile', description: 'Logo, colors and bio' },
      { id: 'analytics', title: 'Insights', description: 'Enable tracking and dashboards' },
    ],
  },
];

interface SimpleOnboardingProps {
  onComplete: (answers: Record<string, string[]>) => void;
  onSkip: () => void;
}

export default function SimpleOnboarding({ onComplete, onSkip }: SimpleOnboardingProps) {
  const [currentQuestion, setCurrentQuestion] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, Set<string>>>({});

  const question = QUESTIONS[currentQuestion];
  const selected = answers[question.id] || new Set();

  function toggle(optionId: string) {
    setAnswers((prev) => {
      const next = { ...prev };
      const current = new Set(prev[question.id] || []);
      
      if (current.has(optionId)) {
        current.delete(optionId);
      } else {
        current.add(optionId);
      }
      
      next[question.id] = current;
      return next;
    });
  }

  function handleNext() {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Convert Sets to arrays for final submission
      const finalAnswers: Record<string, string[]> = {};
      Object.entries(answers).forEach(([key, value]) => {
        finalAnswers[key] = Array.from(value);
      });
      onComplete(finalAnswers);
    }
  }

  return (
    <div className="relative">
      {/* Layered cards behind for Shopify effect - now with dark theme */}
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
        aria-labelledby="onb-title" 
        aria-describedby="onb-sub" 
        className="relative rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 text-white shadow-2xl ring-1 ring-violet-500/20 p-5 sm:p-6 md:p-8"
      >
        <header className="mb-5 md:mb-6">
          <h1 id="onb-title" className="text-xl md:text-2xl font-semibold text-white">
            {question.question}
          </h1>
          <p id="onb-sub" className="mt-1 text-sm text-neutral-400">
            {question.subtitle}
          </p>
        </header>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 select-none">
          {question.options.map((opt) => {
            const isActive = selected.has(opt.id);
            return (
              <li key={opt.id} className="relative">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isActive}
                  onClick={() => toggle(opt.id)}
                  onKeyDown={(e) => {
                    if (e.key === ' ') {
                      e.preventDefault();
                      toggle(opt.id);
                    }
                  }}
                  className={[
                    'w-full text-left rounded-xl border p-4 md:p-5 transition-all',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400',
                    isActive
                      ? 'border-violet-500/60 bg-violet-500/10 shadow-lg shadow-violet-500/20'
                      : 'border-neutral-700 hover:border-violet-500/40 bg-neutral-800/50',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-white">{opt.title}</p>
                      <p className="text-sm text-neutral-400">{opt.description}</p>
                    </div>
                    <span
                      aria-hidden
                      className={[
                        'inline-flex h-6 w-6 items-center justify-center rounded-md border transition-all',
                        isActive
                          ? 'border-violet-500 bg-violet-500 text-white shadow-lg shadow-violet-500/50'
                          : 'border-neutral-600 bg-neutral-800',
                      ].join(' ')}
                    >
                      {isActive ? (
                        <svg
                          viewBox="0 0 20 20"
                          fill="none"
                          className="h-4 w-4"
                          aria-hidden
                        >
                          <path
                            d="M5 10.5l3 3 7-7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <span className="h-2 w-2 rounded-sm bg-transparent" />
                      )}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        <footer className="mt-5 md:mt-6 flex items-center justify-between">
          <Button variant="primary" onClick={onSkip}>
  Skip customized setup →
</Button>
          <Button variant="primary" onClick={handleNext}>
  Next
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
              <path
                d="M7 4l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
</Button>
        </footer>
      </section>
    </div>
  );
}
