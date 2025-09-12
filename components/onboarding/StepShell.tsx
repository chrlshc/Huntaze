"use client";

import { ONBOARDING_COPY as C } from "@/src/lib/onboarding/copy";

type Props = {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onSkip?: () => void;
  onContinue?: () => void;
  continueDisabled?: boolean;
  rightRail?: React.ReactNode; // desktop preview/tips
};

export default function StepShell({
  step,
  total,
  title,
  subtitle,
  children,
  onBack,
  onSkip,
  onContinue,
  continueDisabled,
  rightRail,
}: Props) {
  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header / stepper */}
      <header className="px-4 py-3 border-b">
        <div className="text-xs text-muted-foreground">{C.common.stepOf(step, total)}</div>
        <h1 className="mt-1 text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </header>

      {/* Content + right rail on desktop */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
          <section className="lg:col-span-7">{children}</section>
          {rightRail && <aside className="hidden lg:block lg:col-span-5">{rightRail}</aside>}
        </div>
      </main>

      {/* Sticky footer actions (mobile & desktop) */}
      <footer className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-6xl p-3 flex items-center gap-2">
          <button className="btn btn-ghost" onClick={onBack} type="button">
            {C.common.back}
          </button>
          <button className="btn" onClick={onSkip} type="button">
            {C.common.skip}
          </button>
          <div className="ml-auto" />
          <button
            className="btn btn-primary"
            onClick={onContinue}
            disabled={continueDisabled}
            type="button"
          >
            {C.common.continue}
          </button>
        </div>
      </footer>
    </div>
  );
}

