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

export default function HomePage() {
  return (
    <>
      <HeroLinear />
      <SocialProofBar />
      <MetricsShowcase />
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