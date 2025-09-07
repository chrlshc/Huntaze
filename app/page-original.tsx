"use client";

import { HeroLinear } from "@/components/sections/HeroLinear";
import { SocialProofBar } from "@/components/sections/SocialProofBar";
import { MetricsShowcase } from "@/components/sections/MetricsShowcase";
import { ThreeStepProcess } from "@/components/sections/ThreeStepProcess";
import { PowerfulFeatures } from "@/components/sections/PowerfulFeatures";
import { PlatformIntegrations } from "@/components/sections/PlatformIntegrations";
import { SecurityTrust } from "@/components/sections/SecurityTrust";
import { EnterpriseCTA } from "@/components/sections/EnterpriseCTA";
import { FAQPro } from "@/components/sections/FAQPro";
import { CTAPro } from "@/components/sections/CTAPro";
import FeatureTabsEN from "@/components/sections/en/FeatureTabs";
import TestimonialsCarouselEN from "@/components/sections/en/TestimonialsCarousel";
import MetricsCountersEN from "@/components/sections/en/MetricsCounters";
import ThreeStepsEN from "@/components/sections/en/ThreeSteps";

export default function HomePage() {
  return (
    <>
      <HeroLinear />
      <SocialProofBar />
      {/* Animated, Shopify-style narrative blocks */}
      <MetricsCountersEN />
      <FeatureTabsEN />
      <TestimonialsCarouselEN />
      {/* Keep legacy sections for the 13-page clarity */}
      <MetricsShowcase />
      <ThreeStepsEN />
      <ThreeStepProcess />
      <PowerfulFeatures />
      <PlatformIntegrations />
      <SecurityTrust />
      <EnterpriseCTA />
      <FAQPro />
      <CTAPro />
    </>
  );
}
