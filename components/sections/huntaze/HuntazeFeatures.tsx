"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Section from "@/components/marketing/Section";
import { MessageSquare, Bot, Megaphone, BarChart3, Calendar, Shield } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type FeatureKey = "inbox" | "ai" | "campaigns" | "analytics" | "scheduler" | "security";

type Feature = {
  key: FeatureKey;
  title: string;
  desc: string;
  bullets: string[];
  cta?: { label: string; href: string };
  color: string; // tailwind gradient tokens
  Icon: any;
};

const FEATURES: Feature[] = [
  {
    key: "inbox",
    title: "Unified Inbox",
    desc: "All your OnlyFans, Instagram, and TikTok DMs in one place. Reply faster. Never miss a sale.",
    bullets: [
      "Multi‑platform inbox with VIP tagging",
      "Templates and quick actions",
      "Team assignments and notes",
    ],
    cta: { label: "Voir l’inbox", href: "/of-messages" },
    color: "from-purple-500 to-pink-500",
    Icon: MessageSquare,
  },
  {
    key: "ai",
    title: "AI Assistant",
    desc: "Smart follow‑ups and upsells in your tone of voice.",
    bullets: [
      "Context‑aware replies and summaries",
      "Opportunity detection",
      "Optional human review",
    ],
    cta: { label: "Découvrir l’IA Huntaze", href: "/dashboard/huntaze-ai" },
    color: "from-amber-500 to-orange-500",
    Icon: Bot,
  },
  {
    key: "campaigns",
    title: "Campaigns (PPV)",
    desc: "Targeted mass campaigns and PPV, ready in minutes.",
    bullets: [
      "Segment fans and personalize",
      "Progress and failure tracking",
      "Win‑back flows",
    ],
    cta: { label: "Programmer une campagne", href: "/of-messages#campaigns" },
    color: "from-fuchsia-500 to-rose-500",
    Icon: Megaphone,
  },
  {
    key: "analytics",
    title: "Revenue Analytics",
    desc: "Revenue, LTV, cohorts — focus on what grows your income.",
    bullets: [
      "Revenue, LTV, cohorts",
      "Alerts for dips and anomalies",
      "Exports and reporting",
    ],
    cta: { label: "Voir mes statistiques", href: "/of-analytics" },
    color: "from-green-500 to-emerald-500",
    Icon: BarChart3,
  },
  {
    key: "scheduler",
    title: "Content Scheduler",
    desc: "Plan across OF/IG/TikTok with AI‑suggested best times.",
    bullets: [
      "Calendar view and queues",
      "AI suggestions and A/B ideas",
      "Cross‑platform publishing",
    ],
    cta: { label: "Planifier un post", href: "/features/content-scheduler" },
    color: "from-blue-500 to-cyan-500",
    Icon: Calendar,
  },
  {
    key: "security",
    title: "Security",
    desc: "Encryption, roles, audit trails. Your data and accounts are safe.",
    bullets: [
      "Encryption in transit/at rest",
      "Roles and permissions",
      "Audit trails and export",
    ],
    // optional CTA later
    color: "from-indigo-500 to-sky-500",
    Icon: Shield,
  },
];

