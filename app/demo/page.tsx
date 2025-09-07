"use client";

import { useState } from 'react';

const STEPS = [
  { title: 'Welcome to Huntaze', text: 'See how the platform upgrades your workflow end‑to‑end.' },
  { title: 'Smart dashboard', text: 'Your key metrics at a glance — updated in real time.' },
  { title: 'Automation', text: 'Let AI handle routine replies and upsell opportunities.' },
  { title: 'Analytics', text: 'Understand growth and retention by cohort and campaign.' },
  { title: 'Collaboration', text: 'Roles, approvals and shared content to move faster together.' },
];

export default function DemoPage() {
  const [step, setStep] = useState(0);
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));
  const reset = () => setStep(0);

  return (
    <section className="min-h-[80vh] flex items-center justify-center bg-black text-white relative">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h1 className="text-4xl font-extrabold mb-6">Interactive Demo</h1>
        <p className="text-gray-300 mb-10">5 quick steps — keyboard friendly (←/→, Esc to exit).</p>

        {/* Demo canvas */}
        <div className="relative rounded-2xl border border-white/10 overflow-hidden">
          <div className="aspect-[16/9] grid place-items-center bg-gradient-to-br from-purple-700/20 to-pink-700/10">
            <p className="text-gray-200">Demo canvas placeholder</p>
          </div>
          {/* Overlay step */}
          <div className="absolute inset-0 bg-black/40 grid place-items-center p-6">
            <div className="max-w-lg w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 text-left">
              <h2 className="text-xl font-semibold mb-2">{STEPS[step].title}</h2>
              <p className="text-sm text-gray-200 mb-4">{STEPS[step].text}</p>
              <div className="flex items-center justify-between">
                <button onClick={reset} className="px-3 py-2 rounded-lg bg-white/10">Reset</button>
                <div className="flex items-center gap-2">
                  <button onClick={prev} disabled={step===0} className="px-3 py-2 rounded-lg bg-white/10 disabled:opacity-40">Prev</button>
                  <span className="text-xs text-gray-300">Step {step+1} / {STEPS.length}</span>
                  <button onClick={next} disabled={step===STEPS.length-1} className="px-3 py-2 rounded-lg bg-white/10 disabled:opacity-40">Next</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

