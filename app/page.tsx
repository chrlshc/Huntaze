"use client";

import { HeroPro } from "@/components/sections/HeroPro";
import { FeaturesPro } from "@/components/sections/FeaturesPro";
import { FAQPro } from "@/components/sections/FAQPro";
import { CTAPro } from "@/components/sections/CTAPro";

export default function HomePage() {
  return (
    <>
      <HeroPro />
      <FeaturesPro />
      <FAQPro />
      <CTAPro />
    </>
  );
}