export default function HuntazeFeatures() {
  const [active, setActive] = useState<FeatureKey>("inbox");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const prefersReduced = useReducedMotion();

  // Keep focused index in range of features
  useEffect(() => {
    const idx = Math.max(0, FEATURES.findIndex(f => f.key === active));
    setFocusedIndex(idx === -1 ? 0 : idx);
  }, []);

  const feature = useMemo(() => FEATURES.find(f => f.key === active)!, [active]);
  const { Icon } = feature;

  const focusTab = (i: number) => {
    const el = tabRefs.current[i];
    el?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const { key } = e;
    const last = FEATURES.length - 1;
    if (key === "ArrowRight" || key === "ArrowDown") {
      e.preventDefault();
      const next = i === last ? 0 : i + 1;
      setFocusedIndex(next);
      focusTab(next);
    } else if (key === "ArrowLeft" || key === "ArrowUp") {
      e.preventDefault();
      const prev = i === 0 ? last : i - 1;
      setFocusedIndex(prev);
      focusTab(prev);
    } else if (key === "Home") {
      e.preventDefault();
      setFocusedIndex(0);
      focusTab(0);
    } else if (key === "End") {
      e.preventDefault();
      setFocusedIndex(last);
      focusTab(last);
    } else if (key === "Enter" || key === " ") {
      e.preventDefault();
      setActive(FEATURES[i].key);
    }
  };

  return (
    <Section id="features" className="scroll-mt-28 md:scroll-mt-36">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Huntaze product pillars</h2>
          <p className="text-white/70 mt-3">From unified inbox to AI and PPV campaigns — all in one.</p>
        </div>

        {/* Tabs */}
        <div
          className="-mx-4 px-4 overflow-x-auto no-scrollbar flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-2 snap-x snap-mandatory md:justify-center md:mx-0 md:px-0"
          role="tablist"
          aria-label="Huntaze features"
        >
          {FEATURES.map((f, i) => (
            <button
              key={f.key}
              ref={(el) => (tabRefs.current[i] = el)}
              onClick={() => setActive(f.key)}
              className={`snap-start shrink-0 px-3 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                active === f.key
                  ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                  : "border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
              id={`feature-tab-${f.key}`}
              role="tab"
              aria-selected={active === f.key}
              aria-controls={`feature-panel-${f.key}`}
              tabIndex={i === focusedIndex ? 0 : -1}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {f.title}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="grid md:grid-cols-2 gap-10 items-center" role="tabpanel" id={`feature-panel-${feature.key}`} aria-labelledby={`feature-tab-${feature.key}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={feature.key + "-copy"}
              initial={prefersReduced ? false : { opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReduced ? { opacity: 1 } : { opacity: 0, x: 16 }}
              transition={{ duration: prefersReduced ? 0 : 0.2 }}
            >
              <div className="inline-flex items-center gap-3 mb-4">
                <span className={`p-2 rounded-lg bg-gradient-to-r ${feature.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </span>
                <h3 className="text-2xl font-semibold">{feature.title}</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6">{feature.desc}</p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                {feature.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-white/70" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              {feature.cta && (
                <div className="mt-6">
                  <Button href={feature.cta.href} variant="primary" size="lg" radius="lg">
                    {feature.cta.label}
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={feature.key + "-mock"}
              initial={prefersReduced ? false : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReduced ? { opacity: 1 } : { opacity: 0, x: -16 }}
              transition={{ duration: prefersReduced ? 0 : 0.2 }}
              className="relative"
            >
              {/* Shopify-style card preview */}
              <div className="relative max-w-2xl mx-auto">
                  <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                    {feature.key === "inbox" && (
                      <div className="space-y-3">
                        <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-purple-200" />
                            <div className="flex-1">
                              <div className="text-sm font-semibold">Sarah Johnson</div>
                              <div className="text-xs text-gray-500">Instagram • 2m ago</div>
                            </div>
                            <Badge variant="vip" tone="soft" aria-label="VIP subscriber">VIP</Badge>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-200">Hey! I’m interested in your premium set…</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-pink-200" />
                            <div className="flex-1">
                              <div className="text-sm font-semibold">Mike Chen</div>
                              <div className="text-xs text-gray-500">TikTok • 5m ago</div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-200">Just subscribed! Can’t wait to see more…</p>
                        </div>
                      </div>
                    )}
                    {feature.key === "ai" && (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold">AI Assistant</div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg p-3 text-sm">
                          Suggestion: Offer 20% off PPV to re‑engage VIP fan.
                        </div>
                        <div className="text-xs text-gray-500">Human review required before sending.</div>
                      </div>
                    )}
                    {feature.key === "campaigns" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold">PPV Campaign</div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">Draft</span>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-4">
                          <div className="text-sm opacity-90">Limited Offer</div>
                          <div className="text-xl font-bold">Unlock premium set — $9.99</div>
                        </div>
                        <div className="text-xs text-gray-500">Recipients: 1,250 • Est. open rate 42%</div>
                      </div>
                    )}
                    {feature.key === "analytics" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          {["Revenue", "Subs", "LTV"].map((k) => (
                            <div key={k} className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3">
                              <div className="text-xs text-gray-500">{k}</div>
                              <div className="text-lg font-bold">{k === "Revenue" ? "$24,847" : k === "Subs" ? "2,341" : "$142"}</div>
                            </div>
                          ))}
                        </div>
                        <div className="h-28 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded" />
                      </div>
                    )}
                    {feature.key === "scheduler" && (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold">Calendar</div>
                        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-gray-500">
                          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: 21 }).map((_, i) => (
                            <div key={i} className="aspect-square rounded bg-gray-50 dark:bg-zinc-800" />
                          ))}
                        </div>
                      </div>
                    )}
                    {feature.key === "security" && (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold">Security Overview</div>
                        <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3">
                          <div className="flex items-center justify-between text-sm">
                            <span>Encryption</span>
                            <span className="text-green-600 dark:text-green-400">Active</span>
                          </div>
                        </div>
                        <ul className="text-xs text-gray-500 list-disc pl-4">
                          <li>2FA + roles</li>
                          <li>Audit trail</li>
                        </ul>
                      </div>
                    )}
                  </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Section>
  );
}
