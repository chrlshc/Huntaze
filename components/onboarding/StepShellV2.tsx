"use client";

import * as React from "react";
import { Check, ChevronLeft, ChevronRight, ShieldCheck, Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export type StepShellV2Props = {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  stepTitles?: string[];
  children: React.ReactNode;
  onBack?: () => void;
  onSkip?: () => void;
  onContinue?: () => void;
  continueDisabled?: boolean;
  rightRail?: React.ReactNode;
};

export function StepShellV2({
  step,
  total,
  title,
  subtitle,
  stepTitles,
  children,
  onBack,
  onSkip,
  onContinue,
  continueDisabled,
  rightRail,
}: StepShellV2Props) {
  const pct = Math.round((step / total) * 100);

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-background via-background to-background">
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b">
        <div className="mx-auto w-full max-w-screen-2xl px-4">
          <div className="flex items-center gap-3 py-3">
            <div className="text-xs text-muted-foreground">Step {step} of {total}</div>
            <div className="hidden md:flex items-center gap-2 flex-1">
              <Progress value={pct} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground w-14 text-right">{pct}%</span>
            </div>
          </div>
          <div className="pb-3">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            {stepTitles && (
              <div className="hidden lg:flex gap-2 mt-3 overflow-x-auto pb-2">
                {stepTitles.map((s, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
                      i + 1 < step && "bg-muted/60 text-foreground/80",
                      i + 1 === step && "bg-primary/10 border-primary/30 text-primary",
                      i + 1 > step && "text-muted-foreground"
                    )}
                  >
                    {i + 1 < step ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                    <span className="whitespace-nowrap">{i + 1}. {s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-screen-2xl grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
          <section className="lg:col-span-7 space-y-4">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-6">{children}</CardContent>
            </Card>
          </section>

          <aside className="hidden lg:flex lg:col-span-5">
            <div className="w-full space-y-4">{rightRail ?? <RightRailDefault />}</div>
          </aside>
        </div>
      </main>

      <footer className="sticky bottom-0 z-40 border-t backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto max-w-screen-2xl px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} type="button">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <Button variant="secondary" size="sm" onClick={onSkip} type="button">Skip for now</Button>
          <div className="ml-auto" />
          <Button size="sm" onClick={onContinue} disabled={continueDisabled} type="button">
            Continue <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}

function RightRailDefault() {
  return (
    <>
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> DM Preview</CardTitle>
          <CardDescription>How your AI would talk based on your settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <blockquote className="text-sm rounded-xl border p-3 bg-muted/40">
            Hey love 💕 I just posted something a little too spicy for IG. Want a peek? It’s yours for $22 😘
          </blockquote>
          <div className="text-xs text-muted-foreground">Typical PPV uses niche multipliers and your defaults.</div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Auto‑calibration</CardTitle>
          <CardDescription>Applied after connecting OnlyFans.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm grid gap-2">
          <Line icon={<Clock className="h-3.5 w-3.5" />} text="Send‑time heatmap (peak hours)" />
          <Line icon={<Check className="h-3.5 w-3.5" />} text="Volume up/down cadence & caps" />
          <Line icon={<Check className="h-3.5 w-3.5" />} text="VIP routing for high‑LTV clusters" />
          <Line icon={<Check className="h-3.5 w-3.5" />} text="IG/TT soft‑sell if risk detected" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Time zone</CardTitle>
          <CardDescription>Auto‑detected. You can change it anytime.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <div className="text-sm">America/New_York</div>
          <Button variant="outline" size="sm">Change</Button>
        </CardContent>
      </Card>
    </>
  );
}

function Line({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="shrink-0 text-foreground/70">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

