"use client";

import { m, useReducedMotion } from "framer-motion";
import { MessageSquare, Bot, DollarSign } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "1. Incoming DM",
    desc: "A fan messages you on OF/IG/TikTok — everything lands in your unified inbox.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Bot,
    title: "2. AI Suggestion",
    desc: "AI proposes a tailored reply and/or PPV offer based on fan history.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: DollarSign,
    title: "3. PPV Offer & Conversion",
    desc: "Send the offer in one click and track the conversion — instant revenue.",
    color: "from-green-500 to-emerald-500",
  },
];

export default function HuntazeFlow() {
  const prefersReduced = useReducedMotion();
  const cardProps = prefersReduced
    ? { initial: false as const, animate: { opacity: 1 }, transition: { duration: 0 } }
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: "easeOut" } };
  return (
    <section aria-label="How Huntaze works" className="py-20 bg-gray-50 dark:bg-zinc-950 reduce-motion-off">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">How it works</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-3">From inbox to conversion in 3 simple steps.</p>
        </div>

        <div className="md:grid md:grid-cols-3 md:gap-6 flex gap-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar px-4 -mx-4">
          {steps.map((s, i) => (
            <m.div
              key={s.title}
              {...cardProps}
              className="relative min-w-[80%] md:min-w-0 snap-center"
            >
              <div className={`bg-linear-to-r ${s.color} p-[2px] rounded-2xl`}>
                <div className="rounded-xl bg-white dark:bg-zinc-900 p-6 h-full">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white/20 text-white mb-3">
                    <s.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{s.desc}</p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute right-[-20px] top-1/2 -translate-y-1/2 text-gray-400">→</div>
              )}
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
