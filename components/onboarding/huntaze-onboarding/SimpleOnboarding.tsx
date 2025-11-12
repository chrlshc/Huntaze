'use client';

/**
 * SimpleOnboarding Component
 * 
 * Clean Shopify-style onboarding with questions and options.
 * Each question is a separate card with checkboxes.
 */

import * as React from 'react';

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
    id: 'selling_channels',
    question: 'Where would you like to sell?',
    subtitle: "We'll make sure you're set up to sell in these places",
    options: [
      { id: 'online_store', title: 'An online store', description: 'Create a fully customizable website' },
      { id: 'retail_store', title: 'In person at a retail store', description: 'Brick-and-mortar stores' },
      { id: 'events', title: 'In person at events', description: 'Markets, fairs, and pop-ups' },
      { id: 'existing_site', title: 'An existing website or blog', description: 'Add a Buy Button to your website' },
      { id: 'social', title: 'Social media', description: 'Reach customers on Facebook, Instagram, TikTok, and more' },
      { id: 'marketplaces', title: 'Online marketplaces', description: 'List products on Etsy, Amazon, and more' },
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
      {/* Layered cards behind for Shopify effect */}
      <div 
        aria-hidden 
        className="absolute inset-x-6 -top-6 h-[86%] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-[0_8px_40px_rgba(0,0,0,0.45)] -z-10" 
      />
      <div 
        aria-hidden 
        className="absolute inset-x-10 -top-3 h-[90%] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-[0_8px_40px_rgba(0,0,0,0.35)] -z-10" 
      />

      {/* Main card */}
      <section 
        role="dialog" 
        aria-labelledby="onb-title" 
        aria-describedby="onb-sub" 
        className="relative rounded-2xl bg-white text-neutral-900 shadow-2xl ring-1 ring-black/5 p-5 sm:p-6 md:p-8"
      >
        <header className="mb-5 md:mb-6">
          <h1 id="onb-title" className="text-xl md:text-2xl font-semibold">
            {question.question}
          </h1>
          <p id="onb-sub" className="mt-1 text-sm text-neutral-600">
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
                    'w-full text-left rounded-xl border p-4 md:p-5',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400',
                    isActive
                      ? 'border-violet-400/40 bg-violet-50'
                      : 'border-neutral-200 hover:border-neutral-300',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900">{opt.title}</p>
                      <p className="text-sm text-neutral-600">{opt.description}</p>
                    </div>
                    <span
                      aria-hidden
                      className={[
                        'inline-flex h-6 w-6 items-center justify-center rounded-md border',
                        isActive
                          ? 'border-violet-600 bg-violet-600 text-white'
                          : 'border-neutral-300 bg-white',
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
          <button
            onClick={onSkip}
            className="text-sm font-medium text-violet-600 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded-md px-1"
          >
            Skip customized setup →
          </button>
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-white shadow bg-violet-600 hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
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
          </button>
        </footer>
      </section>
    </div>
  );
}
