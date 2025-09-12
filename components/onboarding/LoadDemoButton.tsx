"use client";

import { DEMO_LUXURY } from "@/src/lib/onboarding/demoSeeds";
import { useOnboarding } from "@/src/hooks/useOnboarding";

export default function LoadDemoButton() {
  const {
    setNiches,
    setGoals,
    updatePersona,
    updateBoundaries,
    updateMonetization,
    updateOps,
    updateSegmentation,
    updateDataConsent,
    updateFunnels,
  } = useOnboarding();

  const load = () => {
    const d = DEMO_LUXURY as any;
    // Basic fields
    setNiches(d.niches);
    setGoals(d.goals);

    // Persona normalization
    const emojiMap: Record<string, 'low'|'med'|'high'> = { Low: 'low', Medium: 'med', High: 'high' };
    const punctMap: Record<string, 'sober'|'energetic'> = { Calm: 'sober', Expressive: 'energetic' };
    const complexityMap: Record<string, 'simple'|'rich'> = { Simple: 'simple', Rich: 'rich' };
    updatePersona({
      stageName: d.persona.stageName,
      shortBio: d.persona.shortBio,
      toneSliders: d.persona.toneSliders,
      emojiUsage: emojiMap[d.persona.emojiUsage] || 'med',
      punctuationStyle: punctMap[d.persona.punctuationStyle] || 'energetic',
      complexity: complexityMap[d.persona.complexity] || 'rich',
      signaturePhrases: d.persona.signaturePhrases,
      forbiddenPhrases: d.persona.forbiddenPhrases,
    });

    updateBoundaries(d.boundaries);

    // Monetization normalization
    const bundles = (d.monetization.bundles || []).map((b: any) => ({ months: b.months, discountPct: b.discount }));
    updateMonetization({
      subPrice: d.monetization.subPrice,
      trialEnabled: d.monetization.trialEnabled,
      trialDays: d.monetization.trialDays,
      ppvRange: { min: d.monetization.ppvRange.min, typical: d.monetization.ppvRange.typ, max: d.monetization.ppvRange.max },
      bundles,
      discountCapPct: d.monetization.discountCapPercent,
      upsellMenu: d.monetization.upsellMenu,
      customContentEnabled: d.monetization.customContentEnabled,
    });

    // Ops normalization
    const reengage = d.ops.reengageWindows ? ['48h', '72h', '7d'] : undefined;
    updateOps({
      timezone: d.ops.timezone,
      activeHours: d.ops.activeHours,
      responseSLA: d.ops.responseSLA,
      automationLevel: d.ops.automationLevelPercent,
      reviewThresholds: d.ops.reviewThresholds,
      dailyCaps: d.ops.dailyCaps,
      reengageWindows: reengage,
    });

    updateSegmentation(d.segmentation);
    updateDataConsent(d.dataConsent);
    updateFunnels(d.funnels);
  };

  return (
    <button className="btn btn-outline w-full" onClick={load} type="button">
      Load demo persona (Luxury)
    </button>
  );
}

