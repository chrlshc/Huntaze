"use client";

import { LayoutPro } from "@/components/layout/LayoutPro";
import { HeroPro } from "@/components/sections/HeroPro";
import { FeaturesPro } from "@/components/sections/FeaturesPro";
import { PricingPro } from "@/components/sections/PricingPro";
import { FAQPro } from "@/components/sections/FAQPro";
import { CTAPro } from "@/components/sections/CTAPro";

export default function HomePagePro() {
  return (
    <LayoutPro>
      <HeroPro />
      <FeaturesPro />
      <PricingPro />
      <FAQPro />
      <CTAPro />
    </LayoutPro>
  );
}