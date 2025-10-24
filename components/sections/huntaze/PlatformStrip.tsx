"use client";

import Image from "next/image";
import Section from "@/components/marketing/Section";

export default function PlatformStrip() {
  return (
    <Section className="mt-8" aria-label="Supported platforms">
      <div className="text-center text-sm text-white/60 mb-2">Works with</div>
      <ul className="flex justify-center items-center gap-10 opacity-80 hover:opacity-100 transition">
        <li>
          <Image src="/logos/onlyfans.svg" alt="OnlyFans" width={88} height={24} className="h-6 w-auto grayscale hover:grayscale-0 transition" sizes="(max-width: 640px) 56px, 88px" />
        </li>
        <li>
          <Image src="/logos/instagram.svg" alt="Instagram" width={88} height={24} className="h-6 w-auto grayscale hover:grayscale-0 transition" sizes="(max-width: 640px) 56px, 88px" />
        </li>
        <li>
          <Image src="/logos/tiktok.svg" alt="TikTok" width={88} height={24} className="h-6 w-auto grayscale hover:grayscale-0 transition" sizes="(max-width: 640px) 56px, 88px" />
        </li>
      </ul>
      <p className="mt-4 text-center text-xs text-white/40">Not affiliated with OnlyFans, Instagram or TikTok. Logos used for identification only.</p>
    </Section>
  );
}
